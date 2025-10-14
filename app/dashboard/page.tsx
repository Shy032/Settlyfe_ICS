"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import {
  CheckCircle,
  TrendingUp,
  Calendar,
  Target,
  Users,
  Award,
  Plus,
  ClipboardList,
  Settings,
  Filter,
  Briefcase,
  FileText,
  GraduationCap,
  Menu,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useTranslation } from "@/lib/i18n"
import { ProfileSettings } from "@/components/profile-settings"
import { EventsAnnouncements } from "@/components/events-announcements"
import { ResizableChat } from "@/components/resizable-chat"
import { Timer } from "@/components/timer"
import type { Task } from "@/types"
import { PollsSection } from "@/components/polls/polls-section"
import { LeaderboardWidget } from "@/components/leaderboard-widget"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { SupabaseService } from "@/lib/supabase"

// Legacy interface for backward compatibility
interface LegacyScoreData {
  weekId: string
  EC: number
  OC: number
  CC: number
  WCS: number
  checkMark: boolean
  createdAt: string
}

// Legacy task interface for backward compatibility
interface LegacyTask {
  id: string
  title: string
  desc: string
  dueDate: string
  ownerUids: string[]
  teamId: string
  createdBy: string
  createdAt: string
  progress: number
  isKR?: boolean
  published: boolean
  priority: "low" | "medium" | "high"
  status: "not-started" | "in-progress" | "done"
  visibility: "everyone" | "team-only"
  attachments?: any[]
  completedAt?: string
}

export default function Dashboard() {
  const { account, employee, isAdmin, isOwner, signOut, loading: authLoading } = useAuth()
  const { t } = useTranslation(employee?.preferred_language as any)
  const [scores, setScores] = useState<LegacyScoreData[]>([])
  const [tasks, setTasks] = useState<LegacyTask[]>([])
  const [loading, setLoading] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [taskFilter, setTaskFilter] = useState<"universal" | "team-only">("universal")
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [weeklyHours, setWeeklyHours] = useState(0)
  const router = useRouter()

  useEffect(() => {
    // Wait for auth to initialize
    if (authLoading) return

    if (!account || !employee) {
      router.push("/login")
      return
    }

    loadData()
  }, [account, employee, router, authLoading])

  const loadData = async () => {
    if (!account || !employee) return

    try {
      setLoading(true)
      
      // Load scores from Supabase
      const { data: scoresData, error: scoresError } = await SupabaseService.getWeeklyScores(employee.id, 12)
      if (scoresError) {
        console.error("Error loading scores:", scoresError)
      } else if (scoresData && scoresData.length > 0) {
        // Convert to legacy format for compatibility
        const legacyScores = scoresData.map(score => ({
          weekId: `${score.year}-W${score.week_number.toString().padStart(2, '0')}`,
          EC: Number(score.effort_credit),
          OC: Number(score.outcome_credit),
          CC: Number(score.collab_credit),
          WCS: Number(score.wcs),
          checkMark: score.checkmarks > 0,
          createdAt: score.created_at,
        }))
        setScores(legacyScores)
      } else {
        // No scores exist - show empty state
        setScores([])
      }

      // Load tasks from Supabase
      const { data: tasksData, error: tasksError } = await SupabaseService.getTasks(employee.team_id, employee.id)
      if (tasksError) {
        console.error("Error loading tasks:", tasksError)
      }
      
      if (tasksData && tasksData.length > 0) {
        // Convert to legacy format for compatibility
        const legacyTasks = tasksData.map(task => ({
          id: task.id,
          title: task.title,
          desc: task.description || '',
          dueDate: task.due_date || '',
          ownerUids: [task.admin_id], // For now, admin is the owner
          teamId: employee.team_id || '',
          createdBy: task.admin_id,
          createdAt: task.created_at,
          progress: 0, // Default for now
          published: true,
          priority: task.priority as "low" | "medium" | "high",
          status: task.status === 'completed' ? 'done' : task.status as "not-started" | "in-progress" | "done",
          visibility: (task.visibility === 'everyone' ? 'everyone' : 'team-only') as "everyone" | "team-only",
          isKR: false, // Default for now
        })) as LegacyTask[]
        
        const userTasks =
          isAdmin() || isOwner()
            ? legacyTasks.filter((task) => task.published)
            : legacyTasks.filter((task) => task.published && task.ownerUids.includes(account.id || ""))
        setTasks(userTasks)
      } else {
        // Fallback: try to load from localStorage
        const localTasks = localStorage.getItem("tasks")
        if (localTasks) {
          const localTasksData = JSON.parse(localTasks) as any[] // Use any to avoid type issues
          // Convert to LegacyTask format
          const convertedTasks = localTasksData.map(task => ({
            id: task.id,
            title: task.title,
            desc: task.desc || task.description || '',
            dueDate: task.dueDate || task.due_date || '',
            ownerUids: task.ownerUids || [task.admin_id] || [],
            teamId: task.teamId || employee.team_id || '',
            createdBy: task.createdBy || task.admin_id || '',
            createdAt: task.createdAt || task.created_at || new Date().toISOString(),
            progress: task.progress || 0,
            published: task.published !== false, // Default to true if not specified
            priority: task.priority || 'medium',
            status: task.status === 'completed' ? 'done' : (task.status || 'not-started'),
            visibility: task.visibility === 'everyone' ? 'everyone' : 'team-only',
            isKR: task.isKR || false,
          })) as LegacyTask[]
          
          const userTasks =
            isAdmin() || isOwner()
              ? convertedTasks.filter((task) => task.published)
              : convertedTasks.filter((task) => task.published && task.ownerUids.includes(account.id || ""))
          setTasks(userTasks)
        } else {
          // No tasks exist - show empty state
          setTasks([])
        }
      }

      // Calculate weekly hours
      const hours = calculateWeeklyHours()
      setWeeklyHours(hours)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateQS = () => {
    if (scores.length === 0) return 0
    const sum = scores.reduce((acc, score) => acc + score.WCS, 0)
    return (sum / scores.length).toFixed(2)
  }

  const getCheckMarkCount = () => {
    return scores.filter((score) => score.checkMark).length
  }

  const calculateWeeklyHours = () => {
    if (!account || !employee) return 0
    
    // Get current week's start and end dates
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay()) // Start of this week (Sunday)
    weekStart.setHours(0, 0, 0, 0)
    
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6) // End of this week (Saturday)
    weekEnd.setHours(23, 59, 59, 999)
    
    // Load hour entries from localStorage
    const userEntries = localStorage.getItem(`hourEntries_${employee.id}`)
    if (!userEntries) return 0
    
    try {
      const entries = JSON.parse(userEntries)
      const weeklyTotal = entries
        .filter((entry: any) => {
          const entryDate = new Date(entry.date)
          return entryDate >= weekStart && entryDate <= weekEnd
        })
        .reduce((total: number, entry: any) => total + (entry.hours || 0), 0)
      
      return weeklyTotal
    } catch (error) {
      console.error("Error calculating weekly hours:", error)
      return 0
    }
  }

  const getFilteredTasks = () => {
    return tasks.filter((task) => {
      if (taskFilter === "universal") {
        return task.visibility === "everyone"
      } else {
        return task.visibility === "team-only"
      }
    })
  }

  const handleWeekClick = (weekId: string) => {
    router.push(`/updates/week/${weekId}`)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 neon:bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            {t("loading")} {t("dashboard").toLowerCase()}...
          </p>
        </div>
      </div>
    )
  }

  if (!account || !employee) {
    return null
  }

  const currentWeekScore = scores[0]
  const chartData = scores
    .slice()
    .reverse()
    .map((score) => ({
      week: score.weekId.replace(/202[4-5]-W/, "W"),
      WCS: score.WCS,
    }))

  const filteredTasks = getFilteredTasks()

  // Mobile navigation menu items
  const navigationItems = [
    { href: "/calendar", icon: Calendar, label: t("calendar") },
    { href: "/board", icon: ClipboardList, label: t("taskBoard") },
    { href: "/updates", icon: FileText, label: t("dailyUpdates") },
    { href: "/teams/directory", icon: Briefcase, label: "Team Directory" },
    { href: "/documents", icon: FileText, label: isAdmin() || isOwner() ? "Manage Documents" : "Documents" },
    { href: "/training", icon: GraduationCap, label: "Training" },
  ]

  if (!isAdmin() && !isOwner()) {
    navigationItems.push({ href: "/pto", icon: Calendar, label: t("ptoRequests") })
  }

  if (isAdmin() || isOwner()) {
    navigationItems.push(
      { href: "/team", icon: Users, label: "Manage Team" },
      { href: "/assign", icon: Plus, label: "Assign Tasks" },
      { href: "/admin", icon: Settings, label: "Admin Panel" },
      { href: "/decision", icon: FileText, label: "Decision Log" },
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 neon:bg-black">
      {/* Mobile-optimized header */}
      <div className="bg-white dark:bg-gray-800 neon:bg-black shadow-sm border-b dark:border-gray-700 neon:border-gray-800">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            {/* Mobile: User info + menu button */}
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 sm:h-10 sm:w-10 cursor-pointer" onClick={() => setShowSettings(true)}>
                <AvatarImage
                  src={employee?.profile_photo || `https://avatar.vercel.sh/${account?.login_email || 'user'}.png`}
                  alt={`${employee?.first_name || ''} ${employee?.last_name || ''}`}
                />
                <AvatarFallback>
                  {(employee?.first_name?.substring(0, 1) || 'U').toUpperCase()}
                  {(employee?.last_name?.substring(0, 1) || 'U').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white neon:text-white truncate select-none">
                  {(employee?.first_name && employee?.last_name) 
                    ? `${employee.first_name} ${employee.last_name}` 
                    : account?.login_email || 'User'}
                </h1>
                <div className="flex items-center gap-2">
                  {employee?.title && (
                    <span className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 neon:text-accent truncate">
                      {employee.title}
                    </span>
                  )}
                  <Badge
                    variant={(account?.access_level === "admin" || account?.access_level === "owner") ? "default" : "outline"}
                    className="dark:border-gray-600 dark:text-gray-300 neon:border-gray-700 text-xs"
                  >
                    {account?.access_level || 'member'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Desktop: Action buttons */}
            <div className="hidden lg:flex flex-wrap gap-2">
              {navigationItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button variant="outline" size="sm">
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Button>
                </Link>
              ))}
            </div>

            {/* Mobile: Menu button and settings */}
            <div className="flex items-center gap-2 lg:hidden">
              <Button variant="ghost" size="sm" onClick={() => setShowSettings(true)}>
                <Settings className="h-4 w-4" />
              </Button>
              <Sheet open={showMobileMenu} onOpenChange={setShowMobileMenu}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <div className="py-6">
                    <h2 className="text-lg font-semibold mb-4">Navigation</h2>
                    <div className="space-y-3">
                      {navigationItems.map((item) => (
                        <Link key={item.href} href={item.href}>
                          <Button
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => setShowMobileMenu(false)}
                          >
                            <item.icon className="h-4 w-4 mr-3" />
                            {item.label}
                          </Button>
                        </Link>
                      ))}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>

      {/* Main content with mobile-optimized padding */}
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-6 sm:space-y-8">
            <EventsAnnouncements />
            <Timer />
            <PollsSection />
            <LeaderboardWidget currentUser={employee} />

            {/* Task Progress Card */}
            <Card className="dark:bg-gray-800 dark:border-gray-700 neon:bg-card neon:border-gray-800">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div>
                    <CardTitle className="dark:text-white neon:text-white text-lg sm:text-xl">
                      Active Tasks Progress
                    </CardTitle>
                    <CardDescription className="dark:text-gray-300 neon:text-gray-300">
                      Current task completion status
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto">
                    <Filter className="h-4 w-4 flex-shrink-0" />
                    <Button
                      variant={taskFilter === "universal" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTaskFilter("universal")}
                      className="whitespace-nowrap"
                    >
                      {t("universalTasks")}
                    </Button>
                    <Button
                      variant={taskFilter === "team-only" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTaskFilter("team-only")}
                      className="whitespace-nowrap"
                    >
                      {t("groupOnlyTasks")}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {filteredTasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400 neon:text-gray-400">
                    No {taskFilter === "universal" ? "universal" : "team-only"} tasks found
                  </div>
                ) : (
                  filteredTasks.map((task) => (
                    <div key={task.id} className="space-y-2">
                      <div className="flex justify-between items-start gap-4">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium dark:text-white neon:text-white truncate">{task.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300 neon:text-gray-300">
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {task.isKR && (
                            <Badge
                              variant="secondary"
                              className="dark:bg-gray-700 dark:text-gray-300 neon:bg-muted neon:text-white"
                            >
                              <Target className="h-3 w-3 mr-1" />
                              KR
                            </Badge>
                          )}
                          <span className="text-sm font-medium dark:text-white neon:text-white">{task.progress}%</span>
                        </div>
                      </div>
                      <Progress value={task.progress} className="h-3" />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Score cards - responsive grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4">
              <Card className="dark:bg-gray-800 dark:border-gray-700 neon:bg-card neon:border-gray-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium dark:text-white neon:text-white">
                    {t("currentWCS")}
                  </CardTitle>
                  <Award className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold dark:text-white neon:text-white">
                    {currentWeekScore?.WCS.toFixed(2) || "0.00"}
                  </div>
                  <p className="text-xs text-muted-foreground">{t("thisWeekScore")}</p>
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-800 dark:border-gray-700 neon:bg-card neon:border-gray-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium dark:text-white neon:text-white">
                    {t("quarterScore")}
                  </CardTitle>
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold dark:text-white neon:text-white">{calculateQS()}</div>
                  <p className="text-xs text-muted-foreground">{t("averageRecent")}</p>
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-800 dark:border-gray-700 neon:bg-card neon:border-gray-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium dark:text-white neon:text-white">
                    Check Mark Count
                  </CardTitle>
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold dark:text-white neon:text-white">
                    {getCheckMarkCount()}
                  </div>
                  <p className="text-xs text-muted-foreground">Total check marks earned</p>
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-800 dark:border-gray-700 neon:bg-card neon:border-gray-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium dark:text-white neon:text-white">
                    {t("effortCredit")}
                  </CardTitle>
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold dark:text-white neon:text-white">
                    {currentWeekScore?.EC.toFixed(2) || "0.00"}
                  </div>
                  <p className="text-xs text-muted-foreground">{t("currentWeekEC")}</p>
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-800 dark:border-gray-700 neon:bg-card neon:border-gray-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium dark:text-white neon:text-white">
                    {t("outcomeCredit")}
                  </CardTitle>
                  <Target className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold dark:text-white neon:text-white">
                    {currentWeekScore?.OC.toFixed(2) || "0.00"}
                  </div>
                  <p className="text-xs text-muted-foreground">{t("currentWeekOC")}</p>
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-800 dark:border-gray-700 neon:bg-card neon:border-gray-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium dark:text-white neon:text-white">
                    {t("collabCredit")}
                  </CardTitle>
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold dark:text-white neon:text-white">
                    {currentWeekScore?.CC.toFixed(2) || "0.00"}
                  </div>
                  <p className="text-xs text-muted-foreground">{t("currentWeekCC")}</p>
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-800 dark:border-gray-700 neon:bg-card neon:border-gray-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium dark:text-white neon:text-white">
                    Weekly Hours
                  </CardTitle>
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold dark:text-white neon:text-white">
                    {weeklyHours.toFixed(1)}h
                  </div>
                  <p className="text-xs text-muted-foreground">This week's work time</p>
                </CardContent>
              </Card>
            </div>

            {/* Chart - mobile optimized height */}
            <Card className="dark:bg-gray-800 dark:border-gray-700 neon:bg-card neon:border-gray-800">
              <CardHeader>
                <CardTitle className="dark:text-white neon:text-white text-lg sm:text-xl">
                  WCS Trend (Last 12 Weeks)
                </CardTitle>
                <CardDescription className="dark:text-gray-300 neon:text-gray-300">
                  Your Weekly Credit Score over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="dark:stroke-gray-600" />
                      <XAxis dataKey="week" className="dark:fill-gray-300 neon:fill-gray-300" fontSize={12} />
                      <YAxis domain={[0, 1]} className="dark:fill-gray-300 neon:fill-gray-300" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--background)",
                          border: "1px solid var(--border)",
                          borderRadius: "6px",
                          fontSize: "12px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="WCS"
                        stroke="#2563eb"
                        strokeWidth={2}
                        dot={{ fill: "#2563eb", strokeWidth: 2, r: 4 }}
                        connectNulls={true}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Score history table - mobile scrollable */}
            <Card className="dark:bg-gray-800 dark:border-gray-700 neon:bg-card neon:border-gray-800">
              <CardHeader>
                <CardTitle className="dark:text-white neon:text-white text-lg sm:text-xl">Score History</CardTitle>
                <CardDescription className="dark:text-gray-300 neon:text-gray-300">
                  Click on any week to view daily uploads and progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="dark:border-gray-700 neon:border-gray-800">
                        <TableHead className="dark:text-gray-300 neon:text-gray-300 text-xs sm:text-sm">Week</TableHead>
                        <TableHead className="dark:text-gray-300 neon:text-gray-300 text-xs sm:text-sm">EC</TableHead>
                        <TableHead className="dark:text-gray-300 neon:text-gray-300 text-xs sm:text-sm">OC</TableHead>
                        <TableHead className="dark:text-gray-300 neon:text-gray-300 text-xs sm:text-sm">CC</TableHead>
                        <TableHead className="dark:text-gray-300 neon:text-gray-300 text-xs sm:text-sm">WCS</TableHead>
                        <TableHead className="dark:text-gray-300 neon:text-gray-300 text-xs sm:text-sm">
                          Status
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scores.map((score) => (
                        <TableRow
                          key={score.weekId}
                          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-700 neon:hover:bg-gray-900 neon:border-gray-800"
                          onClick={() => handleWeekClick(score.weekId)}
                        >
                          <TableCell className="font-medium dark:text-white neon:text-white text-xs sm:text-sm whitespace-nowrap">
                            {score.weekId}
                          </TableCell>
                          <TableCell className="dark:text-gray-300 neon:text-gray-300 text-xs sm:text-sm">
                            {score.EC.toFixed(2)}
                          </TableCell>
                          <TableCell className="dark:text-gray-300 neon:text-gray-300 text-xs sm:text-sm">
                            {score.OC.toFixed(2)}
                          </TableCell>
                          <TableCell className="dark:text-gray-300 neon:text-gray-300 text-xs sm:text-sm">
                            {score.CC.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={score.WCS >= 0.8 ? "default" : score.WCS >= 0.6 ? "secondary" : "destructive"}
                              className="dark:border-gray-600 neon:border-gray-700 text-xs"
                            >
                              {score.WCS.toFixed(2)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {score.checkMark && (
                              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 neon:text-primary" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ProfileSettings open={showSettings} onOpenChange={setShowSettings} />
      <ResizableChat />
    </div>
  )
}
