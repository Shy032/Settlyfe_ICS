"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Smile } from "lucide-react"

interface EmojiShortcutsProps {
  targetUser?: string
  targetUserName?: string
  onEmojiSent?: (emoji: string, targetUser: string) => void
  className?: string
}

const EMOJI_CATEGORIES = {
  reactions: ["👍", "👎", "❤️", "😂", "😮", "😢"],
  work: ["🔥", "💪", "🎉", "⭐", "✅", "❌"],
  progress: ["🚀", "💡", "🤔", "👏", "🙌", "💯"],
  status: ["⚡", "🎯", "📈", "📉", "⏰", "☕"],
  celebration: ["🎊", "🏆", "🥇", "🎈", "🌟", "💎"],
  support: ["🤝", "💪", "🙏", "👊", "✊", "🫶"],
}

export function EmojiShortcuts({ targetUser, targetUserName, onEmojiSent, className }: EmojiShortcutsProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleEmojiClick = (emoji: string) => {
    if (targetUser && onEmojiSent) {
      onEmojiSent(emoji, targetUser)
    }
    setIsOpen(false)
  }

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setIsOpen(true)}
        className={`h-8 w-8 p-0 ${className}`}
        title="Send emoji reaction"
      >
        <Smile className="h-4 w-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="dark:bg-gray-800 dark:border-gray-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Quick Emoji Reactions</DialogTitle>
            <DialogDescription className="dark:text-gray-300">
              {targetUserName ? `Send a quick reaction to ${targetUserName}` : "Choose an emoji reaction"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
              <div key={category}>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 capitalize">{category}</h4>
                <div className="grid grid-cols-6 gap-2">
                  {emojis.map((emoji) => (
                    <Button
                      key={emoji}
                      variant="outline"
                      className="text-xl h-10 w-10 p-0 hover:scale-110 transition-transform"
                      onClick={() => handleEmojiClick(emoji)}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
