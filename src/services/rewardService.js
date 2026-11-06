import { supabase } from '../supabaseClient'

/**
 * Fetch all available catalog rewards
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
 * Parent creates a new reward in the catalog
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
 * Parent deletes a reward from the catalog
 */
export async function deleteReward(rewardId) {
  const { error } = await supabase.from('rewards').delete().eq('id', rewardId)
  if (error) throw error
  return true
}

/**
 * Kid requests to buy a reward (creates a pending reward_request)
 */
export async function requestReward({ rewardId, kidId }) {
  const { data, error } = await supabase
    .from('reward_requests')
    .insert([
      {
        reward_id: rewardId,
        kid_id: kidId,
        status: 'pending',
      },
    ])
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Fetch all reward requests (joins reward and profile info if available)
 */
export async function getRewardRequests() {
  try {
    const { data, error } = await supabase
      .from('reward_requests')
      .select(`
        id,
        reward_id,
        kid_id,
        status,
        created_at,
        rewards:reward_id (id, title, description, cost),
        profiles:kid_id (id, role, points)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('Nested join failed on reward_requests, trying flat select:', error.message)
      const { data: flatData, error: flatError } = await supabase
        .from('reward_requests')
        .select('*')
        .order('created_at', { ascending: false })

      if (flatError) throw flatError
      return flatData || []
    }

    return data || []
  } catch (err) {
    console.error('Error fetching reward requests:', err)
    return []
  }
}

/**
 * Parent approves a reward request:
 * 1. Checks if the kid still has enough points.
 * 2. Deducts the reward cost from profiles.points.
 * 3. Sets request status to 'approved'.
 */
export async function approveRewardRequest({ requestId, rewardCost, kidId }) {
  // Step 1: Check kid's latest points
  const { data: kidProfile, error: profileErr } = await supabase
    .from('profiles')
    .select('points')
    .eq('id', kidId)
    .single()

  if (profileErr) throw profileErr

  const currentPoints = kidProfile?.points ?? 0
  const cost = Number(rewardCost) || 0

  if (currentPoints < cost) {
    throw new Error(
      `Kid no longer has enough points! Required: ${cost} pts, Current: ${currentPoints} pts.`
    )
  }

  // Step 2: Deduct points from profile
  const remainingPoints = currentPoints - cost
  const { error: deductErr } = await supabase
    .from('profiles')
    .update({ points: remainingPoints })
    .eq('id', kidId)

  if (deductErr) throw deductErr

  // Step 3: Mark request as approved
  const { data: updatedRequest, error: reqErr } = await supabase
    .from('reward_requests')
    .update({ status: 'approved' })
    .eq('id', requestId)
    .select()
    .single()

  if (reqErr) throw reqErr

  return { updatedRequest, remainingPoints }
}

/**
 * Parent rejects a reward request (no points deducted)
 */
export async function rejectRewardRequest(requestId) {
  const { data, error } = await supabase
    .from('reward_requests')
    .update({ status: 'rejected' })
    .eq('id', requestId)
    .select()
    .single()

  if (error) throw error
  return data
}
