"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LogOut, Send, Search, PanelLeft, X, User } from "lucide-react"

interface ChatMessage {
  id: string
  type: "user" | "bot"
  content: string
  timestamp: Date
}

export default function GradPathApp() {
  const router = useRouter()
  const [currentView, setCurrentView] = useState<"chat" | "preferences">("chat")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      type: "bot",
      content: "Welcome Back! I'm your academic advisor. How can I help you today?",
      timestamp: new Date()
    }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [timePreference, setTimePreference] = useState("morning")
  const [courseType, setCourseType] = useState("project-based")
  const [selectedInstructors, setSelectedInstructors] = useState(["Mohamed Mohsen", "Hussein Elshazly"])

  useEffect(() => {
    const user = localStorage.getItem("currentUser")
    if (user) {
      setCurrentUser(JSON.parse(user))
    } else {
      router.push("/")
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("currentUser")
    router.push("/")
  }

  const removeInstructor = (instructor: string) => {
    setSelectedInstructors((prev) => prev.filter((i) => i !== instructor))
  }

  const sendMessage = async () => {
    if (!message.trim() || !currentUser) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: message,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setMessage("")
    setIsLoading(true)

    try {
      const response = await fetch("http://localhost:8000/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message,
          user_id: currentUser._id || currentUser.id
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response from chatbot")
      }

      const data = await response.json()
      
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: data.response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error("Error sending message:", error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: "Sorry, I'm having trouble connecting to the server. Please try again later.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex h-screen bg-[#8fa3b0] p-4 gap-4">
      {/* Sidebar */}
      {sidebarOpen && (
        <div className="w-56 bg-[#1a2332] text-white flex flex-col rounded-lg">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-medium">GradPath</h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="text-white hover:bg-gray-700 p-1 h-6 w-6"
              >
                <PanelLeft className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <nav className="flex-1 p-4">
            <div className="space-y-1">
              <div
                className={`px-3 py-2 text-sm cursor-pointer rounded ${
                  currentView === "chat" ? "text-white bg-gray-700" : "text-gray-300 hover:text-white"
                }`}
                onClick={() => setCurrentView("chat")}
              >
                Gradbot
              </div>
              <div
                className={`px-3 py-2 text-sm cursor-pointer rounded ${
                  currentView === "preferences" ? "text-white bg-gray-700" : "text-gray-300 hover:text-white"
                }`}
                onClick={() => setCurrentView("preferences")}
              >
                Preferences
              </div>
            </div>
          </nav>

          <div className="p-4">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-white hover:bg-gray-700 p-2"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-white rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="text-gray-600 hover:bg-gray-100 p-1 h-8 w-8"
              >
                <PanelLeft className="w-4 h-4" />
              </Button>
            )}
            <h2 className="text-xl font-medium text-gray-900">{currentView === "chat" ? "Gradbot" : "Preferences"}</h2>
          </div>
          <div className="flex items-center gap-4">
            {currentView === "chat" && (
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search Conversation"
                  className="pl-10 w-64 bg-gray-50 border-gray-200 text-sm h-9"
                />
              </div>
            )}
            <Avatar className="w-8 h-8 bg-blue-500">
              <AvatarFallback className="text-white text-sm font-medium">S</AvatarFallback>
            </Avatar>
          </div>
        </div>

        {currentView === "chat" ? (
          <>
            {/* Chat Content */}
            <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
              <div className="max-w-4xl space-y-6">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex items-start gap-3 ${msg.type === "user" ? "justify-end" : ""}`}>
                    {msg.type === "bot" && (
                      <Avatar className="w-8 h-8 bg-gray-800 mt-1">
                        <AvatarFallback className="text-white text-sm font-medium">G</AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`rounded-lg p-4 shadow-sm ${
                      msg.type === "user" 
                        ? "bg-blue-500 text-white max-w-md" 
                        : "bg-white text-gray-900 max-w-2xl"
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    {msg.type === "user" && (
                      <Avatar className="w-8 h-8 bg-blue-500 mt-1">
                        <AvatarFallback className="text-white text-sm font-medium">
                          {currentUser?.email?.charAt(0).toUpperCase() || "S"}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-start gap-3">
                    <Avatar className="w-8 h-8 bg-gray-800 mt-1">
                      <AvatarFallback className="text-white text-sm font-medium">G</AvatarFallback>
                    </Avatar>
                    <div className="bg-white rounded-lg p-4 shadow-sm max-w-md">
                      <p className="text-gray-900 text-sm">Thinking...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Message Input */}
            <div className="bg-white p-4">
              <div className="max-w-4xl">
                <div className="relative">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything - 'Why can't I take X Course?'"
                    className="pr-12 py-3 border-gray-200 text-sm"
                    disabled={isLoading}
                  />
                  <Button
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-800 hover:bg-gray-700 h-8 w-8 p-0"
                    onClick={sendMessage}
                    disabled={isLoading || !message.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Preferences Content */
          <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
            <div className="max-w-2xl space-y-8">
              {/* Time Preferences */}
              <div>
                <h3 className="text-base font-medium text-gray-900 mb-4">Time Preferences</h3>
                <div className="flex gap-8">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="time"
                      value="morning"
                      checked={timePreference === "morning"}
                      onChange={(e) => setTimePreference(e.target.value)}
                      className="w-4 h-4 text-blue-500 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-gray-900 text-sm">Morning</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="time"
                      value="afternoon"
                      checked={timePreference === "afternoon"}
                      onChange={(e) => setTimePreference(e.target.value)}
                      className="w-4 h-4 text-blue-500 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-gray-900 text-sm">Afternoon</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="time"
                      value="evening"
                      checked={timePreference === "evening"}
                      onChange={(e) => setTimePreference(e.target.value)}
                      className="w-4 h-4 text-blue-500 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-gray-900 text-sm">Evening</span>
                  </label>
                </div>
              </div>

              {/* Course Type Preferences */}
              <div>
                <h3 className="text-base font-medium text-gray-900 mb-4">Course Type Preferences</h3>
                <div className="flex gap-8">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="courseType"
                      value="project-based"
                      checked={courseType === "project-based"}
                      onChange={(e) => setCourseType(e.target.value)}
                      className="w-4 h-4 text-blue-500 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-gray-900 text-sm">Project-Based</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="courseType"
                      value="theoretical"
                      checked={courseType === "theoretical"}
                      onChange={(e) => setCourseType(e.target.value)}
                      className="w-4 h-4 text-blue-500 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-gray-900 text-sm">Theoretical</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="courseType"
                      value="labs-only"
                      checked={courseType === "labs-only"}
                      onChange={(e) => setCourseType(e.target.value)}
                      className="w-4 h-4 text-blue-500 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-gray-900 text-sm">Labs Only</span>
                  </label>
                </div>
              </div>

              {/* Preferred Instructors */}
              <div>
                <h3 className="text-base font-medium text-gray-900 mb-2">Preferred Instructors (Optional)</h3>
                <p className="text-sm text-gray-600 mb-4">
                  If there are instructors you prefer learning from, you can list them here to help tailor suggestions.
                </p>

                <Select>
                  <SelectTrigger className="w-full mb-4 border-gray-200 text-sm h-10">
                    <SelectValue placeholder="Choose Instructor(s)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mohamed">Mohamed Mohsen</SelectItem>
                    <SelectItem value="hussein">Hussein Elshazly</SelectItem>
                    <SelectItem value="other">Other Instructor</SelectItem>
                  </SelectContent>
                </Select>

                {/* Selected Instructors */}
                <div className="space-y-2">
                  {selectedInstructors.map((instructor, index) => (
                    <div key={index} className="flex items-center gap-3 bg-white p-3 rounded border border-gray-200">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900 text-sm flex-1">{instructor}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeInstructor(instructor)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 p-1 h-6 w-6"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-4">
                <Button className="bg-[#1a2332] hover:bg-gray-800 text-white px-6 text-sm">Save Preferences</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
