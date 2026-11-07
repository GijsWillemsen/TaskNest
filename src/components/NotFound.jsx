import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'
import { useLanguage } from '../context/useLanguage'
import '../styles/auth.css'

export default function NotFound() {
  const { isDutch } = useLanguage()

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '3.5rem', fontWeight: 900, color: 'var(--discord-yellow)', margin: '0 0 0.5rem' }}>
          404
        </h1>
        <h2 style={{ fontSize: '1.4rem', color: 'var(--text-pure)', margin: '0 0 0.75rem' }}>
          {isDutch ? 'Pagina niet gevonden' : 'Page Not Found'}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.75rem', lineHeight: 1.5 }}>
          {isDutch
            ? 'De pagina die je zoekt bestaat niet of is naar een ander nest gevlogen!'
            : "The page you are looking for doesn't exist or has flown to another nest!"}
        </p>

        <Link
          to="/tasks"
          className="auth-submit-btn"
          style={{ textDecoration: 'none', display: 'inline-flex', padding: '0.85rem 1.5rem' }}
        >
          <Home size={18} />
          {isDutch ? 'Terug naar Taken' : 'Return to Chores'}
        </Link>
      </div>
    </div>
  )
}
