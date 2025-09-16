"use client"

import { useEffect, type ComponentType } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

export function withAuth<P extends object>(
  Component: ComponentType<P>,
  requiredRole?: "admin" | "user",
): ComponentType<P> {
  return function WithAuth(props: P) {
    const { user, userClaims, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
      if (!loading) {
        if (!user) {
          router.push("/login")
        } else if (requiredRole && userClaims?.role !== requiredRole) {
          router.push("/dashboard")
        }
      }
    }, [user, userClaims, loading, router])

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        </div>
      )
    }

    if (!user || (requiredRole && userClaims?.role !== requiredRole)) {
      return null
    }

    return <Component {...props} />
  }
}
