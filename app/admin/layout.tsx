import type React from "react"
import { ThemeEnforcer } from "@/components/theme-enforcer"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <ThemeEnforcer />
      {children}
    </>
  )
}
