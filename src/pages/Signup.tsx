import { useState } from "react"
import { supabase } from "../lib/supabase"

export default function Signup({ onSwitch, onSuccess }: { onSwitch: () => void, onSuccess: () => void }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSignup() {
    if (!email || !password) return setError("Fill in both fields")
    if (password.length < 6) return setError("Password must be 6+ characters")
    setLoading(true)
    setError("")
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      onSuccess()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-950 to-pink-900 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-xs">
        <h1 className="text-3xl font-bold text-white mb-2 text-center">Create account</h1>
        <p className="text-pink-300 text-center mb-8">Start your 7-day free trial</p>
        <div className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-white/10 text-white placeholder-pink-300 border border-pink-400/30 rounded-2xl px-4 py-4 outline-none focus:border-pink-400"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-white/10 text-white placeholder-pink-300 border border-pink-400/30 rounded-2xl px-4 py-4 outline-none focus:border-pink-400"
          />
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button
            onClick={handleSignup}
            disabled={loading}
            className="w-full bg-white text-rose-900 font-bold py-4 rounded-2xl text-lg mt-2"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </div>
        <p className="text-pink-400 text-center mt-6 text-sm">
          Already have an account?{" "}
          <span onClick={onSwitch} className="text-white font-bold cursor-pointer">Log in</span>
        </p>
      </div>
    </div>
  )
}
