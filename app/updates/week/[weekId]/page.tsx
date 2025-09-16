"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Calendar, MessageSquare, ImageIcon, ArrowLeft } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import type { DailyUpdate, User } from "@/types"

const EMOJI_OPTIONS = ["👍", "🔥", "✅", "💪", "🎯", "⭐", "👏", "🚀"]

export default function WeeklyUpdatesPage() {
  const { user, isAdmin } = useAuth()
  const [updates, setUpdates] = useState<DailyUpdate[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUpdate, setSelectedUpdate] = useState<DailyUpdate | null>(null)
  const [comment, setComment] = useState("")
  const router = useRouter()
  const params = useParams()
  const weekId = params.weekId as string

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    loadData()
    setLoading(false)
  }, [user, router, weekId])

  const loadData = () => {
    if (typeof window !== "undefined") {
      // Load all users to get names
      const storedUsers = localStorage.getItem("allUsers")
      if (storedUsers) {
        setUsers(JSON.parse(storedUsers))
      }

      // Load daily updates for the week
      const allUpdates: DailyUpdate[] = []

      // Get updates from all users for this week
      const storedUsersData = localStorage.getItem("allUsers")
      if (storedUsersData) {
        const usersData = JSON.parse(storedUsersData) as User[]

        usersData.forEach((userData) => {
          const userUpdates = localStorage.getItem(`dailyUpdates_${userData.uid}`)
          if (userUpdates) {
            const updatesData = JSON.parse(userUpdates) as DailyUpdate[]
            const weekUpdates = updatesData.filter((update) => update.weekId === weekId)
            allUpdates.push(...weekUpdates)
          }
        })
      }

      // Sort by date
      allUpdates.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setUpdates(allUpdates)
    }
  }

  const getUserName = (uid: string) => {
    return users.find((u) => u.uid === uid)?.name || "Unknown User"
  }

  const handleEmojiReact = (updateId: string, emoji: string) => {
    if (!isAdmin()) return

    const updatedUpdates = updates.map((update) => {
      if (update.id === updateId) {
        return { ...update, emoji }
      }
      return update
    })

    setUpdates(updatedUpdates)

    // Update in localStorage for the specific user
    const update = updates.find((u) => u.id === updateId)
    if (update) {
      const userUpdates = localStorage.getItem(`dailyUpdates_${update.uid}`)
      if (userUpdates) {
        const updatesData = JSON.parse(userUpdates) as DailyUpdate[]
        const updatedUserUpdates = updatesData.map((u) => (u.id === updateId ? { ...u, emoji } : u))
        localStorage.setItem(`dailyUpdates_${update.uid}`, JSON.stringify(updatedUserUpdates))
      }
    }
  }

  const handleAddComment = (updateId: string) => {
    if (!isAdmin() || !comment.trim()) return

    const updatedUpdates = updates.map((update) => {
      if (update.id === updateId) {
        return { ...update, comment: comment.trim() }
      }
      return update
    })

    setUpdates(updatedUpdates)

    // Update in localStorage for the specific user
    const update = updates.find((u) => u.id === updateId)
    if (update) {
      const userUpdates = localStorage.getItem(`dailyUpdates_${update.uid}`)
      if (userUpdates) {
        const updatesData = JSON.parse(userUpdates) as DailyUpdate[]
        const updatedUserUpdates = updatesData.map((u) => (u.id === updateId ? { ...u, comment: comment.trim() } : u))
        localStorage.setItem(`dailyUpdates_${update.uid}`, JSON.stringify(updatedUserUpdates))
      }
    }

    setComment("")
    setSelectedUpdate(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading weekly updates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Week {weekId} - Daily Updates</h1>
                <p className="text-gray-600 dark:text-gray-300">Review team progress and provide feedback</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {updates.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Updates Found</h3>
              <p className="text-gray-600">No daily updates were posted for week {weekId}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {updates.map((update) => (
              <Card key={update.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <span>{getUserName(update.uid)}</span>
                        {update.emoji && <span className="text-2xl">{update.emoji}</span>}
                      </CardTitle>
                      <CardDescription>
                        {new Date(update.date).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">{new Date(update.date).toLocaleDateString()}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Update Text */}
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap text-gray-700">{update.text}</p>
                  </div>

                  {/* Screenshot */}
                  {update.screenshot && (
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center gap-2 mb-2">
                        <ImageIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Screenshot attached</span>
                      </div>
                      <img
                        src={update.screenshot || "/placeholder.svg"}
                        alt="Daily update screenshot"
                        className="max-w-full h-auto rounded border"
                      />
                    </div>
                  )}

                  {/* Admin Actions */}
                  {isAdmin() && (
                    <div className="border-t pt-4 space-y-3">
                      {/* Emoji Reactions */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">React with emoji:</label>
                        <div className="flex gap-2">
                          {EMOJI_OPTIONS.map((emoji) => (
                            <Button
                              key={emoji}
                              variant={update.emoji === emoji ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleEmojiReact(update.id, emoji)}
                            >
                              {emoji}
                            </Button>
                          ))}
                          {update.emoji && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEmojiReact(update.id, "")}
                              className="text-red-600"
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Comments */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Leave feedback:</label>
                        {update.comment ? (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm text-blue-800">
                              <strong>Your feedback:</strong> {update.comment}
                            </p>
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => {
                                setSelectedUpdate(update)
                                setComment(update.comment || "")
                              }}
                              className="text-blue-600 p-0 h-auto"
                            >
                              Edit
                            </Button>
                          </div>
                        ) : selectedUpdate?.id === update.id ? (
                          <div className="space-y-2">
                            <Textarea
                              value={comment}
                              onChange={(e) => setComment(e.target.value)}
                              placeholder="Leave constructive feedback..."
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleAddComment(update.id)}>
                                Add Comment
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedUpdate(null)
                                  setComment("")
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
                              setSelectedUpdate(update)
                              setComment("")
                            }}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Add Comment
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
