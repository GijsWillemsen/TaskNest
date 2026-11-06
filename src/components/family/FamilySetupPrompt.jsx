import { useState } from 'react'
import { createFamily, joinFamilyByCode } from '../../services/familyService'
import { Users, KeyRound, Plus } from 'lucide-react'

export default function FamilySetupPrompt({ userId, role, onComplete }) {
  const [action, setAction] = useState(role === 'parent' ? 'create' : 'join')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleAction = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)

    try {
      if (action === 'create') {
        if (!name.trim()) throw new Error('Please enter a family name.')
        await createFamily({ name: name.trim(), userId })
      } else {
        if (!code.trim()) throw new Error('Please enter the 6-digit invite code.')
        await joinFamilyByCode({ inviteCode: code.trim(), userId })
      }
      if (onComplete) onComplete()
    } catch (err) {
      setErrorMsg(err.message || 'Failed to connect to family.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-alert" style={{ background: 'var(--bg-surface)', border: '1px solid var(--discord-blurple)', flexDirection: 'column', gap: '0.85rem', padding: '1.25rem', marginTop: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        <Users size={22} color="var(--discord-blurple)" />
        <div>
          <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-pure)' }}>
            Join or Create Your Family Nest
          </h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Link your account to your family to see chores, rewards, and leaderboards.
          </p>
        </div>
      </div>

      {errorMsg && (
        <span style={{ color: 'var(--discord-red)', fontSize: '0.85rem' }}>{errorMsg}</span>
      )}

      {role === 'parent' && (
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            type="button"
            onClick={() => setAction('create')}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              border: 'none',
              background: action === 'create' ? 'var(--discord-blurple)' : 'var(--bg-surface-elevated)',
              color: '#ffffff',
              cursor: 'pointer',
            }}
          >
            Create Family
          </button>
          <button
            type="button"
            onClick={() => setAction('join')}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              border: 'none',
              background: action === 'join' ? 'var(--discord-blurple)' : 'var(--bg-surface-elevated)',
              color: '#ffffff',
              cursor: 'pointer',
            }}
          >
            Join Family
          </button>
        </div>
      )}

      <form onSubmit={handleAction} style={{ display: 'flex', gap: '0.5rem', width: '100%', flexWrap: 'wrap' }}>
        {action === 'create' ? (
          <input
            type="text"
            className="input-field"
            placeholder="Family Name (e.g. The Millers)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ flex: 1, minWidth: '180px' }}
            required
          />
        ) : (
          <input
            type="text"
            maxLength={6}
            className="input-field"
            placeholder="6-Digit Invite Code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            style={{ flex: 1, minWidth: '180px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
            required
          />
        )}

        <button
          type="submit"
          className="auth-submit-btn"
          style={{ width: 'auto', margin: 0, padding: '0.65rem 1.15rem' }}
          disabled={loading}
        >
          {loading ? 'Connecting...' : action === 'create' ? <><Plus size={16} /> Create</> : <><KeyRound size={16} /> Join</>}
        </button>
      </form>
    </div>
  )
}
