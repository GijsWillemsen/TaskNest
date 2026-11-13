import { Outlet } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { useLanguage } from '../../context/useLanguage'
import BottomNavBar from '../navigation/BottomNavBar'
import NotificationBell from '../navigation/NotificationBell'
import FamilySetupPrompt from '../family/FamilySetupPrompt'
import { Coins, Users } from 'lucide-react'
import '../../styles/auth.css'

export default function AppLayout() {
  const { user, family, familyId, role, points, displayName, refreshProfile } = useAuth()
  const { t } = useLanguage()

  return (
    <div className="dashboard-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <header className="dashboard-nav">
        <div className="brand-wrapper">
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.35rem 0.75rem',
              borderRadius: '10px',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-pure)',
              fontWeight: 700,
              fontSize: '0.92rem',
            }}
          >
            <Users size={16} color="var(--theme-accent, var(--discord-blurple))" />
            <span>{family?.name || t('nav.family_nest')}</span>
          </div>
        </div>

        <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <NotificationBell />

          {displayName && (
            <span
              style={{
                fontSize: '0.88rem',
                fontWeight: 600,
                color: 'var(--text-main)',
                marginRight: '0.15rem',
              }}
            >
              {displayName}
            </span>
          )}

          {/* Points Pill (Coin symbol + amount) */}
          <div
            className="points-pill"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.9rem', gap: '0.35rem' }}
            title="Current points balance"
          >
            <Coins size={16} />
            <span>{points}</span>
          </div>
        </div>
      </header>

      {/* Main Content View */}
      <main
        className="dashboard-main"
        style={{
          flex: 1,
          paddingBottom: '84px', // Space for fixed bottom navbar
        }}
      >
        {/* If user doesn't belong to a family yet, prompt them */}
        {!familyId && (
          <FamilySetupPrompt
            userId={user?.id}
            role={role}
            onComplete={refreshProfile}
          />
        )}

        {/* Page Content */}
        <Outlet />
      </main>

      {/* Fixed Bottom Navigation Bar */}
      <BottomNavBar />
    </div>
  )
}
