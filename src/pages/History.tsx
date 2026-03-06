import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"
import { questions } from "../data/questions"

function getTodayIndex() {
  const start = new Date("2026-01-01").getTime()
  const now = new Date().getTime()
  const days = Math.floor((now - start) / (1000 * 60 * 60 * 24))
  return days % questions.length
}

function getMatchPercent(a: string, b: string) {
  const normalize = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9 ]/g, "")
  const wordsA = new Set(normalize(a).split(" ").filter(Boolean))
  const wordsB = new Set(normalize(b).split(" ").filter(Boolean))
  if (wordsA.size === 0 && wordsB.size === 0) return 100
  const intersection = [...wordsA].filter(w => wordsB.has(w))
  const union = new Set([...wordsA, ...wordsB])
  return Math.round(40 + (intersection.length / union.size) * 60)
}

type HistoryEntry = {
  date: string
  question: string
  myAnswer: string
  partnerAnswer: string | null
  matchPercent: number | null
}

export default function History({ onBack, partnerName }: { onBack: () => void, partnerName: string }) {
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadHistory() }, [])

  async function loadHistory() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: p1 } = await supabase.from("partners").select("*").eq("user1_id", user.id)
    const { data: p2 } = await supabase.from("partners").select("*").eq("user2_id", user.id)
    const partnership = p1?.[0] || p2?.[0]
    const partnerId = partnership
      ? (partnership.user1_id === user.id ? partnership.user2_id : partnership.user1_id)
      : null

    const { data: myAnswers } = await supabase
      .from("answers").select("*").eq("user_id", user.id).order("answered_date", { ascending: false })

    if (!myAnswers) { setLoading(false); return }

    const results: HistoryEntry[] = []

    for (const ans of myAnswers) {
      let partnerAnswer = null
      let matchPercent = null

      if (partnerId) {
        const { data: pa } = await supabase
          .from("answers").select("answer")
          .eq("user_id", partnerId)
          .eq("answered_date", ans.answered_date)
          .single()
        if (pa) {
          partnerAnswer = pa.answer
          matchPercent = getMatchPercent(ans.answer, pa.answer)
        }
      }

      results.push({
        date: ans.answered_date,
        question: questions[ans.question_index] || "Unknown question",
        myAnswer: ans.answer,
        partnerAnswer,
        matchPercent
      })
    }

    setEntries(results)
    setLoading(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-b from-rose-950 to-pink-900 flex items-center justify-center">
      <p className="text-pink-300">Loading history...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-950 to-pink-900 flex flex-col px-6 py-12">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={onBack} className="text-pink-400 text-sm underline">← Back</button>
        <h1 className="text-white font-bold text-xl">Your History</h1>
      </div>

      {entries.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-pink-400 text-center">No history yet — answer today's question to start! 💕</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 max-w-xs mx-auto w-full pb-8">
          {entries.map((entry, i) => (
            <div key={i} className="bg-white/10 border border-pink-400/20 rounded-3xl px-5 py-5">
              <div className="flex justify-between items-center mb-3">
                <p className="text-pink-400 text-xs">{entry.date}</p>
                {entry.matchPercent !== null && (
                  <div className="bg-pink-500/20 border border-pink-400/30 rounded-full px-3 py-1">
                    <span className="text-white text-xs font-bold">{entry.matchPercent}% match</span>
                  </div>
                )}
              </div>
              <p className="text-pink-200 text-sm font-medium mb-3 leading-snug">{entry.question}</p>
              <div className="flex flex-col gap-2">
                <div className="bg-white/5 rounded-xl px-3 py-2">
                  <p className="text-pink-400 text-xs mb-1">You</p>
                  <p className="text-white text-sm">{entry.myAnswer}</p>
                </div>
                {entry.partnerAnswer ? (
                  <div className="bg-pink-500/10 rounded-xl px-3 py-2">
                    <p className="text-pink-400 text-xs mb-1">{partnerName || "Partner"}</p>
                    <p className="text-white text-sm">{entry.partnerAnswer}</p>
                  </div>
                ) : (
                  <div className="bg-white/5 rounded-xl px-3 py-2">
                    <p className="text-pink-600 text-xs italic">Partner didn't answer this day</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
