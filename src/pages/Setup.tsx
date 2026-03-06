import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export default function Setup({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [step, setStep] = useState<"name" | "invite">("name")

  async function handleName() {
    if (!name.trim()) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const code = generateCode()
    const { error } = await supabase.from("partners").insert({
      user1_id: user.id,
      invite_code: code,
    })

    if (!error) {
      setInviteCode(code)
      setStep("invite")
    }
    setLoading(false)
  }

  function copyLink() {
    navigator.clipboard.writeText(`${window.location.origin}?invite=${inviteCode}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (step === "invite") return (
    <div className="min-h-screen bg-gradient-to-b from-rose-950 to-pink-900 flex flex-col items-center justify-center px-6 text-center">
      <div className="w-full max-w-xs">
        <h1 className="text-4xl mb-3">💌</h1>
        <h1 className="text-3xl font-bold text-white mb-2">Invite your partner</h1>
        <p className="text-pink-300 mb-8">Send them this link — once they join you'll be connected</p>

        <div className="bg-white/10 border border-pink-400/30 rounded-2xl px-4 py-4 mb-4">
          <p className="text-pink-200 text-sm break-all">{window.location.origin}?invite={inviteCode}</p>
        </div>

        <button
          onClick={copyLink}
          className="w-full bg-white text-rose-900 font-bold py-4 rounded-2xl text-lg mb-3"
        >
          {copied ? "Copied! ✓" : "Copy Invite Link"}
        </button>

        <button
          onClick={onDone}
          className="w-full text-pink-400 text-sm underline"
        >
          Skip for now
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-950 to-pink-900 flex flex-col items-center justify-center px-6 text-center">
      <div className="w-full max-w-xs">
        <h1 className="text-4xl mb-3">👋</h1>
        <h1 className="text-3xl font-bold text-white mb-2">What's your name?</h1>
        <p className="text-pink-300 mb-8">Just your first name is fine</p>

        <div className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-white/10 text-white placeholder-pink-300 border border-pink-400/30 rounded-2xl px-4 py-4 outline-none focus:border-pink-400 text-center text-xl"
          />
          <button
            onClick={handleName}
            disabled={loading || !name.trim()}
            className="w-full bg-white text-rose-900 font-bold py-4 rounded-2xl text-lg mt-2"
          >
            {loading ? "Setting up..." : "Continue →"}
          </button>
        </div>
      </div>
    </div>
  )
}
