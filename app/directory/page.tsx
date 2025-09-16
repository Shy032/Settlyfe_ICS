"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import type { User, Team } from "@/types"

export default function MemberDirectoryPage() {
  const { user } = useAuth()
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
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
      const storedUsers = localStorage.getItem("allUsers")
      if (storedUsers) {
        setAllUsers(JSON.parse(storedUsers))
      }
      const storedTeams = localStorage.getItem("teams")
      if (storedTeams) {
        setTeams(JSON.parse(storedTeams))
      }
    }
  }

  const getTeamName = (teamId?: string) => {
    if (!teamId) return "No Team"
    return teams.find((t) => t.id === teamId)?.name || "Unknown Team"
  }

  const filteredUsers = allUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.loginEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.title && u.title.toLowerCase().includes(searchTerm.toLowerCase())),
  )

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
          <div className="flex flex-col sm:flex-row justify-between items-center py-4 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Member Directory</h1>
              <p className="text-gray-600 dark:text-gray-300">Find and connect with team members.</p>
            </div>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="search"
                placeholder="Search members..."
                className="pl-10 w-full sm:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredUsers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredUsers.map((member) => (
              <Card key={member.accountId} className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="pt-6 flex flex-col items-center text-center">
                  <Avatar className="h-20 w-20 mb-4">
                    <AvatarImage
                      src={member.profilePhoto || `https://avatar.vercel.sh/${member.loginEmail}.png`}
                      alt={member.name}
                    />
                    <AvatarFallback>{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <h3 className="text-lg font-semibold dark:text-white">{member.name}</h3>
                  {member.title && (
                    <p className="text-sm text-blue-600 dark:text-blue-400">{member.title}</p>
                  )}
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{member.loginEmail}</p>
                  <div className="mt-2 space-x-1">
                    <Badge variant="secondary" className="dark:bg-gray-700 dark:text-gray-300">
                      {member.accessLevel}
                    </Badge>
                    <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                      {getTeamName(member.teamId)}
                    </Badge>
                  </div>
                  <Button asChild variant="link" className="mt-4">
                    <Link href={`/profile/${member.accountId}`}>View Profile</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400 mt-8">No members found matching your search.</p>
        )}
      </div>
    </div>
  )
}
