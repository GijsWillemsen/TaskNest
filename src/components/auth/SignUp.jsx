import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { createFamily, joinFamilyByCode } from '../../services/familyService'
import Toast from '../common/Toast'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
  Sparkles,
  Users,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  Check,
} from 'lucide-react'
import '../../styles/auth.css'

export default function SignUp() {
  const [step, setStep] = useState(1) // 1: Credentials & Role, 2: Family Setup
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('parent') // 'parent' or 'kid'
  const [showPassword, setShowPassword] = useState(false)

  // Step 2 state
  const [familyAction, setFamilyAction] = useState('create') // 'create' or 'join'
  const [familyName, setFamilyName] = useState('')
  const [inviteCode, setInviteCode] = useState('')

  const [toast, setToast] = useState({ message: '', type: 'error' })
  const [submitting, setSubmitting] = useState(false)

  const { signUp, refreshProfile } = useAuth()
  const navigate = useNavigate()

  const showError = (msg) => setToast({ message: msg, type: 'error' })
  const showSuccess = (msg) => setToast({ message: msg, type: 'success' })

  const handleStep1Next = (e) => {
    e.preventDefault()
    setToast({ message: '', type: 'error' })

    const cleanEmail = email.trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!cleanEmail || !password) {
      showError('Please enter both email and password.')
      return
    }

    if (!emailRegex.test(cleanEmail)) {
      showError('Please enter a valid email address (e.g. name@family.com).')
      return
    }

    if (password.length < 6) {
      showError('Password must be at least 6 characters.')
      return
    }

    // Default family name suggestion
    if (role === 'parent' && !familyName) {
      const suggestedName = cleanEmail.split('@')[0]
      setFamilyName(`${suggestedName.charAt(0).toUpperCase() + suggestedName.slice(1)}'s Family`)
    }

    setStep(2)
  }

  const handleFinalSubmit = async (e) => {
    e.preventDefault()
    setToast({ message: '', type: 'error' })

    const cleanEmail = email.trim().toLowerCase()

    // Validate step 2 inputs
    if (role === 'parent' && familyAction === 'create' && !familyName.trim()) {
      showError('Please enter a name for your family.')
      return
    }

    if ((role === 'kid' || (role === 'parent' && familyAction === 'join')) && !inviteCode.trim()) {
      showError('Please enter the 6-digit family invite code.')
      return
    }

    if ((role === 'kid' || familyAction === 'join') && inviteCode.trim().length !== 6) {
      showError('Invite codes must be exactly 6 characters.')
      return
    }

    setSubmitting(true)
    try {
      // 1. Sign up user in Supabase auth
      const authData = await signUp({ email: cleanEmail, password, role })
      const userId = authData?.user?.id

      if (!userId) {
        throw new Error('Could not initialize account. Please try again.')
      }

      // 2. Setup Family
      if (role === 'parent' && familyAction === 'create') {
        const newFam = await createFamily({
          name: familyName.trim(),
          userId,
        })
        showSuccess(`Family "${newFam.name}" created! Invite code: ${newFam.invite_code}`)
      } else {
        await joinFamilyByCode({
          inviteCode: inviteCode.trim(),
          userId,
        })
        showSuccess('Successfully joined your family!')
      }

      await refreshProfile()

      // If email confirmation is required and no session was created:
      if (authData?.user && !authData?.session) {
        showSuccess('Account created! Please check your email to confirm before logging in.')
      } else {
        navigate('/tasks')
      }
    } catch (err) {
      console.error('Registration failed:', err)
      const raw = err.message || ''
      if (raw.toLowerCase().includes('already registered')) {
        showError('This email is already in use. Please sign in instead.')
      } else if (raw.toLowerCase().includes('invite code') || raw.toLowerCase().includes('family not found')) {
        showError('Invalid 6-digit family invite code. Please check with your family.')
      } else {
        showError(raw || 'Failed to complete registration.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo-badge">
            <img src="/logo.png" alt="TaskNest Logo" className="brand-logo-img" />
          </div>
          <h1 className="auth-title">
            {step === 1 ? 'Join TaskNest' : 'Set Up Your Family'}
          </h1>
          <p className="auth-subtitle">
            {step === 1
              ? 'Turn chores into fun family achievements'
              : role === 'parent'
              ? 'Create a family group or join an existing one'
              : 'Enter the invite code from your parent'}
          </p>
        </div>

        {toast.message && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ message: '', type: 'error' })}
          />
        )}

        {/* STEP 1: CREDENTIALS & ROLE */}
        {step === 1 && (
          <form onSubmit={handleStep1Next} className="auth-form" noValidate>
            {/* Role Selection */}
            <div className="role-selection-group">
              <label className="role-selection-label">Select Your Role</label>
              <div className="role-cards-container">
                <button
                  type="button"
                  className={`role-card-btn ${role === 'parent' ? 'active-parent' : ''}`}
                  onClick={() => setRole('parent')}
                >
                  <div className="role-icon-wrapper role-icon-parent">
                    <UserCheck size={22} />
                  </div>
                  <div className="role-name">Parent</div>
                  <div className="role-desc">Manage chores & family</div>
                </button>

                <button
                  type="button"
                  className={`role-card-btn ${role === 'kid' ? 'active-kid' : ''}`}
                  onClick={() => setRole('kid')}
                >
                  <div className="role-icon-wrapper role-icon-kid">
                    <Sparkles size={22} />
                  </div>
                  <div className="role-name">Kid</div>
                  <div className="role-desc">Do chores & earn rewards</div>
                </button>
              </div>
            </div>

            {/* Email Field */}
            <div className="form-group">
              <label className="form-label" htmlFor="email-input">
                Email Address
              </label>
              <div className="input-wrapper">
                <div className="input-icon-left">
                  <Mail size={18} />
                </div>
                <input
                  id="email-input"
                  type="email"
                  className="input-field"
                  placeholder="name@family.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label className="form-label" htmlFor="password-input">
                Password
              </label>
              <div className="input-wrapper">
                <div className="input-icon-left">
                  <Lock size={18} />
                </div>
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  className="input-field input-field-with-toggle"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit-btn">
              <span>Next: Family Setup</span>
              <ArrowRight size={18} />
            </button>
          </form>
        )}

        {/* STEP 2: FAMILY SETUP */}
        {step === 2 && (
          <form onSubmit={handleFinalSubmit} className="auth-form" noValidate>
            {/* If Parent: Choice between Create Family or Join Existing */}
            {role === 'parent' && (
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setFamilyAction('create')}
                  style={{
                    flex: 1,
                    padding: '0.65rem',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: familyAction === 'create' ? 'var(--discord-blurple)' : 'var(--border-subtle)',
                    background: familyAction === 'create' ? 'rgba(88, 101, 242, 0.15)' : 'var(--bg-surface-elevated)',
                    color: familyAction === 'create' ? '#ffffff' : 'var(--text-muted)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Create Family
                </button>

                <button
                  type="button"
                  onClick={() => setFamilyAction('join')}
                  style={{
                    flex: 1,
                    padding: '0.65rem',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: familyAction === 'join' ? 'var(--discord-blurple)' : 'var(--border-subtle)',
                    background: familyAction === 'join' ? 'rgba(88, 101, 242, 0.15)' : 'var(--bg-surface-elevated)',
                    color: familyAction === 'join' ? '#ffffff' : 'var(--text-muted)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Join Family
                </button>
              </div>
            )}

            {/* Create Family Option (Parents) */}
            {role === 'parent' && familyAction === 'create' && (
              <div className="form-group">
                <label className="form-label" htmlFor="fam-name">
                  Family Name
                </label>
                <div className="input-wrapper">
                  <div className="input-icon-left">
                    <Users size={18} />
                  </div>
                  <input
                    id="fam-name"
                    type="text"
                    className="input-field"
                    placeholder="e.g. The Willemsen Family"
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <span className="form-helper-text">
                  A unique 6-digit invite code will be created for kids and partners to join.
                </span>
              </div>
            )}

            {/* Join Family Option (Kids or Co-Parents) */}
            {(role === 'kid' || (role === 'parent' && familyAction === 'join')) && (
              <div className="form-group">
                <label className="form-label" htmlFor="invite-code">
                  6-Digit Family Invite Code
                </label>
                <div className="input-wrapper">
                  <div className="input-icon-left">
                    <KeyRound size={18} />
                  </div>
                  <input
                    id="invite-code"
                    type="text"
                    maxLength={6}
                    className="input-field"
                    placeholder="e.g. TN8492"
                    style={{ textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700 }}
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    required
                    autoFocus
                  />
                </div>
                <span className="form-helper-text">
                  Ask your parent for the 6-character code found on their Settings screen.
                </span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="modal-btn-cancel"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                disabled={submitting}
              >
                <ArrowLeft size={16} />
                Back
              </button>

              <button
                type="submit"
                className="auth-submit-btn"
                style={{ flex: 2, margin: 0 }}
                disabled={submitting}
              >
                {submitting ? (
                  'Setting up...'
                ) : (
                  <>
                    <Check size={18} />
                    Complete Sign Up
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        <div className="auth-footer">
          Already have an account?
          <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  )
}
