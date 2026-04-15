import { NextRequest } from "next/server";
import { extractWord } from "@/lib/flash";
import { supabase } from "@/lib/supabase";
import sharp from "sharp";

// 1. ADD THIS: Define the CORS headers once so we can reuse them
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// 2. ADD THIS: Handle the "Preflight" OPTIONS request
// Android/iOS fetch will send an OPTIONS request first. If this is missing, the POST fails.
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(req: NextRequest) {
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

    if (!body.image || typeof body.image !== "string") {
      return sendResponse({ ok: false, error: "Missing or invalid image field" }, 400);
    }

    // Step 1: Detect object from image
    let detectedWord = "storm";
    let detectedDefinition = "blow hard";
    let detectedPOS = "Noun"; 
    let detectedPhonetic = "";

    if (body.image) {
      const buffer = Buffer.from(body.image, "base64");
      const smallBuffer = await sharp(buffer)
        .resize({ width: 640 }) 
        .jpeg({ quality: 80 })  
        .toBuffer();
      const resizedImageBase64 = smallBuffer.toString("base64");

      const flashResult = await extractWord(resizedImageBase64);
      
      detectedWord = (flashResult.word || detectedWord).toLowerCase().trim();
      detectedDefinition = flashResult.definition || detectedDefinition;
      detectedPOS = flashResult.part_of_speech || "Noun"; 
      detectedPhonetic = flashResult.phonetic || "";
    }
    
    // --- STEP 2: THE "MATCH CHECK" ---
    const { data: matches, error: matchError } = await supabase
      .from("dictionary_entries")
      .select("*") 
      .eq("word", detectedWord)
      .eq("part_of_speech", detectedPOS);

    if (matchError) throw matchError;

    // CASE A: UNIQUE MATCH
    if (matches?.length === 1) {
      return sendResponse({ ok: true, result: { ...matches[0], phonetic: detectedPhonetic } });
    }

    // --- STEPS 3 & 4: THE "VECTOR DECIDER" ---
    const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://myvocabweb.vercel.app",
        "X-Title": "MyVocabApp",
      },
      body: JSON.stringify({
        model: "google/gemini-embedding-001",
        input: detectedDefinition.trim(),
        dimensions: 768,
        provider: {
        "sort": "throughput", // This tells OpenRouter to pick the most stable path
        "allow_fallbacks": true
        }
      })
    });

    // DEBUG: Let's see exactly what OpenRouter says
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ OpenRouter Error (${response.status}):`, errorText);
      throw new Error(`OpenRouter failed: ${response.status} - ${errorText}`);
    }

    const embeddingJson = await response.json();
    const queryVector = embeddingJson?.data?.[0]?.embedding;

    // CASE B: ZERO MATCHES
    if (!matches || matches.length === 0) {
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

      return sendResponse({ 
        ok: true, 
        result: { ...(newEntry || { word: detectedWord, definition: detectedDefinition, part_of_speech: detectedPOS }), phonetic: detectedPhonetic },
        source: "community" 
      });
    }

    if (!queryVector) {
      throw new Error("Failed to generate embedding");
    }

    // CASE C: MULTIPLE MATCHES
    const matchIds = matches.map(m => m.id);
    const { data: bestMatch, error: vectorError } = await supabase.rpc('get_best_match', {
      query_embedding: queryVector,
      match_ids: matchIds
    });

    if (vectorError) throw vectorError;

    const result = Array.isArray(bestMatch) ? bestMatch[0] : bestMatch;

    return sendResponse({ 
      ok: true, 
      result: { ...result, phonetic: detectedPhonetic },
      source: "master"
    });

  } catch (err) {
    console.error("POST ERROR:", err);
    return sendResponse({ ok: false, error: "Unexpected backend error" }, 500);
  }
}