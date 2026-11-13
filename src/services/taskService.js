import { supabase } from '../supabaseClient'
import { createFamilyNotification } from './notificationService'

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
 * Fetch all tasks for the active family, automatically excluding completed tasks older than 24 hours
 */
export async function getTasks(familyId) {
  let query = supabase.from('tasks').select('*').order('created_at', { ascending: false })

  if (familyId) {
    query = query.eq('family_id', familyId)
  }

  const { data, error } = await query
  if (error) throw error

  // Filter out completed tasks older than 24 hours (86,400,000 ms)
  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000
  const now = Date.now()

  const validTasks = (data || []).filter((task) => {
    if (task.status === 'completed') {
      const completionTime = task.completed_at || task.created_at
      if (completionTime && (now - new Date(completionTime).getTime() > TWENTY_FOUR_HOURS_MS)) {
        return false
      }
    }
    return true
  })

  // Silently prune expired completed tasks older than 24 hours in the background
  try {
    const expiredTimestamp = new Date(now - TWENTY_FOUR_HOURS_MS).toISOString()
    supabase
      .from('tasks')
      .delete()
      .eq('status', 'completed')
      .lt('created_at', expiredTimestamp)
      .then(() => {})
      .catch(() => {})
  } catch {
    // silent background prune
  }

  return validTasks
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
  eligible_assignees = null,
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

  if (eligible_assignees && Array.isArray(eligible_assignees) && eligible_assignees.length > 0) {
    taskPayload.eligible_assignees = eligible_assignees
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
    // Fallback if recurrence, assigned_to or eligible_assignees columns haven't been migrated yet
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
      if (assigneeId && fallbackData?.id) {
        createFamilyNotification({
          familyId,
          userId: assigneeId,
          title: 'Nieuw klusje toegewezen! 🎯',
          body: `"${title.trim()}" (+${points} pt) is aan jou toegewezen door een ouder.`,
          type: 'task_assigned',
          taskId: fallbackData.id,
        })
      }
      return fallbackData
    }
    throw error
  }

  if (assigneeId && data?.id) {
    createFamilyNotification({
      familyId,
      userId: assigneeId,
      title: 'Nieuw klusje toegewezen! 🎯',
      body: `"${title.trim()}" (+${points} pt) is aan jou toegewezen door een ouder.`,
      type: 'task_assigned',
      taskId: data.id,
    })
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
 * Any family member can finish a task.
 * - If done by a PARENT: automatically completes without needing approval, awards points immediately!
 * - If done by a KID: sets status to 'pending_approval' for parent verification.
 */
export async function finishTask(taskId, userId, role = 'kid', pointsValue = null) {
  if (role === 'parent') {
    // Parent auto-approval: completes directly and awards points immediately!
    return await approveTask(taskId, userId, pointsValue)
  }

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

  if (data) {
    createFamilyNotification({
      familyId: data.family_id,
      targetRole: 'parent',
      senderId: userId,
      title: 'Klusje ter goedkeuring ⏳',
      body: `Het klusje "${data.title}" is voltooid en wacht op jouw controle.`,
      type: 'task_completed',
      taskId: data.id,
    })
  }

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
 * Approves a task:
 * 1. Sets task status to 'completed' and records completed_at timestamp
 * 2. Awards points to claimant's profile
 * 3. If recurring, automatically spawns the next task instance for the family
 */
export async function approveTask(taskId, claimantId, pointsValue) {
  const nowIso = new Date().toISOString()

  // Step 1: Update task status to 'completed' and record completed_at
  let updatedTask
  const { data: updateWithTimestamp, error: taskError } = await supabase
    .from('tasks')
    .update({
      status: 'completed',
      completed_at: nowIso,
      claimed_by: claimantId || undefined,
    })
    .eq('id', taskId)
    .select()
    .single()

  if (taskError) {
    // If completed_at column hasn't been migrated yet in database, fallback
    const { data: updateFallback, error: fallbackError } = await supabase
      .from('tasks')
      .update({
        status: 'completed',
        claimed_by: claimantId || undefined,
      })
      .eq('id', taskId)
      .select()
      .single()

    if (fallbackError) throw fallbackError
    updatedTask = { ...updateFallback, completed_at: nowIso }
  } else {
    updatedTask = updateWithTimestamp
  }

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

  // Notify claimant about approval and earned points
  if (claimantId && updatedTask) {
    createFamilyNotification({
      familyId: updatedTask.family_id,
      userId: claimantId,
      title: 'Klusje goedgekeurd! 🎉',
      body: `Goed gedaan! Je hebt +${pointsValue || updatedTask.points_value || 0} punten verdiend met "${updatedTask.title}".`,
      type: 'task_approved',
      taskId: updatedTask.id,
    })
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

/**
 * Request to take over / transfer a claimed task
 */
export async function requestTaskTransfer(taskId, requesterId, requesterName) {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      transfer_requested_by: requesterId,
      transfer_requested_name: requesterName,
    })
    .eq('id', taskId)
    .eq('status', 'claimed')
    .select()
    .single()

  if (error) throw error

  if (data?.claimed_by) {
    createFamilyNotification({
      familyId: data.family_id,
      userId: data.claimed_by,
      senderId: requesterId,
      senderName: requesterName,
      title: 'Verzoek tot overname 🔄',
      body: `${requesterName || 'Een gezinslid'} vraagt om jouw klusje "${data.title}" over te nemen.`,
      type: 'task_transfer',
      taskId: data.id,
    })
  }

  return data
}

/**
 * Accept a pending task transfer request
 */
export async function acceptTaskTransfer(taskId) {
  const { data: task, error: fetchErr } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single()

  if (fetchErr) throw fetchErr
  if (!task.transfer_requested_by) {
    throw new Error('Geen overnameverzoek gevonden.')
  }

  const newClaimant = task.transfer_requested_by

  const { data, error } = await supabase
    .from('tasks')
    .update({
      claimed_by: newClaimant,
      transfer_requested_by: null,
      transfer_requested_name: null,
    })
    .eq('id', taskId)
    .select()
    .single()

  if (error) throw error

  if (data) {
    createFamilyNotification({
      familyId: data.family_id,
      userId: newClaimant,
      title: 'Overname geaccepteerd! 🤝',
      body: `Het klusje "${data.title}" is nu aan jou overgedragen. Veel succes!`,
      type: 'task_transfer_accepted',
      taskId: data.id,
    })
  }

  return data
}

/**
 * Decline or cancel a pending task transfer request
 */
export async function cancelTaskTransfer(taskId) {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      transfer_requested_by: null,
      transfer_requested_name: null,
    })
    .eq('id', taskId)
    .select()
    .single()

  if (error) throw error
  return data
}
