"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { calcEC, calcOC, calculateFinalScore } from "@/lib/calculations"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, Trash2 } from "lucide-react"
import { UserWeeklyUpdatesDialog } from "@/components/admin/user-weekly-updates-dialog"
import type { User as AppUser, ScoreData as AppScoreData } from "@/types"

const MOCK_USERS: AppUser[] = [
  {
    uid: "admin_settlyfe_com",
    name: "Admin User",
    email: "admin@settlyfe.com",
    role: "owner",
    createdAt: new Date().toISOString(),
  },
  {
    uid: "user01_settlyfe_com",
    name: "John Doe",
    email: "user01@settlyfe.com",
    role: "member",
    createdAt: new Date().toISOString(),
  },
  {
    uid: "user02_settlyfe_com",
    name: "Jane Smith",
    email: "user02@settlyfe.com",
    role: "member",
    createdAt: new Date().toISOString(),
  },
  {
    uid: "bakeryang_settlyfe_com",
    name: "Baker Yang",
    email: "bakeryang@settlyfe.com",
    role: "admin",
    createdAt: new Date().toISOString(),
  },
]

export default function AdminPanel() {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null)
  const [users, setUsers] = useState<AppUser[]>(MOCK_USERS)
  const [selectedUserUid, setSelectedUserUid] = useState<string>("")
  const [scores, setScores] = useState<AppScoreData[]>([])
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [message, setMessage] = useState("")
  const router = useRouter()

  // Form state
  const [weekId, setWeekId] = useState("")
  const [hours, setHours] = useState("")
  const [krScore, setKrScore] = useState("")
  const [krWeight, setKrWeight] = useState("1")
  const [ccValue, setCcValue] = useState("")

  // State for UserWeeklyUpdatesDialog
  const [isUpdatesDialogOpen, setIsUpdatesDialogOpen] = useState(false)
  const [viewingUpdatesForUser, setViewingUpdatesForUser] = useState<AppUser | null>(null)
  const [viewingUpdatesForWeekId, setViewingUpdatesForWeekId] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("currentUser")
      if (!storedUser) {
        router.push("/login")
        return
      }

      const userData = JSON.parse(storedUser) as AppUser
      if (userData.role !== "admin" && userData.role !== "owner") {
        router.push("/dashboard")
        return
      }
      setCurrentUser(userData)

      const allStoredUsers = localStorage.getItem("allUsers")
      if (allStoredUsers) {
        setUsers(JSON.parse(allStoredUsers))
      } else {
        localStorage.setItem("allUsers", JSON.stringify(MOCK_USERS))
      }
    }
  }, [router])

  useEffect(() => {
    if (selectedUserUid) {
      fetchUserScores(selectedUserUid)
    } else {
      setScores([])
    }
  }, [selectedUserUid])

  const fetchUserScores = (uid: string) => {
    if (typeof window !== "undefined") {
      try {
        const storedScores = localStorage.getItem(`scores_${uid}`)
        if (storedScores) {
          const scoresData = JSON.parse(storedScores) as AppScoreData[]
          scoresData.sort((a, b) => b.weekId.localeCompare(a.weekId))
          setScores(scoresData)
        } else {
          setScores([])
        }
      } catch (error) {
        console.error("Error fetching scores:", error)
        setScores([])
      }
    }
  }

  // Helper function to check if current user can manage target user
  const canManageUser = (targetUser: AppUser) => {
    if (!currentUser) return false

    // Owner can manage everyone
    if (currentUser.role === "owner") {
      return true
    }

    // Admin can only manage members
    if (currentUser.role === "admin") {
      return targetUser.role === "member"
    }

    // Members can't manage anyone
    return false
  }

  const handleDeleteScore = async (weekIdToDelete: string) => {
    if (!selectedUserUid || !currentUser) {
      setMessage("Please select a user and ensure you're logged in")
      return
    }

    // Only owner can delete scores
    if (currentUser.role !== "owner") {
      setMessage("Only owners can delete score entries")
      return
    }

    setDeleting(true)
    setMessage("")

    try {
      const storageKey = `scores_${selectedUserUid}`
      const existingScores = localStorage.getItem(storageKey)

      if (existingScores) {
        const scoresArray: AppScoreData[] = JSON.parse(existingScores)
        const scoreToDelete = scoresArray.find((score) => score.weekId === weekIdToDelete)

        if (!scoreToDelete) {
          setMessage("Score entry not found")
          setDeleting(false)
          return
        }

        const updatedScores = scoresArray.filter((score) => score.weekId !== weekIdToDelete)
        localStorage.setItem(storageKey, JSON.stringify(updatedScores))

        // Log the deletion for audit purposes
        const deletionLog = {
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          deletedBy: currentUser.uid,
          deletedByName: currentUser.name,
          targetUser: selectedUserUid,
          targetUserName: users.find((u) => u.uid === selectedUserUid)?.name || "Unknown",
          weekId: weekIdToDelete,
          deletedScore: scoreToDelete,
          timestamp: new Date().toISOString(),
        }

        // Store deletion log
        const existingLogs = localStorage.getItem("scoreDeletionLogs")
        const logs = existingLogs ? JSON.parse(existingLogs) : []
        logs.push(deletionLog)
        localStorage.setItem("scoreDeletionLogs", JSON.stringify(logs))

        setMessage(`Score for week ${weekIdToDelete} deleted successfully`)
        fetchUserScores(selectedUserUid) // Refresh the scores list
      } else {
        setMessage("No scores found for this user")
      }
    } catch (error) {
      setMessage("Error deleting score")
      console.error("Error deleting score:", error)
    } finally {
      setDeleting(false)
    }
  }

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserUid || !weekId || typeof window === "undefined") return

    // Check if current user can manage the selected user
    const selectedUser = users.find((u) => u.uid === selectedUserUid)
    if (selectedUser && !canManageUser(selectedUser)) {
      setMessage("You don't have permission to manage this user's scores")
      return
    }

    setSaving(true)
    setMessage("")

    try {
      const hoursNum = Number.parseFloat(hours) || 0
      const krScoreNum = Number.parseFloat(krScore) || 0
      const krWeightNum = Number.parseFloat(krWeight) || 1
      const ccNum = Number.parseFloat(ccValue) || 0

      const EC = calcEC(hoursNum)
      const OC = calcOC([{ score: krScoreNum, weight: krWeightNum }])
      const CC = Math.max(0, Math.min(1, ccNum))

      const teamId = selectedUser?.teamId

      const { baseScore, finalScore, multiplier, weights } = calculateFinalScore(EC, OC, CC, selectedUserUid, teamId)

      const checkMark = hoursNum >= 20 && OC === 1

      const newScore: AppScoreData = {
        weekId,
        EC,
        OC,
        CC,
        WCS: finalScore,
        checkMark,
        createdAt: new Date().toISOString(),
      }

      const existingScores = localStorage.getItem(`scores_${selectedUserUid}`)
      const scoresArray: AppScoreData[] = existingScores ? JSON.parse(existingScores) : []

      const existingIndex = scoresArray.findIndex((s) => s.weekId === weekId)
      if (existingIndex >= 0) {
        scoresArray[existingIndex] = newScore
      } else {
        scoresArray.push(newScore)
      }

      localStorage.setItem(`scores_${selectedUserUid}`, JSON.stringify(scoresArray))

      setMessage("Score saved successfully!")
      fetchUserScores(selectedUserUid)

      setHours("")
      setKrScore("")
      setCcValue("")
    } catch (error) {
      setMessage("Error saving score")
      console.error("Error:", error)
    } finally {
      setSaving(false)
    }
  }

  const getCurrentWeek = () => {
    const now = new Date()
    const year = now.getFullYear()
    const start = new Date(year, 0, 1)
    const days = Math.floor((now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
    const week = Math.ceil((days + start.getDay() + 1) / 7)
    return `${year}-W${week.toString().padStart(2, "0")}`
  }

  useEffect(() => {
    setWeekId(getCurrentWeek())
  }, [])

  const handleViewUpdatesClick = (scoreWeekId: string) => {
    const userToView = users.find((u) => u.uid === selectedUserUid)
    if (userToView) {
      setViewingUpdatesForUser(userToView)
      setViewingUpdatesForWeekId(scoreWeekId)
      setIsUpdatesDialogOpen(true)
    }
  }

  const selectedUserDetails = users.find((u) => u.uid === selectedUserUid)
  const isOwner = currentUser?.role === "owner"
  const canDeleteScores = currentUser?.role === "owner"

  // Filter users based on what current user can manage
  const managableUsers = users.filter((u) => canManageUser(u))

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile-optimized header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 sm:py-4 gap-3 sm:gap-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                Manage team scores and performance - Role: {currentUser?.role?.toUpperCase()}
              </p>
              {currentUser?.role === "admin" && (
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  As Admin, you can only manage Members. Only Owners can delete scores.
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {isOwner && (
                <Link href="/admin/access-control">
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                    Access Control
                  </Button>
                </Link>
              )}
              <Link href="/admin/pto">
                <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                  PTO Management
                </Button>
              </Link>
              <Link href="/admin/credit-system">
                <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                  Credit System
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Member List - Mobile optimized */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-lg sm:text-xl text-gray-900 dark:text-white">
                {currentUser?.role === "owner" ? "All Users" : "Members You Can Manage"}
              </CardTitle>
              <CardDescription className="text-sm text-gray-600 dark:text-gray-300">
                Select a {currentUser?.role === "owner" ? "user" : "member"} to manage their scores
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {managableUsers.length === 0 ? (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                  No users available to manage
                </div>
              ) : (
                managableUsers.map((member) => (
                  <div
                    key={member.uid}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedUserUid === member.uid
                        ? "bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700/50 border-gray-200 dark:border-gray-700"
                    }`}
                    onClick={() => setSelectedUserUid(member.uid)}
                  >
                    <div className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">{member.name}</div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate">{member.email}</div>
                    <Badge
                      variant={member.role === "owner" ? "default" : member.role === "admin" ? "secondary" : "outline"}
                      className="mt-1 text-xs"
                    >
                      {member.role}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Score Input Form - Mobile optimized */}
          <Card className="lg:col-span-2 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-lg sm:text-xl text-gray-900 dark:text-white">Score Entry</CardTitle>
              <CardDescription className="text-sm text-gray-600 dark:text-gray-300">
                {selectedUserDetails
                  ? `Enter scores for ${selectedUserDetails.name}`
                  : `Select a ${currentUser?.role === "owner" ? "user" : "member"} to enter scores`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedUserUid ? (
                <form onSubmit={handleSubmitScore} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="week" className="text-sm font-medium text-gray-900 dark:text-white">
                        Week ID
                      </Label>
                      <Input
                        id="week"
                        value={weekId}
                        onChange={(e) => setWeekId(e.target.value)}
                        placeholder="YYYY-Www (e.g. 2025-W01)"
                        required
                        className="text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hours" className="text-sm font-medium text-gray-900 dark:text-white">
                        Hours Worked
                      </Label>
                      <Input
                        id="hours"
                        type="number"
                        step="0.1"
                        value={hours}
                        onChange={(e) => setHours(e.target.value)}
                        placeholder="e.g. 40"
                        required
                        className="text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="kr-score" className="text-sm font-medium text-gray-900 dark:text-white">
                        KR Score
                      </Label>
                      <Select value={krScore} onValueChange={setKrScore}>
                        <SelectTrigger className="text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600">
                          <SelectValue placeholder="Select KR score" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-gray-700 dark:text-white">
                          <SelectItem value="1">1.0 - Excellent</SelectItem>
                          <SelectItem value="0.8">0.8 - On Time</SelectItem>
                          <SelectItem value="0.6">0.6 - Qualified</SelectItem>
                          <SelectItem value="0.4">0.4 - Low Quality</SelectItem>
                          <SelectItem value="0">0 - Not Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="kr-weight" className="text-sm font-medium text-gray-900 dark:text-white">
                        KR Weight
                      </Label>
                      <Select value={krWeight} onValueChange={setKrWeight}>
                        <SelectTrigger className="text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-gray-700 dark:text-white">
                          <SelectItem value="1">1.0 - Main KR</SelectItem>
                          <SelectItem value="0.5">0.5 - Support KR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cc" className="text-sm font-medium text-gray-900 dark:text-white">
                      Collab Credit (CC)
                    </Label>
                    <Input
                      id="cc"
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={ccValue}
                      onChange={(e) => setCcValue(e.target.value)}
                      placeholder="e.g. 0.8"
                      required
                      className="text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                    <p className="text-xs text-gray-600 dark:text-gray-300">Enter CC value between 0 and 1.</p>
                  </div>

                  {message && (
                    <Alert
                      className={
                        message.includes("Error") ||
                        message.includes("Only owners") ||
                        message.includes("don't have permission")
                          ? "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/30"
                          : "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/30"
                      }
                    >
                      <AlertDescription
                        className={
                          message.includes("Error") ||
                          message.includes("Only owners") ||
                          message.includes("don't have permission")
                            ? "text-red-700 dark:text-red-200 text-sm"
                            : "text-green-700 dark:text-green-200 text-sm"
                        }
                      >
                        {message}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" disabled={saving || !selectedUserUid} className="w-full text-sm">
                    {saving ? "Saving..." : "Save Score"}
                  </Button>
                </form>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                  Select a {currentUser?.role === "owner" ? "user" : "member"} from the list to enter their scores.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Score History - Mobile optimized */}
        {selectedUserUid && scores.length > 0 && (
          <Card className="mt-4 sm:mt-8 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-lg sm:text-xl text-gray-900 dark:text-white">
                Score History for {selectedUserDetails?.name}
              </CardTitle>
              <CardDescription className="text-sm text-gray-600 dark:text-gray-300">
                Historical scores and daily updates access.
                {canDeleteScores && (
                  <span className="block mt-1 text-orange-600 dark:text-orange-400 font-medium">
                    As Owner, you can delete individual score entries.
                  </span>
                )}
                {!canDeleteScores && currentUser?.role === "admin" && (
                  <span className="block mt-1 text-blue-600 dark:text-blue-400 font-medium">
                    As Admin, you can view but not delete score entries.
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="dark:border-gray-700">
                      <TableHead className="text-xs sm:text-sm text-gray-900 dark:text-white">Week</TableHead>
                      <TableHead className="text-xs sm:text-sm text-gray-900 dark:text-white">EC</TableHead>
                      <TableHead className="text-xs sm:text-sm text-gray-900 dark:text-white">OC</TableHead>
                      <TableHead className="text-xs sm:text-sm text-gray-900 dark:text-white">CC</TableHead>
                      <TableHead className="text-xs sm:text-sm text-gray-900 dark:text-white">WCS</TableHead>
                      <TableHead className="text-xs sm:text-sm text-gray-900 dark:text-white">Status</TableHead>
                      <TableHead className="text-xs sm:text-sm text-gray-900 dark:text-white">Created</TableHead>
                      <TableHead className="text-xs sm:text-sm text-gray-900 dark:text-white">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scores.map((score) => (
                      <TableRow key={score.weekId} className="dark:border-gray-700">
                        <TableCell className="font-medium text-xs sm:text-sm text-gray-900 dark:text-white">
                          {score.weekId}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm text-gray-900 dark:text-white">
                          {score.EC.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm text-gray-900 dark:text-white">
                          {score.OC.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm text-gray-900 dark:text-white">
                          {score.CC.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={score.WCS >= 0.8 ? "default" : score.WCS >= 0.6 ? "secondary" : "destructive"}
                            className="text-xs"
                          >
                            {score.WCS.toFixed(2)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {score.checkMark && (
                            <Badge
                              variant="outline"
                              className="text-xs text-green-600 border-green-600 dark:text-green-400 dark:border-green-400"
                            >
                              ✓ 20h+
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-gray-600 dark:text-gray-300">
                          {new Date(score.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewUpdatesClick(score.weekId)}
                              className="text-xs"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            {canDeleteScores && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                                    disabled={deleting}
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    {deleting ? "..." : "Delete"}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="dark:bg-gray-800 dark:border-gray-700">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-gray-900 dark:text-white">
                                      Delete Score Entry
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="text-gray-600 dark:text-gray-300">
                                      Are you sure you want to delete the score entry for week {score.weekId}? This
                                      action cannot be undone.
                                      <br />
                                      <br />
                                      <strong>User:</strong> {selectedUserDetails?.name}
                                      <br />
                                      <strong>Week:</strong> {score.weekId}
                                      <br />
                                      <strong>Score:</strong> {score.WCS.toFixed(2)}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600">
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteScore(score.weekId)}
                                      className="bg-red-600 hover:bg-red-700 text-white"
                                    >
                                      Delete Score
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
        {selectedUserUid && scores.length === 0 && (
          <Card className="mt-4 sm:mt-8 dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-6 text-center text-gray-500 dark:text-gray-400 text-sm">
              No scores recorded yet for {selectedUserDetails?.name}.
            </CardContent>
          </Card>
        )}
      </div>
      <UserWeeklyUpdatesDialog
        open={isUpdatesDialogOpen}
        onOpenChange={setIsUpdatesDialogOpen}
        targetUser={viewingUpdatesForUser}
        weekId={viewingUpdatesForWeekId}
      />
    </div>
  )
}
