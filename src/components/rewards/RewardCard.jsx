import { useState } from 'react'
import { Coins, Trash2, Ticket, Sparkles, Lock } from 'lucide-react'
import { deleteReward, purchaseRewardTicket, redeemRewardTicket } from '../../services/rewardService'
import { useLanguage } from '../../context/useLanguage'

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
  const { t, isDutch } = useLanguage()
  const [submitting, setSubmitting] = useState(false)

  const currentPoints = Number(kidPoints) || 0
  const canAfford = currentPoints >= reward.cost
  const percentComplete = reward.cost > 0 ? Math.min(100, Math.round((currentPoints / reward.cost) * 100)) : 100

  const handleBuyTicket = async () => {
    if (!canAfford) return
    const confirmPrompt = isDutch
      ? `Wil je een kaartje kopen voor "${reward.title}" voor ${reward.cost} punten?`
      : `Buy a ticket for "${reward.title}" for ${reward.cost} points?`
    if (!window.confirm(confirmPrompt)) return

    setSubmitting(true)
    try {
      const res = await purchaseRewardTicket({
        familyId: familyId || reward.family_id,
        rewardId: reward.id,
        kidId,
        cost: reward.cost,
      })
      const ticket = res.ticket || res
      if (onRewardRequested) {
        onRewardRequested(ticket)
      }

      // Prompt: Use now or keep for later?
      const useNowQuestion = isDutch
        ? `🎉 Kaartje gekocht voor "${reward.title}"!\n\nWil je dit kaartje NU METEEN gebruiken?\n(Klik OK voor "Nu gebruiken", of Annuleren voor "Bewaar voor later")`
        : `🎉 Ticket purchased for "${reward.title}"!\n\nDo you want to USE this ticket RIGHT NOW?\n(Click OK for "Use Now", or Cancel for "Keep for Later")`

      if (window.confirm(useNowQuestion)) {
        const usedTicket = await redeemRewardTicket(ticket.id)
        if (onRewardRequested) {
          onRewardRequested(usedTicket)
        }
        if (onSuccess) {
          onSuccess(isDutch
            ? `🎟️ Kaartje voor "${reward.title}" ingezet! Wachten op goedkeuring van ouder.`
            : `🎟️ Ticket for "${reward.title}" submitted! Waiting for parent approval.`
          )
        }
      } else {
        if (onSuccess) {
          onSuccess(t('rewards.ticket_purchased', { title: reward.title }))
        }
      }
    } catch (err) {
      if (onError) onError(err.message || 'Failed to buy ticket.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    const confirmPrompt = isDutch
      ? `Weet je zeker dat je de beloning "${reward.title}" wilt verwijderen?`
      : `Delete reward "${reward.title}" from the catalog?`
    if (!window.confirm(confirmPrompt)) return

    setSubmitting(true)
    try {
      await deleteReward(reward.id)
      if (onRewardDeleted) onRewardDeleted(reward.id)
      if (onSuccess) onSuccess(isDutch ? `Beloning "${reward.title}" verwijderd.` : `Reward "${reward.title}" removed.`)
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
            <span>{isDutch ? 'Voortgang' : 'Progress'}</span>
            <span>{canAfford ? (isDutch ? 'Beschikbaar!' : 'Ready!') : `${percentComplete}%`}</span>
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
              <Sparkles size={13} /> {t('rewards.affordable')}
            </span>
          ) : (
            <span>🪙 {reward.cost - currentPoints} {t('rewards.needed')}</span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Kid: Buy Ticket Button */}
          {!isParent && (
            <button
              onClick={handleBuyTicket}
              className="btn-redeem"
              style={{
                background: canAfford ? 'var(--discord-orange)' : 'var(--bg-surface-elevated)',
                color: canAfford ? '#ffffff' : 'var(--text-dim)',
              }}
              disabled={!canAfford || submitting}
              title={canAfford ? t('rewards.buy_ticket') : `Need ${reward.cost - currentPoints} more points`}
            >
              {canAfford ? (
                <>
                  <Ticket size={15} />
                  {submitting ? t('common.loading') : t('rewards.buy_ticket')}
                </>
              ) : (
                <>
                  <Lock size={14} />
                  {isDutch ? 'Vergrendeld' : 'Locked'}
                </>
              )}
            </button>
          )}

          {/* Parent: Delete Reward */}
          {isParent && (
            <button
              onClick={handleDelete}
              className="btn-task-delete"
              title={t('common.delete')}
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

