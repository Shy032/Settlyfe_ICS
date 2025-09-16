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
import { useTranslation } from "@/lib/i18n"
import type { User as UserType } from "@/types"

interface UserSettingsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserSettings({ open, onOpenChange }: UserSettingsProps) {
  const { user, updateUser, signOut } = useAuth()
  const { t } = useTranslation(user?.preferredLanguage as any)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  // Form states
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [displayTitle, setDisplayTitle] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [preferredLanguage, setPreferredLanguage] = useState<string>("en")
  const [theme, setTheme] = useState<"light" | "dark" | "neon">("light")
  const [profilePhoto, setProfilePhoto] = useState("")

  useEffect(() => {
    if (user) {
      setName(user.name || "")
      setEmail(user.email || "")
      setDisplayTitle(user.displayTitle || "")
      setPhoneNumber(user.phoneNumber || "")
      setPreferredLanguage(user.preferredLanguage || "en")
      setTheme(user.theme || "light")
      setProfilePhoto(user.profilePhoto || "")
    }
  }, [user])

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement
    root.classList.remove("light", "dark", "neon")
    root.classList.add(theme)
  }, [theme])

  const handleSave = async () => {
    if (!user) return

    setLoading(true)
    setMessage("")

    try {
      const updatedUser: UserType = {
        ...user,
        name,
        email,
        displayTitle,
        phoneNumber,
        preferredLanguage,
        theme,
        profilePhoto,
      }

      // Update in localStorage
      localStorage.setItem("currentUser", JSON.stringify(updatedUser))

      // Update in allUsers list
      const allUsers = localStorage.getItem("allUsers")
      if (allUsers) {
        const usersArray = JSON.parse(allUsers) as UserType[]
        const updatedUsers = usersArray.map((u) => (u.uid === user.uid ? updatedUser : u))
        localStorage.setItem("allUsers", JSON.stringify(updatedUsers))
      }

      // Update auth context
      await updateUser(updatedUser)

      // Apply theme immediately
      const root = document.documentElement
      root.classList.remove("light", "dark", "neon")
      root.classList.add(theme)

      setMessage("Settings saved successfully!")

      setTimeout(() => {
        onOpenChange(false)
        setMessage("")
      }, 1500)
    } catch (error) {
      setMessage("Error saving settings")
      console.error("Error:", error)
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

  const handleSignOut = () => {
    signOut()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("userSettings")}</DialogTitle>
          <DialogDescription>{t("profileManagement")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Photo */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profilePhoto || "/placeholder.svg"} />
              <AvatarFallback>
                <User className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div>
              <Label htmlFor="photo">{t("uploadPhoto")}</Label>
              <div className="flex items-center gap-2 mt-1">
                <input id="photo" type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("photo")?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {t("uploadPhoto")}
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="name">{t("fullName")}</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            {/* Display Title */}
            <div className="space-y-2">
              <Label htmlFor="title">{t("displayTitle")}</Label>
              <Input
                id="title"
                value={displayTitle}
                onChange={(e) => setDisplayTitle(e.target.value)}
                placeholder="e.g., Senior Developer"
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phone">{t("phoneNumber")}</Label>
              <Input
                id="phone"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            {/* Preferred Language */}
            <div className="space-y-2">
              <Label htmlFor="language">{t("preferredLanguage")}</Label>
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
              <Label htmlFor="theme">{t("theme")}</Label>
              <Select value={theme} onValueChange={(value: "light" | "dark" | "neon") => setTheme(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">{t("light")}</SelectItem>
                  <SelectItem value="dark">{t("dark")}</SelectItem>
                  <SelectItem value="neon">{t("neon")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
              {loading ? "Saving..." : t("saveChanges")}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              {t("cancel")}
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
                {t("signOut")}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
