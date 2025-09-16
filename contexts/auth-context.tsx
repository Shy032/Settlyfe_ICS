"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { supabase, SupabaseService } from "@/lib/supabase"
import type { User } from "@/types"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  isAdmin: () => boolean
  isMember: () => boolean
  isOwner: () => boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string, userData: Partial<User>) => Promise<{ error?: string }>
  updateUser: (userData: Partial<User>) => Promise<void>
  userClaims: { role: string } | null
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  isAdmin: () => false,
  isMember: () => false,
  isOwner: () => false,
  signIn: async () => ({ error: 'Not implemented' }),
  signUp: async () => ({ error: 'Not implemented' }),
  updateUser: async () => {},
  userClaims: null,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfile(session.user)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Only load profile if we don't already have a user loaded or if the user changed
        if (!user || user.accountId !== session.user.id) {
          await loadUserProfile(session.user)
      }
    } else {
        setUser(null)
    }
    setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      console.log('Loading user profile for account ID:', supabaseUser.id)
      
      const { data: userData, error } = await SupabaseService.getFullUserByAccountId(supabaseUser.id)
      
      // Check for various "not found" error conditions
      if (error && (
        error.message?.includes('not found') || 
        error.message?.includes('No rows') ||
        (error as any).code === 'PGRST116' ||
        !userData
      )) {
        console.log('User profile not found during sign-in. This should not happen after signup.')
        console.log('Error details:', error)
        
        // Don't try to create profile during sign-in - it should already exist
        // If we're here, it's likely an RLS policy issue or the profile doesn't exist
        console.log('Signing out user due to profile access failure...')
        await signOut()
          return
        }
        
      if (error) {
        console.error('Error in loadUserProfile:', error)
        console.log('Signing out user due to unhandled error...')
        await signOut()
        return
    }

      // User profile exists
      if (userData) {
        setUser(userData)
        applyTheme(userData.theme || 'light')
      } else {
        console.log('No user data returned, signing out...')
        await signOut()
      }
      
    } catch (error) {
      console.error('Error in loadUserProfile:', error)
      console.log('Signing out user due to exception...')
      await signOut()
    }
  }

  const applyTheme = (theme: string) => {
    if (typeof window !== "undefined") {
      const root = document.documentElement
      root.classList.remove("light", "dark")
      if (theme === "dark") {
        root.classList.add("dark")
      } else {
        root.classList.add("light")
      }
    }
  }

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      console.log('Attempting signin for:', email)
      
      const { data, error } = await SupabaseService.signIn(email, password)
      
      if (error) {
        console.error('Signin error:', error)
        return { error: error.message }
      }

      if (data.user) {
        console.log('Signin successful, loading user profile...')
        await loadUserProfile(data.user)
      }

      return {}
    } catch (error) {
      console.error('Unexpected signin error:', error)
      return { error: 'An unexpected error occurred' }
    }
  }

  const signUp = async (
    email: string, 
    password: string, 
    userData: Partial<User>
  ): Promise<{ error?: string }> => {
    try {
      console.log('Starting signup process for:', email)
      
      const { data, error } = await SupabaseService.signUp(email, password, userData)
      
      if (error) {
        console.error('Supabase Auth signup error:', error)
        return { error: error.message }
      }

      console.log('Supabase Auth signup successful, user created:', data.user?.id)

      // Create user profile in database using the new schema
      if (data.user) {
        console.log('Creating user profile in database...')
        
        const { data: profileData, error: profileError } = await SupabaseService.createUserProfile({
          accountId: data.user.id,
          email: data.user.email!,
          firstName: userData.name?.split(' ')[0] || '',
          lastName: userData.name?.split(' ').slice(1).join(' ') || '',
          role: userData.accessLevel || 'member',
          teamId: userData.teamId,
          departmentId: userData.departmentId,
          theme: userData.theme || 'light',
          preferredLanguage: userData.preferredLanguage || 'en'
        })
        
        if (profileError) {
          console.error('Database profile creation error:', profileError)
          return { error: `Failed to create user profile: ${profileError.message}` }
        }

        console.log('User profile created successfully')
        console.log('Function returned data:', JSON.stringify(profileData, null, 2))

        // Check if the function returned an explicit error
        if (profileData && (profileData as any).success === false) {
          console.error('Database function returned error:', (profileData as any).error || (profileData as any).message)
          return { error: `Failed to create user profile: ${(profileData as any).error || (profileData as any).message}` }
        }

        // Use the data returned by the function directly - check for account and employee data
        if (profileData && (profileData as any).account && (profileData as any).employee) {
          // Convert the returned data to User format
          const account = (profileData as any).account
          const employee = (profileData as any).employee
          
          const newUserData: User = {
            accountId: account.id,
            loginEmail: account.login_email,
            accessLevel: account.access_level,
            accountStatus: account.status,
            employeeId: employee.id,
            firstName: employee.first_name,
            lastName: employee.last_name,
            name: `${employee.first_name} ${employee.last_name}`,
            title: employee.title,
            role: employee.role,
            teamId: employee.team_id,
            departmentId: employee.department_id,
            joinDate: employee.join_date,
            status: employee.status,
            overallAssessment: employee.overall_assessment,
            phone: employee.phone,
            personalEmail: employee.personal_email,
            githubEmail: employee.github_email,
            zoomEmail: employee.zoom_email,
            note: employee.note,
            profilePhoto: employee.profile_photo,
            theme: employee.theme || 'light',
            preferredLanguage: employee.preferred_language || 'en',
            createdAt: account.created_at,
            updatedAt: account.updated_at
        }

          setUser(newUserData)
          applyTheme(newUserData.theme || 'light')
        } else {
          console.error('Invalid data returned from profile creation')
          return { error: 'Invalid data returned from profile creation' }
        }
  }

      return {}
    } catch (error) {
      console.error('Unexpected error in signUp:', error)
      return { error: 'An unexpected error occurred during signup' }
    }
  }

  const updateUser = async (userData: Partial<User>) => {
    if (!user) return

    try {
      console.log('Updating user:', user.accountId)

      // Prepare data for both account and employee updates
      const accountUpdates: any = {}
      const employeeUpdates: any = {}

      // Map User fields to database fields
      if (userData.loginEmail !== undefined) accountUpdates.login_email = userData.loginEmail
      if (userData.accessLevel !== undefined) accountUpdates.access_level = userData.accessLevel
      if (userData.accountStatus !== undefined) accountUpdates.status = userData.accountStatus

      if (userData.firstName !== undefined) employeeUpdates.first_name = userData.firstName
      if (userData.lastName !== undefined) employeeUpdates.last_name = userData.lastName
      if (userData.title !== undefined) employeeUpdates.title = userData.title
      if (userData.role !== undefined) employeeUpdates.role = userData.role
      if (userData.teamId !== undefined) employeeUpdates.team_id = userData.teamId
      if (userData.departmentId !== undefined) employeeUpdates.department_id = userData.departmentId
      if (userData.phone !== undefined) employeeUpdates.phone = userData.phone
      if (userData.personalEmail !== undefined) employeeUpdates.personal_email = userData.personalEmail
      if (userData.githubEmail !== undefined) employeeUpdates.github_email = userData.githubEmail
      if (userData.zoomEmail !== undefined) employeeUpdates.zoom_email = userData.zoomEmail
      if (userData.note !== undefined) employeeUpdates.note = userData.note
      if (userData.profilePhoto !== undefined) employeeUpdates.profile_photo = userData.profilePhoto
      if (userData.theme !== undefined) employeeUpdates.theme = userData.theme
      if (userData.preferredLanguage !== undefined) employeeUpdates.preferred_language = userData.preferredLanguage
      if (userData.overallAssessment !== undefined) employeeUpdates.overall_assessment = userData.overallAssessment

      // Update account if there are account changes
      if (Object.keys(accountUpdates).length > 0) {
        const { error: accountError } = await SupabaseService.updateAccount(user.accountId, accountUpdates)
        if (accountError) {
          throw new Error(`Failed to update account: ${accountError.message}`)
        }
      }

      // Update employee if there are employee changes
      if (Object.keys(employeeUpdates).length > 0) {
        const { error: employeeError } = await SupabaseService.updateEmployee(user.employeeId, employeeUpdates)
        if (employeeError) {
          throw new Error(`Failed to update employee: ${employeeError.message}`)
      }
      }

      // Reload user data to get the updated information
      const { data: updatedUserData, error: loadError } = await SupabaseService.getFullUserByAccountId(user.accountId)
      
      if (loadError || !updatedUserData) {
        throw new Error('Failed to reload user data after update')
      }

      setUser(updatedUserData)
      applyTheme(updatedUserData.theme || 'light')
      
      console.log('User updated successfully')
    } catch (error) {
      console.error("Error updating user:", error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      console.log('Signing out...')
    const { error } = await SupabaseService.signOut()
    if (error) {
      console.error('Error signing out:', error)
    }
    setUser(null)
    applyTheme('light')
      console.log('Signout successful')
    } catch (error) {
      console.error('Unexpected signout error:', error)
    }
  }

  const isAdmin = () => user?.accessLevel === "admin"
  const isMember = () => user?.accessLevel === "member"
  const isOwner = () => user?.accessLevel === "owner"

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signOut,
        isAdmin,
        isMember,
        isOwner,
        signIn,
        signUp,
        updateUser,
        userClaims: user ? { role: user.accessLevel } : null,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)