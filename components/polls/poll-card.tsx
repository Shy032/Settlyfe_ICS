"use client"

import { useState, useMemo, type FC } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useAuth } from "@/contexts/auth-context"
import type { Poll } from "@/types"
import { formatDistanceToNow } from "date-fns"
import { Edit, Trash2, Lock, Users, UserCheck } from "lucide-react"

interface PollCardProps {
  poll: Poll
  onVote: (pollId: string, optionIds: string[]) => void
  onUpdatePoll: (poll: Poll) => void
  onDeletePoll: (pollId: string) => void
  onEditPoll: (poll: Poll) => void
}

export const PollCard: FC<PollCardProps> = ({ poll, onVote, onUpdatePoll, onDeletePoll, onEditPoll }) => {
  const { user, isOwner } = useAuth()
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])

  const hasVoted = useMemo(() => {
    if (!user) return false
    return poll.votes.some((vote) => vote.userId === user.uid)
  }, [poll.votes, user])

  const isPollClosed = useMemo(() => {
    return poll.status === "closed" || (poll.closeAt && new Date(poll.closeAt) < new Date())
  }, [poll.status, poll.closeAt])

  const canManage = useMemo(() => {
    if (!user) return false
    return isOwner() || poll.createdBy === user.uid
  }, [user, isOwner, poll.createdBy])

  const handleVote = () => {
    if (selectedOptions.length > 0 && user) {
      onVote(poll.id, selectedOptions)
    }
  }

  const handleClosePoll = () => {
    onUpdatePoll({ ...poll, status: "closed" })
  }

  const totalVotes = poll.votes.length

  const showResults = isPollClosed || poll.resultsVisibility === "live"

  const renderVotingArea = () => {
    if (poll.selectionType === "single-choice") {
      return (
        <RadioGroup onValueChange={(value) => setSelectedOptions([value])} className="space-y-2">
          {poll.options.map((option) => (
            <div key={option.id} className="flex items-center space-x-2">
              <RadioGroupItem value={option.id} id={`${poll.id}-${option.id}`} />
              <Label htmlFor={`${poll.id}-${option.id}`}>{option.text}</Label>
            </div>
          ))}
        </RadioGroup>
      )
    } else {
      return (
        <div className="space-y-2">
          {poll.options.map((option) => (
            <div key={option.id} className="flex items-center space-x-2">
              <Checkbox
                id={`${poll.id}-${option.id}`}
                checked={selectedOptions.includes(option.id)}
                onCheckedChange={(checked) => {
                  setSelectedOptions((prev) => (checked ? [...prev, option.id] : prev.filter((id) => id !== option.id)))
                }}
              />
              <Label htmlFor={`${poll.id}-${option.id}`}>{option.text}</Label>
            </div>
          ))}
        </div>
      )
    }
  }

  const renderResultsArea = () => {
    const results = poll.options.map((option) => {
      const votesForOption = poll.votes.filter((vote) => vote.optionId === option.id)
      const percentage = totalVotes > 0 ? (votesForOption.length / totalVotes) * 100 : 0
      return { ...option, votes: votesForOption, percentage }
    })

    return (
      <div className="space-y-4">
        {results.map((option) => (
          <div key={option.id}>
            <div className="flex justify-between items-center mb-1">
              <span className="font-medium">{option.text}</span>
              <span className="text-sm text-muted-foreground">
                {option.votes.length} vote{option.votes.length !== 1 && "s"} ({option.percentage.toFixed(0)}%)
              </span>
            </div>
            <Progress value={option.percentage} className="h-3" />
            {!poll.anonymous && option.votes.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {option.votes.map((vote) => (
                  <TooltipProvider key={vote.userId}>
                    <Tooltip>
                      <TooltipTrigger>
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={`/placeholder.svg?width=24&height=24&text=${vote.userName.charAt(0)}`} />
                          <AvatarFallback>{vote.userName.charAt(0)}</AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{vote.userName}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700 neon:bg-card neon:border-gray-800">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="dark:text-white neon:text-white">{poll.title}</CardTitle>
            <CardDescription className="dark:text-gray-300 neon:text-gray-300 mt-1">{poll.description}</CardDescription>
          </div>
          <div className="flex gap-2">
            {poll.anonymous && (
              <Badge variant="secondary">
                <Lock className="mr-1 h-3 w-3" /> Anonymous
              </Badge>
            )}
            <Badge variant={isPollClosed ? "destructive" : "default"}>{isPollClosed ? "Closed" : "Open"}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {hasVoted || isPollClosed ? (
          showResults ? (
            renderResultsArea()
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 neon:text-gray-400">
              <UserCheck className="mx-auto h-8 w-8 mb-2" />
              <p className="font-semibold">Thank you for your vote!</p>
              <p>Results will be shown once the poll is closed.</p>
            </div>
          )
        ) : (
          renderVotingArea()
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          <p>
            <Users className="inline-block mr-1 h-4 w-4" />
            {totalVotes} total votes
          </p>
          <p>
            By {poll.creatorName} &middot; {formatDistanceToNow(new Date(poll.createdAt), { addSuffix: true })}
          </p>
        </div>
        <div className="flex gap-2">
          {canManage && !isPollClosed && (
            <>
              <Button variant="outline" size="sm" onClick={() => onEditPoll(poll)}>
                <Edit className="mr-1 h-4 w-4" /> Edit
              </Button>
              <Button variant="secondary" size="sm" onClick={handleClosePoll}>
                Close Poll
              </Button>
            </>
          )}
          {canManage && (
            <Button variant="destructive" size="sm" onClick={() => onDeletePoll(poll.id)}>
              <Trash2 className="mr-1 h-4 w-4" /> Delete
            </Button>
          )}
          {!hasVoted && !isPollClosed && (
            <Button onClick={handleVote} disabled={selectedOptions.length === 0}>
              Submit Vote
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}
