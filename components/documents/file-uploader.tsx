"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { saveDocument, saveFolder } from "@/services/document-service"
import type { Document, DocumentFolder } from "@/types/document"
import { useToast } from "@/hooks/use-toast"
import { v4 as uuidv4 } from "uuid"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AlertCircle, Upload, FolderPlus } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface FileUploaderProps {
  userId: string
  userName: string
  isCompanyDocument: boolean
  isTeamDocument?: boolean
  teamId?: string
  currentFolderId?: string
  onUploadComplete: () => void
}

export function FileUploader({
  userId,
  userName,
  isCompanyDocument,
  isTeamDocument = false,
  teamId,
  currentFolderId,
  onUploadComplete,
}: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [description, setDescription] = useState("")
  const [uploading, setUploading] = useState(false)
  const [department, setDepartment] = useState("")
  const [visibility, setVisibility] = useState<"all" | "admin-only" | "management" | "department" | "team-only">("all")
  const [tags, setTags] = useState("")
  const [error, setError] = useState("")
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [folderName, setFolderName] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { isAdmin, isOwner } = useAuth()
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      const allowedTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/jpeg",
        "image/png",
      ]

      if (allowedTypes.includes(selectedFile.type)) {
        setFile(selectedFile)
        setError("")
      } else {
        setError("Invalid file type. Please upload PDF, DOCX, JPG, or PNG files only.")
        setFile(null)
      }
    }
  }

  const handleCreateFolder = async () => {
    if (!folderName.trim()) return

    try {
      const newFolder: DocumentFolder = {
        id: uuidv4(),
        name: folderName,
        parentFolderId: currentFolderId,
        createdBy: userId,
        createdByName: userName,
        createdAt: new Date().toISOString(),
        isCompanyFolder: isCompanyDocument,
        isTeamFolder: isTeamDocument,
        teamId: teamId,
        folderPath: [], // This would be calculated based on parent folders
      }

      saveFolder(newFolder)
      setFolderName("")
      setShowCreateFolder(false)
      onUploadComplete()

      toast({
        title: "Success",
        description: "Folder created successfully",
      })
    } catch (error) {
      console.error("Error creating folder:", error)
      toast({
        title: "Error",
        description: "Failed to create folder",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      setError("Please select a file to upload")
      return
    }

    setUploading(true)

    try {
      // In a real app, we would upload to a cloud storage service
      // Here we'll generate a fake URL for demo purposes
      const fakeUrl = `data:${file.type};name=${encodeURIComponent(file.name)}`

      const newDocument: Document = {
        id: uuidv4(),
        name: file.name,
        type: file.type,
        size: file.size,
        url: fakeUrl,
        uploadedBy: userId,
        uploadedByName: userName,
        uploadedAt: new Date().toISOString(),
        description: description,
        isCompanyDocument: isCompanyDocument,
        isTeamDocument: isTeamDocument,
        teamId: teamId,
        lastModified: new Date().toISOString(),
        parentFolderId: currentFolderId,
      }

      if (isCompanyDocument || isTeamDocument) {
        newDocument.tags = tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag)
        newDocument.visibility = isTeamDocument ? "team-only" : visibility
        newDocument.department = department
      }

      saveDocument(newDocument)

      // Reset form
      setFile(null)
      setDescription("")
      setDepartment("")
      setVisibility("all")
      setTags("")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      onUploadComplete()

      toast({
        title: "Success",
        description: "Document uploaded successfully",
      })
    } catch (error) {
      console.error("Error uploading document:", error)
      setError("Failed to upload document. Please try again.")

      toast({
        title: "Error",
        description: "Failed to upload document",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowCreateFolder(true)}
          className="flex items-center gap-2"
        >
          <FolderPlus className="h-4 w-4" />
          Create Folder
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">Upload Document</Label>
            <div className="mt-1">
              <Card className="border-dashed border-2 dark:border-gray-700 border-gray-300">
                <CardContent className="flex flex-col items-center justify-center space-y-2 py-6">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Drag and drop your file here or click to browse</p>
                  <p className="text-xs text-muted-foreground">Supported formats: PDF, DOCX, JPG, PNG</p>
                  <Input
                    ref={fileInputRef}
                    id="file"
                    type="file"
                    onChange={handleFileChange}
                    className="w-full max-w-xs"
                    accept=".pdf,.docx,.jpeg,.jpg,.png"
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          {file && (
            <div className="text-sm">
              <p>
                Selected file: <span className="font-medium">{file.name}</span>
              </p>
              <p>
                Size: <span className="font-medium">{Math.round(file.size / 1024)} KB</span>
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description for this document"
              className="resize-none"
            />
          </div>

          {(isCompanyDocument || isTeamDocument) && (isAdmin() || isOwner()) && (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {!isTeamDocument && (
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select value={department} onValueChange={setDepartment}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Departments</SelectLabel>
                          <SelectItem value="hr">Human Resources</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="engineering">Engineering</SelectItem>
                          <SelectItem value="sales">Sales</SelectItem>
                          <SelectItem value="operations">Operations</SelectItem>
                          <SelectItem value="customer-support">Customer Support</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {!isTeamDocument && (
                  <div className="space-y-2">
                    <Label htmlFor="visibility">Visibility</Label>
                    <Select value={visibility} onValueChange={(val) => setVisibility(val as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select visibility" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Visibility Levels</SelectLabel>
                          <SelectItem value="all">All Employees</SelectItem>
                          <SelectItem value="admin-only">Admin Only</SelectItem>
                          <SelectItem value="management">Management</SelectItem>
                          <SelectItem value="department">Department Only</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (Comma separated)</Label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="policy, 2024, benefits"
                />
              </div>
            </>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={uploading || !file}>
            {uploading ? "Uploading..." : "Upload Document"}
          </Button>
        </div>
      </form>

      {/* Create Folder Dialog */}
      <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>Create a new folder to organize your documents</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="folderName">Folder Name</Label>
              <Input
                id="folderName"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Enter folder name"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateFolder} disabled={!folderName.trim()}>
                Create Folder
              </Button>
              <Button variant="outline" onClick={() => setShowCreateFolder(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
