"use client"

import type React from "react"
import { useAuth } from "@/contexts/auth-context"
import { useEffect } from "react"

interface PageWrapperProps {
  children: React.ReactNode
  className?: string
}

export function PageWrapper({ children, className = "" }: PageWrapperProps) {
  const { user } = useAuth()

  useEffect(() => {
    // Ensure theme is applied on page load
    if (user?.theme) {
      const root = document.documentElement
      root.classList.remove("light", "dark", "neon")
      root.classList.add(user.theme)
    }
  }, [user?.theme])

  return <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${className}`}>{children}</div>
}
