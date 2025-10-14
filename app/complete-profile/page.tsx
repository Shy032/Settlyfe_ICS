"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

export default function CompleteProfilePage() {
  const { employee, updateProfile } = useAuth()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    // Force light theme on this page
    if (typeof window !== "undefined") {
      const root = document.documentElement
      root.classList.remove("light", "dark")
      root.classList.add("light")
      document.body.style.backgroundColor = "#ffffff"
      document.documentElement.style.backgroundColor = "#ffffff"
    }

    return () => {
      if (typeof window !== "undefined") {
        document.body.style.backgroundColor = ""
        document.documentElement.style.backgroundColor = ""
      }
    }
  }, [])

  useEffect(() => {
    // If user doesn't have placeholder names, redirect to dashboard
    if (employee) {
      const hasPlaceholderNames = (
        (employee.first_name === 'First' && employee.last_name === 'Last') ||
        (employee.first_name === 'Unknown' && employee.last_name === 'User') ||
        (!employee.first_name || !employee.last_name) ||
        (employee.first_name.trim() === '' || employee.last_name.trim() === '')
      )
      
      if (!hasPlaceholderNames) {
        router.push("/dashboard")
      }
    }
  }, [employee, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Validation
    if (!firstName.trim() || !lastName.trim()) {
      setError("Please enter both first and last name")
      setLoading(false)
      return
    }

    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      setError("Names must be at least 2 characters long")
      setLoading(false)
      return
    }

    try {
      await updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim()
      })
      
      // Redirect to dashboard after successful update
      router.push("/dashboard")
    } catch (error) {
      setError("Failed to update profile. Please try again.")
      console.error("Profile update error:", error)
    } finally {
      setLoading(false)
    }
  }

  // If no employee data, redirect to login
  if (!employee) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-md border border-gray-300 bg-white p-8 shadow-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
          <p className="text-gray-600">Please enter your first and last name to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter your first name"
              required
              className="bg-white border-gray-300"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Enter your last name"
              required
              className="bg-white border-gray-300"
            />
          </div>

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            disabled={loading}
          >
            {loading ? "Updating Profile..." : "Complete Profile"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Your manager will assign your role and access level.</p>
        </div>
      </div>
    </div>
  )
}
