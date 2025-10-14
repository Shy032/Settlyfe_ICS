"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, User, LogOut } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import type { Employee } from "@/types"
import { getFullName } from "@/types"

interface ProfileSettingsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileSettings({ open, onOpenChange }: ProfileSettingsProps) {
  const { account, employee, updateProfile, signOut } = useAuth()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  // Form states
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [title, setTitle] = useState("")
  const [phone, setPhone] = useState("")
  const [personalEmail, setPersonalEmail] = useState("")
  const [githubEmail, setGithubEmail] = useState("")
  const [zoomEmail, setZoomEmail] = useState("")
  const [preferredLanguage, setPreferredLanguage] = useState<string>("en")
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [profilePhoto, setProfilePhoto] = useState("")

  useEffect(() => {
    if (employee && account) {
      setFirstName(employee.first_name || "")
      setLastName(employee.last_name || "")
      setEmail(account.login_email || "")
      setTitle(employee.title || "")
      setPhone(employee.phone || "")
      setPersonalEmail(employee.personal_email || "")
      setGithubEmail(employee.github_email || "")
      setZoomEmail(employee.zoom_email || "")
      setPreferredLanguage(employee.preferred_language || "en")
      setTheme(employee.theme || "light")
      setProfilePhoto(employee.profile_photo || "")
    }
  }, [employee, account])

  const handleSave = async () => {
    if (!employee || !account) return

    setLoading(true)
    setMessage("")

    // Basic validation
    if (!firstName.trim() || !lastName.trim()) {
      setMessage("First and last names are required")
      setLoading(false)
      return
    }

    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      setMessage("Names must be at least 2 characters long")
      setLoading(false)
      return
    }

    try {
      const updateData: Partial<Employee> & { login_email?: string } = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        title: title.trim() || undefined,
        phone: phone.trim() || undefined,
        personal_email: personalEmail.trim() || undefined,
        github_email: githubEmail.trim() || undefined,
        zoom_email: zoomEmail.trim() || undefined,
        preferred_language: preferredLanguage,
        theme: theme,
        profile_photo: profilePhoto || undefined
      }

      // Only update login email if it's different
      if (email.trim() !== account.login_email) {
        updateData.login_email = email.trim()
      }

      await updateProfile(updateData)

      setMessage("Profile updated successfully!")

      setTimeout(() => {
        onOpenChange(false)
        setMessage("")
      }, 1500)
    } catch (error) {
      setMessage("Error updating profile. Please try again.")
      console.error("Profile update error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setProfilePhoto(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    onOpenChange(false)
  }

  if (!employee || !account) {
    return null
  }

  const fullName = getFullName(firstName || employee.first_name, lastName || employee.last_name)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Profile Settings</DialogTitle>
          <DialogDescription>Manage your personal information and preferences</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Photo */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profilePhoto || `https://avatar.vercel.sh/${account.login_email}.png`} />
              <AvatarFallback>
                <User className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div>
              <Label htmlFor="photo">Profile Photo</Label>
              <div className="flex items-center gap-2 mt-1">
                <input id="photo" type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("photo")?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Photo
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input 
                id="firstName" 
                value={firstName} 
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter your first name"
                required
              />
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input 
                id="lastName" 
                value={lastName} 
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter your last name"
                required
              />
            </div>

            {/* Login Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Login Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your login email"
              />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Senior Developer"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            {/* Personal Email */}
            <div className="space-y-2">
              <Label htmlFor="personalEmail">Personal Email</Label>
              <Input
                id="personalEmail"
                type="email"
                value={personalEmail}
                onChange={(e) => setPersonalEmail(e.target.value)}
                placeholder="your.personal@email.com"
              />
            </div>

            {/* GitHub Email */}
            <div className="space-y-2">
              <Label htmlFor="githubEmail">GitHub Email</Label>
              <Input
                id="githubEmail"
                type="email"
                value={githubEmail}
                onChange={(e) => setGithubEmail(e.target.value)}
                placeholder="your.github@email.com"
              />
            </div>

            {/* Zoom Email */}
            <div className="space-y-2">
              <Label htmlFor="zoomEmail">Zoom Email</Label>
              <Input
                id="zoomEmail"
                type="email"
                value={zoomEmail}
                onChange={(e) => setZoomEmail(e.target.value)}
                placeholder="your.zoom@email.com"
              />
            </div>

            {/* Preferred Language */}
            <div className="space-y-2">
              <Label htmlFor="language">Preferred Language</Label>
              <Select value={preferredLanguage} onValueChange={setPreferredLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="zh">中文</SelectItem>
                  <SelectItem value="ko">한국어</SelectItem>
                  <SelectItem value="ja">日本語</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Theme */}
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select value={theme} onValueChange={(value: "light" | "dark") => setTheme(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Display current values */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Preview</h4>
            <p className="text-sm text-gray-600">
              <strong>Full Name:</strong> {fullName}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Access Level:</strong> {account.access_level}
            </p>
            {employee.join_date && (
              <p className="text-sm text-gray-600">
                <strong>Join Date:</strong> {new Date(employee.join_date).toLocaleDateString()}
              </p>
            )}
          </div>

          {message && (
            <Alert className={message.includes("Error") ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
              <AlertDescription className={message.includes("Error") ? "text-red-800" : "text-green-800"}>
                {message}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={loading} className="flex-1">
              {loading ? "Saving..." : "Save Changes"}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
          </div>

          {/* Sign Out Section */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium">Account Actions</h4>
                <p className="text-sm text-gray-500">Sign out of your account</p>
              </div>
              <Button variant="destructive" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
