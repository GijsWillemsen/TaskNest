import { supabase } from '../supabaseClient'

/**
 * Fetch all tasks
 */
export async function getTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('id', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Parent creates a new task
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
 * Kid claims an open task (atomic check to avoid race conditions with siblings)
 */
export async function claimTask(taskId, kidId) {
  // Only claim if the task is still currently 'open'
  const { data, error } = await supabase
    .from('tasks')
    .update({
      status: 'claimed',
      claimed_by: kidId,
    })
    .eq('id', taskId)
    .eq('status', 'open')
    .select()

  if (error) throw error

  // If no rows were updated, a sibling just claimed it
  if (!data || data.length === 0) {
    throw new Error('Oops! This task was just claimed by a family member.')
  }

  return data[0]
}

/**
 * Kid marks task as finished (sends to parent for approval)
 */
export async function finishTask(taskId, kidId) {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      status: 'pending_approval',
    })
    .eq('id', taskId)
    .eq('claimed_by', kidId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Kid unclaims/releases an active task back to open
 */
export async function releaseTask(taskId, kidId) {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      status: 'open',
      claimed_by: null,
    })
    .eq('id', taskId)
    .eq('claimed_by', kidId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Parent approves a pending task:
 * 1. Updates task status to 'completed'
 * 2. Credits points to the kid's profile
 */
export async function approveTask(taskId, kidId, pointsValue) {
  // Step 1: Update task status to 'completed'
  const { data: updatedTask, error: taskError } = await supabase
    .from('tasks')
    .update({ status: 'completed' })
    .eq('id', taskId)
    .select()
    .single()

  if (taskError) throw taskError

  // Step 2: Increment the kid's points
  if (kidId && pointsValue) {
    const { data: kidProfile, error: profileFetchError } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', kidId)
      .maybeSingle()

    if (!profileFetchError && kidProfile) {
      const newPoints = (kidProfile.points || 0) + Number(pointsValue)
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ points: newPoints })
        .eq('id', kidId)

      if (profileUpdateError) {
        console.warn('Profile points update warning:', profileUpdateError.message)
      }
    }
  }

  return updatedTask
}

/**
 * Parent deletes a task
 */
export async function deleteTask(taskId) {
  const { error } = await supabase.from('tasks').delete().eq('id', taskId)
  if (error) throw error
  return true
}
