"use client"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface CreateButtonProps {
  items?: {
    label: string
    href?: string
    onClick?: () => void
  }[]
  onMainClick?: () => void
  label?: string
  className?: string
}

export function CreateButton({ items, onMainClick, label = "Create", className }: CreateButtonProps) {
  // If there are no items, just render a simple button
  if (!items || items.length === 0) {
    return (
      <Button onClick={onMainClick} className={className}>
        <Plus className="mr-2 h-4 w-4" />
        {label}
      </Button>
    )
  }

  // Otherwise render a dropdown menu
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className={className}>
          <Plus className="mr-2 h-4 w-4" />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {items.map((item, index) => (
          <DropdownMenuItem key={index} onClick={item.onClick} className="cursor-pointer">
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
