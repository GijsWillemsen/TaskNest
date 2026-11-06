import { useState, useEffect } from 'react'
import { useAuth } from '../context/useAuth'
import { useTheme } from '../context/useTheme'
import { THEMES } from '../context/theme-context'
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
  CheckCircle2,
  Edit2,
} from 'lucide-react'
import '../styles/auth.css'

export default function SettingsPage() {
  const { user, family, familyId, role, points, displayName, signOut, updateDisplayName } = useAuth()
  const { theme, setTheme } = useTheme()
  const [copied, setCopied] = useState(false)
  const [members, setMembers] = useState([])
  const [loadingMembers, setLoadingMembers] = useState(false)

  // Inline display name editing
  const [isEditingName, setIsEditingName] = useState(false)
  const [editNameVal, setEditNameVal] = useState(displayName || '')
  const [savingName, setSavingName] = useState(false)

  const isParent = role === 'parent'

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

  const handleSaveName = async (e) => {
    e.preventDefault()
    if (!editNameVal.trim() || !updateDisplayName) return
    setSavingName(true)
    try {
      await updateDisplayName(editNameVal.trim())
      setIsEditingName(false)
    } catch (err) {
      console.error('Failed to update name:', err)
    } finally {
      setSavingName(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', maxWidth: '780px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.25rem 0', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-pure)' }}>
            Settings & Preferences
          </h1>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Personalize your name, visual theme, and invite family
          </p>
        </div>

        <button
          onClick={signOut}
          className="signout-btn"
          style={{ padding: '0.55rem 1rem' }}
          title="Sign out"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>

      {/* User Profile Card */}
      <div className="placeholder-card settings-card" style={{ padding: '1.35rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.2rem' }}>
          <div className="placeholder-icon" style={{ background: 'rgba(88, 101, 242, 0.15)', color: 'var(--theme-accent, var(--discord-blurple))' }}>
            <User size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', margin: 0 }}>User Profile</h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Your account details and point balance
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.15rem' }}>
          {/* Editable Display Name */}
          <div>
            <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700, marginBottom: '0.35rem' }}>
              Your Name
            </span>
            {isEditingName ? (
              <form onSubmit={handleSaveName} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <input
                  type="text"
                  value={editNameVal}
                  onChange={(e) => setEditNameVal(e.target.value)}
                  className="input-field"
                  style={{ padding: '0.35rem 0.6rem', fontSize: '0.9rem', width: '130px' }}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={savingName}
                  style={{
                    background: 'var(--discord-green)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.45rem',
                    color: '#090a0f',
                    cursor: 'pointer',
                  }}
                  title="Save name"
                >
                  <Check size={16} />
                </button>
              </form>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{ fontSize: '1rem', color: 'var(--text-pure)', fontWeight: 700 }}>
                  {displayName}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setEditNameVal(displayName || '')
                    setIsEditingName(true)
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-dim)',
                    cursor: 'pointer',
                    padding: '2px',
                  }}
                  title="Edit your name"
                >
                  <Edit2 size={14} />
                </button>
              </div>
            )}
          </div>

          <div>
            <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700, marginBottom: '0.35rem' }}>
              Role
            </span>
            <span className={`role-badge ${role || 'kid'}`}>
              <Shield size={13} />
              {isParent ? 'Parent' : 'Kid'}
            </span>
          </div>

          <div>
            <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700, marginBottom: '0.35rem' }}>
              Email Address
            </span>
            <span style={{ fontSize: '0.92rem', color: 'var(--text-pure)', fontWeight: 500 }}>
              {user?.email || 'N/A'}
            </span>
          </div>

          <div>
            <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700, marginBottom: '0.35rem' }}>
              Live Points
            </span>
            <div className="points-pill" style={{ display: 'inline-flex', padding: '0.35rem 0.8rem', fontSize: '0.92rem', gap: '0.35rem' }}>
              <Coins size={16} />
              <span>{points}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5 Themes Selection Card */}
      <div className="placeholder-card settings-card" style={{ padding: '1.35rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.2rem' }}>
          <div className="placeholder-icon" style={{ background: 'rgba(124, 58, 237, 0.15)', color: 'var(--theme-accent, var(--discord-blurple))' }}>
            <Palette size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Visual Themes (5 Choices)</h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Choose your vibe from childish and playful to sleek and mature
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
          {THEMES.map((t) => {
            const isSelected = theme === t.id || (theme === 'playful' && t.id === 'candy') || (theme === 'modern' && t.id === 'obsidian')
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.85rem',
                  borderRadius: '16px',
                  border: isSelected ? `2.5px solid ${t.accentPreview}` : '1.5px solid var(--border-subtle)',
                  boxShadow: isSelected ? `0 4px 14px ${t.accentPreview}33` : 'none',
                  background: isSelected ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  width: '100%',
                }}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: t.bgPreview,
                    border: `2px solid ${t.accentPreview}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: t.accentPreview,
                    }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.3rem' }}>
                    <strong style={{ color: 'var(--text-pure)', fontSize: '0.92rem' }}>
                      {t.name}
                    </strong>
                    {isSelected && <CheckCircle2 size={16} color="var(--theme-accent, var(--discord-blurple))" />}
                  </div>
                  <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                    {t.description}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Family & Invite Code Card */}
      <div className="placeholder-card settings-card" style={{ padding: '1.35rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.2rem' }}>
          <div className="placeholder-icon family" style={{ background: 'rgba(254, 231, 92, 0.15)', color: 'var(--discord-yellow)' }}>
            <Users size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', margin: 0 }}>
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
              padding: '1.15rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '1.2rem',
              borderRadius: '16px',
            }}
          >
            <div>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.76rem', textTransform: 'uppercase', color: 'var(--theme-accent, var(--discord-blurple))', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '0.25rem' }}>
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
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Share this code with kids or parents to link them directly to this Nest.
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
                background: copied ? 'var(--discord-green)' : 'var(--theme-accent, var(--discord-blurple))',
                color: '#ffffff',
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
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1rem' }}>
            No family linked yet. Use the prompt on the dashboard to create or join a family.
          </p>
        )}

        {/* Connected Family Members */}
        {familyId && (
          <div>
            <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-pure)' }}>
              Connected Family Members ({members.length})
            </h3>

            {loadingMembers ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading members...</p>
            ) : members.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>No members found.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
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
                      <span style={{ fontSize: '0.95rem', color: 'var(--text-pure)', fontWeight: 700 }}>
                        {m.display_name || (m.role === 'parent' ? 'Parent' : 'Kid')}
                        {m.id === user?.id && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--theme-accent, var(--discord-blurple))', marginLeft: '0.4rem' }}>
                            (You)
                          </span>
                        )}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--discord-yellow)', fontWeight: 800, fontSize: '0.92rem' }}>
                      <Coins size={16} />
                      <span>{m.points}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Clean Footer */}
      <div style={{ textAlign: 'center', padding: '0.75rem 0', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
        <p style={{ margin: 0 }}>
          Family Chore & Reward Hub
        </p>
      </div>
    </div>
  )
}
