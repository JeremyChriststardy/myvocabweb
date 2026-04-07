import dotenv from 'dotenv'
dotenv.config({ path: './.env.local' }) 

import { supabaseAdmin } from './supabase-admin.js'

const BATCH_SIZE = 100 
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY

async function runPosTagger() {
  console.log("🚀 Starting Massive POS Ingestion (200k Target)...")

  // 1. Initial Progress Check
  const { count: total, error: tErr } = await supabaseAdmin.from('dictionary_entries').select('*', { count: 'exact', head: true });
  const { count: remaining, error: rErr } = await supabaseAdmin.from('dictionary_entries').select('*', { count: 'exact', head: true }).is('part_of_speech', null);

  if (tErr || rErr) {
    console.error("❌ Connection Error:", tErr?.message || rErr?.message);
    return;
  }

  console.log(`📊 Stats: ${total - remaining} / ${total} completed (${remaining} left).`);

  while (true) {
    try {
      // 2. Fetch NULL rows
      const { data: rows, error: fetchError } = await supabaseAdmin
        .from('dictionary_entries')
        .select('id, word, definition')
        .is('part_of_speech', null)
        .limit(BATCH_SIZE);

      if (fetchError) throw fetchError;
      if (!rows || rows.length === 0) break;

      console.log(`\n📦 Batch: Processing ${rows.length} words starting with "${rows[0].word}"...`);

      // 3. AI Request
      const wordList = rows.map(r => `ID:${r.id}|W:${r.word}|D:${r.definition}`).join('\n');
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-001",
          messages: [{ role: "user", content: `Return JSON array [{id, part_of_speech}] using categories: [Noun, Verb, Adjective, Adverb, Preposition, Conjunction]. Use definitions for context.\n\n${wordList}` }],
          response_format: { type: "json_object" } 
        })
      });

      // Handle Rate Limits (429)
      if (response.status === 429) {
        console.warn("⏳ Rate limited! Sleeping 30s...");
        await new Promise(r => setTimeout(r, 30000));
        continue;
      }

      const result = await response.json();
      const content = JSON.parse(result.choices[0].message.content);
      const tags = Array.isArray(content) ? content : (content.tags || Object.values(content)[0]);

      // 4. Batch Update (Using Promise.all for speed)
      console.log(`🧩 AI finished. Updating ${tags.length} rows...`);
      
      const updates = tags.map(tag => 
        supabaseAdmin.from('dictionary_entries').update({ part_of_speech: tag.part_of_speech }).eq('id', tag.id)
      );

      const updateResults = await Promise.all(updates);
      const failed = updateResults.filter(r => r.error).length;

      if (failed > 0) console.error(`⚠️ ${failed} updates failed in this batch.`);
      else console.log(`✅ Batch complete.`);

      // Small breather
      await new Promise(r => setTimeout(r, 500));

    } catch (err) {
      console.error("💥 Error encountered:", err.message);
      console.log("😴 Resting 5s before retry...");
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  console.log("🎉 SUCCESS: All 200,000 rows processed!");
}

runPosTagger();