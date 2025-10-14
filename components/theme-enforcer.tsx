"use client"

import { useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"

export function ThemeEnforcer() {
  const { employee } = useAuth()

  useEffect(() => {
    if (employee?.theme) {
      const root = document.documentElement
      root.classList.remove("light", "dark")
      root.classList.add(employee.theme)
    }
  }, [employee?.theme])

  return null
}
