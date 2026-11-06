import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { useTheme } from '../../context/useTheme'
import { createFamily, joinFamilyByCode } from '../../services/familyService'
import Toast from '../common/Toast'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Users,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Zap,
  Gamepad2,
  CheckCircle2,
} from 'lucide-react'
import '../../styles/auth.css'

export default function SignUp() {
  // 3-Step Wizard: 1: Role & Name, 2: Theme Selection, 3: Account & Family
  const [step, setStep] = useState(1)

  // Step 1: Role & Display Name
  const [role, setRole] = useState('parent') // 'parent' or 'kid'
  const [displayName, setDisplayName] = useState('')

  // Step 2: Theme Selection
  const [themeChoice, setThemeChoice] = useState('playful') // 'playful' or 'modern'

  // Step 3: Account Credentials & Family Setup
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [familyName, setFamilyName] = useState('')
  const [inviteCode, setInviteCode] = useState('')

  const [toast, setToast] = useState({ message: '', type: 'error' })
  const [submitting, setSubmitting] = useState(false)

  const { signUp, refreshProfile } = useAuth()
  const { setTheme } = useTheme()
  const navigate = useNavigate()

  const showError = (msg) => setToast({ message: msg, type: 'error' })
  const showSuccess = (msg) => setToast({ message: msg, type: 'success' })

  // Synchronize active theme preview when themeChoice changes
  useEffect(() => {
    setTheme(themeChoice)
  }, [themeChoice, setTheme])

  // Step 1 -> Step 2 validation
  const handleStep1Next = (e) => {
    e.preventDefault()
    setToast({ message: '', type: 'error' })

    if (!displayName.trim()) {
      showError('Please enter your name or nickname.')
      return
    }

    // Auto-suggest family name for parents based on display name
    if (role === 'parent' && !familyName) {
      setFamilyName(`${displayName.trim()}'s Family`)
    }

    setStep(2)
  }

  // Step 2 -> Step 3 validation
  const handleStep2Next = (e) => {
    e.preventDefault()
    setToast({ message: '', type: 'error' })
    setStep(3)
  }

  // Step 3 Final Submit
  const handleFinalSubmit = async (e) => {
    e.preventDefault()
    setToast({ message: '', type: 'error' })

    const cleanEmail = email.trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!cleanEmail || !password) {
      showError('Please enter both email and password.')
      return
    }

    if (!emailRegex.test(cleanEmail)) {
      showError('Please enter a valid email address.')
      return
    }

    if (password.length < 6) {
      showError('Password must be at least 6 characters.')
      return
    }

    if (role === 'parent' && !familyName.trim()) {
      showError('Please enter a family name.')
      return
    }

    if (role === 'kid') {
      const code = inviteCode.trim().toUpperCase()
      if (!code) {
        showError('Please enter your 6-digit family invite code.')
        return
      }
      if (code.length !== 6) {
        showError('Invite codes must be exactly 6 characters.')
        return
      }
    }

    setSubmitting(true)
    try {
      // 1. Sign up user in Supabase auth with metadata
      const authData = await signUp({
        email: cleanEmail,
        password,
        role,
        displayName: displayName.trim(),
        themePreference: themeChoice,
      })

      const userId = authData?.user?.id
      if (!userId) {
        throw new Error('Account initialization failed. Please try again.')
      }

      // 2. Setup Family
      if (role === 'parent') {
        const newFam = await createFamily({
          name: familyName.trim(),
          userId,
        })
        showSuccess(`Family "${newFam.name}" created! Invite code: ${newFam.invite_code}`)
      } else {
        await joinFamilyByCode({
          inviteCode: inviteCode.trim().toUpperCase(),
          userId,
        })
        showSuccess('Successfully joined your family nest!')
      }

      await refreshProfile()

      // Handle unconfirmed email scenario
      if (authData?.user && !authData?.session) {
        showSuccess('Account created! Please check your email to verify before signing in.')
      } else {
        navigate('/tasks')
      }
    } catch (err) {
      console.error('Registration failed:', err)
      const raw = err.message || ''
      if (raw.toLowerCase().includes('already registered')) {
        showError('This email is already in use. Please sign in instead.')
      } else if (raw.toLowerCase().includes('invite code') || raw.toLowerCase().includes('family not found')) {
        showError('Invalid 6-digit family invite code. Please double-check with your parent.')
      } else {
        showError(raw || 'Failed to complete registration.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: '480px' }}>
        <div className="auth-header">
          <div className="auth-logo-badge">
            <img src="/logo.png" alt="TaskNest Logo" className="brand-logo-img" />
          </div>
          <h1 className="auth-title">
            {step === 1 && 'Welcome to TaskNest'}
            {step === 2 && 'Pick Your Vibe'}
            {step === 3 && 'Create Account'}
          </h1>
          <p className="auth-subtitle">
            {step === 1 && 'Step 1 of 3: Choose your role & name'}
            {step === 2 && 'Step 2 of 3: Choose your visual theme'}
            {step === 3 && (role === 'parent' ? 'Step 3 of 3: Credentials & Family setup' : 'Step 3 of 3: Credentials & Join family')}
          </p>
        </div>

        {/* Global Toast Alert */}
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: 'error' })}
        />

        {/* Step Progress Bar */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              style={{
                flex: 1,
                height: '5px',
                borderRadius: '4px',
                backgroundColor: s <= step ? 'var(--discord-blurple)' : 'var(--bg-surface-elevated)',
                border: s <= step ? 'none' : '1px solid var(--border-subtle)',
                transition: 'all 0.25s ease',
              }}
            />
          ))}
        </div>

        {/* STEP 1: Role & Display Name */}
        {step === 1 && (
          <form onSubmit={handleStep1Next} className="auth-form">
            <div className="form-group">
              <label className="form-label">Are you a Parent or a Kid?</label>
              <div className="role-selector-grid">
                <button
                  type="button"
                  className={`role-choice-card ${role === 'parent' ? 'selected' : ''}`}
                  onClick={() => setRole('parent')}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '1.1rem 0.8rem',
                    borderRadius: '16px',
                    border: role === 'parent' ? '2.5px solid var(--discord-purple)' : '1px solid var(--border-subtle)',
                    background: role === 'parent' ? 'rgba(155, 89, 182, 0.12)' : 'var(--bg-surface-elevated)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ fontSize: '1.8rem' }}>👑</div>
                  <strong style={{ color: 'var(--text-pure)', fontSize: '1.05rem' }}>Parent</strong>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    Create chores, review proof, approve rewards
                  </span>
                </button>

                <button
                  type="button"
                  className={`role-choice-card ${role === 'kid' ? 'selected' : ''}`}
                  onClick={() => setRole('kid')}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '1.1rem 0.8rem',
                    borderRadius: '16px',
                    border: role === 'kid' ? '2.5px solid var(--discord-yellow)' : '1px solid var(--border-subtle)',
                    background: role === 'kid' ? 'rgba(254, 231, 92, 0.12)' : 'var(--bg-surface-elevated)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ fontSize: '1.8rem' }}>🚀</div>
                  <strong style={{ color: 'var(--text-pure)', fontSize: '1.05rem' }}>Kid</strong>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    Claim chores, earn points, redeem cool rewards
                  </span>
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <label htmlFor="displayName" className="form-label">
                What should we call you?
              </label>
              <div className="input-wrapper">
                <User size={18} className="input-icon" />
                <input
                  id="displayName"
                  type="text"
                  className="input-field"
                  placeholder={role === 'parent' ? 'e.g. Mom, Dad, Sarah' : 'e.g. Leo, Emma, Alex'}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="auth-submit-btn" style={{ marginTop: '1rem' }}>
              <span>Continue to Theme</span>
              <ArrowRight size={18} />
            </button>
          </form>
        )}

        {/* STEP 2: Theme Selection */}
        {step === 2 && (
          <form onSubmit={handleStep2Next} className="auth-form">
            <div className="form-group">
              <label className="form-label">Choose your interface style</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {/* Option A: Playful */}
                <div
                  onClick={() => setThemeChoice('playful')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem',
                    borderRadius: '18px',
                    border: themeChoice === 'playful' ? '2.5px solid #581c87' : '1.5px solid var(--border-subtle)',
                    boxShadow: themeChoice === 'playful' ? '0 5px 0 #581c87' : 'none',
                    background: themeChoice === 'playful' ? 'rgba(124, 58, 237, 0.12)' : 'var(--bg-surface-elevated)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '14px',
                      background: '#e0f2fe',
                      border: '2px solid #581c87',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#7c3aed',
                      flexShrink: 0,
                    }}
                  >
                    <Gamepad2 size={24} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <strong style={{ color: 'var(--text-pure)', fontSize: '1rem' }}>Playful 🎮</strong>
                      {themeChoice === 'playful' && <CheckCircle2 size={16} color="var(--discord-blurple)" />}
                    </div>
                    <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Bright sky blue, 3D chunky purple depth, bouncy cards & star points.
                    </p>
                  </div>
                </div>

                {/* Option B: Modern */}
                <div
                  onClick={() => setThemeChoice('modern')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem',
                    borderRadius: '18px',
                    border: themeChoice === 'modern' ? '2.5px solid var(--discord-blurple)' : '1.5px solid var(--border-subtle)',
                    boxShadow: themeChoice === 'modern' ? '0 4px 14px rgba(88, 101, 242, 0.35)' : 'none',
                    background: themeChoice === 'modern' ? 'rgba(88, 101, 242, 0.12)' : 'var(--bg-surface-elevated)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '14px',
                      background: '#12141d',
                      border: '1.5px solid #5865f2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#5865f2',
                      flexShrink: 0,
                    }}
                  >
                    <Zap size={24} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <strong style={{ color: 'var(--text-pure)', fontSize: '1rem' }}>Modern ⚡</strong>
                      {themeChoice === 'modern' && <CheckCircle2 size={16} color="var(--discord-blurple)" />}
                    </div>
                    <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Sleek dark monochrome with vibrant Discord role accent glows.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button
                type="button"
                className="signout-btn"
                onClick={() => setStep(1)}
                style={{ flex: '0 0 auto', padding: '0.8rem 1rem', borderRadius: '12px' }}
              >
                <ArrowLeft size={16} /> Back
              </button>
              <button type="submit" className="auth-submit-btn" style={{ flex: 1, margin: 0 }}>
                <span>Continue to Account</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Account & Family Setup */}
        {step === 3 && (
          <form onSubmit={handleFinalSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  id="email"
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

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="input-field"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Family Setup Fields */}
            {role === 'parent' ? (
              <div className="form-group">
                <label htmlFor="familyName" className="form-label">
                  Family Nest Name
                </label>
                <div className="input-wrapper">
                  <Users size={18} className="input-icon" />
                  <input
                    id="familyName"
                    type="text"
                    className="input-field"
                    placeholder="e.g. The Millers"
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                    required
                  />
                </div>
                <span className="form-helper-text">
                  A 6-digit invite code will be automatically generated so kids can join.
                </span>
              </div>
            ) : (
              <div className="form-group">
                <label htmlFor="inviteCode" className="form-label">
                  6-Digit Family Invite Code
                </label>
                <div className="input-wrapper">
                  <KeyRound size={18} className="input-icon" />
                  <input
                    id="inviteCode"
                    type="text"
                    maxLength={6}
                    className="input-field"
                    placeholder="e.g. 7X9K2P"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    style={{ textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700 }}
                    required
                  />
                </div>
                <span className="form-helper-text">
                  Ask your parent for the 6-digit code shown in their Settings page.
                </span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button
                type="button"
                className="signout-btn"
                onClick={() => setStep(2)}
                disabled={submitting}
                style={{ flex: '0 0 auto', padding: '0.8rem 1rem', borderRadius: '12px' }}
              >
                <ArrowLeft size={16} /> Back
              </button>
              <button
                type="submit"
                className="auth-submit-btn"
                disabled={submitting}
                style={{ flex: 1, margin: 0 }}
              >
                {submitting ? (
                  <>
                    <span className="btn-spinner" />
                    <span>Creating Nest...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Complete Sign Up</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        <div className="auth-footer">
          Already have an account?
          <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  )
}
