"use client"

import { useEffect, useMemo, useState } from "react"
import { X } from "lucide-react"
import { useApp } from "@/contexts/app-context"

interface QuizModalProps {
  open: boolean
  onClose: () => void
  folderId?: string | null
}

type Question = {
  word: string
  question: string
  options: string[]
  correctAnswer: string
  explanation: string
}

export function QuizModal({
  open,
  onClose,
  folderId,
}: QuizModalProps) {
  const { getWordsInFolder } = useApp()

  const [loading, setLoading] = useState(false)

  const [story, setStory] = useState("")
  const [questions, setQuestions] = useState<Question[]>([])

  const [answers, setAnswers] = useState<
    Record<number, string>
  >({})

  const [showResults, setShowResults] =
    useState(false)

  const words = useMemo(() => {
    if (!folderId) return []
    return getWordsInFolder(folderId)
  }, [folderId, getWordsInFolder])

  useEffect(() => {
    if (!open || !folderId) return

    generateQuiz()
  }, [open, folderId])

  const generateQuiz = async () => {
    try {
      setLoading(true)

      const res = await fetch("/api/story-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          words,
        }),
      })

      const data = await res.json()

      setStory(data.story || "")
      setQuestions(data.questions || [])
    } catch (error) {
      console.error(error)

      setStory("Failed to generate story.")
      setQuestions([])
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = (
    questionIndex: number,
    value: string
  ) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: value,
    }))
  }

  const score = questions.reduce((acc, q, index) => {
    return answers[index] === q.correctAnswer
      ? acc + 1
      : acc
  }, 0)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
      <div className="relative w-[92vw] max-w-7xl h-[88vh] bg-card rounded-2xl shadow-2xl overflow-hidden flex flex-col">

        {/* CLOSE */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 z-50"
        >
          <X className="w-6 h-6" />
        </button>

        {loading ? (
          <div className="h-full flex items-center justify-center text-xl font-semibold">
            Generating Story Quiz...
          </div>
        ) : showResults ? (
          <div className="h-full flex flex-col items-center justify-center gap-6">

            <div className="text-5xl font-bold">
              {score} / {questions.length}
            </div>

            <div className="text-2xl">
              {Math.round(
                (score / questions.length) * 100
              )}
              % Correct
            </div>

            <button
              onClick={onClose}
              className="px-8 py-3 rounded-xl bg-primary text-primary-foreground"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6 flex-1 overflow-hidden p-6">

            {/* STORY SIDE */}
            <div className="border rounded-xl bg-background overflow-hidden flex flex-col">
              <h1 className="text-3xl font-bold mb-6">
                Story
              </h1>

              <div className="flex-1 overflow-y-auto p-5 prose prose-neutral dark:prose-invert max-w-none">
                <ReactMarkdown>
                    {story}
                </ReactMarkdown>
              </div>
            </div>

            {/* QUESTIONS SIDE */}
            <div className="border rounded-xl bg-background overflow-hidden flex flex-col">

              <div className="flex-1 overflow-y-auto p-10">
                <h1 className="text-3xl font-bold mb-8">
                  Questions
                </h1>

                <div className="space-y-10">
                  {questions.map((q, index) => (
                    <div
                      key={index}
                      className="border rounded-2xl p-6"
                    >
                      <div className="font-semibold text-lg mb-4">
                        {index + 1}. {q.question}
                      </div>

                      <div className="space-y-3">
                        {q.options.map((option) => (
                          <label
                            key={option}
                            className="flex items-center gap-3 cursor-pointer"
                          >
                            <input
                              type="radio"
                              name={`question-${index}`}
                              value={option}
                              checked={
                                answers[index] === option
                              }
                              onChange={() =>
                                handleAnswer(
                                  index,
                                  option
                                )
                              }
                            />

                            <span>{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SUBMIT */}
              <div className="border-t p-6 flex justify-end">
                <button
                  onClick={() =>
                    setShowResults(true)
                  }
                  className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-semibold"
                >
                  Submit Quiz
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}