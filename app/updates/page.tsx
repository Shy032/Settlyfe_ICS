"use client"

import type React from "react"
import { DailyUpdate, Task } from "@/types"
import { SupabaseService } from "@/lib/supabase"
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

const EMOJI_OPTIONS = ["👍", "🔥", "✅", "💪", "🎯", "⭐", "👏", "🚀"]

export default function UpdatesPage() {
  const { account, employee, isAdmin } = useAuth()
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
    if (!account || !employee) {
      router.push("/login")
      return
    }

    const init = async () => {
      try {
        await loadData()
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [account, employee, router])

  const loadData = async () => {
    try {
      // Load user's daily updates
      if (employee?.id) {
        const { data: updatesData, error: updatesError } = await SupabaseService.getDailyUpdates(employee.id)
        if (updatesError) {
          console.error('Error loading updates:', updatesError)
        } else if (updatesData) {
          setUpdates(updatesData)
        }
      }

      // Load tasks
      const { data: tasksData, error: tasksError } = await SupabaseService.getTasks(
        employee?.id,
        account?.access_level
      )
      if (tasksError) {
        console.error('Error loading tasks:', tasksError)
      } else if (tasksData) {
        const userTasks = tasksData.filter(task => task.published)
        setTasks(userTasks)
      }
    } catch (error) {
      console.error('Error in loadData:', error)
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
    if (!text.trim() || !employee?.id) {
      setMessage("Please enter your daily update")
      return
    }

    setSaving(true)
    setMessage("")

    try {
      // TODO: Implement file upload to Supabase storage
      let screenshotUrl = ""
      if (selectedFile) {
        // File upload to Supabase Storage will be implemented here
        screenshotUrl = previewUrl || ""
      }

      const updateData = {
        employee_id: employee.id,
        date: today,
        description: text,
        task_id: selectedTaskId || undefined,
        location: location.trim() || undefined,
        screenshot_path: screenshotUrl || undefined
      }

      // Check if update for today already exists
      const { data: existingUpdates } = await SupabaseService.getDailyUpdates(employee.id, 1)
      const todayUpdate = existingUpdates?.find(u => u.date === today)

      let result
      if (todayUpdate) {
        result = await SupabaseService.updateDailyUpdate(todayUpdate.id, updateData)
      } else {
        result = await SupabaseService.createDailyUpdate(updateData)
      }

      if (result.error) {
        throw result.error
      }

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

                          <Button size="sm" variant="ghost" onClick={() => handleReviewUpdate(update)}>
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3">{update.description}</p>
                      {update.location && (
                        <div className="mt-2 flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{update.location}</span>
                        </div>
                      )}
                      {update.screenshot_path && (
                        <div className="mt-2">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}

                      {update.updated_at && update.updated_at !== update.created_at && (
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
                    <p className="text-sm whitespace-pre-wrap">{selectedUpdate.description}</p>
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

                {selectedUpdate.screenshot_path && (
                  <div>
                    <Label>Screenshot</Label>
                    <div className="mt-1">
                      <img
                        src={selectedUpdate.screenshot_path || "/placeholder.svg"}
                        alt="Daily update screenshot"
                        className="max-w-full h-auto rounded border"
                      />
                    </div>
                  </div>
                )}

                {selectedUpdate.task_id && (
                  <div>
                    <Label>Related Task</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {tasks.find((t) => t.id === selectedUpdate.task_id)?.title || "Unknown task"}
                    </p>
                  </div>
                )}

                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Posted: {new Date(selectedUpdate.created_at).toLocaleString()}</span>
                  {selectedUpdate.updated_at && selectedUpdate.updated_at !== selectedUpdate.created_at && (
                    <span>Updated: {new Date(selectedUpdate.updated_at).toLocaleString()}</span>
                  )}
                </div>




              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
