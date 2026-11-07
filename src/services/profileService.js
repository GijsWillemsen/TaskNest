import { supabase } from '../supabaseClient'

/**
 * Fetch all family member profiles ordered by points
 */
export async function getFamilyProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('points', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Parent awards custom bonus points to a kid
 */
export async function awardBonusPoints(kidId, pointsToAdd) {
  const points = parseInt(pointsToAdd, 10) || 5

  // Fetch current points
  const { data: currentProfile, error: fetchErr } = await supabase
    .from('profiles')
    .select('points')
    .eq('id', kidId)
    .single()

  if (fetchErr) throw fetchErr

  const updatedPoints = (currentProfile?.points || 0) + points

  const { data, error } = await supabase
    .from('profiles')
    .update({ points: updatedPoints })
    .eq('id', kidId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Permanently delete user account and clean up their tasks/requests
 */
export async function deleteUserAccount(userId) {
  if (!userId) return

  // 1. Release any tasks claimed by or assigned to this user back to open status
  try {
    await supabase
      .from('tasks')
      .update({ claimed_by: null, status: 'open' })
      .eq('claimed_by', userId)
      .in('status', ['claimed', 'pending_approval'])

    await supabase
      .from('tasks')
      .update({ assigned_to: null })
      .eq('assigned_to', userId)

    await supabase
      .from('tasks')
      .update({ transfer_requested_by: null, transfer_requested_name: null })
      .eq('transfer_requested_by', userId)
  } catch (taskErr) {
    console.warn('Task cleanup before account deletion notice:', taskErr)
  }

  // 2. Delete reward requests created by this kid
  try {
    await supabase
      .from('reward_requests')
      .delete()
      .eq('kid_id', userId)
  } catch (rewErr) {
    console.warn('Reward requests cleanup notice:', rewErr)
  }

  // 3. Call SECURITY DEFINER RPC function to delete from auth.users
  let rpcSuccess = false
  try {
    const { error: rpcError } = await supabase.rpc('delete_user_account')
    if (!rpcError) {
      rpcSuccess = true
    } else {
      console.warn('RPC delete_user_account error, attempting direct profile delete fallback:', rpcError.message)
    }
  } catch (rpcEx) {
    console.warn('RPC delete_user_account exception:', rpcEx)
  }

  // 4. Fallback: delete profile record directly if RPC didn't handle it
  if (!rpcSuccess) {
    try {
      await supabase.from('profiles').delete().eq('id', userId)
    } catch (profErr) {
      console.warn('Profile deletion fallback error:', profErr)
    }
  }

  return true
}


