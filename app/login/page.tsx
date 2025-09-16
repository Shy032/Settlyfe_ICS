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
import type { User } from "@/types"

// const DEMO_USERS: User[] = [
//   {
//     uid: "owner_settlyfe_com",
//     email: "bakeryang1128@gmail.com",
//     name: "Baker Yang",
//     role: "owner",
//     teamId: "settlyfe",
//     createdAt: new Date().toISOString(),
//     theme: "light",
//   },
//   {
//     uid: "admin_settlyfe_com",
//     email: "admin@settlyfe.com",
//     name: "Admin User",
//     role: "admin",
//     teamId: "settlyfe",
//     createdAt: new Date().toISOString(),
//     theme: "light",
//   },
//   {
//     uid: "user01_settlyfe_com",
//     email: "user01@settlyfe.com",
//     name: "John Doe",
//     role: "member",
//     teamId: "settlyfe",
//     createdAt: new Date().toISOString(),
//     theme: "light",
//   },
// ]

export default function LoginPage() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

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
        return
      }

      console.log('Sign in successful, redirecting to dashboard...')
      router.push("/dashboard")
    } catch (error) {
      console.error("Login error:", error)
      setError("Login failed: " + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
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

        {/* Demo Credentials */}
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200">
          <h3 className="text-sm font-medium mb-3 text-gray-800">Demo Credentials:</h3>
          <div className="space-y-1 text-sm">
            <div className="text-black">
              <span className="font-medium text-purple-600">Owner:</span> bakeryang1128@gmail.com / Yang123321
            </div>
            <div className="text-black">
              <span className="font-medium text-blue-600">Admin:</span> admin@settlyfe.com / any password
            </div>
            <div className="text-black">
              <span className="font-medium text-green-600">Member:</span> user01@settlyfe.com / any password
            </div>
            <div className="text-black">
              <span className="font-medium text-green-600">Member:</span> (No longer recommended for usage)
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
