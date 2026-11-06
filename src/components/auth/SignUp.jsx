import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  Check,
} from 'lucide-react'
import '../../styles/auth.css'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('parent') // 'parent' or 'kid'
  const [showPassword, setShowPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [infoMsg, setInfoMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setInfoMsg('')

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.')
      return
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.')
      return
    }

    if (!role) {
      setErrorMsg('Please select your role (Parent or Kid).')
      return
    }

    setSubmitting(true)
    try {
      const data = await signUp({ email, password, role })

      // If Supabase has email confirmation enabled, data.session might be null
      if (data?.user && !data?.session) {
        setInfoMsg(
          'Account created successfully! Please check your email inbox to verify your address before logging in.'
        )
      } else {
        // Immediate login
        navigate('/')
      }
    } catch (err) {
      console.error('Sign-up failed:', err)
      setErrorMsg(err.message || 'Failed to create account. Please try again.')
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
          <h1 className="auth-title">Join TaskNest</h1>
          <p className="auth-subtitle">Turn chores into fun family achievements</p>
        </div>

        {errorMsg && (
          <div className="auth-alert auth-alert-error" role="alert">
            <ShieldAlert size={18} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div className="auth-alert auth-alert-success" role="status">
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{infoMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {/* Role Selection */}
          <div className="role-selection-group">
            <label className="role-selection-label">Choose your role</label>
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
                <div className="role-desc">Post chores & award points</div>
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
                <div className="role-desc">Do chores & claim rewards</div>
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
            <span className="form-helper-text">Must be at least 6 characters</span>
          </div>

          {/* Submit */}
          <button type="submit" className="auth-submit-btn" disabled={submitting}>
            {submitting ? (
              'Creating account...'
            ) : (
              <>
                <Check size={18} />
                Sign Up as {role === 'parent' ? 'Parent' : 'Kid'}
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?
          <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  )
}
