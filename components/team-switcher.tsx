"use client"

import * as React from "react"
import { Check, ChevronsUpDown, PlusCircle, Users } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useRouter } from "next/navigation"

type Team = {
  id: string
  name: string
}

type TeamSwitcherProps = {
  teams?: Team[]
  currentTeam?: Team
  className?: string
}

export function TeamSwitcher({ teams = [], currentTeam, className }: TeamSwitcherProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [selectedTeam, setSelectedTeam] = React.useState<Team | undefined>(currentTeam || teams[0])

  const handleTeamSelect = (team: Team) => {
    setSelectedTeam(team)
    setOpen(false)
    // You can add navigation or team switching logic here
    // router.push(`/teams/${team.id}`)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select a team"
          className={cn("w-[200px] justify-between", className)}
        >
          <Users className="mr-2 h-4 w-4" />
          {selectedTeam?.name || "Select team"}
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandList>
            <CommandInput placeholder="Search team..." />
            <CommandEmpty>No team found.</CommandEmpty>
            {teams.length > 0 && (
              <CommandGroup heading="Teams">
                {teams.map((team) => (
                  <CommandItem key={team.id} onSelect={() => handleTeamSelect(team)} className="text-sm">
                    <Users className="mr-2 h-4 w-4" />
                    {team.name}
                    {selectedTeam?.id === team.id && <Check className="ml-auto h-4 w-4" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
          <CommandSeparator />
          <CommandList>
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setOpen(false)
                  // Add create team logic here
                }}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Team
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
