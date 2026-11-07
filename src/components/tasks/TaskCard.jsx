import { useState, useMemo } from 'react'
import {
  Coins,
  Check,
  Hand,
  Trash2,
  Undo2,
  Award,
  RotateCw,
  RotateCcw,
  XCircle,
  User,
  UserCheck,
  ArrowLeftRight,
  Users,
  X,
  Clock,
} from 'lucide-react'
import {
  claimTask,
  finishTask,
  releaseTask,
  approveTask,
  revertTask,
  deleteTask,
  requestTaskTransfer,
  acceptTaskTransfer,
  cancelTaskTransfer,
} from '../../services/taskService'
import { useLanguage } from '../../context/useLanguage'
import { celebrateTaskComplete, celebrateTaskApproved } from '../../utils/confetti'

export default function TaskCard({
  task,
  isParent,
  currentUserId,
  familyMembers = [],
  onTaskUpdated,
  onTaskDeleted,
  onError,
  onSuccess,
}) {
  const { t, isDutch } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [isCelebrated, setIsCelebrated] = useState(false)
  const [floatingBadge, setFloatingBadge] = useState(null)
  const [currentTimestamp] = useState(() => Date.now())

  const hoursLeftUntilExpire = useMemo(() => {
    if (task.status !== 'completed') return null
    const compTime = task.completed_at || task.created_at
    if (!compTime) return null
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000
    const elapsed = currentTimestamp - new Date(compTime).getTime()
    const msLeft = Math.max(0, TWENTY_FOUR_HOURS_MS - elapsed)
    return Math.max(1, Math.ceil(msLeft / (60 * 60 * 1000)))
  }, [task.status, task.completed_at, task.created_at, currentTimestamp])

  const claimantMember = familyMembers.find((m) => m.id === task.claimed_by)
  const isClaimedByMe = task.claimed_by === currentUserId
  const isClaimedBySibling = task.claimed_by && !isClaimedByMe
  const assigneeName = claimantMember?.display_name || ''

  const currentMember = familyMembers.find((m) => m.id === currentUserId)
  const currentUserName = currentMember?.display_name || ''

  // Is task parent-allocated to a specific person upon creation?
  const isParentAllocated = Boolean(task.assigned_to)

  // Is task in a restricted pool where only certain people can claim it?
  const isPoolRestricted = task.eligible_assignees && Array.isArray(task.eligible_assignees) && task.eligible_assignees.length > 0
  const isEligibleToClaim = !isPoolRestricted || isParent || task.eligible_assignees.includes(currentUserId)

  const formatRecurrenceText = (tObj) => {
    const { recurrence, recurrence_time, recurrence_day } = tObj
    if (!recurrence || recurrence === 'none') return null

    let freqText = ''
    if (recurrence === 'daily') {
      freqText = t('tasks.repeats_daily')
    } else if (recurrence === 'weekly') {
      if (recurrence_day) {
        const days = recurrence_day.split(',').map((d) => d.trim().toLowerCase()).filter(Boolean)
        if (days.length === 7) {
          freqText = t('tasks.repeats_daily')
        } else if (days.length === 5 && !days.includes('saturday') && !days.includes('sunday')) {
          freqText = t('tasks.repeats_weekdays')
        } else if (days.length === 2 && days.includes('saturday') && days.includes('sunday')) {
          freqText = t('tasks.repeats_weekend')
        } else if (days.length === 1) {
          const singleDay = t(`tasks.days.${days[0]}`) || days[0]
          freqText = t('tasks.repeats_weekly', { day: singleDay })
        } else {
          const shortNames = days.map((d) => t(`tasks.days_short.${d}`) || d).join(', ')
          freqText = shortNames
        }
      } else {
        freqText = t('tasks.recurrence_weekly')
      }
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
      const res = await finishTask(
        task.id,
        currentUserId,
        isParent ? 'parent' : 'kid',
        task.points_value
      )
      onTaskUpdated(res)
      if (isParent) {
        celebrateTaskApproved()
        setFloatingBadge({
          text: `+${task.points_value} ${t('common.points')}!`,
          type: 'points-earned',
        })
        if (onSuccess) {
          onSuccess(
            isDutch
              ? `Klusje "${task.title}" direct voltooid! +${task.points_value} punten verdiend.`
              : `Chore "${task.title}" completed! +${task.points_value} points earned.`
          )
        }
      } else {
        celebrateTaskComplete()
        setFloatingBadge({ text: isDutch ? 'Voltooid!' : 'Done!', type: 'points-earned' })
        if (onSuccess) onSuccess(t('tasks.finished_success', { title: task.title }))
      }
      setIsCelebrated(true)
      setTimeout(() => {
        setIsCelebrated(false)
        setFloatingBadge(null)
      }, 1400)
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
      celebrateTaskApproved()
      setIsCelebrated(true)
      setFloatingBadge({ text: `+${task.points_value} ${t('common.points')}!`, type: 'points-earned' })
      setTimeout(() => {
        setIsCelebrated(false)
        setFloatingBadge(null)
      }, 1400)
      if (onSuccess) onSuccess(t('tasks.approved_success', { title: task.title, points: task.points_value }))
    } catch (err) {
      if (onError) onError(err.message || 'Failed to approve task.')
    } finally {
      setLoading(false)
    }
  }

  const handleRevert = async () => {
    const confirmPrompt = isDutch
      ? `Weet je zeker dat je het voltooien van "${task.title}" wilt terugdraaien? De ${task.points_value} punten worden ingehouden en het klusje wordt opnieuw klaargezet.`
      : `Revert completion of "${task.title}"? ${task.points_value} points will be deducted and the chore reopened.`
    if (!window.confirm(confirmPrompt)) return

    setLoading(true)
    try {
      const updated = await revertTask(task.id)
      onTaskUpdated(updated)
      if (onSuccess) {
        onSuccess(
          isDutch
            ? `Voltooiing van "${task.title}" teruggedraaid! ${task.points_value} punten ingehouden.`
            : `Reverted completion of "${task.title}"! ${task.points_value} points deducted.`
        )
      }
    } catch (err) {
      if (onError) onError(err.message || 'Failed to revert chore.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeclinePending = async () => {
    const confirmPrompt = isDutch
      ? `Klusje "${task.title}" afwijzen? Het klusje wordt opnieuw opengezet en er worden geen punten toegekend.`
      : `Decline "${task.title}"? The chore will be reopened and no points awarded.`
    if (!window.confirm(confirmPrompt)) return

    setLoading(true)
    try {
      const updated = await releaseTask(task.id, task.claimed_by)
      onTaskUpdated(updated)
      if (onSuccess) {
        onSuccess(
          isDutch
            ? `Klusje "${task.title}" afgewezen en opnieuw opengezet.`
            : `Chore "${task.title}" declined and reopened.`
        )
      }
    } catch (err) {
      if (onError) onError(err.message || 'Failed to decline chore.')
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

  const handleRequestTransfer = async () => {
    setLoading(true)
    try {
      const updated = await requestTaskTransfer(task.id, currentUserId, currentUserName)
      onTaskUpdated(updated)
      if (onSuccess) {
        onSuccess(
          isDutch
            ? `Overnameverzoek voor "${task.title}" verzonden!`
            : `Transfer request for "${task.title}" sent!`
        )
      }
    } catch (err) {
      if (onError) onError(err.message || 'Failed to request transfer.')
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptTransfer = async () => {
    setLoading(true)
    try {
      const updated = await acceptTaskTransfer(task.id)
      onTaskUpdated(updated)
      if (onSuccess) {
        onSuccess(
          isDutch
            ? `Klusje "${task.title}" overgedragen aan ${task.transfer_requested_name || 'gezinslid'}!`
            : `Chore "${task.title}" transferred to ${task.transfer_requested_name || 'family member'}!`
        )
      }
    } catch (err) {
      if (onError) onError(err.message || 'Failed to transfer chore.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelTransfer = async () => {
    setLoading(true)
    try {
      const updated = await cancelTaskTransfer(task.id)
      onTaskUpdated(updated)
      if (onSuccess) {
        onSuccess(isDutch ? 'Overnameverzoek geannuleerd.' : 'Transfer request cancelled.')
      }
    } catch (err) {
      if (onError) onError(err.message || 'Failed to cancel transfer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`task-card task-card-${task.status} ${isCelebrated ? 'anim-celebrate-card' : ''}`}>
      {floatingBadge && (
        <div className={`floating-celebration-badge ${floatingBadge.type}`}>
          {floatingBadge.text}
        </div>
      )}
      {/* Top row: Title, Badges (Recurrence, Assignee, Pool) on left, Coin + amount on right */}
      <div className="task-card-top">
        <div className="task-header-left">
          <h3 className="task-title">{task.title}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            {task.recurrence && task.recurrence !== 'none' && (
              <div className="task-recurrence-badge">
                <RotateCw size={12} className="recurrence-icon" />
                <span>{formatRecurrenceText(task)}</span>
              </div>
            )}
            {isPoolRestricted && task.status === 'open' && (
              <div className="task-assigned-pill" style={{ background: 'rgba(99, 102, 241, 0.15)', borderColor: 'var(--discord-blurple)' }}>
                <Users size={12} />
                <span>{t('tasks.pool_restricted_badge')}</span>
              </div>
            )}
            {task.status === 'claimed' && (
              <div className={`task-assigned-pill ${isClaimedByMe ? 'is-me' : ''}`}>
                {isClaimedByMe ? (
                  <>
                    <UserCheck size={12} />
                    <span>{t('tasks.assigned_to_you')}</span>
                  </>
                ) : (
                  <>
                    <User size={12} />
                    <span>{t('tasks.assigned_to_user', { name: assigneeName || t('tasks.claimed_by_family') })}</span>
                  </>
                )}
              </div>
            )}
            {task.status === 'completed' && (
              <>
                <div
                  className="task-assigned-pill"
                  style={{
                    background: 'rgba(52, 211, 153, 0.15)',
                    borderColor: 'var(--discord-green)',
                    color: 'var(--discord-green)',
                    fontWeight: 700,
                  }}
                >
                  <Check size={12} strokeWidth={2.6} />
                  <span>
                    {isDutch ? 'Voltooid' : 'Completed'}
                    {assigneeName ? ` door ${assigneeName}` : ''}
                  </span>
                </div>
                {hoursLeftUntilExpire !== null && (
                  <div
                    className="task-assigned-pill"
                    style={{
                      background: 'rgba(156, 163, 175, 0.12)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-muted)',
                      fontSize: '0.74rem',
                    }}
                    title={
                      isDutch
                        ? 'Voltooide taken verdwijnen automatisch na 24 uur'
                        : 'Finished tasks disappear automatically after 24 hours'
                    }
                  >
                    <Clock size={11} />
                    <span>{isDutch ? `Verdwijnt over ${hoursLeftUntilExpire}u` : `Disappears in ${hoursLeftUntilExpire}h`}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="task-points-badge" title={`${task.points_value} points`}>
          <Coins size={16} />
          <span>{task.points_value}</span>
        </div>
      </div>

      {task.description && <p className="task-description">{task.description}</p>}

      {/* Transfer Request Banner for current claimant or parent */}
      {task.status === 'claimed' && task.transfer_requested_by && (isClaimedByMe || isParent) && (
        <div
          style={{
            margin: '0.75rem 0 0.5rem 0',
            padding: '0.65rem 0.85rem',
            borderRadius: '12px',
            background: 'rgba(254, 231, 92, 0.12)',
            border: '1.5px solid var(--discord-yellow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.84rem', color: 'var(--text-pure)' }}>
            <ArrowLeftRight size={15} color="var(--discord-yellow)" />
            <span>
              <strong>{task.transfer_requested_name || (isDutch ? 'Een gezinslid' : 'A member')}</strong>{' '}
              {isDutch ? 'wil dit klusje graag overnemen!' : 'wants to take over this chore!'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <button
              onClick={handleAcceptTransfer}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.35rem 0.65rem',
                borderRadius: '8px',
                border: 'none',
                background: 'var(--discord-green)',
                color: '#090a0f',
                fontWeight: 800,
                fontSize: '0.78rem',
                cursor: 'pointer',
              }}
            >
              <Check size={13} strokeWidth={2.5} />
              <span>{t('tasks.transfer_accept')}</span>
            </button>

            <button
              onClick={handleCancelTransfer}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.35rem 0.55rem',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface)',
                color: 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer',
              }}
            >
              <X size={13} />
              <span>{t('tasks.transfer_decline')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Footer & Actions */}
      <div className="task-card-footer" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Assignee indicator on review */}
        {task.status === 'pending_approval' && assigneeName ? (
          <span style={{ fontSize: '0.8rem', color: 'var(--discord-yellow)', fontWeight: 600 }}>
            {isDutch ? `Ingediend door ${assigneeName}` : `Submitted by ${assigneeName}`}
          </span>
        ) : <div />}

        {/* Actions */}
        <div className="task-actions-group">
          {/* Parent: Approve or Decline pending chore */}
          {isParent && task.status === 'pending_approval' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <button
                onClick={handleDeclinePending}
                className="btn-task-action btn-unclaim btn-icon-action"
                style={{ color: 'var(--discord-red)', borderColor: 'rgba(237, 66, 69, 0.4)' }}
                disabled={loading}
                title={isDutch ? 'Afwijzen (klusje niet goed gedaan/valsgespeeld)' : 'Decline chore (not completed properly)'}
                aria-label="Decline"
              >
                <XCircle size={16} />
              </button>
              <button
                onClick={handleApprove}
                className="btn-task-action btn-approve"
                disabled={loading}
                title={t('tasks.approve_button')}
              >
                <Award size={15} />
                <span>{t('tasks.approve_button')} ({task.points_value})</span>
              </button>
            </div>
          )}

          {/* Parent: Revert completed task if kid cheated */}
          {isParent && task.status === 'completed' && (
            <button
              onClick={handleRevert}
              className="btn-task-action btn-unclaim"
              style={{ color: 'var(--discord-red)', borderColor: 'rgba(237, 66, 69, 0.4)', gap: '0.35rem' }}
              disabled={loading}
              title={isDutch ? 'Voltooiing terugdraaien (punten worden ingehouden)' : 'Revert completion (points will be deducted)'}
            >
              <RotateCcw size={14} />
              <span>{isDutch ? 'Terugdraaien' : 'Revert'}</span>
            </button>
          )}

          {/* Open chore: Claim (Hand icon) or Finish directly (Check mark) */}
          {task.status === 'open' && (
            <>
              {isEligibleToClaim ? (
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
              ) : (
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                  {t('tasks.pool_restricted_badge')}
                </span>
              )}
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

          {/* Sibling claimed chore: Request transfer (if not parent-allocated) */}
          {task.status === 'claimed' && isClaimedBySibling && (
            <>
              {isParentAllocated ? (
                <span style={{ fontSize: '0.76rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                  {t('tasks.transfer_not_allowed_parent_locked')}
                </span>
              ) : (
                <>
                  {task.transfer_requested_by === currentUserId ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--discord-yellow)', fontWeight: 600 }}>
                        {t('tasks.transfer_request_sent')}
                      </span>
                      <button
                        onClick={handleCancelTransfer}
                        disabled={loading}
                        className="btn-task-action"
                        style={{ padding: '0.2rem 0.45rem', fontSize: '0.72rem', borderRadius: '6px' }}
                        title={t('tasks.transfer_cancel_btn')}
                      >
                        {t('tasks.transfer_cancel_btn')}
                      </button>
                    </div>
                  ) : task.transfer_requested_by ? (
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                      ⏳ {task.transfer_requested_name || 'Iemand'} vraagt om overname
                    </span>
                  ) : (
                    <button
                      onClick={handleRequestTransfer}
                      className="btn-task-action btn-transfer"
                      disabled={loading}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.78rem',
                        padding: '0.35rem 0.65rem',
                        borderRadius: '8px',
                        background: 'rgba(99, 102, 241, 0.12)',
                        border: '1px solid var(--theme-accent, var(--discord-blurple))',
                        color: 'var(--theme-accent, var(--discord-blurple))',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                      title={t('tasks.transfer_request_btn')}
                    >
                      <ArrowLeftRight size={13} />
                      <span>{t('tasks.transfer_request_btn')}</span>
                    </button>
                  )}
                </>
              )}
            </>
          )}

          {/* Claimant waiting indicator */}
          {task.status === 'pending_approval' && isClaimedByMe && !isParent && (
            <span className="status-waiting-pill">{t('tasks.under_review')}</span>
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
