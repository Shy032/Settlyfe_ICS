"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import type { Poll } from "@/types"
import { CreatePollDialog } from "./create-poll-dialog"
import { PollCard } from "./poll-card"

export function PollsSection() {
  const { user, isAdmin, isOwner } = useAuth()
  const [polls, setPolls] = useState<Poll[]>([])
  const [isDialogOpen, setDialogOpen] = useState(false)
  const [editingPoll, setEditingPoll] = useState<Poll | null>(null)
  const [showDrafts, setShowDrafts] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedPolls = localStorage.getItem("polls")
      if (storedPolls) {
        setPolls(JSON.parse(storedPolls))
      }
    }
  }, [])

  const savePollsToStorage = (updatedPolls: Poll[]) => {
    localStorage.setItem("polls", JSON.stringify(updatedPolls))
    setPolls(updatedPolls)
  }

  const handleSavePoll = (pollData: Poll) => {
    const existingIndex = polls.findIndex((p) => p.id === pollData.id)
    let updatedPolls
    if (existingIndex > -1) {
      updatedPolls = [...polls]
      updatedPolls[existingIndex] = pollData
    } else {
      updatedPolls = [pollData, ...polls]
    }
    savePollsToStorage(updatedPolls)
  }

  const handleVote = (pollId: string, optionIds: string[]) => {
    if (!user) return
    const updatedPolls = polls.map((p) => {
      if (p.id === pollId) {
        const newVotes = optionIds.map((optId) => ({
          optionId: optId,
          userId: user.uid,
          userName: user.name,
          createdAt: new Date().toISOString(),
        }))
        return { ...p, votes: [...p.votes, ...newVotes] }
      }
      return p
    })
    savePollsToStorage(updatedPolls)
  }

  const handleUpdatePoll = (pollData: Poll) => {
    const updatedPolls = polls.map((p) => (p.id === pollData.id ? pollData : p))
    savePollsToStorage(updatedPolls)
  }

  const handleDeletePoll = (pollId: string) => {
    if (window.confirm("Are you sure you want to delete this poll?")) {
      const updatedPolls = polls.filter((p) => p.id !== pollId)
      savePollsToStorage(updatedPolls)
    }
  }

  const handleEditPoll = (poll: Poll) => {
    setEditingPoll(poll)
    setDialogOpen(true)
  }

  const handleOpenCreateDialog = () => {
    setEditingPoll(null)
    setDialogOpen(true)
  }

  const canCreate = isAdmin() || isOwner()

  const activePollsCount = polls.filter((p) => p.status !== "draft").length
  const draftPollsCount = polls.filter((p) => p.status === "draft").length

  const displayPolls = showDrafts
    ? polls.filter((p) => p.status === "draft")
    : polls.filter((p) => p.status !== "draft")

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight dark:text-white neon:text-white">
            {showDrafts ? "Draft Polls" : "Active Polls"}
          </h2>
          <p className="text-muted-foreground">
            {showDrafts ? "Manage your draft polls." : "Participate in team decisions."}
          </p>
        </div>
        <div className="flex gap-2">
          {canCreate && draftPollsCount > 0 && (
            <Button variant="outline" onClick={() => setShowDrafts(!showDrafts)}>
              {showDrafts ? `Active Polls (${activePollsCount})` : `Drafts (${draftPollsCount})`}
            </Button>
          )}
          {canCreate && (
            <Button onClick={handleOpenCreateDialog}>
              <Plus className="mr-2 h-4 w-4" /> Create Poll
            </Button>
          )}
        </div>
      </div>

      {displayPolls.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <h3 className="text-lg font-medium text-muted-foreground">
            {showDrafts ? "No draft polls found." : "No active polls right now."}
          </h3>
          {canCreate && (
            <p className="text-sm text-muted-foreground">
              {showDrafts ? "Create a poll and save it as draft." : "Why not create one?"}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {displayPolls.map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              onVote={handleVote}
              onUpdatePoll={handleUpdatePoll}
              onDeletePoll={handleDeletePoll}
              onEditPoll={handleEditPoll}
            />
          ))}
        </div>
      )}

      {canCreate && (
        <CreatePollDialog
          open={isDialogOpen}
          onOpenChange={setDialogOpen}
          onSave={handleSavePoll}
          pollToEdit={editingPoll}
        />
      )}
    </div>
  )
}
