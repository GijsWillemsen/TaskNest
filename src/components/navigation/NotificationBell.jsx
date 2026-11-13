import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  CheckCheck,
  Sparkles,
  Gift,
  ArrowLeftRight,
  UserCheck,
  Award,
  CheckCircle2,
  X,
  Volume2,
} from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import { useLanguage } from '../../context/useLanguage'
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  requestNotificationPermission,
  getNotificationPermissionStatus,
  sendDeviceNotification,
} from '../../services/notificationService'
import { supabase } from '../../supabaseClient'

function formatTimeAgo(iso, isDutch) {
  if (!iso) return ''
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffMin = Math.floor(diffMs / (60 * 1000))
  if (diffMin < 1) return isDutch ? 'Zojuist' : 'Just now'
  if (diffMin < 60) return `${diffMin}m`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${diffHours}u`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d`
}

export default function NotificationBell() {
  const { user, familyId, role } = useAuth()
  const { isDutch } = useLanguage()
  const navigate = useNavigate()

  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [permissionStatus, setPermissionStatus] = useState('default')
  const [requestingPerm, setRequestingPerm] = useState(false)
  const dropdownRef = useRef(null)

  // Check notification permission on mount
  useEffect(() => {
    getNotificationPermissionStatus().then((status) => {
      setPermissionStatus(status)
    })
  }, [])

  // Load notifications + 3.5s heartbeat + Realtime channel
  useEffect(() => {
    if (!familyId || !user?.id) return

    let isMounted = true

    const load = async () => {
      try {
        const list = await fetchNotifications(familyId, user.id, role)
        if (isMounted) {
          setNotifications((prev) => {
            // Check for new notifications to trigger sound or device push
            if (prev.length > 0 && list.length > 0) {
              const newItems = list.filter((item) => !item.is_read && !prev.some((p) => p.id === item.id))
              if (newItems.length > 0) {
                // Trigger device notification for newest item
                const latest = newItems[0]
                sendDeviceNotification({
                  title: latest.title,
                  body: latest.body,
                  url: latest.type.includes('reward') ? '/rewards' : '/tasks',
                })
              }
            }
            return list
          })
        }
      } catch (err) {
        console.warn('Failed to load notifications:', err)
      }
    }

    load()

    // Heartbeat every 4 seconds
    const interval = setInterval(() => {
      if (!document.hidden && isMounted) load()
    }, 4000)

    // Window focus listener
    const handleFocus = () => {
      if (!document.hidden && isMounted) load()
    }
    window.addEventListener('visibilitychange', handleFocus)
    window.addEventListener('focus', handleFocus)

    // Supabase Realtime channel
    const channel = supabase
      .channel(`notifications-live-${familyId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          if (!isMounted) return
          const newNotif = payload.new
          // Check if notification is meant for this user
          const forMe = !newNotif.user_id || newNotif.user_id === user.id
          const forMyRole = !newNotif.target_role || newNotif.target_role === 'all' || newNotif.target_role === role
          if (forMe && forMyRole) {
            setNotifications((prev) => [newNotif, ...prev])
            sendDeviceNotification({
              title: newNotif.title,
              body: newNotif.body,
              url: newNotif.type.includes('reward') ? '/rewards' : '/tasks',
            })
          }
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      clearInterval(interval)
      window.removeEventListener('visibilitychange', handleFocus)
      window.removeEventListener('focus', handleFocus)
      supabase.removeChannel(channel)
    }
  }, [familyId, user?.id, role])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const handleEnableNotifications = async () => {
    setRequestingPerm(true)
    try {
      const granted = await requestNotificationPermission()
      setPermissionStatus(granted ? 'granted' : 'denied')
      if (granted) {
        sendDeviceNotification({
          title: isDutch ? 'Meldingen Geactiveerd! 🔔' : 'Notifications Enabled! 🔔',
          body: isDutch ? 'Je ontvangt nu updates over klusjes en beloningen.' : 'You will now receive alerts for tasks and rewards.',
        })
      }
    } finally {
      setRequestingPerm(false)
    }
  }

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      markNotificationAsRead(notif.id)
      setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n)))
    }
    setIsOpen(false)

    if (notif.type?.includes('reward')) {
      navigate('/rewards')
    } else {
      navigate('/tasks')
    }
  }

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead(familyId, user?.id, role)
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'task_completed':
        return <CheckCircle2 size={16} color="var(--discord-green)" />
      case 'task_approved':
        return <Award size={16} color="var(--discord-yellow)" />
      case 'task_assigned':
        return <UserCheck size={16} color="var(--theme-accent, var(--discord-blurple))" />
      case 'transfer_requested':
      case 'transfer_accepted':
        return <ArrowLeftRight size={16} color="#38bdf8" />
      case 'reward_requested':
      case 'reward_approved':
        return <Gift size={16} color="#ec4899" />
      default:
        return <Sparkles size={16} color="var(--theme-accent, var(--discord-blurple))" />
    }
  }

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: isOpen ? 'var(--bg-surface-hover)' : 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          width: '38px',
          height: '38px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: unreadCount > 0 ? 'var(--text-pure)' : 'var(--text-dim)',
          cursor: 'pointer',
          position: 'relative',
          transition: 'all 0.15s ease',
        }}
        title={isDutch ? 'Meldingen' : 'Notifications'}
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: 'var(--discord-red, #ef4444)',
              color: '#ffffff',
              borderRadius: '10px',
              fontSize: '0.68rem',
              fontWeight: 800,
              minWidth: '18px',
              height: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              border: '2px solid var(--bg-surface)',
              boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)',
              animation: 'pulse 2s infinite',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '46px',
            right: 0,
            width: '340px',
            maxWidth: 'calc(100vw - 24px)',
            background: 'var(--bg-surface)',
            border: '1.5px solid var(--border-subtle)',
            borderRadius: '18px',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.35)',
            zIndex: 1100,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1rem',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface-elevated)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <strong style={{ fontSize: '0.95rem', color: 'var(--text-pure)' }}>
                {isDutch ? 'Meldingen' : 'Notifications'}
              </strong>
              {unreadCount > 0 && (
                <span
                  style={{
                    background: 'var(--theme-accent, var(--discord-blurple))',
                    color: '#ffffff',
                    borderRadius: '8px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '2px 6px',
                  }}
                >
                  {unreadCount} nieuw
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--theme-accent, var(--discord-blurple))',
                    cursor: 'pointer',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '3px 6px',
                  }}
                  title={isDutch ? 'Markeer alles als gelezen' : 'Mark all as read'}
                >
                  <CheckCheck size={14} />
                  <span>{isDutch ? 'Alles gelezen' : 'Mark all read'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  padding: '2px',
                }}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Enable Push Permission Banner if not yet granted */}
          {permissionStatus !== 'granted' && (
            <div
              style={{
                padding: '0.75rem 1rem',
                background: 'rgba(99, 102, 241, 0.1)',
                borderBottom: '1px solid rgba(99, 102, 241, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.65rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flex: 1 }}>
                <Volume2 size={16} color="var(--theme-accent, var(--discord-blurple))" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-pure)', lineHeight: 1.3 }}>
                  {isDutch ? 'Ontvang meldingen bij klusjes en ruilverzoeken' : 'Get notified for tasks and trade requests'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleEnableNotifications}
                disabled={requestingPerm}
                style={{
                  padding: '0.35rem 0.65rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'var(--theme-accent, var(--discord-blurple))',
                  color: '#ffffff',
                  fontSize: '0.76rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {requestingPerm ? '...' : isDutch ? 'Inschakelen' : 'Enable'}
              </button>
            </div>
          )}

          {/* Notifications List */}
          <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-dim)' }}>
                <Bell size={28} style={{ opacity: 0.35, margin: '0 auto 0.5rem auto' }} />
                <p style={{ margin: 0, fontSize: '0.86rem' }}>
                  {isDutch ? 'Geen meldingen gevonden' : 'No notifications yet'}
                </p>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {isDutch ? 'Klusjes en verzoeken verschijnen hier' : 'Chores and requests will appear here'}
                </span>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderBottom: '1px solid var(--border-subtle)',
                    background: notif.is_read ? 'transparent' : 'rgba(99, 102, 241, 0.05)',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-surface-elevated)')}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = notif.is_read ? 'transparent' : 'rgba(99, 102, 241, 0.05)')
                  }
                >
                  <div
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '8px',
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    {getNotificationIcon(notif.type)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <strong
                        style={{
                          fontSize: '0.85rem',
                          color: 'var(--text-pure)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {notif.title}
                      </strong>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', flexShrink: 0 }}>
                        {formatTimeAgo(notif.created_at, isDutch)}
                      </span>
                    </div>
                    <p
                      style={{
                        margin: '0.2rem 0 0 0',
                        fontSize: '0.78rem',
                        color: 'var(--text-muted)',
                        lineHeight: 1.35,
                      }}
                    >
                      {notif.body}
                    </p>
                  </div>

                  {!notif.is_read && (
                    <div
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: 'var(--theme-accent, var(--discord-blurple))',
                        flexShrink: 0,
                        marginTop: '6px',
                      }}
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
