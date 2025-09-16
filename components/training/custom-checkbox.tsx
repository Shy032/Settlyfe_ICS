"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"

interface CustomCheckboxProps {
  id: string
  label: string
  isChecked: boolean
  onChange: (checked: boolean) => void
}

export function CustomCheckbox({ id, label, isChecked, onChange }: CustomCheckboxProps) {
  const [checked, setChecked] = useState(isChecked)

  useEffect(() => {
    setChecked(isChecked)
  }, [isChecked])

  const handleChange = () => {
    const newChecked = !checked
    setChecked(newChecked)
    onChange(newChecked)
  }

  return (
    <div className="flex items-center space-x-2 py-1">
      <div
        className={`w-4 h-4 border-2 rounded cursor-pointer flex items-center justify-center ${
          checked ? "bg-blue-600 border-blue-600" : "border-gray-300 hover:border-gray-400"
        }`}
        onClick={handleChange}
      >
        {checked && (
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>
      <Label htmlFor={id} className="text-sm cursor-pointer" onClick={handleChange}>
        {label}
      </Label>
    </div>
  )
}
