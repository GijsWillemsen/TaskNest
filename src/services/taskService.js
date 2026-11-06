import { supabase } from '../supabaseClient'

/**
 * Fetch all tasks from Supabase, including the claimant's profile if claimed.
 */
export async function getTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      id,
      title,
      description,
      points_value,
      status,
      claimed_by,
      profiles:claimed_by (
        id,
        role,
        points
      )
    `)
    .order('id', { ascending: false })

  if (error) {
    // If foreign key relation `profiles:claimed_by` isn't declared in PostgREST schema,
    // fallback to a standard flat select
    console.warn('Nested profiles query failed, falling back to flat select:', error.message)
    const { data: flatData, error: flatError } = await supabase
      .from('tasks')
      .select('*')
      .order('id', { ascending: false })

    if (flatError) throw flatError
    return flatData || []
  }

  return data || []
}

/**
 * Parent creates a new chore
 */
export async function createTask({ title, description, points_value }) {
  const points = parseInt(points_value, 10) || 10
  const { data, error } = await supabase
    .from('tasks')
    .insert([
      {
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
 * Kid claims an open chore
 */
export async function claimTask(taskId, kidId) {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      status: 'claimed',
      claimed_by: kidId,
    })
    .eq('id', taskId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Kid unclaims a chore (returns it to 'open')
 */
export async function unclaimTask(taskId) {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      status: 'open',
      claimed_by: null,
    })
    .eq('id', taskId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Kid marks a claimed chore as completed (pending parent approval)
 */
export async function completeTask(taskId) {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      status: 'completed',
    })
    .eq('id', taskId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Parent approves a completed chore:
 * 1. Updates task status to 'approved'
 * 2. Credits points to the kid's profile
 */
export async function approveTask(taskId, kidId, pointsValue) {
  // Step 1: Update the task status to 'approved'
  const { data: taskData, error: taskError } = await supabase
    .from('tasks')
    .update({ status: 'approved' })
    .eq('id', taskId)
    .select()
    .single()

  if (taskError) throw taskError

  // Step 2: Award points to the kid's profile
  if (kidId && pointsValue) {
    // Fetch kid's current points
    const { data: kidProfile, error: profileFetchError } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', kidId)
      .maybeSingle()

    if (!profileFetchError && kidProfile) {
      const updatedPoints = (kidProfile.points || 0) + Number(pointsValue)
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ points: updatedPoints })
        .eq('id', kidId)

      if (profileUpdateError) {
        console.warn('Could not update kid points directly due to RLS:', profileUpdateError.message)
      }
    }
  }

  return taskData
}

/**
 * Parent deletes a chore
 */
export async function deleteTask(taskId) {
  const { error } = await supabase.from('tasks').delete().eq('id', taskId)
  if (error) throw error
  return true
}
