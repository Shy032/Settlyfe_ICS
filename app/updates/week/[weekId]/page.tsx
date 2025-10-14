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
import { SupabaseService } from "@/lib/supabase"
import type { DailyUpdate, Employee } from "@/types"

const EMOJI_OPTIONS = ["👍", "🔥", "✅", "💪", "🎯", "⭐", "👏", "🚀"]

export default function WeeklyUpdatesPage() {
  const { employee, account, isAdmin } = useAuth()
  const [updates, setUpdates] = useState<DailyUpdate[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUpdate, setSelectedUpdate] = useState<DailyUpdate | null>(null)
  const [comment, setComment] = useState("")
  const router = useRouter()
  const params = useParams()
  const weekId = params.weekId as string

  useEffect(() => {
    if (!employee || !account) {
      router.push("/login")
      return
    }

    loadData()
  }, [employee, account, router, weekId])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load all employees to get names
      const { data: employeesData, error: employeesError } = await SupabaseService.getEmployees()
      if (employeesError) throw new Error('Failed to load employees')
      if (employeesData) setEmployees(employeesData)

      // Load daily updates for the week
      const { data: updatesData, error: updatesError } = await SupabaseService.getDailyUpdates()
      if (updatesError) throw new Error('Failed to load updates')
      
      if (updatesData) {
        // Filter updates for the specific week and sort by date
        const weekDate = new Date()
        weekDate.setDate(weekDate.getDate() - (parseInt(weekId) * 7))
        const weekStart = new Date(weekDate.setDate(weekDate.getDate() - weekDate.getDay()))
        const weekEnd = new Date(weekDate.setDate(weekDate.getDate() + 6))
        
        const weekUpdates = updatesData.filter(update => {
          const updateDate = new Date(update.date)
          return updateDate >= weekStart && updateDate <= weekEnd
        })
        
        weekUpdates.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        setUpdates(weekUpdates)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getUserName = (employeeId: string) => {
    const employee = employees.find((e) => e.id === employeeId)
    return employee ? `${employee.first_name} ${employee.last_name}` : "Unknown Employee"
  }

  const handleEmojiReact = async (updateId: string, emoji: string) => {
    if (!isAdmin()) return

    try {
      // Update the daily update with new emoji reaction
      const { error } = await SupabaseService.updateDailyUpdate(updateId, { 
        emoji_reaction: emoji 
      })

      if (error) throw error

      // Update local state
      setUpdates(updates.map(update => 
        update.id === updateId 
          ? { ...update, emoji_reaction: emoji }
          : update
      ))
    } catch (error) {
      console.error('Error updating emoji reaction:', error)
    }
  }

  const handleAddComment = async (updateId: string) => {
    if (!isAdmin() || !comment.trim() || !employee) return

    try {
      // Update the daily update with new comment
      const { error } = await SupabaseService.updateDailyUpdate(updateId, {
        admin_comment: comment.trim(),
        admin_id: employee.id
      })

      if (error) throw error

      // Update local state
      setUpdates(updates.map(update => 
        update.id === updateId 
          ? { ...update, admin_comment: comment.trim(), admin_id: employee.id }
          : update
      ))

      setComment("")
      setSelectedUpdate(null)
    } catch (error) {
      console.error('Error updating comment:', error)
    }
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
                        <span>{getUserName(update.employee_id)}</span>
                        {update.emoji_reaction && <span className="text-2xl">{update.emoji_reaction}</span>}
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
                    <p className="whitespace-pre-wrap text-gray-700">{update.description}</p>
                  </div>

                  {/* Screenshot */}
                  {update.screenshot_path && (
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center gap-2 mb-2">
                        <ImageIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Screenshot attached</span>
                      </div>
                      <img
                        src={update.screenshot_path || "/placeholder.svg"}
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
                              variant={update.emoji_reaction === emoji ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleEmojiReact(update.id, emoji)}
                            >
                              {emoji}
                            </Button>
                          ))}
                          {update.emoji_reaction && (
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
                        {update.admin_comment ? (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm text-blue-800">
                              <strong>Your feedback:</strong> {update.admin_comment}
                            </p>
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => {
                                setSelectedUpdate(update)
                                setComment(update.admin_comment || "")
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
