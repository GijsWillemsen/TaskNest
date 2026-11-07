import { supabase } from '../supabaseClient'

const DAYS_OF_WEEK = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

/**
 * Helper to calculate the next due date/time based on recurrence pattern
 * Supports multi-day recurrence (e.g. 'monday,wednesday,friday')
 */
export function calculateNextDueDate(recurrence, currentDueDate, recurrenceTime, recurrenceDay) {
  const baseDate = currentDueDate ? new Date(currentDueDate) : new Date()
  const nextDate = new Date(baseDate.getTime())

  if (recurrence === 'daily') {
    nextDate.setDate(nextDate.getDate() + 1)
  } else if (recurrence === 'weekly') {
    if (recurrenceDay) {
      const daysList = recurrenceDay.toLowerCase().split(',').map((d) => d.trim()).filter(Boolean)
      const targetIndices = daysList
        .map((d) => DAYS_OF_WEEK.indexOf(d))
        .filter((idx) => idx !== -1)

      if (targetIndices.length > 0) {
        const currentDayIndex = baseDate.getDay() // 0 = Sunday, 1 = Monday, etc.
        let daysToAdd = null
        for (let i = 1; i <= 7; i++) {
          const candidate = (currentDayIndex + i) % 7
          if (targetIndices.includes(candidate)) {
            daysToAdd = i
            break
          }
        }
        nextDate.setDate(nextDate.getDate() + (daysToAdd || 7))
      } else {
        nextDate.setDate(nextDate.getDate() + 7)
      }
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
 * Create a new task in the family with optional recurrence and assignment
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
  assigned_to = null,
  claimed_by = null,
  status = null,
}) {
  const points = parseInt(points_value, 10) || 10
  const assigneeId = assigned_to || claimed_by || null
  const initialStatus = status || (assigneeId ? 'claimed' : 'open')

  const taskPayload = {
    family_id: familyId,
    title: title.trim(),
    description: description?.trim() || '',
    points_value: points,
    status: initialStatus,
    claimed_by: assigneeId,
    assigned_to: assigneeId,
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
    // Fallback if recurrence or assigned_to columns haven't been migrated yet
    if (error.message && (error.message.includes('column') || error.message.includes('schema cache'))) {
      console.warn('Extended columns not found in database, inserting base task payload:', error.message)
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('tasks')
        .insert([
          {
            family_id: familyId,
            title: title.trim(),
            description: description?.trim() || '',
            points_value: points,
            status: initialStatus,
            claimed_by: assigneeId,
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
      assigned_to: null,
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

      const isOriginallyAssigned = Boolean(updatedTask.assigned_to)

      const nextPayload = {
        family_id: updatedTask.family_id,
        title: updatedTask.title,
        description: updatedTask.description,
        points_value: updatedTask.points_value,
        status: isOriginallyAssigned ? 'claimed' : 'open',
        claimed_by: isOriginallyAssigned ? updatedTask.assigned_to : null,
        assigned_to: updatedTask.assigned_to || null,
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
 * Parent reverts a completed or pending task (e.g. if the kid cheated or didn't complete it).
 * 1. If task was marked 'completed' and had awarded points, deducts the points from the claimant.
 * 2. Resets task status back to 'open' (or 'claimed' if assigned_to is set).
 */
export async function revertTask(taskId) {
  // 1. Fetch current task details
  const { data: task, error: fetchErr } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single()

  if (fetchErr) throw fetchErr

  // 2. If it was completed, deduct points from the claimant
  if (task.status === 'completed' && task.claimed_by && task.points_value) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', task.claimed_by)
      .maybeSingle()

    if (profile) {
      const newPoints = Math.max(0, (profile.points || 0) - Number(task.points_value))
      await supabase
        .from('profiles')
        .update({ points: newPoints })
        .eq('id', task.claimed_by)
    }
  }

  // 3. Reset task to open (or claimed if assigned_to is set)
  const isAssigned = Boolean(task.assigned_to)
  const resetStatus = isAssigned ? 'claimed' : 'open'
  const resetClaimant = isAssigned ? task.assigned_to : null

  const { data: updatedTask, error: updateErr } = await supabase
    .from('tasks')
    .update({
      status: resetStatus,
      claimed_by: resetClaimant,
    })
    .eq('id', taskId)
    .select()
    .single()

  if (updateErr) throw updateErr
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
