import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"
import { questions } from "../data/questions"

function getTodayIndex() {
  const start = new Date("2026-01-01").getTime()
  const now = new Date().getTime()
  const days = Math.floor((now - start) / (1000 * 60 * 60 * 24))
  return days % questions.length
}

export default function Dashboard({ onSignOut }: { onSignOut: () => void }) {
  const [name, setName] = useState("")
  const [partnerName, setPartnerName] = useState("")
  const [myAnswer, setMyAnswer] = useState("")
  const [partnerAnswer, setPartnerAnswer] = useState<string | null>(null)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [revealed, setRevealed] = useState(false)

  const todayIndex = getTodayIndex()
  const question = questions[todayIndex]

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get my profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .single()
    if (profile) setName(profile.name)

    // Get my answer for today
    const { data: myAns } = await supabase
      .from("answers")
      .select("answer")
      .eq("user_id", user.id)
      .eq("question_index", todayIndex)
      .single()
    if (myAns) setMyAnswer(myAns.answer)

    // Get partner
    const { data: partnership } = await supabase
      .from("partners")
      .select("*")
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .single()

    if (partnership) {
      const partnerId = partnership.user1_id === user.id ? partnership.user2_id : partnership.user1_id
      if (partnerId) {
        const { data: partnerProfile } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", partnerId)
          .single()
        if (partnerProfile) setPartnerName(partnerProfile.name)

        // Get partner answer (only if I already answered)
        if (myAns) {
          const { data: partnerAns } = await supabase
            .from("answers")
            .select("answer")
            .eq("user_id", partnerId)
            .eq("question_index", todayIndex)
            .single()
          if (partnerAns) setPartnerAnswer(partnerAns.answer)
        }
      }
    }

    setLoading(false)
  }

  async function submitAnswer() {
    if (!input.trim()) return
    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from("answers").upsert({
      user_id: user.id,
      question_index: todayIndex,
      answer: input.trim()
    })

    setMyAnswer(input.trim())
    setSubmitting(false)
    loadData()
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-b from-rose-950 to-pink-900 flex items-center justify-center">
      <p className="text-pink-300">Loading...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-950 to-pink-900 flex flex-col px-6 py-12">
      <div className="flex justify-between items-center mb-10">
        <div>
          <p className="text-pink-400 text-sm">Hey, {name} 👋</p>
          {partnerName && <p className="text-pink-300 text-xs">paired with {partnerName} 💕</p>}
          {!partnerName && <p className="text-pink-500 text-xs">waiting for partner to join...</p>}
        </div>
        <button onClick={onSignOut} className="text-pink-600 text-xs underline">Sign out</button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center max-w-xs mx-auto w-full">
        <p className="text-pink-400 text-sm mb-3 uppercase tracking-widest">Today's Question</p>
        <div className="bg-white/10 border border-pink-400/20 rounded-3xl px-6 py-8 mb-8 text-center">
          <p className="text-white text-xl font-semibold leading-snug">{question}</p>
        </div>

        {!myAnswer ? (
          <div className="w-full flex flex-col gap-3">
            <textarea
              placeholder="Your answer..."
              value={input}
              onChange={e => setInput(e.target.value)}
              rows={3}
              className="w-full bg-white/10 text-white placeholder-pink-400 border border-pink-400/30 rounded-2xl px-4 py-4 outline-none focus:border-pink-400 resize-none"
            />
            <button
              onClick={submitAnswer}
              disabled={submitting || !input.trim()}
              className="w-full bg-white text-rose-900 font-bold py-4 rounded-2xl text-lg"
            >
              {submitting ? "Submitting..." : "Submit Answer 💕"}
            </button>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-4">
            <div className="bg-white/10 border border-pink-400/20 rounded-2xl px-4 py-4">
              <p className="text-pink-400 text-xs mb-1">Your answer</p>
              <p className="text-white">{myAnswer}</p>
            </div>

            {partnerAnswer ? (
              <div>
                {!revealed ? (
                  <button
                    onClick={() => setRevealed(true)}
                    className="w-full bg-white text-rose-900 font-bold py-4 rounded-2xl text-lg"
                  >
                    Reveal {partnerName}'s Answer 👀
                  </button>
                ) : (
                  <div className="bg-pink-500/20 border border-pink-400/30 rounded-2xl px-4 py-4">
                    <p className="text-pink-400 text-xs mb-1">{partnerName}'s answer</p>
                    <p className="text-white">{partnerAnswer}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center">
                <p className="text-pink-400 text-sm">
                  {partnerName ? `Waiting for ${partnerName} to answer... 💭` : "Waiting for your partner to join 💌"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
