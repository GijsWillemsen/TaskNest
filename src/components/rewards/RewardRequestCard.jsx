import { useState } from 'react'
import { CheckCircle2, XCircle, Clock, Coins, Sparkles } from 'lucide-react'
import { approveRewardRequest, rejectRewardRequest } from '../../services/rewardService'

export default function RewardRequestCard({
  request,
  isParent,
  onRequestUpdated,
  onError,
  onSuccess,
}) {
  const [loading, setLoading] = useState(false)

  const reward = request.rewards || {
    title: 'Reward item',
    cost: request.cost || 0,
    description: '',
  }

  const handleApprove = async () => {
    if (!window.confirm(`Approve reward "${reward.title}" for ${reward.cost} points?`)) return

    setLoading(true)
    try {
      const res = await approveRewardRequest({
        requestId: request.id,
        rewardCost: reward.cost,
        kidId: request.kid_id,
      })
      if (onRequestUpdated) {
        onRequestUpdated(res.updatedRequest)
      }
      if (onSuccess) {
        onSuccess(`Approved "${reward.title}"! Deducted ${reward.cost} points.`)
      }
    } catch (err) {
      if (onError) onError(err.message || 'Failed to approve request.')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!window.confirm(`Decline purchase request for "${reward.title}"?`)) return

    setLoading(true)
    try {
      const updated = await rejectRewardRequest(request.id)
      if (onRequestUpdated) {
        onRequestUpdated(updated)
      }
      if (onSuccess) {
        onSuccess(`Declined request for "${reward.title}". No points deducted.`)
      }
    } catch (err) {
      if (onError) onError(err.message || 'Failed to decline request.')
    } finally {
      setLoading(false)
    }
  }

  const renderStatusBadge = () => {
    switch (request.status) {
      case 'pending':
        return (
          <span className="task-status-chip status-pending_approval">
            <Clock size={12} /> Pending Approval
          </span>
        )
      case 'approved':
        return (
          <span className="task-status-chip status-completed">
            <CheckCircle2 size={12} /> Approved
          </span>
        )
      case 'rejected':
        return (
          <span
            className="task-status-chip"
            style={{
              background: 'rgba(237, 66, 69, 0.12)',
              color: 'var(--discord-red)',
              border: '1px solid rgba(237, 66, 69, 0.35)',
            }}
          >
            <XCircle size={12} /> Declined
          </span>
        )
      default:
        return null
    }
  }

  const formattedDate = request.created_at
    ? new Date(request.created_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : ''

  return (
    <div className={`reward-card reward-card-request status-${request.status}`}>
      <div className="reward-top">
        <div className="reward-title-group">
          {renderStatusBadge()}
          <h3 className="reward-title" style={{ marginTop: '0.25rem' }}>
            {reward.title}
          </h3>
          {formattedDate && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              Requested {formattedDate}
            </span>
          )}
        </div>

        <div className="reward-cost-badge">
          <Coins size={15} />
          <span>{reward.cost}</span>
        </div>
      </div>

      <div className="reward-footer" style={{ marginTop: '0.25rem' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {isParent ? (
            <span>
              Requested by: {request.profiles?.display_name || 'Kid'}
            </span>
          ) : request.status === 'approved' ? (
            <span style={{ color: 'var(--discord-green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Sparkles size={13} /> Unlocked! Enjoy your reward!
            </span>
          ) : request.status === 'pending' ? (
            <span style={{ color: 'var(--discord-yellow)' }}>
              Waiting for parent to approve...
            </span>
          ) : (
            <span style={{ color: 'var(--discord-red)' }}>Declined by parent</span>
          )}
        </div>

        {/* Actions for Parent on pending requests */}
        {isParent && request.status === 'pending' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={handleReject}
              className="btn-task-action btn-unclaim"
              style={{ color: 'var(--discord-red)', borderColor: 'rgba(237, 66, 69, 0.4)' }}
              disabled={loading}
              title="Decline request"
            >
              <XCircle size={15} />
              Decline
            </button>

            <button
              onClick={handleApprove}
              className="btn-task-action btn-approve"
              disabled={loading}
              title="Approve and deduct points"
            >
              <CheckCircle2 size={15} />
              Approve (-{reward.cost})
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
