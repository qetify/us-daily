import { useState, useEffect } from "react"
import { supabase } from "./lib/supabase"
import Signup from "./pages/Signup"
import Login from "./pages/Login"
import Setup from "./pages/Setup"
import Dashboard from "./pages/Dashboard"

type Screen = "loading" | "home" | "signup" | "login" | "setup" | "dashboard"

export default function App() {
  const [screen, setScreen] = useState<Screen>("loading")

  useEffect(() => {
    // Store invite code before auth redirects clear it
    const invite = new URLSearchParams(window.location.search).get("invite")
    if (invite) localStorage.setItem("pendingInvite", invite)

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setScreen("dashboard")
      } else {
        setScreen(invite ? "signup" : "home")
      }
    })
  }, [])

  if (screen === "loading") return (
    <div className="min-h-screen bg-gradient-to-b from-rose-950 to-pink-900" />
  )

  if (screen === "signup") return <Signup onSwitch={() => setScreen("login")} onSuccess={() => setScreen("setup")} />
  if (screen === "login") return <Login onSwitch={() => setScreen("signup")} onSuccess={() => setScreen("setup")} />
  if (screen === "setup") return <Setup onDone={() => setScreen("dashboard")} />
  if (screen === "dashboard") return <Dashboard onSignOut={async () => { await supabase.auth.signOut(); setScreen("home") }} />

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-950 to-pink-900 flex flex-col items-center justify-center px-6 text-center">
      <div className="mb-8">
        <h1 className="text-6xl mb-3">💕</h1>
        <h1 className="text-4xl font-bold text-white tracking-tight">Us, Daily</h1>
        <p className="text-pink-300 mt-3 text-lg">One question. Every day. Just you two.</p>
      </div>
      <div className="w-full max-w-xs flex flex-col gap-3">
        <button onClick={() => setScreen("signup")} className="w-full bg-white text-rose-900 font-bold py-4 rounded-2xl text-lg">
          Get Started
        </button>
        <button onClick={() => setScreen("login")} className="w-full bg-transparent border-2 border-pink-400 text-pink-300 font-bold py-4 rounded-2xl text-lg">
          Log In
        </button>
      </div>
      <p className="text-pink-500 text-sm mt-10">Free for 7 days · then $3.99/month</p>
    </div>
  )
}
