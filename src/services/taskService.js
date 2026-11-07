import { supabase } from '../supabaseClient'

const DAYS_OF_WEEK = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

/**
 * Helper to calculate the next due date/time based on recurrence pattern
 */
export function calculateNextDueDate(recurrence, currentDueDate, recurrenceTime, recurrenceDay) {
  const baseDate = currentDueDate ? new Date(currentDueDate) : new Date()
  const nextDate = new Date(baseDate.getTime())

  if (recurrence === 'daily') {
    nextDate.setDate(nextDate.getDate() + 1)
  } else if (recurrence === 'weekly') {
    if (recurrenceDay && DAYS_OF_WEEK.includes(recurrenceDay.toLowerCase())) {
      const targetIndex = DAYS_OF_WEEK.indexOf(recurrenceDay.toLowerCase())
      let daysToAdd = (targetIndex - nextDate.getDay() + 7) % 7
      if (daysToAdd === 0) daysToAdd = 7
      nextDate.setDate(nextDate.getDate() + daysToAdd)
    } else {
      nextDate.setDate(nextDate.getDate() + 7)
    }
  } else if (recurrence === 'monthly') {
    nextDate.setMonth(nextDate.getMonth() + 1)
  } else if (recurrence === 'yearly') {
    nextDate.setFullYear(nextDate.getFullYear() + 1)
  }

  if (recurrenceTime && recurrenceTime.includes(':')) {
    const [hours, minutes] = recurrenceTime.split(':').map(Number)
    if (!isNaN(hours) && !isNaN(minutes)) {
      nextDate.setHours(hours, minutes, 0, 0)
    }
  }

  return nextDate.toISOString()
}

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
 * Create a new task in the family with optional recurrence
 */
export async function createTask({
  familyId,
  title,
  description,
  points_value,
  recurrence = 'none',
  recurrence_time = null,
  recurrence_day = null,
  due_date = null,
}) {
  const points = parseInt(points_value, 10) || 10

  const taskPayload = {
    family_id: familyId,
    title: title.trim(),
    description: description?.trim() || '',
    points_value: points,
    status: 'open',
    claimed_by: null,
  }

  if (recurrence && recurrence !== 'none') {
    taskPayload.recurrence = recurrence
    taskPayload.recurrence_time = recurrence_time || null
    taskPayload.recurrence_day = recurrence_day || null
    taskPayload.due_date = due_date || null
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert([taskPayload])
    .select()
    .single()

  if (error) {
    // Fallback if recurrence columns haven't been migrated yet
    if (error.message && (error.message.includes('column') || error.message.includes('schema cache'))) {
      console.warn('Recurrence columns not found in database, inserting base task payload:', error.message)
      const { data: fallbackData, error: fallbackError } = await supabase
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
      if (fallbackError) throw fallbackError
      return fallbackData
    }
    throw error
  }
  return data
}

/**
 * Any family member (Kid or Parent) can claim an open task
 */
export async function claimTask(taskId, userId) {
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
 * Any family member can finish a task (either an open task directly, or their claimed task).
 * Sets status to 'pending_approval' and records claimant as userId.
 */
export async function finishTask(taskId, userId) {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      status: 'pending_approval',
      claimed_by: userId,
    })
    .eq('id', taskId)
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
 * 2. Awards points to claimant's profile
 * 3. If recurring, automatically spawns the next task instance for the family
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

  // Step 3: If recurring, auto-create next task instance
  let nextTask = null
  if (updatedTask && updatedTask.recurrence && updatedTask.recurrence !== 'none') {
    try {
      const nextDue = calculateNextDueDate(
        updatedTask.recurrence,
        updatedTask.due_date,
        updatedTask.recurrence_time,
        updatedTask.recurrence_day
      )

      const nextPayload = {
        family_id: updatedTask.family_id,
        title: updatedTask.title,
        description: updatedTask.description,
        points_value: updatedTask.points_value,
        status: 'open',
        claimed_by: null,
        recurrence: updatedTask.recurrence,
        recurrence_time: updatedTask.recurrence_time,
        recurrence_day: updatedTask.recurrence_day,
        due_date: nextDue,
      }

      const { data: createdNext, error: nextError } = await supabase
        .from('tasks')
        .insert([nextPayload])
        .select()
        .single()

      if (!nextError && createdNext) {
        nextTask = createdNext
      }
    } catch (recErr) {
      console.warn('Could not auto-generate next recurring task instance:', recErr)
    }
  }

  return { updatedTask, nextTask }
}

/**
 * Delete a task
 */
export async function deleteTask(taskId) {
  const { error } = await supabase.from('tasks').delete().eq('id', taskId)
  if (error) throw error
  return true
}
