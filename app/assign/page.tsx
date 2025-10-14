"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Plus, Target, Send } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import type { Task, Employee, Team } from "@/types"

export default function AssignPage() {
  const { account, employee, isAdmin, isOwner } = useAuth()
  const [users, setUsers] = useState<Employee[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const router = useRouter()

  // Form states
  const [title, setTitle] = useState("")
  const [desc, setDesc] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectedTeam, setSelectedTeam] = useState("")
  const [isKR, setIsKR] = useState(false)
  const [published, setPublished] = useState(false)

  useEffect(() => {
    if (!account || !employee) {
      router.push("/login")
      return
    }

    // Allow both admin and owner roles
    if (!isAdmin() && !isOwner()) {
      router.push("/dashboard")
      return
    }

    loadData()
    setLoading(false)
  }, [account, employee, router, isAdmin, isOwner])

  const loadData = () => {
    if (typeof window !== "undefined") {
      const storedUsers = localStorage.getItem("allUsers")
      if (storedUsers) {
        const usersData = JSON.parse(storedUsers) as Employee[]
        const members = usersData.filter((u) => u.role === "member")
        setUsers(members)
      }

      const storedTeams = localStorage.getItem("teams")
      if (storedTeams) {
        setTeams(JSON.parse(storedTeams))
      }
    }
  }

  const handleUserToggle = (userId: string) => {
    setSelectedUsers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  const handleTeamSelect = (teamId: string) => {
    setSelectedTeam(teamId)
    // Auto-select all members of the team
    const teamMembers = users.filter((u) => u.team_id === teamId).map((u) => u.id)
    setSelectedUsers(teamMembers)
  }

  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !desc.trim() || !dueDate || selectedUsers.length === 0) {
      setMessage("Please fill in all fields and select at least one assignee")
      return
    }

    setSaving(true)
    setMessage("")

    try {
      const newTask: Task = {
        id: `task_${Date.now()}`,
        title,
        description: desc,
        due_date: dueDate,
        admin_id: employee?.id || "",
        publish_date: new Date().toISOString(),
        priority: "low",
        status: "not-started",
        visibility: "everyone",
        progress: 0,
        is_key_result: isKR,
        published,
        created_at: new Date().toISOString()
      }

      // Get existing tasks
      const existingTasks = localStorage.getItem("tasks")
      const tasksArray: Task[] = existingTasks ? JSON.parse(existingTasks) : []

      // Add new task
      tasksArray.push(newTask)
      localStorage.setItem("tasks", JSON.stringify(tasksArray))

      setMessage(`Task ${published ? "published" : "saved as draft"} successfully!`)

      // Reset form
      setTitle("")
      setDesc("")
      setDueDate("")
      setSelectedUsers([])
      setSelectedTeam("")
      setIsKR(false)
      setPublished(false)
    } catch (error) {
      setMessage("Error creating task")
      console.error("Error:", error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading task assignment...</p>
        </div>
      </div>
    )
  }

  const filteredUsers = selectedTeam ? users.filter((u) => u.team_id === selectedTeam) : users

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create & Assign Tasks</h1>
              <p className="text-gray-600 dark:text-gray-300">Create tasks and assign them to team members</p>
            </div>
            <div className="flex gap-2">
              <Link href="/board">
                <Button variant="outline">View Tasks</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Task Form */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create New Task
              </CardTitle>
              <CardDescription>Fill in the task details and assign to team members</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitTask} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Task Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter task title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="desc">Description</Label>
                  <Textarea
                    id="desc"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="Describe the task requirements and objectives"
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="team">Assign to Team (Optional)</Label>
                  <Select value={selectedTeam} onValueChange={handleTeamSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a team or assign individually" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Individual Assignment</SelectItem>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name} ({users.filter((u) => u.team_id === team.id).length} members)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="isKR" checked={isKR} onCheckedChange={(checked) => setIsKR(checked as boolean)} />
                  <Label htmlFor="isKR" className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Mark as Key Result (KR)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="published"
                    checked={published}
                    onCheckedChange={(checked) => setPublished(checked as boolean)}
                  />
                  <Label htmlFor="published" className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Publish immediately (members can see this task)
                  </Label>
                </div>

                {message && (
                  <Alert
                    className={message.includes("Error") ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}
                  >
                    <AlertDescription className={message.includes("Error") ? "text-red-800" : "text-green-800"}>
                      {message}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button type="submit" disabled={saving || selectedUsers.length === 0} className="flex-1">
                    {saving ? "Creating..." : published ? "Create & Publish Task" : "Save as Draft"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Team Members Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Assign To ({selectedUsers.length})
              </CardTitle>
              <CardDescription>
                {selectedTeam
                  ? `Members of ${teams.find((t) => t.id === selectedTeam)?.name}`
                  : "Select team members to assign this task"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredUsers.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No team members available</p>
                ) : (
                  filteredUsers.map((member) => (
                    <div
                      key={member.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedUsers.includes(member.id) ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"
                      }`}
                      onClick={() => handleUserToggle(member.id)}
                    >
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedUsers.includes(member.id)}
                          onChange={() => handleUserToggle(member.id)}
                        />
                        <div>
                          <div className="font-medium">{member.first_name} {member.last_name}</div>
                          <div className="text-sm text-gray-600">{member.personal_email || member.github_email}</div>
                          <div className="text-xs text-gray-500">
                            Team: {teams.find((t) => t.id === member.team_id)?.name || "No team"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
