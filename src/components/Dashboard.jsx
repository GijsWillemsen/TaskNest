import { useState } from 'react'
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
import TaskList from './tasks/TaskList'
import RewardsList from './rewards/RewardsList'
import FamilyView from './family/FamilyView'
import '../styles/auth.css'

export default function Dashboard() {
  const { user, profile, role, points, signOut, refreshProfile } = useAuth()
  const [activeTab, setActiveTab] = useState('chores') // 'chores', 'rewards', 'family'

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
          {/* Points Pill */}
          <div
            className="points-pill"
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.95rem' }}
            title={isKid ? 'Your Available Points' : 'Family Points Overview'}
          >
            <Coins size={17} color="var(--discord-yellow)" />
            <span>{points} pts</span>
          </div>

          <button onClick={signOut} className="signout-btn" title="Sign out of TaskNest">
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="dashboard-main">
        {/* Welcome & Profile Summary Banner */}
        <section className="welcome-banner">
          <div className="welcome-info">
            <h1>Welcome, {user?.email?.split('@')[0]}! 👋</h1>
            <p className="welcome-email">{user?.email}</p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span className={`role-badge ${role || 'kid'}`}>
                {isParent ? <UserCheck size={14} /> : <Sparkles size={14} />}
                Role: {role || 'Kid'}
              </span>

              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                Account: {profile?.id ? profile.id.slice(0, 8) : user?.id?.slice(0, 8)}...
              </span>
            </div>
          </div>

          {/* Navigation Pill Switcher */}
          <div style={{ display: 'flex', gap: '0.4rem', background: 'var(--bg-surface-elevated)', padding: '4px', borderRadius: '10px' }}>
            <button
              onClick={() => setActiveTab('chores')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'chores' ? 'var(--discord-blurple)' : 'transparent',
                color: activeTab === 'chores' ? '#ffffff' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <CheckSquare size={15} />
              Chores
            </button>

            <button
              onClick={() => setActiveTab('rewards')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'rewards' ? 'var(--discord-blurple)' : 'transparent',
                color: activeTab === 'rewards' ? '#ffffff' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Gift size={15} />
              Rewards
            </button>

            <button
              onClick={() => setActiveTab('family')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'family' ? 'var(--discord-blurple)' : 'transparent',
                color: activeTab === 'family' ? '#ffffff' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Users size={15} />
              Family
            </button>
          </div>
        </section>

        {/* Tab 1: Core Chores & Tasks System */}
        {activeTab === 'chores' && (
          <TaskList
            role={role}
            currentUserId={user?.id}
            onPointsRefresh={refreshProfile}
          />
        )}

        {/* Tab 2: Rewards Store & Purchase Requests */}
        {activeTab === 'rewards' && (
          <RewardsList
            role={role}
            kidId={user?.id}
            points={points}
            onPointsRefresh={refreshProfile}
          />
        )}

        {/* Tab 3: Family Hub & Leaderboard */}
        {activeTab === 'family' && (
          <FamilyView
            role={role}
            currentUserId={user?.id}
            onPointsRefresh={refreshProfile}
          />
        )}
      </main>
    </div>
  )
}
