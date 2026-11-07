import { useState } from 'react'
import {
  Coins,
  Check,
  Hand,
  Trash2,
  Undo2,
  Award,
  RotateCw,
} from 'lucide-react'
import {
  claimTask,
  finishTask,
  releaseTask,
  approveTask,
  deleteTask,
} from '../../services/taskService'
import { useLanguage } from '../../context/useLanguage'

export default function TaskCard({
  task,
  isParent,
  currentUserId,
  onTaskUpdated,
  onTaskDeleted,
  onError,
  onSuccess,
}) {
  const { t, isDutch } = useLanguage()
  const [loading, setLoading] = useState(false)

  const isClaimedByMe = task.claimed_by === currentUserId
  const isClaimedBySibling = task.claimed_by && !isClaimedByMe

  const formatRecurrenceText = (tObj) => {
    const { recurrence, recurrence_time, recurrence_day } = tObj
    if (!recurrence || recurrence === 'none') return null

    let freqText = ''
    if (recurrence === 'daily') {
      freqText = t('tasks.repeats_daily')
    } else if (recurrence === 'weekly') {
      const dayName = recurrence_day
        ? (t(`tasks.days.${recurrence_day.toLowerCase()}`) || recurrence_day)
        : ''
      freqText = dayName ? t('tasks.repeats_weekly', { day: dayName }) : t('tasks.recurrence_weekly')
    } else if (recurrence === 'monthly') {
      freqText = t('tasks.repeats_monthly')
    } else if (recurrence === 'yearly') {
      freqText = t('tasks.repeats_yearly')
    }

    if (recurrence_time) {
      freqText += ` ${t('tasks.at_time', { time: recurrence_time })}`
    }

    return freqText
  }

  const handleClaim = async () => {
    setLoading(true)
    try {
      const updated = await claimTask(task.id, currentUserId)
      onTaskUpdated(updated)
      if (onSuccess) onSuccess(t('tasks.claimed_success', { title: task.title }))
    } catch (err) {
      if (onError) onError(err.message || 'Failed to claim task.')
    } finally {
      setLoading(false)
    }
  }

  const handleFinish = async () => {
    setLoading(true)
    try {
      const updated = await finishTask(task.id, currentUserId)
      onTaskUpdated(updated)
      if (onSuccess) onSuccess(t('tasks.finished_success', { title: task.title }))
    } catch (err) {
      if (onError) onError(err.message || 'Failed to submit task.')
    } finally {
      setLoading(false)
    }
  }

  const handleRelease = async () => {
    setLoading(true)
    try {
      const updated = await releaseTask(task.id, currentUserId)
      onTaskUpdated(updated)
      if (onSuccess) onSuccess(t('tasks.released_success', { title: task.title }))
    } catch (err) {
      if (onError) onError(err.message || 'Failed to release task.')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    setLoading(true)
    try {
      const res = await approveTask(task.id, task.claimed_by, task.points_value)
      onTaskUpdated(res)
      if (onSuccess) onSuccess(t('tasks.approved_success', { title: task.title, points: task.points_value }))
    } catch (err) {
      if (onError) onError(err.message || 'Failed to approve task.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    const confirmPrompt = isDutch
      ? `Weet je zeker dat je klusje "${task.title}" wilt verwijderen?`
      : `Delete chore "${task.title}"?`
    if (!window.confirm(confirmPrompt)) return
    setLoading(true)
    try {
      await deleteTask(task.id)
      onTaskDeleted(task.id)
      if (onSuccess) onSuccess(t('tasks.deleted_success', { title: task.title }))
    } catch (err) {
      if (onError) onError(err.message || 'Failed to delete chore.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`task-card task-card-${task.status}`}>
      {/* Top row: Title & Recurrence on left, Coin + amount on right */}
      <div className="task-card-top">
        <div className="task-header-left">
          <h3 className="task-title">{task.title}</h3>
          {task.recurrence && task.recurrence !== 'none' && (
            <div className="task-recurrence-badge">
              <RotateCw size={12} className="recurrence-icon" />
              <span>{formatRecurrenceText(task)}</span>
            </div>
          )}
        </div>

        <div className="task-points-badge" title={`${task.points_value} points`}>
          <Coins size={16} />
          <span>{task.points_value}</span>
        </div>
      </div>

      {task.description && <p className="task-description">{task.description}</p>}

      {/* Footer & Actions */}
      <div className="task-card-footer" style={{ justifyContent: 'flex-end' }}>
        {/* Actions */}
        <div className="task-actions-group">
          {/* Parent: Approve pending chore */}
          {isParent && task.status === 'pending_approval' && (
            <button
              onClick={handleApprove}
              className="btn-task-action btn-approve"
              disabled={loading}
              title={t('tasks.approve_button')}
            >
              <Award size={15} />
              <span>{t('tasks.approve_button')} ({task.points_value})</span>
            </button>
          )}

          {/* Open chore: Claim (Hand icon) or Finish directly (Check mark) */}
          {task.status === 'open' && (
            <>
              <button
                onClick={handleClaim}
                className="btn-task-action btn-claim btn-icon-action"
                disabled={loading}
                title={t('tasks.claim_tooltip')}
                aria-label={t('tasks.claim_tooltip')}
              >
                <Hand size={16} />
              </button>
              <button
                onClick={handleFinish}
                className="btn-task-action btn-complete btn-icon-action"
                disabled={loading}
                title={t('tasks.finish_tooltip')}
                aria-label={t('tasks.finish_tooltip')}
              >
                <Check size={18} strokeWidth={2.6} />
              </button>
            </>
          )}

          {/* My active claimed chore: Release (Undo) or Finish (Check mark) */}
          {task.status === 'claimed' && isClaimedByMe && (
            <>
              <button
                onClick={handleRelease}
                className="btn-task-action btn-unclaim btn-icon-action"
                title={t('tasks.release_tooltip')}
                aria-label={t('tasks.release_tooltip')}
                disabled={loading}
              >
                <Undo2 size={15} />
              </button>
              <button
                onClick={handleFinish}
                className="btn-task-action btn-complete btn-icon-action"
                disabled={loading}
                title={t('tasks.finish_tooltip')}
                aria-label={t('tasks.finish_tooltip')}
              >
                <Check size={18} strokeWidth={2.6} />
              </button>
            </>
          )}

          {/* Claimant waiting indicator */}
          {task.status === 'pending_approval' && isClaimedByMe && !isParent && (
            <span className="status-waiting-pill">{t('tasks.under_review')}</span>
          )}

          {/* Sibling claimed indicator */}
          {task.status === 'claimed' && isClaimedBySibling && (
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
              {t('tasks.claimed_by_family')}
            </span>
          )}

          {/* Parent: Delete button */}
          {isParent && (
            <button
              onClick={handleDelete}
              className="btn-task-delete"
              title={t('common.delete')}
              disabled={loading}
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
