"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar, Upload, ImageIcon, MessageSquare, Eye, Edit, MapPin } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import type { DailyUpdate, Task } from "@/types"

const EMOJI_OPTIONS = ["👍", "🔥", "✅", "💪", "🎯", "⭐", "👏", "🚀"]

export default function UpdatesPage() {
  const { user, isAdmin } = useAuth()
  const [updates, setUpdates] = useState<DailyUpdate[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [selectedUpdate, setSelectedUpdate] = useState<DailyUpdate | null>(null)
  const [isReviewing, setIsReviewing] = useState(false)
  const router = useRouter()

  // Form states
  const [text, setText] = useState("")
  const [selectedTaskId, setSelectedTaskId] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [location, setLocation] = useState("")

  const today = new Date().toISOString().split("T")[0]

  // Calculate week ID from date
  const getWeekId = (date: string) => {
    const d = new Date(date)
    const year = d.getFullYear()
    const start = new Date(year, 0, 1)
    const days = Math.floor((d.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
    const week = Math.ceil((days + start.getDay() + 1) / 7)
    return `${year}-W${week.toString().padStart(2, "0")}`
  }

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    loadData()
    setLoading(false)
  }, [user, router])

  const loadData = () => {
    if (typeof window !== "undefined") {
      // Load user's daily updates
      const storedUpdates = localStorage.getItem(`dailyUpdates_${user?.uid}`)
      if (storedUpdates) {
        const updatesData = JSON.parse(storedUpdates) as DailyUpdate[]
        updatesData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        setUpdates(updatesData)
      }

      // Load tasks assigned to user - filter based on team visibility
      const storedTasks = localStorage.getItem("tasks")
      if (storedTasks) {
        const tasksData = JSON.parse(storedTasks) as Task[]
        const userTasks = tasksData.filter((task) => {
          if (!task.published) return false

          // If task is for everyone, show it
          if (task.visibility === "everyone") return true

          // If task is team-only, check if user is in same team or assigned
          if (task.visibility === "team-only") {
            return task.teamId === user?.teamId || task.ownerUids.includes(user?.uid || "")
          }

          return false
        })
        setTasks(userTasks)
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleSubmitUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) {
      setMessage("Please enter your daily update")
      return
    }

    setSaving(true)
    setMessage("")

    try {
      // Simulate file upload to storage
      let screenshotUrl = ""
      if (selectedFile) {
        // In a real app, this would upload to Firebase Storage
        screenshotUrl = previewUrl || ""
      }

      const weekId = getWeekId(today)

      const newUpdate: DailyUpdate = {
        id: `update_${user?.uid}_${today}`,
        uid: user?.uid || "",
        date: today,
        weekId,
        text,
        screenshot: screenshotUrl,
        taskId: selectedTaskId || undefined,
        location: location.trim() || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Get existing updates
      const existingUpdates = localStorage.getItem(`dailyUpdates_${user?.uid}`)
      const updatesArray: DailyUpdate[] = existingUpdates ? JSON.parse(existingUpdates) : []

      // Check if update for today already exists
      const existingIndex = updatesArray.findIndex((u) => u.date === today)
      if (existingIndex >= 0) {
        updatesArray[existingIndex] = {
          ...updatesArray[existingIndex],
          ...newUpdate,
          updatedAt: new Date().toISOString(),
        }
      } else {
        updatesArray.push(newUpdate)
      }

      localStorage.setItem(`dailyUpdates_${user?.uid}`, JSON.stringify(updatesArray))

      setMessage("Daily update posted successfully!")
      loadData()

      // Reset form
      setText("")
      setSelectedTaskId("")
      setSelectedFile(null)
      setPreviewUrl(null)
      setLocation("")
    } catch (error) {
      setMessage("Error posting update")
      console.error("Error:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleReviewUpdate = (update: DailyUpdate) => {
    setSelectedUpdate(update)
    setIsReviewing(true)
  }

  const todayUpdate = updates.find((u) => u.date === today)

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading daily updates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Daily Updates</h1>
              <p className="text-muted-foreground">Share your daily progress and achievements</p>
            </div>
            <div className="flex gap-2">
              <Link href="/board">
                <Button variant="outline">Task Board</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Daily Update Form */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Today's Update ({new Date().toLocaleDateString()})
              </CardTitle>
              <CardDescription>
                {todayUpdate ? "Update your daily progress" : "Share what you accomplished today"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="text">What did you work on today?</Label>
                  <Textarea
                    id="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Describe your progress, achievements, blockers, and next steps..."
                    rows={6}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taskId">Related Task (Optional)</Label>
                  <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a task" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No specific task</SelectItem>
                      {tasks.map((task) => (
                        <SelectItem key={task.id} value={task.id}>
                          {task.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location (Optional)</Label>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g., Home Office, San Francisco, Client Site"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="screenshot">Screenshot (Optional)</Label>
                  <div className="flex items-center gap-4">
                    <input
                      id="screenshot"
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("screenshot")?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Screenshot
                    </Button>
                    {selectedFile && <span className="text-sm text-muted-foreground">{selectedFile.name}</span>}
                  </div>
                  {previewUrl && (
                    <div className="mt-2">
                      <img
                        src={previewUrl || "/placeholder.svg"}
                        alt="Preview"
                        className="max-w-xs rounded-lg border"
                      />
                    </div>
                  )}
                </div>

                {message && (
                  <Alert
                    className={message.includes("Error") ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}
                  >
                    <AlertDescription className={message.includes("Error") ? "text-red-800" : "text-green-800"}>
                      {message}
                    </AlertDescription>
                  </Alert>
                )}

                <Button type="submit" disabled={saving} className="w-full">
                  {saving ? "Posting..." : todayUpdate ? "Update Today's Post" : "Post Daily Update"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Recent Updates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Recent Updates
              </CardTitle>
              <CardDescription>Your last 7 daily updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {updates.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No updates yet</p>
                ) : (
                  updates.slice(0, 7).map((update) => (
                    <div key={update.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium">{new Date(update.date).toLocaleDateString()}</span>
                        <div className="flex items-center gap-1">
                          {update.emoji && <span className="text-lg">{update.emoji}</span>}
                          <Button size="sm" variant="ghost" onClick={() => handleReviewUpdate(update)}>
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3">{update.text}</p>
                      {update.location && (
                        <div className="mt-2 flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{update.location}</span>
                        </div>
                      )}
                      {update.screenshot && (
                        <div className="mt-2">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      {update.comment && (
                        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950 rounded text-xs">
                          <strong>Feedback:</strong> {update.comment}
                        </div>
                      )}
                      {update.updatedAt && update.updatedAt !== update.createdAt && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          <Edit className="h-3 w-3 mr-1" />
                          Updated
                        </Badge>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Review Update Dialog */}
      <Dialog open={isReviewing} onOpenChange={setIsReviewing}>
        <DialogContent className="max-w-2xl">
          {selectedUpdate && (
            <>
              <DialogHeader>
                <DialogTitle>Daily Update Review</DialogTitle>
                <DialogDescription>
                  {new Date(selectedUpdate.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Update Content</Label>
                  <div className="mt-1 p-3 bg-muted rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{selectedUpdate.text}</p>
                  </div>
                </div>

                {selectedUpdate.location && (
                  <div>
                    <Label>Location</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{selectedUpdate.location}</span>
                    </div>
                  </div>
                )}

                {selectedUpdate.screenshot && (
                  <div>
                    <Label>Screenshot</Label>
                    <div className="mt-1">
                      <img
                        src={selectedUpdate.screenshot || "/placeholder.svg"}
                        alt="Daily update screenshot"
                        className="max-w-full h-auto rounded border"
                      />
                    </div>
                  </div>
                )}

                {selectedUpdate.taskId && (
                  <div>
                    <Label>Related Task</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {tasks.find((t) => t.id === selectedUpdate.taskId)?.title || "Unknown task"}
                    </p>
                  </div>
                )}

                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Posted: {new Date(selectedUpdate.createdAt).toLocaleString()}</span>
                  {selectedUpdate.updatedAt && selectedUpdate.updatedAt !== selectedUpdate.createdAt && (
                    <span>Updated: {new Date(selectedUpdate.updatedAt).toLocaleString()}</span>
                  )}
                </div>

                {selectedUpdate.emoji && (
                  <div>
                    <Label>Admin Reaction</Label>
                    <div className="mt-1">
                      <span className="text-2xl">{selectedUpdate.emoji}</span>
                    </div>
                  </div>
                )}

                {selectedUpdate.comment && (
                  <div>
                    <Label>Admin Feedback</Label>
                    <div className="mt-1 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-200">{selectedUpdate.comment}</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
