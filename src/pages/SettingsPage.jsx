import { useState, useEffect } from 'react'
import { useAuth } from '../context/useAuth'
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
} from 'lucide-react'
import '../styles/auth.css'

export default function SettingsPage() {
  const { user, profile, family, familyId, role, points, signOut } = useAuth()
  const [copied, setCopied] = useState(false)
  const [members, setMembers] = useState([])
  const [loadingMembers, setLoadingMembers] = useState(false)

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: '780px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.25rem 0', fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-pure)' }}>
            Settings & Account
          </h1>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Manage your account and family membership
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

      {/* Account Info Card */}
      <div className="placeholder-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div className="placeholder-icon tasks" style={{ background: 'rgba(88, 101, 242, 0.15)', color: 'var(--discord-blurple)' }}>
            <User size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem' }}>User Profile</h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Your authenticated credentials</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
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
              {isParent ? 'Parent / Administrator' : 'Kid / Contributor'}
            </span>
          </div>

          <div>
            <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600, marginBottom: '0.3rem' }}>
              Available Balance
            </span>
            <div className="points-pill" style={{ display: 'inline-flex', padding: '0.35rem 0.85rem', fontSize: '0.95rem' }}>
              <Coins size={16} color="var(--discord-yellow)" />
              <span>{points} pts</span>
            </div>
          </div>

          <div>
            <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600, marginBottom: '0.3rem' }}>
              Account UUID
            </span>
            <code style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--bg-surface-elevated)', padding: '0.2rem 0.45rem', borderRadius: '4px' }}>
              {profile?.id || user?.id || 'N/A'}
            </code>
          </div>
        </div>
      </div>

      {/* Family & Invite Code Card */}
      <div className="placeholder-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div className="placeholder-icon family" style={{ background: 'rgba(254, 231, 92, 0.15)', color: 'var(--discord-yellow)' }}>
            <Users size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem' }}>
              {family?.name || 'Family Nest'}
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Invite family members to join and collaborate
            </span>
          </div>
        </div>

        {family?.invite_code ? (
          <div
            style={{
              background: 'var(--bg-deep)',
              border: '1.5px dashed var(--discord-blurple)',
              borderRadius: 'var(--radius-md)',
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
                  fontSize: '1.75rem',
                  fontWeight: 900,
                  letterSpacing: '0.2em',
                  color: 'var(--text-pure)',
                  fontFamily: 'monospace',
                }}
              >
                {family.invite_code}
              </div>
              <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Kids and co-parents enter this code when registering to link directly into your family.
              </p>
            </div>

            <button
              onClick={handleCopyCode}
              type="button"
              className="auth-submit-btn"
              style={{
                width: 'auto',
                margin: 0,
                padding: '0.65rem 1.25rem',
                fontSize: '0.88rem',
                background: copied ? 'var(--discord-green)' : 'var(--discord-blurple)',
                color: copied ? '#090a0f' : '#ffffff',
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
            No family linked yet. Use the setup prompt above to create or join a family.
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
                      borderRadius: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span className={`role-badge ${m.role}`}>
                        {m.role === 'parent' ? 'Parent' : 'Kid'}
                      </span>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-pure)' }}>
                        {m.id === user?.id ? 'You' : `Member (${m.id.slice(0, 8)}...)`}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--discord-yellow)', fontWeight: 700, fontSize: '0.9rem' }}>
                      <Coins size={15} />
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
