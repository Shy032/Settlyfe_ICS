"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, ImageIcon, Video, MapPin, Eye, EyeOff } from "lucide-react"
import type { Moment, User } from "@/types"

interface CreateMomentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onMomentCreated: (moment: Moment) => void
  user: User
}

export function CreateMomentDialog({ open, onOpenChange, onMomentCreated, user }: CreateMomentDialogProps) {
  const [text, setText] = useState("")
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [currentTag, setCurrentTag] = useState("")
  const [location, setLocation] = useState("")
  const [visibility, setVisibility] = useState<"everyone" | "team-only">("everyone")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setMediaFile(file)
      setMediaPreview(URL.createObjectURL(file))
      setMediaType(file.type.startsWith("image") ? "image" : "video")
    }
  }

  const handleAddTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()])
      setCurrentTag("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleSubmit = () => {
    if (!text.trim() && !mediaPreview) {
      return // Need either text or media
    }

    const newMoment: Moment = {
      id: `moment_${Date.now()}`,
      userId: user.uid,
      userName: user.name,
      userEmail: user.email,
      text: text.trim() || undefined,
      mediaUrl: mediaPreview || undefined,
      mediaType: mediaType || undefined,
      tags,
      location: location.trim() || undefined,
      visibility,
      teamId: user.teamId,
      createdAt: new Date().toISOString(),
      likes: [],
      comments: [],
    }

    onMomentCreated(newMoment)

    // Reset form
    setText("")
    setMediaFile(null)
    setMediaPreview(null)
    setMediaType(null)
    setTags([])
    setCurrentTag("")
    setLocation("")
    setVisibility("everyone")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a new Moment</DialogTitle>
          <DialogDescription>Share what's on your mind with your network.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Textarea placeholder="What's happening?" value={text} onChange={(e) => setText(e.target.value)} rows={4} />

          {mediaPreview && (
            <div className="relative">
              {mediaType === "image" ? (
                <img
                  src={mediaPreview || "/placeholder.svg"}
                  alt="Preview"
                  className="rounded-lg max-h-60 w-full object-cover"
                />
              ) : (
                <video src={mediaPreview} controls className="rounded-lg max-h-60 w-full" />
              )}
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6"
                onClick={() => {
                  setMediaFile(null)
                  setMediaPreview(null)
                  setMediaType(null)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Label htmlFor="media-upload">
                <ImageIcon className="h-4 w-4 mr-2" /> Image
              </Label>
            </Button>
            <Button asChild variant="outline">
              <Label htmlFor="media-upload">
                <Video className="h-4 w-4 mr-2" /> Video
              </Label>
            </Button>
            <Input
              id="media-upload"
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div>
            <Label>Visibility</Label>
            <Select value={visibility} onValueChange={(value: "everyone" | "team-only") => setVisibility(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Everyone - Public to all users
                  </div>
                </SelectItem>
                <SelectItem value="team-only">
                  <div className="flex items-center gap-2">
                    <EyeOff className="h-4 w-4" />
                    Team Only - Visible to team members
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag..."
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
              />
              <Button onClick={handleAddTag}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  #{tag}
                  <button onClick={() => handleRemoveTag(tag)} className="ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label>Location</Label>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="e.g., San Francisco, CA"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>
        </div>
        <Button onClick={handleSubmit} className="w-full" disabled={!text.trim() && !mediaPreview}>
          Post Moment
        </Button>
      </DialogContent>
    </Dialog>
  )
}
