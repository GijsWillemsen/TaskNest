import { useAuth } from '../context/useAuth'
import {
  Sparkles,
  LogOut,
  UserCheck,
  CheckSquare,
  Gift,
  Coins,
  Users,
} from 'lucide-react'
import '../styles/auth.css'

export default function Dashboard() {
  const { user, profile, role, points, signOut } = useAuth()

  const isParent = role === 'parent'
  const isKid = role === 'kid'

  return (
    <div className="dashboard-page">
      {/* Top Navbar */}
      <header className="dashboard-nav">
        <div className="brand-wrapper">
          <div className="nav-logo-badge">
            <img src="/logo.png" alt="TaskNest" className="brand-logo-img" />
          </div>
          <span>TaskNest</span>
        </div>

        <div className="nav-actions">
          <button onClick={signOut} className="signout-btn" title="Sign out of TaskNest">
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="dashboard-main">
        {/* Welcome & Profile Summary Card */}
        <section className="welcome-banner">
          <div className="welcome-info">
            <h1>Welcome, {user?.email?.split('@')[0]}! 👋</h1>
            <p className="welcome-email">{user?.email}</p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span className={`role-badge ${role || 'kid'}`}>
                {isParent ? <UserCheck size={14} /> : <Sparkles size={14} />}
                Role: {role || 'Kid'}
              </span>

              {/* Status note */}
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                Profile ID: {profile?.id ? profile.id.slice(0, 8) : user?.id?.slice(0, 8)}...
              </span>
            </div>
          </div>

          {/* Points Pill (Kids earn & spend points, parents monitor points) */}
          <div className="points-pill" title={isKid ? 'Your Earned Points' : 'Family Points Overview'}>
            <Coins size={22} color="var(--discord-yellow)" />
            <span>{points} pts</span>
          </div>
        </section>

        {/* Informative placeholder cards showcasing upcoming features */}
        <section className="placeholder-grid">
          {/* Tasks Card */}
          <div className="placeholder-card">
            <div className="placeholder-card-header">
              <div className="placeholder-icon tasks">
                <CheckSquare size={20} />
              </div>
              <h2>{isParent ? 'Manage Tasks' : 'My Chores'}</h2>
            </div>
            <p>
              {isParent
                ? 'Create chores, set point values, and approve completed tasks submitted by your kids.'
                : 'Browse available chores, complete tasks, and earn points towards rewards!'}
            </p>
            <button className="placeholder-btn" disabled>
              {isParent ? '+ New Task (Coming Next)' : 'View Chores (Coming Next)'}
            </button>
          </div>

          {/* Rewards Card */}
          <div className="placeholder-card">
            <div className="placeholder-card-header">
              <div className="placeholder-icon rewards">
                <Gift size={20} />
              </div>
              <h2>Rewards Store</h2>
            </div>
            <p>
              {isParent
                ? 'Define rewards like screen time, games, or treats that kids can unlock with points.'
                : 'Redeem your points for fun rewards and family privileges!'}
            </p>
            <button className="placeholder-btn" disabled>
              Browse Rewards (Coming Next)
            </button>
          </div>

          {/* Family / Role info */}
          <div className="placeholder-card">
            <div className="placeholder-card-header">
              <div className="placeholder-icon family">
                <Users size={20} />
              </div>
              <h2>Family Sync</h2>
            </div>
            <p>
              Signed in as <strong>{role === 'parent' ? 'Parent' : 'Kid'}</strong>. Your role is
              persisted in the Supabase <code>profiles</code> table.
            </p>
            <button className="placeholder-btn" disabled>
              Family Settings (Coming Next)
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}
