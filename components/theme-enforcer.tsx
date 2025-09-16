"use client"

import { useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"

export function ThemeEnforcer() {
  const { user } = useAuth()

  useEffect(() => {
    if (user?.theme) {
      const root = document.documentElement
      root.classList.remove("light", "dark")
      root.classList.add(user.theme === "neon" ? "light" : user.theme)
    }
  }, [user?.theme])

  return null
}
