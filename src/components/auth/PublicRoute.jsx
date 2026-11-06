import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import '../../styles/auth.css'

export default function PublicRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Loading TaskNest...</p>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return children
}
