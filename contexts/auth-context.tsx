"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { supabase, SupabaseService } from "@/lib/supabase"
import type { Account, Employee } from "@/types"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface AuthContextType {
  account: Account | null
  employee: Employee | null
  loading: boolean
  signOut: () => Promise<void>
  isAdmin: () => boolean
  isMember: () => boolean
  isOwner: () => boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string) => Promise<{ error?: string }>
  updateProfile: (data: Partial<Employee> & { login_email?: string }) => Promise<void>
  ensureValidSession: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType>({
  account: null,
  employee: null,
  loading: true,
  signOut: async () => {},
  isAdmin: () => false,
  isMember: () => false,
  isOwner: () => false,
  signIn: async () => ({ error: 'Not implemented' }),
  signUp: async () => ({ error: 'Not implemented' }),
  updateProfile: async () => {},
  ensureValidSession: async () => false,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null)
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfile(session.user)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.id)
      
      if (session?.user && session.user.email_confirmed_at) {
        // Handle email confirmation - create profile if it doesn't exist
        if (event === 'SIGNED_IN') {
          await handleEmailConfirmation(session.user)
        }
        
        // Handle token refresh
        if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully')
        }
        
        // Only load profile if we don't already have an account loaded or if the account changed
        if (!account || account.id !== session.user.id) {
          await loadProfile(session.user)
        }
      } else {
        // No valid session or unconfirmed email
        setAccount(null)
        setEmployee(null)
      }
      setLoading(false)
    })

    // Set up proactive token refresh
    const tokenRefreshInterval = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) {
          const now = Math.floor(Date.now() / 1000)
          const expiresAt = session.expires_at || 0
          const timeUntilExpiry = expiresAt - now
          
          // Refresh token if it expires within 5 minutes (300 seconds)
          if (timeUntilExpiry > 0 && timeUntilExpiry < 300) {
            console.log('Proactively refreshing token (expires in', timeUntilExpiry, 'seconds)')
            const { error } = await supabase.auth.refreshSession()
            if (error) {
              console.error('Token refresh failed:', error)
            } else {
              console.log('Token refreshed proactively')
            }
          }
        }
      } catch (error) {
        console.error('Error in token refresh check:', error)
      }
    }, 60000) // Check every minute

    return () => {
      subscription.unsubscribe()
      clearInterval(tokenRefreshInterval)
    }
  }, [])

  const handleEmailConfirmation = async (supabaseUser: SupabaseUser) => {
    try {
      console.log('Handling email confirmation for user:', supabaseUser.id)
      
      // Check if profile already exists
      const { data: existingAccount } = await SupabaseService.getAccountById(supabaseUser.id)
      
      if (existingAccount) {
        console.log('Profile already exists')
        return
      }

      // Get stored signup data
      if (typeof window !== 'undefined') {
        const storedData = localStorage.getItem('pending_signup_data')
        if (storedData) {
          const signupData = JSON.parse(storedData)
          console.log('Creating profile with stored data:', signupData)
          
          // Create the employee profile after email confirmation with placeholder data
          const { data: profileData, error: profileError } = await SupabaseService.createEmployeeProfile({
            account_id: supabaseUser.id,
            email: signupData.email,
            first_name: 'First', // Placeholder - user will update after login
            last_name: 'Last',   // Placeholder - user will update after login
            access_level: 'member' // Default access level - manager will update
          })

          if (profileError || !profileData) {
            console.error('Error creating profile after email confirmation:', profileError)
            return
          }

          console.log('Profile created successfully after email confirmation')
          
          // Clear stored data
          localStorage.removeItem('pending_signup_data')
          
          setAccount(profileData.account)
          setEmployee(profileData.employee)
          applyTheme('light')
          
          // Redirect to profile completion since we created with placeholder names
          if (typeof window !== 'undefined') {
            window.location.href = '/complete-profile'
          }
        }
      }
    } catch (error) {
      console.error('Error in handleEmailConfirmation:', error)
    }
  }

  const loadProfile = async (supabaseUser: SupabaseUser) => {
    try {
      console.log('Loading profile for account ID:', supabaseUser.id)
      
      // First get the account data
      const { data: accountData, error: accountError } = await SupabaseService.getAccountById(supabaseUser.id)
      
      if (accountError || !accountData) {
        console.error('Error loading account:', accountError)
        await signOut()
        return
      }
      console.log('Account data loaded:', accountData)

      // Then get the associated employee data
      const { data: employeeData, error: employeeError } = await SupabaseService.getEmployeeById(accountData.employee_id!)
      
      if (employeeError || !employeeData) {
        console.error('Error loading employee:', employeeError)
        await signOut()
        return
      }
      console.log('Employee data loaded:', employeeData)

      setAccount(accountData)
      setEmployee(employeeData)
      applyTheme(employeeData.theme || 'light')
      
      // Check if user needs to complete their profile (has placeholder names)
      const hasPlaceholderNames = (
        (employeeData.first_name === 'First' && employeeData.last_name === 'Last') ||
        (employeeData.first_name === 'Unknown' && employeeData.last_name === 'User') ||
        (!employeeData.first_name || !employeeData.last_name) ||
        (employeeData.first_name.trim() === '' || employeeData.last_name.trim() === '')
      )
      
      console.log('Has placeholder names:', hasPlaceholderNames, 'Current path:', window.location.pathname)
      
      if (typeof window !== 'undefined' && 
          hasPlaceholderNames && 
          !window.location.pathname.includes('/complete-profile') &&
          !window.location.pathname.includes('/login') &&
          !window.location.pathname.includes('/signup')) {
        console.log('Redirecting to complete profile...')
        window.location.href = '/complete-profile'
      }
      
    } catch (error) {
      console.error('Error in loadProfile:', error)
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

  const ensureValidSession = async (): Promise<boolean> => {
    try {
      console.log('Checking session validity...')
      
      // First check if we have a current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Session check error:', sessionError)
        return false
      }
      
      if (!session) {
        console.log('No active session found')
        return false
      }
      
      // Check if token is expired or about to expire (within 5 minutes)
      const now = Math.floor(Date.now() / 1000)
      const expiresAt = session.expires_at || 0
      const timeUntilExpiry = expiresAt - now
      
      if (timeUntilExpiry <= 300) { // 5 minutes buffer
        console.log('Token expires soon, refreshing...', timeUntilExpiry, 'seconds remaining')
        
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
        
        if (refreshError) {
          console.error('Token refresh failed:', refreshError)
          return false
        }
        
        if (!refreshData.session) {
          console.error('No session after refresh')
          return false
        }
        
        console.log('Token refreshed successfully')
      }
      
      console.log('Session is valid')
      return true
      
    } catch (error) {
      console.error('Error in ensureValidSession:', error)
      return false
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
        console.log('Signin successful, loading profile...')
        await loadProfile(data.user)
        console.log('Profile loading completed')
      }

      return {}
    } catch (error) {
      console.error('Unexpected signin error:', error)
      return { error: 'An unexpected error occurred' }
    }
  }

  // Simplified signUp function - only email and password required
  const signUp = async (
    email: string, 
    password: string
  ): Promise<{ error?: string }> => {
    try {
      console.log('Starting signup process for:', email)
      
      // Store minimal signup data for use after email confirmation
      if (typeof window !== 'undefined') {
        localStorage.setItem('pending_signup_data', JSON.stringify({
          email: email
        }))
      }
      
      // Only create the auth user - profile will be created after email confirmation
      const { data: authData, error: authError } = await SupabaseService.signUp(email, password)
      
      if (authError || !authData.user) {
        console.error('Auth signup error:', authError)
        // Clear stored data on error
        if (typeof window !== 'undefined') {
          localStorage.removeItem('pending_signup_data')
        }
        return { error: authError?.message || 'Failed to create user' }
      }

      console.log('Auth user created successfully. Check your email to confirm your account.')
      return {}
    } catch (error: any) {
      console.error('Unexpected error in signUp:', error)
      // Clear stored data on error
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pending_signup_data')
      }
      return { error: error.message || 'An unexpected error occurred' }
    }
  }

  const updateProfile = async (data: Partial<Employee> & { login_email?: string }) => {
    if (!account || !employee) return

    try {
      console.log('Updating profile:', account.id)

      // Prepare data for both account and employee updates
      const accountUpdates: Partial<Account> = {}
      const employeeUpdates: Partial<Employee> = {}

      // Extract account updates
      if (data.login_email !== undefined) accountUpdates.login_email = data.login_email

      // Remove account fields from employee updates and keep the rest
      const { login_email, ...employeeData } = data
      Object.assign(employeeUpdates, employeeData)

      // Update account if needed
      if (Object.keys(accountUpdates).length > 0) {
        const { error: accountError } = await SupabaseService.updateAccount(account.id, accountUpdates)
        if (accountError) {
          throw new Error(`Failed to update account: ${accountError.message}`)
        }
      }

      // Update employee if needed
      if (Object.keys(employeeUpdates).length > 0) {
        const { error: employeeError } = await SupabaseService.updateEmployee(employee.id, employeeUpdates)
        if (employeeError) {
          throw new Error(`Failed to update employee: ${employeeError.message}`)
        }
      }

      // Reload profile data
      const { data: profileData, error: loadError } = await SupabaseService.getEmployeeByAccountId(account.id)
      
      if (loadError || !profileData) {
        throw new Error('Failed to reload profile data after update')
      }

      setAccount(profileData.account)
      setEmployee(profileData.employee)
      applyTheme(profileData.employee.theme || 'light')
      
      console.log('Profile updated successfully')
    } catch (error) {
      console.error("Error updating profile:", error)
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
      setAccount(null)
      setEmployee(null)
      applyTheme('light')
      console.log('Signout successful')
    } catch (error) {
      console.error('Unexpected signout error:', error)
    }
  }

  const isAdmin = () => account?.access_level === "admin"
  const isMember = () => account?.access_level === "member"
  const isOwner = () => account?.access_level === "owner"

  return (
    <AuthContext.Provider
      value={{
        account,
        employee,
        loading,
        signOut,
        isAdmin,
        isMember,
        isOwner,
        signIn,
        signUp,
        updateProfile,
        ensureValidSession
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)