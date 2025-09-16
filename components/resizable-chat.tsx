"use client"

import type React from "react"
import type { ResizableChatProps } from "@/types"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  MessageCircle,
  Send,
  User,
  Minimize2,
  Maximize2,
  GripVertical,
  Move,
  GroupIcon,
  PlusCircle,
  X,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { useTranslation } from "@/lib/i18n"
import { useIsMobile } from "@/hooks/use-mobile"
import type { ChatConversation, ChatMessage, User as UserType } from "@/types"
import { EmojiShortcuts } from "@/components/emoji-shortcuts"

export function ResizableChat({ className }: ResizableChatProps) {
  const { user } = useAuth()
  const { t } = useTranslation(user?.preferredLanguage as any)
  const isMobile = useIsMobile()
  const [isMinimized, setIsMinimized] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [users, setUsers] = useState<UserType[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [unreadCounts, setUnreadCounts] = useState<{ [key: string]: number }>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Group Chat State
  const [isCreatingGroup, setIsCreatingGroup] = useState(false)
  const [groupName, setGroupName] = useState("")
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([])

  // Resizable state
  const [size, setSize] = useState({ width: 400, height: 500 })
  const [isResizing, setIsResizing] = useState(false)
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })

  const [resizeDirection, setResizeDirection] = useState<
  | "right"
  | "left"
  | "bottom"
  | "top"
  | "bottom-right"
  | "bottom-left"
  | "top-right"
  | "top-left"
  | null
  >(null)

  // Draggable state
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, startX: 0, startY: 0 })

  useEffect(() => {
    const updatePosition = () => {
      setPosition((prev) => {
        // Don't override user-defined position if resizing or dragging
        if (isDragging || isResizing) return prev

        const windowHeight = window.innerHeight
        const windowWidth = window.innerWidth
        return {
          x: windowWidth - size.width - 20,
          y: (windowHeight - size.height) / 2,
        }
      })
    }

    updatePosition()
    window.addEventListener("resize", updatePosition)
    return () => window.removeEventListener("resize", updatePosition)
  }, [])

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

  // Auto-hide chat on mobile
  useEffect(() => {
    if (isMobile) {
      setIsHidden(true)
    } else {
      setIsHidden(false)
    }
  }, [isMobile])

  const loadData = () => {
    if (typeof window !== "undefined") {
      const storedUsers = localStorage.getItem("allUsers")
      if (storedUsers) {
        const usersData = JSON.parse(storedUsers) as UserType[]
        setUsers(usersData.filter((u) => u.uid !== user?.uid))
      }

      const storedConversations = localStorage.getItem("conversations")
      if (storedConversations) {
        const conversationsData = JSON.parse(storedConversations) as ChatConversation[]
        const userConversations = conversationsData.filter((conv) => conv.participants.includes(user?.uid || ""))
        setConversations(userConversations)

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

      const updatedMessages = messagesData.map((msg) => {
        if (msg.senderId !== user?.uid && !msg.readBy.includes(user?.uid || "")) {
          return { ...msg, readBy: [...msg.readBy, user?.uid || ""] }
        }
        return msg
      })
      localStorage.setItem(`messages_${conversationId}`, JSON.stringify(updatedMessages))
      setUnreadCounts((prev) => ({ ...prev, [conversationId]: 0 }))
    }
  }

  const startConversation = (otherUserId: string) => {
    const existingConv = conversations.find(
      (conv) => !conv.isGroup && conv.participants.length === 2 && conv.participants.includes(otherUserId),
    )

    if (existingConv) {
      setSelectedConversation(existingConv.id)
      return
    }

    const newConversation: ChatConversation = {
      id: `conv_${Date.now()}`,
      participants: [user?.uid || "", otherUserId],
      createdAt: new Date().toISOString(),
      isGroup: false,
    }

    const storedConversations = localStorage.getItem("conversations")
    const conversationsArray: ChatConversation[] = storedConversations ? JSON.parse(storedConversations) : []
    conversationsArray.push(newConversation)
    localStorage.setItem("conversations", JSON.stringify(conversationsArray))

    setConversations((prev) => [...prev, newConversation])
    setSelectedConversation(newConversation.id)
  }

  const handleCreateGroup = () => {
    if (!groupName.trim() || selectedGroupMembers.length === 0 || !user) return

    const newConversation: ChatConversation = {
      id: `conv_${Date.now()}`,
      participants: [user.uid, ...selectedGroupMembers],
      createdAt: new Date().toISOString(),
      isGroup: true,
      groupName: groupName.trim(),
    }

    const storedConversations = localStorage.getItem("conversations")
    const conversationsArray: ChatConversation[] = storedConversations ? JSON.parse(storedConversations) : []
    conversationsArray.push(newConversation)
    localStorage.setItem("conversations", JSON.stringify(conversationsArray))

    setConversations((prev) => [...prev, newConversation])
    setSelectedConversation(newConversation.id)
    setIsCreatingGroup(false)
    setGroupName("")
    setSelectedGroupMembers([])
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

    // Save message to the specific conversation's message store
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
      setConversations(updatedConversations.filter((conv) => conv.participants.includes(user?.uid || "")))
    }
    setMessages((prev) => [...prev, message])
    setNewMessage("")
  }

  const getUserData = (uid: string) => {
    return users.find((u) => u.uid === uid)
  }

  const getConversationTitle = (conv: ChatConversation) => {
    if (conv.isGroup) {
      return conv.groupName || "Group Chat"
    }
    const otherUserId = conv.participants.find((p) => p !== user?.uid)
    return otherUserId ? getUserData(otherUserId)?.name || "Unknown User" : "Chat"
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true)
    setResizeStart({ x: e.clientX, y: e.clientY, width: size.width, height: size.height })
  }

  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY, startX: position.x, startY: position.y })
    document.body.style.userSelect = "none"
  }

  const startResize = (e: React.MouseEvent, direction: typeof resizeDirection) => {
    e.preventDefault()
    setResizeDirection(direction)
    setIsResizing(true)
    setResizeStart({ x: e.clientX, y: e.clientY, width: size.width, height: size.height })
  }
  const MINIMIZED_WIDTH = 280
  const MINIMIZED_HEIGHT = 48
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing && resizeDirection) {
        const dx = e.clientX - resizeStart.x
        const dy = e.clientY - resizeStart.y

        let newWidth = resizeStart.width
        let newHeight = resizeStart.height
        let newX = position.x
        let newY = position.y

        if (resizeDirection.includes("right")) {
          newWidth = Math.max(300, resizeStart.width + dx)
        }
        if (resizeDirection.includes("left")) {
          const proposedWidth = resizeStart.width - dx
          if (proposedWidth >= 300) {
            newWidth = proposedWidth
            newX = resizeStart.x + dx
          }
        }
        if (resizeDirection.includes("bottom")) {
          newHeight = Math.max(400, resizeStart.height + dy)
        }
        if (resizeDirection.includes("top")) {
          const proposedHeight = resizeStart.height - dy
          if (proposedHeight >= 400) {
            newHeight = proposedHeight
            newY = resizeStart.y + dy
          }
        }

        // Clamp to window bounds
        newWidth = Math.min(newWidth, window.innerWidth - newX)
        newHeight = Math.min(newHeight, window.innerHeight - newY)

        setSize({ width: newWidth, height: newHeight })
        setPosition({ x: newX, y: newY })
      }
      if (isDragging) {
        const deltaX = e.clientX - dragStart.x
        const deltaY = e.clientY - dragStart.y

        const limitX = isMinimized ? window.innerWidth - MINIMIZED_WIDTH : window.innerWidth - size.width
        const limitY = isMinimized ? window.innerHeight - MINIMIZED_HEIGHT : window.innerHeight - size.height

        const newX = Math.max(0, Math.min(limitX, dragStart.startX + deltaX))
        const newY = Math.max(0, Math.min(limitY, dragStart.startY + deltaY))

        setPosition({ x: newX, y: newY })
      }
    }
    const handleMouseUp = () => {
      setIsResizing(false)
      setIsDragging(false)
      setResizeDirection(null)
      document.body.style.userSelect = ""
    }
    if (isResizing || isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isResizing, isDragging, resizeStart, dragStart, size])

  // If completely hidden, show only a chat button
  if (isHidden) {
    return (
      <Button
        className="fixed z-50 bottom-4 right-4 rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
        onClick={() => setIsHidden(false)}
      >
        <MessageCircle className="h-6 w-6" />
        {Object.values(unreadCounts).reduce((sum, count) => sum + count, 0) > 0 && (
          <Badge variant="destructive" className="absolute -top-2 -right-2 text-xs">
            {Object.values(unreadCounts).reduce((sum, count) => sum + count, 0)}
          </Badge>
        )}
      </Button>
    )
  }

  if (isMinimized) {
    return (
      <Card
        className="fixed z-50 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
        style={{ left: position.x, top: position.y, width: 280 }}
      >
        <CardHeader className="pb-2 relative bg-white dark:bg-gray-800 cursor-move"
        onMouseDown={handleDragStart}>
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm flex items-center gap-2 text-gray-900 dark:text-gray-100 select-none">
              <MessageCircle className="h-4 w-4" />
              {t("teamChat")}
              {Object.values(unreadCounts).reduce((sum, count) => sum + count, 0) > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {Object.values(unreadCounts).reduce((sum, count) => sum + count, 0)}
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" onClick={() => {
                const clampedX = Math.min(position.x, window.innerWidth - size.width)
                const clampedY = Math.min(position.y, window.innerHeight - size.height)
                setPosition({ x: clampedX, y: clampedY })
                setIsMinimized(false)
              }}>
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsHidden(true)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>
    )
  }

  return (
    <>
      <Card
        className="fixed z-50 select-none bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
        style={{
          left: isMobile ? 0 : position.x,
          top: isMobile ? 0 : position.y,
          width: isMobile ? "100%" : size.width,
          height: isMobile ? "100%" : size.height,
          maxWidth: isMobile ? "100%" : "auto",
        }}
      >
        <CardHeader className="pb-2 relative bg-white dark:bg-gray-800 cursor-move"
        onMouseDown={handleDragStart}>
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm flex items-center gap-2 text-gray-900 dark:text-gray-100 select-none">
              <MessageCircle className="h-4 w-4" />
              {t("teamChat")}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" onClick={() => setIsCreatingGroup(true)}>
                <PlusCircle className="h-4 w-4" />
              </Button>
              {isMobile && (
                <Button size="sm" variant="ghost" onClick={() => setIsHidden(true)}>
                  <X className="h-4 w-4" />
                </Button>
              )}
              {!isMobile && (
                <>
                  <Button size="sm" variant="ghost" onClick={() => setIsMinimized(true)}>
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button size="sm" variant="ghost" onClick={() => setIsHidden(true)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent
          className="p-0 flex bg-white dark:bg-gray-800"
          style={{ height: isMobile ? "calc(100% - 80px)" : size.height - 80 }}
        >
          {/* Sidebar */}
          <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400">{t("teamMembers")}</h4>
            </div>
            <ScrollArea style={{ height: isMobile ? "calc(100% - 60px)" : size.height - 140 }}>
              <div className="p-1">
                {/* Show existing conversations first */}
                {conversations.map((conv) => {
                  const unreadCount = unreadCounts[conv.id] || 0
                  const otherUser = conv.isGroup
                    ? null
                    : getUserData(conv.participants.find((p) => p !== user?.uid) || "")
                  return (
                    <div
                      key={conv.id}
                      className={`flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded ${
                        selectedConversation === conv.id ? "bg-blue-50 dark:bg-blue-900/20" : ""
                      }`}
                      onClick={() => setSelectedConversation(conv.id)}
                    >
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          {conv.isGroup ? (
                            <AvatarFallback className="bg-gray-200 dark:bg-gray-700">
                              <GroupIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            </AvatarFallback>
                          ) : (
                            <div>
                              <AvatarImage src={otherUser?.profilePhoto || "/placeholder.svg"} />
                              <AvatarFallback className="bg-gray-200 dark:bg-gray-700">
                                <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                              </AvatarFallback>
                            </div>
                          )}
                        </Avatar>
                        {unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center">
                            <span className="text-xs text-white">{unreadCount}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">
                          {getConversationTitle(conv)}
                        </p>
                        {conv.lastMessage && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-1">{conv.lastMessage}</p>
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* Show users without conversations */}
                {users
                  .filter((member) => {
                    // Only show users who don't have an existing conversation
                    return !conversations.some(
                      (conv) =>
                        !conv.isGroup && conv.participants.includes(member.uid) && conv.participants.length === 2,
                    )
                  })
                  .map((member) => (
                    <div
                      key={member.uid}
                      className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded"
                      onClick={() => startConversation(member.uid)}
                    >
                      <Avatar className="h-10 w-10">
                        <div>
                          <AvatarImage src={member.profilePhoto || "/placeholder.svg"} />
                          <AvatarFallback className="bg-gray-200 dark:bg-gray-700">
                            <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                          </AvatarFallback>
                        </div>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">{member.name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">Start conversation</p>
                      </div>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
            {selectedConversation ? (
              <>
                <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {getConversationTitle(conversations.find((c) => c.id === selectedConversation)!)}
                  </h4>
                </div>
                <ScrollArea
                  className="flex-1 p-3 bg-white dark:bg-gray-800"
                  style={{ height: isMobile ? "calc(100% - 120px)" : size.height - 200 }}
                >
                  <div className="space-y-3">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex items-end gap-2 ${
                          message.senderId === user?.uid ? "justify-end" : "justify-start"
                        } group`}
                      >
                        {message.senderId !== user?.uid && (
                          <div className="flex items-center gap-1">
                            <Avatar
                              className="h-6 w-6 cursor-pointer"
                              onClick={() => window.open(`/profile/${message.senderId}`, "_blank")}
                            >
                              <AvatarImage src={getUserData(message.senderId)?.profilePhoto || "/placeholder.svg"} />
                              <AvatarFallback className="bg-gray-200 dark:bg-gray-700">
                                <User className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                              </AvatarFallback>
                            </Avatar>
                            <EmojiShortcuts
                              targetUser={message.senderId}
                              targetUserName={getUserData(message.senderId)?.name}
                              onEmojiSent={(emoji, targetUser) => {
                                // Send emoji as a quick reaction message
                                const reactionMessage: ChatMessage = {
                                  id: `msg_${Date.now()}`,
                                  conversationId: selectedConversation!,
                                  senderId: user!.uid,
                                  text: emoji,
                                  timestamp: new Date().toISOString(),
                                  readBy: [user!.uid],
                                }
                                const storedMessages = localStorage.getItem(`messages_${selectedConversation}`)
                                const messagesArray: ChatMessage[] = storedMessages ? JSON.parse(storedMessages) : []
                                messagesArray.push(reactionMessage)
                                localStorage.setItem(`messages_${selectedConversation}`, JSON.stringify(messagesArray))
                                setMessages((prev) => [...prev, reactionMessage])
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                          </div>
                        )}
                        <div
                          className={`max-w-[80%] p-3 rounded-lg text-sm ${
                            message.senderId === user?.uid
                              ? "bg-blue-500 text-white"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{message.text}</p>
                          <p
                            className={`text-xs mt-1 ${
                              message.senderId === user?.uid ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
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
                <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={t("typeMessage")}
                      className="text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                      onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    />
                    <Button size="sm" onClick={sendMessage}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800">
                <div className="text-center p-6">
                  <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm">{t("selectMember")}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        {/* Corner Resize Handles */}
        <div onMouseDown={(e) => startResize(e, "bottom-right")} className="absolute bottom-0 right-0 w-3 h-3 cursor-nwse-resize z-50" />
        <div onMouseDown={(e) => startResize(e, "bottom-left")} className="absolute bottom-0 left-0 w-3 h-3 cursor-nesw-resize z-50" />
        <div onMouseDown={(e) => startResize(e, "top-right")} className="absolute top-0 right-0 w-3 h-3 cursor-nesw-resize z-50" />
        <div onMouseDown={(e) => startResize(e, "top-left")} className="absolute top-0 left-0 w-3 h-3 cursor-nwse-resize z-50" />

        {/* Side Resize Handles */}
        <div onMouseDown={(e) => startResize(e, "right")} className="absolute top-0 right-0 w-2 h-full cursor-ew-resize z-50" />
        <div onMouseDown={(e) => startResize(e, "left")} className="absolute top-0 left-0 w-2 h-full cursor-ew-resize z-50" />
        <div onMouseDown={(e) => startResize(e, "bottom")} className="absolute bottom-0 left-0 w-full h-2 cursor-ns-resize z-50" />
        <div onMouseDown={(e) => startResize(e, "top")} className="absolute top-0 left-0 w-full h-2 cursor-ns-resize z-50" />
      </Card>

      {/* Create Group Dialog */}
      <Dialog open={isCreatingGroup} onOpenChange={setIsCreatingGroup}>
        <DialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">Create a New Group Chat</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Select members and give your group a name.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="groupName" className="text-gray-900 dark:text-gray-100">
                Group Name
              </Label>
              <Input
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="My Awesome Team"
                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <Label className="text-gray-900 dark:text-gray-100">Select Members</Label>
              <ScrollArea className="h-48 border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800">
                <div className="space-y-2">
                  {users.map((member) => (
                    <div key={member.uid} className="flex items-center gap-2">
                      <Checkbox
                        id={`member-${member.uid}`}
                        onCheckedChange={(checked) => {
                          setSelectedGroupMembers((prev) =>
                            checked ? [...prev, member.uid] : prev.filter((id) => id !== member.uid),
                          )
                        }}
                      />
                      <Label htmlFor={`member-${member.uid}`} className="text-gray-900 dark:text-gray-100">
                        {member.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
            <Button onClick={handleCreateGroup} className="w-full">
              Create Group
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
