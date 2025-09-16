"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, CheckSquare, PlayCircle, Clock, BookOpen } from "lucide-react"
import { format } from "date-fns"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import type { Course, TrainingProgress, TrainingNotification } from "@/types/training"
import * as TrainingService from "@/lib/training-service"

const NotificationBanner = ({ userId }: { userId: string }) => {
  const [notifications, setNotifications] = useState<TrainingNotification[]>([])
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    if (userId) {
      const userNotifications = TrainingService.getNotificationsForUser(userId)
      setNotifications(userNotifications.slice(0, showAll ? userNotifications.length : 3))
    }
  }, [userId, showAll])

  const handleMarkAsRead = (notificationId: string) => {
    TrainingService.markNotificationAsRead(notificationId)
    setNotifications(notifications.filter((n) => n.id !== notificationId))
  }

  const unreadNotifications = notifications.filter((n) => !n.isRead)

  if (unreadNotifications.length === 0) return null

  return (
    <Card className="mb-6 border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg text-blue-900">Training Notifications</CardTitle>
          <Badge variant="secondary">{unreadNotifications.length} new</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {unreadNotifications.map((notification) => (
            <div key={notification.id} className="flex items-start justify-between p-3 bg-white rounded-lg border">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{notification.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {format(new Date(notification.createdAt), "MMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleMarkAsRead(notification.id)}>
                Mark as Read
              </Button>
            </div>
          ))}
        </div>
        {notifications.length > 3 && (
          <Button variant="ghost" size="sm" className="mt-3" onClick={() => setShowAll(!showAll)}>
            {showAll ? "Show Less" : `Show All (${notifications.length})`}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

const CourseCard = ({
  course,
  progress,
  onStartCourse,
  isNewAssignment,
}: {
  course: Course
  progress?: TrainingProgress
  onStartCourse: (course: Course) => void
  isNewAssignment?: boolean
}) => {
  const getStatusBadge = () => {
    if (!progress) return <Badge variant="outline">Not Started</Badge>
    switch (progress.status) {
      case "completed":
        return <Badge variant="default">Completed</Badge>
      case "in-progress":
        return <Badge variant="secondary">In Progress</Badge>
      case "pending-review":
        return <Badge variant="secondary">Pending Review</Badge>
      default:
        return <Badge variant="outline">Not Started</Badge>
    }
  }

  return (
    <Card className={`hover:shadow-lg transition-shadow ${isNewAssignment ? "border-blue-300 bg-blue-50" : ""}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{course.title}</CardTitle>
              {isNewAssignment && <Badge variant="default">New!</Badge>}
              {course.isRequired && <Badge variant="destructive">Required</Badge>}
            </div>
            <CardDescription className="mt-2">
              {course.description.substring(0, 120)}
              {course.description.length > 120 && "..."}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            {getStatusBadge()}
            <div className="text-right">
              <div className="text-2xl font-bold">{progress?.completionPercentage || 0}%</div>
              <div className="text-sm text-muted-foreground">Complete</div>
            </div>
          </div>
          <Progress value={progress?.completionPercentage || 0} className="h-2" />
          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              <span>{course.contentBlocks?.length || 0} lessons</span>
            </div>
            {course.dueDate && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Due {format(new Date(course.dueDate), "MMM d")}</span>
              </div>
            )}
          </div>
          {progress && progress.lastActivityDate && (
            <p className="text-xs text-muted-foreground">
              Last activity: {format(new Date(progress.lastActivityDate), "MMM d, yyyy")}
            </p>
          )}
        </div>
      </CardContent>
      <CardContent className="pt-0">
        <Button onClick={() => onStartCourse(course)} className="w-full">
          {progress?.status === "completed"
            ? "Review Course"
            : progress?.status === "in-progress"
              ? "Continue"
              : "Start Course"}
        </Button>
      </CardContent>
    </Card>
  )
}

const LessonViewer = ({
  course,
  progress,
  onCompleteLesson,
  onNextLesson,
  onBackToCourses,
}: {
  course: Course
  progress: TrainingProgress
  onCompleteLesson: (blockId: string) => void
  onNextLesson: () => void
  onBackToCourses: () => void
}) => {
  const currentBlock = course.contentBlocks?.[progress.currentBlockIndex]

  if (!currentBlock) {
    return (
      <div className="text-center py-12">
        <CheckSquare className="mx-auto h-16 w-16 text-green-500 mb-4" />
        <h3 className="text-2xl font-bold mb-2">Course Completed!</h3>
        <p className="text-muted-foreground mb-6">Congratulations on completing {course.title}</p>
        <Button onClick={onBackToCourses}>Back to Courses</Button>
      </div>
    )
  }

  const isLessonCompleted = progress.completedLessons.includes(currentBlock.id)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={onBackToCourses}>
          ← Back to Courses
        </Button>
        <div className="text-sm text-muted-foreground">
          Lesson {progress.currentBlockIndex + 1} of {course.contentBlocks?.length || 0}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{currentBlock.title || `Lesson ${progress.currentBlockIndex + 1}`}</CardTitle>
          <Progress
            value={((progress.currentBlockIndex + 1) / (course.contentBlocks?.length || 1)) * 100}
            className="mt-2"
          />
        </CardHeader>
        <CardContent className="space-y-6">
          {currentBlock.type === "text" && (
            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap">{currentBlock.content}</p>
            </div>
          )}

          {currentBlock.type === "video" && (
            <div className="aspect-video">
              <iframe
                width="100%"
                height="100%"
                src={currentBlock.content}
                title={currentBlock.title}
                allowFullScreen
                className="rounded-lg"
              />
            </div>
          )}

          {currentBlock.type === "image" && (
            <div className="text-center">
              <img
                src={currentBlock.content || "/placeholder.svg?height=400&width=600"}
                alt={currentBlock.title}
                className="max-w-full h-auto rounded-lg mx-auto"
              />
            </div>
          )}

          {currentBlock.type === "pdf" && (
            <div className="border rounded-lg p-6 text-center">
              <div className="text-muted-foreground mb-4">PDF Document</div>
              <Button asChild>
                <a href={currentBlock.content} target="_blank" rel="noopener noreferrer">
                  Open PDF
                </a>
              </Button>
            </div>
          )}

          {currentBlock.type === "quiz" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Quiz Time!</h3>
              {currentBlock.quizData?.questions?.map((question, index) => (
                <Card key={question.id}>
                  <CardContent className="pt-6">
                    <h4 className="font-medium mb-3">
                      {index + 1}. {question.questionText}
                    </h4>
                    {question.type === "multiple-choice" && question.options && (
                      <div className="space-y-2">
                        {question.options.map((option, optionIndex) => (
                          <label key={optionIndex} className="flex items-center space-x-2">
                            <input type="radio" name={`question-${question.id}`} value={option} />
                            <span>{option}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    {question.type === "short-answer" && (
                      <textarea className="w-full p-3 border rounded-lg" rows={3} placeholder="Enter your answer..." />
                    )}
                  </CardContent>
                </Card>
              )) || <p>No questions available</p>}
              <Button className="w-full">Submit Quiz</Button>
            </div>
          )}

          {currentBlock.type === "assignment" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Assignment</h3>
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap">{currentBlock.assignmentData?.instructions}</p>
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <div className="text-muted-foreground mb-4">Upload your assignment</div>
                <Button variant="outline">Choose File</Button>
                <p className="text-sm text-muted-foreground mt-2">
                  Allowed types:{" "}
                  {currentBlock.assignmentData?.allowedFileTypes?.join(", ").toUpperCase() || "All files"}
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-6 border-t">
            {!isLessonCompleted && currentBlock.type !== "quiz" && currentBlock.type !== "assignment" && (
              <Button onClick={() => onCompleteLesson(currentBlock.id)}>
                <CheckSquare className="mr-2 h-4 w-4" />
                Mark as Completed
              </Button>
            )}
            {(isLessonCompleted || currentBlock.type === "quiz" || currentBlock.type === "assignment") &&
              progress.currentBlockIndex < (course.contentBlocks?.length || 0) - 1 && (
                <Button onClick={onNextLesson} className="ml-auto">
                  Next Lesson
                  <PlayCircle className="ml-2 h-4 w-4" />
                </Button>
              )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function MyTrainingTab() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [assignedCourses, setAssignedCourses] = useState<Course[]>([])
  const [progressMap, setProgressMap] = useState<Record<string, TrainingProgress>>({})
  const [viewingCourse, setViewingCourse] = useState<Course | null>(null)
  const [activeTab, setActiveTab] = useState("new")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadUserTraining()
    }
  }, [user])

  const loadUserTraining = async () => {
    if (!user) return

    try {
      setLoading(true)

      const allCourses = TrainingService.getCourses()
      const userProgress = TrainingService.getTrainingProgressForUser(user.uid)

      // Get courses assigned to user directly or through teams
      const assignedCourses = allCourses.filter((course) => {
        const directAssignment = course.assignedToUserIds?.includes(user.uid)
        const teamAssignment = course.assignedToTeamIds?.some((teamId) =>
          TrainingService.getUsersInTeam(teamId).includes(user.uid),
        )
        return directAssignment || teamAssignment
      })

      setAssignedCourses(assignedCourses)

      // Create progress map
      const progressMap: Record<string, TrainingProgress> = {}
      assignedCourses.forEach((course) => {
        const progress = userProgress.find((p) => p.courseId === course.id)
        if (progress) {
          progressMap[course.id] = progress
        }
      })
      setProgressMap(progressMap)
    } catch (error) {
      console.error("Error loading user training:", error)
      toast({
        title: "Error",
        description: "Failed to load training data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStartCourse = (course: Course) => {
    if (!user) return

    try {
      // Mark new assignment as read
      const progress = TrainingService.getOrCreateTrainingProgress(user.uid, course.id)
      if (progress.isNewAssignment) {
        progress.isNewAssignment = false
        TrainingService.saveTrainingProgress(progress)
        setProgressMap((prev) => ({ ...prev, [course.id]: progress }))
      }

      setViewingCourse(course)
    } catch (error) {
      console.error("Error starting course:", error)
      toast({
        title: "Error",
        description: "Failed to start course",
        variant: "destructive",
      })
    }
  }

  const handleCompleteLesson = (courseId: string, blockId: string) => {
    if (!user) return

    try {
      const progress = TrainingService.getOrCreateTrainingProgress(user.uid, courseId)
      if (!progress.completedLessons.includes(blockId)) {
        progress.completedLessons.push(blockId)
        progress.lastActivityDate = new Date().toISOString()
        progress.status = "in-progress"

        const course = assignedCourses.find((c) => c.id === courseId)
        if (course && course.contentBlocks) {
          progress.completionPercentage = Math.round(
            (progress.completedLessons.length / course.contentBlocks.length) * 100,
          )
          if (progress.completionPercentage === 100) {
            progress.status = "completed"
            progress.completedAt = new Date().toISOString()
          }
        }

        TrainingService.saveTrainingProgress(progress)
        setProgressMap((prev) => ({ ...prev, [courseId]: progress }))

        toast({
          title: "Lesson Completed",
          description: "Great job! Keep up the good work.",
        })
      }
    } catch (error) {
      console.error("Error completing lesson:", error)
      toast({
        title: "Error",
        description: "Failed to complete lesson",
        variant: "destructive",
      })
    }
  }

  const handleNextLesson = (courseId: string) => {
    if (!user) return

    try {
      const progress = TrainingService.getOrCreateTrainingProgress(user.uid, courseId)
      const course = assignedCourses.find((c) => c.id === courseId)
      if (course && course.contentBlocks && progress.currentBlockIndex < course.contentBlocks.length - 1) {
        progress.currentBlockIndex += 1
        progress.lastActivityDate = new Date().toISOString()
        TrainingService.saveTrainingProgress(progress)
        setProgressMap((prev) => ({ ...prev, [courseId]: progress }))
      }
    } catch (error) {
      console.error("Error moving to next lesson:", error)
      toast({
        title: "Error",
        description: "Failed to move to next lesson",
        variant: "destructive",
      })
    }
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Please log in to view your training</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="text-muted-foreground mt-4">Loading your training...</p>
      </div>
    )
  }

  const newAssignments = assignedCourses.filter((course) => progressMap[course.id]?.isNewAssignment)
  const inProgressCourses = assignedCourses.filter(
    (course) => progressMap[course.id]?.status === "in-progress" && !progressMap[course.id]?.isNewAssignment,
  )
  const completedCourses = assignedCourses.filter((course) => progressMap[course.id]?.status === "completed")
  const notStartedCourses = assignedCourses.filter(
    (course) => !progressMap[course.id] || progressMap[course.id]?.status === "not-started",
  )

  if (viewingCourse && progressMap[viewingCourse.id]) {
    return (
      <LessonViewer
        course={viewingCourse}
        progress={progressMap[viewingCourse.id]}
        onCompleteLesson={(blockId) => handleCompleteLesson(viewingCourse.id, blockId)}
        onNextLesson={() => handleNextLesson(viewingCourse.id)}
        onBackToCourses={() => setViewingCourse(null)}
      />
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">My Training</h2>

      <NotificationBanner userId={user.uid} />

      {assignedCourses.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">No Training Assigned</h3>
          <p className="text-muted-foreground">You don't have any training courses assigned yet.</p>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="new" className="relative">
              New Assignments
              {newAssignments.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                  {newAssignments.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="available">Available</TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="mt-6">
            {newAssignments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No new assignments</div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {newAssignments.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    progress={progressMap[course.id]}
                    onStartCourse={handleStartCourse}
                    isNewAssignment={true}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="progress" className="mt-6">
            {inProgressCourses.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No courses in progress</div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {inProgressCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    progress={progressMap[course.id]}
                    onStartCourse={handleStartCourse}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            {completedCourses.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No completed courses yet</div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {completedCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    progress={progressMap[course.id]}
                    onStartCourse={handleStartCourse}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="available" className="mt-6">
            {notStartedCourses.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No available courses</div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {notStartedCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    progress={progressMap[course.id]}
                    onStartCourse={handleStartCourse}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
