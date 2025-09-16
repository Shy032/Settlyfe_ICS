"use client"

import { useState, useEffect, type FC } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, PlusCircle, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import type { Poll, PollOption } from "@/types"
import { useAuth } from "@/contexts/auth-context"

interface CreatePollDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (poll: Poll) => void
  pollToEdit?: Poll | null
}

export const CreatePollDialog: FC<CreatePollDialogProps> = ({ open, onOpenChange, onSave, pollToEdit }) => {
  const { user } = useAuth()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [options, setOptions] = useState<PollOption[]>([
    { id: crypto.randomUUID(), text: "" },
    { id: crypto.randomUUID(), text: "" },
  ])
  const [selectionType, setSelectionType] = useState<"single-choice" | "multi-select">("single-choice")
  const [anonymous, setAnonymous] = useState(false)
  const [resultsVisibility, setResultsVisibility] = useState<"live" | "hidden_until_close">("live")
  const [closeAt, setCloseAt] = useState<Date | undefined>()
  const [saveAsDraft, setSaveAsDraft] = useState(false)
  const [isDraft, setIsDraft] = useState(false)

  useEffect(() => {
    if (pollToEdit) {
      setTitle(pollToEdit.title)
      setDescription(pollToEdit.description)
      setOptions(pollToEdit.options)
      setSelectionType(pollToEdit.selectionType)
      setAnonymous(pollToEdit.anonymous)
      setResultsVisibility(pollToEdit.resultsVisibility)
      setCloseAt(pollToEdit.closeAt ? new Date(pollToEdit.closeAt) : undefined)
      setIsDraft(pollToEdit.status === "draft")
    } else {
      // Reset form for new poll
      setTitle("")
      setDescription("")
      setOptions([
        { id: crypto.randomUUID(), text: "" },
        { id: crypto.randomUUID(), text: "" },
      ])
      setSelectionType("single-choice")
      setAnonymous(false)
      setResultsVisibility("live")
      setCloseAt(undefined)
      setIsDraft(false)
      setSaveAsDraft(false)
    }
  }, [pollToEdit, open])

  const handleAddOption = () => {
    setOptions([...options, { id: crypto.randomUUID(), text: "" }])
  }

  const handleRemoveOption = (id: string) => {
    if (options.length > 2) {
      setOptions(options.filter((opt) => opt.id !== id))
    }
  }

  const handleOptionChange = (id: string, text: string) => {
    setOptions(options.map((opt) => (opt.id === id ? { ...opt, text } : opt)))
  }

  const handleSave = () => {
    if (!user || title.trim() === "") {
      alert("Please fill in the title.")
      return
    }

    // For drafts, don't require all options to be filled
    if (!saveAsDraft && !isDraft && options.some((opt) => opt.text.trim() === "")) {
      alert("Please fill in all option fields.")
      return
    }

    const pollData: Poll = {
      id: pollToEdit?.id || crypto.randomUUID(),
      title,
      description,
      options,
      selectionType,
      anonymous,
      resultsVisibility,
      closeAt: closeAt?.toISOString(),
      status: saveAsDraft || isDraft ? "draft" : "open",
      createdBy: pollToEdit?.createdBy || user.uid,
      creatorName: pollToEdit?.creatorName || user.name,
      createdAt: pollToEdit?.createdAt || new Date().toISOString(),
      votes: pollToEdit?.votes || [],
    }
    onSave(pollData)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{pollToEdit ? "Edit Poll" : "Create a New Poll"}</DialogTitle>
          <DialogDescription>Fill in the details below to create or update a poll.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Team Lunch Destination"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide some context for the poll"
            />
          </div>
          <div className="space-y-3">
            <Label>Options</Label>
            {options.map((option, index) => (
              <div key={option.id} className="flex items-center gap-2">
                <Input
                  value={option.text}
                  onChange={(e) => handleOptionChange(option.id, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                />
                {options.length > 2 && (
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveOption(option.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={handleAddOption}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Option
            </Button>
          </div>
          <div className="space-y-2">
            <Label>Selection Type</Label>
            <Select value={selectionType} onValueChange={(v: "single-choice" | "multi-select") => setSelectionType(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select selection type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single-choice">Single Choice</SelectItem>
                <SelectItem value="multi-select">Multiple Choice</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Close Date (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn("w-full justify-start text-left font-normal", !closeAt && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {closeAt ? format(closeAt, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={closeAt} onSelect={setCloseAt} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Anonymous Mode</Label>
                <p className="text-sm text-muted-foreground">If enabled, voters' identities will be hidden.</p>
              </div>
              <Switch checked={anonymous} onCheckedChange={setAnonymous} />
            </div>
            <div className="space-y-2 rounded-lg border p-4">
              <Label>Results Visibility</Label>
              <RadioGroup
                value={resultsVisibility}
                onValueChange={(v: "live" | "hidden_until_close") => setResultsVisibility(v)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="live" id="live" />
                  <Label htmlFor="live">Live Progress</Label>
                </div>
                <p className="text-sm text-muted-foreground pl-6">Results update in real-time as people vote.</p>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hidden_until_close" id="hidden" />
                  <Label htmlFor="hidden">Hidden Until Close</Label>
                </div>
                <p className="text-sm text-muted-foreground pl-6">
                  Results are only revealed after the poll is closed.
                </p>
              </RadioGroup>
            </div>
          </div>
        </div>
        <DialogFooter>
          <div className="flex items-center gap-2 mr-auto">
            <input
              type="checkbox"
              id="saveAsDraft"
              checked={saveAsDraft || isDraft}
              onChange={(e) => setSaveAsDraft(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="saveAsDraft" className="text-sm">
              Save as draft
            </Label>
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {saveAsDraft || isDraft ? "Save Draft" : pollToEdit ? "Save Changes" : "Create Poll"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
