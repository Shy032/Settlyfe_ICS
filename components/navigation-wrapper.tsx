"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import type { ReactNode } from "react"

interface NavigationWrapperProps {
  children: ReactNode
}

export function NavigationWrapper({ children }: NavigationWrapperProps) {
  const { account, employee, updateProfile } = useAuth()
  const pathname = usePathname()
  const [currentTheme, setCurrentTheme] = useState<string>("light")

  // Initialize theme on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = employee?.theme || "light"
      setCurrentTheme(savedTheme)
      applyTheme(savedTheme)
    }
  }, [employee])

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

  const toggleTheme = async () => {
    const newTheme = currentTheme === "dark" ? "light" : "dark"
    setCurrentTheme(newTheme)
    applyTheme(newTheme)

    // Update employee preference
    if (employee) {
      try {
        await updateProfile({ theme: newTheme })
      } catch (error) {
        console.error("Error updating theme:", error)
      }
    }
  }

  // Skip rendering navigation on login page
  if (pathname === "/login" || pathname === "/forgot-password") {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen flex flex-col">
      {account && employee && (
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="flex h-16 items-center justify-between py-4 px-8">
            <div className="flex items-center pl-4">
              <Link href="/dashboard" className="text-xl font-bold tracking-tight text-gray-900 dark:text-white select-none">
                Settlyfe
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href={`/profile/${employee?.id}`}
                className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white select-none"
              >
                Profile
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                  Dashboard
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={toggleTheme} className="select-none">
                {currentTheme === "dark" ? "Light Mode" : "Dark Mode"}
              </Button>
            </div>
          </div>
        </header>
      )}
      <main className="flex-1 bg-gray-50 dark:bg-background">{children}</main>
    </div>
  )
}
