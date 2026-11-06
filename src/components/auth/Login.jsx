import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import Toast from '../common/Toast'
import { Mail, Lock, Eye, EyeOff, LogIn, Send } from 'lucide-react'
import '../../styles/auth.css'

export default function Login() {
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
      showError('Please enter both your email and password.')
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
          'Email not confirmed yet! Please check your inbox for the confirmation link, or disable "Confirm email" in Supabase Auth settings.'
        )
      } else if (raw.toLowerCase().includes('invalid login credentials')) {
        showError('Wrong credentials! Please check your email and password.')
      } else {
        showError(raw || 'Failed to sign in. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleResend = async () => {
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail) {
      showError('Please enter your email above to resend the link.')
      return
    }

    setResending(true)
    try {
      await resendConfirmation(cleanEmail)
      showSuccess(`A new confirmation email has been sent to ${cleanEmail}! Please check your inbox.`)
    } catch (err) {
      showError(err.message || 'Could not resend confirmation email.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Sign In</h1>
          <p className="auth-subtitle">Welcome back to your family hub</p>
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
              {resending ? 'Sending link...' : 'Resend confirmation email'}
            </button>
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
