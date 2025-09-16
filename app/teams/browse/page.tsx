"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LogIn, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import type { Team, User } from "@/types"

export default function BrowseTeamsPage() {
  const { user, updateUser } = useAuth()
  const [teams, setTeams] = useState<Team[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [joiningTeamId, setJoiningTeamId] = useState<string | null>(null)
  const router = useRouter()

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
      const storedTeams = localStorage.getItem("teams")
      if (storedTeams) {
        setTeams(JSON.parse(storedTeams))
      }
      const storedUsers = localStorage.getItem("allUsers")
      if (storedUsers) {
        setAllUsers(JSON.parse(storedUsers))
      }
    }
  }

  const handleJoinTeam = async (teamId: string) => {
    if (!user) return
    setJoiningTeamId(teamId)
    setMessage("")

    try {
      const updatedUser = { ...user, teamId: teamId }
      await updateUser(updatedUser) // This updates context and localStorage

      // Also update the user in the 'allUsers' list in localStorage
      const currentAllUsers = localStorage.getItem("allUsers")
      if (currentAllUsers) {
        const allUsersArray = JSON.parse(currentAllUsers) as User[]
        const updatedAllUsersArray = allUsersArray.map((u) => (u.uid === user.uid ? { ...u, teamId: teamId } : u))
        localStorage.setItem("allUsers", JSON.stringify(updatedAllUsersArray))
        setAllUsers(updatedAllUsersArray) // Update local state
      }

      setMessage(`Successfully joined ${teams.find((t) => t.id === teamId)?.name || "the team"}!`)
    } catch (error) {
      setMessage("Error joining team.")
      console.error("Error joining team:", error)
    } finally {
      setJoiningTeamId(null)
    }
  }

  const getTeamMemberCount = (teamId: string) => {
    return allUsers.filter((u) => u.teamId === teamId).length
  }

  const getTeamLeadName = (leadUid: string) => {
    return allUsers.find((u) => u.uid === leadUid)?.name || "N/A"
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Browse Teams</h1>
              <p className="text-gray-600 dark:text-gray-300">Find and join teams in the organization.</p>
            </div>
            <Link href="/dashboard">
              <Button variant="outline">Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <Alert
            className={`mb-4 ${message.includes("Error") ? "border-red-500 bg-red-50 text-red-700" : "border-green-500 bg-green-50 text-green-700"}`}
          >
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teams.map((team) => (
            <Card key={team.id} className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-white">{team.name}</CardTitle>
                <CardDescription className="dark:text-gray-400">
                  Lead: {getTeamLeadName(team.leadUid)} | Members: {getTeamMemberCount(team.id)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {user?.teamId === team.id ? (
                  <div className="flex items-center text-green-600 dark:text-green-400">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    You are a member of this team.
                  </div>
                ) : (
                  <Button
                    onClick={() => handleJoinTeam(team.id)}
                    disabled={joiningTeamId === team.id}
                    className="w-full"
                  >
                    {joiningTeamId === team.id ? (
                      "Joining..."
                    ) : (
                      <>
                        <LogIn className="h-4 w-4 mr-2" />
                        Join Team
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        {teams.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400 mt-8">No teams available to join.</p>
        )}
      </div>
    </div>
  )
}
