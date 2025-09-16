"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Mail, GroupIcon as TeamIcon, Shield, Download, Upload } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { MomentsFeed } from "@/components/moments-feed"
import type { User, Team } from "@/types"

// Local Resume interface for this page
interface Resume {
  userId: string
  fileName: string
  fileUrl: string
  uploadedAt: string
}

export default function UserProfilePage() {
  const { user: currentUser } = useAuth()
  const params = useParams()
  const router = useRouter()
  const userId = params.userId as string

  const [profileUser, setProfileUser] = useState<User | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [resume, setResume] = useState<Resume | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUser) {
      router.push("/login")
      return
    }
    if (userId) {
      loadUserData(userId)
    }
  }, [currentUser, userId, router])

  const loadUserData = (id: string) => {
    if (typeof window !== "undefined") {
      const storedUsers = localStorage.getItem("allUsers")
      const storedTeams = localStorage.getItem("teams")
      const storedResumes = localStorage.getItem("resumes")

      if (storedUsers) {
        const allUsers = JSON.parse(storedUsers) as User[]
        const foundUser = allUsers.find((u) => u.accountId === id)
        setProfileUser(foundUser || null)
      }
      if (storedTeams) {
        setTeams(JSON.parse(storedTeams))
      }
      if (storedResumes) {
        const allResumes = JSON.parse(storedResumes) as Resume[]
        const userResume = allResumes.find((r) => r.userId === id)
        setResume(userResume || null)
      }
      setLoading(false)
    }
  }

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === "application/pdf" && profileUser) {
      const newResume: Resume = {
        userId: profileUser.accountId,
        fileName: file.name,
        fileUrl: URL.createObjectURL(file),
        uploadedAt: new Date().toISOString(),
      }
      setResume(newResume)

      // Save to localStorage
      const storedResumes = localStorage.getItem("resumes")
      const allResumes = storedResumes ? (JSON.parse(storedResumes) as Resume[]) : []
      const otherResumes = allResumes.filter((r) => r.userId !== profileUser.accountId)
      localStorage.setItem("resumes", JSON.stringify([...otherResumes, newResume]))
    } else {
      alert("Please upload a PDF file.")
    }
  }

  const getTeamName = (teamId?: string) => {
    if (!teamId) return "Not in a team"
    return teams.find((t) => t.id === teamId)?.name || "Unknown Team"
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <h2 className="text-2xl font-semibold mb-4">User Not Found</h2>
        <p className="text-gray-600 mb-6">The profile you are looking for does not exist.</p>
        <Button asChild>
          <Link href="/directory">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Directory
          </Link>
        </Button>
      </div>
    )
  }

  const isCurrentUserProfile = currentUser?.accountId === profileUser.accountId

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Button variant="outline" asChild className="mb-6">
          <Link href="/directory">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Directory
          </Link>
        </Button>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card className="dark:bg-gray-800 dark:border-gray-700 sticky top-8">
              <CardHeader className="text-center">
                <Avatar className="h-24 w-24 mx-auto mb-4">
                  <AvatarImage
                    src={profileUser.profilePhoto || `https://avatar.vercel.sh/${profileUser.loginEmail}.png`}
                    alt={profileUser.name}
                  />
                  <AvatarFallback>{profileUser.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <CardTitle className="text-2xl dark:text-white">{profileUser.name}</CardTitle>
                {profileUser.title && (
                  <CardDescription className="text-blue-600 dark:text-blue-400 text-md">
                    {profileUser.title}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center">
                  <Mail className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" />
                  <span className="dark:text-gray-300 truncate">{profileUser.loginEmail}</span>
                </div>
                <div className="flex items-center">
                  <Shield className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" />
                  <span className="dark:text-gray-300">Role: </span>
                  <Badge variant="secondary" className="ml-2 dark:bg-gray-700 dark:text-gray-300">
                    {profileUser.accessLevel}
                  </Badge>
                </div>
                <div className="flex items-center">
                  <TeamIcon className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" />
                  <span className="dark:text-gray-300">Team: </span>
                  <Badge variant="outline" className="ml-2 dark:border-gray-600 dark:text-gray-300">
                    {getTeamName(profileUser.teamId)}
                  </Badge>
                </div>
                <div className="border-t dark:border-gray-700 pt-4">
                  <h4 className="font-semibold mb-2 dark:text-white">Résumé</h4>
                  {resume ? (
                    <a href={resume.fileUrl} download={resume.fileName}>
                      <Button variant="outline" className="w-full">
                        <Download className="h-4 w-4 mr-2" /> Download Résumé
                      </Button>
                    </a>
                  ) : isCurrentUserProfile ? (
                    <p className="text-sm text-gray-500">You have not uploaded a résumé.</p>
                  ) : (
                    <p className="text-sm text-gray-500">No résumé uploaded.</p>
                  )}
                  {isCurrentUserProfile && (
                    <Button asChild variant="secondary" className="w-full mt-2">
                      <label htmlFor="resume-upload">
                        <Upload className="h-4 w-4 mr-2" /> {resume ? "Replace" : "Upload"} Résumé
                        <input
                          id="resume-upload"
                          type="file"
                          accept=".pdf"
                          className="hidden"
                          onChange={handleResumeUpload}
                        />
                      </label>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="md:col-span-2">
            <MomentsFeed profileUser={profileUser} isCurrentUserProfile={isCurrentUserProfile} />
          </div>
        </div>
      </div>
    </div>
  )
}
