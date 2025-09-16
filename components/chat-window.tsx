"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageCircle, Send, User, Minimize2, Maximize2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import type { ChatConversation, ChatMessage, User as UserType } from "@/types"

interface ChatWindowProps {
  className?: string
}

export function ChatWindow({ className }: ChatWindowProps) {
  const { user } = useAuth()
  const [isMinimized, setIsMinimized] = useState(false)
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [users, setUsers] = useState<UserType[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [unreadCounts, setUnreadCounts] = useState<{ [key: string]: number }>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadData()
  }, [user])

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation)
    }
  }, [selectedConversation])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const loadData = () => {
    if (typeof window !== "undefined") {
      // Load users
      const storedUsers = localStorage.getItem("allUsers")
      if (storedUsers) {
        const usersData = JSON.parse(storedUsers) as UserType[]
        setUsers(usersData.filter((u) => u.uid !== user?.uid))
      }

      // Load conversations
      const storedConversations = localStorage.getItem("conversations")
      if (storedConversations) {
        const conversationsData = JSON.parse(storedConversations) as ChatConversation[]
        const userConversations = conversationsData.filter((conv) => conv.participants.includes(user?.uid || ""))
        setConversations(userConversations)

        // Calculate unread counts
        const counts: { [key: string]: number } = {}
        userConversations.forEach((conv) => {
          const convMessages = JSON.parse(localStorage.getItem(`messages_${conv.id}`) || "[]") as ChatMessage[]
          const unreadCount = convMessages.filter(
            (msg) => msg.senderId !== user?.uid && !msg.readBy.includes(user?.uid || ""),
          ).length
          counts[conv.id] = unreadCount
        })
        setUnreadCounts(counts)
      }
    }
  }

  const loadMessages = (conversationId: string) => {
    const storedMessages = localStorage.getItem(`messages_${conversationId}`)
    if (storedMessages) {
      const messagesData = JSON.parse(storedMessages) as ChatMessage[]
      setMessages(messagesData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()))

      // Mark messages as read
      const updatedMessages = messagesData.map((msg) => {
        if (msg.senderId !== user?.uid && !msg.readBy.includes(user?.uid || "")) {
          return { ...msg, readBy: [...msg.readBy, user?.uid || ""] }
        }
        return msg
      })
      localStorage.setItem(`messages_${conversationId}`, JSON.stringify(updatedMessages))

      // Update unread count
      setUnreadCounts((prev) => ({ ...prev, [conversationId]: 0 }))
    }
  }

  const startConversation = (otherUserId: string) => {
    // Check if conversation already exists
    const existingConv = conversations.find(
      (conv) => conv.participants.includes(otherUserId) && conv.participants.length === 2,
    )

    if (existingConv) {
      setSelectedConversation(existingConv.id)
      return
    }

    // Create new conversation
    const newConversation: ChatConversation = {
      id: `conv_${Date.now()}`,
      participants: [user?.uid || "", otherUserId],
      createdAt: new Date().toISOString(),
    }

    const storedConversations = localStorage.getItem("conversations")
    const conversationsArray: ChatConversation[] = storedConversations ? JSON.parse(storedConversations) : []
    conversationsArray.push(newConversation)
    localStorage.setItem("conversations", JSON.stringify(conversationsArray))

    setConversations((prev) => [...prev, newConversation])
    setSelectedConversation(newConversation.id)
  }

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedConversation || !user) return

    const message: ChatMessage = {
      id: `msg_${Date.now()}`,
      conversationId: selectedConversation,
      senderId: user.uid,
      text: newMessage.trim(),
      timestamp: new Date().toISOString(),
      readBy: [user.uid],
    }

    const storedMessages = localStorage.getItem(`messages_${selectedConversation}`)
    const messagesArray: ChatMessage[] = storedMessages ? JSON.parse(storedMessages) : []
    messagesArray.push(message)
    localStorage.setItem(`messages_${selectedConversation}`, JSON.stringify(messagesArray))

    // Update conversation last message
    const storedConversations = localStorage.getItem("conversations")
    if (storedConversations) {
      const conversationsArray = JSON.parse(storedConversations) as ChatConversation[]
      const updatedConversations = conversationsArray.map((conv) =>
        conv.id === selectedConversation
          ? { ...conv, lastMessage: newMessage.trim(), lastMessageAt: new Date().toISOString() }
          : conv,
      )
      localStorage.setItem("conversations", JSON.stringify(updatedConversations))
    }

    setMessages((prev) => [...prev, message])
    setNewMessage("")
  }

  const getUserName = (uid: string) => {
    return users.find((u) => u.uid === uid)?.name || "Unknown"
  }

  const getOtherParticipant = (conversation: ChatConversation) => {
    return conversation.participants.find((p) => p !== user?.uid) || ""
  }

  if (isMinimized) {
    return (
      <Card className={`fixed bottom-4 right-4 w-80 ${className}`}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Chat
              {Object.values(unreadCounts).reduce((sum, count) => sum + count, 0) > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {Object.values(unreadCounts).reduce((sum, count) => sum + count, 0)}
                </Badge>
              )}
            </CardTitle>
            <Button size="sm" variant="ghost" onClick={() => setIsMinimized(false)}>
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className={`fixed bottom-4 right-4 w-80 h-96 ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Team Chat
          </CardTitle>
          <Button size="sm" variant="ghost" onClick={() => setIsMinimized(true)}>
            <Minimize2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex h-80">
        {/* Sidebar */}
        <div className="w-1/3 border-r">
          <div className="p-2 border-b">
            <h4 className="text-xs font-medium text-gray-600">Team Members</h4>
          </div>
          <ScrollArea className="h-64">
            <div className="p-1">
              {users.map((member) => {
                const conversation = conversations.find(
                  (conv) => conv.participants.includes(member.uid) && conv.participants.length === 2,
                )
                const unreadCount = conversation ? unreadCounts[conversation.id] || 0 : 0

                return (
                  <div
                    key={member.uid}
                    className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer rounded"
                    onClick={() => startConversation(member.uid)}
                  >
                    <div className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.profilePhoto || "/placeholder.svg"} />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      {unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-xs text-white">{unreadCount}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{member.name}</p>
                      {conversation?.lastMessage && (
                        <p className="text-xs text-gray-500 truncate">{conversation.lastMessage}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              <div className="p-2 border-b">
                <h4 className="text-xs font-medium">
                  {getUserName(getOtherParticipant(conversations.find((c) => c.id === selectedConversation)!))}
                </h4>
              </div>
              <ScrollArea className="flex-1 p-2">
                <div className="space-y-2">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderId === user?.uid ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] p-2 rounded text-xs ${
                          message.senderId === user?.uid ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <p>{message.text}</p>
                        <p
                          className={`text-xs mt-1 ${
                            message.senderId === user?.uid ? "text-blue-100" : "text-gray-500"
                          }`}
                        >
                          {new Date(message.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              <div className="p-2 border-t">
                <div className="flex gap-1">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="text-xs"
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  />
                  <Button size="sm" onClick={sendMessage}>
                    <Send className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-xs">Select a team member to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
