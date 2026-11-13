import { supabase } from '../supabaseClient'
import { createFamilyNotification } from './notificationService'

/**
 * Fetch all available catalog rewards for a family
 */
export async function getRewards(familyId) {
  let query = supabase.from('rewards').select('*').order('cost', { ascending: true })

  if (familyId) {
    query = query.eq('family_id', familyId)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

/**
 * Parent creates a new reward in the catalog
 */
export async function createReward({ familyId, title, description, cost }) {
  const pointsCost = parseInt(cost, 10) || 20
  const { data, error } = await supabase
    .from('rewards')
    .insert([
      {
        family_id: familyId,
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
 * Kid purchases a reward ticket with points.
 * 1. Checks if kid has enough points.
 * 2. Deducts points immediately from kid's profile.
 * 3. Adds ticket to reward_requests with status 'available'.
 */
export async function purchaseRewardTicket({ familyId, rewardId, kidId, cost }) {
  const pointsCost = Number(cost) || 0

  // Verify points
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('points')
    .eq('id', kidId)
    .single()

  if (profileErr) throw profileErr
  const currentPoints = profile?.points ?? 0

  if (currentPoints < pointsCost) {
    throw new Error('Not enough points to purchase this ticket.')
  }

  // Deduct points
  const remainingPoints = currentPoints - pointsCost
  const { error: deductErr } = await supabase
    .from('profiles')
    .update({ points: remainingPoints })
    .eq('id', kidId)

  if (deductErr) throw deductErr

  // Create ticket in inventory
  const { data: ticket, error: ticketErr } = await supabase
    .from('reward_requests')
    .insert([
      {
        family_id: familyId,
        reward_id: rewardId,
        kid_id: kidId,
        status: 'available',
      },
    ])
    .select(`
      id,
      family_id,
      reward_id,
      kid_id,
      status,
      created_at,
      rewards:reward_id (id, title, description, cost),
      profiles:kid_id (id, role, points, display_name)
    `)
    .single()

  if (ticketErr) throw ticketErr

  return { ticket, remainingPoints }
}

/**
 * Kid requests to use an existing ticket from their inventory.
 * Sets status from 'available' to 'pending'.
 */
export async function redeemRewardTicket(ticketId) {
  const { data, error } = await supabase
    .from('reward_requests')
    .update({ status: 'pending' })
    .eq('id', ticketId)
    .select(`
      id,
      family_id,
      reward_id,
      kid_id,
      status,
      created_at,
      rewards:reward_id (id, title, description, cost),
      profiles:kid_id (id, role, points, display_name)
    `)
    .single()

  if (error) throw error

  if (data) {
    const kidName = data.profiles?.display_name || 'Een gezinslid'
    const rewardTitle = data.rewards?.title || 'beloning'
    createFamilyNotification({
      familyId: data.family_id,
      targetRole: 'parent',
      senderId: data.kid_id,
      senderName: kidName,
      title: 'Beloning verzilveren 🎁',
      body: `${kidName} wil een ticket inleveren voor: "${rewardTitle}".`,
      type: 'reward_requested',
    })
  }

  return data
}

// Deprecated alias for backwards compatibility
export const useRewardTicket = redeemRewardTicket

/**
 * Parent approves ticket usage. Sets status to 'approved' (used).
 */
export async function approveRewardTicket(ticketId) {
  const { data, error } = await supabase
    .from('reward_requests')
    .update({ status: 'approved' })
    .eq('id', ticketId)
    .select(`
      id,
      family_id,
      reward_id,
      kid_id,
      status,
      created_at,
      rewards:reward_id (id, title, description, cost),
      profiles:kid_id (id, role, points, display_name)
    `)
    .single()

  if (error) throw error

  if (data) {
    const rewardTitle = data.rewards?.title || 'beloning'
    createFamilyNotification({
      familyId: data.family_id,
      userId: data.kid_id,
      title: 'Beloning goedgekeurd! 🥳',
      body: `Veel plezier met je beloning: "${rewardTitle}"!`,
      type: 'reward_approved',
    })
  }

  return { updatedRequest: data }
}

/**
 * Parent declines ticket usage. Returns ticket to 'available' so kid still has it!
 */
export async function rejectRewardTicket(ticketId) {
  const { data, error } = await supabase
    .from('reward_requests')
    .update({ status: 'available' })
    .eq('id', ticketId)
    .select(`
      id,
      family_id,
      reward_id,
      kid_id,
      status,
      created_at,
      rewards:reward_id (id, title, description, cost),
      profiles:kid_id (id, role, points, display_name)
    `)
    .single()

  if (error) throw error
  return data
}

/**
 * Fetch all reward requests / tickets for a family
 */
export async function getRewardRequests(familyId) {
  try {
    let query = supabase
      .from('reward_requests')
      .select(`
        id,
        family_id,
        reward_id,
        kid_id,
        status,
        created_at,
        rewards:reward_id (id, title, description, cost),
        profiles:kid_id (id, role, points, display_name)
      `)
      .order('created_at', { ascending: false })

    if (familyId) {
      query = query.eq('family_id', familyId)
    }

    const { data, error } = await query

    if (error) {
      console.warn('Nested join failed on reward_requests, falling back to flat select:', error.message)
      let flatQuery = supabase
        .from('reward_requests')
        .select('*')
        .order('created_at', { ascending: false })

      if (familyId) {
        flatQuery = flatQuery.eq('family_id', familyId)
      }

      const { data: flatData, error: flatError } = await flatQuery
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
 * Aliases for backwards compatibility
 */
export const requestReward = purchaseRewardTicket
export const approveRewardRequest = approveRewardTicket
export const rejectRewardRequest = rejectRewardTicket
