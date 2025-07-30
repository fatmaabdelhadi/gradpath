"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LogOut, UploadCloud, FileText, Check, X } from "lucide-react"

interface ParsedRule {
  title: string
  description: string
  category: string
}

interface ParseResponse {
  rules: ParsedRule[]
  message: string
}

export default function RulesetPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [parsedRules, setParsedRules] = useState<ParsedRule[] | null>(null)
  const [parseMessage, setParseMessage] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)

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
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("currentUser")
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-[#669bbb] p-6">
      <div className="max-w-7xl mx-auto">
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
                  <div className="text-[#b8d1e0] text-sm font-medium py-2 px-3 bg-[#02283b] rounded">Ruleset</div>
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
                  <h1 className="text-2xl font-semibold text-[#2c2c2c]">Ruleset</h1>
                  <div className="w-8 h-8 bg-[#5b5fc7] rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">R</span>
                  </div>
                </div>
              </div>
              {/* PDF Upload UI */}
              <div className="bg-white rounded-lg border border-[#e7ebee] p-8 max-w-xl mx-auto">
                <Label htmlFor="ruleset-upload" className="block mb-2 text-[#2c2c2c]">Select a PDF file containing the ruleset:</Label>
                <div className="flex items-center gap-4 mb-4">
                  <Input
                    id="ruleset-upload"
                    type="file"
                    accept="application/pdf"
                    className="flex-1"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
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
                  onClick={handleUpload}
                  disabled={!selectedFile || uploading}
                >
                  {uploading ? "Uploading & Parsing..." : "Upload & Parse PDF"}
                </Button>
                {parseMessage && (
                  <div className="mt-4 p-4 bg-[#f0f4f8] rounded text-[#2c2c2c]">
                    <strong>{parseMessage}</strong>
                  </div>
                )}
                
                {parsedRules && parsedRules.length > 0 && (
                  <div className="mt-4 p-4 bg-[#f0f4f8] rounded text-[#2c2c2c]">
                    <strong>Parsed Academic Rules:</strong>
                    <div className="mt-4 space-y-4">
                      {parsedRules.map((rule, index) => (
                        <div key={index} className="border border-gray-200 rounded p-3 bg-white">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-[#2c2c2c]">{rule.title}</h4>
                            <div className="flex gap-2">
                              <span className={`px-2 py-1 rounded text-xs ${
                                rule.category === 'prerequisites' ? 'bg-blue-100 text-blue-800' :
                                rule.category === 'probation' ? 'bg-orange-100 text-orange-800' :
                                rule.category === 'gpa' ? 'bg-purple-100 text-purple-800' :
                                rule.category === 'registration' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {rule.category.charAt(0).toUpperCase() + rule.category.slice(1)}
                              </span>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">
                            <p>{rule.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-6 flex gap-3">
                      <Button
                        onClick={handleConfirmRules}
                        disabled={confirming}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        {confirming ? "Saving..." : "Confirm & Save Rules"}
                      </Button>
                      <Button
                        onClick={handleRejectRules}
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
          </div>
        </div>
      </div>
    </div>
  )
} 