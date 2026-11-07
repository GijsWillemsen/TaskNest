import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { useTheme } from '../../context/useTheme'
import { useLanguage } from '../../context/useLanguage'
import { THEMES } from '../../context/theme-context'
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
  CheckCircle2,
} from 'lucide-react'
import '../../styles/auth.css'

export default function SignUp() {
  // 3-Step Wizard: 1: Role & Name, 2: Theme Selection, 3: Account & Family
  const [step, setStep] = useState(1)

  // Step 1: Role & Display Name
  const [role, setRole] = useState('parent') // 'parent' or 'kid'
  const [displayName, setDisplayName] = useState('')

  // Step 2: Theme Selection (default: 'candy')
  const [themeChoice, setThemeChoice] = useState('candy')

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
  const { t, isDutch } = useLanguage()
  const navigate = useNavigate()

  const showError = (msg) => setToast({ message: msg, type: 'error' })
  const showSuccess = (msg) => setToast({ message: msg, type: 'success' })

  // Synchronize active theme preview as the user selects a theme in Step 2
  useEffect(() => {
    setTheme(themeChoice)
  }, [themeChoice, setTheme])

  // Step 1 -> Step 2 validation
  const handleStep1Next = (e) => {
    e.preventDefault()
    setToast({ message: '', type: 'error' })

    if (!displayName.trim()) {
      showError(t('auth.err_enter_name'))
      return
    }

    // Auto-suggest family name for parents
    if (role === 'parent' && !familyName) {
      const defaultFamily = isDutch
        ? `Familie ${displayName.trim()}`
        : `${displayName.trim()}'s Family`
      setFamilyName(defaultFamily)
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
      showError(t('auth.err_enter_credentials'))
      return
    }

    if (!emailRegex.test(cleanEmail)) {
      showError(t('auth.err_invalid_email'))
      return
    }

    if (password.length < 6) {
      showError(t('auth.err_password_len'))
      return
    }

    if (role === 'parent' && !familyName.trim()) {
      showError(t('auth.err_enter_family_name'))
      return
    }

    if (role === 'kid') {
      const code = inviteCode.trim().toUpperCase()
      if (!code) {
        showError(t('auth.err_enter_code'))
        return
      }
      if (code.length !== 6) {
        showError(t('auth.err_code_len'))
        return
      }
    }

    setSubmitting(true)
    try {
      // 1. Sign up user with metadata (family_name & invite_code included so PostgreSQL trigger links automatically)
      const authData = await signUp({
        email: cleanEmail,
        password,
        role,
        displayName: displayName.trim(),
        themePreference: themeChoice,
        familyName: role === 'parent' ? familyName.trim() : null,
        inviteCode: role === 'kid' ? inviteCode.trim().toUpperCase() : null,
      })

      const userId = authData?.user?.id
      if (!userId) {
        throw new Error(isDutch ? 'Account initialisatie mislukt. Probeer het opnieuw.' : 'Account initialization failed. Please try again.')
      }

      // 2. Client-side fallback setup for family
      try {
        if (role === 'parent') {
          const newFam = await createFamily({
            name: familyName.trim(),
            userId,
          })
          if (newFam) {
            showSuccess(t('auth.succ_family_created', { name: newFam.name, code: newFam.invite_code }))
          }
        } else {
          await joinFamilyByCode({
            inviteCode: inviteCode.trim().toUpperCase(),
            userId,
          })
          showSuccess(t('auth.succ_family_joined'))
        }
      } catch (famErr) {
        console.warn('Post-signup family fallback notice:', famErr.message)
      }

      await refreshProfile()

      // Handle unconfirmed email scenario
      if (authData?.user && !authData?.session) {
        showSuccess(t('auth.succ_verify_email'))
      } else {
        navigate('/tasks')
      }
    } catch (err) {
      console.error('Registration failed:', err)
      const raw = err.message || ''
      if (raw.toLowerCase().includes('already registered')) {
        showError(t('auth.err_email_in_use'))
      } else if (raw.toLowerCase().includes('invite code') || raw.toLowerCase().includes('family not found')) {
        showError(t('auth.err_invalid_code'))
      } else {
        showError(raw || (isDutch ? 'Registratie mislukt.' : 'Failed to complete registration.'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: '480px' }}>
        <div className="auth-header">
          <h1 className="auth-title">
            {step === 1 && t('auth.signup_title')}
            {step === 2 && t('auth.choose_theme_title')}
            {step === 3 && t('auth.final_step_title')}
          </h1>
          <p className="auth-subtitle">
            {step === 1 && `${t('auth.step_indicator', { step: 1 })}: ${t('auth.step1_title')}`}
            {step === 2 && `${t('auth.step_indicator', { step: 2 })}: ${t('auth.choose_theme_sub')}`}
            {step === 3 && (role === 'parent' ? `${t('auth.step_indicator', { step: 3 })}: ${t('auth.step3_parent_title')}` : `${t('auth.step_indicator', { step: 3 })}: ${t('auth.step3_kid_title')}`)}
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
                backgroundColor: s <= step ? 'var(--theme-accent, var(--discord-blurple))' : 'var(--bg-surface-elevated)',
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
              <label className="form-label">{t('auth.step1_title')}</label>
              <div className="role-selector-grid">
                <button
                  type="button"
                  className={`role-choice-card ${role === 'parent' ? 'selected' : ''}`}
                  onClick={() => setRole('parent')}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '1rem 0.75rem',
                    borderRadius: '16px',
                    border: role === 'parent' ? '2.5px solid var(--theme-accent, var(--discord-purple))' : '1px solid var(--border-subtle)',
                    background: role === 'parent' ? 'rgba(155, 89, 182, 0.14)' : 'var(--bg-surface-elevated)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ fontSize: '1.75rem' }}>👑</div>
                  <strong style={{ color: 'var(--text-pure)', fontSize: '1.05rem' }}>{t('auth.parent_role')}</strong>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    {t('auth.parent_desc')}
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
                    gap: '0.35rem',
                    padding: '1rem 0.75rem',
                    borderRadius: '16px',
                    border: role === 'kid' ? '2.5px solid var(--discord-yellow)' : '1px solid var(--border-subtle)',
                    background: role === 'kid' ? 'rgba(254, 231, 92, 0.14)' : 'var(--bg-surface-elevated)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ fontSize: '1.75rem' }}>🚀</div>
                  <strong style={{ color: 'var(--text-pure)', fontSize: '1.05rem' }}>{t('auth.kid_role')}</strong>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    {t('auth.kid_desc')}
                  </span>
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <label htmlFor="displayName" className="form-label">
                {t('auth.name_question')}
              </label>
              <div className="input-wrapper">
                <User size={18} className="input-icon" />
                <input
                  id="displayName"
                  type="text"
                  className="input-field"
                  placeholder={t('auth.name_placeholder')}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="auth-submit-btn" style={{ marginTop: '1rem' }}>
              <span>{t('auth.continue_theme')}</span>
              <ArrowRight size={18} />
            </button>
          </form>
        )}

        {/* STEP 2: 5 Themes Selection */}
        {step === 2 && (
          <form onSubmit={handleStep2Next} className="auth-form">
            <div className="form-group">
              <label className="form-label">{t('auth.choose_theme_sub')}</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '360px', overflowY: 'auto', paddingRight: '4px' }}>
                {THEMES.map((th) => {
                  const isSelected = themeChoice === th.id
                  return (
                    <div
                      key={th.id}
                      onClick={() => setThemeChoice(th.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.85rem',
                        padding: '0.85rem 1rem',
                        borderRadius: '16px',
                        border: isSelected ? `2.5px solid ${th.accentPreview}` : '1.5px solid var(--border-subtle)',
                        boxShadow: isSelected ? `0 4px 14px ${th.accentPreview}33` : 'none',
                        background: isSelected ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '12px',
                          background: th.bgPreview,
                          border: `2px solid ${th.accentPreview}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <div
                          style={{
                            width: '14px',
                            height: '14px',
                            borderRadius: '50%',
                            backgroundColor: th.accentPreview,
                          }}
                        />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
                          <strong style={{ color: 'var(--text-pure)', fontSize: '0.95rem' }}>
                            {th.name}
                          </strong>
                          {isSelected && <CheckCircle2 size={16} color="var(--theme-accent, var(--discord-blurple))" />}
                        </div>
                        <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                          {th.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button
                type="button"
                className="signout-btn"
                onClick={() => setStep(1)}
                style={{ flex: '0 0 auto', padding: '0.8rem 1rem', borderRadius: '12px' }}
              >
                <ArrowLeft size={16} /> {t('auth.back')}
              </button>
              <button type="submit" className="auth-submit-btn" style={{ flex: 1, margin: 0 }}>
                <span>{t('auth.continue_account')}</span>
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
                {t('auth.email_label')}
              </label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  id="email"
                  type="email"
                  className="input-field"
                  placeholder="naam@gezin.nl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                {t('auth.password_label')}
              </label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="input-field"
                  placeholder="••••••••"
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
                  {t('auth.family_name_label')}
                </label>
                <div className="input-wrapper">
                  <Users size={18} className="input-icon" />
                  <input
                    id="familyName"
                    type="text"
                    className="input-field"
                    placeholder={t('auth.family_name_placeholder')}
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                    required
                  />
                </div>
                <span className="form-helper-text">
                  {t('auth.parent_helper')}
                </span>
              </div>
            ) : (
              <div className="form-group">
                <label htmlFor="inviteCode" className="form-label">
                  {t('auth.invite_code_label')}
                </label>
                <div className="input-wrapper">
                  <KeyRound size={18} className="input-icon" />
                  <input
                    id="inviteCode"
                    type="text"
                    maxLength={6}
                    className="input-field"
                    placeholder={t('auth.invite_code_placeholder')}
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    style={{ textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700 }}
                    required
                  />
                </div>
                <span className="form-helper-text">
                  {t('auth.kid_helper')}
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
                <ArrowLeft size={16} /> {t('auth.back')}
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
                    <span>{t('auth.setting_up')}</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>{t('auth.create_account_btn')}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        <div className="auth-footer">
          <Link to="/login">{t('auth.have_account')}</Link>
        </div>
      </div>
    </div>
  )
}
