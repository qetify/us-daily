import { supabase } from "./supabase"

export async function checkAndUpdateStreak(userId: string) {
  const { data: p1 } = await supabase.from("partners").select("*").eq("user1_id", userId)
  const { data: p2 } = await supabase.from("partners").select("*").eq("user2_id", userId)
  const partnership = p1?.[0] || p2?.[0]
  if (!partnership) return null

  const partnerId = partnership.user1_id === userId ? partnership.user2_id : partnership.user1_id
  if (!partnerId) return null

  const today = new Date().toISOString().split("T")[0]

  const { data: myAnswer } = await supabase
    .from("answers").select("id").eq("user_id", userId).eq("answered_date", today).single()
  const { data: partnerAnswer } = await supabase
    .from("answers").select("id").eq("user_id", partnerId).eq("answered_date", today).single()

  if (!myAnswer || !partnerAnswer) return null

  const { data: existingStreak } = await supabase
    .from("streaks").select("*").eq("partnership_id", partnership.id).single()

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split("T")[0]

  let newStreak = 1
  let longest = 1
  let coinsToAward = 10 // base coins for both answering

  if (existingStreak) {
    if (existingStreak.last_streak_date === today) {
      return existingStreak
    } else if (existingStreak.last_streak_date === yesterdayStr) {
      newStreak = existingStreak.current_streak + 1
    }
    longest = Math.max(existingStreak.longest_streak || 0, newStreak)

    // Bonus coins for milestones
    if (newStreak === 7) coinsToAward += 50
    if (newStreak === 30) coinsToAward += 200

    await supabase.from("streaks").update({
      current_streak: newStreak,
      last_streak_date: today,
      longest_streak: longest,
      updated_at: new Date().toISOString()
    }).eq("id", existingStreak.id)
  } else {
    await supabase.from("streaks").insert({
      partnership_id: partnership.id,
      current_streak: 1,
      last_streak_date: today,
      longest_streak: 1
    })
  }

  // Award coins to both users
  const { data: myProfile } = await supabase.from("profiles").select("coins").eq("id", userId).single()
  const { data: partnerProfile } = await supabase.from("profiles").select("coins").eq("id", partnerId).single()

  await supabase.from("profiles").update({ coins: (myProfile?.coins || 0) + coinsToAward }).eq("id", userId)
  await supabase.from("profiles").update({ coins: (partnerProfile?.coins || 0) + coinsToAward }).eq("id", partnerId)

  return { current_streak: newStreak, longest_streak: longest, coinsAwarded: coinsToAward }
}

export async function getStreak(userId: string) {
  const { data: p1 } = await supabase.from("partners").select("*").eq("user1_id", userId)
  const { data: p2 } = await supabase.from("partners").select("*").eq("user2_id", userId)
  const partnership = p1?.[0] || p2?.[0]
  if (!partnership) return null

  const { data } = await supabase
    .from("streaks").select("*").eq("partnership_id", partnership.id).single()
  return data
}
