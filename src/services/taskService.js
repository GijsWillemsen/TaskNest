import { supabase } from '../supabaseClient'

/**
 * Fetch all tasks for the active family
 */
export async function getTasks(familyId) {
  let query = supabase.from('tasks').select('*').order('created_at', { ascending: false })

  if (familyId) {
    query = query.eq('family_id', familyId)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

/**
 * Create a new task in the family
 */
export async function createTask({ familyId, title, description, points_value }) {
  const points = parseInt(points_value, 10) || 10

  const { data, error } = await supabase
    .from('tasks')
    .insert([
      {
        family_id: familyId,
        title: title.trim(),
        description: description?.trim() || '',
        points_value: points,
        status: 'open',
        claimed_by: null,
      },
    ])
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Any family member (Kid or Parent) can claim an open task
 */
export async function claimTask(taskId, userId) {
  // Only claim if status is currently 'open'
  const { data, error } = await supabase
    .from('tasks')
    .update({
      status: 'claimed',
      claimed_by: userId,
    })
    .eq('id', taskId)
    .eq('status', 'open')
    .select()

  if (error) throw error

  if (!data || data.length === 0) {
    throw new Error('Oops! This task was just claimed by another family member.')
  }

  return data[0]
}

/**
 * Any family member can finish their claimed task
 */
export async function finishTask(taskId, userId) {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      status: 'pending_approval',
    })
    .eq('id', taskId)
    .eq('claimed_by', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Release an active task back to open
 */
export async function releaseTask(taskId, userId) {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      status: 'open',
      claimed_by: null,
    })
    .eq('id', taskId)
    .eq('claimed_by', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Parent approves a task:
 * 1. Sets task status to 'completed'
 * 2. Awards points to claimant's profile (whether parent or kid)
 */
export async function approveTask(taskId, claimantId, pointsValue) {
  // Step 1: Update task status to 'completed'
  const { data: updatedTask, error: taskError } = await supabase
    .from('tasks')
    .update({ status: 'completed' })
    .eq('id', taskId)
    .select()
    .single()

  if (taskError) throw taskError

  // Step 2: Award points
  if (claimantId && pointsValue) {
    const { data: userProfile, error: profileFetchError } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', claimantId)
      .maybeSingle()

    if (!profileFetchError && userProfile) {
      const newPoints = (userProfile.points || 0) + Number(pointsValue)
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ points: newPoints })
        .eq('id', claimantId)

      if (profileUpdateError) {
        console.warn('Profile points update warning:', profileUpdateError.message)
      }
    }
  }

  return updatedTask
}

/**
 * Delete a task
 */
export async function deleteTask(taskId) {
  const { error } = await supabase.from('tasks').delete().eq('id', taskId)
  if (error) throw error
  return true
}
