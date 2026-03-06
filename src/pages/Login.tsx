import { useState } from "react"
import { supabase } from "../lib/supabase"

export default function Login({ onSwitch, onSuccess }: { onSwitch: () => void, onSuccess: () => void }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleLogin() {
    if (!email || !password) return setError("Fill in both fields")
    setLoading(true)
    setError("")
    const { error } = await supabase.auth.signInWithPassword({ email, password })
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
        <h1 className="text-3xl font-bold text-white mb-2 text-center">Welcome back</h1>
        <p className="text-pink-300 text-center mb-8">Good to see you 💕</p>
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
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-white text-rose-900 font-bold py-4 rounded-2xl text-lg mt-2"
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </div>
        <p className="text-pink-400 text-center mt-6 text-sm">
          No account?{" "}
          <span onClick={onSwitch} className="text-white font-bold cursor-pointer">Sign up free</span>
        </p>
      </div>
    </div>
  )
}
