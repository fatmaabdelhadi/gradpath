"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, UploadCloud, Check, X, Trash2, LogOut, Search, RefreshCw } from 'lucide-react'

interface ParsedRule {
  title: string
  description: string
  category: string
}

interface ParseResponse {
  rules: ParsedRule[]
  message: string
}

interface Rule {
  _id?: string
  title: string
  description: string
  category?: string
  type?: string
  selected?: boolean
}

export default function RulesetPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [parsedRules, setParsedRules] = useState<ParsedRule[] | null>(null)
  const [parseMessage, setParseMessage] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)

  // Manual rule addition state
  const [showAddRule, setShowAddRule] = useState(false)
  const [showRuleSaved, setShowRuleSaved] = useState(false)
  const [showPdfUpload, setShowPdfUpload] = useState(false)
  const [newRule, setNewRule] = useState({
    title: "",
    description: "",
    category: ""
  })

  // Rules display state
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRules, setSelectedRules] = useState<string[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Search and pagination state
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const rulesPerPage = 4

  const ruleCategories = [
    "prerequisites",
    "probation", 
    "gpa",
    "registration",
    "graduation",
    "academic_standing",
    "other"
  ]

  // Fetch rules from database
  const fetchRules = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('http://localhost:8000/rules')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      setRules(data.rules.map((rule: any) => ({ ...rule, selected: false })))
    } catch (error) {
      console.error('Error fetching rules:', error)
      setError('Failed to load rules')
    } finally {
      setLoading(false)
    }
  }

  // Load rules on component mount
  useEffect(() => {
    fetchRules()
  }, [])

  // Filter rules based on search term
  const filteredRules = rules.filter(rule =>
    rule.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rule.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (rule.category && rule.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (rule.type && rule.type.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Pagination logic
  const totalPages = Math.ceil(filteredRules.length / rulesPerPage)
  const startIndex = (currentPage - 1) * rulesPerPage
  const endIndex = startIndex + rulesPerPage
  const currentRules = filteredRules.slice(startIndex, endIndex)

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

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const handleRuleSelect = (ruleId: string) => {
    setSelectedRules(prev => 
      prev.includes(ruleId) 
        ? prev.filter(id => id !== ruleId)
        : [...prev, ruleId]
    )
  }

  const handleSelectAllRules = () => {
    if (selectedRules.length === currentRules.length) {
      setSelectedRules([])
    } else {
      setSelectedRules(currentRules.map(rule => rule._id!).filter(Boolean))
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedRules.length === 0) return
    
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = async () => {
    try {
      // Delete from backend
      const response = await fetch('http://localhost:8000/rules', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(selectedRules),
      })

      if (response.ok) {
        // Backend delete successful
        const result = await response.json()
        console.log('Backend delete result:', result)
        
        // Clear selection and close dialog
        setSelectedRules([])
        setShowDeleteConfirm(false)
        
        // Refresh the rules list from database
        await fetchRules()
        
        // Show success message
        alert(`Successfully deleted ${result.deleted_count} rules from database`)
      } else {
        // Backend delete failed
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to delete rules')
      }
    } catch (error) {
      console.error('Error deleting rules:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to delete rules'}`)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
      setParsedRules(null)
      setParseMessage(null)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    setUploading(true)
    setParsedRules(null)
    setParseMessage(null)
    
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      
      const response = await fetch('http://localhost:8000/parse_rules_pdf', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to parse PDF')
      }
      
      const data: ParseResponse = await response.json()
      setParsedRules(data.rules)
      setParseMessage(data.message)
      
    } catch (error) {
      console.error('Error parsing PDF:', error)
      setParseMessage(`Error: ${error instanceof Error ? error.message : 'Failed to parse PDF'}`)
    } finally {
      setUploading(false)
    }
  }

  const handleConfirmRules = async () => {
    if (!parsedRules) return
    setConfirming(true)
    
    try {
      const response = await fetch('http://localhost:8000/confirm_rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parsedRules),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to save rules')
      }
      
      const result = await response.json()
      setParseMessage(`✅ ${result.message}`)
      setParsedRules(null)
      setSelectedFile(null)
      setShowPdfUpload(false)
      
      // Refresh rules list
      await fetchRules()
      
    } catch (error) {
      console.error('Error saving rules:', error)
      setParseMessage(`Error: ${error instanceof Error ? error.message : 'Failed to save rules'}`)
    } finally {
      setConfirming(false)
    }
  }

  const handleRejectRules = () => {
    setParsedRules(null)
    setParseMessage(null)
    setSelectedFile(null)
    setShowPdfUpload(false)
  }

  const handleSaveRule = async () => {
    try {
      const response = await fetch('http://localhost:8000/confirm_rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([newRule]),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to save rule')
      }

      const result = await response.json()
      setShowRuleSaved(true)
      setShowAddRule(false)
      setNewRule({ title: "", description: "", category: "" })
      
      // Refresh rules list
      await fetchRules()
      
    } catch (error) {
      console.error('Error saving rule:', error)
      alert('Failed to save rule: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const handleResetRule = () => {
    setNewRule({ title: "", description: "", category: "" })
  }

  const handleLogout = () => {
    localStorage.removeItem("currentUser")
    router.push("/")
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
                  <button
                    className="w-full text-left text-[#b8d1e0] text-sm font-medium py-2 px-3 rounded hover:bg-[#02283b] transition-colors"
                    onClick={() => router.push('/advisor')}
                  >
                    Courses
                  </button>
                  <div className="text-[#b8d1e0] text-sm font-medium py-2 px-3 bg-[#02283b] rounded">Rules</div>
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
                  <h1 className="text-2xl font-semibold text-[#2c2c2c]">Rules</h1>
                  <div className="w-8 h-8 bg-[#5b5fc7] rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">H</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={() => setShowPdfUpload(true)} 
                    variant="outline" 
                    className="border-[#022131] text-[#022131] hover:bg-[#022131] hover:text-white"
                  >
                    <UploadCloud className="w-4 h-4 mr-2" />
                    Upload PDF
                  </Button>
                  <Button 
                    onClick={fetchRules} 
                    variant="outline" 
                    className="border-[#022131] text-[#022131] hover:bg-[#022131] hover:text-white"
                    disabled={loading}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button onClick={() => setShowAddRule(true)} className="bg-[#022131] hover:bg-[#02283b] text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Rule
                  </Button>
                </div>
              </div>

              {/* Search */}
              <div className="mb-6">
                <Label className="text-sm font-medium text-[#2c2c2c] mb-2 block">Search Rules</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by title, description, or category"
                    className="pl-10 bg-white border-[#d3d5d5]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Rules Display */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-[#2c2c2c]">
                      Rules ({filteredRules.length} total)
                      {searchTerm && (
                        <span className="text-sm font-normal text-gray-500 ml-2">
                          - Filtered by "{searchTerm}"
                        </span>
                      )}
                    </h2>
                    <div className="flex items-center gap-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[#2c2c2c] border-[#d3d5d5] bg-transparent"
                        disabled={selectedRules.length === 0}
                        onClick={handleDeleteSelected}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Selection ({selectedRules.length.toString()})
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
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border-b border-red-200">
                    <p className="text-red-600 text-sm">{error}</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={fetchRules}
                    >
                      Retry
                    </Button>
                  </div>
                )}

                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#022131] mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading rules...</p>
                  </div>
                ) : filteredRules.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-gray-600">
                      {rules.length === 0 ? "No rules found in database." : "No rules match your search criteria."}
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-2"
                      onClick={fetchRules}
                    >
                      Refresh
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[#f5f5f5]">
                        <tr>
                          <th className="text-left p-4 font-medium text-[#2c2c2c]">
                            <Checkbox
                              checked={selectedRules.length === currentRules.length && currentRules.length > 0}
                              onCheckedChange={handleSelectAllRules}
                            />
                          </th>
                          <th className="text-left p-4 font-medium text-[#2c2c2c]">Title</th>
                          <th className="text-left p-4 font-medium text-[#2c2c2c]">Description</th>
                          <th className="text-left p-4 font-medium text-[#2c2c2c]">Category</th>
                          <th className="w-12"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {currentRules.map((rule) => (
                          <tr key={rule._id} className="hover:bg-gray-50">
                            <td className="p-4">
                              <Checkbox
                                checked={selectedRules.includes(rule._id!)}
                                onCheckedChange={() => handleRuleSelect(rule._id!)}
                              />
                            </td>
                            <td className="p-4 text-sm text-gray-900 font-medium">{rule.title}</td>
                            <td className="p-4 text-sm text-gray-700 max-w-md truncate">{rule.description}</td>
                            <td className="p-4 text-sm text-gray-700">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {(rule.category || rule.type) ? 
                                  (rule.category || rule.type).charAt(0).toUpperCase() + (rule.category || rule.type).slice(1).replace('_', ' ') 
                                  : 'Uncategorized'}
                              </span>
                            </td>
                            <td className="p-4 text-sm text-gray-700">
                              <Button
                                onClick={() => {
                                  setSelectedRules([rule._id!])
                                  setShowDeleteConfirm(true)
                                }}
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
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
      </div>

      {/* PDF Upload Modal */}
      <Dialog open={showPdfUpload} onOpenChange={(open) => {
        if (!open && !uploading && !parsedRules) {
          setShowPdfUpload(false)
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#2c2c2c]">
              Upload Rules from PDF
              {parsedRules && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  - {parsedRules.length} rules found
                </span>
              )}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-4 top-4"
              onClick={() => {
                if (!uploading && !parsedRules) {
                  setShowPdfUpload(false)
                }
              }}
              disabled={uploading || parsedRules !== null}
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="pdf-upload" className="text-sm font-medium text-[#2c2c2c]">
                Select PDF File
              </Label>
              <Input
                id="pdf-upload"
                type="file"
                accept=".pdf,.txt"
                onChange={handleFileChange}
                ref={fileInputRef}
                className="mt-1"
              />
            </div>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="bg-[#022131] hover:bg-[#02283b] text-white"
            >
              {uploading ? (
                <>
                  <UploadCloud className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4 mr-2" />
                  Upload and Parse
                </>
              )}
            </Button>
          </div>

          {parseMessage && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">{parseMessage}</p>
            </div>
          )}

          {parsedRules && (
            <div className="mt-4">
              <h3 className="text-md font-semibold text-[#2c2c2c] mb-3">
                Parsed Rules ({parsedRules.length} found)
              </h3>
              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md p-4 bg-gray-50">
                {parsedRules.map((rule, index) => (
                  <div key={index} className="mb-4 p-3 bg-white rounded border">
                    <h4 className="font-medium text-[#2c2c2c]">{rule.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{rule.description}</p>
                    <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {rule.category || 'Uncategorized'}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-3">
                <Button
                  onClick={handleConfirmRules}
                  disabled={confirming}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {confirming ? (
                    <>
                      <Check className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Confirm and Save
                    </>
                  )}
                </Button>
                <Button onClick={handleRejectRules} variant="outline">
                  <X className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add New Rule Modal */}
      <Dialog open={showAddRule} onOpenChange={setShowAddRule}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#2c2c2c]">Add New Rule</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-4 top-4"
              onClick={() => setShowAddRule(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="rule-title" className="text-sm font-medium text-[#2c2c2c]">
                Rule Title
              </Label>
              <Input
                id="rule-title"
                placeholder="Enter rule title"
                value={newRule.title}
                onChange={(e) => setNewRule({ ...newRule, title: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="rule-category" className="text-sm font-medium text-[#2c2c2c]">
                Category
              </Label>
              <Select value={newRule.category} onValueChange={(value) => setNewRule({ ...newRule, category: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {ruleCategories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="rule-description" className="text-sm font-medium text-[#2c2c2c]">
                Description
              </Label>
              <Textarea
                id="rule-description"
                placeholder="Enter rule description"
                value={newRule.description}
                onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                className="mt-1"
                rows={4}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleSaveRule} className="flex-1 bg-[#022131] hover:bg-[#02283b] text-white">
                <Check className="w-4 h-4 mr-2" />
                Save Rule
              </Button>
              <Button onClick={handleResetRule} variant="outline" className="flex-1">
                <X className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rule Saved Modal */}
      <Dialog open={showRuleSaved} onOpenChange={setShowRuleSaved}>
        <DialogContent className="max-w-md text-center">
          <DialogHeader>
            <DialogTitle className="text-[#2c2c2c]">Rule Saved Successfully</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-4 top-4"
              onClick={() => setShowRuleSaved(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-[#2c2c2c]">Rule Saved!</h3>
            <p className="text-gray-600">The rule has been successfully added to the database.</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#2c2c2c]">Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to delete {selectedRules.length} rule{selectedRules.length !== 1 ? 's' : ''}? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button onClick={handleConfirmDelete} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
              <Button onClick={() => setShowDeleteConfirm(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 