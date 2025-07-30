"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Plus, Search, LogOut, Check, X, Trash2, UploadCloud, FileText } from "lucide-react"

interface Course {
  _id?: string
  code: string
  title: string
  credit_hours: number
  min_gpa: number
  prerequisites: string[]
  offered_this_semester: boolean
  selected?: boolean
}

interface ParsedCourse {
  code: string
  title: string
  prerequisites: string[]
  min_gpa: number
  offered_this_semester: boolean
}

interface ParseCoursesResponse {
  courses: ParsedCourse[]
  message: string
}

interface DatabaseCourse {
  _id: string
  code: string
  title: string
  credit_hours: number
  min_gpa: number
  prerequisites: string[]
  offered_this_semester: boolean
}

export default function GradPath() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const [showAddCourse, setShowAddCourse] = useState(false)
  const [showCourseSaved, setShowCourseSaved] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [prerequisiteFilter, setPrerequisiteFilter] = useState("all")
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const coursesPerPage = 5
  
  // PDF parsing state
  const [showPdfUpload, setShowPdfUpload] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [parsedCourses, setParsedCourses] = useState<ParsedCourse[] | null>(null)
  const [parseMessage, setParseMessage] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Generate dynamic prerequisite filter options
  const getPrerequisiteOptions = () => {
    const allPrerequisites = new Set<string>()
    
    // Collect all unique prerequisites from all courses
    courses.forEach(course => {
      course.prerequisites.forEach(prereq => {
        allPrerequisites.add(prereq)
      })
    })
    
    // Convert to sorted array
    return Array.from(allPrerequisites).sort()
  }

  // Fetch courses from database
  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('http://localhost:8000/courses')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      const formattedCourses: Course[] = data.courses.map((course: DatabaseCourse) => ({
        _id: course._id,
        code: course.code,
        title: course.title,
        credit_hours: course.credit_hours,
        min_gpa: course.min_gpa,
        prerequisites: course.prerequisites,
        offered_this_semester: course.offered_this_semester,
        selected: false
      }))
      
      setCourses(formattedCourses)
    } catch (err) {
      console.error('Error fetching courses:', err)
      setError('Failed to load courses from database')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("currentUser")
    router.push("/")
  }

  const [newCourse, setNewCourse] = useState({
    title: "",
    code: "",
    credit_hours: "3",
    prerequisites: [] as string[],
    min_gpa: "",
    offered_this_semester: true,
  })

  const [prerequisiteInput, setPrerequisiteInput] = useState("")

  const handleCourseSelect = (courseCode: string) => {
    setSelectedCourses((prev) =>
      prev.includes(courseCode) ? prev.filter((code) => code !== courseCode) : [...prev, courseCode],
    )
  }

  const handleAddPrerequisite = () => {
    if (prerequisiteInput.trim() && !newCourse.prerequisites.includes(prerequisiteInput.trim())) {
      setNewCourse({
        ...newCourse,
        prerequisites: [...newCourse.prerequisites, prerequisiteInput.trim()]
      })
      setPrerequisiteInput("")
    }
  }

  const handleRemovePrerequisite = (index: number) => {
    setNewCourse({
      ...newCourse,
      prerequisites: newCourse.prerequisites.filter((_, i) => i !== index)
    })
  }

  const handlePrerequisiteKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddPrerequisite()
    }
  }

  // Pagination logic
  const filteredCourses = courses.filter(course => 
    searchTerm === "" || 
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.code.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(course => 
    prerequisiteFilter === "all" ? 
      true : 
      prerequisiteFilter === "none" ? 
        course.prerequisites.length === 0 : 
        course.prerequisites.some(prereq => 
          prereq.toLowerCase() === prerequisiteFilter.toLowerCase()
        )
  )

  const totalPages = Math.ceil(filteredCourses.length / coursesPerPage)
  const startIndex = (currentPage - 1) * coursesPerPage
  const endIndex = startIndex + coursesPerPage
  const currentCourses = filteredCourses.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, prerequisiteFilter])

  const handleDeleteSelected = async () => {
    if (selectedCourses.length === 0) return
    
    // Show confirmation dialog
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = async () => {
    try {
      // Get the actual course IDs from the selected course codes
      const coursesToDelete = courses.filter(course => 
        selectedCourses.includes(course.code)
      ).map(course => course._id).filter(Boolean)
      
      if (coursesToDelete.length === 0) {
        alert('No valid courses selected for deletion')
        return
      }

      const response = await fetch('http://localhost:8000/courses', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(coursesToDelete),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to delete courses')
      }

      const result = await response.json()
      alert(`Successfully deleted ${result.deleted_count} courses`)
      
      // Clear selection and refresh courses
      setSelectedCourses([])
      await fetchCourses()
      
    } catch (error) {
      console.error('Error deleting courses:', error)
      alert('Failed to delete courses: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setShowDeleteConfirm(false)
    }
  }

  const handleSaveCourse = async () => {
    try {
      const courseData = {
        code: newCourse.code,
        title: newCourse.title,
        credit_hours: parseInt(newCourse.credit_hours),
        min_gpa: parseFloat(newCourse.min_gpa) || 0.0,
        prerequisites: newCourse.prerequisites,
        offered_this_semester: newCourse.offered_this_semester
      }

      const response = await fetch('http://localhost:8000/confirm_courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([courseData])
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to save course')
      }

      const result = await response.json()
    setShowAddCourse(false)
    setShowCourseSaved(true)
      
      // Refresh courses list
      await fetchCourses()
      
      // Reset form
      setNewCourse({
        title: "",
        code: "",
        credit_hours: "3",
        prerequisites: [],
        min_gpa: "",
        offered_this_semester: true,
      })
      setPrerequisiteInput("")
    } catch (error) {
      console.error('Error saving course:', error)
      alert('Failed to save course: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
      setParsedCourses(null)
      setParseMessage(null)
    }
  }

  const handleUploadCourses = async () => {
    if (!selectedFile) return
    setUploading(true)
    setParsedCourses(null)
    setParseMessage(null)
    
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      
      const response = await fetch('http://localhost:8000/parse_courses_pdf', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to parse PDF')
      }
      
      const data: ParseCoursesResponse = await response.json()
      setParsedCourses(data.courses)
      setParseMessage(data.message)
      
    } catch (error) {
      console.error('Error parsing PDF:', error)
      setParseMessage(`Error: ${error instanceof Error ? error.message : 'Failed to parse PDF'}`)
    } finally {
      setUploading(false)
    }
  }

  const handleConfirmCourses = async () => {
    if (!parsedCourses) return
    setConfirming(true)
    
    try {
      const response = await fetch('http://localhost:8000/confirm_courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parsedCourses),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to save courses')
      }
      
      const result = await response.json()
      setParseMessage(`✅ ${result.message}`)
      setParsedCourses(null)
      setShowPdfUpload(false)
      
      // Refresh courses list
      await fetchCourses()
      
    } catch (error) {
      console.error('Error saving courses:', error)
      setParseMessage(`Error: ${error instanceof Error ? error.message : 'Failed to save courses'}`)
    } finally {
      setConfirming(false)
    }
  }

  const handleRejectCourses = () => {
    setParsedCourses(null)
    setParseMessage(null)
    setSelectedFile(null)
    setShowPdfUpload(false)
  }

  return (
    <div className="min-h-screen bg-[#669bbb] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Main Dashboard */}
        <div className="bg-[#f5f5f5] rounded-lg shadow-lg overflow-hidden">
          <div className="flex">
            {/* Sidebar */}
            <div className="w-64 bg-[#022131] text-white">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-8">
                  <div className="w-8 h-8 bg-[#5b5fc7] rounded flex items-center justify-center">
                    <span className="text-white font-bold text-sm">G</span>
                  </div>
                  <span className="font-semibold text-lg">GradPath.</span>
                </div>

                <nav className="space-y-2">
                  <div className="text-[#b8d1e0] text-sm font-medium py-2 px-3 bg-[#02283b] rounded">Courses</div>
                  <button
                    className="w-full text-left text-[#b8d1e0] text-sm font-medium py-2 px-3 rounded hover:bg-[#02283b] transition-colors"
                    onClick={() => router.push('/advisor/ruleset')}
                  >
                    Rules
                  </button>
                </nav>
              </div>

              <div className="absolute bottom-6 left-6">
                <Button 
                  variant="ghost" 
                  className="text-[#b8d1e0] hover:text-white hover:bg-[#02283b] p-2"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <h1 className="text-2xl font-semibold text-[#2c2c2c]">Courses</h1>
                  <div className="w-8 h-8 bg-[#5b5fc7] rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">H</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button onClick={() => setShowPdfUpload(true)} variant="outline" className="border-[#022131] text-[#022131] hover:bg-[#022131] hover:text-white">
                    <UploadCloud className="w-4 h-4 mr-2" />
                    Upload PDF
                  </Button>
                <Button onClick={() => setShowAddCourse(true)} className="bg-[#022131] hover:bg-[#02283b] text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Course
                </Button>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <Label className="text-sm font-medium text-[#2c2c2c] mb-2 block">What are you looking for?</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search by Course Name or Code"
                      className="pl-10 bg-white border-[#d3d5d5]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-[#2c2c2c] mb-2 block">
                    Prerequisites ({getPrerequisiteOptions().length} available)
                  </Label>
                  <div className="flex gap-2">
                    <Select value={prerequisiteFilter} onValueChange={setPrerequisiteFilter}>
                      <SelectTrigger className="bg-white border-[#d3d5d5]">
                        <SelectValue placeholder="All Courses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                        {getPrerequisiteOptions().map(prereq => (
                          <SelectItem key={prereq} value={prereq.toLowerCase()}>
                            {prereq}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={fetchCourses}
                      className="px-3"
                      title="Refresh prerequisite options"
                    >
                      ↻
                    </Button>
                  </div>
                </div>
              </div>

              {/* Course Table */}
              <div className="bg-white rounded-lg border border-[#e7ebee]">
                <div className="flex items-center justify-between p-4 border-b border-[#e7ebee]">
                  <h2 className="font-semibold text-[#2c2c2c]">
                    All Courses {loading ? "(Loading...)" : `(${filteredCourses.length} total, showing ${startIndex + 1}-${Math.min(endIndex, filteredCourses.length)} of ${filteredCourses.length})`}
                    {!loading && prerequisiteFilter !== "all" && (
                      <span className="text-sm font-normal text-gray-500 ml-2">
                        {prerequisiteFilter === "none" ? " - No Prerequisites" : ` - Prerequisite: ${prerequisiteFilter.toUpperCase()}`}
                      </span>
                    )}
                  </h2>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-[#2c2c2c] border-[#d3d5d5] bg-transparent"
                      disabled={selectedCourses.length === 0}
                      onClick={handleDeleteSelected}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Selection ({selectedCourses.length.toString()})
                    </Button>
                    {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-8 h-8 p-0 bg-transparent"
                          onClick={handlePrevPage}
                          disabled={currentPage === 1}
                        >
                          ←
                      </Button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            variant={currentPage === page ? "outline" : "ghost"}
                            size="sm"
                            className={`w-8 h-8 p-0 ${currentPage === page ? "bg-[#022131] text-white" : ""}`}
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                      </Button>
                        ))}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-8 h-8 p-0 bg-transparent"
                          onClick={handleNextPage}
                          disabled={currentPage === totalPages}
                        >
                        →
                      </Button>
                    </div>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border-b border-red-200">
                    <p className="text-red-600 text-sm">{error}</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={fetchCourses}
                    >
                      Retry
                    </Button>
                  </div>
                )}

                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#022131] mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading courses...</p>
                  </div>
                ) : filteredCourses.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-gray-600">
                      {courses.length === 0 ? "No courses found in database." : "No courses match your search criteria."}
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-2"
                      onClick={fetchCourses}
                    >
                      Refresh
                    </Button>
                  </div>
                ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#f5f5f5]">
                      <tr>
                        <th className="text-left p-4 font-medium text-[#2c2c2c]">Code</th>
                        <th className="text-left p-4 font-medium text-[#2c2c2c]">Course Name</th>
                        <th className="text-left p-4 font-medium text-[#2c2c2c]">Credit Hours</th>
                        <th className="text-left p-4 font-medium text-[#2c2c2c]">Min. GPA</th>
                        <th className="text-left p-4 font-medium text-[#2c2c2c]">Prerequisites</th>
                          <th className="text-left p-4 font-medium text-[#2c2c2c]">Offered</th>
                        <th className="w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                        {currentCourses.map((course) => (
                        <tr
                            key={course._id || course.code}
                          className={`border-b border-[#e7ebee] hover:bg-[#f5f5f5] ${
                            selectedCourses.includes(course.code) ? "bg-[#b8d1e0]/20" : ""
                          }`}
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={selectedCourses.includes(course.code)}
                                onCheckedChange={() => handleCourseSelect(course.code)}
                              />
                              <span className="font-medium text-[#2c2c2c]">{course.code}</span>
                            </div>
                          </td>
                            <td className="p-4 text-[#2c2c2c]">{course.title}</td>
                            <td className="p-4 text-[#2c2c2c]">{course.credit_hours}</td>
                            <td className="p-4 text-[#2c2c2c]">{course.min_gpa}</td>
                            <td className="p-4 text-[#2c2c2c]">
                              {course.prerequisites.length > 0 ? course.prerequisites.join(', ') : 'None'}
                            </td>
                            <td className="p-4">
                              <Badge 
                                variant={course.offered_this_semester ? "default" : "secondary"}
                                className={course.offered_this_semester ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                              >
                                {course.offered_this_semester ? 'Yes' : 'No'}
                              </Badge>
                            </td>
                          <td className="p-4">
                            <Button variant="ghost" size="sm" className="text-[#5b5fc7]">
                              ↗
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Add New Course Modal */}
        <Dialog open={showAddCourse} onOpenChange={setShowAddCourse}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-[#2c2c2c]">Add New Course</DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-4 top-4"
                onClick={() => setShowAddCourse(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-[#2c2c2c]">Course name</Label>
                <Input
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-[#2c2c2c]">Course Code</Label>
                  <Input
                    value={newCourse.code}
                    onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-[#2c2c2c]">Credit Hours</Label>
                  <Input
                    type="number"
                    value={newCourse.credit_hours}
                    onChange={(e) => setNewCourse({ ...newCourse, credit_hours: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-[#2c2c2c]">Prerequisites</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {newCourse.prerequisites.map((prereq, index) => (
                    <Badge key={index} variant="secondary" className="bg-[#5b5fc7] text-white">
                      {prereq}
                      <X 
                        className="w-3 h-3 ml-1 cursor-pointer" 
                        onClick={() => handleRemovePrerequisite(index)}
                      />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <Input 
                    placeholder="Add Prerequisites" 
                    value={prerequisiteInput}
                    onChange={(e) => setPrerequisiteInput(e.target.value)}
                    onKeyPress={handlePrerequisiteKeyPress}
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={handleAddPrerequisite}
                    disabled={!prerequisiteInput.trim()}
                  >
                    Add
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-[#2c2c2c]">Min. GPA (Optional)</Label>
                  <Input
                    value={newCourse.min_gpa}
                    onChange={(e) => setNewCourse({ ...newCourse, min_gpa: parseFloat(e.target.value) || 0.0 })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-[#2c2c2c]">Offered This Semester</Label>
                  <Select
                    value={newCourse.offered_this_semester ? "true" : "false"}
                    onValueChange={(value) => setNewCourse({ ...newCourse, offered_this_semester: value === "true" })}
                  >
                    <SelectTrigger className="bg-white border-[#d3d5d5]">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleSaveCourse} className="w-full bg-[#022131] hover:bg-[#02283b] text-white">
                Save Course
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Course Saved Modal */}
        <Dialog open={showCourseSaved} onOpenChange={setShowCourseSaved}>
          <DialogContent className="max-w-md text-center">
            <DialogHeader>
              <DialogTitle className="text-[#2c2c2c]">Course Saved Successfully</DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-4 top-4"
                onClick={() => setShowCourseSaved(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </DialogHeader>

            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-[#2c2c2c]">Course Saved!</h3>
              <p className="text-gray-600">The course has been successfully added to the database.</p>
            </div>
          </DialogContent>
        </Dialog>

        {/* PDF Upload Modal */}
        <Dialog open={showPdfUpload} onOpenChange={(open) => {
          // Only allow closing if no courses are being processed
          if (!uploading && !parsedCourses) {
            setShowPdfUpload(open)
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="text-[#2c2c2c]">Upload Course PDF</DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-4 top-4"
                onClick={() => {
                  if (!uploading && !parsedCourses) {
                    setShowPdfUpload(false)
                  }
                }}
                disabled={uploading || !!parsedCourses}
              >
                <X className="w-4 h-4" />
              </Button>
            </DialogHeader>

            <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-2">
              <div>
                <Label className="block mb-2 text-[#2c2c2c]">Select a PDF file containing course information:</Label>
                <div className="flex items-center gap-4 mb-4">
                  <Input
                    id="course-pdf-upload"
                    type="file"
                    accept="application/pdf"
                    className="flex-1"
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('course-pdf-upload')?.click()}
                    disabled={uploading}
                  >
                    <UploadCloud className="w-4 h-4 mr-2" /> Browse
                  </Button>
                </div>
                {selectedFile && (
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-4 h-4 text-[#5b5fc7]" />
                    <span className="text-[#2c2c2c]">{selectedFile.name}</span>
                  </div>
                )}
                <Button
                  className="w-full bg-[#022131] hover:bg-[#02283b] text-white mb-4"
                  onClick={handleUploadCourses}
                  disabled={!selectedFile || uploading}
                >
                  {uploading ? "Uploading & Parsing..." : "Upload & Parse PDF"}
                </Button>
                {parseMessage && (
                  <div className="mt-4 p-4 bg-[#f0f4f8] rounded text-[#2c2c2c]">
                    <strong>{parseMessage}</strong>
                  </div>
                )}
                
                {parsedCourses && parsedCourses.length > 0 && (
                  <div className="mt-4 p-4 bg-[#f0f4f8] rounded text-[#2c2c2c]">
                    <strong>Parsed Courses ({parsedCourses.length}):</strong>
                    <div className="mt-4 space-y-4 max-h-[40vh] overflow-y-auto">
                      {parsedCourses.map((course, index) => (
                        <div key={index} className="border border-gray-200 rounded p-3 bg-white">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-[#2c2c2c]">{course.code}: {course.title}</h4>
                            <div className="flex gap-2">
                              <span className={`px-2 py-1 rounded text-xs ${
                                course.offered_this_semester 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {course.offered_this_semester ? 'Offered' : 'Not Offered'}
                              </span>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p><strong>Prerequisites:</strong> {course.prerequisites.length > 0 ? course.prerequisites.join(', ') : 'None'}</p>
                            <p><strong>Min GPA:</strong> {course.min_gpa}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-6 flex gap-3">
                      <Button
                        onClick={handleConfirmCourses}
                        disabled={confirming}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        {confirming ? "Saving..." : "Confirm & Save Courses"}
                      </Button>
                      <Button
                        onClick={handleRejectCourses}
                        variant="outline"
                        className="flex-1"
                      >
                        Reject & Start Over
                </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent className="max-w-md text-center">
            <DialogHeader>
              <DialogTitle className="text-[#2c2c2c]">Confirm Deletion</DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-4 top-4"
                onClick={() => setShowDeleteConfirm(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </DialogHeader>

            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-[#2c2c2c]">Are you sure?</h3>
              <p className="text-gray-600">You are about to delete {selectedCourses.length.toString()} courses. This action cannot be undone.</p>
              <div className="flex gap-3">
                <Button onClick={() => setShowDeleteConfirm(false)} variant="outline" className="bg-gray-200 text-gray-800 hover:bg-gray-300">
                  Cancel
                </Button>
                <Button onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
                  Delete
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
