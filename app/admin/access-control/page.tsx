"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Shield, Users, Eye, EyeOff } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import type { User } from "@/types"

export default function AccessControlPage() {
  const { user: currentUser, isAdmin, isOwner } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const router = useRouter()

  useEffect(() => {
    if (!currentUser) {
      router.push("/login")
      return
    }

    if (!isAdmin() && !isOwner()) {
      router.push("/dashboard")
      return
    }

    loadUsers()
    setLoading(false)
  }, [currentUser, router, isAdmin, isOwner])

  const loadUsers = () => {
    if (typeof window !== "undefined") {
      const storedUsers = localStorage.getItem("allUsers")
      if (storedUsers) {
        const usersData = JSON.parse(storedUsers) as User[]
        const otherUsers = usersData
          .filter((u) => u.uid !== currentUser?.uid)
          .sort((a, b) => {
            const roleOrder = { owner: 0, admin: 1, member: 2 }
            return roleOrder[a.role] - roleOrder[b.role]
          })
        setUsers(otherUsers)
      }
    }
  }

  const updateUserAccess = async (userId: string, field: keyof User, value: boolean) => {
    setSaving(true)
    setMessage("")

    try {
      const updatedUsers = users.map((user) => {
        if (user.uid === userId) {
          return { ...user, [field]: value }
        }
        return user
      })
      setUsers(updatedUsers)

      const storedUsers = localStorage.getItem("allUsers")
      if (storedUsers) {
        const allUsers = JSON.parse(storedUsers) as User[]
        const updatedAllUsers = allUsers.map((user) => {
          if (user.uid === userId) {
            return { ...user, [field]: value }
          }
          return user
        })
        localStorage.setItem("allUsers", JSON.stringify(updatedAllUsers))
      }

      setMessage("Access permissions updated successfully!")
    } catch (error) {
      setMessage("Error updating access permissions")
      console.error("Error:", error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading access control...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-optimized header */}
      <div className="bg-card shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 sm:py-4 gap-3 sm:gap-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Access Control</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Manage fine-grained permissions for team members
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/admin">
                <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                  <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Back to Admin
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {message && (
          <Alert
            className={
              message.includes("Error")
                ? "border-red-200 bg-red-50 mb-4 sm:mb-6"
                : "border-green-200 bg-green-50 mb-4 sm:mb-6"
            }
          >
            <AlertDescription className={message.includes("Error") ? "text-red-800 text-sm" : "text-green-800 text-sm"}>
              {message}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          {users.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-sm">No team members found</p>
              </CardContent>
            </Card>
          ) : (
            users.map((user) => (
              <Card key={user.uid}>
                <CardHeader className="pb-3 sm:pb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                        <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                        {user.name}
                      </CardTitle>
                      <CardDescription className="text-sm">{user.email}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={user.role === "admin" ? "default" : "secondary"} className="text-xs">
                        {user.role}
                      </Badge>
                      {user.teamId && (
                        <Badge variant="outline" className="text-xs">
                          Team: {user.teamId}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-6">
                    {/* Daily Tasks Access */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-foreground flex items-center gap-2 text-sm sm:text-base">
                        <Eye className="h-4 w-4" />
                        Daily Tasks Access
                      </h4>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <Label htmlFor={`team-tasks-${user.uid}`} className="text-sm font-medium cursor-pointer">
                              View Team Daily Tasks
                            </Label>
                            <p className="text-xs text-muted-foreground mt-1">Can see daily tasks from team members</p>
                          </div>
                          <Switch
                            id={`team-tasks-${user.uid}`}
                            checked={user.canViewTeamDailyTasks ?? true}
                            onCheckedChange={(checked) => updateUserAccess(user.uid, "canViewTeamDailyTasks", checked)}
                            disabled={saving}
                          />
                        </div>

                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <Label
                              htmlFor={`universal-tasks-${user.uid}`}
                              className="text-sm font-medium cursor-pointer"
                            >
                              View Universal Daily Tasks
                            </Label>
                            <p className="text-xs text-muted-foreground mt-1">Can see daily tasks from all users</p>
                          </div>
                          <Switch
                            id={`universal-tasks-${user.uid}`}
                            checked={
                              user.canViewUniversalDailyTasks ?? (user.role === "admin" || user.role === "owner")
                            }
                            onCheckedChange={(checked) =>
                              updateUserAccess(user.uid, "canViewUniversalDailyTasks", checked)
                            }
                            disabled={saving}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Moments Access */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-foreground flex items-center gap-2 text-sm sm:text-base">
                        <EyeOff className="h-4 w-4" />
                        Moments Access
                      </h4>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <Label htmlFor={`team-moments-${user.uid}`} className="text-sm font-medium cursor-pointer">
                              View Team Moments
                            </Label>
                            <p className="text-xs text-muted-foreground mt-1">Can see moments from team members</p>
                          </div>
                          <Switch
                            id={`team-moments-${user.uid}`}
                            checked={user.canViewTeamMoments ?? true}
                            onCheckedChange={(checked) => updateUserAccess(user.uid, "canViewTeamMoments", checked)}
                            disabled={saving}
                          />
                        </div>

                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <Label
                              htmlFor={`universal-moments-${user.uid}`}
                              className="text-sm font-medium cursor-pointer"
                            >
                              View Universal Moments
                            </Label>
                            <p className="text-xs text-muted-foreground mt-1">Can see moments from all users</p>
                          </div>
                          <Switch
                            id={`universal-moments-${user.uid}`}
                            checked={user.canViewUniversalMoments ?? (user.role === "admin" || user.role === "owner")}
                            onCheckedChange={(checked) =>
                              updateUserAccess(user.uid, "canViewUniversalMoments", checked)
                            }
                            disabled={saving}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Role-based defaults info */}
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <p className="text-xs text-blue-800 dark:text-blue-200">
                      <strong>Default permissions:</strong>{" "}
                      {user.role === "admin" || user.role === "owner"
                        ? "Admins and Owners can view all content by default"
                        : "Members can view team content by default"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
