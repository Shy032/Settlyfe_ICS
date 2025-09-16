export interface Document {
  id: string
  name: string
  type: string
  size: number
  url: string
  uploadedBy: string
  uploadedByName: string
  uploadedAt: string
  description?: string
  isCompanyDocument: boolean
  isTeamDocument?: boolean
  teamId?: string
  tags?: string[]
  visibility?: "all" | "admin-only" | "management" | "department" | "team-only"
  department?: string
  lastModified: string
  parentFolderId?: string
  isFolder?: boolean
  folderPath?: string[]
}

export interface DocumentFolder {
  id: string
  name: string
  parentFolderId?: string
  createdBy: string
  createdByName: string
  createdAt: string
  isCompanyFolder: boolean
  isTeamFolder?: boolean
  teamId?: string
  folderPath: string[]
}

export interface DocumentFilter {
  type?: string
  department?: string
  visibility?: string
  teamId?: string
  folderId?: string
  dateRange?: {
    start: string
    end: string
  }
}
