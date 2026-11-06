import { useState } from 'react'
import { useTheme } from '../../context/useTheme'
import {
  Coins,
  CheckCircle2,
  Clock,
  Hand,
  Trash2,
  Undo2,
  Sparkles,
  Award,
  Star,
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
  const { theme } = useTheme()
  const isPlayful = theme === 'playful'

  const isClaimedByMe = task.claimed_by === currentUserId
  const isClaimedBySibling = task.claimed_by && !isClaimedByMe

  const handleClaim = async () => {
    setLoading(true)
    try {
      const updated = await claimTask(task.id, currentUserId)
      onTaskUpdated(updated)
      if (onSuccess) onSuccess(`You claimed "${task.title}"! Good luck!`)
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
      if (onSuccess) onSuccess(`Awesome! "${task.title}" sent to parent for approval.`)
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
      if (onSuccess) onSuccess(`Released "${task.title}" back to open tasks.`)
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

  // Render Discord-styled Status Badge
  const renderStatusBadge = () => {
    switch (task.status) {
      case 'open':
        return (
          <span className="task-status-chip status-open">
            <Sparkles size={12} /> Open
          </span>
        )
      case 'claimed':
        return (
          <span className="task-status-chip status-claimed">
            <Clock size={12} /> In Progress
          </span>
        )
      case 'pending_approval':
        return (
          <span className="task-status-chip status-pending_approval">
            <Clock size={12} /> Needs Approval
          </span>
        )
      case 'completed':
        return (
          <span className="task-status-chip status-completed">
            <CheckCircle2 size={12} /> Completed
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className={`task-card task-card-${task.status}`}>
      <div className="task-card-top">
        <div className="task-header-left">
          {renderStatusBadge()}
          <h3 className="task-title">{task.title}</h3>
        </div>

        <div className="task-points-badge">
          {isPlayful ? <Star size={15} fill="#eab308" color="#ca8a04" /> : <Coins size={15} />}
          <span>+{task.points_value} pts</span>
        </div>
      </div>

      {task.description && <p className="task-description">{task.description}</p>}

      {/* Footer & Actions */}
      <div className="task-card-footer">
        {/* Left claim status */}
        <div className="task-claim-info">
          {task.status === 'open' && (
            <span className="claim-text-open">Open for anyone in family</span>
          )}
          {task.status !== 'open' && (
            <span className="claim-text-user">
              {isClaimedByMe
                ? 'Claimed by you'
                : isClaimedBySibling
                ? 'Claimed by sibling'
                : 'Assigned'}
            </span>
          )}
        </div>

        {/* Right actions */}
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
              Approve (+{task.points_value})
            </button>
          )}

          {/* Any family member (Kid or Parent): Claim open chore */}
          {task.status === 'open' && (
            <button
              onClick={handleClaim}
              className="btn-task-action btn-claim"
              disabled={loading}
            >
              <Hand size={15} />
              Claim
            </button>
          )}

          {/* Any family member (Kid or Parent): My active claimed chore */}
          {task.status === 'claimed' && isClaimedByMe && (
            <>
              <button
                onClick={handleRelease}
                className="btn-task-action btn-unclaim"
                title="Release chore back to open"
                disabled={loading}
              >
                <Undo2 size={14} />
              </button>
              <button
                onClick={handleFinish}
                className="btn-task-action btn-complete"
                disabled={loading}
              >
                <CheckCircle2 size={15} />
                Mark as Done
              </button>
            </>
          )}

          {/* Claimant waiting indicator */}
          {task.status === 'pending_approval' && isClaimedByMe && !isParent && (
            <span className="status-waiting-pill">Under Review ⏳</span>
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
