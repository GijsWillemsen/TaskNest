import { useState, useEffect, useCallback } from 'react'
import {
  Trophy,
  Users,
  Coins,
  Gift,
  RefreshCw,
  Sparkles,
  UserCheck,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react'
import { getFamilyProfiles } from '../../services/profileService'
import { supabase } from '../../supabaseClient'
import BonusPointsModal from './BonusPointsModal'
import '../../styles/family.css'

export default function FamilyView({ role, currentUserId, onPointsRefresh }) {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedKid, setSelectedKid] = useState(null)
  const [isBonusModalOpen, setIsBonusModalOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const isParent = role === 'parent'

  const loadProfiles = useCallback(async () => {
    try {
      const data = await getFamilyProfiles()
      setProfiles(data)
    } catch (err) {
      console.error('Failed to load family members:', err)
      setErrorMessage(err.message || 'Unable to fetch family profiles.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const init = async () => {
      try {
        const data = await getFamilyProfiles()
        if (isMounted) setProfiles(data)
      } catch (err) {
        if (isMounted) {
          console.error('Init load error:', err)
          setErrorMessage(err.message || 'Could not load family members.')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    init()

    // Realtime subscription for live family updates
    const channel = supabase
      .channel('family-profiles-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          loadProfiles()
          if (onPointsRefresh) onPointsRefresh()
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [loadProfiles, onPointsRefresh])

  const handleManualRefresh = async () => {
    setLoading(true)
    await loadProfiles()
    if (onPointsRefresh) onPointsRefresh()
  }

  const handleOpenBonusModal = (kid) => {
    setSelectedKid(kid)
    setIsBonusModalOpen(true)
  }

  const handlePointsAwarded = (updatedProfile) => {
    setProfiles((prev) =>
      prev.map((p) => (p.id === updatedProfile.id ? updatedProfile : p))
    )
    setSuccessMessage(`Bonus points awarded successfully!`)
    if (onPointsRefresh) onPointsRefresh()
  }

  const kids = profiles.filter((p) => p.role === 'kid')
  const parents = profiles.filter((p) => p.role === 'parent')

  return (
    <div className="family-section">
      {/* Alerts */}
      {errorMessage && (
        <div className="auth-alert auth-alert-error" role="alert">
          <ShieldAlert size={18} style={{ flexShrink: 0 }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="auth-alert auth-alert-success" role="status">
          <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Toolbar */}
      <div className="section-toolbar">
        <div className="toolbar-left">
          <h2>Family Hub</h2>
          <span className="count-badge">{profiles.length} members</span>
        </div>

        <div className="toolbar-actions">
          <button
            onClick={handleManualRefresh}
            className="icon-btn"
            title="Refresh family"
            disabled={loading}
          >
            <RefreshCw size={17} className={loading ? 'spinning' : ''} />
          </button>
        </div>
      </div>

      {/* Kids Leaderboard Card */}
      <div className="leaderboard-card">
        <div className="leaderboard-header">
          <div className="leaderboard-title-wrap">
            <div className="leaderboard-icon-badge">
              <Trophy size={20} />
            </div>
            <div>
              <h2>Kids Leaderboard</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Chore points rankings & achievements
              </span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="section-loading">
            <div className="spinner"></div>
            <p>Loading leaderboard...</p>
          </div>
        ) : kids.length === 0 ? (
          <div className="empty-state-box" style={{ padding: '2rem 1rem' }}>
            <Sparkles size={28} color="var(--discord-yellow)" />
            <h3>No kid accounts yet</h3>
            <p>Sign up a Kid profile to start tracking points and chore achievements!</p>
          </div>
        ) : (
          <div className="leaderboard-list">
            {kids.map((kid, index) => {
              const rank = index + 1
              const isCurrentUser = kid.id === currentUserId
              return (
                <div
                  key={kid.id}
                  className={`leaderboard-item rank-${rank}`}
                >
                  <div className="item-left">
                    <div className="rank-badge">
                      {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                    </div>
                    <div className="member-info">
                      <h4>
                        Kid ({kid.id.slice(0, 8)}) {isCurrentUser && '🌟 (You)'}
                      </h4>
                      <span className="member-role-tag">
                        {rank === 1 ? 'Chore Champion' : 'Family Member'}
                      </span>
                    </div>
                  </div>

                  <div className="item-right">
                    <div className="kid-points-display" title="Chore Points">
                      <Coins size={18} color="var(--discord-yellow)" />
                      <span>{kid.points || 0} pts</span>
                    </div>

                    {/* Parent Bonus Points Action */}
                    {isParent && (
                      <button
                        onClick={() => handleOpenBonusModal(kid)}
                        className="btn-bonus"
                        title="Award bonus points"
                      >
                        <Gift size={14} />
                        Bonus
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Parents Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
          <Users size={18} color="var(--discord-blurple)" />
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-pure)' }}>Parents / Guardians</h3>
        </div>

        <div className="parents-grid">
          {parents.length === 0 ? (
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>No parent accounts listed.</p>
          ) : (
            parents.map((parent) => {
              const isCurrentUser = parent.id === currentUserId
              return (
                <div key={parent.id} className="parent-card">
                  <div className="parent-avatar">
                    <UserCheck size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-pure)' }}>
                      Parent ({parent.id.slice(0, 8)}) {isCurrentUser && ' (You)'}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Chore Administrator
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Bonus Points Modal */}
      <BonusPointsModal
        isOpen={isBonusModalOpen}
        onClose={() => setIsBonusModalOpen(false)}
        kid={selectedKid}
        onPointsAwarded={handlePointsAwarded}
      />
    </div>
  )
}

