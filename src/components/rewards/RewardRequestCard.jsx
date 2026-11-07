import { useState } from 'react'
import { CheckCircle2, XCircle, Clock, Coins, Sparkles, Ticket } from 'lucide-react'
import { approveRewardTicket, rejectRewardTicket, redeemRewardTicket } from '../../services/rewardService'
import { useLanguage } from '../../context/useLanguage'
import { celebrateTicketUsed } from '../../utils/confetti'

export default function RewardRequestCard({
  request,
  isParent,
  onRequestUpdated,
  onError,
  onSuccess,
}) {
  const { t, isDutch } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [isCelebrated, setIsCelebrated] = useState(false)
  const [floatingBadge, setFloatingBadge] = useState(null)

  const reward = request.rewards || {
    title: 'Reward item',
    cost: request.cost || 0,
    description: '',
  }

  // Kid decides to use an available ticket from inventory
  const handleUseTicket = async () => {
    const confirmPrompt = isDutch
      ? `Wil je je kaartje voor "${reward.title}" nu inzetten? Je ouder krijgt een melding om het goed te keuren.`
      : `Use your ticket for "${reward.title}" now? Your parent will be asked to approve it.`
    if (!window.confirm(confirmPrompt)) return

    setLoading(true)
    try {
      const updated = await redeemRewardTicket(request.id)
      celebrateTicketUsed()
      setIsCelebrated(true)
      setFloatingBadge({ text: isDutch ? '🎟️ Kaartje Ingelost! ⏳' : '🎟️ Ticket Submitted! ⏳', type: 'ticket-bought' })
      setTimeout(() => {
        setIsCelebrated(false)
        setFloatingBadge(null)
      }, 1500)
      if (onRequestUpdated) onRequestUpdated(updated)
      if (onSuccess) {
        onSuccess(isDutch
          ? `🎟️ Kaartje ingezet voor "${reward.title}"! Wachten op goedkeuring van ouder.`
          : `🎟️ Ticket submitted for "${reward.title}"! Waiting for parent approval.`
        )
      }
    } catch (err) {
      if (onError) onError(err.message || 'Failed to use ticket.')
    } finally {
      setLoading(false)
    }
  }

  // Parent approves ticket usage
  const handleApprove = async () => {
    const confirmPrompt = isDutch
      ? `Kaartje "${reward.title}" goedkeuren voor gebruik?`
      : `Approve ticket usage for "${reward.title}"?`
    if (!window.confirm(confirmPrompt)) return

    setLoading(true)
    try {
      const res = await approveRewardTicket(request.id)
      celebrateTicketUsed()
      setIsCelebrated(true)
      setFloatingBadge({ text: isDutch ? '🎉 Veel Plezier!' : '🎉 Enjoy!', type: 'ticket-bought' })
      setTimeout(() => {
        setIsCelebrated(false)
        setFloatingBadge(null)
      }, 1500)
      if (onRequestUpdated) {
        onRequestUpdated(res.updatedRequest || res)
      }
      if (onSuccess) {
        onSuccess(isDutch
          ? `Goedgekeurd! Kaartje "${reward.title}" is nu gebruikt.`
          : `Approved! Ticket "${reward.title}" is now used.`
        )
      }
    } catch (err) {
      if (onError) onError(err.message || 'Failed to approve ticket.')
    } finally {
      setLoading(false)
    }
  }

  // Parent declines ticket usage (returns ticket to kid's available inventory)
  const handleReject = async () => {
    const confirmPrompt = isDutch
      ? `Kaartjesverzoek voor "${reward.title}" nu afwijzen? Het kaartje blijft bewaard in de inventaris van het kind.`
      : `Decline ticket request for "${reward.title}"? The ticket will remain in the kid's inventory.`
    if (!window.confirm(confirmPrompt)) return

    setLoading(true)
    try {
      const updated = await rejectRewardTicket(request.id)
      if (onRequestUpdated) {
        onRequestUpdated(updated)
      }
      if (onSuccess) {
        onSuccess(isDutch
          ? `Verzoek afgewezen. Kaartje voor "${reward.title}" is bewaard gebleven.`
          : `Ticket request declined. Ticket preserved for later.`
        )
      }
    } catch (err) {
      if (onError) onError(err.message || 'Failed to decline request.')
    } finally {
      setLoading(false)
    }
  }

  const renderStatusBadge = () => {
    switch (request.status) {
      case 'available':
        return (
          <span
            className="task-status-chip"
            style={{
              background: 'rgba(52, 211, 153, 0.15)',
              color: 'var(--discord-green)',
              border: '1px solid rgba(52, 211, 153, 0.4)',
            }}
          >
            <Ticket size={12} /> {t('rewards.ticket_ready')}
          </span>
        )
      case 'pending':
        return (
          <span className="task-status-chip status-pending_approval">
            <Clock size={12} /> {t('rewards.ticket_pending')}
          </span>
        )
      case 'approved':
        return (
          <span className="task-status-chip status-completed">
            <CheckCircle2 size={12} /> {t('rewards.ticket_used')}
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
            <XCircle size={12} /> {t('rewards.ticket_declined_badge')}
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
    <div className={`reward-card reward-card-request status-${request.status} ${isCelebrated ? 'anim-celebrate-card' : ''}`}>
      {floatingBadge && (
        <div className={`floating-celebration-badge ${floatingBadge.type}`}>
          {floatingBadge.text}
        </div>
      )}
      <div className="reward-top">
        <div className="reward-title-group">
          {renderStatusBadge()}
          <h3 className="reward-title" style={{ marginTop: '0.25rem' }}>
            {reward.title}
          </h3>
          {formattedDate && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              {isDutch ? 'Gekocht' : 'Purchased'} {formattedDate}
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
              {t('rewards.requested_by', { name: request.profiles?.display_name || (isDutch ? 'Kind' : 'Kid') })}
            </span>
          ) : request.status === 'available' ? (
            <span style={{ color: 'var(--discord-green)', fontWeight: 600 }}>
              {isDutch ? 'In jouw bezit. Gebruik wanneer jij wilt!' : 'In your pocket. Use whenever you want!'}
            </span>
          ) : request.status === 'approved' ? (
            <span style={{ color: 'var(--discord-green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Sparkles size={13} /> {t('rewards.ticket_used')}
            </span>
          ) : request.status === 'pending' ? (
            <span style={{ color: 'var(--discord-yellow)' }}>
              {t('rewards.ticket_pending')}
            </span>
          ) : (
            <span style={{ color: 'var(--discord-red)' }}>{t('rewards.ticket_declined_badge')}</span>
          )}
        </div>

        {/* Kid: Use ticket if available in inventory */}
        {!isParent && request.status === 'available' && (
          <button
            onClick={handleUseTicket}
            className="btn-redeem"
            style={{
              background: 'var(--discord-green)',
              color: '#090a0f',
              fontWeight: 700,
            }}
            disabled={loading}
            title={t('rewards.use_ticket')}
          >
            <Ticket size={15} />
            {t('rewards.use_ticket')}
          </button>
        )}

        {/* Parent: Actions on pending ticket usage */}
        {isParent && request.status === 'pending' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={handleReject}
              className="btn-task-action btn-unclaim"
              style={{ color: 'var(--discord-red)', borderColor: 'rgba(237, 66, 69, 0.4)' }}
              disabled={loading}
              title={t('rewards.decline_usage')}
            >
              <XCircle size={15} />
              {t('rewards.decline_usage')}
            </button>

            <button
              onClick={handleApprove}
              className="btn-task-action btn-approve"
              disabled={loading}
              title={t('rewards.approve_usage')}
            >
              <CheckCircle2 size={15} />
              {t('rewards.approve_usage')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

