import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { supabase } from '../supabaseClient'

const LOCAL_STORAGE_KEY = 'tasknest_notifications_cache'

/**
 * Check current notification permission status ('granted', 'denied', or 'prompt'/'default')
 */
export async function getNotificationPermissionStatus() {
  if (Capacitor.isNativePlatform()) {
    try {
      const status = await LocalNotifications.checkPermissions()
      return status.display
    } catch {
      return 'default'
    }
  }

  if (typeof window !== 'undefined' && 'Notification' in window) {
    return Notification.permission
  }

  return 'unsupported'
}

/**
 * Request notification permission from user (Apple PWA, Browser, or Native Android)
 */
export async function requestNotificationPermission() {
  if (Capacitor.isNativePlatform()) {
    try {
      const res = await LocalNotifications.requestPermissions()
      return res.display === 'granted'
    } catch (err) {
      console.warn('Native notification permission error:', err)
      return false
    }
  }

  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    } catch (err) {
      console.warn('Web notification permission error:', err)
      return false
    }
  }

  return false
}

/**
 * Send an OS-level device notification (Apple PWA, Web, or Native Android)
 */
export async function sendDeviceNotification({ title, body, url = '/', tag = 'tasknest-update' }) {
  // 1. Native Capacitor (Android)
  if (Capacitor.isNativePlatform()) {
    try {
      const status = await LocalNotifications.checkPermissions()
      if (status.display === 'granted') {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: Math.floor(Math.random() * 1000000),
              title,
              body,
              schedule: { at: new Date(Date.now() + 50) },
              smallIcon: 'ic_launcher',
              iconColor: '#5865F2',
              extra: { url },
            },
          ],
        })
        return true
      }
    } catch (nativeErr) {
      console.warn('Failed to schedule native notification:', nativeErr)
    }
  }

  // 2. Service Worker showNotification (Apple PWA / Desktop / Chrome)
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready
        if (reg && reg.showNotification) {
          await reg.showNotification(title, {
            body,
            icon: '/logo.png',
            badge: '/logo.png',
            data: url,
            tag,
            renotify: true,
          })
          return true
        }
      }
      // Standard browser notification fallback
      new Notification(title, {
        body,
        icon: '/logo.png',
        tag,
      })
      return true
    } catch (webErr) {
      console.warn('Failed to display web notification:', webErr)
    }
  }

  return false
}

/**
 * Insert a notification into Supabase notifications table (and send device alert)
 */
export async function createFamilyNotification({
  familyId,
  userId = null,
  senderId = null,
  senderName = null,
  targetRole = 'all', // 'parent' | 'kid' | 'all'
  title,
  body,
  type,
  taskId = null,
}) {
  if (!familyId) return null

  const payload = {
    family_id: familyId,
    user_id: userId,
    sender_id: senderId,
    sender_name: senderName,
    target_role: targetRole,
    title,
    body,
    type,
    task_id: taskId,
    is_read: false,
  }

  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert([payload])
      .select()
      .single()

    if (error) {
      console.warn('Supabase notifications insert notice (table might need migration):', error.message)
      // Save locally as fallback
      saveNotificationLocally({ ...payload, id: `local-${Date.now()}`, created_at: new Date().toISOString() })
    }

    return data || payload
  } catch (err) {
    console.warn('Notification creation fallback:', err)
    saveNotificationLocally({ ...payload, id: `local-${Date.now()}`, created_at: new Date().toISOString() })
    return payload
  }
}

/**
 * Fetch all notifications relevant to current user
 */
export async function fetchNotifications(familyId, currentUserId, currentUserRole) {
  if (!familyId) return getLocalNotifications()

  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('family_id', familyId)
      .order('created_at', { ascending: false })
      .limit(30)

    if (error) {
      console.warn('Could not fetch notifications from Supabase:', error.message)
      return getLocalNotifications()
    }

    // Filter relevant notifications for current user
    const filtered = (data || []).filter((item) => {
      // If notification has a specific recipient, check if it's for current user
      if (item.user_id && item.user_id !== currentUserId) {
        return false
      }
      // If notification is role-specific (e.g. only parents should see it)
      if (item.target_role && item.target_role !== 'all' && item.target_role !== currentUserRole) {
        return false
      }
      return true
    })

    return filtered
  } catch (err) {
    console.warn('Error fetching notifications:', err)
    return getLocalNotifications()
  }
}

/**
 * Mark a single notification as read
 */
export async function markNotificationAsRead(notificationId) {
  if (!notificationId) return
  if (notificationId.startsWith('local-')) {
    markLocalNotificationRead(notificationId)
    return
  }

  try {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
  } catch (err) {
    console.warn('Error marking notification as read:', err)
  }
}

/**
 * Mark all notifications as read for current user
 */
export async function markAllNotificationsAsRead(familyId, currentUserId, currentUserRole) {
  clearLocalNotificationsRead()
  if (!familyId) return

  try {
    let query = supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('family_id', familyId)

    if (currentUserId) {
      query = query.or(`user_id.eq.${currentUserId},target_role.eq.${currentUserRole},target_role.eq.all`)
    }

    await query
  } catch (err) {
    console.warn('Error marking all notifications as read:', err)
  }
}

// LocalStorage Fallbacks
function getLocalNotifications() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveNotificationLocally(notif) {
  try {
    const list = getLocalNotifications()
    const updated = [notif, ...list.slice(0, 25)]
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated))
  } catch (err) {
    console.warn('LocalStorage notification save error:', err)
  }
}

function markLocalNotificationRead(id) {
  try {
    const list = getLocalNotifications().map((item) => (item.id === id ? { ...item, is_read: true } : item))
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list))
  } catch {
    // ignore
  }
}

function clearLocalNotificationsRead() {
  try {
    const list = getLocalNotifications().map((item) => ({ ...item, is_read: true }))
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list))
  } catch {
    // ignore
  }
}

