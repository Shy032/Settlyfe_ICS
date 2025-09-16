"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  Plus,
  Trash2,
  UserPlus,
  Crown,
  AlertTriangle,
  ShieldCheck,
  UserMinus,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  ArrowRightLeft,
} from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { useTranslation } from "@/lib/i18n"
import type { Team, User } from "@/types"

interface DeletionRequest {
  id: string
  requestedBy: string
  requestedByName: string
  targetUser: string
  targetUserName: string
  targetUserEmail: string
  reason: string
  timestamp: string
  status: "pending" | "approved" | "denied"
}

interface DeletedUser extends User {
  deletedAt: string
  deletedBy: string
  deletedByName: string
  reason: string
}

interface OwnershipTransfer {
  id: string
  fromOwner: string
  fromOwnerName: string
  toNewOwner: string
  toNewOwnerName: string
  timestamp: string
  reason: string
}

export default function TeamPage() {
  const { user, isAdmin, isOwner } = useAuth()
  const { t } = useTranslation(user?.preferredLanguage as any)
  const [teams, setTeams] = useState<Team[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [deletionRequests, setDeletionRequests] = useState<DeletionRequest[]>([])
  const [deletedUsers, setDeletedUsers] = useState<DeletedUser[]>([])
  const [ownershipHistory, setOwnershipHistory] = useState<OwnershipTransfer[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [deleteConfirm, setDeleteConfirm] = useState<Team | null>(null)
  const [assignLeader, setAssignLeader] = useState<Team | null>(null)
  const [deleteUserDialog, setDeleteUserDialog] = useState<User | null>(null)
  const [deleteReason, setDeleteReason] = useState("")
  const [transferOwnershipDialog, setTransferOwnershipDialog] = useState<boolean>(false)
  const [newOwnerId, setNewOwnerId] = useState("")
  const [transferReason, setTransferReason] = useState("")
  const router = useRouter()

  // Form states
  const [newTeamName, setNewTeamName] = useState("")
  const [selectedUserId, setSelectedUserId] = useState("")
  const [selectedTeamId, setSelectedTeamId] = useState("")
  const [selectedLeaderId, setSelectedLeaderId] = useState("")

  const [editingUserRole, setEditingUserRole] = useState<User | null>(null)
  const [newRole, setNewRole] = useState<User["role"] | "">("")

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    if (!isAdmin() && !isOwner()) {
      router.push("/dashboard")
      return
    }

    loadData()
    setLoading(false)
  }, [user, router, isAdmin, isOwner])

  const loadData = () => {
    if (typeof window !== "undefined") {
      // Load teams
      const storedTeams = localStorage.getItem("teams")
      if (storedTeams) {
        const teamsData = JSON.parse(storedTeams) as Team[]
        setTeams(teamsData)
      } else {
        const defaultTeams: Team[] = [
          {
            id: "settlyfe",
            name: "Settlyfe",
            leadUid: "admin_settlyfe_com",
            createdAt: new Date().toISOString(),
          },
        ]
        localStorage.setItem("teams", JSON.stringify(defaultTeams))
        setTeams(defaultTeams)
      }

      // Load users
      const storedUsers = localStorage.getItem("allUsers")
      if (storedUsers) {
        const usersData = JSON.parse(storedUsers) as User[]
        setUsers(usersData)
      } else {
        const sampleUsers: User[] = [
          {
            uid: "admin_settlyfe_com",
            email: "admin@settlyfe.com",
            name: "Admin User",
            role: "owner",
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
          {
            uid: "user02_settlyfe_com",
            email: "user02@settlyfe.com",
            name: "Jane Smith",
            role: "member",
            teamId: "settlyfe",
            createdAt: new Date().toISOString(),
          },
          {
            uid: "user03_settlyfe_com",
            email: "user03@settlyfe.com",
            name: "Mike Johnson",
            role: "member",
            teamId: "settlyfe",
            createdAt: new Date().toISOString(),
          },
          {
            uid: "bakeryang_settlyfe_com",
            email: "bakeryang@settlyfe.com",
            name: "Baker Yang",
            role: "admin",
            teamId: "settlyfe",
            createdAt: new Date().toISOString(),
          },
          {
            uid: "testadmin_settlyfe_com",
            email: "testadmin@settlyfe.com",
            name: "Test Admin",
            role: "admin",
            teamId: "settlyfe",
            createdAt: new Date().toISOString(),
          },
        ]
        localStorage.setItem("allUsers", JSON.stringify(sampleUsers))
        setUsers(sampleUsers)
      }

      // Load deletion requests
      const storedRequests = localStorage.getItem("deletionRequests")
      if (storedRequests) {
        setDeletionRequests(JSON.parse(storedRequests))
      }

      // Load deleted users
      const storedDeleted = localStorage.getItem("deletedUsers")
      if (storedDeleted) {
        setDeletedUsers(JSON.parse(storedDeleted))
      }

      // Load ownership history
      const storedOwnership = localStorage.getItem("ownershipHistory")
      if (storedOwnership) {
        setOwnershipHistory(JSON.parse(storedOwnership))
      }
    }
  }

  const handleTransferOwnership = async () => {
    if (!newOwnerId || !transferReason.trim() || !isOwner()) return

    setSaving(true)
    setMessage("")

    try {
      const newOwner = users.find((u) => u.uid === newOwnerId)
      if (!newOwner) return

      // Create ownership transfer record
      const transfer: OwnershipTransfer = {
        id: `transfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        fromOwner: user?.uid || "",
        fromOwnerName: user?.name || "",
        toNewOwner: newOwnerId,
        toNewOwnerName: newOwner.name,
        timestamp: new Date().toISOString(),
        reason: transferReason,
      }

      // Update users: current owner becomes admin, new owner becomes owner
      const updatedUsers = users.map((u) => {
        if (u.uid === user?.uid) {
          return { ...u, role: "admin" as User["role"] }
        }
        if (u.uid === newOwnerId) {
          return { ...u, role: "owner" as User["role"] }
        }
        return u
      })

      localStorage.setItem("allUsers", JSON.stringify(updatedUsers))
      setUsers(updatedUsers)

      // Update current user session to admin
      if (user) {
        const updatedCurrentUser = { ...user, role: "admin" as User["role"] }
        localStorage.setItem("currentUser", JSON.stringify(updatedCurrentUser))
      }

      // Store ownership transfer history
      const updatedHistory = [...ownershipHistory, transfer]
      localStorage.setItem("ownershipHistory", JSON.stringify(updatedHistory))
      setOwnershipHistory(updatedHistory)

      setTransferOwnershipDialog(false)
      setNewOwnerId("")
      setTransferReason("")
      setMessage(`Ownership transferred to ${newOwner.name}. You are now an Admin. Please refresh the page.`)

      // Redirect to dashboard after a delay
      setTimeout(() => {
        window.location.reload()
      }, 3000)
    } catch (error) {
      setMessage("Error transferring ownership")
      console.error("Error:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTeamName.trim()) return

    setSaving(true)
    setMessage("")

    try {
      const newTeam: Team = {
        id: newTeamName.toLowerCase().replace(/\s+/g, "-"),
        name: newTeamName,
        leadUid: user?.uid || "",
        createdAt: new Date().toISOString(),
      }

      const updatedTeams = [...teams, newTeam]
      localStorage.setItem("teams", JSON.stringify(updatedTeams))
      setTeams(updatedTeams)
      setNewTeamName("")
      setMessage("Team created successfully!")
    } catch (error) {
      setMessage("Error creating team")
      console.error("Error:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTeam = async (team: Team) => {
    setSaving(true)
    setMessage("")

    try {
      const updatedTeams = teams.filter((t) => t.id !== team.id)
      localStorage.setItem("teams", JSON.stringify(updatedTeams))
      setTeams(updatedTeams)

      const updatedUsers = users.map((u) => (u.teamId === team.id ? { ...u, teamId: undefined } : u))
      localStorage.setItem("allUsers", JSON.stringify(updatedUsers))
      setUsers(updatedUsers)

      setDeleteConfirm(null)
      setMessage("Team deleted successfully!")
    } catch (error) {
      setMessage("Error deleting team")
      console.error("Error:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleRequestUserDeletion = async () => {
    if (!deleteUserDialog || !deleteReason.trim()) return

    setSaving(true)
    setMessage("")

    try {
      const request: DeletionRequest = {
        id: `del_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        requestedBy: user?.uid || "",
        requestedByName: user?.name || "",
        targetUser: deleteUserDialog.uid,
        targetUserName: deleteUserDialog.name,
        targetUserEmail: deleteUserDialog.email,
        reason: deleteReason,
        timestamp: new Date().toISOString(),
        status: "pending",
      }

      const updatedRequests = [...deletionRequests, request]
      localStorage.setItem("deletionRequests", JSON.stringify(updatedRequests))
      setDeletionRequests(updatedRequests)

      setDeleteUserDialog(null)
      setDeleteReason("")
      setMessage("Deletion request submitted for owner approval!")
    } catch (error) {
      setMessage("Error submitting deletion request")
      console.error("Error:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleApproveDeletion = async (requestId: string) => {
    if (!isOwner()) return

    setSaving(true)
    setMessage("")

    try {
      const request = deletionRequests.find((r) => r.id === requestId)
      if (!request) return

      const userToDelete = users.find((u) => u.uid === request.targetUser)
      if (!userToDelete) return

      // Move user to deleted users
      const deletedUser: DeletedUser = {
        ...userToDelete,
        deletedAt: new Date().toISOString(),
        deletedBy: user?.uid || "",
        deletedByName: user?.name || "",
        reason: request.reason,
      }

      const updatedDeletedUsers = [...deletedUsers, deletedUser]
      localStorage.setItem("deletedUsers", JSON.stringify(updatedDeletedUsers))
      setDeletedUsers(updatedDeletedUsers)

      // Remove user from active users
      const updatedUsers = users.filter((u) => u.uid !== request.targetUser)
      localStorage.setItem("allUsers", JSON.stringify(updatedUsers))
      setUsers(updatedUsers)

      // Update request status
      const updatedRequests = deletionRequests.map((r) =>
        r.id === requestId ? { ...r, status: "approved" as const } : r,
      )
      localStorage.setItem("deletionRequests", JSON.stringify(updatedRequests))
      setDeletionRequests(updatedRequests)

      setMessage(`User ${request.targetUserName} has been deleted successfully!`)
    } catch (error) {
      setMessage("Error approving deletion")
      console.error("Error:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleDenyDeletion = async (requestId: string) => {
    if (!isOwner()) return

    setSaving(true)
    setMessage("")

    try {
      const updatedRequests = deletionRequests.map((r) =>
        r.id === requestId ? { ...r, status: "denied" as const } : r,
      )
      localStorage.setItem("deletionRequests", JSON.stringify(updatedRequests))
      setDeletionRequests(updatedRequests)

      setMessage("Deletion request denied!")
    } catch (error) {
      setMessage("Error denying deletion")
      console.error("Error:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleRecallUser = async (deletedUserId: string) => {
    if (!isOwner()) return

    setSaving(true)
    setMessage("")

    try {
      const deletedUser = deletedUsers.find((u) => u.uid === deletedUserId)
      if (!deletedUser) return

      // Restore user to active users
      const { deletedAt, deletedBy, deletedByName, reason, ...restoredUser } = deletedUser
      const updatedUsers = [...users, restoredUser]
      localStorage.setItem("allUsers", JSON.stringify(updatedUsers))
      setUsers(updatedUsers)

      // Remove from deleted users
      const updatedDeletedUsers = deletedUsers.filter((u) => u.uid !== deletedUserId)
      localStorage.setItem("deletedUsers", JSON.stringify(updatedDeletedUsers))
      setDeletedUsers(updatedDeletedUsers)

      setMessage(`User ${deletedUser.name} has been recalled successfully!`)
    } catch (error) {
      setMessage("Error recalling user")
      console.error("Error:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleAssignToTeam = async () => {
    if (!selectedUserId || !selectedTeamId) return

    setSaving(true)
    setMessage("")

    try {
      const updatedUsers = users.map((u) => (u.uid === selectedUserId ? { ...u, teamId: selectedTeamId } : u))
      localStorage.setItem("allUsers", JSON.stringify(updatedUsers))
      setUsers(updatedUsers)

      setSelectedUserId("")
      setSelectedTeamId("")
      setMessage("User assigned to team successfully!")
    } catch (error) {
      setMessage("Error assigning user to team")
      console.error("Error:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleAssignLeader = async () => {
    if (!selectedLeaderId || !assignLeader) return

    setSaving(true)
    setMessage("")

    try {
      const updatedTeams = teams.map((t) => (t.id === assignLeader.id ? { ...t, leadUid: selectedLeaderId } : t))
      localStorage.setItem("teams", JSON.stringify(updatedTeams))
      setTeams(updatedTeams)

      setAssignLeader(null)
      setSelectedLeaderId("")
      setMessage("Team leader assigned successfully!")
    } catch (error) {
      setMessage("Error assigning team leader")
      console.error("Error:", error)
    } finally {
      setSaving(false)
    }
  }

  const getUserName = (uid: string) => {
    return users.find((u) => u.uid === uid)?.name || "Unknown"
  }

  const handleRoleChange = async () => {
    if (!editingUserRole || !newRole || !isOwner()) return

    // Prevent changing owner role through this method
    if (editingUserRole.role === "owner" || newRole === "owner") {
      setMessage("Owner role changes must be done through ownership transfer")
      return
    }

    setSaving(true)
    setMessage("")

    try {
      const updatedUsers = users.map((u) =>
        u.uid === editingUserRole.uid ? { ...u, role: newRole as User["role"] } : u,
      )
      localStorage.setItem("allUsers", JSON.stringify(updatedUsers))
      setUsers(updatedUsers)

      setEditingUserRole(null)
      setNewRole("")
      setMessage("User role updated successfully!")
    } catch (error) {
      setMessage("Error updating user role")
      console.error("Error:", error)
    } finally {
      setSaving(false)
    }
  }

  const handlePromoteToAdmin = async (member: User) => {
    if (!isOwner()) return

    setSaving(true)
    setMessage("")

    try {
      const updatedUsers = users.map((u) => (u.uid === member.uid ? { ...u, role: "admin" as User["role"] } : u))
      localStorage.setItem("allUsers", JSON.stringify(updatedUsers))
      setUsers(updatedUsers)

      setMessage(`${member.name} has been promoted to Admin!`)
    } catch (error) {
      setMessage("Error promoting user to admin")
      console.error("Error:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleDemoteToMember = async (member: User) => {
    // Only owner can demote admins
    if (!isOwner()) return

    setSaving(true)
    setMessage("")

    try {
      const updatedUsers = users.map((u) => (u.uid === member.uid ? { ...u, role: "member" as User["role"] } : u))
      localStorage.setItem("allUsers", JSON.stringify(updatedUsers))
      setUsers(updatedUsers)

      setMessage(`${member.name} has been demoted to Member.`)
    } catch (error) {
      setMessage("Error demoting user to member")
      console.error("Error:", error)
    } finally {
      setSaving(false)
    }
  }

  // Helper function to check if current user can manage target user
  const canManageUser = (targetUser: User) => {
    if (!user) return false

    // Owner can manage everyone except other owners
    if (user.role === "owner") {
      return targetUser.role !== "owner" || targetUser.uid === user.uid
    }

    // Admin can only manage members
    if (user.role === "admin") {
      return targetUser.role === "member"
    }

    // Members can't manage anyone
    return false
  }

  const pendingRequests = deletionRequests.filter((r) => r.status === "pending")

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-300">{t("loading")} team management...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("teamManagement")}</h1>
              <p className="text-gray-600 dark:text-gray-300">
                Manage teams and assign members - Role: {user?.role?.toUpperCase()}
              </p>
              {isOwner() && pendingRequests.length > 0 && (
                <Badge variant="destructive" className="mt-1">
                  {pendingRequests.length} pending deletion request{pendingRequests.length > 1 ? "s" : ""}
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              {isOwner() && (
                <Button variant="outline" onClick={() => setTransferOwnershipDialog(true)}>
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  Transfer Ownership
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="teams" className="space-y-8">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            {isOwner() && (
              <>
                <TabsTrigger value="requests" className="relative">
                  Requests
                  {pendingRequests.length > 0 && (
                    <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs">
                      {pendingRequests.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="deleted">Deleted</TabsTrigger>
                <TabsTrigger value="ownership">Ownership</TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="teams" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Teams Section */}
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 dark:text-white">
                    <Users className="h-5 w-5" />
                    Teams ({teams.length})
                  </CardTitle>
                  <CardDescription className="dark:text-gray-300">Create and manage teams</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={handleCreateTeam} className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor="teamName" className="dark:text-gray-200">
                        {t("teamName")}
                      </Label>
                      <Input
                        id="teamName"
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        placeholder="Enter team name"
                        required
                        className="dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                      />
                    </div>
                    <Button type="submit" disabled={saving} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      {saving ? "Creating..." : t("createTeam")}
                    </Button>
                  </form>

                  <div className="space-y-2">
                    {teams.map((team) => (
                      <div key={team.id} className="p-4 border dark:border-gray-600 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium dark:text-white">{team.name}</h3>
                              <Crown className="h-4 w-4 text-yellow-500" />
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              Lead: {getUserName(team.leadUid)}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              Members: {users.filter((u) => u.teamId === team.id).length}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setAssignLeader(team)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Crown className="h-3 w-3" />
                            </Button>
                            {team.id !== "settlyfe" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setDeleteConfirm(team)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Assign Members Section */}
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 dark:text-white">
                    <UserPlus className="h-5 w-5" />
                    Assign Members to Teams
                  </CardTitle>
                  <CardDescription className="dark:text-gray-300">Move members between teams</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="userSelect" className="dark:text-gray-200">
                      Select Member
                    </Label>
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                      <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        <SelectValue placeholder="Select a member" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                        {users
                          .filter((u) => canManageUser(u))
                          .map((member) => (
                            <SelectItem key={member.uid} value={member.uid}>
                              {member.name} ({member.email}) - {member.role}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="teamSelect" className="dark:text-gray-200">
                      Assign to Team
                    </Label>
                    <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                      <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        <SelectValue placeholder="Select team" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleAssignToTeam}
                    disabled={saving || !selectedUserId || !selectedTeamId}
                    className="w-full"
                  >
                    {saving ? "Assigning..." : "Assign to Team"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="members">
            {/* All Members Table */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-white">
                  {t("allMembers")} ({users.length})
                </CardTitle>
                <CardDescription className="dark:text-gray-300">
                  Manage users in the system -{" "}
                  {user?.role === "owner" ? "You can manage all roles" : "You can only manage members"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="dark:border-gray-700">
                      <TableHead className="dark:text-gray-300">Name</TableHead>
                      <TableHead className="dark:text-gray-300">Email</TableHead>
                      <TableHead className="dark:text-gray-300">Role</TableHead>
                      <TableHead className="dark:text-gray-300">Team</TableHead>
                      <TableHead className="dark:text-gray-300">Joined</TableHead>
                      <TableHead className="dark:text-gray-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((member) => (
                      <TableRow key={member.uid} className="dark:border-gray-700">
                        <TableCell className="font-medium dark:text-white">{member.name}</TableCell>
                        <TableCell className="dark:text-gray-300">{member.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              member.role === "owner" ? "default" : member.role === "admin" ? "secondary" : "outline"
                            }
                            className="dark:border-gray-600 dark:text-gray-300"
                          >
                            {member.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="dark:text-gray-300">
                          {teams.find((t) => t.id === member.teamId)?.name || "No team"}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(member.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="flex gap-1">
                          {canManageUser(member) && member.uid !== user?.uid && (
                            <>
                              {/* Owner can promote members to admin */}
                              {isOwner() && member.role === "member" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handlePromoteToAdmin(member)}
                                  className="text-green-600 hover:text-green-700"
                                  title="Promote to Admin"
                                >
                                  <Crown className="h-4 w-4" />
                                </Button>
                              )}
                              {/* Owner can demote admins to member */}
                              {isOwner() && member.role === "admin" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDemoteToMember(member)}
                                  className="text-orange-600 hover:text-orange-700"
                                  title="Demote to Member"
                                >
                                  <UserMinus className="h-4 w-4" />
                                </Button>
                              )}
                              {/* Only owner can change roles */}
                              {isOwner() && member.role !== "owner" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingUserRole(member)
                                    setNewRole(member.role)
                                  }}
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  <ShieldCheck className="h-4 w-4" />
                                </Button>
                              )}
                            </>
                          )}
                          {/* Delete button - only for users you can manage */}
                          {canManageUser(member) && member.uid !== user?.uid && member.role !== "owner" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setDeleteUserDialog(member)}
                              className="text-red-600 hover:text-red-700"
                              title="Request Deletion"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {isOwner() && (
            <TabsContent value="requests">
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 dark:text-white">
                    <Clock className="h-5 w-5" />
                    Deletion Requests ({deletionRequests.length})
                  </CardTitle>
                  <CardDescription className="dark:text-gray-300">
                    Review and approve member deletion requests
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {deletionRequests.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">No deletion requests found.</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="dark:border-gray-700">
                          <TableHead className="dark:text-gray-300">Requested By</TableHead>
                          <TableHead className="dark:text-gray-300">Target User</TableHead>
                          <TableHead className="dark:text-gray-300">Reason</TableHead>
                          <TableHead className="dark:text-gray-300">Date</TableHead>
                          <TableHead className="dark:text-gray-300">Status</TableHead>
                          <TableHead className="dark:text-gray-300">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {deletionRequests.map((request) => (
                          <TableRow key={request.id} className="dark:border-gray-700">
                            <TableCell className="font-medium dark:text-white">{request.requestedByName}</TableCell>
                            <TableCell className="dark:text-gray-300">
                              <div>
                                <div className="font-medium">{request.targetUserName}</div>
                                <div className="text-sm text-gray-500">{request.targetUserEmail}</div>
                              </div>
                            </TableCell>
                            <TableCell className="dark:text-gray-300 max-w-xs truncate">{request.reason}</TableCell>
                            <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(request.timestamp).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  request.status === "pending"
                                    ? "secondary"
                                    : request.status === "approved"
                                      ? "default"
                                      : "destructive"
                                }
                              >
                                {request.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="flex gap-1">
                              {request.status === "pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleApproveDeletion(request.id)}
                                    className="text-green-600 hover:text-green-700"
                                    title="Approve Deletion"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDenyDeletion(request.id)}
                                    className="text-red-600 hover:text-red-700"
                                    title="Deny Deletion"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {isOwner() && (
            <TabsContent value="deleted">
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 dark:text-white">
                    <Trash2 className="h-5 w-5" />
                    Deleted Users ({deletedUsers.length})
                  </CardTitle>
                  <CardDescription className="dark:text-gray-300">
                    Recently deleted users that can be recalled
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {deletedUsers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">No deleted users found.</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="dark:border-gray-700">
                          <TableHead className="dark:text-gray-300">Name</TableHead>
                          <TableHead className="dark:text-gray-300">Email</TableHead>
                          <TableHead className="dark:text-gray-300">Role</TableHead>
                          <TableHead className="dark:text-gray-300">Deleted By</TableHead>
                          <TableHead className="dark:text-gray-300">Reason</TableHead>
                          <TableHead className="dark:text-gray-300">Deleted Date</TableHead>
                          <TableHead className="dark:text-gray-300">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {deletedUsers.map((deletedUser) => (
                          <TableRow key={deletedUser.uid} className="dark:border-gray-700">
                            <TableCell className="font-medium dark:text-white">{deletedUser.name}</TableCell>
                            <TableCell className="dark:text-gray-300">{deletedUser.email}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                                {deletedUser.role}
                              </Badge>
                            </TableCell>
                            <TableCell className="dark:text-gray-300">{deletedUser.deletedByName}</TableCell>
                            <TableCell className="dark:text-gray-300 max-w-xs truncate">{deletedUser.reason}</TableCell>
                            <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(deletedUser.deletedAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRecallUser(deletedUser.uid)}
                                className="text-blue-600 hover:text-blue-700"
                                title="Recall User"
                              >
                                <RotateCcw className="h-4 w-4 mr-1" />
                                Recall
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {isOwner() && (
            <TabsContent value="ownership">
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 dark:text-white">
                    <ArrowRightLeft className="h-5 w-5" />
                    Ownership Transfer History ({ownershipHistory.length})
                  </CardTitle>
                  <CardDescription className="dark:text-gray-300">
                    History of ownership transfers in the system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {ownershipHistory.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No ownership transfers found.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="dark:border-gray-700">
                          <TableHead className="dark:text-gray-300">From Owner</TableHead>
                          <TableHead className="dark:text-gray-300">To New Owner</TableHead>
                          <TableHead className="dark:text-gray-300">Reason</TableHead>
                          <TableHead className="dark:text-gray-300">Transfer Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ownershipHistory.map((transfer) => (
                          <TableRow key={transfer.id} className="dark:border-gray-700">
                            <TableCell className="font-medium dark:text-white">{transfer.fromOwnerName}</TableCell>
                            <TableCell className="font-medium dark:text-white text-green-600">
                              {transfer.toNewOwnerName}
                            </TableCell>
                            <TableCell className="dark:text-gray-300 max-w-xs truncate">{transfer.reason}</TableCell>
                            <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(transfer.timestamp).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {message && (
          <Alert className="mt-4 max-w-md mx-auto">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Transfer Ownership Dialog */}
      <Dialog open={transferOwnershipDialog} onOpenChange={setTransferOwnershipDialog}>
        <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <ArrowRightLeft className="h-5 w-5" />
              Transfer Ownership
            </DialogTitle>
            <DialogDescription className="dark:text-gray-300">
              Transfer ownership to another user. You will become an Admin after this transfer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newOwnerSelect" className="dark:text-gray-200">
                Select New Owner
              </Label>
              <Select value={newOwnerId} onValueChange={setNewOwnerId}>
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <SelectValue placeholder="Select a user to become owner" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                  {users
                    .filter((u) => u.uid !== user?.uid && u.role !== "owner")
                    .map((member) => (
                      <SelectItem key={member.uid} value={member.uid}>
                        {member.name} ({member.email}) - {member.role}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="transferReason" className="dark:text-gray-200">
                Reason for Transfer (Required)
              </Label>
              <Input
                id="transferReason"
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                placeholder="Enter reason for ownership transfer..."
                required
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
              <p className="text-sm text-orange-800 dark:text-orange-200">
                <strong>Warning:</strong> After transferring ownership, you will become an Admin and will no longer have
                owner privileges. This action cannot be undone without the new owner's approval.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleTransferOwnership}
                disabled={saving || !newOwnerId || !transferReason.trim()}
                className="flex-1"
                variant="destructive"
              >
                {saving ? "Transferring..." : "Transfer Ownership"}
              </Button>
              <Button variant="outline" onClick={() => setTransferOwnershipDialog(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Team Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              {t("deleteTeam")}
            </DialogTitle>
            <DialogDescription className="dark:text-gray-300">
              Are you sure you want to delete the team "{deleteConfirm?.name}"? This action cannot be undone. All
              members will be removed from this team.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDeleteTeam(deleteConfirm)}
              disabled={saving}
              className="flex-1"
            >
              {saving ? "Deleting..." : t("delete")}
            </Button>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="flex-1">
              {t("cancel")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete User Request Dialog */}
      <Dialog open={!!deleteUserDialog} onOpenChange={() => setDeleteUserDialog(null)}>
        <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <Trash2 className="h-5 w-5" />
              Request User Deletion
            </DialogTitle>
            <DialogDescription className="dark:text-gray-300">
              Submit a request to delete user "{deleteUserDialog?.name}". This request will be sent to the owner for
              approval.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deleteReason" className="dark:text-gray-200">
                Reason for Deletion (Required)
              </Label>
              <Input
                id="deleteReason"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Enter reason for deletion..."
                required
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleRequestUserDeletion}
                disabled={saving || !deleteReason.trim()}
                className="flex-1"
                variant="destructive"
              >
                {saving ? "Submitting..." : "Submit Request"}
              </Button>
              <Button variant="outline" onClick={() => setDeleteUserDialog(null)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Leader Dialog */}
      <Dialog open={!!assignLeader} onOpenChange={() => setAssignLeader(null)}>
        <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 dark:text-white">
              <Crown className="h-5 w-5 text-yellow-500" />
              {t("assignLeader")}
            </DialogTitle>
            <DialogDescription className="dark:text-gray-300">
              Select a new leader for the team "{assignLeader?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="leaderSelect" className="dark:text-gray-200">
                Select New Leader
              </Label>
              <Select value={selectedLeaderId} onValueChange={setSelectedLeaderId}>
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <SelectValue placeholder="Select a team member" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                  {users
                    .filter((u) => u.teamId === assignLeader?.id)
                    .map((member) => (
                      <SelectItem key={member.uid} value={member.uid}>
                        {member.name} ({member.email})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAssignLeader} disabled={saving || !selectedLeaderId} className="flex-1">
                {saving ? "Assigning..." : t("assignLeader")}
              </Button>
              <Button variant="outline" onClick={() => setAssignLeader(null)} className="flex-1">
                {t("cancel")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change User Role Dialog */}
      <Dialog open={!!editingUserRole} onOpenChange={() => setEditingUserRole(null)}>
        <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 dark:text-white">
              <ShieldCheck className="h-5 w-5" />
              Change Role for {editingUserRole?.name}
            </DialogTitle>
            <DialogDescription className="dark:text-gray-300">
              Select a new role for {editingUserRole?.email}. Owner role changes must be done through ownership
              transfer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="roleSelect" className="dark:text-gray-200">
                New Role
              </Label>
              <Select value={newRole} onValueChange={(value) => setNewRole(value as User["role"])}>
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleRoleChange} disabled={saving || !newRole} className="flex-1">
                {saving ? "Updating Role..." : "Update Role"}
              </Button>
              <Button variant="outline" onClick={() => setEditingUserRole(null)} className="flex-1">
                {t("cancel")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
