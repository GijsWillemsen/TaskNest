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

