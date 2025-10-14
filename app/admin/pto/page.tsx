"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CheckCircle, XCircle, Eye, Calendar, Clock, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Label } from "@/components/ui/label"
import { ArrowLeft} from "lucide-react"

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

interface User {
  uid: string
  email: string
  name: string
  role: string
}

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
}

export default function AdminPTOPage() {
  const [user, setUser] = useState<User | null>(null)
  const [requests, setRequests] = useState<PTORequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<PTORequest | null>(null)
  const [reviewComments, setReviewComments] = useState("")
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const [selectedRequests, setSelectedRequests] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState<"approved" | "rejected" | null>(null)
  const [bulkComments, setBulkComments] = useState("")
  const [showBulkDialog, setShowBulkDialog] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("currentUser")
      if (!storedUser) {
        router.push("/login")
        return
      }

      const userData = JSON.parse(storedUser) as User
      if (!(userData.role === "admin" || userData.role === "owner")) {
        router.push("/dashboard")
        return
      }

      setUser(userData)

      // Load all PTO requests
      const storedRequests = localStorage.getItem("ptoRequests")
      if (storedRequests) {
        const allRequests = JSON.parse(storedRequests) as PTORequest[]
        setRequests(allRequests.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()))
      }

      setLoading(false)
    }
  }, [router])

  const handleReviewRequest = (requestId: string, status: "approved" | "rejected") => {
    if (!user || typeof window === "undefined") return

    const updatedRequests = requests.map((request) => {
      if (request.id === requestId) {
        return {
          ...request,
          status,
          reviewedAt: new Date().toISOString(),
          reviewedBy: user.name,
          reviewerComments: reviewComments,
        }
      }
      return request
    })

    localStorage.setItem("ptoRequests", JSON.stringify(updatedRequests))
    setRequests(updatedRequests)
    setSelectedRequest(null)
    setReviewComments("")
  }

  const calculateDuration = (startDate: string, endDate: string): number => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = end.getTime() - start.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays
  }

  const handleSelectRequest = (requestId: string) => {
    setSelectedRequests((prev) =>
      prev.includes(requestId) ? prev.filter((id) => id !== requestId) : [...prev, requestId],
    )
  }

  const handleSelectAll = () => {
    if (selectedRequests.length === pendingRequests.length) {
      setSelectedRequests([])
    } else {
      setSelectedRequests(pendingRequests.map((req) => req.id))
    }
  }

  const handleBulkAction = (action: "approved" | "rejected") => {
    if (selectedRequests.length === 0) return
    setBulkAction(action)
    setShowBulkDialog(true)
  }

  const confirmBulkAction = () => {
    if (!user || !bulkAction || typeof window === "undefined") return

    const updatedRequests = requests.map((request) => {
      if (selectedRequests.includes(request.id)) {
        return {
          ...request,
          status: bulkAction,
          reviewedAt: new Date().toISOString(),
          reviewedBy: user.name,
          reviewerComments: bulkComments || `Bulk ${bulkAction}d by ${user.name}`,
        }
      }
      return request
    })

    localStorage.setItem("ptoRequests", JSON.stringify(updatedRequests))
    setRequests(updatedRequests)
    setSelectedRequests([])
    setBulkAction(null)
    setBulkComments("")
    setShowBulkDialog(false)
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

  const pendingRequests = requests.filter((req) => req.status === "pending")
  const reviewedRequests = requests.filter((req) => req.status !== "pending")

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">PTO Request Management</h1>
              <p className="text-gray-600 dark:text-gray-300">Review and approve team time-off requests</p>
            </div>
            <div className="flex gap-2">
              <Link href="/pto">
                <Button variant="outline">My PTO</Button>
              </Link>
              <Link href="/admin">
                <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                  <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Back to Admin
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Pending Requests</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{pendingRequests.length}</div>
              <p className="text-xs text-muted-foreground text-gray-600 dark:text-gray-300">Awaiting review</p>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Urgent Requests</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {pendingRequests.filter((req) => req.type === "urgent").length}
              </div>
              <p className="text-xs text-muted-foreground text-gray-600 dark:text-gray-300">Need immediate attention</p>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {
                  requests.filter((req) => {
                    const submittedDate = new Date(req.submittedAt)
                    const now = new Date()
                    return (
                      submittedDate.getMonth() === now.getMonth() && submittedDate.getFullYear() === now.getFullYear()
                    )
                  }).length
                }
              </div>
              <p className="text-xs text-muted-foreground text-gray-600 dark:text-gray-300">Total requests</p>
            </CardContent>
          </Card>
        </div>

        {/* Bulk Actions */}
        {pendingRequests.length > 0 && (
          <Card className="mb-6 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Bulk Actions</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Select multiple requests for batch processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-gray-700 dark:text-gray-300"
                >
                  {selectedRequests.length === pendingRequests.length ? "Deselect All" : "Select All"}
                  {selectedRequests.length > 0 && ` (${selectedRequests.length})`}
                </Button>

                {selectedRequests.length > 0 && (
                  <>
                    <Button onClick={() => handleBulkAction("approved")} className="bg-green-600 hover:bg-green-700">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Bulk Approve ({selectedRequests.length})
                    </Button>
                    <Button variant="destructive" onClick={() => handleBulkAction("rejected")}>
                      <XCircle className="h-4 w-4 mr-2" />
                      Bulk Reject ({selectedRequests.length})
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending Requests */}
        <Card className="mb-8 dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Clock className="h-5 w-5" />
              Pending Requests ({pendingRequests.length})
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Requests awaiting your review and approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">No pending requests</div>
            ) : (
              <Table className="dark:bg-gray-800">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedRequests.length === pendingRequests.length && pendingRequests.length > 0}
                        onChange={handleSelectAll}
                        className="rounded"
                      />
                    </TableHead>
                    <TableHead className="text-gray-900 dark:text-white">Employee</TableHead>
                    <TableHead className="text-gray-900 dark:text-white">Type</TableHead>
                    <TableHead className="text-gray-900 dark:text-white">Dates</TableHead>
                    <TableHead className="text-gray-900 dark:text-white">Duration</TableHead>
                    <TableHead className="text-gray-900 dark:text-white">Notice</TableHead>
                    <TableHead className="text-gray-900 dark:text-white">Submitted</TableHead>
                    <TableHead className="text-gray-900 dark:text-white">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingRequests.map((request) => (
                    <TableRow
                      key={request.id}
                      className={`${request.type === "urgent" ? "bg-red-50 dark:bg-red-900/20" : ""} hover:bg-gray-100 dark:hover:bg-gray-700`}
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedRequests.includes(request.id)}
                          onChange={() => handleSelectRequest(request.id)}
                          className="rounded"
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{request.userName}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">{request.userEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={request.type === "urgent" ? "destructive" : "secondary"}>
                          {request.type === "urgent" ? "Urgent" : "Planned"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900 dark:text-white">
                          <div>{new Date(request.startDate).toLocaleDateString()}</div>
                          <div className="text-gray-600 dark:text-gray-300">
                            to {new Date(request.endDate).toLocaleDateString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{calculateDuration(request.startDate, request.endDate)} days</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={request.noticeGiven >= 3 ? "default" : "secondary"}>
                          {request.noticeGiven} days
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 dark:text-gray-300">
                        {new Date(request.submittedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => setSelectedRequest(request)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl dark:bg-gray-800 dark:border-gray-700">
                              <DialogHeader>
                                <DialogTitle className="text-gray-900 dark:text-white">PTO Request Details</DialogTitle>
                                <DialogDescription className="text-gray-600 dark:text-gray-300">
                                  Review request from {request.userName}
                                </DialogDescription>
                              </DialogHeader>
                              {selectedRequest && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium text-gray-900 dark:text-white">
                                        Employee
                                      </label>
                                      <p className="text-sm text-gray-600 dark:text-gray-300">
                                        {selectedRequest.userName}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-900 dark:text-white">Type</label>
                                      <p className="text-sm text-gray-600 dark:text-gray-300">
                                        {selectedRequest.type === "urgent" ? "Urgent" : "Planned"}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-900 dark:text-white">
                                        Start Date
                                      </label>
                                      <p className="text-sm text-gray-600 dark:text-gray-300">
                                        {new Date(selectedRequest.startDate).toLocaleDateString()}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-900 dark:text-white">
                                        End Date
                                      </label>
                                      <p className="text-sm text-gray-600 dark:text-gray-300">
                                        {new Date(selectedRequest.endDate).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>

                                  <div>
                                    <label className="text-sm font-medium text-gray-900 dark:text-white">Reason</label>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                      {selectedRequest.reason}
                                    </p>
                                  </div>

                                  <div>
                                    <label className="text-sm font-medium text-gray-900 dark:text-white">
                                      Expected Impact
                                    </label>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                      {selectedRequest.impact}
                                    </p>
                                  </div>

                                  <div>
                                    <label className="text-sm font-medium text-gray-900 dark:text-white">
                                      Handover Plan
                                    </label>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                      {selectedRequest.handover}
                                    </p>
                                  </div>

                                  <div>
                                    <label className="text-sm font-medium text-gray-900 dark:text-white">
                                      Review Comments (Optional)
                                    </label>
                                    <Textarea
                                      value={reviewComments}
                                      onChange={(e) => setReviewComments(e.target.value)}
                                      placeholder="Add any comments for the employee..."
                                      className="mt-1 dark:bg-gray-700 dark:text-white"
                                    />
                                  </div>

                                  <div className="flex gap-2 pt-4">
                                    <Button
                                      onClick={() => handleReviewRequest(selectedRequest.id, "approved")}
                                      className="flex-1"
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Approve
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      onClick={() => handleReviewRequest(selectedRequest.id, "rejected")}
                                      className="flex-1"
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Reject
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>

                          <Button
                            size="sm"
                            onClick={() => handleReviewRequest(request.id, "approved")}
                            className="text-green-600 hover:text-green-700"
                            variant="outline"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReviewRequest(request.id, "rejected")}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Reviewed Requests */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Recent Reviews ({reviewedRequests.length})</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Previously reviewed PTO requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reviewedRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">No reviewed requests</div>
            ) : (
              <Table className="dark:bg-gray-800">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-gray-900 dark:text-white">Employee</TableHead>
                    <TableHead className="text-gray-900 dark:text-white">Dates</TableHead>
                    <TableHead className="text-gray-900 dark:text-white">Status</TableHead>
                    <TableHead className="text-gray-900 dark:text-white">Reviewed By</TableHead>
                    <TableHead className="text-gray-900 dark:text-white">Review Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviewedRequests.slice(0, 10).map((request) => (
                    <TableRow key={request.id} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{request.userName}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">{request.userEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900 dark:text-white">
                          <div>{new Date(request.startDate).toLocaleDateString()}</div>
                          <div className="text-gray-600 dark:text-gray-300">
                            to {new Date(request.endDate).toLocaleDateString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[request.status]}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 dark:text-gray-300">
                        {request.reviewedBy || "System"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 dark:text-gray-300">
                        {request.reviewedAt ? new Date(request.reviewedAt).toLocaleDateString() : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bulk Action Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">
              Confirm Bulk {bulkAction === "approved" ? "Approval" : "Rejection"}
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-300">
              You are about to {bulkAction} {selectedRequests.length} PTO request(s).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-900 dark:text-white">Comments (Optional)</Label>
              <Textarea
                value={bulkComments}
                onChange={(e) => setBulkComments(e.target.value)}
                placeholder={`Add comments for bulk ${bulkAction}...`}
                className="mt-1 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={confirmBulkAction} className="flex-1">
                Confirm {bulkAction === "approved" ? "Approval" : "Rejection"}
              </Button>
              <Button variant="outline" onClick={() => setShowBulkDialog(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
