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
  Crown,
  Smile,
} from 'lucide-react'
import '../../styles/auth.css'

export default function SignUp() {
  // 4-Step Wizard:
  // Step 1: Language Preference (NL / EN)
  // Step 2: Role (Parent / Kid) & Display Name
  // Step 3: Theme Selection (4 Light / 4 Dark)
  // Step 4: Account Credentials & Family Setup
  const [step, setStep] = useState(1)

  // Step 1: Language
  const { lang, setLanguage, t, isDutch } = useLanguage()

  // Step 2: Role & Display Name
  const [role, setRole] = useState('parent') // 'parent' or 'kid'
  const [displayName, setDisplayName] = useState('')

  // Step 3: Theme Selection
  const [themeChoice, setThemeChoice] = useState('candy')
  const [themeFilter, setThemeFilter] = useState('all') // 'all', 'light', 'dark'

  // Step 4: Account Credentials & Family Setup
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

  // Synchronize active theme preview as the user selects a theme in Step 3
  useEffect(() => {
    setTheme(themeChoice)
  }, [themeChoice, setTheme])

  // Simple password security checker: min 6 chars, letters + numbers
  const isPasswordSecure = (pwd) => {
    if (!pwd || pwd.length < 6) return false
    const hasLetter = /[a-zA-Z]/.test(pwd)
    const hasNumber = /[0-9]/.test(pwd)
    return hasLetter && hasNumber
  }

  // Step 1 -> Step 2
  const handleStep1Next = (e) => {
    e.preventDefault()
    setToast({ message: '', type: 'error' })
    setStep(2)
  }

  // Step 2 -> Step 3 validation
  const handleStep2Next = (e) => {
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

    setStep(3)
  }

  // Step 3 -> Step 4 validation
  const handleStep3Next = (e) => {
    e.preventDefault()
    setToast({ message: '', type: 'error' })
    setStep(4)
  }

  // Step 4 Final Submit
  const handleFinalSubmit = async (e) => {
    e.preventDefault()
    setToast({ message: '', type: 'error' })

    const cleanEmail = email.trim().toLowerCase()
    // Realistic email regex verifying recipient, @, domain, and valid TLD (.com, .nl, etc.)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

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

    if (!isPasswordSecure(password)) {
      showError(t('auth.err_password_insecure'))
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
      // 1. Sign up user with metadata
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

  // Filtered themes for Step 3
  const visibleThemes = THEMES.filter((th) => {
    if (themeFilter === 'light') return th.mode === 'light'
    if (themeFilter === 'dark') return th.mode === 'dark'
    return true
  })

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: '480px' }}>
        <div className="auth-header">
          <h1 className="auth-title">
            {step === 1 && t('auth.signup_welcome_title')}
            {step === 2 && t('auth.signup_title')}
            {step === 3 && t('auth.choose_theme_title')}
            {step === 4 && t('auth.final_step_title')}
          </h1>
          <p className="auth-subtitle">
            {step === 1 && `${t('auth.step_indicator', { step: 1 })}: ${t('auth.step1_lang_title')}`}
            {step === 2 && `${t('auth.step_indicator', { step: 2 })}: ${t('auth.step2_role_title')}`}
            {step === 3 && `${t('auth.step_indicator', { step: 3 })}: ${t('auth.choose_theme_sub')}`}
            {step === 4 && (role === 'parent' ? `${t('auth.step_indicator', { step: 4 })}: ${t('auth.step4_parent_title')}` : `${t('auth.step_indicator', { step: 4 })}: ${t('auth.step4_kid_title')}`)}
          </p>
        </div>

        {/* Global Toast Alert */}
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: 'error' })}
        />

        {/* 4-Step Progress Bar */}
        <div style={{ display: 'flex', gap: '0.45rem', marginBottom: '1.5rem' }}>
          {[1, 2, 3, 4].map((s) => (
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

        {/* STEP 1: Language Selection */}
        {step === 1 && (
          <form onSubmit={handleStep1Next} className="auth-form">
            <div className="form-group">
              <label className="form-label">{t('auth.step1_lang_sub')}</label>
              <div className="role-cards-container">
                <button
                  type="button"
                  className={`role-card-btn ${lang === 'nl' ? 'active-parent' : ''}`}
                  onClick={() => setLanguage('nl')}
                >
                  <div className="role-icon-wrapper" style={{ fontSize: '1.8rem', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.35)' }}>
                    🇳🇱
                  </div>
                  <span className="role-name">{t('auth.lang_dutch_label')}</span>
                  <span className="role-desc">{t('auth.lang_dutch_desc')}</span>
                  {lang === 'nl' && (
                    <div style={{ marginTop: '0.45rem' }}>
                      <CheckCircle2 size={16} color="var(--theme-accent, var(--discord-blurple))" />
                    </div>
                  )}
                </button>

                <button
                  type="button"
                  className={`role-card-btn ${lang === 'en' ? 'active-parent' : ''}`}
                  onClick={() => setLanguage('en')}
                >
                  <div className="role-icon-wrapper" style={{ fontSize: '1.8rem', background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.35)' }}>
                    🇬🇧
                  </div>
                  <span className="role-name">{t('auth.lang_english_label')}</span>
                  <span className="role-desc">{t('auth.lang_english_desc')}</span>
                  {lang === 'en' && (
                    <div style={{ marginTop: '0.45rem' }}>
                      <CheckCircle2 size={16} color="var(--theme-accent, var(--discord-blurple))" />
                    </div>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit-btn" style={{ marginTop: '1rem' }}>
              <span>{t('common.next')}</span>
              <ArrowRight size={18} />
            </button>
          </form>
        )}

        {/* STEP 2: Role & Display Name */}
        {step === 2 && (
          <form onSubmit={handleStep2Next} className="auth-form">
            <div className="form-group">
              <label className="form-label">{t('auth.step2_role_title')}</label>
              <div className="role-cards-container">
                <button
                  type="button"
                  className={`role-card-btn ${role === 'parent' ? 'active-parent' : ''}`}
                  onClick={() => setRole('parent')}
                >
                  <div className="role-icon-wrapper role-icon-parent">
                    <Crown size={22} />
                  </div>
                  <span className="role-name">{t('auth.parent_role')}</span>
                  <span className="role-desc">{t('auth.parent_desc')}</span>
                  {role === 'parent' && (
                    <div style={{ marginTop: '0.45rem' }}>
                      <CheckCircle2 size={16} color="var(--theme-accent, var(--discord-blurple))" />
                    </div>
                  )}
                </button>

                <button
                  type="button"
                  className={`role-card-btn ${role === 'kid' ? 'active-kid' : ''}`}
                  onClick={() => setRole('kid')}
                >
                  <div className="role-icon-wrapper role-icon-kid">
                    <Smile size={22} />
                  </div>
                  <span className="role-name">{t('auth.kid_role')}</span>
                  <span className="role-desc">{t('auth.kid_desc')}</span>
                  {role === 'kid' && (
                    <div style={{ marginTop: '0.45rem' }}>
                      <CheckCircle2 size={16} color="var(--discord-yellow)" />
                    </div>
                  )}
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '0.65rem' }}>
              <label htmlFor="displayName" className="form-label">
                {t('auth.name_question')}
              </label>
              <div className="input-wrapper">
                <div className="input-icon-left">
                  <User size={18} />
                </div>
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

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button
                type="button"
                className="signout-btn"
                onClick={() => setStep(1)}
                style={{ flex: '0 0 auto', padding: '0.8rem 1rem', borderRadius: '12px' }}
              >
                <ArrowLeft size={16} /> {t('auth.back')}
              </button>
              <button type="submit" className="auth-submit-btn" style={{ flex: 1, margin: 0 }}>
                <span>{t('auth.continue_theme')}</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: 8 Balanced Themes Selection (4 Light / 4 Dark) */}
        {step === 3 && (
          <form onSubmit={handleStep3Next} className="auth-form">
            <div className="form-group">
              <label className="form-label">{t('auth.choose_theme_sub')}</label>

              {/* Light / Dark Filter Tabs */}
              <div
                style={{
                  display: 'flex',
                  gap: '0.35rem',
                  marginBottom: '0.75rem',
                  background: 'var(--bg-surface-elevated)',
                  padding: '3px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setThemeFilter('all')}
                  style={{
                    flex: 1,
                    padding: '0.4rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: themeFilter === 'all' ? 'var(--theme-accent, var(--discord-blurple))' : 'transparent',
                    color: themeFilter === 'all' ? '#ffffff' : 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {t('auth.filter_all_themes')}
                </button>
                <button
                  type="button"
                  onClick={() => setThemeFilter('light')}
                  style={{
                    flex: 1,
                    padding: '0.4rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: themeFilter === 'light' ? 'var(--theme-accent, var(--discord-blurple))' : 'transparent',
                    color: themeFilter === 'light' ? '#ffffff' : 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {t('auth.filter_light_themes')}
                </button>
                <button
                  type="button"
                  onClick={() => setThemeFilter('dark')}
                  style={{
                    flex: 1,
                    padding: '0.4rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: themeFilter === 'dark' ? 'var(--theme-accent, var(--discord-blurple))' : 'transparent',
                    color: themeFilter === 'dark' ? '#ffffff' : 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {t('auth.filter_dark_themes')}
                </button>
              </div>

              {/* Theme Cards List */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem',
                  maxHeight: '340px',
                  overflowY: 'auto',
                  paddingRight: '4px',
                }}
              >
                {visibleThemes.map((th) => {
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
                          <strong style={{ color: 'var(--text-pure)', fontSize: '0.94rem' }}>
                            {th.name}
                          </strong>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span
                              style={{
                                fontSize: '0.7rem',
                                padding: '2px 6px',
                                borderRadius: '6px',
                                background: th.mode === 'light' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                                color: th.mode === 'light' ? 'var(--discord-yellow)' : 'var(--theme-accent)',
                                fontWeight: 700,
                              }}
                            >
                              {th.mode === 'light' ? t('auth.light_theme_badge') : t('auth.dark_theme_badge')}
                            </span>
                            {isSelected && <CheckCircle2 size={16} color="var(--theme-accent, var(--discord-blurple))" />}
                          </div>
                        </div>
                        <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.77rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                          {isDutch ? th.description : (th.descriptionEn || th.description)}
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
                onClick={() => setStep(2)}
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

        {/* STEP 4: Account Credentials & Family Setup */}
        {step === 4 && (
          <form onSubmit={handleFinalSubmit} className="auth-form" noValidate>
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                {t('auth.email_label')}
              </label>
              <div className="input-wrapper">
                <div className="input-icon-left">
                  <Mail size={18} />
                </div>
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
                <div className="input-icon-left">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="input-field input-field-with-toggle"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Password strength & security hint */}
              <div
                style={{
                  marginTop: '0.3rem',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  color: isPasswordSecure(password) ? 'var(--discord-green)' : 'var(--text-dim)',
                  fontWeight: 500,
                }}
              >
                {isPasswordSecure(password) ? (
                  <>
                    <CheckCircle2 size={13} color="var(--discord-green)" />
                    <span>{t('auth.password_strength_good')}</span>
                  </>
                ) : (
                  <span>{t('auth.password_hint')}</span>
                )}
              </div>
            </div>

            {/* Family Setup Fields */}
            {role === 'parent' ? (
              <div className="form-group">
                <label htmlFor="familyName" className="form-label">
                  {t('auth.family_name_label')}
                </label>
                <div className="input-wrapper">
                  <div className="input-icon-left">
                    <Users size={18} />
                  </div>
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
                  <div className="input-icon-left">
                    <KeyRound size={18} />
                  </div>
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
                onClick={() => setStep(3)}
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
