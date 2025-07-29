"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Plus, Search, LogOut, Check, X, Trash2 } from "lucide-react"

interface Course {
  code: string
  name: string
  creditHours: number
  minGPA: number | string
  prerequisites: string
  selected?: boolean
}

const courses: Course[] = [
  { code: "CS101", name: "Introduction to Programming", creditHours: 3, minGPA: "None", prerequisites: "None" },
  { code: "CS102", name: "Data Structures", creditHours: 3, minGPA: 2.0, prerequisites: "CS101", selected: true },
  { code: "CS201", name: "Algorithms", creditHours: 3, minGPA: 2.5, prerequisites: "CS102" },
  { code: "CS204", name: "Operating Systems", creditHours: 3, minGPA: 2.0, prerequisites: "CS101" },
  { code: "CS301", name: "Database Systems", creditHours: 3, minGPA: 3.0, prerequisites: "CS201, CS204" },
]

export default function GradPath() {
  const router = useRouter()
  const [selectedCourses, setSelectedCourses] = useState<string[]>(["CS102"])
  const [showAddCourse, setShowAddCourse] = useState(false)
  const [showCourseSaved, setShowCourseSaved] = useState(false)
  const [showRuleBuilder, setShowRuleBuilder] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [prerequisiteFilter, setPrerequisiteFilter] = useState("")

  const handleLogout = () => {
    localStorage.removeItem("currentUser")
    router.push("/")
  }

  const [newCourse, setNewCourse] = useState({
    name: "Operating Systems",
    code: "CS301",
    creditHours: "3",
    prerequisites: ["Intro to Programming", "Data Structures"],
    minGPA: "",
    maxCreditLimit: "",
  })

  const handleCourseSelect = (courseCode: string) => {
    setSelectedCourses((prev) =>
      prev.includes(courseCode) ? prev.filter((code) => code !== courseCode) : [...prev, courseCode],
    )
  }

  const handleSaveCourse = () => {
    setShowAddCourse(false)
    setShowCourseSaved(true)
  }

  const handleDefineRules = () => {
    setShowCourseSaved(false)
    setShowRuleBuilder(true)
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
                    Ruleset
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

                <Button onClick={() => setShowAddCourse(true)} className="bg-[#022131] hover:bg-[#02283b] text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Course
                </Button>
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
                  <Label className="text-sm font-medium text-[#2c2c2c] mb-2 block">Prerequisites</Label>
                  <Select value={prerequisiteFilter} onValueChange={setPrerequisiteFilter}>
                    <SelectTrigger className="bg-white border-[#d3d5d5]">
                      <SelectValue placeholder="Filter by Prerequisites" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="cs101">CS101</SelectItem>
                      <SelectItem value="cs102">CS102</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Course Table */}
              <div className="bg-white rounded-lg border border-[#e7ebee]">
                <div className="flex items-center justify-between p-4 border-b border-[#e7ebee]">
                  <h2 className="font-semibold text-[#2c2c2c]">All Courses</h2>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-[#2c2c2c] border-[#d3d5d5] bg-transparent"
                      disabled={selectedCourses.length === 0}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Selection
                    </Button>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="w-8 h-8 p-0 bg-transparent">
                        1
                      </Button>
                      <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                        2
                      </Button>
                      <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                        3
                      </Button>
                      <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                        →
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#f5f5f5]">
                      <tr>
                        <th className="text-left p-4 font-medium text-[#2c2c2c]">Code</th>
                        <th className="text-left p-4 font-medium text-[#2c2c2c]">Course Name</th>
                        <th className="text-left p-4 font-medium text-[#2c2c2c]">Credit Hours</th>
                        <th className="text-left p-4 font-medium text-[#2c2c2c]">Min. GPA</th>
                        <th className="text-left p-4 font-medium text-[#2c2c2c]">Prerequisites</th>
                        <th className="w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.map((course) => (
                        <tr
                          key={course.code}
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
                          <td className="p-4 text-[#2c2c2c]">{course.name}</td>
                          <td className="p-4 text-[#2c2c2c]">{course.creditHours}</td>
                          <td className="p-4 text-[#2c2c2c]">{course.minGPA}</td>
                          <td className="p-4 text-[#2c2c2c]">{course.prerequisites}</td>
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
                  value={newCourse.name}
                  onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
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
                    value={newCourse.creditHours}
                    onChange={(e) => setNewCourse({ ...newCourse, creditHours: e.target.value })}
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
                      <X className="w-3 h-3 ml-1 cursor-pointer" />
                    </Badge>
                  ))}
                </div>
                <Input placeholder="Add Prerequisites" className="mt-2" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-[#2c2c2c]">Min. GPA (Optional)</Label>
                  <Input
                    value={newCourse.minGPA}
                    onChange={(e) => setNewCourse({ ...newCourse, minGPA: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-[#2c2c2c]">Max Credit Limit (Optional)</Label>
                  <Input
                    value={newCourse.maxCreditLimit}
                    onChange={(e) => setNewCourse({ ...newCourse, maxCreditLimit: e.target.value })}
                    className="mt-1"
                  />
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
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-4 top-4"
                onClick={() => setShowCourseSaved(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </DialogHeader>

            <div className="py-8">
              <div className="w-16 h-16 bg-[#81c25c] rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-white" />
              </div>

              <h3 className="text-xl font-semibold text-[#2c2c2c] mb-2">Course saved!</h3>
              <p className="text-[#757575] mb-8">
                You can now find your new course in the All Courses list or prerequisites in the Course Builder section
                automatically.
              </p>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowCourseSaved(false)} className="flex-1">
                  Skip for now
                </Button>
                <Button onClick={handleDefineRules} className="flex-1 bg-[#022131] hover:bg-[#02283b] text-white">
                  Define Rules
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Rule Builder Modal */}
        <Dialog open={showRuleBuilder} onOpenChange={setShowRuleBuilder}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-[#2c2c2c]">Rule Builder: Operating Systems</DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-4 top-4"
                onClick={() => setShowRuleBuilder(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </DialogHeader>

            <div className="space-y-6">
              <div>
                <Label className="text-sm font-medium text-[#2c2c2c]">Rules for this course</Label>
                <div className="mt-2 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-[#2c2c2c]">Rule 1</span>
                    <Select defaultValue="gpa">
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpa">GPA</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select defaultValue="gte">
                      <SelectTrigger className="w-16">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gte">≥</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input defaultValue="2.5" className="w-20" />
                    <Button variant="outline" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm text-[#2c2c2c]">THEN</span>
                    <Select defaultValue="allow">
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="allow">Allow Registration</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-[#2c2c2c]">Set New Rule</Label>
                <div className="mt-2 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-[#2c2c2c]">IF</span>
                    <Select>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Key" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpa">GPA</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select>
                      <SelectTrigger className="w-16">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gte">≥</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input placeholder="Value" className="w-20" />
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm text-[#2c2c2c]">THEN</span>
                    <Select>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Action" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="allow">Allow Registration</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setShowRuleBuilder(false)}
                className="w-full bg-[#022131] hover:bg-[#02283b] text-white"
              >
                Save Rules
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
