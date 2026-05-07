// app/api/story-quiz/route.ts

import { NextResponse } from "next/server"

type VocabularyWord = {
  word: string
  definition: string
  part_of_speech?: string
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const words: VocabularyWord[] = body.words || []

    if (!words.length) {
      return NextResponse.json(
        {
          error: "No vocabulary words provided",
        },
        {
          status: 400,
        }
      )
    }

    /*
    =========================================
    CLEAN WORDS
    =========================================
    */

    const cleanedWords = words.map((w) => ({
      word: w.word,
      definition: w.definition,
      part_of_speech: w.part_of_speech || "noun",
    }))

    /*
    =========================================
    CALL 1 — STORY GENERATION
    =========================================
    */

    const storyPrompt = `
TASK:
Write an immersive educational story for English learners.

OBJECTIVE:
Naturally integrate ALL vocabulary words into the story.

STORY RULES:
1. Every vocabulary word MUST appear naturally.
2. Bold each vocabulary word using **word**
3. Story must feel emotionally engaging.
4. Make the story coherent and immersive.
5. Do NOT explain vocabulary separately.
6. Intermediate English difficulty.
7. Length: 700-1000 words.
8. Return ONLY the story.

VOCABULARY:
${cleanedWords
  .map(
    (w) => `
WORD: ${w.word}
PART OF SPEECH: ${w.part_of_speech}
DEFINITION: ${w.definition}
`
  )
  .join("\n")}
`.trim()

    const storyResponse = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "xiaomi/mimo-v2-pro",
          temperature: 0.9,
          max_tokens: 1800,
          messages: [
            {
              role: "user",
              content: storyPrompt,
            },
          ],
        }),
      }
    )

    if (!storyResponse.ok) {
      const errorData = await storyResponse.json()

      console.error(errorData)

      throw new Error(
        errorData.error?.message ||
          "Story generation failed"
      )
    }

    const storyData = await storyResponse.json()

    const story =
      storyData.choices?.[0]?.message?.content?.trim() ||
      "Story generation failed."

    /*
    =========================================
    CALL 2 — QUESTION GENERATION
    =========================================
    */

    const questionPrompt = `
TASK:
Generate contextual vocabulary quiz questions based on the story.

IMPORTANT:
Generate EXACTLY ONE question per vocabulary word.

QUESTION RULES:
1. Multiple choice only.
2. 4 answer options.
3. ONLY one correct answer.
4. Questions MUST test contextual understanding.
5. Questions should rely on the story context.
6. Avoid obvious answers.
7. Include explanation.
8. Return STRICT VALID JSON ONLY.

JSON FORMAT:
{
  "questions": [
    {
      "word": "example",
      "question": "What does example most likely mean in the story?",
      "options": [
        "option A",
        "option B",
        "option C",
        "option D"
      ],
      "correctAnswer": "option A",
      "explanation": "reason here"
    }
  ]
}

VOCABULARY:
${cleanedWords
  .map(
    (w) => `
WORD: ${w.word}
DEFINITION: ${w.definition}
`
  )
  .join("\n")}

STORY:
${story}
`.trim()

    const questionResponse = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "xiaomi/mimo-v2-pro",
          temperature: 0.7,
          max_tokens: 1800,
          response_format: {
            type: "json_object",
          },
          messages: [
            {
              role: "user",
              content: questionPrompt,
            },
          ],
        }),
      }
    )

    if (!questionResponse.ok) {
      const errorData = await questionResponse.json()

      console.error(errorData)

      throw new Error(
        errorData.error?.message ||
          "Question generation failed"
      )
    }

    const questionData =
      await questionResponse.json()

    const rawQuestions =
      questionData.choices?.[0]?.message?.content

    let parsedQuestions

    try {
      parsedQuestions = JSON.parse(rawQuestions)
    } catch (error) {
      console.error("JSON parse failed:", error)

      parsedQuestions = null
    }

    /*
    =========================================
    FALLBACK QUESTIONS
    =========================================
    */

    if (
      !parsedQuestions ||
      !Array.isArray(parsedQuestions.questions)
    ) {
      parsedQuestions = {
        questions: cleanedWords.map((w) => ({
          word: w.word,
          question: `What does "${w.word}" mean?`,
          options: [
            w.definition,
            "Incorrect answer",
            "Wrong meaning",
            "Unrelated meaning",
          ],
          correctAnswer: w.definition,
          explanation: w.definition,
        })),
      }
    }

    /*
    =========================================
    SUCCESS
    =========================================
    */

    return NextResponse.json({
      success: true,
      story,
      questions: parsedQuestions.questions,
    })
  } catch (error) {
    console.error("Story Quiz Error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate story quiz.",
      },
      {
        status: 500,
      }
    )
  }
}