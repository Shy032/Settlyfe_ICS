"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  getUserDocuments,
  getCompanyDocuments,
  getTeamDocuments,
  getUserFolders,
  getCompanyFolders,
  getTeamFolders,
} from "@/services/document-service"
import type { Document, DocumentFolder } from "@/types/document"
import { FileUploader } from "@/components/documents/file-uploader"
import { DocumentList } from "@/components/documents/document-list"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"

export default function DocumentsPage() {
  const { user, isAdmin, isOwner } = useAuth()
  const [myDocuments, setMyDocuments] = useState<Document[]>([])
  const [companyDocuments, setCompanyDocuments] = useState<Document[]>([])
  const [teamDocuments, setTeamDocuments] = useState<Document[]>([])
  const [myFolders, setMyFolders] = useState<DocumentFolder[]>([])
  const [companyFolders, setCompanyFolders] = useState<DocumentFolder[]>([])
  const [teamFolders, setTeamFolders] = useState<DocumentFolder[]>([])
  const [activeTab, setActiveTab] = useState("my-documents")
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(undefined)
  const [folderPath, setFolderPath] = useState<DocumentFolder[]>([])
  const [refreshKey, setRefreshKey] = useState(0)
  const { toast } = useToast()

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
  }

  const navigateToFolder = (folderId?: string) => {
    setCurrentFolderId(folderId)
    // Update folder path based on navigation
    // This would need to be implemented to track the full path
  }

  const navigateUp = () => {
    if (folderPath.length > 0) {
      const parentFolder = folderPath[folderPath.length - 2]
      setCurrentFolderId(parentFolder?.id)
      setFolderPath(folderPath.slice(0, -1))
    } else {
      setCurrentFolderId(undefined)
    }
  }

  useEffect(() => {
    if (user) {
      setMyDocuments(getUserDocuments(user.uid))
      setCompanyDocuments(getCompanyDocuments())
      setMyFolders(getUserFolders(user.uid))
      setCompanyFolders(getCompanyFolders())

      if (user.teamId) {
        setTeamDocuments(getTeamDocuments(user.teamId))
        setTeamFolders(getTeamFolders(user.teamId))
      }
    }
  }, [user, refreshKey])

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p>Please log in to access documents</p>
            <Button asChild className="mt-4">
              <Link href="/login">Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const canUploadToCompany = isAdmin() || isOwner()
  const userTeam = user.teamId

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {isAdmin() || isOwner() ? "Manage Documents" : "Documents"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isAdmin() || isOwner()
                ? "Upload, organize, and manage company, team, and personal documents"
                : "Access your personal documents, team resources, and view company resources"}
            </p>
          </div>
        </div>

        {/* Breadcrumb Navigation */}
        {folderPath.length > 0 && (
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink onClick={() => navigateToFolder(undefined)} className="cursor-pointer">
                  <Home className="h-4 w-4" />
                </BreadcrumbLink>
              </BreadcrumbItem>
              {folderPath.map((folder, index) => (
                <div key={folder.id} className="flex items-center">
                  <BreadcrumbSeparator>
                    <ChevronRight className="h-4 w-4" />
                  </BreadcrumbSeparator>
                  <BreadcrumbItem>
                    {index === folderPath.length - 1 ? (
                      <BreadcrumbPage>{folder.name}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink onClick={() => navigateToFolder(folder.id)} className="cursor-pointer">
                        {folder.name}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </div>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        )}

        <Tabs defaultValue="my-documents" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-[600px] mx-auto">
            <TabsTrigger value="my-documents">My Documents</TabsTrigger>
            <TabsTrigger value="team-documents">Team Documents</TabsTrigger>
            <TabsTrigger value="company-documents">Company Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="my-documents" className="mt-6">
            <Card className="dark:bg-card">
              <CardHeader>
                <CardTitle>My Personal Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <FileUploader
                  userId={user.uid}
                  userName={user.name}
                  isCompanyDocument={false}
                  isTeamDocument={false}
                  currentFolderId={currentFolderId}
                  onUploadComplete={handleRefresh}
                />
                <div className="mt-6">
                  <DocumentList
                    documents={myDocuments.filter((doc) => doc.parentFolderId === currentFolderId)}
                    folders={myFolders.filter((folder) => folder.parentFolderId === currentFolderId)}
                    onDelete={handleRefresh}
                    onFolderClick={navigateToFolder}
                    currentUserId={user.uid}
                    isAdminView={false}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team-documents" className="mt-6">
            <Card className="dark:bg-card">
              <CardHeader>
                <CardTitle>Team Documents</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {userTeam
                    ? "Collaborate with your team members on shared documents"
                    : "You need to be assigned to a team to access team documents"}
                </p>
              </CardHeader>
              <CardContent>
                {userTeam ? (
                  <>
                    <FileUploader
                      userId={user.uid}
                      userName={user.name}
                      isCompanyDocument={false}
                      isTeamDocument={true}
                      teamId={userTeam}
                      currentFolderId={currentFolderId}
                      onUploadComplete={handleRefresh}
                    />
                    <div className="mt-6">
                      <DocumentList
                        documents={teamDocuments.filter((doc) => doc.parentFolderId === currentFolderId)}
                        folders={teamFolders.filter((folder) => folder.parentFolderId === currentFolderId)}
                        onDelete={handleRefresh}
                        onFolderClick={navigateToFolder}
                        currentUserId={user.uid}
                        isAdminView={false}
                      />
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>You need to be assigned to a team to access team documents.</p>
                    <p className="text-sm mt-2">Contact your administrator to be added to a team.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="company-documents" className="mt-6">
            <Card className="dark:bg-card">
              <CardHeader>
                <CardTitle>Company Documents</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {canUploadToCompany
                    ? "Manage company-wide documents and resources"
                    : "View company documents and resources (read-only access)"}
                </p>
              </CardHeader>
              <CardContent>
                {canUploadToCompany && (
                  <FileUploader
                    userId={user.uid}
                    userName={user.name}
                    isCompanyDocument={true}
                    isTeamDocument={false}
                    currentFolderId={currentFolderId}
                    onUploadComplete={handleRefresh}
                  />
                )}
                <div className={canUploadToCompany ? "mt-6" : ""}>
                  <DocumentList
                    documents={companyDocuments.filter((doc) => doc.parentFolderId === currentFolderId)}
                    folders={companyFolders.filter((folder) => folder.parentFolderId === currentFolderId)}
                    onDelete={handleRefresh}
                    onFolderClick={navigateToFolder}
                    currentUserId={user.uid}
                    isAdminView={canUploadToCompany}
                    readOnly={!canUploadToCompany}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
