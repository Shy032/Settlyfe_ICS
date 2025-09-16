"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Calendar, Archive, Eye, Bell, Clock, Upload, X, ImageIcon } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import type { Notice } from "@/types"

interface EventsAnnouncementsProps {
  className?: string
}

const PRIORITY_COLORS = {
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
}

export function EventsAnnouncements({ className }: EventsAnnouncementsProps) {
  const { user, isAdmin, isOwner } = useAuth()
  const [notices, setNotices] = useState<Notice[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  // Form states
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium")
  const [scheduledFor, setScheduledFor] = useState("")
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([])

  useEffect(() => {
    loadNotices()
  }, [])

  const loadNotices = () => {
    if (typeof window !== "undefined") {
      const storedNotices = localStorage.getItem("notices")
      if (storedNotices) {
        const noticesData = JSON.parse(storedNotices) as Notice[]
        // Show only non-archived notices, sorted by creation date
        const activeNotices = noticesData
          .filter((notice) => !notice.isArchived)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setNotices(activeNotices)
      }
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const imageFiles = files.filter((file) => file.type.startsWith("image/"))

    if (imageFiles.length > 0) {
      setSelectedImages((prev) => [...prev, ...imageFiles])

      // Create preview URLs
      imageFiles.forEach((file) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          setImagePreviewUrls((prev) => [...prev, e.target?.result as string])
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index))
    setImagePreviewUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) {
      setMessage("Please fill in all required fields")
      return
    }

    setLoading(true)
    setMessage("")

    try {
      // Convert images to base64 for storage
      const imageData: string[] = []
      for (const file of selectedImages) {
        const reader = new FileReader()
        const base64 = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        })
        imageData.push(base64)
      }

      const newNotice: Notice = {
        id: `notice_${Date.now()}`,
        title,
        description,
        createdBy: user?.uid || "",
        createdAt: new Date().toISOString(),
        scheduledFor: scheduledFor || undefined,
        isArchived: false,
        readBy: [],
        priority,
        images: imageData, // Add images to notice
      }

      const existingNotices = localStorage.getItem("notices")
      const noticesArray: Notice[] = existingNotices ? JSON.parse(existingNotices) : []
      noticesArray.push(newNotice)
      localStorage.setItem("notices", JSON.stringify(noticesArray))

      setMessage("Notice created successfully!")
      loadNotices()

      // Reset form
      setTitle("")
      setDescription("")
      setPriority("medium")
      setScheduledFor("")
      setSelectedImages([])
      setImagePreviewUrls([])
      setIsCreating(false)
    } catch (error) {
      setMessage("Error creating notice")
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = (noticeId: string) => {
    if (!user) return

    const storedNotices = localStorage.getItem("notices")
    if (storedNotices) {
      const noticesArray = JSON.parse(storedNotices) as Notice[]
      const updatedNotices = noticesArray.map((notice) => {
        if (notice.id === noticeId && !notice.readBy.includes(user.uid)) {
          return { ...notice, readBy: [...notice.readBy, user.uid] }
        }
        return notice
      })
      localStorage.setItem("notices", JSON.stringify(updatedNotices))
      loadNotices()
    }
  }

  const handleArchiveNotice = (noticeId: string) => {
    if (!isAdmin() && !isOwner()) return

    const storedNotices = localStorage.getItem("notices")
    if (storedNotices) {
      const noticesArray = JSON.parse(storedNotices) as Notice[]
      const updatedNotices = noticesArray.map((notice) =>
        notice.id === noticeId ? { ...notice, isArchived: true } : notice,
      )
      localStorage.setItem("notices", JSON.stringify(updatedNotices))
      loadNotices()
    }
  }

  const isRead = (notice: Notice) => {
    return notice.readBy.includes(user?.uid || "")
  }

  const getCreatorName = (uid: string) => {
    // In a real app, you'd fetch this from your user database
    return uid === "admin_settlyfe_com" ? "Admin User" : "Leadership"
  }

  // Check if user can create notices (admin or owner)
  const canCreateNotices = isAdmin() || isOwner()

  return (
    <Card className={`${className} events-card`}>
      <CardHeader className="pb-3 sm:pb-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
              Events & Announcements
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Important updates and notices from leadership
            </CardDescription>
          </div>
          {canCreateNotices && (
            <Button onClick={() => setIsCreating(true)} size="sm" className="create-button mobile-button">
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Create Notice</span>
              <span className="sm:hidden">Create</span>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        {notices.length === 0 ? (
          <div className="text-center py-6 sm:py-8 text-gray-500 dark:text-gray-400">
            <Bell className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-gray-300 dark:text-gray-600" />
            <p className="text-sm sm:text-base">No announcements at this time</p>
            {canCreateNotices && (
              <p className="text-xs sm:text-sm mt-2">Click "Create Notice" to add an announcement</p>
            )}
          </div>
        ) : (
          notices.map((notice) => (
            <div
              key={notice.id}
              className={`p-3 sm:p-4 border rounded-lg ${
                isRead(notice)
                  ? "bg-gray-50 dark:bg-gray-800/50"
                  : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-medium text-sm sm:text-base">{notice.title}</h4>
                  <Badge className={`${PRIORITY_COLORS[notice.priority]} mobile-badge`}>{notice.priority}</Badge>
                  {!isRead(notice) && (
                    <Badge variant="destructive" className="text-xs mobile-badge">
                      New
                    </Badge>
                  )}
                </div>
                <div className="flex gap-1 flex-wrap">
                  {!isRead(notice) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkAsRead(notice.id)}
                      className="text-xs px-2 py-1"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">Mark Read</span>
                      <span className="sm:hidden">Read</span>
                    </Button>
                  )}
                  {canCreateNotices && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleArchiveNotice(notice.id)}
                      className="text-xs px-2 py-1"
                    >
                      <Archive className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">Archive</span>
                      <span className="sm:hidden">Archive</span>
                    </Button>
                  )}
                </div>
              </div>

              <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-3">{notice.description}</p>

              {/* Display images if any */}
              {notice.images && notice.images.length > 0 && (
                <div className="mb-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {notice.images.map((image, index) => (
                      <img
                        key={index}
                        src={image || "/placeholder.svg"}
                        alt={`Notice image ${index + 1}`}
                        className="w-full h-24 sm:h-32 object-cover rounded-lg border"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                  <span>By {getCreatorName(notice.createdBy)}</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(notice.createdAt).toLocaleDateString()}
                  </span>
                  {notice.scheduledFor && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Scheduled: {new Date(notice.scheduledFor).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <span className="text-xs">{notice.readBy.length} read</span>
              </div>
            </div>
          ))
        )}
      </CardContent>

      {/* Create Notice Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Create New Notice</DialogTitle>
            <DialogDescription className="text-sm">Share important information with the team</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateNotice} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm">
                Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter notice title"
                required
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter detailed description"
                rows={4}
                required
                className="text-sm"
              />
            </div>

            {/* Image Upload Section */}
            <div className="space-y-2">
              <Label className="text-sm">Images (Optional)</Label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                <div className="text-center">
                  <ImageIcon className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Upload images for your announcement
                  </p>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <Label htmlFor="image-upload" className="cursor-pointer">
                    <Button type="button" variant="outline" size="sm" asChild>
                      <span className="text-xs sm:text-sm">
                        <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                        Choose Images
                      </span>
                    </Button>
                  </Label>
                </div>
              </div>

              {/* Image Previews */}
              {imagePreviewUrls.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                  {imagePreviewUrls.map((url, index) => (
                    <div key={index} className="relative">
                      <img
                        src={url || "/placeholder.svg"}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-20 sm:h-24 object-cover rounded border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-5 w-5 sm:h-6 sm:w-6 p-0"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-2 w-2 sm:h-3 sm:w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority" className="text-sm">
                  Priority
                </Label>
                <Select value={priority} onValueChange={(value: "low" | "medium" | "high") => setPriority(value)}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduledFor" className="text-sm">
                  Schedule For (Optional)
                </Label>
                <Input
                  id="scheduledFor"
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>

            {message && (
              <Alert
                className={
                  message.includes("Error")
                    ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
                    : "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                }
              >
                <AlertDescription
                  className={`text-xs sm:text-sm ${
                    message.includes("Error") ? "text-red-800 dark:text-red-300" : "text-green-800 dark:text-green-300"
                  }`}
                >
                  {message}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button type="submit" disabled={loading} className="flex-1 text-sm">
                {loading ? "Creating..." : "Create Notice"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsCreating(false)} className="text-sm">
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
