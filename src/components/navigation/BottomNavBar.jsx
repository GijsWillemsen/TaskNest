import { NavLink } from 'react-router-dom'
import { CheckSquare, Gift, Settings } from 'lucide-react'

export default function BottomNavBar() {
  const navItems = [
    { to: '/tasks', label: 'Tasks', icon: CheckSquare },
    { to: '/rewards', label: 'Rewards', icon: Gift },
    { to: '/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '64px',
        backgroundColor: 'rgba(18, 20, 29, 0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 50,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        maxWidth: '100%',
      }}
    >
      {navItems.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              textDecoration: 'none',
              color: isActive ? 'var(--discord-blurple)' : 'var(--text-dim)',
              fontSize: '0.75rem',
              fontWeight: isActive ? 700 : 500,
              padding: '6px 16px',
              borderRadius: '8px',
              transition: 'all 0.15s ease',
              position: 'relative',
            })}
          >
            {({ isActive }) => (
              <>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: isActive ? 'scale(1.1)' : 'scale(1)',
                    transition: 'transform 0.15s ease',
                    filter: isActive ? 'drop-shadow(0 0 8px rgba(88, 101, 242, 0.45))' : 'none',
                  }}
                >
                  <Icon size={21} />
                </div>
                <span>{item.label}</span>
                {isActive && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      width: '28px',
                      height: '2px',
                      backgroundColor: 'var(--discord-blurple)',
                      borderRadius: '2px',
                      boxShadow: '0 0 8px var(--discord-blurple-glow)',
                    }}
                  />
                )}
              </>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}
