export interface CourseContentBlock {
  id: string
  type: "text" | "video" | "image" | "pdf" | "quiz" | "assignment"
  title: string
  content: string
  order: number
  quizData?: {
    questions: QuizQuestion[]
  }
  assignmentData?: {
    instructions: string
    allowedFileTypes: string[]
  }
}

export interface QuizQuestion {
  id: string
  questionText: string
  type: "multiple-choice" | "short-answer"
  options?: string[]
  correctAnswer?: string | string[]
  explanation?: string
}

export interface Course {
  id: string
  title: string
  description: string
  contentBlocks: CourseContentBlock[]
  createdBy: string
  creatorName: string
  createdAt: string
  isRequired: boolean
  dueDate?: string
  assignedToUserIds: string[]
  assignedToTeamIds: string[]
}

export interface Interview {
  id: string
  title: string
  description: string
  questions: InterviewQuestion[]
  createdBy: string
  creatorName: string
  createdAt: string
  deadline?: string
  assignedToUserIds: string[]
  assignedToTeamIds: string[]
  requiresResume: boolean
  requiresScheduling: boolean
}

export interface InterviewQuestion {
  id: string
  questionText: string
  requiresUpload: boolean
  order: number
}

export interface QuestionGrade {
  questionId: string
  score: number // 0-100
  maxScore: number
  comments: string
  feedback: string
}

export interface TrainingProgress {
  id: string
  userId: string
  courseId: string
  status: "not-started" | "in-progress" | "completed" | "failed-quiz" | "pending-review"
  completedLessons: string[]
  quizScores: Record<string, { score: number; passed: boolean; answers: any; grades?: QuestionGrade[] }>
  assignmentSubmissions: Record<
    string,
    { fileName: string; fileUrl: string; submittedAt: string; grade?: QuestionGrade }
  >
  completedAt?: string
  currentBlockIndex: number
  lastActivityDate: string
  completionPercentage: number
  isNewAssignment: boolean
}

export interface InterviewSubmission {
  id: string
  userId: string
  interviewId: string
  resumeFile?: { name: string; url: string; type: string }
  answers: {
    questionId: string
    answerText: string
    uploadedFile?: { name: string; url: string }
    grade?: QuestionGrade
  }[]
  scheduledTime?: string
  submittedAt: string
  status: "pending" | "submitted" | "reviewing" | "approved" | "retry" | "rejected"
  overallGrade?: {
    totalScore: number
    maxScore: number
    percentage: number
    comments: string
    recommendation: string
  }
}

export interface TrainingNotification {
  id: string
  userId: string
  type: "course_assigned" | "interview_assigned" | "feedback_received"
  title: string
  message: string
  targetId: string
  isRead: boolean
  createdAt: string
}

export interface TrainingFeedback {
  id: string
  targetId: string
  targetType: "course" | "interview"
  userId: string
  reviewerId: string
  reviewerName: string
  rating: number
  notes: string
  decision: "approved" | "retry" | "rejected"
  createdAt: string
}

export interface CompanyTrainingResource {
  id: string
  fileName: string
  fileType: string
  fileUrl: string
  description?: string
  uploadedBy: string
  uploaderName: string
  uploadedAt: string
  tags?: string[]
}

// Legacy types for backward compatibility
export interface InterviewAnswer {
  questionId: string
  questionText: string
  answerText: string
}

export interface InterviewTask {
  id: string
  userId: string
  resumeFile?: { name: string; url: string; type: string }
  interviewDate?: string
  answers: InterviewAnswer[]
  submittedAt: string
  status: "pending" | "submitted" | "reviewing" | "approved" | "retry" | "rejected"
}
