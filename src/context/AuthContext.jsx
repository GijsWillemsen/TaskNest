import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { AuthContext } from './auth-context'
import { getFamilyDetails } from '../services/familyService'
import { deleteUserAccount } from '../services/profileService'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [family, setFamily] = useState(null)
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
        if (data.family_id) {
          const fam = await getFamilyDetails(data.family_id)
          setFamily(fam)
        } else {
          setFamily(null)
        }
        return data
      }

      // If profile record does not exist yet and we have an authenticated user:
      const roleToSet = fallbackRole || 'parent'
      const nameToSet = 'Hero'
      const themeToSet = 'playful'
      const { data: newProfile, error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          role: roleToSet,
          display_name: nameToSet,
          theme_preference: themeToSet,
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
          setFamily(null)
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
          setFamily(null)
        }
        setLoading(false)
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  const signUp = async ({ email, password, role, displayName, themePreference, familyName, inviteCode }) => {
    setLoading(true)
    const cleanEmail = email.trim().toLowerCase()
    const chosenName = displayName?.trim() || (role === 'parent' ? 'Parent' : 'Kid')
    const chosenTheme = themePreference || 'candy'

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            role,
            display_name: chosenName,
            theme_preference: chosenTheme,
            family_name: familyName?.trim() || null,
            invite_code: inviteCode?.trim()?.toUpperCase() || null,
          },
        },
      })

      if (error) throw error

      // Attempt immediate login if email confirmation is disabled
      let currentSession = data?.session
      if (!currentSession) {
        try {
          const signInRes = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          })
          if (signInRes?.data?.session) {
            currentSession = signInRes.data.session
          }
        } catch {
          // Email confirmation is required, expected
        }
      }

      if (data?.user) {
        // Direct upsert to ensure profile is immediate
        try {
          await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              role,
              display_name: chosenName,
              theme_preference: chosenTheme,
              points: 0,
            })
        } catch (profErr) {
          console.warn('Direct profile upsert fallback:', profErr.message)
        }

        if (currentSession) {
          await fetchProfile(data.user.id, role)
        }
      }

      return data
    } finally {
      setLoading(false)
    }
  }

  const updateDisplayName = async (newName) => {
    if (!user?.id || !newName?.trim()) return
    const cleanName = newName.trim()
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: cleanName })
      .eq('id', user.id)

    if (error) throw error
    setProfile((prev) => (prev ? { ...prev, display_name: cleanName } : prev))
    return cleanName
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
      setFamily(null)
    } finally {
      setLoading(false)
    }
  }

  const deleteAccount = async () => {
    setLoading(true)
    try {
      if (user?.id) {
        await deleteUserAccount(user.id)
      }
      await signOut()
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    profile,
    family,
    familyId: profile?.family_id || null,
    role: profile?.role || user?.user_metadata?.role || null,
    displayName: profile?.display_name || user?.user_metadata?.display_name || 'Hero',
    themePreference: profile?.theme_preference || user?.user_metadata?.theme_preference || 'playful',
    points: profile?.points ?? 0,
    loading,
    signUp,
    signIn,
    signOut,
    deleteAccount,
    resendConfirmation,
    refreshProfile,
    updateDisplayName,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
