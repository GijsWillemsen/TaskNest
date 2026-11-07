import { NavLink } from 'react-router-dom'
import { CheckSquare, Gift, Settings } from 'lucide-react'
import { useLanguage } from '../../context/useLanguage'

export default function BottomNavBar() {
  const { t } = useLanguage()

  const navItems = [
    { to: '/tasks', label: t('nav.tasks'), icon: CheckSquare },
    { to: '/rewards', label: t('nav.rewards'), icon: Gift },
    { to: '/settings', label: t('nav.settings'), icon: Settings },
  ]

  return (
    <nav className="bottom-nav-bar">
      {navItems.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            {({ isActive }) => (
              <>
                <div className="nav-item-icon">
                  <Icon size={22} />
                </div>
                <span>{item.label}</span>
                {isActive && <div className="nav-item-active-bar" />}
              </>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}

