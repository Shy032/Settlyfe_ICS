"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TimerIcon, Coffee, Users, User } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useTranslation } from "@/lib/i18n"
import { SupabaseService } from "@/lib/supabase"
import type { ClockinSession } from "@/types"

interface OnlineUser {
  uid: string
  name: string
  profilePhoto?: string
  lastSeen: string
  isOnline: boolean
}

interface TimerProps {
  className?: string
}

export function Timer({ className }: TimerProps) {
  const { user } = useAuth()
  const { t } = useTranslation(user?.preferredLanguage as any)
  const [isRunning, setIsRunning] = useState(false)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [showStopDialog, setShowStopDialog] = useState(false)
  const [showFocusReminder, setShowFocusReminder] = useState(false)
  const [description, setDescription] = useState("")
  const [message, setMessage] = useState("")
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [showOnlineUsers, setShowOnlineUsers] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const presenceRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isRunning && startTime) {
      intervalRef.current = setInterval(() => {
        const now = new Date()
        const elapsed = now.getTime() - startTime.getTime()
        setElapsedTime(elapsed)

        // Show focus reminder after 4 hours (14400000 ms)
        if (elapsed >= 14400000 && !showFocusReminder) {
          setShowFocusReminder(true)
        }
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, startTime, showFocusReminder])

  // Online presence system
  useEffect(() => {
    if (!user) return

    const updatePresence = () => {
      const now = new Date().toISOString()

      // Update current user's presence
      const currentPresence = {
        uid: user.accountId,
        name: user.name,
        profilePhoto: user.profilePhoto,
        lastSeen: now,
        isOnline: true,
      }

      // Get existing presence data
      const storedPresence = localStorage.getItem("userPresence")
      const presenceData: { [key: string]: OnlineUser } = storedPresence ? JSON.parse(storedPresence) : {}

      // Update current user
      presenceData[user.accountId] = currentPresence

      // Mark users as offline if they haven't been seen in 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      Object.keys(presenceData).forEach((uid) => {
        if (presenceData[uid].lastSeen < fiveMinutesAgo) {
          presenceData[uid].isOnline = false
        }
      })

      localStorage.setItem("userPresence", JSON.stringify(presenceData))

      // Update online users list
      const onlineList = Object.values(presenceData)
        .filter((u) => u.isOnline && u.uid !== user.accountId)
        .sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime())

      setOnlineUsers(onlineList)
    }

    // Update presence immediately
    updatePresence()

    // Update presence every 30 seconds
    presenceRef.current = setInterval(updatePresence, 30000)

    return () => {
      if (presenceRef.current) {
        clearInterval(presenceRef.current)
      }

      // Mark user as offline when component unmounts
      const storedPresence = localStorage.getItem("userPresence")
      if (storedPresence) {
        const presenceData = JSON.parse(storedPresence)
        if (presenceData[user.accountId]) {
          presenceData[user.accountId].isOnline = false
          localStorage.setItem("userPresence", JSON.stringify(presenceData))
        }
      }
    }
  }, [user])

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  const formatOnlineTime = (lastSeen: string) => {
    const now = new Date()
    const seenTime = new Date(lastSeen)
    const diffMinutes = Math.floor((now.getTime() - seenTime.getTime()) / (1000 * 60))

    if (diffMinutes < 1) return "Just now"
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    const diffHours = Math.floor(diffMinutes / 60)
    return `${diffHours}h ago`
  }

  const handleStart = () => {
    setStartTime(new Date())
    setIsRunning(true)
    setElapsedTime(0)
    setShowFocusReminder(false)
  }

  const handleStop = () => {
    setIsRunning(false)
    setShowStopDialog(true)
  }

  const handleSaveTime = async () => {
    if (!user || !startTime) return

    try {
      const endTime = new Date()
      const hours = elapsedTime / (1000 * 60 * 60)
      const today = new Date().toISOString().split("T")[0]

      // Ensure minimum hours (database constraint requires hours > 0)
      const validHours = Math.max(0.01, Number.parseFloat(hours.toFixed(2)))

      // Create timer session data (let database auto-generate UUID)
      const sessionData = {
        employee_id: user.employeeId,
        date: today,
        start_time: startTime.toTimeString().split(' ')[0], // "09:00:00"
        end_time: endTime.toTimeString().split(' ')[0],     // "10:30:00"
        duration: `${Math.floor(elapsedTime / 1000 / 3600).toString().padStart(2, '0')}:${Math.floor((elapsedTime / 1000 % 3600) / 60).toString().padStart(2, '0')}:${Math.floor(elapsedTime / 1000 % 60).toString().padStart(2, '0')}`, // "01:30:00"
        hours: validHours,
        description: description.trim() || "Timer session",
      }

      // Save to database - UUID auto-generated!
      setTimeout(async () => {
        try {
          console.log("Saving timer session:", sessionData)
          
          const { data, error } = await SupabaseService.createClockinSession(sessionData)
          
          if (error) {
            console.error("Failed to save timer session:", error)
          } else {
            console.log("Timer session saved successfully:", data)
          }
        } catch (err) {
          console.error("Timer save error:", err)
        }
      }, 100)

      setMessage(`${t("timeRecorded")}: ${formatTime(elapsedTime)}`)
      setShowStopDialog(false)
      setDescription("")
      setElapsedTime(0)
      setStartTime(null)

      // Show daily update reminder after a short delay
      setTimeout(() => {
        setMessage(`${t("timeRecorded")}. ${t("writeUpdate")}?`)
      }, 2000)
    } catch (error) {
      setMessage("Error saving time")
      console.error("Error:", error)
    }
  }

  const getTimerButtonClass = (isStop: boolean) => {
    const theme = user?.theme || "light"
    const baseClass =
      "w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full text-sm sm:text-base lg:text-lg font-semibold transition-all"

    if (isStop) {
      return `${baseClass} timer-stop-${theme}`
    } else {
      return `${baseClass} timer-start-${theme}`
    }
  }

  return (
    <>
      <Card className={`${className} relative timer-card`}>
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <TimerIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                {t("timer")}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Track your focused work sessions</CardDescription>
            </div>

            {/* Who's Online - Top Right Corner */}
            <div className="flex flex-col items-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowOnlineUsers(!showOnlineUsers)}
                className="flex items-center gap-1 sm:gap-2 text-xs px-2 py-1"
              >
                <div className="flex -space-x-1">
                  {onlineUsers.slice(0, 3).map((onlineUser) => (
                    <Avatar
                      key={onlineUser.uid}
                      className="h-4 w-4 sm:h-6 sm:w-6 border-2 border-white dark:border-gray-800"
                    >
                      <AvatarImage src={onlineUser.profilePhoto || "/placeholder.svg"} />
                      <AvatarFallback className="text-xs">
                        <User className="h-2 w-2 sm:h-3 sm:w-3" />
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs">{onlineUsers.length} online</span>
                </div>
              </Button>

              {/* Online Users Dropdown */}
              {showOnlineUsers && (
                <Card className="absolute top-12 right-0 w-56 sm:w-64 z-10 shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Who's Online ({onlineUsers.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="max-h-48">
                      {onlineUsers.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">No one else is online right now</div>
                      ) : (
                        <div className="space-y-1 p-2">
                          {onlineUsers.map((onlineUser) => (
                            <div
                              key={onlineUser.uid}
                              className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                              onClick={() => window.open(`/profile/${onlineUser.uid}`, "_blank")}
                            >
                              <div className="relative">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={onlineUser.profilePhoto || "/placeholder.svg"} />
                                  <AvatarFallback>
                                    <User className="h-4 w-4" />
                                  </AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{onlineUser.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatOnlineTime(onlineUser.lastSeen)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          {/* Timer Display */}
          <div className="text-center">
            <div className="text-3xl sm:text-4xl lg:text-6xl font-mono font-bold mobile-timer-display">
              {formatTime(elapsedTime)}
            </div>
          </div>

          {/* Start/Stop Button - No Icons, Theme Colors */}
          <div className="flex justify-center">
            <Button onClick={isRunning ? handleStop : handleStart} className={getTimerButtonClass(isRunning)}>
              {isRunning ? t("stop") : t("start")}
            </Button>
          </div>

          {/* Status */}
          {isRunning && (
            <div className="text-center text-xs sm:text-sm text-muted-foreground">
              Session started at {startTime?.toLocaleTimeString()}
            </div>
          )}

          {message && (
            <Alert>
              <AlertDescription className="text-xs sm:text-sm">{message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Stop Timer Dialog */}
      <Dialog open={showStopDialog} onOpenChange={setShowStopDialog}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">{t("timeRecorded")}</DialogTitle>
            <DialogDescription className="text-sm">Session duration: {formatTime(elapsedTime)}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm">
                {t("description")} (Optional)
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("whatWorkedOn")}
                rows={3}
                className="text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveTime} className="flex-1 text-sm">
                Save to Calendar
              </Button>
              <Button variant="outline" onClick={() => setShowStopDialog(false)} className="flex-1 text-sm">
                {t("cancel")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Focus Reminder Dialog */}
      <Dialog open={showFocusReminder} onOpenChange={setShowFocusReminder}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Coffee className="h-4 w-4 sm:h-5 sm:w-5" />
              Take a Break!
            </DialogTitle>
            <DialogDescription className="text-sm">{t("focusReminder")}</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button onClick={() => setShowFocusReminder(false)} className="flex-1 text-sm">
              Thanks for the reminder!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
