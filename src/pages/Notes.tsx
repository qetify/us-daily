import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"

const NOTE_COST = 15
const COMPLIMENT_COST = 10

const compliments = [
  "You make every day better just by being in it 💕",
  "I fall for you more every single day 🌹",
  "You are my favorite notification 📱💕",
  "Being with you feels like home 🏠",
  "You make the ordinary feel magical ✨",
  "I love the way you make me feel seen 👀💕",
  "You are genuinely my favorite person alive 💫",
  "Everything is better because of you 🌸",
  "I chose you yesterday, today, and tomorrow 💍",
  "You have no idea how much you mean to me 💗",
]

export default function Notes({ onBack, partnerName }: { onBack: () => void, partnerName: string }) {
  const [coins, setCoins] = useState(0)
  const [tab, setTab] = useState<"send" | "inbox">("send")
  const [sendTab, setSendTab] = useState<"note" | "compliment">("compliment")
  const [noteText, setNoteText] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const [inbox, setInbox] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [partnerId, setPartnerId] = useState<string | null>(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase.from("profiles").select("coins").eq("id", user.id).single()
    if (profile) setCoins(profile.coins || 0)

    const { data: p1 } = await supabase.from("partners").select("*").eq("user1_id", user.id)
    const { data: p2 } = await supabase.from("partners").select("*").eq("user2_id", user.id)
    const partnership = p1?.[0] || p2?.[0]
    const pid = partnership ? (partnership.user1_id === user.id ? partnership.user2_id : partnership.user1_id) : null
    setPartnerId(pid)

    const { data: messages } = await supabase
      .from("notes")
      .select("*")
      .eq("receiver_id", user.id)
      .order("created_at", { ascending: false })
    if (messages) setInbox(messages)
    await supabase.from("notes").update({ seen: true }).eq("receiver_id", user.id).eq("seen", false)

    setLoading(false)
  }

  async function sendCompliment() {
    if (!partnerId) return setError("No partner linked!")
    const cost = COMPLIMENT_COST
    if (coins < cost) return setError("Not enough coins!")
    setSending(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const msg = compliments[Math.floor(Math.random() * compliments.length)]
    await supabase.from("notes").insert({ sender_id: user.id, receiver_id: partnerId, message: msg, type: "compliment" })
    await supabase.from("profiles").update({ coins: coins - cost }).eq("id", user.id)
    setCoins(c => c - cost)
    setSent(true)
    setSending(false)
    setTimeout(() => setSent(false), 3000)
  }

  async function sendNote() {
    if (!partnerId) return setError("No partner linked!")
    if (!noteText.trim()) return setError("Write something first!")
    if (coins < NOTE_COST) return setError("Not enough coins!")
    setSending(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from("notes").insert({ sender_id: user.id, receiver_id: partnerId, message: noteText.trim(), type: "note" })
    await supabase.from("profiles").update({ coins: coins - NOTE_COST }).eq("id", user.id)
    setCoins(c => c - NOTE_COST)
    setNoteText("")
    setSent(true)
    setSending(false)
    setTimeout(() => setSent(false), 3000)
  }

  async function deleteNote(id: string) {
    await supabase.from("notes").delete().eq("id", id)
    setInbox(prev => prev.filter(m => m.id !== id))
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-b from-rose-950 to-pink-900 flex items-center justify-center">
      <p className="text-pink-300">Loading...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-950 to-pink-900 flex flex-col px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-pink-400 text-sm underline">← Back</button>
          <h1 className="text-white font-bold text-xl">Messages</h1>
        </div>
        <div className="flex items-center gap-1 bg-yellow-500/20 border border-yellow-400/30 rounded-full px-3 py-1">
          <span className="text-sm">🪙</span>
          <span className="text-amber-300 text-sm font-bold">{coins}</span>
        </div>
      </div>

      <div className="max-w-xs mx-auto w-full flex flex-col gap-4">

        {/* Main tabs */}
        <div className="flex bg-white/10 rounded-2xl p-1">
          <button
            onClick={() => setTab("send")}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${tab === "send" ? "bg-white text-rose-900" : "text-pink-300"}`}
          >
            💌 Send
          </button>
          <button
            onClick={() => setTab("inbox")}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${tab === "inbox" ? "bg-white text-rose-900" : "text-pink-300"}`}
          >
            📬 Inbox {inbox.filter(m => !m.seen).length > 0 && `(${inbox.filter(m => !m.seen).length})`}
          </button>
        </div>

        {tab === "send" && (
          <>
            {/* Send type tabs */}
            <div className="flex bg-white/10 rounded-2xl p-1">
              <button
                onClick={() => setSendTab("compliment")}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${sendTab === "compliment" ? "bg-white text-rose-900" : "text-pink-300"}`}
              >
                🌹 Compliment
              </button>
              <button
                onClick={() => setSendTab("note")}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${sendTab === "note" ? "bg-white text-rose-900" : "text-pink-300"}`}
              >
                💬 Secret Note
              </button>
            </div>

            {sent && (
              <div className="bg-pink-500/20 border border-pink-400/30 rounded-2xl px-4 py-3 text-center">
                <p className="text-white font-bold">Sent! 💕</p>
                <p className="text-pink-300 text-sm">{partnerName} will see it when they open the app</p>
              </div>
            )}

            {error && (
              <div className="bg-red-500/20 border border-red-400/30 rounded-2xl px-4 py-3 text-center">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            {sendTab === "compliment" && (
              <div className="bg-white/10 border border-white/10 rounded-2xl p-5 flex flex-col items-center gap-4 text-center">
                <p className="text-4xl">🌹</p>
                <p className="text-white font-bold">Send a random compliment</p>
                <p className="text-pink-300 text-sm">A surprise message will appear on {partnerName || "your partner"}&apos;s dashboard</p>
                <button
                  onClick={sendCompliment}
                  disabled={sending || coins < COMPLIMENT_COST}
                  className="w-full bg-white text-rose-900 font-bold py-3 rounded-2xl"
                >
                  {sending ? "Sending..." : `Send Compliment 🌹`}
                </button>
                <div className="flex items-center gap-1">
                  <span className="text-xs">🪙</span>
                  <span className="text-amber-300 text-xs">{COMPLIMENT_COST} coins</span>
                </div>
              </div>
            )}

            {sendTab === "note" && (
              <div className="bg-white/10 border border-white/10 rounded-2xl p-5 flex flex-col gap-4">
                <p className="text-white font-bold text-center">Write a secret note</p>
                <p className="text-pink-300 text-sm text-center">Only {partnerName || "your partner"} can read it</p>
                <textarea
                  placeholder="Write something sweet..."
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  rows={4}
                  className="w-full bg-white/10 text-white placeholder-pink-400 border border-pink-400/30 rounded-2xl px-4 py-3 outline-none focus:border-pink-400 resize-none"
                />
                <button
                  onClick={sendNote}
                  disabled={sending || !noteText.trim() || coins < NOTE_COST}
                  className="w-full bg-white text-rose-900 font-bold py-3 rounded-2xl"
                >
                  {sending ? "Sending..." : "Send Note 💌"}
                </button>
                <div className="flex items-center gap-1 justify-center">
                  <span className="text-xs">🪙</span>
                  <span className="text-amber-300 text-xs">{NOTE_COST} coins</span>
                </div>
              </div>
            )}
          </>
        )}

        {tab === "inbox" && (
          <div className="flex flex-col gap-3">
            {inbox.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-4xl mb-3">📭</p>
                <p className="text-pink-400">No messages yet</p>
                <p className="text-pink-600 text-sm mt-1">When {partnerName || "your partner"} sends you something it&apos;ll appear here</p>
              </div>
            ) : (
              inbox.map(msg => (
                <div key={msg.id} className="bg-white/10 border border-white/10 rounded-2xl px-4 py-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs">{msg.type === "compliment" ? "🌹 Compliment" : "💌 Secret Note"}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-pink-500 text-xs">{new Date(msg.created_at).toLocaleDateString()}</span>
                      <button
                        onClick={() => deleteNote(msg.id)}
                        className="text-pink-600 text-xs hover:text-red-400"
                      >✕</button>
                    </div>
                  </div>
                  <p className="text-white text-sm leading-relaxed">{msg.message}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
