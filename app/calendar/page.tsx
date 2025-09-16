"use client"

import type React from "react"
import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CalendarIcon, Clock, BarChart3, Trash2, MessageSquare, AlertTriangle, Hourglass, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { useTranslation } from "@/lib/i18n"
import { SupabaseService } from "@/lib/supabase"
import type { ClockinSession, User, Team } from "@/types"

export default function CalendarPage() {
  const { user, isAdmin, isOwner } = useAuth()
  const { t } = useTranslation(user?.preferredLanguage as any)
  const [clockinSessions, setClockinSessions] = useState<ClockinSession[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [deletionRequests, setDeletionRequests] = useState<any[]>([]) // Simplified for now

  // Advanced owner dashboard state
  const [selectedTeamId, setSelectedTeamId] = useState<string>("all")
  const [teams, setTeams] = useState<Team[]>([])
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [selectedUserForEmoji, setSelectedUserForEmoji] = useState<string | null>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [editingEntry, setEditingEntry] = useState<ClockinSession | null>(null)
  const router = useRouter()

  // Form states
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [hours, setHours] = useState("")
  const [description, setDescription] = useState("")

  // Calendar view state
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [viewMode, setViewMode] = useState<"calendar" | "analytics">("calendar")

  // Deletion request dialog state
  const [showDeletionRequestDialog, setShowDeletionRequestDialog] = useState(false)
  const [entryToDelete, setEntryToDelete] = useState<ClockinSession | null>(null)
  const [deletionReason, setDeletionReason] = useState("")

  // Admin comment dialog state
  const [showAdminCommentDialog, setShowAdminCommentDialog] = useState(false)
  const [entryToCommentOn, setEntryToCommentOn] = useState<ClockinSession | null>(null)
  const [adminComment, setAdminComment] = useState("")

  // Owner approval dialog state
  const [showOwnerApprovalDialog, setShowOwnerApprovalDialog] = useState(false)
  const [requestToReview, setRequestToReview] = useState<any | null>(null)
  const [ownerReviewComment, setOwnerReviewComment] = useState("")

  // Force refresh state
  const [refreshKey, setRefreshKey] = useState(0)

  const loadAllData = useCallback(async () => {
    if (typeof window === "undefined" || !user) return
    setLoading(true)

    try {
      // Load clockin sessions from database
      const employeeId = isAdmin() || isOwner() ? undefined : user.employeeId
      const { data: sessions, error: sessionsError } = await SupabaseService.getClockinSessions(employeeId)
      
      if (sessionsError) {
        console.error("Error loading clockin sessions:", sessionsError)
      } else {
        // Transform database data to match our interface
        const transformedSessions: ClockinSession[] = sessions?.map((session: any) => ({
          id: session.id,
          employeeId: session.employee_id,
          date: session.date,
          startTime: session.start_time,
          endTime: session.end_time,
          duration: session.duration,
          hours: session.hours,
          description: session.description,
          createdAt: session.created_at,
        })) || []

        // Sort by date (newest first)
        setClockinSessions(transformedSessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
      }

      // Load users from database
      const { data: users, error: usersError } = await SupabaseService.getEmployees()
      if (usersError) {
        console.error("Error loading users:", usersError)
      } else if (users) {
        setAllUsers(users)
      }

      // Load teams from database
      const { data: teams, error: teamsError } = await SupabaseService.getTeams()
      if (teamsError) {
        console.error("Error loading teams:", teamsError)
      } else if (teams) {
        setTeams(teams)
      }

      // TODO: Load deletion requests from database (simplified for now)
      setDeletionRequests([])

    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }, [user, isAdmin, isOwner])

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }
    loadAllData()
  }, [user, router, loadAllData, refreshKey])

  // Refresh data from database
  const refreshData = () => {
    setRefreshKey((prev) => prev + 1)
  }

  const handleSubmitHours = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hours || !selectedDate || !user) {
      setMessage("Please enter hours and select a date")
      return
    }
    setSaving(true)
    setMessage("")
    try {
      const hoursNum = Number.parseFloat(hours)
      if (hoursNum <= 0 || hoursNum > 24) {
        setMessage("Please enter valid hours (0-24)")
        setSaving(false)
        return
      }

      // Save directly to database
      try {
        const adjustedHours = Math.max(0.01, hoursNum) // Minimum 0.01 hours (36 seconds)
        
        if (editingEntry) {
          // Update existing session
          console.log('Updating clockin session:', editingEntry.id)
          const { data, error } = await SupabaseService.updateClockinSession(editingEntry.id, {
            hours: adjustedHours,
            description: description.trim() || "Manual entry",
          })
          
          if (error) {
            console.error('Database update error:', error)
            setMessage("Failed to update entry: " + error.message)
            setSaving(false)
            return
          } else if (!data || data.length === 0) {
            console.error('Update succeeded but no rows affected - likely RLS permission issue')
            setMessage("Update failed: You don't have permission to modify this entry")
            setSaving(false)
            return
          } else {
            console.log('Successfully updated clockin session:', data)
            setMessage("Entry updated successfully")
          }
        } else {
          // Create new session
          console.log('Creating new clockin session')
          const { data, error } = await SupabaseService.createClockinSession({
            employee_id: user.employeeId,
            date: selectedDate,
            start_time: '09:00:00', // Default times for manual entries
            end_time: '17:00:00',
            duration: `${Math.floor(adjustedHours)}:${Math.floor((adjustedHours % 1) * 60).toString().padStart(2, '0')}:00`,
            hours: adjustedHours,
            description: description.trim() || "Manual entry",
          })
          
          if (error) {
            console.error('Database create error:', error)
            setMessage("Failed to create entry")
            setSaving(false)
            return
          } else {
            console.log('Successfully created clockin session:', data)
          }
        }

        // Refresh data from database
        refreshData()
      } catch (error) {
        console.error('Error saving to database:', error)
        setMessage("Failed to save entry")
        setSaving(false)
        return
      }

      // Update UI
      setMessage(editingEntry ? "Hours updated successfully!" : "Hours logged successfully!")
      setEditingEntry(null)
      setHours("")
      setDescription("")

      // Force refresh the calendar view
      setRefreshKey((prev) => prev + 1)
    } catch (error) {
      setMessage("Error logging hours")
      console.error("Error:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClick = (session: ClockinSession) => {
    if (!user || (!isAdmin() && !isOwner())) return

    // If it's the current user's own session, they can delete it directly.
    if (session.employeeId === user.employeeId) {
      setEntryToDelete(session)
      setShowDeletionRequestDialog(true)
    } else {
      // Otherwise, it's a request.
      handleOpenDeletionRequestDialog(session)
    }
  }

  const handleOpenDeletionRequestDialog = (session: ClockinSession) => {
    setEntryToDelete(session)
    setDeletionReason("")
    setShowDeletionRequestDialog(true)
  }

  const handleSubmitDeletionRequest = async () => {
    if (!entryToDelete || !user) return

    try {
      // Direct deletion for self
      if (entryToDelete.employeeId === user.employeeId) {
        console.log('Deleting clockin session:', entryToDelete.id)
        const { error } = await SupabaseService.updateClockinSession(entryToDelete.id, { 
          deleted: true 
        })
        
        if (error) {
          console.error('Database deletion error:', error)
          setMessage("Failed to delete entry")
        } else {
          console.log('Successfully deleted session:', entryToDelete.id)
          setMessage("Entry deleted successfully.")
          refreshData()
        }
      } else {
        // Submit deletion request for other users' entries
        const newRequest = {
          id: `delReq_${Date.now()}`,
          sessionId: entryToDelete.id,
          employeeId: entryToDelete.employeeId,
          requestedByUid: user.accountId,
          requestReason: deletionReason.trim() || "No reason provided",
          status: "pending",
          requestedAt: new Date().toISOString(),
        }
        const updatedRequests = [...deletionRequests, newRequest]
        setDeletionRequests(updatedRequests)
        setMessage("Deletion request submitted to Owner for approval.")
      }
    } catch (error) {
      console.error('Error handling deletion:', error)
      setMessage("Failed to process deletion")
    }
    
    setShowDeletionRequestDialog(false)
    setEntryToDelete(null)
  }

  const handleOpenAdminCommentDialog = (session: ClockinSession) => {
    setEntryToCommentOn(session)
    setAdminComment(session.description || "")
    setShowAdminCommentDialog(true)
  }

  const handleSubmitAdminComment = async () => {
    if (!entryToCommentOn || !user) return

    try {
      console.log('Updating clockin session comment:', entryToCommentOn.id)
      const { error } = await SupabaseService.updateClockinSession(entryToCommentOn.id, {
        description: adminComment.trim() || "No comment",
      })
      
      if (error) {
        console.error('Database comment update error:', error)
        setMessage("Failed to update comment")
      } else {
        console.log('Successfully updated comment')
        setMessage("Comment updated successfully.")
        refreshData()
      }
    } catch (error) {
      console.error('Error updating comment:', error)
      setMessage("Failed to update comment")
    }

    setShowAdminCommentDialog(false)
    setEntryToCommentOn(null)
    setAdminComment("")
  }

  const handleReviewDeletionRequest = (request: any, decision: "approved" | "rejected") => {
    if (!isOwner() || !user) return

    const updatedRequests = deletionRequests.map((r: any) =>
      r.id === request.id
        ? {
            ...r,
            status: decision,
            ownerComment: ownerReviewComment.trim() || undefined,
            reviewedAt: new Date().toISOString(),
            reviewedByUid: user.accountId,
          }
        : r,
    )

    if (decision === "approved") {
      // Delete the clockin session from database
      SupabaseService.updateClockinSession(request.sessionId, { deleted: true }).catch(console.error)
      // Refresh data
      refreshData()
    }
    setDeletionRequests(updatedRequests)
    setShowOwnerApprovalDialog(false)
    setRequestToReview(null)
    setOwnerReviewComment("")
    setMessage(`Deletion request has been ${decision}.`)
  }

  const getUserName = (employeeId: string) => allUsers.find((u) => u.employeeId === employeeId)?.name || "Unknown User"

  const getMyHoursForDate = (date: string) => {
    if (!user) return []
    return clockinSessions.filter((session) => session.date === date && session.employeeId === user.employeeId)
  }

  const getTeamHeatmapIntensity = (date: string) => {
    const daySessions = clockinSessions.filter((session) => session.date === date)
    const uniqueUsers = new Set(daySessions.map((session) => session.employeeId)).size
    const maxUsers = Math.max(1, allUsers.length)
    return (uniqueUsers / maxUsers) * 100
  }

  const getTeamMetrics = (teamId: string) => {
    const teamSessions =
      teamId === "all"
        ? clockinSessions
        : clockinSessions.filter((session) => {
            const sessionUser = allUsers.find((u) => u.employeeId === session.employeeId)
            return sessionUser?.teamId === teamId
          })

    const teamUsers = teamId === "all" ? allUsers : allUsers.filter((u) => u.teamId === teamId)

    const totalHours = teamSessions.reduce((sum, session) => sum + session.hours, 0)
    const activeMembers = new Set(teamSessions.map((session) => session.employeeId)).size
    const avgDailyHours = teamSessions.length > 0 ? totalHours / teamSessions.length : 0

    // Calculate peak day
    const hoursByDay: { [key: string]: number } = {}
    teamSessions.forEach((session) => {
      const dayOfWeek = new Date(session.date).getDay()
      const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayOfWeek]
      hoursByDay[dayName] = (hoursByDay[dayName] || 0) + session.hours
    })
    const peakDay = Object.entries(hoursByDay).sort(([, a], [, b]) => b - a)[0]?.[0] || "N/A"

    return {
      totalHours,
      activeMembers,
      avgDailyHours,
      peakDay,
      teamUsers: teamUsers.length,
      teamEntries: teamSessions.length,
    }
  }

  const renderCalendarGrid = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    const days = []
    const current = new Date(startDate)

    for (let i = 0; i < 42; i++) {
      const dateStr = current.toISOString().split("T")[0]
      const isSelected = selectedDate === dateStr;
      const isCurrentMonth = current.getMonth() === month
      const isToday = dateStr === new Date().toISOString().split("T")[0]

      // Get entries for this date
      const myEntries = user ? clockinSessions.filter((session) => session.date === dateStr && session.employeeId === user.employeeId) : []
      const allDayEntries = clockinSessions.filter((session) => session.date === dateStr)
      const myTotalHours = myEntries.reduce((sum, session) => sum + session.hours, 0)
      const heatmapIntensity = getTeamHeatmapIntensity(dateStr)

      days.push(
        <div
          key={dateStr}
          className={`min-h-[100px] p-2 border border-gray-200 dark:border-gray-600 relative ${
            isCurrentMonth ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-700"
          } ${isToday ? "ring-2 ring-blue-500 z-10" : ""} ${isSelected ? "!bg-blue-200 dark:!bg-blue-800" : ""}`}
          // style={{
          //   background: isCurrentMonth
          //     ? `linear-gradient(to bottom, rgba(59, 130, 246, ${(heatmapIntensity / 100) * 0.3}) 0%, rgba(59, 130, 246, ${(heatmapIntensity / 100) * 0.1}) 100%)`
          //     : undefined,
          // }}
          onClick={() => {
            setSelectedDate(dateStr)
            setEditingEntry(null)
            setHours("")
            setDescription("")
          }}
        >
          <div className="flex justify-between items-start">
            <span
              className={`text-sm font-medium ${isCurrentMonth ? "text-gray-900 dark:text-gray-100" : "text-gray-400 dark:text-gray-500"}`}
            >
              {current.getDate()}
            </span>
            {myTotalHours > 0 && (
              <Badge variant="default" className="text-xs bg-blue-600 dark:bg-blue-500">
                {myTotalHours}h
              </Badge>
            )}
          </div>
          {myEntries.length > 0 && (
            <div className="mt-2 space-y-1">
              {myEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="text-xs bg-blue-500 dark:bg-blue-600 text-white px-2 py-1 rounded cursor-pointer hover:bg-blue-600 dark:hover:bg-blue-700"
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditingEntry(entry)
                    setSelectedDate(entry.date)
                    setHours(entry.hours.toString())
                    setDescription(entry.description || "")
                  }}
                >
                  {t("myHours")}: {entry.hours}h
                  {entry.description && <div className="text-xs opacity-75 truncate">{entry.description}</div>}
                </div>
              ))}
            </div>
          )}
          {allDayEntries.length > myEntries.length && (
            <div className="absolute bottom-1 right-1">
              <div className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-1 rounded">
                +{allDayEntries.length - myEntries.length} team
              </div>
            </div>
          )}
        </div>,
      )
      current.setDate(current.getDate() + 1)
      
    }
    return days
  }

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const pendingDeletionRequests = deletionRequests.filter((r: any) => r.status === "pending")

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t("calendar")}</h1>
              <p className="text-muted-foreground">Log daily hours and manage time entries</p>
            </div>
            <div className="flex gap-2">
              <Button variant={viewMode === "calendar" ? "default" : "outline"} onClick={() => setViewMode("calendar")}>
                <CalendarIcon className="h-4 w-4 mr-2" /> {t("calendar")}
              </Button>
              {(isAdmin() || isOwner()) && (
                <Button
                  variant={viewMode === "analytics" ? "default" : "outline"}
                  onClick={() => setViewMode("analytics")}
                  className="relative"
                >
                  <BarChart3 className="h-4 w-4 mr-2" /> Analytics
                  {isOwner() && pendingDeletionRequests.length > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0">
                      {pendingDeletionRequests.length}
                    </Badge>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <Alert
            className={`mb-4 ${message.includes("Error") || message.includes("rejected") ? "border-red-500 bg-red-50 dark:bg-red-900/50 dark:text-red-200" : "border-green-500 bg-green-50 dark:bg-green-900/50 dark:text-green-200"}`}
          >
            <AlertTitle>{message.includes("Error") || message.includes("rejected") ? "Notice" : "Success"}</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {viewMode === "calendar" ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Hour Logging Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" /> {editingEntry ? "Edit Hours" : t("logHours")}
                </CardTitle>
                <CardDescription>
                  Record your daily work hours. Blue bars show your hours, background intensity shows team activity.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitHours} className="space-y-4">
                  {/* Form fields: Date, Hours, Description */}
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hours">{t("hoursWorked")}</Label>
                    <Input
                      id="hours"
                      type="number"
                      step="0.5"
                      min="0"
                      max="24"
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                      placeholder="8"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">{t("description")} (Optional)</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={t("whatWorkedOn")}
                      rows={3}
                    />
                  </div>
                  <Button type="submit" disabled={saving} className="w-full">
                    {saving ? "Saving..." : editingEntry ? "Update Hours" : t("logHours")}
                  </Button>
                  {editingEntry && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingEntry(null)
                        setHours("")
                        setDescription("")
                        setSelectedDate(new Date().toISOString().split("T")[0])
                      }}
                      className="w-full"
                    >
                      Cancel Edit
                    </Button>
                  )}
                </form>
              </CardContent>
            </Card>

            {/* Calendar Grid */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newMonth = new Date(currentMonth)
                        newMonth.setMonth(newMonth.getMonth() - 1)
                        setCurrentMonth(newMonth)
                      }}
                    >
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
                      {t("today")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newMonth = new Date(currentMonth)
                        newMonth.setMonth(newMonth.getMonth() + 1)
                        setCurrentMonth(newMonth)
                      }}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-0 mb-4">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div
                      key={day}
                      className="p-2 text-center font-medium text-muted-foreground bg-muted border-r border-border last:border-r-0"
                    >
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-0 border border-border">{renderCalendarGrid()}</div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Advanced Analytics View for Admins and Owners */
          (isAdmin() || isOwner()) && (
            <div className="space-y-8">
              {/* Team Selector */}
              <Card>
                <CardHeader>
                  <CardTitle>{isOwner() ? "Team Analytics Dashboard" : "Analytics Dashboard"}</CardTitle>
                  <CardDescription>Select a team to view detailed metrics and manage time entries.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={selectedTeamId === "all" ? "default" : "outline"}
                      onClick={() => setSelectedTeamId("all")}
                      className="flex items-center gap-2"
                    >
                      🏢 All Teams
                    </Button>
                    {teams.map((team) => (
                      <Button
                        key={team.id}
                        variant={selectedTeamId === team.id ? "default" : "outline"}
                        onClick={() => setSelectedTeamId(team.id)}
                        className="flex items-center gap-2"
                      >
                        👥 {team.name}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Team Metrics Cards */}
              {(() => {
                const metrics = getTeamMetrics(selectedTeamId)
                const selectedTeamName =
                  selectedTeamId === "all"
                    ? "All Teams"
                    : teams.find((t) => t.id === selectedTeamId)?.name || "Unknown Team"

                return (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{metrics.totalHours}h</div>
                        <p className="text-xs text-muted-foreground">{selectedTeamName}</p>
                      </CardContent>
                    </Card>

                    <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Members</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{metrics.activeMembers}</div>
                        <p className="text-xs text-muted-foreground">Logged hours this month</p>
                      </CardContent>
                    </Card>

                    <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Daily Hours</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{metrics.avgDailyHours.toFixed(1)}h</div>
                        <p className="text-xs text-muted-foreground">Per logged day</p>
                      </CardContent>
                    </Card>

                    <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Peak Day</CardTitle>
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{metrics.peakDay}</div>
                        <p className="text-xs text-muted-foreground">Most active day</p>
                      </CardContent>
                    </Card>
                  </div>
                )
              })()}

              {/* Pending Deletion Requests */}
              {isOwner() && pendingDeletionRequests.length > 0 && (
                <Card className="border-orange-500/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-500 dark:text-orange-400">
                      <Hourglass className="h-5 w-5" /> Pending Time Deletion Requests ({pendingDeletionRequests.length}
                      )
                    </CardTitle>
                    <CardDescription>Review requests from Admins to delete logged time entries.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {pendingDeletionRequests.map((req) => {
                      const entryUser = allUsers.find((u) => u.employeeId === req.employeeId)
                      const requestor = allUsers.find((u) => u.accountId === req.requestedByUid)
                      const originalEntry = clockinSessions.find((he) => he.id === req.sessionId)
                      return (
                        <div key={req.id} className="p-3 border border-border rounded-md bg-muted">
                          <p>
                            <strong>{entryUser?.name || "Unknown User"}</strong>'s entry of{" "}
                            <strong>{originalEntry?.hours || "N/A"}h</strong> on {originalEntry?.date || "N/A"}
                          </p>
                          <p className="text-sm text-muted-foreground">Requested by: {requestor?.name || "Unknown"}</p>
                          {req.requestReason && (
                            <p className="text-sm mt-1 italic text-muted-foreground">Reason: {req.requestReason}</p>
                          )}
                          <div className="mt-2 flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setRequestToReview(req)
                                setOwnerReviewComment(req.ownerComment || "")
                                setShowOwnerApprovalDialog(true)
                              }}
                            >
                              Review
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              )}

              {/* Hours History with Team Filtering */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    Hours History -{" "}
                    {selectedTeamId === "all"
                      ? "All Teams"
                      : teams.find((t) => t.id === selectedTeamId)?.name || "Unknown Team"}
                  </CardTitle>
                  <CardDescription>
                    {isOwner()
                      ? "Review and manage individual time entries for the selected team."
                      : "View time entries for the selected team."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(() => {
                    const filteredUsers =
                      selectedTeamId === "all" ? allUsers : allUsers.filter((u) => u.teamId === selectedTeamId)

                    return filteredUsers.map((member) => {
                      const memberEntries = clockinSessions
                        .filter((entry) => entry.employeeId === member.employeeId)
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      const totalHours = memberEntries.reduce((sum, entry) => sum + entry.hours, 0)

                      return (
                        <div key={member.employeeId} className="border border-border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div>
                                <div className="font-medium flex items-center gap-2">
                                  {member.name}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setSelectedUserForEmoji(member.employeeId)
                                      setShowEmojiPicker(true)
                                    }}
                                    className="h-6 w-6 p-0"
                                  >
                                    😊
                                  </Button>
                                </div>
                                <div className="text-sm text-muted-foreground">{member.loginEmail}</div>
                                {member.teamId && (
                                  <div className="text-xs text-blue-600 dark:text-blue-400">
                                    Team: {teams.find((t) => t.id === member.teamId)?.name || "Unknown"}
                                  </div>
                                )}
                              </div>
                            </div>
                            <Badge variant="outline" className="border-border">
                              {totalHours}h total
                            </Badge>
                          </div>
                          <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                            {memberEntries.length === 0 && (
                              <p className="text-sm text-muted-foreground">No time entries found.</p>
                            )}
                            {memberEntries.map((entry) => (
                              <div key={entry.id} className="flex items-center justify-between p-2 bg-muted rounded">
                                <div className="flex-1">
                                  <div className="text-sm font-medium">
                                    {new Date(entry.date).toLocaleDateString()} - {entry.hours}h
                                    {entry.description && (
                                      <Badge variant="secondary" className="ml-2 text-xs">
                                        Admin Note
                                      </Badge>
                                    )}
                                  </div>
                                  {entry.description && (
                                    <div className="text-xs text-muted-foreground mt-0.5">{entry.description}</div>
                                  )}
                                  {entry.description && (
                                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-0.5 italic">
                                      Note: {entry.description}
                                    </div>
                                  )}
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleOpenAdminCommentDialog(entry)}
                                    title="Add/Edit Comment"
                                    className="h-7 w-7"
                                  >
                                    <MessageSquare className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleDeleteClick(entry)}
                                    title="Delete"
                                    className="h-7 w-7 text-red-500 hover:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })
                  })()}
                </CardContent>
              </Card>
            </div>
          )
        )}
      </div>

      {/* Deletion Request Dialog */}
      <Dialog open={showDeletionRequestDialog} onOpenChange={setShowDeletionRequestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              {entryToDelete?.employeeId === user?.employeeId ? "Confirm Deletion" : "Request Time Entry Deletion"}
            </DialogTitle>
            <DialogDescription>
              {entryToDelete?.employeeId === user?.employeeId
                ? `Are you sure you want to delete your time entry of ${entryToDelete?.hours}h on ${entryToDelete?.date}? This action cannot be undone.`
                : `You are requesting to delete ${getUserName(entryToDelete?.employeeId || "")}'s time entry of ${entryToDelete?.hours}h on ${entryToDelete?.date}. Please provide a reason for the Owner.`}
            </DialogDescription>
          </DialogHeader>
          {entryToDelete?.employeeId !== user?.employeeId && (
            <div className="space-y-2 my-4">
              <Label htmlFor="deletionReason">Reason for Deletion (Required)</Label>
              <Textarea
                id="deletionReason"
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
                placeholder="e.g., Incorrect entry, duplicate..."
              />
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeletionRequestDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSubmitDeletionRequest}
              disabled={entryToDelete?.employeeId !== user?.employeeId && !deletionReason.trim()}
            >
              {entryToDelete?.employeeId === user?.employeeId ? "Delete Entry" : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin Comment Dialog */}
      <Dialog open={showAdminCommentDialog} onOpenChange={setShowAdminCommentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Add/Edit Comment for Time Entry
            </DialogTitle>
            <DialogDescription>
              Entry by {getUserName(entryToCommentOn?.employeeId || "")} for {entryToCommentOn?.hours}h on{" "}
              {entryToCommentOn?.date}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 my-4">
            <Label htmlFor="adminComment">Comment</Label>
            <Textarea
              id="adminComment"
              value={adminComment}
              onChange={(e) => setAdminComment(e.target.value)}
              placeholder="e.g., Good work, clarification needed..."
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAdminCommentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitAdminComment}>Save Comment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Owner Approval Dialog for Time Deletion Requests */}
      <Dialog open={showOwnerApprovalDialog} onOpenChange={setShowOwnerApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Hourglass className="h-5 w-5" /> Review Time Deletion Request
            </DialogTitle>
            {requestToReview && (
              <DialogDescription>
                Reviewing request to delete{" "}
                <strong>{clockinSessions.find((he) => he.id === requestToReview.sessionId)?.hours || "N/A"}h</strong> for{" "}
                <strong>{getUserName(requestToReview.employeeId)}</strong> on{" "}
                {clockinSessions.find((he) => he.id === requestToReview.sessionId)?.date || "N/A"}.
                <br />
                Requested by: {getUserName(requestToReview.requestedByUid)}.
                {requestToReview.requestReason && (
                  <p className="mt-1 italic">Reason: {requestToReview.requestReason}</p>
                )}
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="space-y-2 my-4">
            <Label htmlFor="ownerReviewComment">Owner Comment (Optional)</Label>
            <Textarea
              id="ownerReviewComment"
              value={ownerReviewComment}
              onChange={(e) => setOwnerReviewComment(e.target.value)}
              placeholder="Reason for approval/rejection..."
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowOwnerApprovalDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => requestToReview && handleReviewDeletionRequest(requestToReview, "rejected")}
            >
              Reject
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => requestToReview && handleReviewDeletionRequest(requestToReview, "approved")}
            >
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Emoji Picker Dialog */}
      <Dialog open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quick Emoji Shortcuts</DialogTitle>
            <DialogDescription>
              Send a quick emoji reaction to {selectedUserForEmoji ? getUserName(selectedUserForEmoji) : "user"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-6 gap-2 p-4">
            {[
              "👍",
              "👎",
              "❤️",
              "😂",
              "😮",
              "😢",
              "🔥",
              "💪",
              "🎉",
              "⭐",
              "✅",
              "❌",
              "🚀",
              "💡",
              "🤔",
              "👏",
              "🙌",
              "💯",
              "⚡",
              "🎯",
              "📈",
              "📉",
              "⏰",
              "☕",
            ].map((emoji) => (
              <Button
                key={emoji}
                variant="outline"
                className="text-2xl h-12 w-12 p-0"
                onClick={() => {
                  // Here you could implement sending the emoji as a notification or message
                  setMessage(`Sent ${emoji} to ${getUserName(selectedUserForEmoji || "")}`)
                  setShowEmojiPicker(false)
                  setSelectedUserForEmoji(null)
                }}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
