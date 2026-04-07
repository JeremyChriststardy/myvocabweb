import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { 
      word, 
      part_of_speech, 
      definition, 
      genre, 
      vibe, 
      complexity, 
      length 
    } = await req.json();

    // 1. Map the length toggle to specific sentence counts
    const lengthConstraint = 
      length === "short" ? "exactly 3 sentences" : 
      length === "medium" ? "5 to 7 sentences" : 
      "a long, immersive narrative (10+ sentences)";

    // 2. Construct the Granular Prompt using the Numeric Scale Method
    const prompt = `
      TASK: Write a creative story for an English learner.
      TARGET WORD: "${word}" (${part_of_speech})
      CONTEXT/DEFINITION: ${definition}

      STYLE SPECIFICATIONS (0-100 SCALE):
      - GENRE: ${genre}
      - VIBE: On a scale of 0 (Whimsical/Light) to 100 (Dark/Gothic), this story must be a ${vibe}.
      - COMPLEXITY: On a scale of 0 (Simple/Children's Book) to 100 (Dense/Academic Journal), the language complexity must be a ${complexity}.
      - LENGTH: ${lengthConstraint}.

      STORY RULES:
      1. Integrate the word "${word}" naturally and in the correct grammatical sense.
      2. The tone and vocabulary choice MUST mathematically reflect the 0-100 scales provided above.
      3. Return ONLY the story text. No titles, no introductions, and no quotes.
    `.trim();

    // 3. API Call to OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "xiaomi/mimo-v2-pro",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.85, // Elevated to allow the AI to "lean" into the scales
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "OpenRouter API failed");
    }

    const data = await response.json();
    const story = data.choices[0]?.message?.content?.trim() || "The AI encountered a writer's block. Please try again.";

    return NextResponse.json({ story });

  } catch (error) {
    console.error("AI Story Generation Error:", error);
    return NextResponse.json(
      { error: "Failed to generate your adventure." }, 
      { status: 500 }
    );
  }
}