"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, MapPin } from "lucide-react"
import { CreateMomentDialog } from "./create-moment-dialog"
import type { Moment, User } from "@/types"

interface MomentsFeedProps {
  profileUser: User
  isCurrentUserProfile: boolean
}

export function MomentsFeed({ profileUser, isCurrentUserProfile }: MomentsFeedProps) {
  const [moments, setMoments] = useState<Moment[]>([])
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    // Load moments from localStorage
    const storedMoments = localStorage.getItem("moments")
    if (storedMoments) {
      const allMoments = JSON.parse(storedMoments) as Moment[]
      const userMoments = allMoments
        .filter((m) => m.userId === profileUser.uid)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setMoments(userMoments)
    }
  }, [profileUser.uid])

  const handleMomentCreated = (newMoment: Moment) => {
    const updatedMoments = [newMoment, ...moments]
    setMoments(updatedMoments)

    // Save all moments back to localStorage
    const storedMoments = localStorage.getItem("moments")
    const allMoments = storedMoments ? JSON.parse(storedMoments) : []
    allMoments.push(newMoment)
    localStorage.setItem("moments", JSON.stringify(allMoments))
  }

  return (
    <div className="space-y-6">
      {isCurrentUserProfile && (
        <Card>
          <CardContent className="pt-6">
            <Button className="w-full" onClick={() => setIsCreating(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Create a new Moment
            </Button>
          </CardContent>
        </Card>
      )}

      {moments.length > 0 ? (
        moments.map((moment) => (
          <Card key={moment.id}>
            <CardHeader className="flex flex-row items-center gap-3">
              <Avatar>
                <AvatarImage src={profileUser.profilePhoto || `https://avatar.vercel.sh/${profileUser.email}.png`} />
                <AvatarFallback>{profileUser.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{profileUser.name}</p>
                <p className="text-xs text-gray-500">{new Date(moment.createdAt).toLocaleString()}</p>
              </div>
            </CardHeader>
            <CardContent>
              {moment.text && <p className="whitespace-pre-wrap mb-4">{moment.text}</p>}
              {moment.mediaUrl && (
                <div className="mb-4">
                  {moment.mediaType === "image" ? (
                    <img
                      src={moment.mediaUrl || "/placeholder.svg"}
                      alt="Moment"
                      className="rounded-lg max-h-96 w-full object-cover"
                    />
                  ) : (
                    <video src={moment.mediaUrl} controls className="rounded-lg max-h-96 w-full" />
                  )}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {moment.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
            {moment.location && (
              <CardFooter>
                <div className="flex items-center text-xs text-gray-500">
                  <MapPin className="h-3 w-3 mr-1" />
                  {moment.location}
                </div>
              </CardFooter>
            )}
          </Card>
        ))
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p>{isCurrentUserProfile ? "You haven't posted any Moments yet." : "This user hasn't posted any Moments."}</p>
        </div>
      )}

      <CreateMomentDialog
        open={isCreating}
        onOpenChange={setIsCreating}
        onMomentCreated={handleMomentCreated}
        userId={profileUser.uid}
      />
    </div>
  )
}
