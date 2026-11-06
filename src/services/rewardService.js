import { supabase } from '../supabaseClient'

/**
 * Fetch all available rewards
 */
export async function getRewards() {
  const { data, error } = await supabase
    .from('rewards')
    .select('*')
    .order('cost', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Parent creates a new reward
 */
export async function createReward({ title, description, cost }) {
  const pointsCost = parseInt(cost, 10) || 20
  const { data, error } = await supabase
    .from('rewards')
    .insert([
      {
        title: title.trim(),
        description: description?.trim() || '',
        cost: pointsCost,
      },
    ])
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Parent deletes a reward
 */
export async function deleteReward(rewardId) {
  const { error } = await supabase.from('rewards').delete().eq('id', rewardId)
  if (error) throw error
  return true
}

/**
 * Kid redeems a reward using their points
 */
export async function redeemReward({ reward, kidId, currentPoints }) {
  if (currentPoints < reward.cost) {
    throw new Error(`You need ${reward.cost} points, but you have ${currentPoints}. Keep doing chores!`)
  }

  const remainingPoints = currentPoints - reward.cost

  // Deduct points from kid's profile
  const { data, error } = await supabase
    .from('profiles')
    .update({ points: remainingPoints })
    .eq('id', kidId)
    .select()
    .single()

  if (error) throw error
  return { success: true, remainingPoints, profile: data }
}
