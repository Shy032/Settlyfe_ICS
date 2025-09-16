"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { calcEC, calcOC, calcWCS } from "@/lib/calculations"
import type { ScoreData } from "@/types"

interface EditScoreDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  score: ScoreData | null
  userId: string
  onScoreUpdate: (updatedScore: ScoreData) => void
}

export function EditScoreDialog({ open, onOpenChange, score, userId, onScoreUpdate }: EditScoreDialogProps) {
  const [hours, setHours] = useState("")
  const [krScore, setKrScore] = useState("")
  const [ccValue, setCcValue] = useState("")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (score) {
      // Try to load actual working hours from user's time tracking data
      const actualHours = getWeeklyHoursForWeek(userId, score.weekId)
      if (actualHours > 0) {
        setHours(actualHours.toString())
      } else {
        // Fallback: reverse calculate hours from EC
        const calculatedHours = score.EC * 40 // Assuming EC is hours/40
        setHours(calculatedHours.toString())
      }
      setKrScore(score.OC.toString())
      setCcValue(score.CC.toString())
    }
  }, [score, userId])

  // Function to get actual weekly hours from user's time tracking data
  const getWeeklyHoursForWeek = (uid: string, weekId: string): number => {
    try {
      const userEntries = localStorage.getItem(`hourEntries_${uid}`)
      if (!userEntries) return 0

      const entries = JSON.parse(userEntries)
      
      // Parse week ID (e.g., "2025-W01" -> year 2025, week 1)
      const weekMatch = weekId.match(/(\d{4})-W(\d{2})/)
      if (!weekMatch) return 0
      
      const year = parseInt(weekMatch[1])
      const week = parseInt(weekMatch[2])
      
      // Calculate week start and end dates
      const weekStart = getDateOfWeek(year, week)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      weekEnd.setHours(23, 59, 59, 999)
      
      // Sum hours for this week
      const weeklyTotal = entries
        .filter((entry: any) => {
          const entryDate = new Date(entry.date)
          return entryDate >= weekStart && entryDate <= weekEnd
        })
        .reduce((total: number, entry: any) => total + (entry.hours || 0), 0)
      
      return Number.parseFloat(weeklyTotal.toFixed(1))
    } catch (error) {
      console.error("Error calculating weekly hours:", error)
      return 0
    }
  }

  // Helper function to get the start date of a specific week
  const getDateOfWeek = (year: number, week: number): Date => {
    const jan1 = new Date(year, 0, 1)
    const dayOfWeek = jan1.getDay()
    const daysToAdd = (week - 1) * 7 - dayOfWeek + 1
    const weekStart = new Date(year, 0, 1 + daysToAdd)
    weekStart.setHours(0, 0, 0, 0)
    return weekStart
  }

  const handleSave = async () => {
    if (!score || !userId) return

    setSaving(true)
    setMessage("")

    try {
      const hoursNum = Number.parseFloat(hours) || 0
      const krScoreNum = Number.parseFloat(krScore) || 0
      const ccNum = Number.parseFloat(ccValue) || 0

      const EC = calcEC(hoursNum)
      const OC = calcOC([{ score: krScoreNum, weight: 1 }])
      const CC = Math.max(0, Math.min(1, ccNum))
      const WCS = calcWCS(EC, OC, CC)
      const checkMark = hoursNum >= 20 && OC === 1

      const updatedScore: ScoreData = {
        ...score,
        EC,
        OC,
        CC,
        WCS,
        checkMark,
      }

      // Update localStorage
      const existingScores = localStorage.getItem(`scores_${userId}`)
      const scoresArray: ScoreData[] = existingScores ? JSON.parse(existingScores) : []

      const scoreIndex = scoresArray.findIndex((s) => s.weekId === score.weekId)
      if (scoreIndex >= 0) {
        scoresArray[scoreIndex] = updatedScore
        localStorage.setItem(`scores_${userId}`, JSON.stringify(scoresArray))

        onScoreUpdate(updatedScore)
        onOpenChange(false)
        setMessage("Score updated successfully!")
      }
    } catch (error) {
      setMessage("Error updating score")
      console.error("Error:", error)
    } finally {
      setSaving(false)
    }
  }

  if (!score) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Score for Week {score.weekId}</DialogTitle>
          <DialogDescription>Modify the score components. WCS will be automatically recalculated.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-hours">Hours Worked</Label>
            <Input
              id="edit-hours"
              type="number"
              step="0.1"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="e.g. 40"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-kr">KR Score (0-1)</Label>
            <Input
              id="edit-kr"
              type="number"
              step="0.1"
              min="0"
              max="1"
              value={krScore}
              onChange={(e) => setKrScore(e.target.value)}
              placeholder="e.g. 0.8"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-cc">Collab Credit (0-1)</Label>
            <Input
              id="edit-cc"
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={ccValue}
              onChange={(e) => setCcValue(e.target.value)}
              placeholder="e.g. 0.8"
            />
          </div>

          {message && (
            <Alert className={message.includes("Error") ? "border-red-300 bg-red-50" : "border-green-300 bg-green-50"}>
              <AlertDescription className={message.includes("Error") ? "text-red-700" : "text-green-700"}>
                {message}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
