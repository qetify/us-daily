import { useState } from "react"

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-950 to-pink-900 flex flex-col items-center justify-center px-6 text-center">
      <div className="mb-8">
        <h1 className="text-6xl mb-3">💕</h1>
        <h1 className="text-4xl font-bold text-white tracking-tight">Us, Daily</h1>
        <p className="text-pink-300 mt-3 text-lg">One question. Every day. Just you two.</p>
      </div>

      <div className="w-full max-w-xs flex flex-col gap-3">
        <button className="w-full bg-white text-rose-900 font-bold py-4 rounded-2xl text-lg">
          Get Started
        </button>
        <button className="w-full bg-transparent border-2 border-pink-400 text-pink-300 font-bold py-4 rounded-2xl text-lg">
          Log In
        </button>
      </div>

      <p className="text-pink-500 text-sm mt-10">Free for 7 days · then $3.99/month</p>
    </div>
  )
}
