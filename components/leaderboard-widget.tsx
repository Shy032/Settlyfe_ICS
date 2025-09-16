"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trophy, TrendingUp, Award, Flame, Crown, Medal, Star } from "lucide-react"
import type { User, ScoreData } from "@/types"

interface LeaderboardEntry {
  user: User
  currentQS: number
  wcsStreak: number
  checkMarks: number
  totalScore: number
  rank: number
}

interface LeaderboardWidgetProps {
  currentUser?: User
}

export function LeaderboardWidget({ currentUser }: LeaderboardWidgetProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [viewMode, setViewMode] = useState<"qs" | "streak" | "checkmarks">("qs")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLeaderboardData()
  }, [])

  const loadLeaderboardData = () => {
    if (typeof window === "undefined") return

    try {
      const storedUsers = localStorage.getItem("allUsers")
      if (!storedUsers) return

      const users = JSON.parse(storedUsers) as User[]
      const entries: LeaderboardEntry[] = []

      users.forEach((user) => {
        const userScores = localStorage.getItem(`scores_${user.uid}`)
        if (userScores) {
          const scores = JSON.parse(userScores) as ScoreData[]

          // Calculate current QS (average of recent scores)
          const recentScores = scores.slice(0, 12)
          const currentQS =
            recentScores.length > 0 ? recentScores.reduce((sum, score) => sum + score.WCS, 0) / recentScores.length : 0

          // Calculate WCS streak (consecutive weeks with WCS >= 0.8)
          let wcsStreak = 0
          for (const score of scores) {
            if (score.WCS >= 0.8) {
              wcsStreak++
            } else {
              break
            }
          }

          // Count check marks
          const checkMarks = scores.filter((score) => score.checkMark).length

          // Calculate total score for overall ranking
          const totalScore = currentQS * 100 + wcsStreak * 10 + checkMarks * 5

          entries.push({
            user,
            currentQS,
            wcsStreak,
            checkMarks,
            totalScore,
            rank: 0, // Will be set after sorting
          })
        }
      })

      // Sort and assign ranks
      entries.sort((a, b) => b.totalScore - a.totalScore)
      entries.forEach((entry, index) => {
        entry.rank = index + 1
      })

      setLeaderboard(entries)
    } catch (error) {
      console.error("Error loading leaderboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getSortedLeaderboard = () => {
    const sorted = [...leaderboard]
    switch (viewMode) {
      case "qs":
        return sorted.sort((a, b) => b.currentQS - a.currentQS)
      case "streak":
        return sorted.sort((a, b) => b.wcsStreak - a.wcsStreak)
      case "checkmarks":
        return sorted.sort((a, b) => b.checkMarks - a.checkMarks)
      default:
        return sorted
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />
      default:
        return <span className="text-sm font-bold text-gray-500 dark:text-gray-400">#{rank}</span>
    }
  }

  const getStreakBadge = (streak: number) => {
    if (streak >= 10) return { color: "bg-red-500", icon: <Flame className="h-3 w-3" />, text: "🔥 Hot Streak!" }
    if (streak >= 5) return { color: "bg-orange-500", icon: <TrendingUp className="h-3 w-3" />, text: "On Fire!" }
    if (streak >= 3) return { color: "bg-blue-500", icon: <Star className="h-3 w-3" />, text: "Good Run" }
    return null
  }

  const getCurrentUserRank = () => {
    if (!currentUser) return null
    const userEntry = leaderboard.find((entry) => entry.user.uid === currentUser.uid)
    return userEntry?.rank || null
  }

  if (loading) {
    return (
      <Card className="dark:bg-gray-800 dark:border-gray-700 neon:bg-card neon:border-primary">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const sortedLeaderboard = getSortedLeaderboard().slice(0, 10)
  const currentUserRank = getCurrentUserRank()

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700 neon:bg-card neon:border-primary">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2 dark:text-white neon:text-primary">
              <Trophy className="h-5 w-5" />
              Leaderboard
            </CardTitle>
            <CardDescription className="dark:text-gray-300 neon:text-muted-foreground">
              Top performers this period
              {currentUserRank && (
                <span className="ml-2 text-blue-600 dark:text-blue-400 font-medium">You're #{currentUserRank}</span>
              )}
            </CardDescription>
          </div>
        </div>
        <div className="flex gap-1">
          <Button variant={viewMode === "qs" ? "default" : "outline"} size="sm" onClick={() => setViewMode("qs")}>
            QS Score
          </Button>
          <Button
            variant={viewMode === "streak" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("streak")}
          >
            Streak
          </Button>
          <Button
            variant={viewMode === "checkmarks" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("checkmarks")}
          >
            Check Marks
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedLeaderboard.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 neon:text-muted-foreground">
            No data available yet
          </div>
        ) : (
          sortedLeaderboard.map((entry, index) => {
            const displayRank = index + 1
            const streakBadge = getStreakBadge(entry.wcsStreak)
            const isCurrentUser = currentUser?.uid === entry.user.uid

            return (
              <div
                key={entry.user.uid}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  isCurrentUser
                    ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                    : "hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <div className="flex items-center justify-center w-8">{getRankIcon(displayRank)}</div>

                <Avatar className="h-8 w-8">
                  <AvatarImage src={entry.user.profilePhoto || "/placeholder.svg"} />
                  <AvatarFallback className="text-xs">{entry.user.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm dark:text-white neon:text-foreground truncate">
                      {entry.user.name || entry.user.email}
                    </span>
                    {isCurrentUser && (
                      <Badge variant="secondary" className="text-xs">
                        You
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{entry.user.displayTitle || entry.user.role}</span>
                    {streakBadge && (
                      <Badge className={`${streakBadge.color} text-white text-xs`}>
                        {streakBadge.icon}
                        <span className="ml-1">{streakBadge.text}</span>
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  {viewMode === "qs" && (
                    <div className="font-bold text-lg dark:text-white neon:text-primary">
                      {entry.currentQS.toFixed(2)}
                    </div>
                  )}
                  {viewMode === "streak" && (
                    <div className="font-bold text-lg dark:text-white neon:text-primary">{entry.wcsStreak}</div>
                  )}
                  {viewMode === "checkmarks" && (
                    <div className="font-bold text-lg dark:text-white neon:text-primary">{entry.checkMarks}</div>
                  )}
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {viewMode === "qs" && "QS"}
                    {viewMode === "streak" && "weeks"}
                    {viewMode === "checkmarks" && "marks"}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
