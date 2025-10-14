"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"

export default function LoginPage() {
  const { signIn, account, employee } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    // Check for error parameters in URL
    const urlParams = new URLSearchParams(window.location.search)
    const urlError = urlParams.get('error')
    const urlMessage = urlParams.get('message')
    
    if (urlError && urlMessage) {
      setError(decodeURIComponent(urlMessage))
    } else if (urlError) {
      switch (urlError) {
        case 'confirmation_failed':
          setError('Email confirmation failed. Please try again.')
          break
        case 'server_error':
          setError('Server error during confirmation. Please contact support.')
          break
        case 'invalid_link':
          setError('Invalid confirmation link. Please sign up again.')
          break
        default:
          setError('Authentication error occurred.')
      }
    }
  }, [])

  // Redirect if user is already authenticated
  useEffect(() => {
    if (account && employee) {
      console.log('User is authenticated, redirecting from login page...')
      // Check if user has placeholder names
      const hasPlaceholderNames = (
        (employee.first_name === 'First' && employee.last_name === 'Last') ||
        (employee.first_name === 'Unknown' && employee.last_name === 'User') ||
        (!employee.first_name || !employee.last_name) ||
        (employee.first_name.trim() === '' || employee.last_name.trim() === '')
      )
      
      if (hasPlaceholderNames) {
        router.push('/complete-profile')
      } else {
        router.push('/dashboard')
      }
    }
  }, [account, employee, router])

  useEffect(() => {
    // Force light theme on login page
    if (typeof window !== "undefined") {
      const root = document.documentElement
      root.classList.remove("light", "dark")
      root.classList.add("light")

      // Force white background on body and html
      document.body.style.backgroundColor = "#ffffff"
      document.documentElement.style.backgroundColor = "#ffffff"
    }

    // Cleanup function to reset styles when component unmounts
    return () => {
      if (typeof window !== "undefined") {
        document.body.style.backgroundColor = ""
        document.documentElement.style.backgroundColor = ""
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      console.log('Attempting to sign in with:', email)
      const result = await signIn(email, password)
      
      if (result.error) {
        console.error('Sign in error:', result.error)
        setError(result.error)
        setLoading(false)
        return
      }

      console.log('Sign in successful, auth context will handle redirect...')
      // Don't manually redirect - let the auth context handle it
      // The auth context will redirect to either /complete-profile or /dashboard
      
      // Reset loading after a short delay to allow for auth context to take over
      setTimeout(() => {
        setLoading(false)
      }, 1000)
      
    } catch (error) {
      console.error("Login error:", error)
      setError("Login failed: " + (error instanceof Error ? error.message : 'Unknown error'))
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-md border border-gray-300 bg-white p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Settlyfe Scoreboard</h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="sr-only">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="bg-white border-gray-300 text-black"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="sr-only">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="pr-10 bg-white border-gray-300 text-black"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
          </div>

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-500 block">
            Forgot your password?
          </Link>
          <Link href="/signup" className="text-sm text-green-600 hover:text-green-500 block">
            Don't have an account? Sign up
          </Link>
        </div>


      </div>
    </div>
  )
}
