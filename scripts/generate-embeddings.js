import dotenv from 'dotenv'
dotenv.config({ path: '../.env.local' }) // Check if this should be './' or '../'

import { supabaseAdmin } from './supabase-admin.js'

const BATCH_SIZE = 100

async function runOnce() {
  console.log("🚀 Starting Definition-Only Embedding Job...")

  while (true) {
    console.log(`\n🔍 Fetching next ${BATCH_SIZE} rows...`)

    const { data, error } = await supabaseAdmin
      .from('dictionary_entries')
      .select('id, word, definition')
      .is('embedding', null)
      .limit(BATCH_SIZE)

    if (error) {
      console.error("❌ Supabase fetch error:", error)
      throw error
    }

    if (!data || data.length === 0) {
      console.log("⚠️ No more rows to process.")
      break
    }

    console.log(`📦 Rows fetched: ${data.length} [${data[0].word} ... ${data[data.length-1].word}]`)

    // Mapping inputs PURELY to definition
    const inputs = data.map(row => row.definition.trim())

    try {
      console.log("📡 Calling OpenRouter for 768-dim embeddings...")

      const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "qwen/qwen3-embedding-4b",
          input: inputs,
          dimensions: 768, // Matches your halfvec(768)
          encoding_format: "float"
        })
      })

      const result = await response.json()

      if (response.status !== 200 || !result.data) {
        console.error("❌ API Error:", result)
        throw new Error("Embedding API failed")
      }

      console.log(`🧩 Received ${result.data.length} vectors. Updating database...`)

      // --- HERO MOVE: PARALLEL UPDATES ---
      // This runs all 100 updates at the same time instead of waiting for each one.
      const updatePromises = data.map((row, i) => {
        const embedding = result.data[i]?.embedding
        if (!embedding) return Promise.resolve() // Skip if missing

        return supabaseAdmin
          .from('dictionary_entries')
          .update({ embedding }) // PostgreSQL automatically casts to halfvec
          .eq('id', row.id)
      })

      const updateResults = await Promise.all(updatePromises)
      
      // Quick check if any updates in the batch failed
      const errors = updateResults.filter(res => res.error)
      if (errors.length > 0) {
        console.error(`⚠️ ${errors.length} updates failed in this batch.`)
      } else {
        console.log(`✅ Batch successful.`)
      }

      await new Promise(r => setTimeout(r, 500))

    } catch (err) {
      console.error("❌ Batch error:", err.message)
      throw err // Let startWorker handle the restart
    }
  }

  console.log("🎉 One full pass completed!")
}

async function startWorker() {
  while (true) {
    try {
      await runOnce()
      console.log("😴 All currently untagged rows done. Sleeping 10s...")
      await new Promise(r => setTimeout(r, 10000))
    } catch (err) {
      console.error("💥 Worker crashed, restarting in 5s...", err.message)
      await new Promise(r => setTimeout(r, 5000))
    }
  }
}

startWorker()