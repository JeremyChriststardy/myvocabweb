import 'dotenv/config'
import { supabaseAdmin } from './supabase-admin.js'

const test = async () => {
  console.log("🚀 Script started")

  console.log("URL:", process.env.SUPABASE_URL ? "OK" : "MISSING")
  console.log("KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "OK" : "MISSING")

  const { data, error } = await supabaseAdmin
    .from('dictionary_entries')
    .select('*')
    .limit(1)

  console.log("RESULT:", data)
  console.log("ERROR:", error)
}

test()