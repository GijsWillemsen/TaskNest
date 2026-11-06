import { useState } from 'react'
import { Coins, Trash2, ShoppingBag, Sparkles, Lock } from 'lucide-react'
import { deleteReward, requestReward } from '../../services/rewardService'

export default function RewardCard({
  reward,
  isParent,
  kidId,
  kidPoints = 0,
  familyId,
  onRewardDeleted,
  onRewardRequested,
  onError,
  onSuccess,
}) {
  const [submitting, setSubmitting] = useState(false)

  const currentPoints = Number(kidPoints) || 0
  const canAfford = currentPoints >= reward.cost
  const percentComplete = reward.cost > 0 ? Math.min(100, Math.round((currentPoints / reward.cost) * 100)) : 100

  const handleRequestBuy = async () => {
    if (!canAfford) return
    if (!window.confirm(`Request to buy "${reward.title}" for ${reward.cost} points?`)) return

    setSubmitting(true)
    try {
      const newRequest = await requestReward({
        familyId: familyId || reward.family_id,
        rewardId: reward.id,
        kidId,
      })
      if (onRewardRequested) {
        onRewardRequested(newRequest)
      }
      if (onSuccess) {
        onSuccess(`🎉 Request sent for "${reward.title}"! Waiting for parent approval.`)
      }
    } catch (err) {
      if (onError) onError(err.message || 'Failed to submit reward request.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`Delete reward "${reward.title}" from the catalog?`)) return

    setSubmitting(true)
    try {
      await deleteReward(reward.id)
      if (onRewardDeleted) onRewardDeleted(reward.id)
      if (onSuccess) onSuccess(`Reward "${reward.title}" removed.`)
    } catch (err) {
      if (onError) onError(err.message || 'Failed to delete reward.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={`reward-card ${canAfford ? 'can-afford' : ''}`}>
      <div className="reward-top">
        <div className="reward-title-group">
          <h3 className="reward-title">{reward.title}</h3>
        </div>

        <div className="reward-cost-badge" title={`${reward.cost} points required`}>
          <Coins size={16} />
          <span>{reward.cost}</span>
        </div>
      </div>

      {reward.description && (
        <p className="reward-description">{reward.description}</p>
      )}

      {/* Kid Points Progress */}
      {!isParent && (
        <div className="reward-progress-box">
          <div className="progress-labels">
            <span>Progress</span>
            <span>{canAfford ? 'Ready to purchase!' : `${percentComplete}%`}</span>
          </div>
          <div className="progress-track">
            <div
              className={`progress-fill ${canAfford ? 'full' : ''}`}
              style={{ width: `${percentComplete}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer & Actions */}
      <div className="reward-footer">
        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
          {canAfford ? (
            <span style={{ color: 'var(--discord-yellow)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Sparkles size={13} /> Affordable
            </span>
          ) : (
            <span>🪙 {reward.cost - currentPoints} needed</span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Kid: Request to Buy Button */}
          {!isParent && (
            <button
              onClick={handleRequestBuy}
              className="btn-redeem"
              style={{
                background: canAfford ? 'var(--discord-orange)' : 'var(--bg-surface-elevated)',
                color: canAfford ? '#ffffff' : 'var(--text-dim)',
              }}
              disabled={!canAfford || submitting}
              title={canAfford ? 'Send request to parent' : `Need ${reward.cost - currentPoints} more points`}
            >
              {canAfford ? (
                <>
                  <ShoppingBag size={15} />
                  {submitting ? 'Requesting...' : 'Request to Buy'}
                </>
              ) : (
                <>
                  <Lock size={14} />
                  Locked
                </>
              )}
            </button>
          )}

          {/* Parent: Delete Reward */}
          {isParent && (
            <button
              onClick={handleDelete}
              className="btn-task-delete"
              title="Delete reward"
              disabled={submitting}
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
