"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Users, Search, Building, Newspaper } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import type { User, Team, DailyUpdate } from "@/types"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { EmojiShortcuts } from "@/components/emoji-shortcuts"
import { toast } from "sonner"

// A simplified dialog for members to view teammate updates
function TeammateUpdatesDialog({
  open,
  onOpenChange,
  teammate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  teammate: User | null
}) {
  const [updates, setUpdates] = useState<DailyUpdate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (open && teammate) {
      setLoading(true)
      const userUpdatesKey = `dailyUpdates_${teammate.uid}`
      const storedUpdates = localStorage.getItem(userUpdatesKey)
      if (storedUpdates) {
        const allUserUpdates = JSON.parse(storedUpdates) as DailyUpdate[]
        // Sort by date descending and limit to recent updates
        allUserUpdates.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        setUpdates(allUserUpdates.slice(0, 30)) // Show last 30 updates
      } else {
        setUpdates([])
      }
      setLoading(false)
    } else {
      setUpdates([])
    }
  }, [open, teammate])

  if (!teammate) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="dark:text-white">Daily Updates for {teammate.name}</DialogTitle>
          <DialogDescription className="dark:text-gray-300">
            A log of recent updates from your teammate.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-3 p-1 pr-2">
          {loading ? (
            <p>Loading...</p>
          ) : updates.length > 0 ? (
            updates.map((update) => (
              <Card key={update.id} className="dark:bg-gray-700 dark:border-gray-600">
                <CardHeader>
                  <CardTitle className="text-base dark:text-white">
                    {new Date(update.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm dark:text-gray-200">{update.text}</p>
                  {update.screenshot && (
                    <img
                      src={update.screenshot || "/placeholder.svg"}
                      alt="Update screenshot"
                      className="mt-2 rounded-md border dark:border-gray-500 max-w-full h-auto"
                    />
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-6">No daily updates found.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function TeamDirectoryPage() {
  const { user: currentUser, isAdmin, isOwner } = useAuth()
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const [viewingTeammate, setViewingTeammate] = useState<User | null>(null)

  useEffect(() => {
    if (!currentUser) {
      router.push("/login")
      return
    }
    // Only set default filter for members, not admins
    if (currentUser.role === "member" && currentUser.teamId) {
      setSelectedTeamFilter(currentUser.teamId)
    }
    loadData()
  }, [currentUser, router])

  const loadData = () => {
    setLoading(true)
    if (typeof window !== "undefined") {
      const storedUsers = localStorage.getItem("allUsers")
      if (storedUsers) {
        setAllUsers(JSON.parse(storedUsers))
      } else {
        // Initialize with sample users if none exist for demonstration
        const sampleUsers: User[] = [
          {
            uid: "admin_settlyfe_com",
            email: "admin@settlyfe.com",
            name: "Admin User",
            role: "admin",
            teamId: "settlyfe",
            createdAt: new Date().toISOString(),
          },
          {
            uid: "user01_settlyfe_com",
            email: "user01@settlyfe.com",
            name: "John Doe",
            role: "member",
            teamId: "settlyfe",
            createdAt: new Date().toISOString(),
          },
        ]
        setAllUsers(sampleUsers)
        localStorage.setItem("allUsers", JSON.stringify(sampleUsers))
      }

      const storedTeams = localStorage.getItem("teams")
      if (storedTeams) {
        setTeams(JSON.parse(storedTeams))
      } else {
        // Initialize with Settlyfe team if none exist
        const defaultTeams: Team[] = [
          { id: "settlyfe", name: "Settlyfe", leadUid: "admin_settlyfe_com", createdAt: new Date().toISOString() },
        ]
        setTeams(defaultTeams)
        localStorage.setItem("teams", JSON.stringify(defaultTeams))
      }
    }
    setLoading(false)
  }

  const getTeamName = (teamId?: string) => {
    if (!teamId) return "No Team"
    return teams.find((t) => t.id === teamId)?.name || "Unknown Team"
  }

  const getTeamLeadName = (teamId?: string) => {
    const team = teams.find((t) => t.id === teamId)
    if (!team || !team.leadUid) return "N/A"
    const lead = allUsers.find((u) => u.uid === team.leadUid)
    return lead?.name || "N/A"
  }

  const filteredUsers = useMemo(() => {
    let usersToFilter = allUsers
    // For members only, filter to their own team. Admins and owners see all users.
    if (currentUser?.role === "member" && currentUser.teamId) {
      usersToFilter = allUsers.filter((u) => u.teamId === currentUser.teamId)
    }

    return usersToFilter.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.displayTitle && u.displayTitle.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesTeam =
        isAdmin() || isOwner()
          ? selectedTeamFilter === "all" || u.teamId === selectedTeamFilter
          : currentUser?.role === "member"
            ? u.teamId === currentUser.teamId
            : true
      return matchesSearch && matchesTeam
    })
  }, [allUsers, searchTerm, selectedTeamFilter, currentUser, isAdmin, isOwner])

  const usersByTeam = useMemo(() => {
    const grouped: Record<string, User[]> = {}
    filteredUsers.forEach((u) => {
      const teamId = u.teamId || "noteam"
      if (!grouped[teamId]) {
        grouped[teamId] = []
      }
      grouped[teamId].push(u)
    })
    return grouped
  }, [filteredUsers])

  const sortedTeamIds = useMemo(() => {
    // Prioritize current user's team, then sort by team name, then "No Team"
    const teamNames: Record<string, string> = {}
    teams.forEach((team) => {
      teamNames[team.id] = team.name
    })

    return Object.keys(usersByTeam).sort((a, b) => {
      if (a === currentUser?.teamId) return -1
      if (b === currentUser?.teamId) return 1
      if (a === "noteam") return 1
      if (b === "noteam") return -1
      return (teamNames[a] || "Unknown Team").localeCompare(teamNames[b] || "Unknown Team")
    })
  }, [usersByTeam, currentUser?.teamId, teams])

  const handleEmojiSent = (emoji: string, targetUserId: string) => {
    const targetUser = allUsers.find((u) => u.uid === targetUserId)
    if (targetUser) {
      toast(`Sent ${emoji} reaction to ${targetUser.name}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="ml-2">Loading team directory...</p>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-background text-foreground">
        <header className="bg-card shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <Users className="h-7 w-7 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold">
                    {currentUser?.role === "member" ? "My Team" : "Team Directory"}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {currentUser?.role === "member"
                      ? "View your teammates and their updates."
                      : "Browse and manage members across all teams."}
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
                <div className="relative w-full sm:w-auto select-none">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search members..."
                    className="pl-10 w-full sm:w-56"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                {(isAdmin() || isOwner()) && (
                  <Select value={selectedTeamFilter} onValueChange={setSelectedTeamFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Filter by team" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Teams</SelectItem>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="noteam">No Team</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {sortedTeamIds.length > 0 ? (
            <Accordion
              type="multiple"
              defaultValue={currentUser?.teamId ? [currentUser.teamId, "noteam"] : ["noteam"]}
              className="w-full space-y-4"
            >
              {sortedTeamIds.map((teamId) => {
                const team = teams.find((t) => t.id === teamId)
                const teamName = teamId === "noteam" ? "Not Assigned to a Team" : team?.name || "Unknown Team"
                const teamMembers = usersByTeam[teamId]
                const isCurrentUserTeam = teamId === currentUser?.teamId

                return (
                  <AccordionItem key={teamId} value={teamId} className="bg-card border rounded-lg">
                    <AccordionTrigger
                      className={`px-6 py-4 hover:no-underline ${isCurrentUserTeam ? "bg-primary/10" : ""}`}
                    >
                      <div className="flex items-center gap-3">
                        <Building className="h-5 w-5 text-muted-foreground" />
                        <span className="font-semibold text-lg">{teamName}</span>
                        <Badge variant={isCurrentUserTeam ? "default" : "secondary"}>
                          {teamMembers.length} member(s)
                        </Badge>
                        {teamId !== "noteam" && team && (
                          <span className="text-sm text-muted-foreground ml-2">Lead: {getTeamLeadName(teamId)}</span>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-2 sm:px-6 py-4 border-t">
                      {teamMembers.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {teamMembers.map((member) => (
                            <Card key={member.uid} className="overflow-hidden">
                              <CardContent className="pt-6 flex flex-col items-center text-center">
                                <Avatar className="h-16 w-16 mb-3">
                                  <AvatarImage
                                    src={member.profilePhoto || `https://avatar.vercel.sh/${member.email}.png?size=64`}
                                    alt={member.name}
                                  />
                                  <AvatarFallback>{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <h3 className="text-md font-semibold truncate w-full" title={member.name}>
                                  {member.name}
                                </h3>
                                {member.displayTitle && (
                                  <p className="text-xs text-primary truncate w-full" title={member.displayTitle}>
                                    {member.displayTitle}
                                  </p>
                                )}
                                <p
                                  className="text-xs text-muted-foreground truncate w-full mt-0.5"
                                  title={member.email}
                                >
                                  {member.email}
                                </p>
                                <div className="mt-2 space-x-1">
                                  <Badge variant="outline" className="text-xs">
                                    {member.role}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                  Joined: {new Date(member.createdAt).toLocaleDateString()}
                                </p>
                                <div className="mt-3 flex items-center gap-2">
                                  <Button asChild variant="link" size="sm">
                                    <Link href={`/profile/${member.uid}`}>View Profile</Link>
                                  </Button>
                                  {/* Show Updates button for all users if current user is admin/owner, or for teammates */}
                                  {(isAdmin() || isOwner() || currentUser?.teamId === member.teamId) && (
                                    <Button variant="outline" size="sm" onClick={() => setViewingTeammate(member)}>
                                      <Newspaper className="h-4 w-4 mr-1" />
                                      Updates
                                    </Button>
                                  )}
                                  <EmojiShortcuts
                                    targetUser={member.uid}
                                    targetUserName={member.name}
                                    onEmojiSent={handleEmojiSent}
                                  />
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-4">
                          No members match the current search/filter in this team.
                        </p>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          ) : (
            <div className="text-center py-10">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium text-foreground">No members found</h3>
              <p className="mt-1 text-sm text-muted-foreground">No users match your current search term or filter.</p>
            </div>
          )}
        </main>
      </div>
      <TeammateUpdatesDialog
        open={!!viewingTeammate}
        onOpenChange={(isOpen) => !isOpen && setViewingTeammate(null)}
        teammate={viewingTeammate}
      />
    </>
  )
}
