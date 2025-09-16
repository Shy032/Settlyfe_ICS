"use client"

import { useState } from "react"
import type { Document, DocumentFilter, DocumentFolder } from "@/types/document"
import { deleteDocument, deleteFolder } from "@/services/document-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { Download, Eye, FileText, Search, Trash2, Calendar, Tag, Users, Folder } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatDistanceToNow } from "date-fns"
import { useToast } from "@/hooks/use-toast"

interface DocumentListProps {
  documents: Document[]
  folders?: DocumentFolder[]
  onDelete: () => void
  onFolderClick?: (folderId: string) => void
  currentUserId: string
  isAdminView: boolean
  readOnly?: boolean
}

export function DocumentList({
  documents,
  folders = [],
  onDelete,
  onFolderClick,
  currentUserId,
  isAdminView,
  readOnly = false,
}: DocumentListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState<DocumentFilter>({ type: "all", department: "all", visibility: "all" })
  const [viewDocument, setViewDocument] = useState<Document | null>(null)
  const { toast } = useToast()
  const { isAdmin, isOwner } = useAuth()

  const handleDelete = (id: string, uploadedBy: string, isFolder = false) => {
    if (readOnly) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to delete in read-only mode",
        variant: "destructive",
      })
      return
    }

    // Check if user has permission to delete this document/folder
    if (uploadedBy === currentUserId || isAdmin() || isOwner()) {
      if (isFolder) {
        deleteFolder(id)
      } else {
        deleteDocument(id)
      }
      onDelete()

      toast({
        title: "Success",
        description: `${isFolder ? "Folder" : "Document"} deleted successfully`,
      })
    } else {
      toast({
        title: "Permission Denied",
        description: `You don't have permission to delete this ${isFolder ? "folder" : "document"}`,
        variant: "destructive",
      })
    }
  }

  const handleView = (document: Document) => {
    setViewDocument(document)
  }

  const handleDownload = (document: Document) => {
    // In a real app this would trigger a download
    // Here we'll just show a toast for demo purposes
    toast({
      title: "Download Started",
      description: `Downloading ${document.name}`,
    })
  }

  const filteredDocuments = documents
    .filter((doc) => {
      // Apply search filter
      return (
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (doc.tags && doc.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())))
      )
    })
    // Apply other filters if they exist
    .filter((doc) => {
      if (filter.type !== "all" && doc.type) {
        if (filter.type === "pdf" && !doc.type.includes("pdf")) return false
        if (filter.type === "docx" && !doc.type.includes("word")) return false
        if (filter.type === "image" && !doc.type.includes("image")) return false
      }

      if (filter.department !== "all" && doc.department !== filter.department) return false
      if (filter.visibility !== "all" && doc.visibility !== filter.visibility) return false

      return true
    })

  const filteredFolders = folders.filter((folder) => folder.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const getFileIcon = (type: string) => {
    if (type.includes("pdf")) return "📄"
    if (type.includes("word")) return "📝"
    if (type.includes("image")) return "🖼️"
    return "📁"
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / 1048576).toFixed(1) + " MB"
  }

  const getFileTypeLabel = (type: string) => {
    if (type.includes("pdf")) return "PDF"
    if (type.includes("word")) return "Word"
    if (type.includes("jpeg") || type.includes("jpg")) return "JPEG"
    if (type.includes("png")) return "PNG"
    return type.split("/")[1]?.toUpperCase() || "Unknown"
  }

  const totalItems = filteredFolders.length + filteredDocuments.length

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <div className="grow">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search documents and folders..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            {isAdminView && (
              <>
                <Select onValueChange={(value) => setFilter({ ...filter, type: value })}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="File Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="docx">Word</SelectItem>
                    <SelectItem value="image">Images</SelectItem>
                  </SelectContent>
                </Select>

                <Select onValueChange={(value) => setFilter({ ...filter, department: value })}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="hr">HR</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="engineering">Engineering</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="operations">Operations</SelectItem>
                  </SelectContent>
                </Select>

                <Select onValueChange={(value) => setFilter({ ...filter, visibility: value })}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Visibility</SelectItem>
                    <SelectItem value="all">All Employees</SelectItem>
                    <SelectItem value="admin-only">Admin Only</SelectItem>
                    <SelectItem value="management">Management</SelectItem>
                    <SelectItem value="department">Department Only</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        </div>
      </div>

      {totalItems === 0 ? (
        <div className="text-center p-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <FileText className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No items found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {searchTerm
              ? "Try adjusting your search or filters"
              : "Upload your first document or create a folder to get started"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {/* Render Folders First */}
          {filteredFolders.map((folder) => (
            <Card
              key={folder.id}
              className="p-4 flex items-center justify-between dark:bg-card hover:bg-muted/50 cursor-pointer"
            >
              <div className="flex items-center gap-4 flex-1" onClick={() => onFolderClick?.(folder.id)}>
                <div className="text-2xl">
                  <Folder className="h-8 w-8 text-blue-500" />
                </div>
                <div>
                  <h4 className="font-medium">{folder.name}</h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Badge variant="outline">Folder</Badge>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(folder.createdAt), { addSuffix: true })}</span>
                  </div>
                  {isAdminView && (
                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>By {folder.createdByName}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!readOnly && (folder.createdBy === currentUserId || isAdmin() || isOwner()) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(folder.id, folder.createdBy, true)
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                    <span className="sr-only">Delete</span>
                  </Button>
                )}
              </div>
            </Card>
          ))}

          {/* Render Documents */}
          {filteredDocuments.map((doc) => (
            <Card key={doc.id} className="p-4 flex items-center justify-between dark:bg-card">
              <div className="flex items-center gap-4">
                <div className="text-2xl">{getFileIcon(doc.type)}</div>
                <div>
                  <h4 className="font-medium">{doc.name}</h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Badge variant="outline">{getFileTypeLabel(doc.type)}</Badge>
                    <span>{formatFileSize(doc.size)}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(doc.uploadedAt), { addSuffix: true })}</span>
                  </div>
                  {doc.description && <p className="text-sm mt-1">{doc.description}</p>}
                  {isAdminView && doc.tags && doc.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {doc.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {isAdminView && (
                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>
                          {doc.visibility === "all"
                            ? "All Employees"
                            : doc.visibility === "admin-only"
                              ? "Admin Only"
                              : doc.visibility === "management"
                                ? "Management"
                                : doc.visibility === "department"
                                  ? `${doc.department} Department`
                                  : doc.visibility === "team-only"
                                    ? "Team Only"
                                    : "Unknown"}
                        </span>
                      </div>
                      {doc.department && (
                        <div className="flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          <span className="capitalize">{doc.department}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>By {doc.uploadedByName}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleView(doc)}>
                  <Eye className="h-4 w-4" />
                  <span className="sr-only">View</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDownload(doc)}>
                  <Download className="h-4 w-4" />
                  <span className="sr-only">Download</span>
                </Button>
                {!readOnly && (doc.uploadedBy === currentUserId || isAdmin() || isOwner()) && (
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(doc.id, doc.uploadedBy)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                    <span className="sr-only">Delete</span>
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!viewDocument} onOpenChange={() => setViewDocument(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{viewDocument?.name}</DialogTitle>
            <DialogDescription>{viewDocument?.description || "No description provided"}</DialogDescription>
          </DialogHeader>

          <div className="bg-muted/20 rounded-md p-4 min-h-[300px] flex items-center justify-center">
            {viewDocument?.type.includes("image") ? (
              <img
                src={viewDocument.url || "/placeholder.svg"}
                alt={viewDocument.name}
                className="max-w-full max-h-[70vh] object-contain"
              />
            ) : (
              <div className="text-center">
                <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p>Preview not available for this file type</p>
                <p className="text-sm text-muted-foreground mt-2">Download the file to view its contents</p>
                <Button className="mt-4" onClick={() => handleDownload(viewDocument!)}>
                  <Download className="h-4 w-4 mr-2" /> Download
                </Button>
              </div>
            )}
          </div>

          <div className="mt-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Uploaded by</p>
                <p className="text-muted-foreground">{viewDocument?.uploadedByName}</p>
              </div>
              <div>
                <p className="font-medium">Upload date</p>
                <p className="text-muted-foreground">
                  {viewDocument && new Date(viewDocument.uploadedAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="font-medium">File type</p>
                <p className="text-muted-foreground">{viewDocument && getFileTypeLabel(viewDocument.type)}</p>
              </div>
              <div>
                <p className="font-medium">File size</p>
                <p className="text-muted-foreground">{viewDocument && formatFileSize(viewDocument.size)}</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
