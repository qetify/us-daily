import { supabase } from "./supabase"

export type PetMood = "happy" | "sad" | "gone"

export async function getPetMood(userId: string): Promise<{ mood: PetMood, missedDays: number }> {
  const { data: p1 } = await supabase.from("partners").select("*").eq("user1_id", userId)
  const { data: p2 } = await supabase.from("partners").select("*").eq("user2_id", userId)
  const partnership = p1?.[0] || p2?.[0]
  if (!partnership) return { mood: "happy", missedDays: 0 }

  const partnerId = partnership.user1_id === userId ? partnership.user2_id : partnership.user1_id
  if (!partnerId) return { mood: "happy", missedDays: 0 }

  // Only start checking after account is 3+ days old
  const accountAge = Date.now() - new Date(partnership.created_at).getTime()
  const accountDays = accountAge / (1000 * 60 * 60 * 24)
  if (accountDays < 3) return { mood: "happy", missedDays: 0 }

  let missedDays = 0
  for (let i = 1; i <= 3; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split("T")[0]

    const { data: myAns } = await supabase.from("answers").select("id")
      .eq("user_id", userId).eq("answered_date", dateStr).single()
    const { data: partnerAns } = await supabase.from("answers").select("id")
      .eq("user_id", partnerId).eq("answered_date", dateStr).single()

    if (!myAns || !partnerAns) missedDays++
    else break
  }

  if (missedDays >= 3) return { mood: "gone", missedDays }
  if (missedDays >= 1) return { mood: "sad", missedDays }
  return { mood: "happy", missedDays }
}
