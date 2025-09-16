"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Mail, Lock } from "lucide-react"
import Link from "next/link"
import type { PasswordResetRequest } from "@/types"

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"email" | "code" | "password">("email")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [generatedCode, setGeneratedCode] = useState("")
  const router = useRouter()

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      // Generate 6-digit code
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString()
      setGeneratedCode(resetCode)

      // Store reset request
      const resetRequest: PasswordResetRequest = {
        email,
        code: resetCode,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
        used: false,
      }

      const existingRequests = localStorage.getItem("passwordResets")
      const requests = existingRequests ? JSON.parse(existingRequests) : []
      requests.push(resetRequest)
      localStorage.setItem("passwordResets", JSON.stringify(requests))

      // Simulate email sending
      console.log(`Password reset code for ${email}: ${resetCode}`)
      setMessage(`Verification code sent to ${email}. Check your email.`)
      setStep("code")
    } catch (error) {
      setMessage("Error sending verification code")
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const requests = JSON.parse(localStorage.getItem("passwordResets") || "[]") as PasswordResetRequest[]
      const request = requests.find((r) => r.email === email && r.code === code && !r.used)

      if (!request) {
        setMessage("Invalid or expired verification code")
        setLoading(false)
        return
      }

      if (new Date() > new Date(request.expiresAt)) {
        setMessage("Verification code has expired")
        setLoading(false)
        return
      }

      setMessage("Code verified! Please enter your new password.")
      setStep("password")
    } catch (error) {
      setMessage("Error verifying code")
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match")
      return
    }

    if (newPassword.length < 6) {
      setMessage("Password must be at least 6 characters")
      return
    }

    setLoading(true)
    setMessage("")

    try {
      // Mark reset request as used
      const requests = JSON.parse(localStorage.getItem("passwordResets") || "[]") as PasswordResetRequest[]
      const updatedRequests = requests.map((r) => (r.email === email && r.code === code ? { ...r, used: true } : r))
      localStorage.setItem("passwordResets", JSON.stringify(updatedRequests))

      // In a real app, you would update the password in your auth system
      // For demo purposes, we'll just show success
      setMessage("Password reset successfully! You can now login with your new password.")

      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (error) {
      setMessage("Error resetting password")
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
          <CardDescription>
            {step === "email" && "Enter your email to receive a verification code"}
            {step === "code" && "Enter the verification code sent to your email"}
            {step === "password" && "Create a new password for your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "email" && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Send Verification Code"}
              </Button>
            </form>
          )}

          {step === "code" && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  required
                />
                <p className="text-xs text-gray-600">
                  Demo code: <span className="font-mono font-bold">{generatedCode}</span>
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Verifying..." : "Verify Code"}
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={() => setStep("email")}>
                Back to Email
              </Button>
            </form>
          )}

          {step === "password" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          )}

          {message && (
            <Alert
              className={message.includes("Error") ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}
              variant={message.includes("Error") ? "destructive" : "default"}
            >
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <div className="mt-4 text-center">
            <Link href="/login" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
