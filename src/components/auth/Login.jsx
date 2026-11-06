import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { Mail, Lock, Eye, EyeOff, LogIn, ShieldAlert, CheckCircle2, Send } from 'lucide-react'
import '../../styles/auth.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [infoMsg, setInfoMsg] = useState('')
  const [unconfirmedEmail, setUnconfirmedEmail] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)

  const { signIn, resendConfirmation } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setInfoMsg('')
    setUnconfirmedEmail(false)

    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || !password) {
      setErrorMsg('Please enter both your email and password.')
      return
    }

    setSubmitting(true)
    try {
      await signIn({ email: cleanEmail, password })
      navigate('/')
    } catch (err) {
      console.error('Login error:', err)
      const raw = err.message || ''

      if (raw.toLowerCase().includes('email not confirmed')) {
        setUnconfirmedEmail(true)
        setErrorMsg(
          'Email not confirmed yet! Please check your inbox for the confirmation link, or disable "Confirm email" in Supabase Auth settings to log in immediately.'
        )
      } else if (raw.toLowerCase().includes('invalid login credentials')) {
        setErrorMsg('Invalid email or password. Please check your credentials.')
      } else {
        setErrorMsg(raw || 'Failed to sign in. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleResend = async () => {
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail) {
      setErrorMsg('Please enter your email above to resend the link.')
      return
    }

    setResending(true)
    try {
      await resendConfirmation(cleanEmail)
      setInfoMsg(`A new confirmation email has been sent to ${cleanEmail}! Please check your inbox.`)
    } catch (err) {
      setErrorMsg(err.message || 'Could not resend confirmation email.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo-badge">
            <img src="/logo.png" alt="TaskNest Logo" className="brand-logo-img" />
          </div>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to your TaskNest account</p>
        </div>

        {errorMsg && (
          <div className="auth-alert auth-alert-error" role="alert">
            <ShieldAlert size={18} style={{ flexShrink: 0 }} />
            <div>
              <span>{errorMsg}</span>
              {unconfirmedEmail && (
                <div style={{ marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    style={{
                      background: 'rgba(237, 66, 69, 0.2)',
                      border: '1px solid rgba(237, 66, 69, 0.5)',
                      color: '#ffffff',
                      borderRadius: '6px',
                      padding: '0.3rem 0.65rem',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <Send size={13} />
                    {resending ? 'Resending link...' : 'Resend confirmation email'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {infoMsg && (
          <div className="auth-alert auth-alert-success" role="status">
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{infoMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
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
              'Signing in...'
            ) : (
              <>
                <LogIn size={18} />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account?
          <Link to="/signup">Create one now</Link>
        </div>
      </div>
    </div>
  )
}
