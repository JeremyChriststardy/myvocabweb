import { NextRequest } from "next/server";
import { extractWord } from "@/lib/flash";
import { supabase } from "@/lib/supabase";
import sharp from "sharp"; 

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    
    // Step 1: Detect object from image
    let detectedWord = "storm";
    let detectedDefinition = "blow hard";
    let detectedPOS = "Noun"; // Default fallback
    let detectedPhonetic = "";

    if (body?.image) {
      const buffer = Buffer.from(body.image, "base64");
      const smallBuffer = await sharp(buffer)
        .resize({ width: 640 }) 
        .jpeg({ quality: 80 })  
        .toBuffer();
      const resizedImageBase64 = smallBuffer.toString("base64");

      // Ensure extractWord prompt asks for: word, definition, part_of_speech
      const flashResult = await extractWord(resizedImageBase64);
      
      detectedWord = (flashResult.word || detectedWord).toLowerCase().trim();
      detectedDefinition = flashResult.definition || detectedDefinition;
      detectedPOS = flashResult.part_of_speech || "Noun"; // MUST match your Enum ('Noun', 'Verb', etc.)
      detectedPhonetic = flashResult.phonetic || "";
    }
    
    // --- STEP 2: THE "MATCH CHECK" ---
    // We fetch the rows that match the Word and Part of Speech exactly.
    const { data: matches, error: matchError } = await supabase
      .from("dictionary_entries")
      .select("*") 
      .eq("word", detectedWord)
      .eq("part_of_speech", detectedPOS);

    if (matchError) throw matchError;

    // CASE A: UNIQUE MATCH (The "Fast Path")
    // If there's exactly one entry, we don't need AI to decide.
    if (matches?.length === 1) {
      return new Response(
        JSON.stringify({ ok: true, result: { ...matches[0], phonetic: detectedPhonetic } }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // --- STEPS 3 & 4: THE "VECTOR DECIDER" (Ambiguity or Fallback) ---
    // We only reach this point if there are 0 matches OR > 1 match.

    // 1. Always generate the embedding for the new definition
    const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-embedding-001",
        input: detectedDefinition.trim(),
        dimensions: 768
      })
    });

    const embeddingJson = await response.json();
    const queryVector = embeddingJson?.data?.[0]?.embedding;

    // CASE B: ZERO MATCHES (The "Community Contribution")
    if (!matches || matches.length === 0) {
      console.log(`✨ New word detected: ${detectedWord}. Adding to Community Dictionary.`);

      const { data: newEntry, error: insertError } = await supabase
        .from("community_dictionary")
        .insert({
          word: detectedWord,
          definition: detectedDefinition,
          part_of_speech: detectedPOS,
          embedding: queryVector // Save it so it's searchable later!
        })
        .select()
        .single();

      if (insertError) console.error("❌ Community Save Error:", insertError);

      return new Response(
        JSON.stringify({ 
          ok: true, 
          result: { ...(newEntry || { word: detectedWord, definition: detectedDefinition, part_of_speech: detectedPOS }), phonetic: detectedPhonetic },
          source: "community" 
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

      if (!queryVector) {
    throw new Error("Failed to generate embedding - check API credits or model status");
    }
    // CASE C: MULTIPLE MATCHES (The "Tie-Breaker")
    // USE THIS NEW BLOCK
    const matchIds = matches.map(m => m.id);

    const { data: bestMatch, error: vectorError } = await supabase.rpc('get_best_match', {
      query_embedding: queryVector,
      match_ids: matchIds
    });

    if (vectorError) throw vectorError;

    // RPC returns an array, so we take the first item
    const result = Array.isArray(bestMatch) ? bestMatch[0] : bestMatch;

    return new Response(
      JSON.stringify({ 
        ok: true, 
        result: { ...result, phonetic: detectedPhonetic },
        source: "master"
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } 
  catch (err) {
    console.error("POST ERROR:", err);
    return new Response(
      JSON.stringify({ ok: false, error: "Unexpected backend error" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
}