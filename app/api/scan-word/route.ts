import { extractWord } from "@/lib/flash";
import { getSupabase } from "@/lib/supabase";
import { NextRequest } from "next/server";
import sharp from "sharp";

export const dynamic = "force-dynamic" //new

// 1. ADD THIS: Define the CORS headers once so we can reuse them
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Helper function to generate embeddings via OpenRouter
async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://myvocabweb.vercel.app",
        "X-Title": "MyVocabApp",
      },
      body: JSON.stringify({
        model: "qwen/qwen3-embedding-4b",
        input: text.trim(),
        dimensions: 768,
        provider: {
          "sort": "throughput", // This tells OpenRouter to pick the most stable path
          "allow_fallbacks": true
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ OpenRouter Error (${response.status}):`, errorText);
      throw new Error(`OpenRouter failed: ${response.status} - ${errorText}`);
    }

    const embeddingJson = await response.json();
    return embeddingJson?.data?.[0]?.embedding || null;
  } catch (err) {
    console.error("❌ Embedding generation failed:", err);
    throw err;
  }
}


// 2. ADD THIS: Handle the "Preflight" OPTIONS request
// Android/iOS fetch will send an OPTIONS request first. If this is missing, the POST fails.
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(req: NextRequest) {

  const supabase = getSupabase()
  const sendResponse = (data: any, status = 200) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  };

  try {
    // Log for debugging to see if the request actually hits Vercel
    console.log("📡 Incoming request from MyVocabApp...");

    let body: any;
    try {
      body = await req.json();
    } catch (parseError) {
      return sendResponse({ ok: false, error: "Invalid JSON body" }, 400);
    }

    if (!body || typeof body !== "object") {
      return sendResponse({ ok: false, error: "Invalid JSON body" }, 400);
    }

    if (!body.image && !body.imageUrl) {
      return sendResponse({ ok: false, error: "Missing image or imageUrl field" }, 400);
    }

    if (body.image && typeof body.image !== "string") {
      return sendResponse({ ok: false, error: "Invalid image field" }, 400);
    }

    if (body.imageUrl && typeof body.imageUrl !== "string") {
      return sendResponse({ ok: false, error: "Invalid imageUrl field" }, 400);
    }

    const mode =
      body.mode === "gaming"
        ? "gaming"
        : body.mode === "real_world"
        ? "real_world"
        : null;

    if (!mode) {
      return sendResponse({ ok: false, error: "Missing or invalid mode field" }, 400);
    }

    // Step 1: Detect object from image or public URL
    let detectedWord = "storm";
    let detectedDefinition = "blow hard";
    let detectedPOS = "Noun"; 
    let detectedPhonetic = "";

    if (body.imageUrl) {
      const flashResult = await extractWord(body.imageUrl, mode);
      detectedWord = (flashResult.word || detectedWord).toLowerCase().trim();
      detectedDefinition = flashResult.definition || detectedDefinition;
      detectedPOS = flashResult.part_of_speech || "Noun"; 
      detectedPhonetic = flashResult.phonetic || "";
    } else if (body.image) {
      const buffer = Buffer.from(body.image, "base64");
      const smallBuffer = await sharp(buffer)
        .resize({ width: 640 }) 
        .jpeg({ quality: 80 })  
        .toBuffer();
      const resizedImageBase64 = smallBuffer.toString("base64");

      const flashResult = await extractWord(resizedImageBase64, mode);
      detectedWord = (flashResult.word || detectedWord).toLowerCase().trim();
      detectedDefinition = flashResult.definition || detectedDefinition;
      detectedPOS = flashResult.part_of_speech || "Noun"; 
      detectedPhonetic = flashResult.phonetic || "";
    }
    
    // ==================== TIER 1: MASTER SEARCH ====================
    const { data: masterMatches, error: masterError } = await supabase
      .from("dictionary_entries")
      .select("*") 
      .eq("word", detectedWord)
      .eq("part_of_speech", detectedPOS);

    if (masterError) throw masterError;

    // TIER 1A: Exactly one match in master dictionary
    if (masterMatches?.length === 1) {
      console.log("✅ Tier 1A: Found exactly 1 match in master dictionary");
      return sendResponse({ 
        ok: true, 
        result: { ...masterMatches[0], phonetic: detectedPhonetic },
        source: "master"
      });
    }

    // TIER 1B: Multiple matches in master dictionary - need embedding to pick the best
    if (masterMatches && masterMatches.length > 1) {
      console.log(`⚖️ Tier 1B: Found ${masterMatches.length} matches in master dictionary, generating embedding...`);
      
      const queryVector = await generateEmbedding(detectedDefinition);
      if (!queryVector) {
        throw new Error("Failed to generate embedding");
      }

      const matchIds = masterMatches.map(m => m.id);
      const { data: bestMatch, error: vectorError } = await supabase.rpc('get_best_match', {
        query_embedding: queryVector,
        match_ids: matchIds
      });

      if (vectorError) throw vectorError;

      const result = Array.isArray(bestMatch) ? bestMatch[0] : bestMatch;
      console.log("✅ Tier 1B: Returned best match from master dictionary");
      return sendResponse({ 
        ok: true, 
        result: { ...result, phonetic: detectedPhonetic },
        source: "master"
      });
    }

    // ==================== TIER 2: COMMUNITY SEARCH ====================
    console.log("🔍 Tier 1 returned 0 results, proceeding to community search...");
    const { data: communityMatches, error: communityError } = await supabase
      .from("community_dictionary")
      .select("*")
      .eq("word", detectedWord)
      .eq("part_of_speech", detectedPOS);

    if (communityError) throw communityError;

    // TIER 2A: Exactly one match in community dictionary
    if (communityMatches?.length === 1) {
      console.log("✅ Tier 2A: Found exactly 1 match in community dictionary");
      return sendResponse({ 
        ok: true, 
        result: { ...communityMatches[0], phonetic: detectedPhonetic },
        source: "community"
      });
    }

    // TIER 2B: Multiple matches in community dictionary - need embedding to pick the best
    if (communityMatches && communityMatches.length > 1) {
      console.log(`⚖️ Tier 2B: Found ${communityMatches.length} matches in community dictionary, generating embedding...`);
      
      const queryVector = await generateEmbedding(detectedDefinition);
      if (!queryVector) {
        throw new Error("Failed to generate embedding");
      }

      const matchIds = communityMatches.map(m => m.id);
      const { data: bestMatch, error: vectorError } = await supabase.rpc('get_best_community_match', {
        query_embedding: queryVector,
        match_ids: matchIds
      });

      if (vectorError) throw vectorError;

      const result = Array.isArray(bestMatch) ? bestMatch[0] : bestMatch;
      console.log("✅ Tier 2B: Returned best match from community dictionary");
      return sendResponse({ 
        ok: true, 
        result: { ...result, phonetic: detectedPhonetic },
        source: "community"
      });
    }

    // ==================== TIER 3: FALLBACK (INSERT NEW ENTRY) ====================
    console.log("📝 Tier 2 returned 0 results, creating new entry in community dictionary...");
    
    const queryVector = await generateEmbedding(detectedDefinition);
    if (!queryVector) {
      throw new Error("Failed to generate embedding");
    }

    const { data: newEntry, error: insertError } = await supabase
      .from("community_dictionary")
      .insert({
        word: detectedWord,
        definition: detectedDefinition,
        part_of_speech: detectedPOS,
        embedding: queryVector 
      })
      .select()
      .single();

    if (insertError) console.error("❌ Community Save Error:", insertError);

    console.log("✅ Tier 3: Created new entry in community dictionary");
    return sendResponse({ 
      ok: true, 
      result: { ...(newEntry || { word: detectedWord, definition: detectedDefinition, part_of_speech: detectedPOS }), phonetic: detectedPhonetic },
      source: "community_created"
    });

  } catch (err) {
    console.error("POST ERROR:", err);
    return sendResponse({ ok: false, error: "Unexpected backend error" }, 500);
  }
}