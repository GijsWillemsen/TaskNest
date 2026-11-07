import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { useLanguage } from '../../context/useLanguage'
import Toast from '../common/Toast'
import { Mail, Lock, Eye, EyeOff, LogIn, Send } from 'lucide-react'
import '../../styles/auth.css'

export default function Login() {
  const { t, isDutch } = useLanguage()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [toast, setToast] = useState({ message: '', type: 'error' })
  const [unconfirmedEmail, setUnconfirmedEmail] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)

  const { signIn, resendConfirmation } = useAuth()
  const navigate = useNavigate()

  const showError = (msg) => setToast({ message: msg, type: 'error' })
  const showSuccess = (msg) => setToast({ message: msg, type: 'success' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setToast({ message: '', type: 'error' })
    setUnconfirmedEmail(false)

    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || !password) {
      showError(isDutch ? 'Vul zowel je e-mailadres als je wachtwoord in.' : 'Please enter both your email and password.')
      return
    }

    setSubmitting(true)
    try {
      await signIn({ email: cleanEmail, password })
      navigate('/tasks')
    } catch (err) {
      console.error('Login error:', err)
      const raw = err.message || ''

      if (raw.toLowerCase().includes('email not confirmed')) {
        setUnconfirmedEmail(true)
        showError(
          isDutch
            ? 'E-mailadres is nog niet bevestigd! Controleer je inbox voor de bevestigingslink, of schakel "Confirm email" uit in Supabase.'
            : 'Email not confirmed yet! Please check your inbox for the confirmation link, or disable "Confirm email" in Supabase Auth settings.'
        )
      } else if (raw.toLowerCase().includes('invalid login credentials')) {
        showError(isDutch ? 'Verkeerde inloggegevens! Controleer je e-mail en wachtwoord.' : 'Wrong credentials! Please check your email and password.')
      } else {
        showError(raw || (isDutch ? 'Inloggen mislukt. Probeer het opnieuw.' : 'Failed to sign in. Please try again.'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleResend = async () => {
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail) {
      showError(isDutch ? 'Vul hierboven je e-mailadres in om de link opnieuw te sturen.' : 'Please enter your email above to resend the link.')
      return
    }

    setResending(true)
    try {
      await resendConfirmation(cleanEmail)
      showSuccess(isDutch ? `Een nieuwe bevestigingsmail is gestuurd naar ${cleanEmail}!` : `A new confirmation email has been sent to ${cleanEmail}!`)
    } catch (err) {
      showError(err.message || (isDutch ? 'Kon bevestigingsmail niet opnieuw versturen.' : 'Could not resend confirmation email.'))
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">{t('auth.login_title')}</h1>
          <p className="auth-subtitle">{t('auth.login_subtitle')}</p>
        </div>

        {toast.message && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ message: '', type: 'error' })}
          />
        )}

        {unconfirmedEmail && (
          <div style={{ marginBottom: '1.25rem', textAlign: 'center' }}>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              style={{
                background: 'rgba(237, 66, 69, 0.15)',
                border: '1px solid rgba(237, 66, 69, 0.4)',
                color: '#ffffff',
                borderRadius: '8px',
                padding: '0.45rem 0.85rem',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <Send size={14} />
              {resending ? t('common.loading') : (isDutch ? 'Bevestigingsmail opnieuw sturen' : 'Resend confirmation email')}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {/* Email Field */}
          <div className="form-group">
            <label className="form-label" htmlFor="email-input">
              {t('auth.email_label')}
            </label>
            <div className="input-wrapper">
              <div className="input-icon-left">
                <Mail size={18} />
              </div>
              <input
                id="email-input"
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

          {/* Password Field */}
          <div className="form-group">
            <label className="form-label" htmlFor="password-input">
              {t('auth.password_label')}
            </label>
            <div className="input-wrapper">
              <div className="input-icon-left">
                <Lock size={18} />
              </div>
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                className="input-field input-field-with-toggle"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
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

          {/* Submit */}
          <button type="submit" className="auth-submit-btn" disabled={submitting}>
            {submitting ? (
              t('common.loading')
            ) : (
              <>
                <LogIn size={18} />
                {t('auth.login_btn')}
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          {t('auth.no_account')}
          <Link to="/signup">{t('auth.signup_title')}</Link>
        </div>
      </div>
    </div>
  )
}
