"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { PlusCircle, Edit3, Trash2, CalendarIcon, Plus, X, MessageSquare, Users, Clock } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import type { Interview, InterviewQuestion } from "@/types/training"
import * as TrainingService from "@/lib/training-service"
import { CustomCheckbox } from "./custom-checkbox"

const InterviewQuestionEditor = ({
  question,
  onUpdate,
  onDelete,
}: {
  question: InterviewQuestion
  onUpdate: (question: InterviewQuestion) => void
  onDelete: () => void
}) => {
  const [localQuestion, setLocalQuestion] = useState(question)

  const updateQuestion = (updates: Partial<InterviewQuestion>) => {
    const updated = { ...localQuestion, ...updates }
    setLocalQuestion(updated)
    onUpdate(updated)
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="font-medium">Question {question.order + 1}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor={`question-${question.id}`}>Question Text</Label>
          <Textarea
            id={`question-${question.id}`}
            value={localQuestion.questionText}
            onChange={(e) => updateQuestion({ questionText: e.target.value })}
            placeholder="Enter your interview question"
            rows={3}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id={`upload-${question.id}`}
            checked={localQuestion.requiresUpload}
            onCheckedChange={(checked) => updateQuestion({ requiresUpload: checked })}
          />
          <Label htmlFor={`upload-${question.id}`}>Requires file upload</Label>
        </div>
      </CardContent>
    </Card>
  )
}

const InterviewForm = ({
  interview,
  onSave,
  onCancel,
}: {
  interview?: Interview
  onSave: (interview: Interview) => void
  onCancel: () => void
}) => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [title, setTitle] = useState(interview?.title || "")
  const [description, setDescription] = useState(interview?.description || "")
  const [deadline, setDeadline] = useState<Date | undefined>(
    interview?.deadline ? new Date(interview.deadline) : undefined,
  )
  const [requiresResume, setRequiresResume] = useState(interview?.requiresResume || false)
  const [requiresScheduling, setRequiresScheduling] = useState(interview?.requiresScheduling || false)
  const [assignedUserIds, setAssignedUserIds] = useState<string[]>(interview?.assignedToUserIds || [])
  const [questions, setQuestions] = useState<InterviewQuestion[]>(interview?.questions || [])

  const addQuestion = () => {
    const newQuestion: InterviewQuestion = {
      id: crypto.randomUUID(),
      questionText: "",
      requiresUpload: false,
      order: questions.length,
    }
    setQuestions([...questions, newQuestion])
  }

  const updateQuestion = (index: number, question: InterviewQuestion) => {
    const updated = [...questions]
    updated[index] = question
    setQuestions(updated)
  }

  const deleteQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    if (!title || !user || questions.length === 0) {
      toast({
        title: "Error",
        description: "Please fill in title and add at least one question",
        variant: "destructive",
      })
      return
    }

    const newInterview: Interview = {
      id: interview?.id || crypto.randomUUID(),
      title,
      description,
      questions: questions.map((q, index) => ({ ...q, order: index })),
      createdBy: user.uid,
      creatorName: user.name,
      createdAt: interview?.createdAt || new Date().toISOString(),
      deadline: deadline?.toISOString(),
      assignedToUserIds: assignedUserIds,
      requiresResume,
      requiresScheduling,
    }

    onSave(newInterview)
    toast({
      title: "Success",
      description: `Interview ${interview ? "updated" : "created"} successfully`,
    })
  }

  const handleUserCheckboxChange = (userId: string, isChecked: boolean) => {
    if (isChecked) {
      setAssignedUserIds((prev) => [...prev, userId])
    } else {
      setAssignedUserIds((prev) => prev.filter((id) => id !== userId))
    }
  }

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Interview Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Sales Position Interview"
          />
        </div>
        <div>
          <Label>Deadline</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-full justify-start text-left font-normal", !deadline && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {deadline ? format(deadline, "PPP") : "Pick a deadline"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={deadline} onSelect={setDeadline} initialFocus />
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
          placeholder="Brief description of the interview"
          rows={3}
        />
      </div>

      <div className="flex gap-6">
        <div className="flex items-center space-x-2">
          <Switch id="requiresResume" checked={requiresResume} onCheckedChange={setRequiresResume} />
          <Label htmlFor="requiresResume">Requires Resume Upload</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch id="requiresScheduling" checked={requiresScheduling} onCheckedChange={setRequiresScheduling} />
          <Label htmlFor="requiresScheduling">Requires Interview Scheduling</Label>
        </div>
      </div>

      <div>
        <Label>Assign to Specific Users</Label>
        <div className="max-h-32 overflow-y-auto border rounded p-2 mt-2">
          {TrainingService.getAllUsers().map((userItem) => (
            <CustomCheckbox
              key={userItem.id}
              id={`interview-user-${userItem.id}`}
              label={`${userItem.name} (${userItem.role})`}
              isChecked={assignedUserIds.includes(userItem.id)}
              onChange={(checked) => handleUserCheckboxChange(userItem.id, checked)}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <Label className="text-lg font-semibold">Interview Questions</Label>
          <Button onClick={addQuestion} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add Question
          </Button>
        </div>

        {questions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No questions added yet. Click "Add Question" to get started.
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((question, index) => (
              <InterviewQuestionEditor
                key={question.id}
                question={question}
                onUpdate={(updatedQuestion) => updateQuestion(index, updatedQuestion)}
                onDelete={() => deleteQuestion(index)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>{interview ? "Update Interview" : "Create Interview"}</Button>
      </div>
    </div>
  )
}

export default function ManageInterviewsTab() {
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingInterview, setEditingInterview] = useState<Interview | undefined>(undefined)

  useEffect(() => {
    setInterviews(TrainingService.getInterviews())
  }, [])

  const handleSaveInterview = (interview: Interview) => {
    TrainingService.saveInterview(interview)
    setInterviews(TrainingService.getInterviews())
    setIsCreateDialogOpen(false)
    setEditingInterview(undefined)
  }

  const handleDeleteInterview = (id: string) => {
    if (window.confirm("Are you sure you want to delete this interview?")) {
      TrainingService.deleteInterview(id)
      setInterviews(TrainingService.getInterviews())
    }
  }

  const getAssignedCount = (interview: Interview) => {
    return TrainingService.getAllUsersFromAssignment(interview.assignedToUserIds, interview.assignedToTeamIds).length
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Manage Interviews</h2>
        <Dialog
          open={isCreateDialogOpen || !!editingInterview}
          onOpenChange={(open) => {
            if (!open) {
              setIsCreateDialogOpen(false)
              setEditingInterview(undefined)
            }
          }}
        >
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingInterview(undefined)
                setIsCreateDialogOpen(true)
              }}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Interview
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>{editingInterview ? "Edit Interview" : "Create New Interview"}</DialogTitle>
            </DialogHeader>
            <InterviewForm
              interview={editingInterview}
              onSave={handleSaveInterview}
              onCancel={() => {
                setIsCreateDialogOpen(false)
                setEditingInterview(undefined)
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {interviews.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">No interviews created yet</div>
          <Button variant="outline" onClick={() => setIsCreateDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Your First Interview
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {interviews.map((interview) => (
            <Card key={interview.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{interview.title}</CardTitle>
                    <CardDescription className="mt-2">
                      {interview.description.substring(0, 100)}
                      {interview.description.length > 100 && "..."}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>Created by: {interview.creatorName}</p>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <span>{interview.questions.length} questions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{getAssignedCount(interview)} assigned</span>
                  </div>
                  {interview.deadline && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Due: {format(new Date(interview.deadline), "PPP")}</span>
                    </div>
                  )}
                  <div className="flex gap-1 flex-wrap">
                    {interview.requiresResume && (
                      <Badge variant="outline" className="text-xs">
                        Resume Required
                      </Badge>
                    )}
                    {interview.requiresScheduling && (
                      <Badge variant="outline" className="text-xs">
                        Scheduling Required
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button variant="outline" size="sm" onClick={() => setEditingInterview(interview)}>
                  <Edit3 className="mr-1 h-3 w-3" />
                  Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDeleteInterview(interview.id)}>
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
