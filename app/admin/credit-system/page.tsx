"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Settings, Users, Percent } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import type { User, Team } from "@/types"

interface CreditWeights {
  EC: number // Execution Credit percentage
  OC: number // Objective Credit percentage
  CC: number // Collaboration Credit percentage
}

interface TeamCreditConfig {
  teamId: string
  teamName: string
  weights: CreditWeights
  updatedBy: string
  updatedAt: string
}

interface UserRating {
  userId: string
  userName: string
  teamId?: string
  performanceMultiplier: number // 0.5 to 2.0 (50% to 200%)
  notes?: string
  updatedBy: string
  updatedAt: string
}

const DEFAULT_WEIGHTS: CreditWeights = { EC: 40, OC: 50, CC: 10 }

export default function CreditSystemPage() {
  const { user: currentUser, isAdmin, isOwner } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [teamConfigs, setTeamConfigs] = useState<TeamCreditConfig[]>([])
  const [userRatings, setUserRatings] = useState<UserRating[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [activeTab, setActiveTab] = useState<"weights" | "ratings">("weights")
  const router = useRouter()

  // Form states
  const [selectedTeamId, setSelectedTeamId] = useState<string>("")
  const [ecWeight, setEcWeight] = useState("40")
  const [ocWeight, setOcWeight] = useState("50")
  const [ccWeight, setCcWeight] = useState("10")
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [performanceMultiplier, setPerformanceMultiplier] = useState("1.0")
  const [ratingNotes, setRatingNotes] = useState("")

  useEffect(() => {
    if (!currentUser) {
      router.push("/login")
      return
    }

    if (!isAdmin() && !isOwner()) {
      router.push("/dashboard")
      return
    }

    loadData()
    setLoading(false)
  }, [currentUser, router, isAdmin, isOwner])

  const loadData = () => {
    if (typeof window !== "undefined") {
      // Load users
      const storedUsers = localStorage.getItem("allUsers")
      if (storedUsers) {
        const allUsers = JSON.parse(storedUsers) as User[]
        setUsers(allUsers)
      }

      // Load teams
      const storedTeams = localStorage.getItem("allTeams")
      if (storedTeams) {
        setTeams(JSON.parse(storedTeams))
      } else {
        // Create default teams if none exist
        const defaultTeams: Team[] = [
          { id: "settlyfe", name: "Settlyfe", leadEmployeeId: currentUser?.employeeId || "", createdAt: new Date().toISOString() },
        ]
        setTeams(defaultTeams)
        localStorage.setItem("allTeams", JSON.stringify(defaultTeams))
      }

      // Load team credit configs
      const storedConfigs = localStorage.getItem("teamCreditConfigs")
      if (storedConfigs) {
        setTeamConfigs(JSON.parse(storedConfigs))
      }

      // Load user ratings
      const storedRatings = localStorage.getItem("userRatings")
      if (storedRatings) {
        setUserRatings(JSON.parse(storedRatings))
      }
    }
  }

  const handleSaveTeamWeights = async () => {
    if (!selectedTeamId || !currentUser) return

    const totalWeight = Number.parseInt(ecWeight) + Number.parseInt(ocWeight) + Number.parseInt(ccWeight)
    if (totalWeight !== 100) {
      setMessage("Error: Total weight must equal 100%")
      return
    }

    setSaving(true)
    setMessage("")

    try {
      const selectedTeam = teams.find((t) => t.id === selectedTeamId)
      if (!selectedTeam) {
        setMessage("Error: Team not found")
        return
      }

      // Check permissions
      if (!isOwner() && selectedTeam.leadEmployeeId !== currentUser.employeeId) {
        setMessage("Error: You can only modify your own team's settings")
        return
      }

      const newConfig: TeamCreditConfig = {
        teamId: selectedTeamId,
        teamName: selectedTeam.name,
        weights: {
          EC: Number.parseInt(ecWeight),
          OC: Number.parseInt(ocWeight),
          CC: Number.parseInt(ccWeight),
        },
        updatedBy: currentUser.employeeId || "",
        updatedAt: new Date().toISOString(),
      }

      const updatedConfigs = teamConfigs.filter((c) => c.teamId !== selectedTeamId)
      updatedConfigs.push(newConfig)
      setTeamConfigs(updatedConfigs)
      localStorage.setItem("teamCreditConfigs", JSON.stringify(updatedConfigs))

      setMessage("Team credit weights updated successfully!")
      setSelectedTeamId("")
      setEcWeight("40")
      setOcWeight("50")
      setCcWeight("10")
    } catch (error) {
      setMessage("Error updating team weights")
      console.error("Error:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveUserRating = async () => {
    if (!selectedUserId || !currentUser) return

    const multiplier = Number.parseFloat(performanceMultiplier)
    if (multiplier < 0.5 || multiplier > 2.0) {
      setMessage("Error: Performance multiplier must be between 0.5 and 2.0")
      return
    }

    setSaving(true)
    setMessage("")

    try {
      const selectedUser = users.find((u) => u.employeeId === selectedUserId)
      if (!selectedUser) {
        setMessage("Error: User not found")
        return
      }

      // Check permissions
      if (!isOwner() && selectedUser.teamId !== currentUser.teamId) {
        setMessage("Error: You can only rate members of your own team")
        return
      }

      const newRating: UserRating = {
        userId: selectedUserId,
        userName: selectedUser.name,
        teamId: selectedUser.teamId,
        performanceMultiplier: multiplier,
        notes: ratingNotes,
        updatedBy: currentUser.employeeId || "",
        updatedAt: new Date().toISOString(),
      }

      const updatedRatings = userRatings.filter((r) => r.userId !== selectedUserId)
      updatedRatings.push(newRating)
      setUserRatings(updatedRatings)
      localStorage.setItem("userRatings", JSON.stringify(updatedRatings))

      setMessage("User rating updated successfully!")
      setSelectedUserId("")
      setPerformanceMultiplier("1.0")
      setRatingNotes("")
    } catch (error) {
      setMessage("Error updating user rating")
      console.error("Error:", error)
    } finally {
      setSaving(false)
    }
  }

  const getTeamWeights = (teamId: string): CreditWeights => {
    const config = teamConfigs.find((c) => c.teamId === teamId)
    return config ? config.weights : DEFAULT_WEIGHTS
  }

  const getUserMultiplier = (userId: string): number => {
    const rating = userRatings.find((r) => r.userId === userId)
    return rating ? rating.performanceMultiplier : 1.0
  }

  const getAvailableTeams = () => {
    if (isOwner()) return teams
    return teams.filter((t) => t.leadEmployeeId === currentUser?.employeeId)
  }

  const getAvailableUsers = () => {
    if (isOwner()) return users.filter((u) => u.employeeId !== currentUser?.employeeId)
    return users.filter((u) => u.teamId === currentUser?.teamId && u.employeeId !== currentUser?.employeeId)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading credit system...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 sm:py-4 gap-3 sm:gap-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Credit System Management</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Configure team credit weights and user performance ratings
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/admin">
                <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                  <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Back to Admin
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {message && (
          <Alert
            className={
              message.includes("Error")
                ? "border-red-200 bg-red-50 mb-4 sm:mb-6"
                : "border-green-200 bg-green-50 mb-4 sm:mb-6"
            }
          >
            <AlertDescription className={message.includes("Error") ? "text-red-800 text-sm" : "text-green-800 text-sm"}>
              {message}
            </AlertDescription>
          </Alert>
        )}

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-muted p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("weights")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === "weights"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Percent className="h-4 w-4 inline mr-2" />
            Team Weights
          </button>
          <button
            onClick={() => setActiveTab("ratings")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === "ratings"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="h-4 w-4 inline mr-2" />
            User Ratings
          </button>
        </div>

        {activeTab === "weights" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Team Weight Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configure Team Weights
                </CardTitle>
                <CardDescription>
                  Set custom credit weight percentages for teams. Default: EC 40%, OC 50%, CC 10%
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="team-select">Select Team</Label>
                  <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a team" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableTeams().map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTeamId && (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="ec-weight">EC Weight (%)</Label>
                        <Input
                          id="ec-weight"
                          type="number"
                          min="0"
                          max="100"
                          value={ecWeight}
                          onChange={(e) => setEcWeight(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="oc-weight">OC Weight (%)</Label>
                        <Input
                          id="oc-weight"
                          type="number"
                          min="0"
                          max="100"
                          value={ocWeight}
                          onChange={(e) => setOcWeight(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cc-weight">CC Weight (%)</Label>
                        <Input
                          id="cc-weight"
                          type="number"
                          min="0"
                          max="100"
                          value={ccWeight}
                          onChange={(e) => setCcWeight(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        Total:{" "}
                        {Number.parseInt(ecWeight || "0") +
                          Number.parseInt(ocWeight || "0") +
                          Number.parseInt(ccWeight || "0")}
                        %
                        {Number.parseInt(ecWeight || "0") +
                          Number.parseInt(ocWeight || "0") +
                          Number.parseInt(ccWeight || "0") !==
                          100 && <span className="text-red-600 dark:text-red-400 ml-2">(Must equal 100%)</span>}
                      </p>
                    </div>

                    <Button onClick={handleSaveTeamWeights} disabled={saving} className="w-full">
                      {saving ? "Saving..." : "Save Team Weights"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Current Team Configurations */}
            <Card>
              <CardHeader>
                <CardTitle>Current Team Configurations</CardTitle>
                <CardDescription>Active credit weight settings for all teams</CardDescription>
              </CardHeader>
              <CardContent>
                {teamConfigs.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No custom configurations set. Using default weights.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {teamConfigs.map((config) => (
                      <div key={config.teamId} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{config.teamName}</h4>
                          <Badge variant="outline" className="text-xs">
                            {new Date(config.updatedAt).toLocaleDateString()}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>EC: {config.weights.EC}%</div>
                          <div>OC: {config.weights.OC}%</div>
                          <div>CC: {config.weights.CC}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "ratings" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Rating Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Configure User Ratings
                </CardTitle>
                <CardDescription>Set performance multipliers for individual users (0.5x to 2.0x)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="user-select">Select User</Label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableUsers().map((user) => (
                        <SelectItem key={user.employeeId} value={user.employeeId}>
                          {user.name} ({user.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedUserId && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="multiplier">Performance Multiplier</Label>
                      <Select value={performanceMultiplier} onValueChange={setPerformanceMultiplier}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0.5">0.5x - Needs Improvement</SelectItem>
                          <SelectItem value="0.7">0.7x - Below Average</SelectItem>
                          <SelectItem value="0.8">0.8x - Developing</SelectItem>
                          <SelectItem value="1.0">1.0x - Standard</SelectItem>
                          <SelectItem value="1.2">1.2x - Good</SelectItem>
                          <SelectItem value="1.5">1.5x - Excellent</SelectItem>
                          <SelectItem value="2.0">2.0x - Outstanding</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Input
                        id="notes"
                        value={ratingNotes}
                        onChange={(e) => setRatingNotes(e.target.value)}
                        placeholder="Performance notes or feedback"
                      />
                    </div>

                    <Button onClick={handleSaveUserRating} disabled={saving} className="w-full">
                      {saving ? "Saving..." : "Save User Rating"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Current User Ratings */}
            <Card>
              <CardHeader>
                <CardTitle>Current User Ratings</CardTitle>
                <CardDescription>Active performance multipliers for team members</CardDescription>
              </CardHeader>
              <CardContent>
                {userRatings.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No custom ratings set. All users have 1.0x multiplier.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {userRatings.map((rating) => (
                      <div key={rating.userId} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{rating.userName}</h4>
                          <Badge
                            variant={
                              rating.performanceMultiplier >= 1.2
                                ? "default"
                                : rating.performanceMultiplier >= 1.0
                                  ? "secondary"
                                  : "destructive"
                            }
                            className="text-xs"
                          >
                            {rating.performanceMultiplier}x
                          </Badge>
                        </div>
                        {rating.notes && <p className="text-sm text-muted-foreground mb-2">{rating.notes}</p>}
                        <p className="text-xs text-muted-foreground">
                          Updated {new Date(rating.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
