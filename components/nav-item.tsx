"use client"

import type React from "react"

import Link from "next/link"
import { cn } from "@/lib/utils"

interface NavItemProps {
  href: string
  children: React.ReactNode
  isActive?: boolean
  className?: string
  onClick?: () => void
}

export function NavItem({ href, children, isActive, className, onClick }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground",
        className,
      )}
      onClick={onClick}
    >
      {children}
    </Link>
  )
}
