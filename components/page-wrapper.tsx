"use client"

import type React from "react"
import { useAuth } from "@/contexts/auth-context"
import { useEffect } from "react"

interface PageWrapperProps {
  children: React.ReactNode
  className?: string
}

export function PageWrapper({ children, className = "" }: PageWrapperProps) {
  const { employee } = useAuth()

  useEffect(() => {
    // Ensure theme is applied on page load
    if (employee?.theme) {
      const root = document.documentElement
      root.classList.remove("light", "dark", "neon")
      root.classList.add(employee.theme)
    }
  }, [employee?.theme])

  return <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${className}`}>{children}</div>
}
