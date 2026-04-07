export async function extractWord(base64Image: string) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY missing");
  }

  const geminiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://superexcrescently-unsympathizing-jolyn.ngrok-free.dev", 
      "X-Title": "Vocabulary App",
    },
    body: JSON.stringify({
      // Using the latest stable Flash model
      model: "xiaomi/mimo-v2-omni", 
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Identify the main object or action in this image. 
              Return a JSON object with these exact keys:
              - "word": The name of the object or action.
              - "definition": A concise dictionary definition.
              - "part_of_speech": Must be exactly one of: 'Noun', 'Verb', 'Adjective', 'Adverb', 'Preposition', 'Conjunction'.
              - "phonetic": The IPA phonetic pronunciation.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" }
    }),
  });

  if (!geminiResponse.ok) {
    const errText = await geminiResponse.text();
    console.error("OpenRouter API error:", errText);
    throw new Error(`Request failed: ${geminiResponse.status}`);
  }

  const data = await geminiResponse.json();
  
  try {
    const content = JSON.parse(data.choices[0].message.content);
    
    // Normalize the POS to match your SQL Enum capitalization
    const rawPos = content.part_of_speech || "Noun";
    const normalizedPos = rawPos.charAt(0).toUpperCase() + rawPos.slice(1).toLowerCase();

    return {
      word: content.word?.toLowerCase().trim() || null,
      definition: content.definition || null,
      part_of_speech: normalizedPos,
      phonetic: content.phonetic || null,
    };
  } catch (e) {
    console.error("Failed to parse AI JSON response", e);
    return { word: null, definition: null, part_of_speech: "Noun", phonetic: null };
  }
}