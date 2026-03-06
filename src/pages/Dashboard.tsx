import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"
import { questions } from "../data/questions"
import { checkAndUpdateStreak, getStreak } from "../lib/streak"
import { getPetMood } from "../lib/petMood"
import Notes from "./Notes"
import type { PetMood } from "../lib/petMood"
import History from "./History"
import Shop from "./Shop"

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
  const similarity = intersection.length / union.size
  return Math.round(40 + similarity * 60)
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
  const [inviteCode, setInviteCode] = useState("")
  const [copied, setCopied] = useState(false)
  const [streak, setStreak] = useState<number>(0)
  const [matchPercent, setMatchPercent] = useState<number | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [showShop, setShowShop] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [unreadNotes, setUnreadNotes] = useState(0)
  const [coins, setCoins] = useState(0)
  const [myPets, setMyPets] = useState<any[]>([])
  const [newPetNotif, setNewPetNotif] = useState<string | null>(null)
  const [petMood, setPetMood] = useState<PetMood>("happy")
  const [missedDays, setMissedDays] = useState(0)

  const todayIndex = getTodayIndex()
  const question = questions[todayIndex]

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from("profiles").select("name").eq("id", user.id).single()
    if (profile?.name) setName(profile.name)

    const today = new Date().toISOString().split("T")[0]

    const { data: myAns } = await supabase
      .from("answers").select("answer")
      .eq("user_id", user.id).eq("answered_date", today).single()
    if (myAns) setMyAnswer(myAns.answer)

    const { data: p1 } = await supabase.from("partners").select("*").eq("user1_id", user.id)
    const { data: p2 } = await supabase.from("partners").select("*").eq("user2_id", user.id)
    const partnership = p1?.[0] || p2?.[0]

    if (partnership) {
      setInviteCode(partnership.invite_code)
      const partnerId = partnership.user1_id === user.id ? partnership.user2_id : partnership.user1_id

      if (partnerId) {
        const { data: pp } = await supabase
          .from("profiles").select("name").eq("id", partnerId).single()
        if (pp?.name) setPartnerName(pp.name)

        if (myAns) {
          const { data: pa } = await supabase
            .from("answers").select("answer")
            .eq("user_id", partnerId).eq("answered_date", today).single()
          if (pa) {
            setPartnerAnswer(pa.answer)
            const streakData = await checkAndUpdateStreak(user.id)
            if (streakData) setStreak(streakData.current_streak)
            setMatchPercent(getMatchPercent(myAns.answer, pa.answer))
          }
        }
      }
    }

    const streakData = await getStreak(user.id)
    if (streakData) setStreak(streakData.current_streak)

    const { data: profileCoins } = await supabase.from("profiles").select("coins").eq("id", user.id).single()
    if (profileCoins) setCoins(profileCoins.coins || 0)

    const { data: unread } = await supabase.from("notes").select("id").eq("receiver_id", user.id).eq("seen", false)
    if (unread) setUnreadNotes(unread.length)

    // Load my pets
    const { data: pets } = await supabase.from("pets").select("*").eq("owner_id", user.id).order("created_at", { ascending: false })
    if (pets) {
      setMyPets(pets)
      const { mood, missedDays } = await getPetMood(user.id)
      setPetMood(mood)
      setMissedDays(missedDays)
      // Check for unseen gifted pet
      const unseen = pets.find(p => p.gifted_by !== user.id && !p.seen)
      if (unseen) setNewPetNotif(unseen.pet_type)
    }

    setLoading(false)
  }

  async function submitAnswer() {
    if (!input.trim()) return
    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const today = new Date().toISOString().split("T")[0]
    await supabase.from("answers").upsert({
      user_id: user.id,
      question_index: todayIndex,
      answered_date: today,
      answer: input.trim()
    })
    setMyAnswer(input.trim())
    setSubmitting(false)
    loadData()
  }

  function copyInvite() {
    navigator.clipboard.writeText(`${window.location.origin}?invite=${inviteCode}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (showHistory) return <History onBack={() => setShowHistory(false)} partnerName={partnerName} />
  if (showShop) return <Shop onBack={() => { setShowShop(false); loadData() }} partnerName={partnerName} />
  if (showNotes) return <Notes onBack={() => { setShowNotes(false); loadData() }} partnerName={partnerName} />

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-b from-rose-950 to-pink-900 flex items-center justify-center">
      <p className="text-pink-300">Loading...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-950 to-pink-900 flex flex-col px-6 py-12">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <p className="text-white font-semibold">Hey, {name || "you"} 👋</p>
          {partnerName
            ? <p className="text-pink-300 text-xs mt-1">paired with {partnerName} 💕</p>
            : inviteCode
              ? <button onClick={copyInvite} className="text-pink-400 text-xs mt-1 underline text-left">
                  {copied ? "Copied! ✓" : "Tap to copy invite link 💌"}
                </button>
              : <p className="text-pink-500 text-xs mt-1">setting up...</p>
          }
        </div>
        <div className="flex flex-col items-end gap-1">
          {streak > 0 && (
            <div className="flex items-center gap-2">
            {streak > 0 && (
              <div className="flex items-center gap-1 bg-orange-500/20 border border-orange-400/30 rounded-full px-3 py-1">
                <span className="text-sm">🔥</span>
                <span className="text-orange-300 text-sm font-bold">{streak}</span>
              </div>
            )}
            <button
              onClick={() => setShowShop(true)}
              className="flex items-center gap-1 bg-yellow-500/20 border border-yellow-400/30 rounded-full px-3 py-1"
            >
              <span className="text-sm">🪙</span>
              <span className="text-yellow-300 text-sm font-bold">{coins}</span>
            </button>
          </div>
          )}
          <button onClick={onSignOut} className="text-pink-600 text-xs underline">Sign out</button>
        </div>
      </div>

      {/* Unread notes notification */}
      {unreadNotes > 0 && (
        <div className="max-w-xs mx-auto w-full mb-2">
          <button
            onClick={() => setShowNotes(true)}
            className="w-full bg-pink-500/20 border border-pink-400/30 rounded-2xl px-4 py-3 flex items-center gap-3"
          >
            <span className="text-xl">💌</span>
            <p className="text-white text-sm font-bold flex-1 text-left">{unreadNotes} new message{unreadNotes > 1 ? "s" : ""} from {partnerName}!</p>
            <span className="text-pink-400 text-xs">Open →</span>
          </button>
        </div>
      )}

      {/* New pet notification */}
      {newPetNotif && (
        <div className="max-w-xs mx-auto w-full mb-4">
          <div className="bg-pink-500/20 border border-pink-400/30 rounded-2xl px-4 py-3 flex items-center gap-3">
            <img src={`/pets/${newPetNotif}.jpg`} alt={newPetNotif} className="w-10 h-10 object-contain" />
            <div className="flex-1">
              <p className="text-white text-sm font-bold">New pet from {partnerName || "your partner"}! 🎁</p>
              <p className="text-pink-300 text-xs capitalize">You got a {newPetNotif}!</p>
            </div>
            <button onClick={async () => {
              setNewPetNotif(null)
              const { data: { user } } = await supabase.auth.getUser()
              if (user) await supabase.from("pets").update({ seen: true }).eq("owner_id", user.id).eq("seen", false)
            }} className="text-pink-400 text-xs">✕</button>
          </div>
        </div>
      )}

      {/* My pets */}
      {myPets.length > 0 && (
        <div className="max-w-xs mx-auto w-full mb-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-pink-400 text-xs uppercase tracking-widest">Your pets 🐾</p>
            {petMood === "gone" && <p className="text-red-400 text-xs">Your pet ran away! 😢</p>}
            {petMood === "sad" && <p className="text-yellow-400 text-xs">Your pet misses you! 😢</p>}
            {petMood === "happy" && <p className="text-green-400 text-xs">Your pet is happy! 😊</p>}
          </div>
          <div className="flex gap-2 flex-wrap">
            {myPets.map(pet => (
              <div key={pet.id} className="bg-white/10 border border-white/10 rounded-2xl p-2 flex flex-col items-center gap-1 relative">
                {petMood === "gone" ? (
                  <div className="w-10 h-10 flex items-center justify-center">
                    <span className="text-2xl">💨</span>
                  </div>
                ) : (
                  <img
                    src={`/pets/${pet.pet_type}.jpg`}
                    alt={pet.pet_type}
                    className="w-10 h-10 object-contain"
                    style={{
                      filter: petMood === "sad" ? "grayscale(60%) brightness(0.8)" : "none",
                    }}
                  />
                )}
                <p className="text-pink-200 text-xs capitalize">{pet.pet_name || pet.pet_type}</p>
                <span className="text-xs">
                  {petMood === "happy" ? "😊" : petMood === "sad" ? "😢" : "💨"}
                </span>
              </div>
            ))}
          </div>
          {petMood === "gone" && (
            <p className="text-red-300 text-xs mt-2 text-center">Answer together for 1 day to bring them back 💕</p>
          )}
          {petMood === "sad" && missedDays > 0 && (
            <p className="text-yellow-300 text-xs mt-2 text-center">Answer today before they run away! {3 - missedDays} day{3 - missedDays !== 1 ? "s" : ""} left ⚠️</p>
          )}
        </div>
      )}

      {/* Question */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-xs mx-auto w-full">
        <p className="text-pink-400 text-xs mb-3 uppercase tracking-widest">Today's Question</p>
        <div className="bg-white/10 border border-pink-400/20 rounded-3xl px-6 py-8 mb-8 text-center w-full">
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
              <div className="flex flex-col gap-3">
                {!revealed ? (
                  <button
                    onClick={() => setRevealed(true)}
                    className="w-full bg-white text-rose-900 font-bold py-4 rounded-2xl text-lg"
                  >
                    Reveal {partnerName}'s Answer 👀
                  </button>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="bg-pink-500/20 border border-pink-400/30 rounded-2xl px-4 py-4">
                      <p className="text-pink-400 text-xs mb-1">{partnerName}'s answer</p>
                      <p className="text-white">{partnerAnswer}</p>
                    </div>
                    {matchPercent !== null && (
                      <div className="bg-white/10 border border-pink-400/20 rounded-2xl px-4 py-5 text-center">
                        <p className="text-pink-400 text-xs mb-1 uppercase tracking-widest">Today's Match</p>
                        <p className="text-5xl font-bold text-white mb-1">{matchPercent}%</p>
                        <p className="text-pink-300 text-sm">
                          {matchPercent >= 80 ? "You two think alike 🔥" :
                           matchPercent >= 60 ? "Pretty well matched 💕" :
                           matchPercent >= 40 ? "Interesting differences 👀" :
                           "Opposites attract 😄"}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-pink-400 text-sm text-center">
                {partnerName
                  ? `Waiting for ${partnerName} to answer... 💭`
                  : "Waiting for your partner to join 💌"}
              </p>
            )}
          </div>
        )}
      </div>
      {/* Bottom nav */}
      <div className="flex justify-center gap-6 mt-8">
        <button onClick={() => setShowHistory(true)} className="text-pink-500 text-sm underline">
          History 📖
        </button>
        <button onClick={() => setShowShop(true)} className="text-pink-500 text-sm underline">
          Shop 🛍️
        </button>
        <button onClick={() => setShowNotes(true)} className="text-pink-500 text-sm underline">
          Messages 💌{unreadNotes > 0 ? ` (${unreadNotes})` : ""}
        </button>
      </div>
    </div>
  )
}
