"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { LogOut, Send, Search, PanelLeft, X, User, Plus, BookOpen, GraduationCap, TrendingUp, AlertCircle } from "lucide-react"

interface ChatMessage {
  id: string
  type: "user" | "bot"
  content: string
  timestamp: Date
}

interface StudentData {
  id: string
  email: string
  role: string
  gpa: number
  completed_courses: string[]
  academic_standing: string
}

interface Course {
  code: string
  title: string
  credit_hours: number
}

export default function GradPathApp() {
  const router = useRouter()
  const [currentView, setCurrentView] = useState<"chat" | "dashboard">("chat")
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
  const [studentData, setStudentData] = useState<StudentData | null>(null)
  const [availableCourses, setAvailableCourses] = useState<Course[]>([])
  const [loadingStudentData, setLoadingStudentData] = useState(false)
  const [showAddCourseDialog, setShowAddCourseDialog] = useState(false)
  const [newGPA, setNewGPA] = useState("")
  const [selectedCourse, setSelectedCourse] = useState("")

  useEffect(() => {
    const user = localStorage.getItem("currentUser")
    if (user) {
      const userData = JSON.parse(user)
      setCurrentUser(userData)
      if (userData.role === "student") {
        fetchStudentData(userData._id || userData.id)
        fetchAvailableCourses()
      }
    } else {
      router.push("/")
    }
  }, [router])

  const fetchStudentData = async (userId: string) => {
    setLoadingStudentData(true)
    try {
      const response = await fetch(`http://localhost:8000/students/${userId}`)
      if (response.ok) {
        const data = await response.json()
        // Remove duplicates from completed_courses
        const uniqueCompletedCourses = [...new Set(data.student.completed_courses)]
        setStudentData({
          ...data.student,
          completed_courses: uniqueCompletedCourses
        })
      } else {
        console.error("Failed to fetch student data")
      }
    } catch (error) {
      console.error("Error fetching student data:", error)
    } finally {
      setLoadingStudentData(false)
    }
  }

  const fetchAvailableCourses = async () => {
    try {
      const response = await fetch("http://localhost:8000/courses")
      if (response.ok) {
        const data = await response.json()
        setAvailableCourses(data.courses)
      }
    } catch (error) {
      console.error("Error fetching courses:", error)
    }
  }

  const updateStudentData = async (updateData: any) => {
    if (!currentUser) return

    try {
      const response = await fetch(`http://localhost:8000/students/${currentUser._id || currentUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        // Refresh student data
        await fetchStudentData(currentUser._id || currentUser.id)
        return true
      } else {
        console.error("Failed to update student data")
        return false
      }
    } catch (error) {
      console.error("Error updating student data:", error)
      return false
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("currentUser")
    router.push("/")
  }

  const handleAddCompletedCourse = async () => {
    if (!selectedCourse || !studentData) return

    // Check if course is already completed
    if (studentData.completed_courses.includes(selectedCourse)) {
      alert("This course is already in your completed courses list!")
      return
    }

    const updatedCourses = [...studentData.completed_courses, selectedCourse]
    const success = await updateStudentData({ completed_courses: updatedCourses })
    
    if (success) {
      setShowAddCourseDialog(false)
      setSelectedCourse("")
    }
  }

  const handleRemoveCompletedCourse = async (courseCode: string) => {
    if (!studentData) return

    const updatedCourses = studentData.completed_courses.filter(course => course !== courseCode)
    await updateStudentData({ completed_courses: updatedCourses })
  }

  const handleUpdateGPA = async () => {
    if (!newGPA || !studentData) return

    const gpa = parseFloat(newGPA)
    if (isNaN(gpa) || gpa < 0 || gpa > 4) {
      alert("Please enter a valid GPA between 0 and 4")
      return
    }

    const success = await updateStudentData({ gpa })
    if (success) {
      setNewGPA("")
    }
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

  const getAcademicStandingColor = (standing: string) => {
    switch (standing) {
      case "good":
        return "bg-green-100 text-green-800"
      case "probation":
        return "bg-yellow-100 text-yellow-800"
      case "suspension":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
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
                  currentView === "dashboard" ? "text-white bg-gray-700" : "text-gray-300 hover:text-white"
                }`}
                onClick={() => setCurrentView("dashboard")}
              >
                Dashboard
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
            <h2 className="text-xl font-medium text-gray-900">{currentView === "chat" ? "Gradbot" : "Student Dashboard"}</h2>
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
          /* Dashboard Content */
          <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
            {loadingStudentData ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
              </div>
            ) : studentData ? (
              <div className="max-w-6xl space-y-6">
                {/* Student Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Current GPA</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{studentData.gpa.toFixed(2)}</div>
                      <p className="text-xs text-muted-foreground">
                        {studentData.gpa >= 3.5 ? "Excellent" : studentData.gpa >= 3.0 ? "Good" : studentData.gpa >= 2.0 ? "Satisfactory" : "Needs Improvement"}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Completed Courses</CardTitle>
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{studentData.completed_courses.length}</div>
                      <p className="text-xs text-muted-foreground">
                        {studentData.completed_courses.length} courses completed
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Academic Standing</CardTitle>
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <Badge className={getAcademicStandingColor(studentData.academic_standing)}>
                        {studentData.academic_standing.charAt(0).toUpperCase() + studentData.academic_standing.slice(1)}
                      </Badge>
                    </CardContent>
                  </Card>
                </div>

                {/* GPA Update Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Update GPA</CardTitle>
                    <CardDescription>
                      Keep your GPA updated for better academic advising
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4 items-end">
                      <div className="flex-1">
                        <Label htmlFor="gpa">Current GPA</Label>
                        <Input
                          id="gpa"
                          type="number"
                          step="0.01"
                          min="0"
                          max="4"
                          value={newGPA}
                          onChange={(e) => setNewGPA(e.target.value)}
                          placeholder="Enter your GPA (0.0 - 4.0)"
                          className="mt-1"
                        />
                      </div>
                      <Button onClick={handleUpdateGPA} disabled={!newGPA}>
                        Update GPA
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Completed Courses Section */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Completed Courses</CardTitle>
                        <CardDescription>
                          Track the courses you have successfully completed
                        </CardDescription>
                      </div>
                      <Dialog open={showAddCourseDialog} onOpenChange={setShowAddCourseDialog}>
                        <DialogTrigger asChild>
                          <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Course
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Completed Course</DialogTitle>
                            <DialogDescription>
                              Select a course you have successfully completed
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="course-select">Course</Label>
                              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a course" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableCourses
                                    .filter(course => !studentData.completed_courses.includes(course.code))
                                    .map((course) => (
                                      <SelectItem key={course.code} value={course.code}>
                                        {course.code} - {course.title}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => setShowAddCourseDialog(false)}>
                                Cancel
                              </Button>
                              <Button onClick={handleAddCompletedCourse} disabled={!selectedCourse}>
                                Add Course
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {studentData.completed_courses.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>No completed courses yet</p>
                        <p className="text-sm">Add your completed courses to get better academic advice</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {studentData.completed_courses.map((courseCode, index) => (
                          <div key={`${courseCode}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <GraduationCap className="w-4 h-4 text-green-600" />
                              <span className="font-medium">{courseCode}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveCompletedCourse(courseCode)}
                              className="text-red-500 hover:text-red-600 hover:bg-red-50 p-1 h-6 w-6"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Failed to load student data</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
