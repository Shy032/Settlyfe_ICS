"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Upload, FileText, Download, Trash2, Plus } from "lucide-react"
import { format } from "date-fns"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useIsMobile } from "@/hooks/use-mobile"
import type { CompanyTrainingResource } from "@/types/training"
import * as TrainingService from "@/lib/training-service"

const ResourceUploadDialog = ({
  isOpen,
  onClose,
  onUpload,
}: {
  isOpen: boolean
  onClose: () => void
  onUpload: (resource: CompanyTrainingResource) => void
}) => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [fileName, setFileName] = useState("")
  const [description, setDescription] = useState("")
  const [tags, setTags] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFileSelect = (file: File) => {
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/zip",
    ]

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload PDF, DOCX, PPTX, or ZIP files only",
        variant: "destructive",
      })
      return
    }

    if (file.size > 50 * 1024 * 1024) {
      // 50MB limit
      toast({
        title: "File too large",
        description: "Please upload files smaller than 50MB",
        variant: "destructive",
      })
      return
    }

    setSelectedFile(file)
    setFileName(file.name)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  const handleUpload = async () => {
    if (!selectedFile || !user || !fileName.trim()) {
      toast({
        title: "Missing information",
        description: "Please select a file and provide a name",
        variant: "destructive",
      })
      return
    }

    try {
      // Convert file to base64 for storage
      const reader = new FileReader()
      reader.onload = () => {
        const resource: CompanyTrainingResource = {
          id: crypto.randomUUID(),
          fileName: fileName.trim(),
          fileType: selectedFile.type,
          fileUrl: reader.result as string,
          description: description.trim(),
          uploadedBy: user.uid,
          uploaderName: user.name,
          uploadedAt: new Date().toISOString(),
          tags: tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
        }

        onUpload(resource)

        // Reset form
        setFileName("")
        setDescription("")
        setTags("")
        setSelectedFile(null)

        toast({
          title: "Success",
          description: "Resource uploaded successfully",
        })
      }
      reader.readAsDataURL(selectedFile)
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was an error uploading the file",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-w-[95vw]">
        <DialogHeader>
          <DialogTitle>Upload Company Resource</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="file-upload">Upload File</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragging ? "border-blue-400 bg-blue-50" : "border-gray-300"
              }`}
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx,.pptx,.zip"
                  onChange={handleFileInputChange}
                />
                <Button variant="outline" size="sm" onClick={() => document.getElementById("file-upload")?.click()}>
                  <Upload className="mr-2 h-4 w-4" />
                  Choose File
                </Button>
              </div>
              <p className="mt-2 text-sm text-gray-500">Drag and drop or click to upload</p>
              <p className="text-xs text-gray-400">PDF, DOCX, PPTX, ZIP up to 50MB</p>
              {selectedFile && (
                <div className="mt-3 p-2 bg-green-50 rounded text-sm text-green-700">Selected: {selectedFile.name}</div>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="fileName">File Name</Label>
            <Input
              id="fileName"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Enter a descriptive name"
            />
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the resource"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="tags">Tags (Optional)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="HR, Onboarding, Policy (comma-separated)"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!selectedFile || !fileName.trim()}>
              Upload Resource
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Mobile resource card component for small screens
const ResourceCard = ({
  resource,
  onDelete,
  onDownload,
}: {
  resource: CompanyTrainingResource
  onDelete: (id: string) => void
  onDownload: (resource: CompanyTrainingResource) => void
}) => {
  const getFileTypeIcon = (fileType: string) => {
    if (fileType.includes("pdf")) return "📄"
    if (fileType.includes("word")) return "📝"
    if (fileType.includes("presentation")) return "📊"
    if (fileType.includes("zip")) return "📦"
    return "📎"
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getFileTypeIcon(resource.fileType)}</span>
          <div>
            <CardTitle className="text-base">{resource.fileName}</CardTitle>
            <CardDescription className="text-xs">{resource.fileType.split("/").pop()?.toUpperCase()}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {resource.description && <p className="text-sm text-muted-foreground">{resource.description}</p>}

        <div className="flex flex-wrap gap-1">
          {resource.tags?.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          )) || <span className="text-muted-foreground text-xs">No tags</span>}
        </div>

        <div className="text-xs text-muted-foreground">
          <p>Uploaded by: {resource.uploaderName}</p>
          <p>Date: {format(new Date(resource.uploadedAt), "MMM d, yyyy")}</p>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => onDownload(resource)} className="flex-1">
            <Download className="h-3 w-3 mr-1" /> Download
          </Button>
          <Button variant="destructive" size="sm" onClick={() => onDelete(resource.id)} className="flex-1">
            <Trash2 className="h-3 w-3 mr-1" /> Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function CompanyResourcesTab() {
  const [resources, setResources] = useState<CompanyTrainingResource[]>([])
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const isMobile = useIsMobile()

  useEffect(() => {
    setResources(TrainingService.getCompanyTrainingResources())
  }, [])

  const handleUpload = (resource: CompanyTrainingResource) => {
    TrainingService.saveCompanyTrainingResource(resource)
    setResources(TrainingService.getCompanyTrainingResources())
    setIsUploadDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this resource?")) {
      TrainingService.deleteCompanyTrainingResource(id)
      setResources(TrainingService.getCompanyTrainingResources())
    }
  }

  const handleDownload = (resource: CompanyTrainingResource) => {
    try {
      const link = document.createElement("a")
      link.href = resource.fileUrl
      link.download = resource.fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Download failed:", error)
    }
  }

  const getFileTypeIcon = (fileType: string) => {
    if (fileType.includes("pdf")) return "📄"
    if (fileType.includes("word")) return "📝"
    if (fileType.includes("presentation")) return "📊"
    if (fileType.includes("zip")) return "📦"
    return "📎"
  }

  const filteredResources = resources.filter(
    (resource) =>
      resource.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.tags?.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-semibold">Company Resources</h2>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="w-full sm:w-72">
            <Input
              placeholder="Search resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={() => setIsUploadDialogOpen(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Upload Resource
          </Button>
        </div>
      </div>

      {resources.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No resources uploaded yet</h3>
            <p className="text-gray-500 mb-4">Upload training materials, policies, and other company resources</p>
            <Button onClick={() => setIsUploadDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Upload First Resource
            </Button>
          </CardContent>
        </Card>
      ) : isMobile ? (
        // Mobile view - cards instead of table
        <div className="space-y-4">
          {filteredResources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} onDelete={handleDelete} onDownload={handleDownload} />
          ))}
        </div>
      ) : (
        // Desktop view - table
        <Card>
          <CardHeader>
            <CardTitle>Training Resources</CardTitle>
            <CardDescription>Company-wide training materials and documentation</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResources.map((resource) => (
                  <TableRow key={resource.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getFileTypeIcon(resource.fileType)}</span>
                        <div>
                          <div className="font-medium">{resource.fileName}</div>
                          <div className="text-sm text-muted-foreground">
                            {resource.fileType.split("/").pop()?.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">{resource.description || "No description"}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {resource.tags?.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        )) || <span className="text-muted-foreground text-sm">No tags</span>}
                      </div>
                    </TableCell>
                    <TableCell>{resource.uploaderName}</TableCell>
                    <TableCell>{format(new Date(resource.uploadedAt), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleDownload(resource)}>
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(resource.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <ResourceUploadDialog
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        onUpload={handleUpload}
      />
    </div>
  )
}
