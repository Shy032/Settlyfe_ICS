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
import { Plus, Calendar, Users, Upload, Eye, EyeOff, History, FileText, Paperclip, Filter, X } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { useTranslation } from "@/lib/i18n"
import { SupabaseService } from "@/lib/supabase"
import type { Task, User, TaskAttachment, Team } from "@/types"


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
  const { user, isAdmin } = useAuth()
  const { t } = useTranslation(user?.preferredLanguage as any)
  const [tasks, setTasks] = useState<any[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [showHistory, setShowHistory] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any | null>(null)

  // Filter states
  const [assigneeFilter, setAssigneeFilter] = useState<FilterType>("all")
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | "everyone" | "team-only">("all")

  const router = useRouter()

  // Form states
  const [isCreating, setIsCreating] = useState(false)
  const [title, setTitle] = useState("")
  const [desc, setDesc] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium")
  const [visibility, setVisibility] = useState<"everyone" | "team-only">("everyone")
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
    if (!user) {
      router.push("/login")
      return
    }

    loadData()
    setLoading(false)
  }, [user, router])


  const [teamOptions, setTeamOptions] = useState<SelectTeamOption[]>([])

  useEffect(() => {
    const teams = getTeams()
    const options = teams.map((team) => ({
      value: team.id,
      label: team.name,
    }))
    setTeamOptions(options)
  }, [])

  const loadData = () => {
    if (typeof window !== "undefined") {
      // Load users
      const storedUsers = localStorage.getItem("allUsers")
      if (storedUsers) {
        setUsers(JSON.parse(storedUsers))
      }

      // Load tasks
      const storedTasks = localStorage.getItem("tasks")
      if (storedTasks) {
        const tasksData = JSON.parse(storedTasks) as any[] // Use any to avoid complex type issues
        // Filter tasks based on visibility and user permissions
        const visibleTasks = tasksData.filter((task: any) => {
          if (!user) return false

          if (task.visibility === "everyone") {
            return true
          }

          if (task.visibility === "team-only") {
            if (user.accessLevel === "admin" || user.accessLevel === "owner") {
              return true
            }
            // Check team membership using both old and new fields
            if ((task.teamId && task.teamId === user.teamId) || 
                (task.team_id && task.team_id === user.teamId)) {
              return true
            }
            // Check if user is assigned using both old and new fields
            if ((task.ownerUids && task.ownerUids.includes(user.accountId)) ||
                (task.adminId === user.accountId) ||
                (task.admin_id === user.accountId)) {
              return true
            }
          }
          return false
        })
        setTasks(visibleTasks as any[]) // Type assertion for compatibility
      }
    }
  }

  const getTeamMembers = () => {

    return users.filter((u) => u.teamId === user?.teamId && u.accountId !== user?.accountId)

  }
  const teamMemberOptions: SelectOption[] = getTeamMembers().map((member) => ({
    value: member.uid,
    label: member.name,
    email: member.email,
  }))
  const [selectedOptions, setSelectedOptions] = useState<SelectOption[]>([])

  const getTeams = (): Team[] => {
    if (typeof window === "undefined") return []
    const raw = localStorage.getItem("teams")
    if (!raw) return []
    return JSON.parse(raw)
  }
  const [selectedTeamOptions, setSelectedTeamOptions] = useState<SelectTeamOption[]>([])

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !desc.trim() || !dueDate) {
      setMessage("Please fill in all required fields")
      return
    }

    setSaving(true)
    setMessage("")

    try {
      // Simulate file uploads - simplified format
      const taskAttachments = attachments.map((file, index) => ({
        id: `attachment_${Date.now()}_${index}`,
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type,
        uploadedBy: user?.accountId || "",
        uploadedAt: new Date().toISOString(),
      }))

      // Create task in both legacy and new schema format for compatibility
      const newTask = {
        //id: `task_${Date.now()}`,
        title,

        description: desc,
        desc: desc, // Keep both for compatibility
        dueDate: dueDate,
        due_date: dueDate, // New schema field
        adminId: user?.accountId || "",
        admin_id: user?.employeeId || "", // New schema field
        ownerUids: selectedUsers.length > 0 ? selectedUsers : [user?.accountId || ""], // Legacy field
        teamId: user?.teamId || "settlyfe", // Legacy field
        //createdBy: user?.accountId || "", // Legacy field
        //createdBy: user?.accountId || "", // Legacy field
        publishDate: new Date().toISOString(),
        publish_date: new Date().toISOString(), // New schema field

        createdAt: new Date().toISOString(),
        created_at: new Date().toISOString(), // New schema field
        progress: 0, // Legacy field
        published: true, // Legacy field
        priority,
        status: "not-started" as const, // Explicit type assertion
        visibility,
        attachments: taskAttachments, // Legacy field
        attachmentGroupId: attachments.length > 0 ? `attachment_group_${Date.now()}` : undefined,
        attachment_group_id: attachments.length > 0 ? `attachment_group_${Date.now()}` : undefined, // New schema field
        isKR: false, // Legacy field
      }
      console.log("Selected users:", selectedUsers);
      console.log("New Task Data:", newTask);

      // Save to localStorage for backwards compatibility - use any to avoid type conflicts
      const existingTasks = localStorage.getItem("tasks")
      const tasksArray: any[] = existingTasks ? JSON.parse(existingTasks) : []
      tasksArray.push(newTask)
      localStorage.setItem("tasks", JSON.stringify(tasksArray))

      // Save to Supabase database (non-blocking) - use only new schema fields
      setTimeout(async () => {
        try {
          /**const dbTask = {
            id: newTask.id,
            title: newTask.title,
            description: newTask.description,
            due_date: newTask.due_date,
            admin_id: newTask.admin_id,
            publish_date: newTask.publish_date,
            priority: newTask.priority,
            status: newTask.status,
            visibility: newTask.visibility,
            attachment_group_id: newTask.attachment_group_id,
            created_at: newTask.created_at,
          }**/
          const dbTask = {
            //id: newTask.id,
            title: newTask.title ?? "Untitled Task",
            description: newTask.description ?? "",
            due_date: newTask.due_date || null,
            admin_id: newTask.admin_id || "unknown_admin",
            publish_date: newTask.publish_date || new Date().toISOString(),
            priority: newTask.priority || "medium",
            status: newTask.status || "not-started",
            visibility: newTask.visibility || "everyone",
            attachment_group_id: newTask.attachment_group_id || null,
            created_at: newTask.created_at || new Date().toISOString(),
          }


          console.log("Attempting to save task to database:", dbTask)
          
          const { data: dbData, error: dbError } = await SupabaseService.createTask(dbTask)
          if (dbError) {
            console.error("Database task save error:", dbError)
          } else {
            console.log("Successfully saved task to database:", dbData)
          }
        } catch (dbErr) {
          console.error("Database task save failed:", dbErr)
        }
      },100)

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

  const handleDeleteTask = (taskId: string) => {
  const updatedTasks = tasks.filter((task) => task.id !== taskId);
  setTasks(updatedTasks);

  const storedTasks = localStorage.getItem("tasks");
  if (storedTasks) {
    const allTasks = JSON.parse(storedTasks) as Task[];
    const updatedAllTasks = allTasks.filter((task) => task.id !== taskId);
    localStorage.setItem("tasks", JSON.stringify(updatedAllTasks));
  }

  setSelectedTask(null);
};

  const handleStatusChange = (
    taskId: string,
    newStatus: "not-started" | "in-progress" | "done",
    newProgress?: number
  ) => {
    const updatedTasks = tasks.map((task) => {
      if (task.id === taskId) {
        const progress =
          typeof newProgress === "number"
            ? newProgress
            : newStatus === "done"
            ? 100
            : 0;

        return {
          ...task,

          status: newStatus === "done" ? "completed" : newStatus,
          progress: newStatus === "done" ? 100 : newStatus === "in-progress" ? 50 : 0,
          completedAt: newStatus === "done" ? new Date().toISOString() : undefined,
          completionDate: newStatus === "done" ? new Date().toISOString() : undefined,
        }
        return updatedTask
      }
      return task
    })
    
    setSelectedTask((prev: any) =>
      prev && prev.id === taskId ? { ...prev, status: newStatus === "done" ? "completed" : newStatus } : prev
    )


    setTasks(updatedTasks);

    const storedTasks = localStorage.getItem("tasks");
    if (storedTasks) {
      const allTasks = JSON.parse(storedTasks) as Task[];
      const updatedAllTasks = allTasks.map((task) => {
        if (task.id === taskId) {
          const progress =
            typeof newProgress === "number"
              ? newProgress
              : newStatus === "done"
              ? 100
              : 0;

          return {
            ...task,
            status: newStatus === "done" ? "completed" : newStatus,
            progress: newStatus === "done" ? 100 : newStatus === "in-progress" ? 50 : 0,
            completedAt: newStatus === "done" ? new Date().toISOString() : undefined,
            completionDate: newStatus === "done" ? new Date().toISOString() : undefined,
          }

        }
        return task;
      });
      localStorage.setItem("tasks", JSON.stringify(updatedAllTasks));
    }
  }
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setAttachments((prev) => [...prev, ...files])
  }

  const getUserName = (uid: string) => {
    return users.find((u) => u.accountId === uid)?.name || "Unknown"
  }

  const getFilteredTasks = () => {
    let filteredTasks = tasks

    // Assignee filter - handle both legacy and new fields
    if (assigneeFilter === "mine") {
      filteredTasks = filteredTasks.filter((task) => 
        (task.ownerUids && task.ownerUids.includes(user?.accountId || "")) ||
        task.adminId === user?.accountId
      )
    } else if (assigneeFilter === "team") {
      filteredTasks = filteredTasks.filter((task) => 
        (task.teamId && task.teamId === user?.teamId) ||
        true // For now, show all team tasks
      )
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filteredTasks = filteredTasks.filter((task) => task.priority === priorityFilter)
    }

    // Status filter - handle both "done" and "completed"
    if (statusFilter !== "all") {
      filteredTasks = filteredTasks.filter((task) => {
        if (statusFilter === "done") {
          return task.status === "done" || task.status === "completed"
        }
        return task.status === statusFilter
      })
    }

    // Visibility filter
    if (visibilityFilter !== "all") {
      filteredTasks = filteredTasks.filter((task) => task.visibility === visibilityFilter)
    }

    // Done time filter: only apply when task is "done" or "completed"
    if (doneFilter !== "all") {
      const now = new Date()
      const thresholdMs =
        doneFilter === "1d" ? 1 * 86400000 :
        doneFilter === "7d" ? 7 * 86400000 :
        doneFilter === "30d" ? 30 * 86400000 : 0

      filteredTasks = filteredTasks.filter((task) => {
        const isDone = task.status === "done" || task.status === "completed"
        if (!isDone) return true
        
        const completedAt = task.completedAt || task.completionDate
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
    const done = filteredTasks.filter((task) => task.status === "done" || task.status === "completed")

    return { notStarted, inProgress, done }
  }

  const getCompletedTasks = () => {
    const storedTasks = localStorage.getItem("tasks")
    if (storedTasks) {
      const allTasks = JSON.parse(storedTasks) as any[]
      return allTasks.filter((task) => 
        (task.status === "done" || task.status === "completed") && 
        (task.completedAt || task.completionDate)
      )
    }
    return []
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
                <EyeOff className="h-3 w-3 mr-1" />
                Team
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
              Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date"}
            </span>
          </div>
          {task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done" && task.status !== "completed" && (
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
            {(task.ownerUids || [task.adminId || task.admin_id]).filter(Boolean).map((uid: string) => (
              <Badge
                key={uid}
                variant="outline"
                className="text-xs dark:border-gray-600 dark:text-gray-300 neon:border-accent neon:text-accent"
              >
                {getUserName(uid)}
              </Badge>
            ))}
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
          Created by {getUserName(task.createdBy || task.adminId || task.admin_id)} on{" "}
          {new Date(task.createdAt || task.created_at).toLocaleDateString()}
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
              <Eye className="h-3 w-3 mr-1" />
              Public
            </Button>
            <Button
              variant={visibilityFilter === "team-only" ? "default" : "outline"}
              size="sm"
              onClick={() => setVisibilityFilter("team-only")}
            >
              <EyeOff className="h-3 w-3 mr-1" />
              Team Only
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
            const columnTasks = getFilteredTasks().filter((task) => task.status === status)
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
                    columnTasks.map((task) => <TaskCard key={task.id} task={task} />)
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
              <Select value={visibility} onValueChange={(value: "everyone" | "team-only") => setVisibility(value)}>
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white neon:bg-background neon:border-border neon:text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700 dark:border-gray-600 neon:bg-card neon:border-border">
                  <SelectItem value="everyone">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      {t("everyone")} - Everyone can see
                    </div>
                  </SelectItem>
                  <SelectItem value="team-only">
                    <div className="flex items-center gap-2">
                      <EyeOff className="h-4 w-4" />
                      {t("teamOnly")} - Restricted access
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
                    value={selectedTask.status}
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
                  <Label className="dark:text-gray-200 neon:text-foreground">Assignees</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(selectedTask.ownerUids || []).map((uid: string) => (
                      <Badge
                        key={uid}
                        variant="outline"
                        className="dark:border-gray-600 dark:text-gray-300 neon:border-accent neon:text-accent"
                      >
                        {getUserName(uid)}
                      </Badge>
                    ))}
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

                <Button onClick={() => selectedTask && handleDeleteTask(selectedTask.id)}
                className="neon:bg-primary neon:text-background neon:glow-primary bg-red-500 hover:bg-red-700 w-full">
                  Delete Task
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
                          {(task.completedAt || task.completionDate || task.completion_date) 
                            ? new Date(task.completedAt || task.completionDate || task.completion_date).toLocaleDateString() 
                            : "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium dark:text-gray-200 neon:text-foreground">Priority:</span>{" "}
                        <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                      </div>
                      <div>
                        <span className="font-medium dark:text-gray-200 neon:text-foreground">Assignees:</span>{" "}
                        <span className="dark:text-gray-300 neon:text-muted-foreground">
                          {(task.ownerUids || [task.adminId || task.admin_id]).filter(Boolean).map((uid: string) => getUserName(uid)).join(", ")}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium dark:text-gray-200 neon:text-foreground">Created by:</span>{" "}
                        <span className="dark:text-gray-300 neon:text-muted-foreground">
                          {getUserName(task.createdBy || task.adminId || task.admin_id)}
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
