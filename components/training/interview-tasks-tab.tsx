"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, CalendarIcon, Clock, CheckCircle, AlertCircle, FileText, MessageSquare } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import type { Interview, InterviewSubmission } from "@/types/training"
import * as TrainingService from "@/lib/training-service"

const InterviewCard = ({
  interview,
  submission,
  onStartInterview,
}: {
  interview: Interview
  submission?: InterviewSubmission
  onStartInterview: (interview: Interview) => void
}) => {
  const getStatusBadge = () => {
    if (!submission) return <Badge variant="outline">Not Started</Badge>
    switch (submission.status) {
      case "approved":
        return <Badge variant="default">Approved</Badge>
      case "submitted":
        return <Badge variant="secondary">Under Review</Badge>
      case "reviewing":
        return <Badge variant="secondary">Reviewing</Badge>
      case "retry":
        return <Badge variant="destructive">Needs Retry</Badge>
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="outline">Pending</Badge>
    }
  }

  const isOverdue = interview.deadline && new Date(interview.deadline) < new Date()
  const isComplete = submission?.status === "submitted" || submission?.status === "approved"

  return (
    <Card className={`hover:shadow-lg transition-shadow ${isOverdue && !isComplete ? "border-red-300" : ""}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{interview.title}</CardTitle>
              {isOverdue && !isComplete && <Badge variant="destructive">Overdue</Badge>}
            </div>
            <CardDescription className="mt-2">
              {interview.description.substring(0, 120)}
              {interview.description.length > 120 && "..."}
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span>{interview.questions?.length || 0} questions</span>
            </div>
            {interview.deadline && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Due {format(new Date(interview.deadline), "MMM d")}</span>
              </div>
            )}
          </div>

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

          {submission && (
            <div className="text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                {submission.resumeFile ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                )}
                <span>Resume: {submission.resumeFile ? "Uploaded" : "Not uploaded"}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                {submission.answers.length > 0 ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                )}
                <span>
                  Questions: {submission.answers.length}/{interview.questions?.length || 0} answered
                </span>
              </div>
              {interview.requiresScheduling && (
                <div className="flex items-center gap-2 mt-1">
                  {submission.scheduledTime ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                  )}
                  <span>
                    Interview:{" "}
                    {submission.scheduledTime ? format(new Date(submission.scheduledTime), "PPP") : "Not scheduled"}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
      <CardContent className="pt-0">
        <Button onClick={() => onStartInterview(interview)} className="w-full">
          {submission?.status === "approved" ? "View Results" : submission ? "Continue Interview" : "Start Interview"}
        </Button>
      </CardContent>
    </Card>
  )
}

const InterviewViewer = ({
  interview,
  submission,
  onBackToInterviews,
  onSaveSubmission,
}: {
  interview: Interview
  submission?: InterviewSubmission
  onBackToInterviews: () => void
  onSaveSubmission: (submission: InterviewSubmission) => void
}) => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [answers, setAnswers] = useState<
    { questionId: string; answerText: string; uploadedFile?: { name: string; url: string } }[]
  >(submission?.answers || [])
  const [resumeFile, setResumeFile] = useState<{ name: string; url: string; type: string } | undefined>(
    submission?.resumeFile,
  )
  const [scheduledTime, setScheduledTime] = useState<Date | undefined>(
    submission?.scheduledTime ? new Date(submission.scheduledTime) : undefined,
  )

  const handleAnswerChange = (questionId: string, answerText: string) => {
    setAnswers((prev) => {
      const existing = prev.find((a) => a.questionId === questionId)
      if (existing) {
        return prev.map((a) => (a.questionId === questionId ? { ...a, answerText } : a))
      } else {
        return [...prev, { questionId, answerText }]
      }
    })
  }

  const handleSubmit = () => {
    if (!user) return

    // Validate required fields
    if (interview.requiresResume && !resumeFile) {
      toast({
        title: "Resume Required",
        description: "Please upload your resume before submitting",
        variant: "destructive",
      })
      return
    }

    if (answers.length < (interview.questions?.length || 0)) {
      toast({
        title: "Incomplete Answers",
        description: "Please answer all questions before submitting",
        variant: "destructive",
      })
      return
    }

    if (interview.requiresScheduling && !scheduledTime) {
      toast({
        title: "Schedule Required",
        description: "Please schedule your interview time before submitting",
        variant: "destructive",
      })
      return
    }

    const newSubmission: InterviewSubmission = {
      id: submission?.id || crypto.randomUUID(),
      userId: user.uid,
      interviewId: interview.id,
      resumeFile,
      answers,
      scheduledTime: scheduledTime?.toISOString(),
      submittedAt: new Date().toISOString(),
      status: "submitted",
    }

    onSaveSubmission(newSubmission)
    toast({
      title: "Interview Submitted",
      description: "Your interview has been submitted for review",
    })
  }

  const isSubmitted = submission?.status === "submitted" || submission?.status === "approved"

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={onBackToInterviews}>
          ← Back to Interviews
        </Button>
        <Badge variant={isSubmitted ? "default" : "secondary"}>{isSubmitted ? "Submitted" : "Draft"}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{interview.title}</CardTitle>
          <CardDescription>{interview.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Resume Upload Section */}
          {interview.requiresResume && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Resume Upload</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                {resumeFile ? (
                  <div className="text-center">
                    <FileText className="mx-auto h-12 w-12 text-green-500 mb-2" />
                    <p className="font-medium">{resumeFile.name}</p>
                    <p className="text-sm text-muted-foreground">Resume uploaded successfully</p>
                    {!isSubmitted && (
                      <Button variant="outline" size="sm" className="mt-2" onClick={() => setResumeFile(undefined)}>
                        Replace File
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <div className="mb-4">
                      <Button variant="outline" disabled={isSubmitted}>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Resume
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500">PDF, DOC, or DOCX up to 10MB</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Interview Questions */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Interview Questions</h3>
            <div className="space-y-6">
              {interview.questions?.map((question, index) => {
                const answer = answers.find((a) => a.questionId === question.id)
                return (
                  <Card key={question.id}>
                    <CardContent className="pt-6">
                      <Label className="text-base font-medium">
                        {index + 1}. {question.questionText}
                      </Label>
                      <Textarea
                        value={answer?.answerText || ""}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        placeholder="Enter your answer..."
                        rows={4}
                        className="mt-3"
                        disabled={isSubmitted}
                      />
                      {question.requiresUpload && (
                        <div className="mt-4 border-2 border-dashed border-gray-200 rounded-lg p-4">
                          <div className="text-center">
                            <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                            <Button variant="outline" size="sm" disabled={isSubmitted}>
                              Upload Supporting File
                            </Button>
                            <p className="text-xs text-gray-500 mt-1">Optional supporting document</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              }) || <p>No questions available</p>}
            </div>
          </div>

          {/* Interview Scheduling */}
          {interview.requiresScheduling && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Schedule Interview</h3>
              <Card>
                <CardContent className="pt-6">
                  <Label>Select your preferred interview time</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal mt-2",
                          !scheduledTime && "text-muted-foreground",
                        )}
                        disabled={isSubmitted}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {scheduledTime ? format(scheduledTime, "PPP 'at' p") : "Pick a date and time"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={scheduledTime} onSelect={setScheduledTime} initialFocus />
                    </PopoverContent>
                  </Popover>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Submit Button */}
          {!isSubmitted && (
            <div className="pt-6 border-t">
              <Button onClick={handleSubmit} className="w-full" size="lg">
                Submit Interview
              </Button>
            </div>
          )}

          {/* Submission Status */}
          {isSubmitted && (
            <div className="pt-6 border-t">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Interview Submitted</span>
                  </div>
                  <p className="text-green-700 mt-2">
                    Your interview has been submitted and is under review. You will be notified once feedback is
                    available.
                  </p>
                  {submission?.submittedAt && (
                    <p className="text-sm text-green-600 mt-2">
                      Submitted on {format(new Date(submission.submittedAt), "PPP 'at' p")}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function InterviewTasksTab() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [submissions, setSubmissions] = useState<InterviewSubmission[]>([])
  const [viewingInterview, setViewingInterview] = useState<Interview | null>(null)
  const [activeTab, setActiveTab] = useState("pending")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadUserInterviews()
    }
  }, [user])

  const loadUserInterviews = async () => {
    if (!user) return

    try {
      setLoading(true)

      const allInterviews = TrainingService.getInterviews()
      const userSubmissions = TrainingService.getInterviewSubmissionsForUser(user.uid)

      // Get interviews assigned to user directly (no team assignment for interviews)
      const assignedInterviews = allInterviews.filter((interview) => {
        return interview.assignedToUserIds?.includes(user.uid)
      })

      setInterviews(assignedInterviews)
      setSubmissions(userSubmissions)
    } catch (error) {
      console.error("Error loading user interviews:", error)
      toast({
        title: "Error",
        description: "Failed to load interview data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStartInterview = (interview: Interview) => {
    setViewingInterview(interview)
  }

  const handleSaveSubmission = (submission: InterviewSubmission) => {
    try {
      TrainingService.saveInterviewSubmission(submission)
      loadUserInterviews()
      setViewingInterview(null)
    } catch (error) {
      console.error("Error saving submission:", error)
      toast({
        title: "Error",
        description: "Failed to save submission",
        variant: "destructive",
      })
    }
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Please log in to view your interviews</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="text-muted-foreground mt-4">Loading your interviews...</p>
      </div>
    )
  }

  const pendingInterviews = interviews.filter((interview) => {
    const submission = submissions.find((s) => s.interviewId === interview.id)
    return !submission || submission.status === "pending"
  })

  const submittedInterviews = interviews.filter((interview) => {
    const submission = submissions.find((s) => s.interviewId === interview.id)
    return submission && (submission.status === "submitted" || submission.status === "reviewing")
  })

  const completedInterviews = interviews.filter((interview) => {
    const submission = submissions.find((s) => s.interviewId === interview.id)
    return submission && (submission.status === "approved" || submission.status === "rejected")
  })

  const retryInterviews = interviews.filter((interview) => {
    const submission = submissions.find((s) => s.interviewId === interview.id)
    return submission && submission.status === "retry"
  })

  if (viewingInterview) {
    const submission = submissions.find((s) => s.interviewId === viewingInterview.id)
    return (
      <InterviewViewer
        interview={viewingInterview}
        submission={submission}
        onBackToInterviews={() => setViewingInterview(null)}
        onSaveSubmission={handleSaveSubmission}
      />
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Interview Tasks</h2>

      {interviews.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">No Interviews Assigned</h3>
          <p className="text-muted-foreground">You don't have any interviews assigned yet.</p>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending" className="relative">
              Pending
              {pendingInterviews.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                  {pendingInterviews.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="submitted">Under Review</TabsTrigger>
            <TabsTrigger value="retry" className="relative">
              Retry Required
              {retryInterviews.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                  {retryInterviews.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            {pendingInterviews.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No pending interviews</div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {pendingInterviews.map((interview) => (
                  <InterviewCard
                    key={interview.id}
                    interview={interview}
                    submission={submissions.find((s) => s.interviewId === interview.id)}
                    onStartInterview={handleStartInterview}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="submitted" className="mt-6">
            {submittedInterviews.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No interviews under review</div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {submittedInterviews.map((interview) => (
                  <InterviewCard
                    key={interview.id}
                    interview={interview}
                    submission={submissions.find((s) => s.interviewId === interview.id)}
                    onStartInterview={handleStartInterview}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="retry" className="mt-6">
            {retryInterviews.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No interviews need retry</div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {retryInterviews.map((interview) => (
                  <InterviewCard
                    key={interview.id}
                    interview={interview}
                    submission={submissions.find((s) => s.interviewId === interview.id)}
                    onStartInterview={handleStartInterview}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            {completedInterviews.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No completed interviews yet</div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {completedInterviews.map((interview) => (
                  <InterviewCard
                    key={interview.id}
                    interview={interview}
                    submission={submissions.find((s) => s.interviewId === interview.id)}
                    onStartInterview={handleStartInterview}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
