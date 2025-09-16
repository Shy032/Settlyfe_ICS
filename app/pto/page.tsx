"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, Clock, FileText, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface PTORequest {
  id: string
  userId: string
  userName: string
  userEmail: string
  type: "planned" | "urgent"
  startDate: string
  endDate: string
  reason: string
  impact: string
  handover: string
  status: "pending" | "approved" | "rejected"
  submittedAt: string
  reviewedAt?: string
  reviewedBy?: string
  reviewerComments?: string
  noticeGiven: number
}

const PTO_TYPES = {
  planned: "Planned (≥3 days notice)",
  urgent: "Urgent (Same day)",
}

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
}

export default function PTOPage() {
  const [user, setUser] = useState<any | null>(null)
  const [requests, setRequests] = useState<PTORequest[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState("")
  const router = useRouter()

  // Form state
  const [type, setType] = useState<"planned" | "urgent">("planned")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [reason, setReason] = useState("")
  const [impact, setImpact] = useState("")
  const [handover, setHandover] = useState("")

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("currentUser")
      if (!storedUser) {
        router.push("/login")
        return
      }

      const userData = JSON.parse(storedUser)
      setUser(userData)

      const storedRequests = localStorage.getItem("ptoRequests")
      if (storedRequests) {
        const allRequests = JSON.parse(storedRequests) as PTORequest[]
        const userRequests =
          userData.accessLevel === "admin" ? allRequests : allRequests.filter((req) => req.userId === userData.accountId)
        setRequests(userRequests.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()))
      }

      setLoading(false)
    }
  }, [router])

  const calculateNoticeGiven = (startDate: string): number => {
    const start = new Date(startDate)
    const now = new Date()
    const diffTime = start.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 1000))
    return Math.max(0, diffDays)
  }

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || typeof window === "undefined") return

    setSubmitting(true)
    setMessage("")

    try {
      const noticeGiven = calculateNoticeGiven(startDate)

      if (type === "planned" && noticeGiven < 3) {
        setMessage("Planned requests require at least 3 days notice")
        setSubmitting(false)
        return
      }

      const newRequest: PTORequest = {
        id: `pto_${Date.now()}_${user.accountId}`,
        userId: user.accountId,
        userName: user.name,
        userEmail: user.loginEmail,
        type,
        startDate,
        endDate,
        reason,
        impact,
        handover,
        status: "pending",
        submittedAt: new Date().toISOString(),
        noticeGiven,
      }

      const existingRequests = localStorage.getItem("ptoRequests")
      const requestsArray: PTORequest[] = existingRequests ? JSON.parse(existingRequests) : []

      requestsArray.push(newRequest)
      localStorage.setItem("ptoRequests", JSON.stringify(requestsArray))

      setMessage("PTO request submitted successfully! Your team lead will be notified.")

      const userRequests =
        user.accessLevel === "admin" ? requestsArray : requestsArray.filter((req) => req.userId === user.accountId)
      setRequests(userRequests.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()))

      setStartDate("")
      setEndDate("")
      setReason("")
      setImpact("")
      setHandover("")
      setType("planned")
    } catch (error) {
      setMessage("Error submitting PTO request")
      console.error("Error:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSignOut = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("currentUser")
    }
    router.push("/login")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-300">Loading PTO requests...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile-optimized header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 sm:py-4 gap-3 sm:gap-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">PTO Management</h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                Request time off and track approval status
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {user.accessLevel === "admin" && (
                <Link href="/admin">
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                    Admin Panel
                  </Button>
                </Link>
              )}
              <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* PTO Request Form - Mobile optimized */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                Submit PTO Request
              </CardTitle>
              <CardDescription className="text-sm">
                Request time off following company policy. Planned requests need ≥3 days notice.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitRequest} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-sm font-medium">
                    Request Type
                  </Label>
                  <Select value={type} onValueChange={(value: "planned" | "urgent") => setType(value)}>
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planned">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {PTO_TYPES.planned}
                        </div>
                      </SelectItem>
                      <SelectItem value="urgent">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          {PTO_TYPES.urgent}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate" className="text-sm font-medium">
                      Start Date
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate" className="text-sm font-medium">
                      End Date
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                      required
                      className="text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason" className="text-sm font-medium">
                    Reason for Time Off
                  </Label>
                  <Textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Brief description of reason (vacation, medical, family emergency, etc.)"
                    required
                    className="text-sm"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="impact" className="text-sm font-medium">
                    Expected Impact on Work
                  </Label>
                  <Textarea
                    id="impact"
                    value={impact}
                    onChange={(e) => setImpact(e.target.value)}
                    placeholder="Describe how this time off will affect your current projects and deadlines"
                    required
                    className="text-sm"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="handover" className="text-sm font-medium">
                    Handover Plan
                  </Label>
                  <Textarea
                    id="handover"
                    value={handover}
                    onChange={(e) => setHandover(e.target.value)}
                    placeholder="List any tasks that need to be delegated and to whom. Include any blockers or important information."
                    required
                    className="text-sm"
                    rows={3}
                  />
                </div>

                {startDate && (
                  <Alert
                    className={
                      calculateNoticeGiven(startDate) >= 3
                        ? "border-green-200 bg-green-50"
                        : "border-yellow-200 bg-yellow-50"
                    }
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription
                      className={
                        calculateNoticeGiven(startDate) >= 3 ? "text-green-800 text-sm" : "text-yellow-800 text-sm"
                      }
                    >
                      Notice given: {calculateNoticeGiven(startDate)} days
                      {calculateNoticeGiven(startDate) < 3 &&
                        type === "planned" &&
                        " (Minimum 3 days required for planned requests)"}
                    </AlertDescription>
                  </Alert>
                )}

                {message && (
                  <Alert
                    className={message.includes("Error") ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}
                  >
                    <AlertDescription
                      className={message.includes("Error") ? "text-red-800 text-sm" : "text-green-800 text-sm"}
                    >
                      {message}
                    </AlertDescription>
                  </Alert>
                )}

                <Button type="submit" disabled={submitting} className="w-full text-sm">
                  {submitting ? "Submitting..." : "Submit PTO Request"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Policy Guidelines - Mobile optimized */}
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                PTO Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-sm mb-2">Planned Requests</h4>
                <ul className="text-xs sm:text-sm text-gray-600 space-y-1">
                  <li>• ≥3 days written notice required</li>
                  <li>• DM to Lead + CC @COO (Richard)</li>
                  <li>• Create PTO Issue in Notion</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-sm mb-2">Urgent Cases</h4>
                <ul className="text-xs sm:text-sm text-gray-600 space-y-1">
                  <li>• Same-day notice acceptable</li>
                  <li>• Call/DM Lead immediately</li>
                  <li>• Add PTO record within 24h</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-sm mb-2">Approval Process</h4>
                <ul className="text-xs sm:text-sm text-gray-600 space-y-1">
                  <li>• Lead approval for &gt;=5 days</li>
                  <li>• Founder approval for &gt;5 days</li>
                  <li>• Slack confirmation counts</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-sm mb-2">Hours Accounting</h4>
                <ul className="text-xs sm:text-sm text-gray-600 space-y-1">
                  <li>• Approved PTO excluded from EC</li>
                  <li>• Unreported absence scores 0</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* PTO Requests History - Mobile optimized */}
        <Card className="mt-4 sm:mt-8">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl">
              {user.accessLevel === "admin" ? "All PTO Requests" : "My PTO Requests"}
            </CardTitle>
            <CardDescription className="text-sm">
              {user.accessLevel === "admin"
                ? "Manage and review team PTO requests"
                : "Track your submitted PTO requests and their status"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">No PTO requests found</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {user.accessLevel === "admin" && <TableHead className="text-xs sm:text-sm">Employee</TableHead>}
                      <TableHead className="text-xs sm:text-sm">Type</TableHead>
                      <TableHead className="text-xs sm:text-sm">Dates</TableHead>
                      <TableHead className="text-xs sm:text-sm">Reason</TableHead>
                      <TableHead className="text-xs sm:text-sm">Notice</TableHead>
                      <TableHead className="text-xs sm:text-sm">Status</TableHead>
                      <TableHead className="text-xs sm:text-sm">Submitted</TableHead>
                      {user.accessLevel === "admin" && <TableHead className="text-xs sm:text-sm">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => (
                      <TableRow key={request.id}>
                        {user.accessLevel === "admin" && (
                          <TableCell>
                            <div>
                              <div className="font-medium text-xs sm:text-sm">{request.userName}</div>
                              <div className="text-xs text-gray-600">{request.userEmail}</div>
                            </div>
                          </TableCell>
                        )}
                        <TableCell>
                          <Badge variant={request.type === "urgent" ? "destructive" : "secondary"} className="text-xs">
                            {request.type === "urgent" ? "Urgent" : "Planned"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">
                            <div>{new Date(request.startDate).toLocaleDateString()}</div>
                            <div className="text-gray-600">to {new Date(request.endDate).toLocaleDateString()}</div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-xs">{request.reason}</TableCell>
                        <TableCell>
                          <Badge variant={request.noticeGiven >= 3 ? "default" : "secondary"} className="text-xs">
                            {request.noticeGiven} days
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${STATUS_COLORS[request.status]} text-xs`}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-gray-600">
                          {new Date(request.submittedAt).toLocaleDateString()}
                        </TableCell>
                        {user.accessLevel === "admin" && (
                          <TableCell>
                            {request.status === "pending" && (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 hover:text-green-700 text-xs p-1"
                                >
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700 text-xs p-1"
                                >
                                  <XCircle className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
