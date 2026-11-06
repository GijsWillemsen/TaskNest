import { Outlet } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import BottomNavBar from '../navigation/BottomNavBar'
import FamilySetupPrompt from '../family/FamilySetupPrompt'
import { Coins, Users } from 'lucide-react'
import '../../styles/auth.css'

export default function AppLayout() {
  const { user, family, familyId, role, points, refreshProfile } = useAuth()

  return (
    <div className="dashboard-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <header className="dashboard-nav">
        <div className="brand-wrapper">
          <div className="nav-logo-badge">
            <img src="/logo.png" alt="TaskNest" className="brand-logo-img" />
          </div>
          <span>TaskNest</span>

          {family?.name && (
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--discord-blurple)',
                backgroundColor: 'rgba(88, 101, 242, 0.12)',
                border: '1px solid rgba(88, 101, 242, 0.3)',
                padding: '0.2rem 0.55rem',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                marginLeft: '0.25rem',
              }}
            >
              <Users size={12} />
              {family.name}
            </span>
          )}
        </div>

        <div className="nav-actions">
          {/* Points Pill */}
          <div
            className="points-pill"
            style={{ padding: '0.35rem 0.8rem', fontSize: '0.9rem' }}
            title="Your current points"
          >
            <Coins size={16} color="var(--discord-yellow)" />
            <span>{points} pts</span>
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
