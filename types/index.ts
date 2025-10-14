// Account types (handles login credentials)
export interface Account {
  id: string
  login_email: string
  password_hash?: string
  access_level: "owner" | "admin" | "member"
  status: "active" | "inactive" | "suspended"
  employee_id?: string
  created_at: string
  updated_at: string
}

// Daily update types
export interface DailyUpdate {
  id: string
  employee_id: string
  date: string
  description: string
  task_id?: string
  location?: string
  screenshot_path?: string
  emoji_reaction?: string // New field for emoji reaction
  admin_comment?: string // New
  admin_id?: string // New
  created_at: string
  updated_at: string
}

// Employee types (handles employee information)
export interface Employee {
  id: string
  first_name: string
  last_name: string
  title?: string
  role?: string
  team_id?: string
  department_id?: string
  join_date: string
  status: "active" | "inactive" | "terminated"
  overall_assessment?: string
  phone?: string
  personal_email?: string
  github_email?: string
  zoom_email?: string
  note?: string
  profile_photo?: string
  theme: "light" | "dark"
  preferred_language: string
  // Access control fields
  can_view_team_daily_tasks: boolean
  can_view_universal_daily_tasks: boolean
  can_view_team_moments: boolean
  can_view_universal_moments: boolean
  created_at: string
  updated_at: string
}

// Department types
export interface Department {
  id: string
  name: string
  head_employee_id?: string
  created_at: string
}

// Team types
export interface Team {
  id: string
  name: string
  lead_employee_id?: string
  parent_team_id?: string
  created_at: string
}

// Employee documents
export interface EmployeeDocument {
  id: string
  employee_id: string
  type: string
  file_path: string
  upload_date: string
}

// Weekly credit score types
export interface WeeklyCreditScore {
  id: string
  employee_id: string
  admin_id: string
  week_number: number
  year: number
  effort_credit: number
  outcome_credit: number
  collab_credit: number
  wcs: number
  checkmarks: number
  created_at: string
}

// Quarter score types
export interface QuarterScore {
  id: string
  employee_id: string
  year: number
  quarter_number: number
  qs: number
  cumulative_checkmarks: number
  assessment?: string
  created_at: string
}

// Executive decision types
export interface ExecutiveDecision {
  id: string
  admin_id: string
  date: string
  title: string
  description: string
  created_at: string
}

// PTO request types
export interface PTORequest {
  id: string
  employee_id: string
  request_date: string
  start_date: string
  end_date: string
  duration: number
  reasoning: string
  // New fields as per schema
  type: "urgent" | "planned"
  impact: string
  handover_details: string
  approve_comments?: string
  notice_given?: number
  status: "pending" | "approved" | "rejected"
  approved_by?: string
  approved_date?: string
  created_at: string
}

// Task types
export interface TaskAttachmentGroup {
  id: string
  created_at: string
}

export interface Task {
  id: string
  admin_id: string
  title: string
  description?: string
  publish_date: string
  due_date?: string
  completion_date?: string
  priority: "low" | "medium" | "high"
  visibility: "everyone" | "team-only" | "department-only" | "creator-only"
  status: "not-started" | "in-progress" | "completed" | "cancelled"
  // New fields as per schema
  progress: number
  is_key_result: boolean
  published: boolean
  attachment_group_id?: string
  created_at: string
}

export interface TaskAssignment {
  id: string
  task_id: string
  is_team: boolean
  assignee_id: string
  created_at: string
}

export interface TaskAttachment {
  id: string
  attachment_group_id: string
  file_path: string
  file_type: string
  upload_date: string
}

// Clock-in session types
export interface ClockinSession {
  id: string
  employee_id: string
  date: string          // "2024-01-15"
  start_time: string    // "09:00:00" (TIME format)
  end_time?: string     // "10:30:00" (TIME format) 
  duration?: string     // "01:30:00" (PostgreSQL INTERVAL format)
  hours?: number        // 1.5 (calculated from duration)
  description?: string  // "Working on feature X"
  created_at: string
}


// Announcement types
export interface Announcement {
  id: string
  title: string
  description: string
  type: string
  image_path?: string
  priority: "low" | "medium" | "high"
  release_time: string
  archived: boolean
  created_at: string
}

export interface AnnouncementRead {
  id: string
  announcement_id: string
  employee_id: string
  read: boolean
  read_at: string
}

// Poll types
export interface Poll {
  id: string
  created_date: string
  admin_id: string
  title: string
  selection_type: "single-choice" | "multi-select"
  anonymous: boolean
  result_visibility: "live" | "hidden_until_close"
  published: boolean
  close_date?: string
  created_at: string
}

export interface PollOption {
  id: string
  poll_id: string
  option_text: string
  votes: number
  created_at: string
}

export interface PollResponse {
  id: string
  poll_id: string
  poll_option_id: string
  employee_id: string
  created_at: string
}

// Public documents types
export interface PublicDocument {
  id: string
  visibility: "everyone" | "team-only" | "department-only" | "creator-only" | "admin-only"
  file_path: string
  type: string
  title: string
  description?: string
  uploaded_by: string
  upload_date: string
}

// Audit log types
export interface AuditLog {
  id: string
  timestamp: string
  employee_id?: string
  action_type: string
  object_type: string
  object_id?: string
  change_summary?: string
  created_at: string
}

// Helper function to join first and last name
export function getFullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim()
}
