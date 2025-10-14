"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Calendar, Users, Upload, Eye, EyeOff, History, FileText, Paperclip, Filter, X, Globe, Shield, Lock } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { useTranslation } from "@/lib/i18n"
import { SupabaseService } from "@/lib/supabase"
import type { Task, Employee, TaskAttachment, Team } from "@/types"


import ReactSelect from 'react-select'

const PRIORITY_COLORS = {
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 neon:bg-green-900 neon:text-primary",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 neon:bg-yellow-900 neon:text-accent",
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 neon:bg-red-900 neon:text-secondary",
}

// Helper function to safely get priority color
const getPriorityColor = (priority: any): string => {
  const validPriorities = ['low', 'medium', 'high'] as const
  if (validPriorities.includes(priority)) {
    return PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS]
  }
  return PRIORITY_COLORS.medium // default fallback
}

const STATUS_COLUMNS = {
  "not-started": "Not Started",
  "in-progress": "In Progress",
  done: "Done",
}

type FilterType = "all" | "mine" | "team"
type PriorityFilter = "all" | "low" | "medium" | "high"
type StatusFilter = "all" | "not-started" | "in-progress" | "done"
type SelectOption = {
  value: string  // uid
  label: string  // name
  email: string
}
type SelectTeamOption = {
  value: string
  label: string
}

export default function BoardPage() {
  const { account, employee, isAdmin } = useAuth()
  const { t } = useTranslation(employee?.preferred_language as any)
  const [tasks, setTasks] = useState<any[]>([])
  const [users, setUsers] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [showHistory, setShowHistory] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any | null>(null)

  // Filter states
  const [assigneeFilter, setAssigneeFilter] = useState<FilterType>("all")
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | "everyone" | "team-only" | "creator-only">("all")

  const router = useRouter()

  // Form states
  const [isCreating, setIsCreating] = useState(false)
  const [title, setTitle] = useState("")
  const [desc, setDesc] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium")
  const [visibility, setVisibility] = useState<"everyone" | "team-only" | "creator-only">("everyone")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])
  const [attachments, setAttachments] = useState<File[]>([])

  const [doneFilter, setDoneFilter] = useState("all");
  const DONE_FILTER_OPTIONS = [
    { label: "All", value: "all" },
    { label: "Within 1 Day", value: "1d" },
    { label: "Within 1 Week", value: "7d" },
    { label: "Within 1 Month", value: "30d" },
  ];

  //darkmode detection for multiselect
  const [isDarkMode, setIsDarkMode] = useState(false);
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains("dark");
      setIsDarkMode(isDark);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // Set initial state
    setIsDarkMode(document.documentElement.classList.contains("dark"));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!account || !employee) {
      router.push("/login")
      return
    }

    loadData()
  }, [account, employee, router])


  const [teamOptions, setTeamOptions] = useState<SelectTeamOption[]>([])

  useEffect(() => {
    const loadTeams = async () => {
      const { data: teams, error } = await SupabaseService.getTeams()
      if (teams && !error) {
        const options = teams.map((team) => ({
          value: team.id,
          label: team.name,
        }))
        setTeamOptions(options)
      } else if (error) {
        console.error("Error loading teams:", error)
      }
    }
    loadTeams()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load employees from database
      const { data: employeesData, error: employeesError } = await SupabaseService.getEmployees()
      if (employeesError) {
        console.error("Error loading employees:", employeesError)
      } else if (employeesData) {
        setUsers(employeesData)
      }

      // Load tasks from database with access control
      const { data: tasksData, error: tasksError } = await SupabaseService.getTasks(
        employee?.id,
        account?.access_level,
        employee?.team_id
      )
      if (tasksError) {
        console.error("Error loading tasks:", tasksError)
        setMessage("Failed to load tasks")
      } else if (tasksData) {
        console.log("Loaded tasks with access control:", tasksData.length)
        setTasks(tasksData)
      }
    } catch (error) {
      console.error("Error loading data:", error)
      setMessage("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const getTeamMembers = () => {
    if (!employee) return []
    return users.filter((u) => u.team_id === employee.team_id && u.id !== employee.id)
  }
  
  const teamMemberOptions: SelectOption[] = getTeamMembers().map((member) => ({
    value: member.id,
    label: `${member.first_name} ${member.last_name}`,
    email: member.personal_email || member.github_email || "",
  }))
  const [selectedOptions, setSelectedOptions] = useState<SelectOption[]>([])


  const [selectedTeamOptions, setSelectedTeamOptions] = useState<SelectTeamOption[]>([])

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !desc.trim() || !dueDate) {
      setMessage("Please fill in all required fields")
      return
    }

    if (!employee?.id) {
      setMessage("Employee information not available. Please try refreshing the page.")
      return
    }

    setSaving(true)
    setMessage("")

    try {
      console.log("Selected users:", selectedUsers);

       // Save directly to database only
       const dbTask = {
         title: title.trim(),
         description: desc.trim(),
         due_date: dueDate || undefined,
         admin_id: employee.id,
         publish_date: new Date().toISOString(),
         priority: priority,
         status: "not-started" as const,
         visibility: visibility,
         attachment_group_id: attachments.length > 0 ? `attachment_group_${Date.now()}` : undefined,
         progress: 0,
         is_key_result: false,
         published: true,
       }

       console.log("Saving task to database:", dbTask)
       
       const { data: dbData, error: dbError } = await SupabaseService.createTask(dbTask)
       if (dbError) {
         console.error("Database task save error:", dbError)
         setMessage("Failed to create task in database")
         return
       } else {
         console.log("Successfully saved task to database:", dbData)
       }

      setMessage("Task created successfully!")
      loadData()

      // Reset form
      setTitle("")
      setDesc("")
      setDueDate("")
      setPriority("medium")
      setVisibility("everyone")
      setSelectedUsers([])
      setAttachments([])
      setIsCreating(false)
    } catch (error) {
      setMessage("Error creating task")
      console.error("Error:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!taskId || taskId === 'undefined') {
      console.error('Invalid task ID for deletion:', taskId)
      setMessage('Cannot delete task: Invalid task ID')
      return
    }

    try {
      // Delete from database
      const { error } = await SupabaseService.deleteTask(taskId, employee?.id)
      
      if (error) {
        console.error('Failed to delete task from database:', error)
        setMessage('Failed to delete task from database')
        return
      }

      // Refresh data from database after successful deletion
      await loadData()
      setSelectedTask(null);
      setMessage('Task deleted successfully');
    } catch (error) {
      console.error('Error deleting task:', error)
      setMessage('Error deleting task')
    }
  };

  const handleStatusChange = async (
    taskId: string,
    newStatus: "not-started" | "in-progress" | "done",
    newProgress?: number
  ) => {
    // Update task status in database
    try {
      const progress = typeof newProgress === "number" ? newProgress : newStatus === "done" ? 100 : newStatus === "in-progress" ? 50 : 0;
      
      // Convert frontend status to database status
      const dbStatus = newStatus === "done" ? "completed" : newStatus;
      
      const updateData = {
        status: dbStatus as "not-started" | "in-progress" | "completed",
        progress: progress,
        completion_date: newStatus === "done" ? new Date().toISOString().split('T')[0] : undefined,
      }

      const { error } = await SupabaseService.updateTask(taskId, updateData)
      if (error) {
        console.error('Failed to update task status:', error)
        setMessage('Failed to update task status')
        return
      } else {
        console.log('Task status updated successfully')
        // Refresh tasks from database
        await loadData()
        
        // Update selected task for UI consistency
        setSelectedTask((prev: any) =>
          prev && prev.id === taskId ? { ...prev, status: dbStatus, progress } : prev
        )
      }
    } catch (error) {
      console.error('Error updating task status:', error)
      setMessage('Error updating task status')
    }
  }
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setAttachments((prev) => [...prev, ...files])
  }

  const getUserName = (uid: string) => {
    const user = users.find((u) => u.id === uid)
    return user ? `${user.first_name} ${user.last_name}` : "Unknown"
  }

  const getFilteredTasks = () => {
    let filteredTasks = tasks

    // Assignee filter
    if (assigneeFilter === "mine") {
      filteredTasks = filteredTasks.filter((task) => 
        task.admin_id === employee?.id
      )
    } else if (assigneeFilter === "team") {
      // Filter tasks created by team members
      filteredTasks = filteredTasks.filter((task) => {
        if (task.admin && task.admin.team_id === employee?.team_id) {
          return true
        }
        return false
      })
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filteredTasks = filteredTasks.filter((task) => task.priority === priorityFilter)
    }

    // Status filter - map frontend status to database status
    if (statusFilter !== "all") {
      filteredTasks = filteredTasks.filter((task) => {
        if (statusFilter === "done") {
          return task.status === "completed"
        }
        return task.status === statusFilter
      })
    }

    // Visibility filter
    if (visibilityFilter !== "all") {
      filteredTasks = filteredTasks.filter((task) => task.visibility === visibilityFilter)
    }

    // Done time filter: only apply when task is "completed"
    if (doneFilter !== "all") {
      const now = new Date()
      const thresholdMs =
        doneFilter === "1d" ? 1 * 86400000 :
        doneFilter === "7d" ? 7 * 86400000 :
        doneFilter === "30d" ? 30 * 86400000 : 0

      filteredTasks = filteredTasks.filter((task) => {
        const isDone = task.status === "completed"
        if (!isDone) return true
        
        const completedAt = task.completion_date
        if (!completedAt) return true
        
        const completedDate = new Date(completedAt)
        return now.getTime() - completedDate.getTime() <= thresholdMs
      })
    }

    return filteredTasks
  }
  

  const getTasksByStatus = () => {
    const filteredTasks = getFilteredTasks()
    const notStarted = filteredTasks.filter((task) => task.status === "not-started")
    const inProgress = filteredTasks.filter((task) => task.status === "in-progress")
    const done = filteredTasks.filter((task) => task.status === "completed")

    return { notStarted, inProgress, done }
  }

  const getCompletedTasks = () => {
    return tasks.filter((task) => 
      task.status === "completed" && 
      (task.completion_date)
    )
  }

  const clearFilters = () => {
    setAssigneeFilter("all")
    setPriorityFilter("all")
    setStatusFilter("not-started")
    setVisibilityFilter("all")
  }

  const hasActiveFilters =
    assigneeFilter !== "all" || priorityFilter !== "all" || statusFilter !== "not-started" || visibilityFilter !== "all"

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center neon:bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 neon:border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-300 neon:text-foreground">{t("loading")} task board...</p>
        </div>
      </div>
    )
  }

  const { notStarted, inProgress, done } = getTasksByStatus()
  const completedTasks = getCompletedTasks()

  const TaskCard = ({ task }: { task: any }) => (
    <Card
      className="mb-4 cursor-pointer hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700 neon:bg-card neon:border-primary neon:hover:glow-primary"
      onClick={() => setSelectedTask(task)}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg dark:text-white neon:text-foreground">{task.title}</CardTitle>
          <div className="flex gap-1">
            <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
            {task.visibility === "team-only" && (
              <Badge
                variant="outline"
                className="dark:border-gray-600 dark:text-gray-300 neon:border-secondary neon:text-secondary"
              >
                <Users className="h-3 w-3 mr-1" />
                Team
              </Badge>
            )}
            {task.visibility === "creator-only" && (
              <Badge
                variant="outline"
                className="dark:border-blue-600 dark:text-blue-300 neon:border-accent neon:text-accent"
              >
                <Eye className="h-3 w-3 mr-1" />
                Private
              </Badge>
            )}
          </div>
        </div>
        <CardDescription className="text-sm dark:text-gray-300 neon:text-muted-foreground">
          {task.description || task.desc || "No description"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="dark:text-gray-300 neon:text-foreground">
              Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : "No due date"}
            </span>
          </div>
          {task.due_date && new Date(task.due_date) < new Date() && task.status !== "completed" && (
            <Badge variant="destructive" className="neon:bg-secondary neon:text-background">
              Overdue
            </Badge>
          )}
        </div>

        {task.progress !== 0 && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium dark:text-gray-300 neon:text-foreground">Progress</span>
              <span className="text-sm dark:text-gray-300 neon:text-foreground">{task.progress}%</span>
            </div>
            <Progress value={task.progress} className="h-2 neon:bg-background">
              <div
                className="h-full bg-primary neon:bg-primary neon:glow-primary transition-all"
                style={{ width: `${task.progress}%` }}
              />
            </Progress>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <div className="flex flex-wrap gap-1">
            <Badge
              variant="outline"
              className="text-xs dark:border-gray-600 dark:text-gray-300 neon:border-accent neon:text-accent"
            >
              {getUserName(task.admin_id)}
            </Badge>
          </div>
        </div>

        {task.attachments && task.attachments.length > 0 && (
          <div className="flex items-center gap-2">
            <Paperclip className="h-4 w-4" />
            <span className="text-sm text-gray-600 dark:text-gray-400 neon:text-muted-foreground">
              {task.attachments.length} attachment(s)
            </span>
          </div>
        )}

        <div className="text-xs text-gray-500 dark:text-gray-400 neon:text-muted-foreground">
          Created by {getUserName(task.admin_id)} on{" "}
          {new Date(task.created_at).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 neon:bg-background">
      <div className="bg-white dark:bg-gray-800 neon:bg-card shadow-sm border-b dark:border-gray-700 neon:border-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white neon:text-primary">{t("taskBoard")}</h1>
              <p className="text-gray-600 dark:text-gray-300 neon:text-muted-foreground">
                Collaborative task management for the team
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setIsCreating(true)}
                className="neon:bg-primary neon:text-background neon:glow-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t("createTask")}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowHistory(true)}
                className="neon:border-border neon:text-foreground"
              >
                <History className="h-4 w-4 mr-2" />
                History
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Filter Chips */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Filter className="h-5 w-5 neon:text-primary" />
            <span className="font-medium text-gray-900 dark:text-white neon:text-foreground">Quick Filters:</span>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-red-600 hover:text-red-700">
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Assignee Filter */}
            <Button
              variant={assigneeFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setAssigneeFilter("all")}
            >
              All Tasks
            </Button>
            <Button
              variant={assigneeFilter === "mine" ? "default" : "outline"}
              size="sm"
              onClick={() => setAssigneeFilter("mine")}
            >
              My Tasks
            </Button>
            <Button
              variant={assigneeFilter === "team" ? "default" : "outline"}
              size="sm"
              onClick={() => setAssigneeFilter("team")}
            >
              Team Tasks
            </Button>

            {/* Priority Filter */}
            <Button
              variant={priorityFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setPriorityFilter("all")}
            >
              All Priority
            </Button>
            <Button
              variant={priorityFilter === "high" ? "destructive" : "outline"}
              size="sm"
              onClick={() => setPriorityFilter("high")}
            >
              High
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPriorityFilter("medium")}
              className={priorityFilter === "medium" ? "bg-yellow-500 text-white hover:bg-yellow-500 hover:text-white" : ""}
            >
              Medium
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPriorityFilter("low")}
              className={priorityFilter === "low" ? "bg-green-500 text-white hover:bg-green-500 hover:text-white" : ""}
            >
              Low
            </Button>

            {/* Visibility Filter */}
            <Button
              variant={visibilityFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setVisibilityFilter("all")}
            >
              All Visibility
            </Button>
            <Button
              variant={visibilityFilter === "everyone" ? "default" : "outline"}
              size="sm"
              onClick={() => setVisibilityFilter("everyone")}
            >
              <Globe className="h-3 w-3 mr-1" />
              Public
            </Button>
            <Button
              variant={visibilityFilter === "team-only" ? "default" : "outline"}
              size="sm"
              onClick={() => setVisibilityFilter("team-only")}
            >
              <Users className="h-3 w-3 mr-1" />
              Team Only
            </Button>
            <Button
              variant={visibilityFilter === "creator-only" ? "default" : "outline"}
              size="sm"
              onClick={() => setVisibilityFilter("creator-only")}
            >
              <Eye className="h-3 w-3 mr-1" />
              Creator Only
            </Button>

            {/* Status Filter */}
            <Button
              variant={statusFilter === "not-started" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("not-started")}
            >
              Not Started
            </Button>
            <Button
              variant={statusFilter === "in-progress" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("in-progress")}
            >
              In Progress
            </Button>
            <Button
              variant={statusFilter === "done" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("done")}
            >
              Done
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="dark:bg-gray-800 dark:border-gray-700 neon:bg-card neon:border-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium dark:text-white neon:text-foreground">
                {t("notStarted")}
              </CardTitle>
              <div className="h-4 w-4 rounded-full bg-gray-400 neon:bg-muted-foreground"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold dark:text-white neon:text-primary">{notStarted.length}</div>
              <p className="text-xs text-muted-foreground">Tasks waiting to begin</p>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700 neon:bg-card neon:border-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium dark:text-white neon:text-foreground">
                {t("inProgress")}
              </CardTitle>
              <div className="h-4 w-4 rounded-full bg-blue-400 neon:bg-accent"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold dark:text-white neon:text-accent">{inProgress.length}</div>
              <p className="text-xs text-muted-foreground">Tasks being worked on</p>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700 neon:bg-card neon:border-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium dark:text-white neon:text-foreground">{t("done")}</CardTitle>
              <div className="h-4 w-4 rounded-full bg-green-400 neon:bg-primary"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold dark:text-white neon:text-primary">{done.length}</div>
              <p className="text-xs text-muted-foreground">Tasks finished</p>
            </CardContent>
          </Card>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {Object.entries(STATUS_COLUMNS).map(([status, title]) => {
            // Map frontend status to database status for filtering
            const dbStatus = status === "done" ? "completed" : status
            const columnTasks = getFilteredTasks().filter((task) => task.status === dbStatus)
            return (
              <div key={status}>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-3 w-3 rounded-full ${
                        status === "not-started"
                          ? "bg-gray-400 neon:bg-muted-foreground"
                          : status === "in-progress"
                          ? "bg-blue-400 neon:bg-accent"
                          : "bg-green-400 neon:bg-primary"
                      }`}
                    ></div>
                    <h2 className="text-lg font-semibold dark:text-white neon:text-foreground">
                      {title} ({columnTasks.length})
                    </h2>
                  </div>

                  {status === "done" && (
                    <Select value={doneFilter} onValueChange={setDoneFilter}>
                      <SelectTrigger className="w-36 text-xs dark:bg-gray-800">
                        <SelectValue placeholder="Filter done tasks" />
                      </SelectTrigger>
                      <SelectContent>
                        {DONE_FILTER_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="space-y-4 min-h-[400px]">
                  {columnTasks.length === 0 ? (
                    <Card className="p-6 text-center text-gray-500 dark:text-gray-400 neon:text-muted-foreground border-dashed dark:bg-gray-800 dark:border-gray-600 neon:bg-card neon:border-border">
                      No tasks in this column
                    </Card>
                  ) : (
                    columnTasks.map((task, index) => <TaskCard key={task.id || `task-${index}`} task={task} />)
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Create Task Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-2xl dark:bg-gray-800 dark:border-gray-700 neon:bg-card neon:border-primary">
          <DialogHeader>
            <DialogTitle className="dark:text-white neon:text-primary">Create New Task</DialogTitle>
            <DialogDescription className="dark:text-gray-300 neon:text-muted-foreground">
              Add a new task to the board
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="dark:text-gray-200 neon:text-foreground">
                {t("taskTitle")}
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title"
                required
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white neon:bg-background neon:border-border neon:text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc" className="dark:text-gray-200 neon:text-foreground">
                Description
              </Label>
              <Textarea
                id="desc"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Describe the task"
                rows={3}
                required
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white neon:bg-background neon:border-border neon:text-foreground"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dueDate" className="dark:text-gray-200 neon:text-foreground">
                  {t("dueDate")}
                </Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white neon:bg-background neon:border-border neon:text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority" className="dark:text-gray-200 neon:text-foreground">
                  {t("priority")}
                </Label>
                <Select value={priority} onValueChange={(value: "low" | "medium" | "high") => setPriority(value)}>
                  <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white neon:bg-background neon:border-border neon:text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-700 dark:border-gray-600 neon:bg-card neon:border-border">
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="visibility" className="dark:text-gray-200 neon:text-foreground">
                Visibility
              </Label>
              <Select value={visibility} onValueChange={(value: "everyone" | "team-only" | "creator-only") => setVisibility(value)}>
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white neon:bg-background neon:border-border neon:text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700 dark:border-gray-600 neon:bg-card neon:border-border">
                  <SelectItem value="everyone">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      {t("everyone")} - Everyone can see
                    </div>
                  </SelectItem>
                  <SelectItem value="team-only">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {t("teamOnly")} - Restricted access
                    </div>
                  </SelectItem>
                  <SelectItem value="creator-only">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Task Creator Only - Only you can see
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignees" className="dark:text-gray-200 neon:text-foreground">
                {t("assignTo")} Team Members
              </Label>

              <ReactSelect
                isMulti
                options={teamMemberOptions}
                value={selectedOptions}
                onChange={(options) => {
                  setSelectedUsers(options.map((o) => o.value));
                  setSelectedOptions(options as SelectOption[]);
                }}
                className="react-select-container"
                classNamePrefix="react-select"
                getOptionLabel={(option) => `${option.label} (${option.email})`} // dropdown view
                formatOptionLabel={(option, { context }) =>
                  context === 'menu'
                    ? `${option.label} (${option.email})`
                    : option.label
                }
                styles={{
                  control: (base, state) => ({
                    ...base,
                    backgroundColor: isDarkMode ? "#374151" : "#fff", // gray-700 or white
                    borderColor: isDarkMode ? "#4B5563" : "#D1D5DB",
                    color: isDarkMode ? "#fff" : "#111827",
                    boxShadow: state.isFocused ? "0 0 0 1px #3B82F6" : "none",
                  }),
                  menu: (base) => ({
                    ...base,
                    backgroundColor: isDarkMode ? "#1F2937" : "#fff", // gray-800 or white
                    color: isDarkMode ? "#fff" : "#000",
                  }),
                  option: (base, { isFocused, isSelected }) => ({
                    ...base,
                    backgroundColor: isSelected
                      ? isDarkMode
                        ? "#2563EB"
                        : "#BFDBFE"
                      : isFocused
                      ? isDarkMode
                        ? "#374151"
                        : "#E5E7EB"
                      : "transparent",
                    color: isDarkMode ? "#fff" : "#000",
                  }),
                  multiValue: (base) => ({
                    ...base,
                    backgroundColor: isDarkMode ? "#4B5563" : "#E5E7EB",
                    color: isDarkMode ? "#fff" : "#111827",
                  }),
                  multiValueLabel: (base) => ({
                    ...base,
                    color: isDarkMode ? "#FFFFFF" : "#111827", 
                    fontWeight: 500,
                  }),
                  input: (base) => ({
                    ...base,
                    color: isDarkMode ? "#fff" : "#000",
                  }),
                  placeholder: (base) => ({
                    ...base,
                    color: isDarkMode ? "#9CA3AF" : "#6B7280",
                  }),
                }}
              />

            </div>

            <div className="space-y-2">
              <Label htmlFor="teams" className="dark:text-gray-200 neon:text-foreground">
                {t("assignTo")} Teams
              </Label>
              <ReactSelect
                isMulti
                options={teamOptions}
                value={selectedTeamOptions}
                onChange={(options) => {
                  setSelectedTeams(options.map((o) => o.value));
                  setSelectedTeamOptions(options as SelectTeamOption[]);
                }}
                className="react-select-container"
                classNamePrefix="react-select"
                getOptionLabel={(option) => option.label} // dropdown view
                formatOptionLabel={(option, { context }) =>
                  context === 'menu'
                    ? option.label
                    : option.label
                }
                styles={{
                  control: (base, state) => ({
                    ...base,
                    backgroundColor: isDarkMode ? "#374151" : "#fff", // gray-700 or white
                    borderColor: isDarkMode ? "#4B5563" : "#D1D5DB",
                    color: isDarkMode ? "#fff" : "#111827",
                    boxShadow: state.isFocused ? "0 0 0 1px #3B82F6" : "none",
                  }),
                  menu: (base) => ({
                    ...base,
                    backgroundColor: isDarkMode ? "#1F2937" : "#fff", // gray-800 or white
                    color: isDarkMode ? "#fff" : "#000",
                  }),
                  option: (base, { isFocused, isSelected }) => ({
                    ...base,
                    backgroundColor: isSelected
                      ? isDarkMode
                        ? "#2563EB"
                        : "#BFDBFE"
                      : isFocused
                      ? isDarkMode
                        ? "#374151"
                        : "#E5E7EB"
                      : "transparent",
                    color: isDarkMode ? "#fff" : "#000",
                  }),
                  multiValue: (base) => ({
                    ...base,
                    backgroundColor: isDarkMode ? "#4B5563" : "#E5E7EB",
                    color: isDarkMode ? "#fff" : "#111827",
                  }),
                  multiValueLabel: (base) => ({
                    ...base,
                    color: isDarkMode ? "#FFFFFF" : "#111827", 
                    fontWeight: 500,
                  }),
                  input: (base) => ({
                    ...base,
                    color: isDarkMode ? "#fff" : "#000",
                  }),
                  placeholder: (base) => ({
                    ...base,
                    color: isDarkMode ? "#9CA3AF" : "#6B7280",
                  }),
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="attachments" className="dark:text-gray-200 neon:text-foreground">
                Attachments
              </Label>
              <div className="flex items-center gap-4">
                <input id="attachments" type="file" multiple onChange={handleFileSelect} className="hidden" />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("attachments")?.click()}
                  className="neon:border-border neon:text-foreground dark:bg-gray-700"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Files
                </Button>
                {attachments.length > 0 && (
                  <span className="text-sm text-gray-600 dark:text-gray-400 neon:text-muted-foreground">
                    {attachments.length} file(s) selected
                  </span>
                )}
              </div>
              {attachments.length > 0 && (
                <div className="space-y-1">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="text-sm text-gray-600 dark:text-gray-400 neon:text-muted-foreground flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      {file.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {message && (
              <Alert
                className={
                  message.includes("Error")
                    ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900 neon:border-secondary neon:bg-card"
                    : "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900 neon:border-primary neon:bg-card"
                }
              >
                <AlertDescription
                  className={
                    message.includes("Error")
                      ? "text-red-800 dark:text-red-200 neon:text-secondary"
                      : "text-green-800 dark:text-green-200 neon:text-primary"
                  }
                >
                  {message}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={saving}
                className="flex-1 neon:bg-primary neon:text-background neon:glow-primary"
              >
                {saving ? "Creating..." : t("createTask")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreating(false)}
                className="neon:border-border neon:text-foreground"
              >
                {t("cancel")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Task Details Dialog */}
      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent className="max-w-2xl dark:bg-gray-800 dark:border-gray-700 neon:bg-card neon:border-primary">
          {selectedTask && (
            <>
              <DialogHeader>
                <DialogTitle className="dark:text-white neon:text-primary">{selectedTask.title}</DialogTitle>
                <DialogDescription className="dark:text-gray-300 neon:text-muted-foreground">
                  Task details and actions
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="dark:text-gray-200 neon:text-foreground">Description</Label>
                  <p className="text-sm text-gray-700 dark:text-gray-300 neon:text-muted-foreground mt-1">
                    {selectedTask.description || selectedTask.desc || "No description"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="dark:text-gray-200 neon:text-foreground">Due Date</Label>
                    <p className="text-sm text-gray-700 dark:text-gray-300 neon:text-muted-foreground mt-1">
                      {(selectedTask.dueDate || selectedTask.due_date) 
                        ? new Date(selectedTask.dueDate || selectedTask.due_date).toLocaleDateString()
                        : "No due date"}
                    </p>
                  </div>
                  <div>
                    <Label className="dark:text-gray-200 neon:text-foreground">Priority</Label>
                    <Badge className={`${getPriorityColor(selectedTask.priority)} mt-1`}>{selectedTask.priority}</Badge>
                  </div>
                </div>

                <div>
                  <Label className="dark:text-gray-200 neon:text-foreground">Status</Label>
                  <Select
                    value={selectedTask.status === "completed" ? "done" : selectedTask.status}
                    onValueChange={(value: "not-started" | "in-progress" | "done") =>
                      handleStatusChange(selectedTask.id, value)
                    }
                  >
                    <SelectTrigger className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white neon:bg-background neon:border-border neon:text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-700 dark:border-gray-600 neon:bg-card neon:border-border">
                      <SelectItem value="not-started">{t("notStarted")}</SelectItem>
                      <SelectItem value="in-progress">{t("inProgress")}</SelectItem>
                      <SelectItem value="done">{t("done")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedTask.status === "in-progress" && (
                  <div className="mt-4">
                    <Label className="dark:text-gray-200 neon:text-foreground">Update Progress (optional)</Label>
                    <input
                      type="text" // Use text for full control
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={selectedTask.progress}
                      onChange={(e) => {
                        let raw = e.target.value;

                        // Strip non-digit characters and leading zeros
                        raw = raw.replace(/\D/g, "").replace(/^0+(?=\d)/, "");

                        // Cap at 100
                        let sanitized = Math.min(Number(raw), 100);

                        handleStatusChange(selectedTask.id, selectedTask.status, sanitized);
                      }}
                      placeholder="Put in your progress (0-100)"
                      className="w-full mt-1 px-2 py-1 border rounded bg-white dark:bg-gray-700 dark:text-white neon:bg-background neon:text-foreground"
                    />
                  </div>
                )}
                {selectedTask.progress !== 0 && (
                  <div>
                    <Label className="dark:text-gray-200 neon:text-foreground">Progress</Label>
                    <div className="mt-1">
                      <Progress value={selectedTask.progress} className="h-3 neon:bg-background">
                        <div
                          className="h-full bg-primary neon:bg-primary neon:glow-primary transition-all"
                          style={{ width: `${selectedTask.progress}%` }}
                        />
                      </Progress>
                      <p className="text-sm text-gray-600 dark:text-gray-400 neon:text-muted-foreground mt-1">
                        {selectedTask.progress}% complete
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <Label className="dark:text-gray-200 neon:text-foreground">Created By</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <Badge
                      variant="outline"
                      className="dark:border-gray-600 dark:text-gray-300 neon:border-accent neon:text-accent"
                    >
                      {getUserName(selectedTask.admin_id)}
                    </Badge>
                  </div>
                </div>

                {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                  <div>
                    <Label className="dark:text-gray-200 neon:text-foreground">Attachments</Label>
                    <div className="space-y-2 mt-1">
                      {selectedTask.attachments.map((attachment: any) => (
                        <div
                          key={attachment.id}
                          className="flex items-center gap-2 p-2 border dark:border-gray-600 neon:border-border rounded"
                        >
                          <FileText className="h-4 w-4" />
                          <span className="text-sm dark:text-gray-300 neon:text-foreground">{attachment.name}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="ml-auto neon:border-border neon:text-foreground"
                          >
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button 
                  onClick={() => selectedTask?.id && handleDeleteTask(selectedTask.id)}
                  disabled={!selectedTask?.id}
                  className="neon:bg-primary neon:text-background neon:glow-primary bg-red-500 hover:bg-red-700 w-full disabled:bg-gray-400 disabled:cursor-not-allowed">
                  {selectedTask?.id ? 'Delete Task' : 'Cannot Delete (No ID)'}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Task History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-4xl dark:bg-gray-800 dark:border-gray-700 neon:bg-card neon:border-primary">
          <DialogHeader>
            <DialogTitle className="dark:text-white neon:text-primary">Task History</DialogTitle>
            <DialogDescription className="dark:text-gray-300 neon:text-muted-foreground">
              Completed tasks and their details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {completedTasks.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 neon:text-muted-foreground py-8">
                No completed tasks found
              </p>
            ) : (
              completedTasks.map((task) => (
                <Card
                  key={task.id}
                  className="dark:bg-gray-700 dark:border-gray-600 neon:bg-background neon:border-border"
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg dark:text-white neon:text-foreground">{task.title}</CardTitle>
                      <Badge
                        variant="outline"
                        className="text-green-600 dark:text-green-400 dark:border-green-600 neon:text-primary neon:border-primary"
                      >
                        Completed
                      </Badge>
                    </div>
                    <CardDescription className="dark:text-gray-300 neon:text-muted-foreground">
                      {task.description || task.desc || "No description"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium dark:text-gray-200 neon:text-foreground">Completed:</span>{" "}
                        <span className="dark:text-gray-300 neon:text-muted-foreground">
                          {task.completion_date 
                            ? new Date(task.completion_date).toLocaleDateString() 
                            : "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium dark:text-gray-200 neon:text-foreground">Priority:</span>{" "}
                        <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                      </div>
                      <div>
                        <span className="font-medium dark:text-gray-200 neon:text-foreground">Created by:</span>{" "}
                        <span className="dark:text-gray-300 neon:text-muted-foreground">
                          {getUserName(task.admin_id)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
