import { useState, useEffect } from 'react'
import { useAuth } from '../context/useAuth'
import { useTheme } from '../context/useTheme'
import { getFamilyMembers } from '../services/familyService'
import {
  User,
  Users,
  Copy,
  Check,
  LogOut,
  Coins,
  Shield,
  KeyRound,
  Palette,
  Gamepad2,
  Zap,
  Star,
  CheckCircle2,
} from 'lucide-react'
import '../styles/auth.css'

export default function SettingsPage() {
  const { user, family, familyId, role, points, displayName, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const [copied, setCopied] = useState(false)
  const [members, setMembers] = useState([])
  const [loadingMembers, setLoadingMembers] = useState(false)

  const isParent = role === 'parent'
  const isPlayful = theme === 'playful'

  useEffect(() => {
    let isMounted = true
    if (!familyId) return

    getFamilyMembers(familyId)
      .then((data) => {
        if (isMounted) {
          setMembers(data)
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Failed to load family members:', err)
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoadingMembers(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [familyId])

  const handleCopyCode = async () => {
    if (!family?.invite_code) return
    try {
      await navigator.clipboard.writeText(family.invite_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: '780px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.25rem 0', fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-pure)' }}>
            Settings & Preferences
          </h1>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Customize your style, manage account, and invite family
          </p>
        </div>

        <button
          onClick={signOut}
          className="signout-btn"
          style={{ padding: '0.55rem 1rem' }}
          title="Sign out of TaskNest"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>

      {/* User Profile Card */}
      <div className="placeholder-card settings-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div className="placeholder-icon tasks" style={{ background: 'rgba(88, 101, 242, 0.15)', color: 'var(--discord-blurple)' }}>
            <User size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem', margin: 0 }}>
              {displayName || 'User Profile'}
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Your account details and live balance
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1.25rem' }}>
          <div>
            <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600, marginBottom: '0.3rem' }}>
              Display Name
            </span>
            <span style={{ fontSize: '1rem', color: 'var(--text-pure)', fontWeight: 600 }}>
              {displayName}
            </span>
          </div>

          <div>
            <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600, marginBottom: '0.3rem' }}>
              Email Address
            </span>
            <span style={{ fontSize: '0.95rem', color: 'var(--text-pure)', fontWeight: 500 }}>
              {user?.email || 'N/A'}
            </span>
          </div>

          <div>
            <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600, marginBottom: '0.3rem' }}>
              Role
            </span>
            <span className={`role-badge ${role || 'kid'}`}>
              <Shield size={13} />
              {isParent ? 'Parent' : 'Kid'}
            </span>
          </div>

          <div>
            <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600, marginBottom: '0.3rem' }}>
              Live Points
            </span>
            <div className="points-pill" style={{ display: 'inline-flex', padding: '0.35rem 0.85rem', fontSize: '0.95rem' }}>
              {isPlayful ? (
                <Star size={16} fill="#eab308" color="#ca8a04" />
              ) : (
                <Coins size={16} color="var(--discord-yellow)" />
              )}
              <span>{points} pts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Theme Engine Toggle Card */}
      <div className="placeholder-card settings-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div className="placeholder-icon" style={{ background: 'rgba(124, 58, 237, 0.15)', color: 'var(--discord-blurple)' }}>
            <Palette size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem', margin: 0 }}>Theme & Visual Style</h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Switch instantly between Playful and Modern themes
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          {/* Playful Theme Toggle */}
          <button
            type="button"
            onClick={() => setTheme('playful')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
              padding: '1rem',
              borderRadius: '16px',
              border: theme === 'playful' ? '2.5px solid #581c87' : '1px solid var(--border-subtle)',
              boxShadow: theme === 'playful' ? '0 5px 0 #581c87' : 'none',
              background: theme === 'playful' ? 'rgba(124, 58, 237, 0.12)' : 'var(--bg-surface-elevated)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease',
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: '#e0f2fe',
                border: '2px solid #581c87',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#7c3aed',
                flexShrink: 0,
              }}
            >
              <Gamepad2 size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <strong style={{ color: 'var(--text-pure)', fontSize: '0.98rem' }}>Playful 🎮</strong>
                {theme === 'playful' && <CheckCircle2 size={16} color="var(--discord-blurple)" />}
              </div>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Bubbly sky-blue, 3D purple borders, yellow star points.
              </p>
            </div>
          </button>

          {/* Modern Theme Toggle */}
          <button
            type="button"
            onClick={() => setTheme('modern')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
              padding: '1rem',
              borderRadius: '16px',
              border: theme === 'modern' ? '2.5px solid #5865f2' : '1px solid var(--border-subtle)',
              boxShadow: theme === 'modern' ? '0 4px 14px rgba(88, 101, 242, 0.35)' : 'none',
              background: theme === 'modern' ? 'rgba(88, 101, 242, 0.12)' : 'var(--bg-surface-elevated)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease',
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: '#12141d',
                border: '1.5px solid #5865f2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#5865f2',
                flexShrink: 0,
              }}
            >
              <Zap size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <strong style={{ color: 'var(--text-pure)', fontSize: '0.98rem' }}>Modern ⚡</strong>
                {theme === 'modern' && <CheckCircle2 size={16} color="var(--discord-blurple)" />}
              </div>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Sleek dark monochrome with neon Discord accents.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Family & Invite Code Card */}
      <div className="placeholder-card settings-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div className="placeholder-icon family" style={{ background: 'rgba(254, 231, 92, 0.15)', color: 'var(--discord-yellow)' }}>
            <Users size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem', margin: 0 }}>
              {family?.name || 'Family Nest'}
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Invite family members to join and collaborate
            </span>
          </div>
        </div>

        {family?.invite_code ? (
          <div
            className="dashed-empty-container"
            style={{
              padding: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '1.25rem',
            }}
          >
            <div>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--discord-blurple)', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                <KeyRound size={14} /> 6-Digit Family Invite Code
              </span>
              <div
                style={{
                  fontSize: '1.85rem',
                  fontWeight: 900,
                  letterSpacing: '0.2em',
                  color: 'var(--text-pure)',
                  fontFamily: 'monospace',
                }}
              >
                {family.invite_code}
              </div>
              <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Share this code with family members to link them to this Nest.
              </p>
            </div>

            <button
              onClick={handleCopyCode}
              type="button"
              className="auth-submit-btn action-btn-primary"
              style={{
                width: 'auto',
                margin: 0,
                padding: '0.65rem 1.25rem',
                fontSize: '0.88rem',
                background: copied ? 'var(--discord-green)' : 'var(--discord-blurple)',
                color: copied ? '#ffffff' : '#ffffff',
              }}
            >
              {copied ? (
                <>
                  <Check size={16} /> Copied!
                </>
              ) : (
                <>
                  <Copy size={16} /> Copy Code
                </>
              )}
            </button>
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            No family linked yet. Use the setup prompt on the dashboard to create or join a family.
          </p>
        )}

        {/* Member Directory */}
        {familyId && (
          <div>
            <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-pure)' }}>
              Connected Family Members ({members.length})
            </h3>

            {loadingMembers ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading members...</p>
            ) : members.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>No other members have joined yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {members.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span className={`role-badge ${m.role}`}>
                        {m.role === 'parent' ? 'Parent' : 'Kid'}
                      </span>
                      <span style={{ fontSize: '0.92rem', color: 'var(--text-pure)', fontWeight: 600 }}>
                        {m.display_name || (m.id === user?.id ? 'You' : `Member (${m.id.slice(0, 6)})`)}
                        {m.id === user?.id && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--discord-blurple)', marginLeft: '0.4rem' }}>
                            (You)
                          </span>
                        )}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--discord-yellow)', fontWeight: 700, fontSize: '0.9rem' }}>
                      {isPlayful ? (
                        <Star size={15} fill="#eab308" color="#ca8a04" />
                      ) : (
                        <Coins size={15} color="var(--discord-yellow)" />
                      )}
                      <span>{m.points} pts</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* App Info Footer */}
      <div style={{ textAlign: 'center', padding: '1rem 0', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
        <p style={{ margin: 0 }}>
          TaskNest • Family Chore & Reward System • Connected to Supabase
        </p>
      </div>
    </div>
  )
}
