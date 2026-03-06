import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"

const PET_COST = 50

type PetType = "cat" | "dog" | "panda" | "fox" | "frog" | "sloth" | "jaguar" | "platypus" | "sugarglider"

const petList: { type: PetType, label: string }[] = [
  { type: "cat", label: "Cat" },
  { type: "dog", label: "Dog" },
  { type: "panda", label: "Panda" },
  { type: "fox", label: "Fox" },
  { type: "frog", label: "Frog" },
  { type: "sloth", label: "Sloth" },
  { type: "jaguar", label: "Jaguar" },
  { type: "platypus", label: "Platypus" },
  { type: "sugarglider", label: "Sugar Glider" },
]

export default function Shop({ onBack, partnerName }: { onBack: () => void, partnerName: string }) {
  const [coins, setCoins] = useState(0)
  const [loading, setLoading] = useState(true)
  const [gifting, setGifting] = useState<PetType | null>(null)
  const [successMsg, setSuccessMsg] = useState("")
  const [error, setError] = useState("")
  const [myPets, setMyPets] = useState<any[]>([])
  const [partnerPets, setPartnerPets] = useState<any[]>([])
  const [tab, setTab] = useState<"gift" | "self">("gift")

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from("profiles").select("coins").eq("id", user.id).single()
    if (profile) setCoins(profile.coins || 0)

    const { data: p1 } = await supabase.from("partners").select("*").eq("user1_id", user.id)
    const { data: p2 } = await supabase.from("partners").select("*").eq("user2_id", user.id)
    const partnership = p1?.[0] || p2?.[0]
    const partnerId = partnership
      ? (partnership.user1_id === user.id ? partnership.user2_id : partnership.user1_id)
      : null

    const { data: mine } = await supabase.from("pets").select("*").eq("owner_id", user.id)
    if (mine) setMyPets(mine)

    if (partnerId) {
      const { data: theirs } = await supabase.from("pets").select("*").eq("owner_id", partnerId)
      if (theirs) setPartnerPets(theirs)
    }

    setLoading(false)
  }

  async function buyPet(petType: PetType, toPartner: boolean) {
    if (coins < PET_COST) return setError("Not enough coins!")
    setGifting(petType)
    setError("")
    setSuccessMsg("")

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: p1 } = await supabase.from("partners").select("*").eq("user1_id", user.id)
    const { data: p2 } = await supabase.from("partners").select("*").eq("user2_id", user.id)
    const partnership = p1?.[0] || p2?.[0]
    const partnerId = partnership
      ? (partnership.user1_id === user.id ? partnership.user2_id : partnership.user1_id)
      : null

    if (toPartner && !partnerId) {
      setError("No partner linked yet!")
      setGifting(null)
      return
    }

    const ownerId = toPartner ? partnerId : user.id

    await supabase.from("pets").insert({ owner_id: ownerId, gifted_by: user.id, pet_type: petType })
    await supabase.from("profiles").update({ coins: coins - PET_COST }).eq("id", user.id)

    setCoins(c => c - PET_COST)
    setSuccessMsg(toPartner ? `💌 ${partnerName || "Your partner"} got a new pet!` : "🐾 Added to your collection!")
    setGifting(null)
    loadData()
  }

  async function devCoins() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from("profiles").update({ coins: 9999 }).eq("id", user.id)
    setCoins(9999)
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-b from-rose-950 to-pink-900 flex items-center justify-center">
      <p className="text-pink-300">Loading shop...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-950 to-pink-900 flex flex-col px-6 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-pink-400 text-sm underline">← Back</button>
          <h1 className="text-white font-bold text-xl">Shop</h1>
        </div>
        <div className="flex items-center gap-1 bg-yellow-500/20 border border-yellow-400/30 rounded-full px-3 py-1">
          <span className="text-sm">🪙</span>
          <span className="text-amber-300 text-sm font-bold">{coins}</span>
        </div>
      </div>

      <div className="max-w-xs mx-auto w-full flex flex-col gap-5">

        {successMsg && (
          <div className="bg-pink-500/20 border border-pink-400/30 rounded-2xl px-4 py-3 text-center">
            <p className="text-white text-sm font-bold">{successMsg}</p>
          </div>
        )}
        {error && (
          <div className="bg-red-500/20 border border-red-400/30 rounded-2xl px-4 py-3 text-center">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex bg-white/10 rounded-2xl p-1">
          <button
            onClick={() => setTab("gift")}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${tab === "gift" ? "bg-white text-rose-900" : "text-pink-300"}`}
          >
            🎁 Gift {partnerName || "Partner"}
          </button>
          <button
            onClick={() => setTab("self")}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${tab === "self" ? "bg-white text-rose-900" : "text-pink-300"}`}
          >
            🛍️ Buy for Me
          </button>
        </div>

        {/* Pet grid */}
        <div className="grid grid-cols-3 gap-3">
          {petList.map(pet => (
            <button
              key={pet.type}
              onClick={() => buyPet(pet.type, tab === "gift")}
              disabled={gifting === pet.type}
              className="bg-white/10 border border-white/10 rounded-2xl py-4 px-2 flex flex-col items-center gap-1 active:scale-95 transition-transform relative"
            >
              <div className="relative">
                <img
                  src={`/pets/${pet.type}.jpg`}
                  alt={pet.label}
                  className="w-16 h-16 object-contain drop-shadow-sm"
                />
                {coins < PET_COST && (
                  <div className="absolute -top-1 -right-1 bg-rose-900 rounded-full w-4 h-4 flex items-center justify-center">
                    <span style={{ fontSize: "8px" }}>🔒</span>
                  </div>
                )}
              </div>
              <p className="text-white text-xs font-semibold mt-1">{pet.label}</p>
              <div className="flex items-center gap-1">
                <span style={{ fontSize: "10px" }}>🪙</span>
                <span className="text-amber-300 text-xs">{PET_COST}</span>
              </div>
            </button>
          ))}
        </div>

        {/* My pets */}
        {myPets.length > 0 && (
          <div>
            <p className="text-pink-400 text-xs uppercase tracking-widest mb-3">Your pets 🏠</p>
            <div className="flex flex-wrap gap-3">
              {myPets.map(pet => (
                <div key={pet.id} className="bg-white/15 border border-white/20 rounded-2xl p-3 flex flex-col items-center gap-1">
                  <img src={`/pets/${pet.pet_type}.jpg`} alt={pet.pet_type} className="w-12 h-12 object-contain" />
                  <p className="text-pink-200 text-xs capitalize">{pet.pet_name || pet.pet_type}</p>
                  <p className="text-pink-500 text-xs">from {pet.gifted_by === pet.owner_id ? "you" : partnerName || "partner"}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Earn coins */}
        <div className="bg-white/10 border border-white/10 rounded-2xl px-4 py-4">
          <p className="text-pink-400 text-xs uppercase tracking-widest mb-3">How to earn coins 🪙</p>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between">
              <p className="text-pink-200 text-sm">Both answer today</p>
              <p className="text-amber-300 text-sm font-bold">+10 🪙</p>
            </div>
            <div className="flex justify-between">
              <p className="text-pink-200 text-sm">7 day streak</p>
              <p className="text-amber-300 text-sm font-bold">+50 🪙</p>
            </div>
            <div className="flex justify-between">
              <p className="text-pink-200 text-sm">30 day streak</p>
              <p className="text-amber-300 text-sm font-bold">+200 🪙</p>
            </div>
          </div>
        </div>

        {/* Dev button */}
        <button
          onClick={devCoins}
          className="w-full border border-dashed border-pink-400/30 text-pink-500 text-xs py-2 rounded-xl"
        >
          🛠️ Dev: Give 9999 coins
        </button>

      </div>
    </div>
  )
}
