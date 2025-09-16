"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, Star, FileText, Award } from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import type { TrainingProgress, Course, TrainingFeedback, InterviewSubmission, QuestionGrade } from "@/types/training"
import * as TrainingService from "@/lib/training-service"

interface UserProgressSummary {
  userId: string
  userName: string
  assignedCourses: Course[]
  progress: TrainingProgress[]
  overallCompletion: number
  lastActivity: string
  interviewSubmissions?: InterviewSubmission[]
}

const QuestionGradeEditor = ({
  questionId,
  questionText,
  answer,
  currentGrade,
  onGradeUpdate,
}: {
  questionId: string
  questionText: string
  answer: string
  currentGrade?: QuestionGrade
  onGradeUpdate: (grade: QuestionGrade) => void
}) => {
  const [score, setScore] = useState(currentGrade?.score || 0)
  const [maxScore, setMaxScore] = useState(currentGrade?.maxScore || 100)
  const [comments, setComments] = useState(currentGrade?.comments || "")
  const [feedback, setFeedback] = useState(currentGrade?.feedback || "")

  const handleSave = () => {
    const grade: QuestionGrade = {
      questionId,
      score,
      maxScore,
      comments,
      feedback,
    }
    onGradeUpdate(grade)
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-base">{questionText}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Student Answer:</Label>
          <div className="mt-1 p-3 bg-muted rounded-md">
            <p className="text-sm">{answer}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`score-${questionId}`}>Score</Label>
            <Input
              id={`score-${questionId}`}
              type="number"
              min="0"
              max={maxScore}
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor={`maxScore-${questionId}`}>Max Score</Label>
            <Input
              id={`maxScore-${questionId}`}
              type="number"
              min="1"
              value={maxScore}
              onChange={(e) => setMaxScore(Number(e.target.value))}
            />
          </div>
        </div>

        <div>
          <Label htmlFor={`comments-${questionId}`}>Comments</Label>
          <Textarea
            id={`comments-${questionId}`}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Add comments about this answer..."
            rows={2}
          />
        </div>

        <div>
          <Label htmlFor={`feedback-${questionId}`}>Feedback & Advice</Label>
          <Textarea
            id={`feedback-${questionId}`}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Provide constructive feedback and advice for improvement..."
            rows={3}
          />
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Score: {score}/{maxScore} ({Math.round((score / maxScore) * 100)}%)
          </div>
          <Button onClick={handleSave} size="sm">
            Save Grade
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

const UserDetailsDialog = ({
  user,
  isOpen,
  onClose,
}: {
  user: UserProgressSummary | null
  isOpen: boolean
  onClose: () => void
}) => {
  const { user: currentUser } = useAuth()
  const { toast } = useToast()
  const [feedbackRating, setFeedbackRating] = useState(5)
  const [feedbackNotes, setFeedbackNotes] = useState("")
  const [feedbackDecision, setFeedbackDecision] = useState<"approved" | "retry" | "rejected">("approved")
  const [selectedCourseId, setSelectedCourseId] = useState("")

  if (!user) return null

  const handleSaveFeedback = () => {
    if (!currentUser || !selectedCourseId) {
      toast({
        title: "Error",
        description: "Please select a course and fill in all fields",
        variant: "destructive",
      })
      return
    }

    const feedback: TrainingFeedback = {
      id: crypto.randomUUID(),
      targetId: selectedCourseId,
      targetType: "course",
      userId: user.userId,
      reviewerId: currentUser.uid,
      reviewerName: currentUser.name,
      rating: feedbackRating,
      notes: feedbackNotes,
      decision: feedbackDecision,
      createdAt: new Date().toISOString(),
    }

    TrainingService.saveTrainingFeedback(feedback)

    toast({
      title: "Success",
      description: "Feedback saved successfully",
    })

    setFeedbackRating(5)
    setFeedbackNotes("")
    setFeedbackDecision("approved")
    setSelectedCourseId("")
  }

  const handleQuestionGradeUpdate = (submissionId: string, grade: QuestionGrade) => {
    // Update the interview submission with the new grade
    const submissions = TrainingService.getAllInterviewSubmissions()
    const submissionIndex = submissions.findIndex((s) => s.id === submissionId)

    if (submissionIndex > -1) {
      const submission = submissions[submissionIndex]
      const answerIndex = submission.answers.findIndex((a) => a.questionId === grade.questionId)

      if (answerIndex > -1) {
        submission.answers[answerIndex].grade = grade
        TrainingService.saveInterviewSubmission(submission)

        toast({
          title: "Success",
          description: "Grade saved successfully",
        })
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Training Details - {user.userName}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="courses" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="courses">Course Progress</TabsTrigger>
            <TabsTrigger value="interviews">Interview Submissions</TabsTrigger>
            <TabsTrigger value="feedback">Provide Feedback</TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-4">Course Progress</h3>
              <div className="space-y-4">
                {user.progress.map((progress) => {
                  const course = user.assignedCourses.find((c) => c.id === progress.courseId)
                  if (!course) return null

                  return (
                    <Card key={progress.id}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-base">{course.title}</CardTitle>
                            <CardDescription>
                              Status:{" "}
                              <Badge
                                variant={
                                  progress.status === "completed"
                                    ? "default"
                                    : progress.status === "in-progress"
                                      ? "secondary"
                                      : "outline"
                                }
                              >
                                {progress.status.replace("-", " ")}
                              </Badge>
                            </CardDescription>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">{progress.completionPercentage}%</div>
                            <div className="text-sm text-muted-foreground">Complete</div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Progress value={progress.completionPercentage} className="mb-2" />
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Lessons completed:</span>
                            <span className="ml-2">
                              {progress.completedLessons.length}/{course.contentBlocks.length}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Last activity:</span>
                            <span className="ml-2">{format(new Date(progress.lastActivityDate), "MMM d, yyyy")}</span>
                          </div>
                        </div>
                        {Object.keys(progress.quizScores).length > 0 && (
                          <div className="mt-3">
                            <span className="text-muted-foreground text-sm">Quiz scores:</span>
                            <div className="flex gap-2 mt-1">
                              {Object.entries(progress.quizScores).map(([quizId, score]) => (
                                <Badge key={quizId} variant={score.passed ? "default" : "destructive"}>
                                  {score.score}% {score.passed ? "✓" : "✗"}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="interviews" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-4">Interview Submissions</h3>
              {user.interviewSubmissions && user.interviewSubmissions.length > 0 ? (
                <div className="space-y-6">
                  {user.interviewSubmissions.map((submission) => {
                    const interview = TrainingService.getInterviewById(submission.interviewId)
                    return (
                      <Card key={submission.id}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">{interview?.title || "Interview"}</CardTitle>
                              <CardDescription>
                                Submitted: {format(new Date(submission.submittedAt), "PPP")}
                              </CardDescription>
                            </div>
                            <Badge
                              variant={
                                submission.status === "approved"
                                  ? "default"
                                  : submission.status === "rejected"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {submission.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {submission.resumeFile && (
                            <div>
                              <Label className="text-sm font-medium">Resume:</Label>
                              <div className="flex items-center gap-2 mt-1">
                                <FileText className="h-4 w-4" />
                                <span className="text-sm">{submission.resumeFile.name}</span>
                              </div>
                            </div>
                          )}

                          <div>
                            <Label className="text-sm font-medium mb-3 block">Interview Answers & Grading:</Label>
                            <div className="space-y-4">
                              {submission.answers.map((answer, index) => (
                                <QuestionGradeEditor
                                  key={answer.questionId}
                                  questionId={answer.questionId}
                                  questionText={
                                    interview?.questions.find((q) => q.id === answer.questionId)?.questionText ||
                                    `Question ${index + 1}`
                                  }
                                  answer={answer.answerText}
                                  currentGrade={answer.grade}
                                  onGradeUpdate={(grade) => handleQuestionGradeUpdate(submission.id, grade)}
                                />
                              ))}
                            </div>
                          </div>

                          {submission.overallGrade && (
                            <div className="mt-4 p-4 bg-muted rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <Award className="h-5 w-5" />
                                <span className="font-medium">Overall Grade</span>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  Score: {submission.overallGrade.totalScore}/{submission.overallGrade.maxScore}
                                </div>
                                <div>Percentage: {submission.overallGrade.percentage}%</div>
                              </div>
                              {submission.overallGrade.comments && (
                                <div className="mt-2">
                                  <span className="text-sm font-medium">Comments:</span>
                                  <p className="text-sm text-muted-foreground">{submission.overallGrade.comments}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No interview submissions found</div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="feedback" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-4">Provide Overall Feedback</h3>
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <Label htmlFor="course-select">Select Course</Label>
                    <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a course to provide feedback on" />
                      </SelectTrigger>
                      <SelectContent>
                        {user.assignedCourses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="rating">Rating</Label>
                    <div className="flex items-center gap-2 mt-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFeedbackRating(star)}
                          className={`p-1 ${star <= feedbackRating ? "text-yellow-400" : "text-gray-300"}`}
                        >
                          <Star className="h-6 w-6 fill-current" />
                        </button>
                      ))}
                      <span className="ml-2 text-sm text-muted-foreground">
                        {feedbackRating} star{feedbackRating !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={feedbackNotes}
                      onChange={(e) => setFeedbackNotes(e.target.value)}
                      placeholder="Provide detailed feedback..."
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="decision">Final Decision</Label>
                    <Select
                      value={feedbackDecision}
                      onValueChange={(value: "approved" | "retry" | "rejected") => setFeedbackDecision(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="approved">✓ Approved</SelectItem>
                        <SelectItem value="retry">↻ Retry</SelectItem>
                        <SelectItem value="rejected">✗ Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={handleSaveFeedback} className="w-full">
                    Save Feedback
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

export default function TrackProgressTab() {
  const [userProgressData, setUserProgressData] = useState<UserProgressSummary[]>([])
  const [selectedUser, setSelectedUser] = useState<UserProgressSummary | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    loadProgressData()
  }, [])

  const loadProgressData = () => {
    const allUsers = TrainingService.getAllUsers()
    const allCourses = TrainingService.getCourses()
    const allProgress = TrainingService.getAllTrainingProgress()
    const allInterviewSubmissions = TrainingService.getAllInterviewSubmissions()

    const progressSummaries: UserProgressSummary[] = allUsers.map((user) => {
      const userProgress = allProgress.filter((p) => p.userId === user.id)

      const assignedCourses = allCourses.filter((course) => {
        const isDirectlyAssigned = course.assignedToUserIds?.includes(user.id)
        const isTeamAssigned = course.assignedToTeamIds?.some((teamId) => {
          const teamMembers = TrainingService.getUsersInTeam(teamId)
          return teamMembers.includes(user.id)
        })
        return isDirectlyAssigned || isTeamAssigned
      })

      const interviewSubmissions = allInterviewSubmissions.filter((sub) => sub.userId === user.id)

      const totalCompletion =
        userProgress.length > 0
          ? userProgress.reduce((sum, p) => sum + (p.completionPercentage || 0), 0) / userProgress.length
          : 0

      const lastActivity =
        userProgress.length > 0
          ? userProgress.reduce(
              (latest, p) => (new Date(p.lastActivityDate) > new Date(latest) ? p.lastActivityDate : latest),
              userProgress[0].lastActivityDate,
            )
          : new Date().toISOString()

      return {
        userId: user.id,
        userName: user.name,
        assignedCourses,
        progress: userProgress,
        overallCompletion: Math.round(totalCompletion),
        lastActivity,
        interviewSubmissions,
      }
    })

    setUserProgressData(progressSummaries)
  }

  const filteredUsers = userProgressData.filter((user) =>
    user.userName.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleViewDetails = (user: UserProgressSummary) => {
    setSelectedUser(user)
    setIsDetailsDialogOpen(true)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Track Progress</h2>
        <div className="w-72">
          <Input placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Active Trainings</CardTitle>
          <CardDescription>Overview of user progress across all training courses</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User Name</TableHead>
                <TableHead>Assigned Courses</TableHead>
                <TableHead>Completion %</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead>Interview Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.userId}>
                  <TableCell className="font-medium">{user.userName}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.assignedCourses.slice(0, 2).map((course) => (
                        <Badge key={course.id} variant="outline" className="text-xs">
                          {course.title}
                        </Badge>
                      ))}
                      {user.assignedCourses.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{user.assignedCourses.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={user.overallCompletion} className="w-16" />
                      <span className="text-sm font-medium">{user.overallCompletion}%</span>
                    </div>
                  </TableCell>
                  <TableCell>{format(new Date(user.lastActivity), "MMM d, yyyy")}</TableCell>
                  <TableCell>
                    {user.interviewSubmissions && user.interviewSubmissions.length > 0 ? (
                      <Badge
                        variant={
                          user.interviewSubmissions.some((sub) => sub.status === "approved")
                            ? "default"
                            : user.interviewSubmissions.some((sub) => sub.status === "rejected")
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {user.interviewSubmissions[0].status}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Not started</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => handleViewDetails(user)}>
                      <Eye className="mr-1 h-3 w-3" />
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <UserDetailsDialog
        user={selectedUser}
        isOpen={isDetailsDialogOpen}
        onClose={() => {
          setIsDetailsDialogOpen(false)
          setSelectedUser(null)
          loadProgressData()
        }}
      />
    </div>
  )
}
