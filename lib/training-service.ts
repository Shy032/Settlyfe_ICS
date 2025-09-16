import type {
  Course,
  Interview,
  TrainingProgress,
  InterviewSubmission,
  TrainingFeedback,
  CompanyTrainingResource,
  TrainingNotification,
} from "@/types/training"

// Helper functions for localStorage operations
function getStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error(`Error parsing localStorage item ${key}:`, error)
    return defaultValue
  }
}

function setStorageItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`Error setting localStorage item ${key}:`, error)
  }
}

// Team management functions
export function getAllTeams() {
  // Get teams from the existing team management system
  const teams = getStorageItem("settlyfe_teams", [])

  // Check if teams exist and are in the correct format
  if (teams && Array.isArray(teams) && teams.length > 0) {
    // Ensure each team has the expected structure
    const validTeams = teams.map((team: any) => ({
      id: team.id,
      name: team.name,
      members: team.members || [],
    }))
    return validTeams
  } else {
    // Return empty array if no teams found
    return []
  }
}

export function getUsersInTeam(teamId: string): string[] {
  const teams = getAllTeams()
  const team = teams.find((t) => t.id === teamId)
  return team ? team.members || [] : []
}

export function getAllUsersFromAssignment(userIds: string[], teamIds: string[]): string[] {
  const directUsers = [...userIds]
  const teamUsers = teamIds.flatMap((teamId) => getUsersInTeam(teamId))
  return [...new Set([...directUsers, ...teamUsers])]
}

// Course management functions
export function getCourses(): Course[] {
  return getStorageItem<Course[]>("settlyfe_courses", [])
}

export function getCourseById(id: string): Course | undefined {
  return getCourses().find((c) => c.id === id)
}

export function saveCourse(course: Course): void {
  const courses = getCourses()
  const index = courses.findIndex((c) => c.id === course.id)
  const isNewCourse = index === -1

  if (index > -1) {
    courses[index] = course
  } else {
    courses.push(course)
  }
  setStorageItem("settlyfe_courses", courses)

  // If new course or assignment changed, create notifications and progress
  if (isNewCourse || course.assignedToUserIds.length > 0 || course.assignedToTeamIds.length > 0) {
    const assignedUsers = getAllUsersFromAssignment(course.assignedToUserIds, course.assignedToTeamIds)
    assignedUsers.forEach((userId) => {
      // Create training progress
      const existingProgress = getTrainingProgress(userId, course.id)
      if (!existingProgress) {
        const progress: TrainingProgress = {
          id: crypto.randomUUID(),
          userId,
          courseId: course.id,
          status: "not-started",
          completedLessons: [],
          quizScores: {},
          assignmentSubmissions: {},
          currentBlockIndex: 0,
          lastActivityDate: new Date().toISOString(),
          completionPercentage: 0,
          isNewAssignment: true,
        }
        saveTrainingProgress(progress)
      }

      // Create notification
      createNotification({
        userId,
        type: "course_assigned",
        title: "New Training Course Assigned",
        message: `You have been assigned the course: ${course.title}`,
        targetId: course.id,
      })
    })
  }
}

export function deleteCourse(id: string): void {
  const courses = getCourses()
  const filteredCourses = courses.filter((c) => c.id !== id)
  setStorageItem("settlyfe_courses", filteredCourses)
}

// Interview management functions
export function getInterviews(): Interview[] {
  return getStorageItem<Interview[]>("settlyfe_interviews", [])
}

export function getInterviewById(id: string): Interview | undefined {
  return getInterviews().find((i) => i.id === id)
}

export function saveInterview(interview: Interview): void {
  const interviews = getInterviews()
  const index = interviews.findIndex((i) => i.id === interview.id)
  const isNewInterview = index === -1

  if (index > -1) {
    interviews[index] = interview
  } else {
    interviews.push(interview)
  }
  setStorageItem("settlyfe_interviews", interviews)

  // Create notifications for assigned users
  if (isNewInterview || interview.assignedToUserIds.length > 0 || interview.assignedToTeamIds.length > 0) {
    const assignedUsers = getAllUsersFromAssignment(interview.assignedToUserIds, interview.assignedToTeamIds)
    assignedUsers.forEach((userId) => {
      createNotification({
        userId,
        type: "interview_assigned",
        title: "New Interview Assigned",
        message: `You have been assigned an interview: ${interview.title}`,
        targetId: interview.id,
      })
    })
  }
}

export function deleteInterview(id: string): void {
  const interviews = getInterviews()
  const filteredInterviews = interviews.filter((i) => i.id !== id)
  setStorageItem("settlyfe_interviews", filteredInterviews)
}

// Training progress functions
export function getTrainingProgressForUser(userId: string): TrainingProgress[] {
  const allProgress = getStorageItem<TrainingProgress[]>("settlyfe_training_progress", [])
  return allProgress.filter((p) => p.userId === userId)
}

export function getTrainingProgress(userId: string, courseId: string): TrainingProgress | undefined {
  const allProgress = getStorageItem<TrainingProgress[]>("settlyfe_training_progress", [])
  return allProgress.find((p) => p.userId === userId && p.courseId === courseId)
}

export function getOrCreateTrainingProgress(userId: string, courseId: string): TrainingProgress {
  let progress = getTrainingProgress(userId, courseId)

  if (!progress) {
    progress = {
      id: crypto.randomUUID(),
      userId,
      courseId,
      status: "not-started",
      completedLessons: [],
      quizScores: {},
      assignmentSubmissions: {},
      currentBlockIndex: 0,
      lastActivityDate: new Date().toISOString(),
      completionPercentage: 0,
      isNewAssignment: true,
    }
    saveTrainingProgress(progress)
  }

  return progress
}

export function saveTrainingProgress(progress: TrainingProgress): void {
  const allProgress = getStorageItem<TrainingProgress[]>("settlyfe_training_progress", [])
  const index = allProgress.findIndex((p) => p.id === progress.id)
  if (index > -1) {
    allProgress[index] = progress
  } else {
    allProgress.push(progress)
  }
  setStorageItem("settlyfe_training_progress", allProgress)
}

export function getAllTrainingProgress(): TrainingProgress[] {
  return getStorageItem<TrainingProgress[]>("settlyfe_training_progress", [])
}

// Interview submission functions
export function getInterviewSubmissionsForUser(userId: string): InterviewSubmission[] {
  const allSubmissions = getStorageItem<InterviewSubmission[]>("settlyfe_interview_submissions", [])
  return allSubmissions.filter((s) => s.userId === userId)
}

export function getInterviewSubmission(userId: string, interviewId: string): InterviewSubmission | undefined {
  const allSubmissions = getStorageItem<InterviewSubmission[]>("settlyfe_interview_submissions", [])
  return allSubmissions.find((s) => s.userId === userId && s.interviewId === interviewId)
}

export function saveInterviewSubmission(submission: InterviewSubmission): void {
  const allSubmissions = getStorageItem<InterviewSubmission[]>("settlyfe_interview_submissions", [])
  const index = allSubmissions.findIndex((s) => s.id === submission.id)
  if (index > -1) {
    allSubmissions[index] = submission
  } else {
    allSubmissions.push(submission)
  }
  setStorageItem("settlyfe_interview_submissions", allSubmissions)
}

export function getAllInterviewSubmissions(): InterviewSubmission[] {
  return getStorageItem<InterviewSubmission[]>("settlyfe_interview_submissions", [])
}

// Notification functions
export function createNotification(notification: Omit<TrainingNotification, "id" | "isRead" | "createdAt">): void {
  const notifications = getStorageItem<TrainingNotification[]>("settlyfe_training_notifications", [])
  const newNotification: TrainingNotification = {
    ...notification,
    id: crypto.randomUUID(),
    isRead: false,
    createdAt: new Date().toISOString(),
  }
  notifications.push(newNotification)
  setStorageItem("settlyfe_training_notifications", notifications)
}

export function getNotificationsForUser(userId: string): TrainingNotification[] {
  const notifications = getStorageItem<TrainingNotification[]>("settlyfe_training_notifications", [])
  return notifications
    .filter((n) => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function markNotificationAsRead(notificationId: string): void {
  const notifications = getStorageItem<TrainingNotification[]>("settlyfe_training_notifications", [])
  const index = notifications.findIndex((n) => n.id === notificationId)
  if (index > -1) {
    notifications[index].isRead = true
    setStorageItem("settlyfe_training_notifications", notifications)
  }
}

export function getUnreadNotificationCount(userId: string): number {
  const notifications = getNotificationsForUser(userId)
  return notifications.filter((n) => !n.isRead).length
}

// Training feedback functions
export function getFeedbackForTarget(targetId: string, targetType: "course" | "interview"): TrainingFeedback[] {
  const allFeedback = getStorageItem<TrainingFeedback[]>("settlyfe_training_feedback", [])
  return allFeedback.filter((f) => f.targetId === targetId && f.targetType === targetType)
}

export function getFeedbackForUser(userId: string): TrainingFeedback[] {
  const allFeedback = getStorageItem<TrainingFeedback[]>("settlyfe_training_feedback", [])
  return allFeedback.filter((f) => f.userId === userId)
}

export function saveTrainingFeedback(feedback: TrainingFeedback): void {
  const allFeedback = getStorageItem<TrainingFeedback[]>("settlyfe_training_feedback", [])
  const index = allFeedback.findIndex((f) => f.id === feedback.id)
  if (index > -1) {
    allFeedback[index] = feedback
  } else {
    allFeedback.push(feedback)
  }
  setStorageItem("settlyfe_training_feedback", allFeedback)

  // Create notification for user
  createNotification({
    userId: feedback.userId,
    type: "feedback_received",
    title: "Training Feedback Received",
    message: `You received ${feedback.rating}-star feedback on your ${feedback.targetType}`,
    targetId: feedback.targetId,
  })
}

// Company training resource functions
export function getCompanyTrainingResources(): CompanyTrainingResource[] {
  return getStorageItem<CompanyTrainingResource[]>("settlyfe_company_training_resources", [])
}

export function saveCompanyTrainingResource(resource: CompanyTrainingResource): void {
  const resources = getCompanyTrainingResources()
  const index = resources.findIndex((r) => r.id === resource.id)
  if (index > -1) {
    resources[index] = resource
  } else {
    resources.push(resource)
  }
  setStorageItem("settlyfe_company_training_resources", resources)
}

export function deleteCompanyTrainingResource(id: string): void {
  const resources = getCompanyTrainingResources()
  const filteredResources = resources.filter((r) => r.id !== id)
  setStorageItem("settlyfe_company_training_resources", filteredResources)
}

// User helper functions - Get real users from the existing system
export function getAllUsers() {
  // First try to get users from the existing user management system
  const existingUsers = getStorageItem("settlyfe_users", [])

  if (existingUsers && existingUsers.length > 0) {
    return existingUsers.map((user: any) => ({
      id: user.uid || user.id,
      name: user.name || user.displayName || user.email,
      role: user.role || "member",
      email: user.email,
      teamId: user.teamId,
    }))
  }

  // Fallback: try to get from Firebase users if available
  const firebaseUsers = getStorageItem("firebase_users", [])
  if (firebaseUsers && firebaseUsers.length > 0) {
    return firebaseUsers.map((user: any) => ({
      id: user.uid,
      name: user.name || user.displayName || user.email,
      role: user.role || "member",
      email: user.email,
      teamId: user.teamId,
    }))
  }

  // Last fallback: check if there are any users in localStorage with different keys
  const allKeys = Object.keys(localStorage)
  const userKeys = allKeys.filter((key) => key.includes("user") || key.includes("User"))

  if (userKeys.length > 0) {
    const users: any[] = []
    userKeys.forEach((key) => {
      try {
        const data = JSON.parse(localStorage.getItem(key) || "{}")
        if (data.uid || data.id) {
          users.push({
            id: data.uid || data.id,
            name: data.name || data.displayName || data.email || "Unknown User",
            role: data.role || "member",
            email: data.email || "",
            teamId: data.teamId,
          })
        }
      } catch (e) {
        // Skip invalid JSON
      }
    })

    if (users.length > 0) {
      return users
    }
  }

  // Final fallback: return empty array
  return []
}

export function getUserById(userId: string) {
  return getAllUsers().find((user) => user.id === userId)
}
