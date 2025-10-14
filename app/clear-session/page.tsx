"use client"

import { useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

export default function ClearSessionPage() {
  const { signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const clearSession = async () => {
      try {
        // Clear auth session
        await signOut()
        
        // Clear any localStorage data
        if (typeof window !== 'undefined') {
          localStorage.clear()
          sessionStorage.clear()
        }
        
        // Redirect to login after clearing
        setTimeout(() => {
          router.push('/login')
        }, 1000)
      } catch (error) {
        console.error('Error clearing session:', error)
        // Force redirect anyway
        router.push('/login')
      }
    }
    
    clearSession()
  }, [signOut, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Clearing session and redirecting...</p>
      </div>
    </div>
  )
}
