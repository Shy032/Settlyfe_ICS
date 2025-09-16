"use client"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Edit, Calendar, Clock } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { useAuth } from "@/contexts/auth-context"
import type { DailyUpdate } from "@/types"

interface DailyUpdateReviewProps {
  update: DailyUpdate | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DailyUpdateReview({ update, open, onOpenChange }: DailyUpdateReviewProps) {
  const { user } = useAuth()
  const { t } = useTranslation(user?.preferredLanguage as any)

  if (!update) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 dark:bg-gray-800 dark:border-gray-700">
        {/* Header with X button */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="flex items-center gap-2">
            <X className="h-4 w-4" />
            Back to Updates
          </Button>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium dark:text-white">
              {new Date(update.date).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Content with responsive centering and padding */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-8 py-12">
            {/* Update Content */}
            <div className="space-y-8">
              {/* Screenshot - Centered and Responsive */}
              {update.screenshot && (
                <div className="flex justify-center">
                  <div className="max-w-2xl w-full">
                    <img
                      src={update.screenshot || "/placeholder.svg"}
                      alt="Daily update screenshot"
                      className="w-full h-auto rounded-lg border dark:border-gray-600 shadow-lg"
                    />
                  </div>
                </div>
              )}

              {/* Text Content - Centered */}
              <div className="prose prose-lg max-w-none dark:prose-invert">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border dark:border-gray-600">
                  <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">{update.text}</p>
                </div>
              </div>

              {/* Metadata */}
              <div className="flex flex-wrap gap-4 justify-center text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Posted: {new Date(update.createdAt).toLocaleString()}</span>
                </div>
                {update.updatedAt && update.updatedAt !== update.createdAt && (
                  <div className="flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    <span>Updated: {new Date(update.updatedAt).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Admin Feedback Section */}
              {(update.emoji || update.comment) && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">Team Feedback</h3>

                  {update.emoji && (
                    <div className="mb-4">
                      <span className="text-3xl">{update.emoji}</span>
                    </div>
                  )}

                  {update.comment && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border dark:border-gray-600">
                      <p className="text-gray-900 dark:text-gray-100">{update.comment}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Status Badges */}
              <div className="flex justify-center gap-2">
                {update.updatedAt && update.updatedAt !== update.createdAt && (
                  <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                    <Edit className="h-3 w-3 mr-1" />
                    Updated
                  </Badge>
                )}
                {update.taskId && (
                  <Badge variant="secondary" className="dark:bg-gray-700 dark:text-gray-300">
                    Task Related
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
