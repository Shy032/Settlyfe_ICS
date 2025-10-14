"use client"

import { useEffect, type ComponentType } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

export function withAuth<P extends object>(
  Component: ComponentType<P>,
  requiredRole?: "admin" | "member",
): ComponentType<P> {
  return function WithAuth(props: P) {
    const { account, employee, loading, isAdmin, isMember, isOwner } = useAuth()
    const router = useRouter()

    useEffect(() => {
      if (!loading) {
        if (!account || !employee) {
          router.push("/login")
        } else if (requiredRole) {
          // Check role based on account access_level
          if (requiredRole === "admin" && !isAdmin() && !isOwner()) {
            router.push("/dashboard")
          } else if (requiredRole === "member" && !isMember() && !isAdmin() && !isOwner()) {
            router.push("/dashboard")
          }
        }
      }
    }, [account, employee, loading, router, isAdmin, isMember, isOwner])

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

    if (!account || !employee) {
      return null
    }

    // Additional role check
    if (requiredRole === "admin" && !isAdmin() && !isOwner()) {
      return null
    }

    return <Component {...props} />
  }
}
