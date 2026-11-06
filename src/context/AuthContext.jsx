import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId, fallbackRole) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('Error fetching user profile:', error.message)
        return null
      }

      if (data) {
        setProfile(data)
        return data
      }

      // If profile record does not exist yet and we have an authenticated user:
      const roleToSet = fallbackRole || 'kid'
      const { data: newProfile, error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          role: roleToSet,
          points: 0,
        })
        .select()
        .single()

      if (!upsertError && newProfile) {
        setProfile(newProfile)
        return newProfile
      }
      return null
    } catch (err) {
      console.error('Failed to load profile:', err)
      return null
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      return await fetchProfile(user.id, user.user_metadata?.role)
    }
    return null
  }, [user, fetchProfile])

  useEffect(() => {
    let isMounted = true

    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error

        if (!isMounted) return

        if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id, session.user.user_metadata?.role)
        } else {
          setUser(null)
          setProfile(null)
        }
      } catch (err) {
        console.error('Auth initialization error:', err)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return

        if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id, session.user.user_metadata?.role)
        } else {
          setUser(null)
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  const signUp = async ({ email, password, role }) => {
    setLoading(true)
    const cleanEmail = email.trim().toLowerCase()

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            role, // stored in auth.users.raw_user_meta_data
          },
        },
      })

      if (error) throw error

      // Only attempt client profile upsert if an active session was created
      // (If email confirmation is ON, session is null and RLS blocks unauthenticated inserts;
      // the profile will be created automatically upon first login when confirmed)
      if (data?.session && data?.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            role,
            points: 0,
          })

        if (profileError) {
          console.warn('Profile creation note:', profileError.message)
        } else {
          await fetchProfile(data.user.id, role)
        }
      }

      return data
    } finally {
      setLoading(false)
    }
  }

  const signIn = async ({ email, password }) => {
    setLoading(true)
    const cleanEmail = email.trim().toLowerCase()

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      })
      if (error) throw error
      return data
    } finally {
      setLoading(false)
    }
  }

  const resendConfirmation = async (email) => {
    const cleanEmail = email.trim().toLowerCase()
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: cleanEmail,
    })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    profile,
    role: profile?.role || user?.user_metadata?.role || null,
    points: profile?.points ?? 0,
    loading,
    signUp,
    signIn,
    signOut,
    resendConfirmation,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
