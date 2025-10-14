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
  const { account, employee, ensureValidSession } = useAuth()
  const { t } = useTranslation(employee?.preferred_language as any)
  const [isRunning, setIsRunning] = useState(false)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [showStopDialog, setShowStopDialog] = useState(false)
  const [showFocusReminder, setShowFocusReminder] = useState(false)
  const [description, setDescription] = useState("")
  const [message, setMessage] = useState("")
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [showOnlineUsers, setShowOnlineUsers] = useState(false)
  const [saving, setSaving] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const presenceRef = useRef<NodeJS.Timeout | null>(null)

  // Timer persistence key
  const TIMER_STORAGE_KEY = `timer_state_${employee?.id || 'unknown'}`

  // Load timer state from localStorage on mount
  useEffect(() => {
    if (!employee) return
    
    const savedState = localStorage.getItem(TIMER_STORAGE_KEY)
    if (savedState) {
      try {
        const { isRunning: savedIsRunning, startTime: savedStartTime, description: savedDescription } = JSON.parse(savedState)
        if (savedIsRunning && savedStartTime) {
          const startDate = new Date(savedStartTime)
          const now = new Date()
          const elapsed = now.getTime() - startDate.getTime()
          
          // Only restore if the timer was started less than 12 hours ago
          if (elapsed < 12 * 60 * 60 * 1000) {
            setIsRunning(true)
            setStartTime(startDate)
            setElapsedTime(elapsed)
            setDescription(savedDescription || "")
            setMessage("Timer session restored from previous session")
            
            // Clear the message after 3 seconds
            setTimeout(() => setMessage(""), 3000)
          } else {
            // Clear old timer data if it's too old
            localStorage.removeItem(TIMER_STORAGE_KEY)
          }
        }
      } catch (error) {
        console.error('Error loading saved timer state:', error)
        localStorage.removeItem(TIMER_STORAGE_KEY)
      }
    }
  }, [employee, TIMER_STORAGE_KEY])

  // Save timer state to localStorage whenever it changes
  useEffect(() => {
    if (!employee) return
    
    const timerState = {
      isRunning,
      startTime: startTime?.toISOString(),
      description
    }
    
    if (isRunning && startTime) {
      localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timerState))
    } else {
      localStorage.removeItem(TIMER_STORAGE_KEY)
    }
  }, [isRunning, startTime, description, employee, TIMER_STORAGE_KEY])

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
    if (!account || !employee) return

    const updatePresence = () => {
      const now = new Date().toISOString()

      // Update current user's presence
      const currentPresence = {
        uid: account.id,
        name: `${employee.first_name} ${employee.last_name}`,
        profilePhoto: employee.profile_photo,
        lastSeen: now,
        isOnline: true,
      }

      // Get existing presence data
      const storedPresence = localStorage.getItem("userPresence")
      const presenceData: { [key: string]: OnlineUser } = storedPresence ? JSON.parse(storedPresence) : {}

      // Update current user
      presenceData[account.id] = currentPresence

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
        .filter((u) => u.isOnline && u.uid !== account.id)
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
        if (presenceData[account.id]) {
          presenceData[account.id].isOnline = false
          localStorage.setItem("userPresence", JSON.stringify(presenceData))
        }
      }
    }
  }, [account, employee])

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

  const handleCancelTimer = () => {
    setIsRunning(false)
    setStartTime(null)
    setElapsedTime(0)
    setDescription("")
    setShowStopDialog(false)
    localStorage.removeItem(TIMER_STORAGE_KEY)
    setMessage("Timer cancelled")
    
    // Clear the message after 2 seconds
    setTimeout(() => setMessage(""), 2000)
  }

  const handleSaveTime = async () => {
    if (!account || !employee || !startTime) return
    if (saving) return // Prevent multiple simultaneous save attempts

    setSaving(true)
    
    try {
      console.log("Starting timer save process...")
      
      const endTime = new Date()
      const hours = elapsedTime / (1000 * 60 * 60)
      const today = new Date().toISOString().split("T")[0]

      // Ensure minimum hours (database constraint requires hours > 0)
      const validHours = Math.max(0.01, Number.parseFloat(hours.toFixed(2)))

      // Create timer session data (let database auto-generate UUID)
      const sessionData = {
        employee_id: employee.id,
        date: today,
        start_time: startTime.toTimeString().split(' ')[0], // "09:00:00"
        end_time: endTime.toTimeString().split(' ')[0],     // "10:30:00"
        duration: `${Math.floor(elapsedTime / 1000 / 3600).toString().padStart(2, '0')}:${Math.floor((elapsedTime / 1000 % 3600) / 60).toString().padStart(2, '0')}:${Math.floor(elapsedTime / 1000 % 60).toString().padStart(2, '0')}`, // "01:30:00"
        hours: validHours,
        description: description.trim() || "Timer session",
      }

      console.log("Saving timer session:", sessionData)
      
      // Function to save with timeout and session refresh
      const saveWithTimeoutAndRefresh = async (retryCount = 0): Promise<any> => {
        console.log(`Save attempt ${retryCount + 1}...`)
        
        try {
          const { supabase } = await import('@/lib/supabase')
          
          // Create a timeout promise that rejects after 5 seconds
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
              console.log("Save operation timed out after 5 seconds")
              reject(new Error('Operation timed out - likely session expired'))
            }, 5000)
          })
          
          // Create the save promise
          const savePromise = supabase
            .from('clockin_session')
            .insert([sessionData])
            .select()
          
          // Race the save against the timeout
          const result = await Promise.race([savePromise, timeoutPromise])
          
          console.log("Save completed successfully:", result)
          return result
          
        } catch (error: any) {
          console.log("Save failed or timed out:", error.message)
          
          // If it's a timeout or auth error and we haven't retried too many times
          if (retryCount < 2 && (error.message.includes('timeout') || error.message.includes('JWT') || error.message.includes('auth'))) {
            console.log("Attempting to refresh session and retry...")
            setMessage(`Connection issue, refreshing session... (attempt ${retryCount + 2})`)
            
            try {
              // Force refresh the session
              const { supabase } = await import('@/lib/supabase')
              const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
              
              if (refreshError) {
                console.error("Session refresh failed:", refreshError)
                throw new Error("Session refresh failed")
              }
              
              console.log("Session refreshed successfully, retrying save...")
              
              // Wait a moment for the session to stabilize
              await new Promise(resolve => setTimeout(resolve, 1000))
              
              // Retry the save
              return await saveWithTimeoutAndRefresh(retryCount + 1)
              
            } catch (refreshError) {
              console.error("Failed to refresh session:", refreshError)
              throw new Error("Failed to refresh session")
            }
          } else {
            // Max retries reached or different error
            throw error
          }
        }
      }
      
      // Execute the save with timeout and retry logic
      try {
        const { data, error } = await saveWithTimeoutAndRefresh()
        
        if (error) {
          console.error("Failed to save timer session:", error)
          setMessage("Error saving time session - please try again")
          setSaving(false)
          return
        }
        
        console.log("Timer session saved successfully:", data)
      } catch (saveError: any) {
        console.error("All save attempts failed:", saveError)
        setMessage("Failed to save after multiple attempts. Please refresh the page and try again.")
        setSaving(false)
        return
      }
      
      // Clear persisted timer state since we're saving
      localStorage.removeItem(TIMER_STORAGE_KEY)
      
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
      console.error("Unexpected error in save process:", error)
      setMessage("Error saving time - please try again")
    } finally {
      setSaving(false)
    }
  }

  const getTimerButtonClass = (isStop: boolean) => {
    const theme = employee?.theme || "light"
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
        <Dialog open={showStopDialog} onOpenChange={() => {}}>
          <DialogContent className="w-[95vw] max-w-md [&>button]:hidden">
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
                <Button 
                  onClick={handleSaveTime} 
                  disabled={saving}
                  className="flex-1 text-sm"
                >
                  {saving ? "Saving..." : "Save to Calendar"}
                </Button>
                <Button 
                  variant="outline" 
                  disabled={saving}
                  onClick={() => {
                    setShowStopDialog(false)
                    setIsRunning(true)
                  }} 
                  className="flex-1 text-sm"
                >
                  Continue Timer
                </Button>
              </div>
              <div className="flex gap-2 mt-2">
                <Button 
                  variant="destructive" 
                  disabled={saving}
                  onClick={handleCancelTimer} 
                  className="flex-1 text-sm"
                >
                  Discard Timer
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
