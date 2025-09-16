"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import {
  PlusCircle,
  Edit3,
  Trash2,
  CalendarIcon,
  Plus,
  X,
  Upload,
  Video,
  FileText,
  ImageIcon,
  HelpCircle,
  Clipboard,
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useIsMobile } from "@/hooks/use-mobile"
import type { Course, CourseContentBlock, QuizQuestion } from "@/types/training"
import * as TrainingService from "@/lib/training-service"
import { CustomCheckbox } from "./custom-checkbox"

const ContentBlockEditor = ({
  block,
  onUpdate,
  onDelete,
}: {
  block: CourseContentBlock
  onUpdate: (block: CourseContentBlock) => void
  onDelete: () => void
}) => {
  const [localBlock, setLocalBlock] = useState(block)

  const updateBlock = (updates: Partial<CourseContentBlock>) => {
    const updated = { ...localBlock, ...updates }
    setLocalBlock(updated)
    onUpdate(updated)
  }

  const getBlockIcon = () => {
    switch (block.type) {
      case "video":
        return <Video className="h-4 w-4" />
      case "text":
        return <FileText className="h-4 w-4" />
      case "image":
        return <ImageIcon className="h-4 w-4" />
      case "pdf":
        return <FileText className="h-4 w-4" />
      case "quiz":
        return <HelpCircle className="h-4 w-4" />
      case "assignment":
        return <Clipboard className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getBlockIcon()}
            <span className="font-medium capitalize">{block.type} Block</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor={`title-${block.id}`}>Block Title</Label>
          <Input
            id={`title-${block.id}`}
            value={localBlock.title}
            onChange={(e) => updateBlock({ title: e.target.value })}
            placeholder="Enter block title"
          />
        </div>

        {block.type === "text" && (
          <div>
            <Label htmlFor={`content-${block.id}`}>Content</Label>
            <Textarea
              id={`content-${block.id}`}
              value={localBlock.content}
              onChange={(e) => updateBlock({ content: e.target.value })}
              placeholder="Enter text content"
              rows={6}
            />
          </div>
        )}

        {block.type === "video" && (
          <div>
            <Label htmlFor={`video-${block.id}`}>Video URL (YouTube/Vimeo)</Label>
            <Input
              id={`video-${block.id}`}
              value={localBlock.content}
              onChange={(e) => updateBlock({ content: e.target.value })}
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>
        )}

        {(block.type === "image" || block.type === "pdf") && (
          <div>
            <Label htmlFor={`file-${block.id}`}>Upload {block.type.toUpperCase()}</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <Button variant="outline" size="sm">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload {block.type.toUpperCase()}
                </Button>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                {block.type === "image" ? "PNG, JPG up to 10MB" : "PDF up to 50MB"}
              </p>
            </div>
          </div>
        )}

        {block.type === "quiz" && (
          <div className="space-y-4">
            <Label>Quiz Questions</Label>
            <div className="space-y-3">
              {localBlock.quizData?.questions.map((question, qIndex) => (
                <Card key={question.id} className="p-4">
                  <div className="space-y-3">
                    <Input
                      value={question.questionText}
                      onChange={(e) => {
                        const questions = [...(localBlock.quizData?.questions || [])]
                        questions[qIndex].questionText = e.target.value
                        updateBlock({ quizData: { questions } })
                      }}
                      placeholder="Enter question"
                    />
                    <Select
                      value={question.type}
                      onValueChange={(value: "multiple-choice" | "short-answer") => {
                        const questions = [...(localBlock.quizData?.questions || [])]
                        questions[qIndex].type = value
                        updateBlock({ quizData: { questions } })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                        <SelectItem value="short-answer">Short Answer</SelectItem>
                      </SelectContent>
                    </Select>
                    {question.type === "multiple-choice" && (
                      <div className="space-y-2">
                        {question.options?.map((option, oIndex) => (
                          <Input
                            key={oIndex}
                            value={option}
                            onChange={(e) => {
                              const questions = [...(localBlock.quizData?.questions || [])]
                              const options = [...(questions[qIndex].options || [])]
                              options[oIndex] = e.target.value
                              questions[qIndex].options = options
                              updateBlock({ quizData: { questions } })
                            }}
                            placeholder={`Option ${oIndex + 1}`}
                          />
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const questions = [...(localBlock.quizData?.questions || [])]
                            questions[qIndex].options = [...(questions[qIndex].options || []), ""]
                            updateBlock({ quizData: { questions } })
                          }}
                        >
                          Add Option
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              )) || []}
              <Button
                variant="outline"
                onClick={() => {
                  const newQuestion: QuizQuestion = {
                    id: crypto.randomUUID(),
                    questionText: "",
                    type: "multiple-choice",
                    options: ["", ""],
                  }
                  const questions = [...(localBlock.quizData?.questions || []), newQuestion]
                  updateBlock({ quizData: { questions } })
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Question
              </Button>
            </div>
          </div>
        )}

        {block.type === "assignment" && (
          <div className="space-y-4">
            <div>
              <Label htmlFor={`assignment-instructions-${block.id}`}>Assignment Instructions</Label>
              <Textarea
                id={`assignment-instructions-${block.id}`}
                value={localBlock.assignmentData?.instructions || ""}
                onChange={(e) =>
                  updateBlock({
                    assignmentData: {
                      ...localBlock.assignmentData,
                      instructions: e.target.value,
                      allowedFileTypes: localBlock.assignmentData?.allowedFileTypes || ["pdf", "docx"],
                    },
                  })
                }
                placeholder="Describe what the user needs to submit"
                rows={4}
              />
            </div>
            <div>
              <Label>Allowed File Types</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {["pdf", "docx", "pptx", "jpg", "png"].map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${block.id}-${type}`}
                      checked={localBlock.assignmentData?.allowedFileTypes?.includes(type)}
                      onCheckedChange={(checked) => {
                        const current = localBlock.assignmentData?.allowedFileTypes || []
                        const updated = checked ? [...current, type] : current.filter((t) => t !== type)
                        updateBlock({
                          assignmentData: {
                            ...localBlock.assignmentData,
                            instructions: localBlock.assignmentData?.instructions || "",
                            allowedFileTypes: updated,
                          },
                        })
                      }}
                    />
                    <Label htmlFor={`${block.id}-${type}`} className="text-sm">
                      {type.toUpperCase()}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const CourseForm = ({
  course,
  onSave,
  onCancel,
}: {
  course?: Course
  onSave: (course: Course) => void
  onCancel: () => void
}) => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [title, setTitle] = useState(course?.title || "")
  const [description, setDescription] = useState(course?.description || "")
  const [isRequired, setIsRequired] = useState(course?.isRequired || false)
  const [dueDate, setDueDate] = useState<Date | undefined>(course?.dueDate ? new Date(course.dueDate) : undefined)
  const [contentBlocks, setContentBlocks] = useState<CourseContentBlock[]>(course?.contentBlocks || [])
  const [assignedUserIds, setAssignedUserIds] = useState<string[]>(course?.assignedToUserIds || [])
  const [assignedTeamIds, setAssignedTeamIds] = useState<string[]>(course?.assignedToTeamIds || [])

  const addContentBlock = (type: CourseContentBlock["type"]) => {
    const newBlock: CourseContentBlock = {
      id: crypto.randomUUID(),
      type,
      title: "",
      content: "",
      order: contentBlocks.length,
      ...(type === "quiz" && { quizData: { questions: [] } }),
      ...(type === "assignment" && { assignmentData: { instructions: "", allowedFileTypes: ["pdf"] } }),
    }
    setContentBlocks([...contentBlocks, newBlock])
  }

  const updateContentBlock = (index: number, block: CourseContentBlock) => {
    const updated = [...contentBlocks]
    updated[index] = block
    setContentBlocks(updated)
  }

  const deleteContentBlock = (index: number) => {
    setContentBlocks(contentBlocks.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title || !user) {
      toast({
        title: "Error",
        description: "Please fill in the course title",
        variant: "destructive",
      })
      return
    }

    const newCourse: Course = {
      id: course?.id || crypto.randomUUID(),
      title,
      description,
      contentBlocks: contentBlocks.map((block, index) => ({ ...block, order: index })),
      createdBy: user.uid,
      creatorName: user.name,
      createdAt: course?.createdAt || new Date().toISOString(),
      isRequired,
      dueDate: dueDate?.toISOString(),
      assignedToUserIds: assignedUserIds,
      assignedToTeamIds: assignedTeamIds,
    }

    onSave(newCourse)
  }

  const handleUserCheckboxChange = (userId: string, isChecked: boolean) => {
    if (isChecked) {
      setAssignedUserIds((prev) => [...prev, userId])
    } else {
      setAssignedUserIds((prev) => prev.filter((id) => id !== userId))
    }
  }

  const handleTeamCheckboxChange = (teamId: string, isChecked: boolean) => {
    if (isChecked) {
      setAssignedTeamIds((prev) => [...prev, teamId])
    } else {
      setAssignedTeamIds((prev) => prev.filter((id) => id !== teamId))
    }
  }

  const allUsers = TrainingService.getAllUsers()
  const allTeams = TrainingService.getAllTeams()

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Course Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Introduction to Settlyfe"
            required
          />
        </div>
        <div>
          <Label>Due Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn("w-full justify-start text-left font-normal", !dueDate && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dueDate ? format(dueDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief overview of the course"
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch id="isRequired" checked={isRequired} onCheckedChange={setIsRequired} />
        <Label htmlFor="isRequired">Required Course</Label>
      </div>

      {allTeams.length > 0 && (
        <div>
          <Label>Assign to Teams</Label>
          <div className="flex gap-2 mt-2 flex-wrap">
            {allTeams.map((team) => (
              <CustomCheckbox
                key={team.id}
                id={`team-${team.id}`}
                label={team.name}
                isChecked={assignedTeamIds.includes(team.id)}
                onChange={(checked) => handleTeamCheckboxChange(team.id, checked)}
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <Label>Assign to Specific Users</Label>
        {allUsers.length === 0 ? (
          <div className="text-center py-4 text-gray-500 border rounded">
            No users found. Please create user accounts first.
          </div>
        ) : (
          <div className="max-h-32 overflow-y-auto border rounded p-2 mt-2">
            {allUsers.map((userItem) => (
              <CustomCheckbox
                key={userItem.id}
                id={`user-${userItem.id}`}
                label={`${userItem.name} (${userItem.role})`}
                isChecked={assignedUserIds.includes(userItem.id)}
                onChange={(checked) => handleUserCheckboxChange(userItem.id, checked)}
              />
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <Label className="text-lg font-semibold">Content Blocks</Label>
          <Select onValueChange={(value) => addContentBlock(value as CourseContentBlock["type"])}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Add Content Block" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">📄 Text Block</SelectItem>
              <SelectItem value="video">📹 Video Block</SelectItem>
              <SelectItem value="image">🖼️ Image Block</SelectItem>
              <SelectItem value="pdf">📎 PDF Block</SelectItem>
              <SelectItem value="quiz">❓ Quiz Block</SelectItem>
              <SelectItem value="assignment">📤 Assignment Block</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {contentBlocks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No content blocks added yet. Use the dropdown above to add your first block.
          </div>
        ) : (
          <div className="space-y-4">
            {contentBlocks.map((block, index) => (
              <ContentBlockEditor
                key={block.id}
                block={block}
                onUpdate={(updatedBlock) => updateContentBlock(index, updatedBlock)}
                onDelete={() => deleteContentBlock(index)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{course ? "Update Course" : "Create Course"}</Button>
      </div>
    </form>
  )
}

export default function ManageCoursesTab() {
  const [courses, setCourses] = useState<Course[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | undefined>(undefined)
  const { toast } = useToast()
  const isMobile = useIsMobile()

  useEffect(() => {
    setCourses(TrainingService.getCourses())
  }, [])

  const handleSaveCourse = (course: Course) => {
    try {
      TrainingService.saveCourse(course)
      setCourses(TrainingService.getCourses())
      setIsCreateDialogOpen(false)
      setEditingCourse(undefined)
      toast({
        title: "Success",
        description: `Course ${course.id ? "updated" : "created"} successfully`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save course",
        variant: "destructive",
      })
    }
  }

  const handleDeleteCourse = (id: string) => {
    if (window.confirm("Are you sure you want to delete this course?")) {
      TrainingService.deleteCourse(id)
      setCourses(TrainingService.getCourses())
      toast({
        title: "Success",
        description: "Course deleted successfully",
      })
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-semibold">Manage Courses</h2>
        <Dialog
          open={isCreateDialogOpen || !!editingCourse}
          onOpenChange={(open) => {
            if (!open) {
              setIsCreateDialogOpen(false)
              setEditingCourse(undefined)
            }
          }}
        >
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingCourse(undefined)
                setIsCreateDialogOpen(true)
              }}
              className="w-full sm:w-auto"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Course
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-4xl max-w-[95vw]">
            <DialogHeader>
              <DialogTitle>{editingCourse ? "Edit Course" : "Create New Course"}</DialogTitle>
            </DialogHeader>
            <CourseForm
              course={editingCourse}
              onSave={handleSaveCourse}
              onCancel={() => {
                setIsCreateDialogOpen(false)
                setEditingCourse(undefined)
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">No courses created yet</div>
          <Button variant="outline" onClick={() => setIsCreateDialogOpen(true)} className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Your First Course
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card key={course.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{course.title}</CardTitle>
                    <CardDescription className="mt-2">
                      {course.description.substring(0, 100)}
                      {course.description.length > 100 && "..."}
                    </CardDescription>
                  </div>
                  {course.isRequired && <Badge variant="secondary">Required</Badge>}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>Created by: {course.creatorName}</p>
                  <p>Content blocks: {course.contentBlocks.length}</p>
                  {course.dueDate && <p>Due: {format(new Date(course.dueDate), "PPP")}</p>}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                <Button
                  variant="outline"
                  size={isMobile ? "default" : "sm"}
                  onClick={() => setEditingCourse(course)}
                  className="w-full sm:w-auto"
                >
                  <Edit3 className="mr-1 h-3 w-3" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size={isMobile ? "default" : "sm"}
                  onClick={() => handleDeleteCourse(course.id)}
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="mr-1 h-3 w-3" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
