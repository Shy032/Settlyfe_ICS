// Account types (handles login credentials)
export interface Account {
  id: string
  loginEmail: string
  passwordHash?: string
  accessLevel: "owner" | "admin" | "member"
  status: "active" | "inactive" | "suspended"
  employeeId?: string
  createdAt: string
  updatedAt: string
}

// Employee types (handles employee information)
export interface Employee {
  id: string
  firstName: string
  lastName: string
  title?: string
  role?: string
  teamId?: string
  departmentId?: string
  joinDate: string
  status: "active" | "inactive" | "terminated"
  overallAssessment?: string
  phone?: string
  personalEmail?: string
  githubEmail?: string
  zoomEmail?: string
  note?: string
  profilePhoto?: string
  theme: "light" | "dark" | "neon"
  preferredLanguage: string
  createdAt: string
  updatedAt: string
}

// Department types
export interface Department {
  id: string
  name: string
  headEmployeeId?: string
  createdAt: string
}

// Team types
export interface Team {
  id: string

  name: string
  leadEmployeeId?: string
  parentTeamId?: string
  createdAt: string

}

// Employee documents
export interface EmployeeDocument {
  id: string
  employeeId: string
  type: string
  filePath: string
  uploadDate: string
}

// Weekly credit score types
export interface WeeklyCreditScore {
  id: string
  employeeId: string
  adminId: string
  weekNumber: number
  year: number
  effortCredit: number
  outcomeCredit: number
  collabCredit: number
  wcs: number
  checkmarks: number
  createdAt: string
}

// Quarter score types
export interface QuarterScore {
  id: string
  employeeId: string
  year: number
  quarterNumber: number
  qs: number
  cumulativeCheckmarks: number
  assessment?: string
  createdAt: string
}

// Executive decision types
export interface ExecutiveDecision {
  id: string
  adminId: string
  date: string
  description: string
  createdAt: string
}

// PTO request types
export interface PTORequest {
  id: string
  employeeId: string
  requestDate: string
  startDate: string
  endDate: string
  duration: number
  reasoning: string
  status: "pending" | "approved" | "rejected"
  approvedBy?: string
  approvedDate?: string
  createdAt: string
}

// Task types
export interface TaskAttachmentGroup {
  id: string
  createdAt: string
}

export interface Task {
  id: string
  adminId: string
  title: string
  description?: string
  publishDate: string
  dueDate?: string
  completionDate?: string
  priority: "low" | "medium" | "high"
  visibility: "everyone" | "team-only" | "department-only"
  status: "not-started" | "in-progress" | "completed" | "cancelled"
  attachmentGroupId?: string
  createdAt: string
}

export interface TaskAssignment {
  id: string
  taskId: string
  isTeam: boolean
  assigneeId: string
  createdAt: string
}

export interface TaskAttachment {
  id: string
  attachmentGroupId: string
  filePath: string
  fileType: string
  uploadDate: string
}

// Clock-in session types
export interface ClockinSession {
  id: string
  employeeId: string
  date: string          // "2024-01-15"
  startTime: string     // "09:00:00" (TIME format)
  endTime: string       // "10:30:00" (TIME format) 
  duration: string      // "01:30:00" (PostgreSQL INTERVAL format)
  hours: number         // 1.5 (calculated from duration)
  description: string   // "Working on feature X"
  createdAt: string
}



// Daily update types
export interface DailyUpdate {
  id: string
  employeeId: string
  date: string
  description: string
  taskId?: string
  location?: string
  screenshotPath?: string
  createdAt: string
  updatedAt: string
}

// Announcement types
export interface Announcement {
  id: string
  title: string
  description: string
  type: string
  imagePath?: string
  priority: "low" | "medium" | "high"
  releaseTime: string
  archived: boolean
  createdAt: string
}

export interface AnnouncementRead {
  id: string
  announcementId: string
  employeeId: string
  read: boolean
  readAt: string
}

// Poll types
export interface Poll {
  id: string
  createdDate: string
  adminId: string
  title: string
  selectionType: "single-choice" | "multi-select"
  anonymous: boolean
  resultVisibility: "live" | "hidden_until_close"
  published: boolean
  closeDate?: string
  createdAt: string
}

export interface PollOption {
  id: string
  pollId: string
  optionText: string
  votes: number
  createdAt: string
}

export interface PollResponse {
  id: string
  pollId: string
  pollOptionId: string
  employeeId: string
  createdAt: string
}

// Public documents types
export interface PublicDocument {
  id: string
  visibility: "everyone" | "team-only" | "department-only" | "admin-only"
  filePath: string
  type: string
  uploadDate: string
}

// Audit log types
export interface AuditLog {
  id: string
  timestamp: string
  employeeId?: string
  actionType: string
  objectType: string
  objectId?: string
  changeSummary?: string
  createdAt: string
}

// Combined user type for authentication context (combines Account + Employee)
export interface User {
  // Account fields
  accountId: string
  loginEmail: string
  accessLevel: "owner" | "admin" | "member"
  accountStatus: "active" | "inactive" | "suspended"
  
  // Employee fields
  employeeId: string
  firstName: string
  lastName: string
  name: string // computed from firstName + lastName
  title?: string
  role?: string
  teamId?: string
  departmentId?: string
  joinDate: string
  status: "active" | "inactive" | "terminated"
  overallAssessment?: string
  phone?: string
  personalEmail?: string
  githubEmail?: string
  zoomEmail?: string
  note?: string
  profilePhoto?: string
  theme: "light" | "dark" | "neon"
  preferredLanguage: string
  createdAt: string
  updatedAt: string
}

// Legacy compatibility - for components that still use the old User interface
export interface LegacyUser {
  uid: string
  email: string
  name: string
  role: "owner" | "admin" | "member"
  teamId?: string
  createdAt: string
  theme?: "light" | "dark" | "neon"
  profilePhoto?: string
  displayTitle?: string
  phoneNumber?: string
  preferredLanguage: string
  canViewTeamDailyTasks: boolean
  canViewUniversalDailyTasks: boolean
  canViewTeamMoments: boolean
  canViewUniversalMoments: boolean
}



// Convert new User to legacy format for backward compatibility
export function userToLegacy(user: User): LegacyUser {
  return {
    uid: user.accountId,
    email: user.loginEmail,
    name: user.name,
    role: user.accessLevel,
    teamId: user.teamId,
    createdAt: user.createdAt,
    theme: user.theme,
    profilePhoto: user.profilePhoto,
    displayTitle: user.title,
    phoneNumber: user.phone,
    preferredLanguage: user.preferredLanguage,
    canViewTeamDailyTasks: false, // Default values for now
    canViewUniversalDailyTasks: false,
    canViewTeamMoments: false,
    canViewUniversalMoments: false,
  }
}
