"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ImageIcon, MessageSquare } from "lucide-react"
import type { DailyUpdate, User } from "@/types"
import { useAuth } from "@/contexts/auth-context" // Assuming useAuth provides isAdmin

const EMOJI_OPTIONS = ["👍", "🔥", "✅", "💪", "🎯", "⭐", "👏", "🚀", "💡", "🤔"]

interface UserWeeklyUpdatesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetUser: User | null
  weekId: string | null
}

export function UserWeeklyUpdatesDialog({ open, onOpenChange, targetUser, weekId }: UserWeeklyUpdatesDialogProps) {
  const { user: adminUser, isAdmin } = useAuth() // For checking admin privileges
  const [updates, setUpdates] = useState<DailyUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUpdateForComment, setSelectedUpdateForComment] = useState<DailyUpdate | null>(null)
  const [commentText, setCommentText] = useState("")

  useEffect(() => {
    if (open && targetUser && weekId) {
      loadUpdates()
    } else {
      setUpdates([]) // Clear updates when dialog is closed or props are missing
    }
  }, [open, targetUser, weekId])

  const loadUpdates = () => {
    if (!targetUser || !weekId || typeof window === "undefined") return
    setLoading(true)
    const userUpdatesKey = `dailyUpdates_${targetUser.uid}`
    const storedUpdates = localStorage.getItem(userUpdatesKey)
    if (storedUpdates) {
      const allUserUpdates = JSON.parse(storedUpdates) as DailyUpdate[]
      const weekUpdates = allUserUpdates.filter((update) => update.weekId === weekId)
      weekUpdates.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setUpdates(weekUpdates)
    } else {
      setUpdates([])
    }
    setLoading(false)
  }

  const handleEmojiReact = (updateId: string, emoji: string) => {
    if (!isAdmin || !targetUser) return

    const updatedUpdates = updates.map((update) => {
      if (update.id === updateId) {
        return { ...update, emoji: update.emoji === emoji ? undefined : emoji } // Toggle emoji
      }
      return update
    })
    setUpdates(updatedUpdates)
    saveUpdatesToLocalStorage(updatedUpdates)
  }

  const handleAddComment = (updateId: string) => {
    if (!isAdmin || !targetUser || !commentText.trim()) return

    const updatedUpdates = updates.map((update) => {
      if (update.id === updateId) {
        return { ...update, comment: commentText.trim() }
      }
      return update
    })
    setUpdates(updatedUpdates)
    saveUpdatesToLocalStorage(updatedUpdates)
    setCommentText("")
    setSelectedUpdateForComment(null)
  }

  const saveUpdatesToLocalStorage = (currentUpdates: DailyUpdate[]) => {
    if (!targetUser || typeof window === "undefined") return

    const userUpdatesKey = `dailyUpdates_${targetUser.uid}`
    const storedUserUpdates = localStorage.getItem(userUpdatesKey)
    let allUserUpdates: DailyUpdate[] = storedUserUpdates ? JSON.parse(storedUserUpdates) : []

    // Create a map of the current week's updates for easy lookup
    const weekUpdatesMap = new Map(currentUpdates.map((u) => [u.id, u]))

    // Update existing or add new ones (though in this context, we are only modifying existing)
    allUserUpdates = allUserUpdates.map((storedUpdate) => {
      if (weekUpdatesMap.has(storedUpdate.id)) {
        return weekUpdatesMap.get(storedUpdate.id)!
      }
      return storedUpdate
    })

    localStorage.setItem(userUpdatesKey, JSON.stringify(allUserUpdates))
  }

  if (!targetUser || !weekId) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="dark:text-white">
            Daily Updates for {targetUser.name} - Week {weekId}
          </DialogTitle>
          <DialogDescription className="dark:text-gray-300">
            Review and provide feedback on {targetUser.name}'s updates for this week.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-4 p-1 pr-2">
          {loading ? (
            <p className="text-center dark:text-gray-300">Loading updates...</p>
          ) : updates.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              No daily updates found for {targetUser.name} for week {weekId}.
            </p>
          ) : (
            updates.map((update) => (
              <Card key={update.id} className="overflow-hidden dark:bg-gray-700 dark:border-gray-600">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg dark:text-white">
                        <span>{new Date(update.date).toLocaleDateString("en-US", { weekday: "long" })}</span>
                        {update.emoji && <span className="text-2xl">{update.emoji}</span>}
                      </CardTitle>
                      <CardDescription className="dark:text-gray-300">
                        {new Date(update.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                        {update.location && (
                          <span className="text-xs text-gray-500 dark:text-gray-400"> - {update.location}</span>
                        )}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="dark:border-gray-500 dark:text-gray-300">
                      {new Date(update.date).toLocaleDateString()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-200">{update.text}</p>
                  {update.screenshot && (
                    <div className="border dark:border-gray-600 rounded-lg p-2 bg-gray-50 dark:bg-gray-600/50">
                      <div className="flex items-center gap-2 mb-1">
                        <ImageIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">Screenshot</span>
                      </div>
                      <img
                        src={update.screenshot || "/placeholder.svg"}
                        alt="Daily update screenshot"
                        className="max-w-full h-auto rounded border dark:border-gray-500"
                      />
                    </div>
                  )}
                  {isAdmin() && (
                    <div className="border-t dark:border-gray-600 pt-3 space-y-2">
                      <div>
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                          React:
                        </label>
                        <div className="flex flex-wrap gap-1">
                          {EMOJI_OPTIONS.map((emoji) => (
                            <Button
                              key={emoji}
                              variant={update.emoji === emoji ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleEmojiReact(update.id, emoji)}
                              className="p-2 text-lg"
                            >
                              {emoji}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                          Feedback:
                        </label>
                        {update.comment && selectedUpdateForComment?.id !== update.id ? (
                          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-md p-2 text-sm">
                            <p className="text-blue-800 dark:text-blue-200">{update.comment}</p>
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => {
                                setSelectedUpdateForComment(update)
                                setCommentText(update.comment || "")
                              }}
                              className="text-blue-600 dark:text-blue-400 p-0 h-auto text-xs"
                            >
                              Edit
                            </Button>
                          </div>
                        ) : selectedUpdateForComment?.id === update.id ? (
                          <div className="space-y-1">
                            <Textarea
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              placeholder="Constructive feedback..."
                              rows={2}
                              className="text-sm dark:bg-gray-600 dark:text-white dark:border-gray-500"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleAddComment(update.id)}>
                                Save Comment
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedUpdateForComment(null)
                                  setCommentText("")
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUpdateForComment(update)
                              setCommentText("")
                            }}
                          >
                            <MessageSquare className="h-3 w-3 mr-1.5" />
                            Add Comment
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
