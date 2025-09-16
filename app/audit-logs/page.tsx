"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { SupabaseService } from "@/lib/supabase"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"

// Define the shape of your audit log entries
type AuditLog = {
  id: string
  timestamp: string
  employee_id: string
  action_type: string
  object_type: string
  object_id: string | null
  change_summary: string | null
}

export default function AuditLogsPage() {
  const { user, isAdmin } = useAuth()
  const router = useRouter()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !isAdmin()) {
      router.push("/login")
      return
    }
    loadLogs()
  }, [user, router])

  const loadLogs = async () => {
    setLoading(true)
    const { data, error } = await SupabaseService.getAuditLogs()
    if (error) {
      console.error("Error loading audit logs:", error)
      setLogs([])
    } else {
      setLogs(data || [])
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Card className="mx-auto max-w-7xl mt-8">
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
          <CardDescription>All recorded activities (latest first)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Object Type</TableHead>
                  <TableHead>Object ID</TableHead>
                  <TableHead>Summary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                    <TableCell>{log.employee_id}</TableCell>
                    <TableCell>{log.action_type}</TableCell>
                    <TableCell>{log.object_type}</TableCell>
                    <TableCell>{log.object_id}</TableCell>
                    <TableCell>{log.change_summary}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
