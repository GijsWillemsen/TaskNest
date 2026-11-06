import { useState } from 'react'
import {
  Coins,
  Check,
  Hand,
  Trash2,
  Undo2,
  Award,
} from 'lucide-react'
import {
  claimTask,
  finishTask,
  releaseTask,
  approveTask,
  deleteTask,
} from '../../services/taskService'

export default function TaskCard({
  task,
  isParent,
  currentUserId,
  onTaskUpdated,
  onTaskDeleted,
  onError,
  onSuccess,
}) {
  const [loading, setLoading] = useState(false)

  const isClaimedByMe = task.claimed_by === currentUserId
  const isClaimedBySibling = task.claimed_by && !isClaimedByMe

  const handleClaim = async () => {
    setLoading(true)
    try {
      const updated = await claimTask(task.id, currentUserId)
      onTaskUpdated(updated)
      if (onSuccess) onSuccess(`You claimed "${task.title}"!`)
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
      if (onSuccess) onSuccess(`"${task.title}" marked as done! Waiting for approval.`)
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
      if (onSuccess) onSuccess(`Released "${task.title}" back to open chores.`)
    } catch (err) {
      if (onError) onError(err.message || 'Failed to release task.')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    setLoading(true)
    try {
      const updated = await approveTask(task.id, task.claimed_by, task.points_value)
      onTaskUpdated(updated)
      if (onSuccess) onSuccess(`Approved "${task.title}"! +${task.points_value} points awarded.`)
    } catch (err) {
      if (onError) onError(err.message || 'Failed to approve task.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`Delete chore "${task.title}"?`)) return
    setLoading(true)
    try {
      await deleteTask(task.id)
      onTaskDeleted(task.id)
      if (onSuccess) onSuccess(`Chore "${task.title}" removed.`)
    } catch (err) {
      if (onError) onError(err.message || 'Failed to delete chore.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`task-card task-card-${task.status}`}>
      {/* Top row: Title on left, Coin + amount on right */}
      <div className="task-card-top">
        <h3 className="task-title">{task.title}</h3>

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
              title="Approve and award points"
            >
              <Award size={15} />
              <span>Approve ({task.points_value})</span>
            </button>
          )}

          {/* Open chore: Claim (Hand icon) or Finish directly (Check mark) */}
          {task.status === 'open' && (
            <>
              <button
                onClick={handleClaim}
                className="btn-task-action btn-claim btn-icon-action"
                disabled={loading}
                title="Claim chore"
                aria-label="Claim chore"
              >
                <Hand size={16} />
              </button>
              <button
                onClick={handleFinish}
                className="btn-task-action btn-complete btn-icon-action"
                disabled={loading}
                title="Mark chore as finished"
                aria-label="Mark chore as finished"
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
                title="Release chore back to open"
                aria-label="Release chore back to open"
                disabled={loading}
              >
                <Undo2 size={15} />
              </button>
              <button
                onClick={handleFinish}
                className="btn-task-action btn-complete btn-icon-action"
                disabled={loading}
                title="Mark chore as finished"
                aria-label="Mark chore as finished"
              >
                <Check size={18} strokeWidth={2.6} />
              </button>
            </>
          )}

          {/* Claimant waiting indicator */}
          {task.status === 'pending_approval' && isClaimedByMe && !isParent && (
            <span className="status-waiting-pill">Under Review ⏳</span>
          )}

          {/* Sibling claimed indicator */}
          {task.status === 'claimed' && isClaimedBySibling && (
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
              Claimed by family member
            </span>
          )}

          {/* Parent: Delete button */}
          {isParent && (
            <button
              onClick={handleDelete}
              className="btn-task-delete"
              title="Delete chore"
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
