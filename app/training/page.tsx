"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { useIsMobile } from "@/hooks/use-mobile"

// Admin/Owner Components
import ManageCoursesTab from "@/components/training/manage-courses-tab"
import TrackProgressTab from "@/components/training/track-progress-tab"
import CompanyResourcesTab from "@/components/training/company-resources-tab"
import ManageInterviewsTab from "@/components/training/manage-interviews-tab"
import MyTrainingTab from "@/components/training/my-training-tab"
import InterviewTasksTab from "@/components/training/interview-tasks-tab"

// Member Components (Placeholders for now)
const FeedbackTab = () => {
  return (
    <div className="text-center py-12">
      <h3 className="text-lg font-medium mb-2">Feedback</h3>
      <p className="text-muted-foreground">View your training feedback and status</p>
    </div>
  )
}

export default function TrainingPage() {
  const { user, isAdmin, isOwner, loading } = useAuth()
  const [activeTab, setActiveTab] = useState("")
  const router = useRouter()
  const isMobile = useIsMobile()

  useEffect(() => {
    if (user) {
      if (isAdmin() || isOwner()) {
        setActiveTab("manage-courses")
      } else {
        setActiveTab("my-training")
      }
    }
  }, [user, isAdmin, isOwner])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground mb-4">Please log in to access the training portal.</p>
        <Button onClick={() => router.push("/login")}>Go to Login</Button>
      </div>
    )
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Training Portal</h1>
              <p className="text-sm md:text-base text-muted-foreground">
                {isAdmin() || isOwner()
                  ? "Manage courses, track progress, and provide feedback"
                  : "Complete your training and development tasks"}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        {isAdmin() || isOwner() ? (
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className={`${isMobile ? "grid grid-cols-2 gap-1 h-auto" : "grid grid-cols-4"} w-full mb-6`}>
              <TabsTrigger value="manage-courses" className={`${isMobile ? "text-xs px-2 py-3" : "px-3 py-2"}`}>
                {isMobile ? "Courses" : "Manage Courses"}
              </TabsTrigger>
              <TabsTrigger value="manage-interviews" className={`${isMobile ? "text-xs px-2 py-3" : "px-3 py-2"}`}>
                {isMobile ? "Interviews" : "Manage Interviews"}
              </TabsTrigger>
              <TabsTrigger value="track-progress" className={`${isMobile ? "text-xs px-2 py-3" : "px-3 py-2"}`}>
                {isMobile ? "Progress" : "Track Progress"}
              </TabsTrigger>
              <TabsTrigger value="company-resources" className={`${isMobile ? "text-xs px-2 py-3" : "px-3 py-2"}`}>
                {isMobile ? "Resources" : "Company Resources"}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="manage-courses">
              <ManageCoursesTab />
            </TabsContent>
            <TabsContent value="manage-interviews">
              <ManageInterviewsTab />
            </TabsContent>
            <TabsContent value="track-progress">
              <TrackProgressTab />
            </TabsContent>
            <TabsContent value="company-resources">
              <CompanyResourcesTab />
            </TabsContent>
          </Tabs>
        ) : (
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className={`${isMobile ? "grid grid-cols-3 gap-1 h-auto" : "grid grid-cols-3"} w-full mb-6`}>
              <TabsTrigger value="my-training" className={`${isMobile ? "text-xs px-2 py-3" : "px-3 py-2"}`}>
                {isMobile ? "Training" : "My Training"}
              </TabsTrigger>
              <TabsTrigger value="interview-tasks" className={`${isMobile ? "text-xs px-2 py-3" : "px-3 py-2"}`}>
                {isMobile ? "Tasks" : "Interview Tasks"}
              </TabsTrigger>
              <TabsTrigger value="feedback" className={`${isMobile ? "text-xs px-2 py-3" : "px-3 py-2"}`}>
                Feedback
              </TabsTrigger>
            </TabsList>
            <TabsContent value="my-training">
              <MyTrainingTab />
            </TabsContent>
            <TabsContent value="interview-tasks">
              <InterviewTasksTab />
            </TabsContent>
            <TabsContent value="feedback">
              <FeedbackTab />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
