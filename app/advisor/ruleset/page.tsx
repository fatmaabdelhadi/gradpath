"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LogOut, UploadCloud, FileText } from "lucide-react"

export default function RulesetPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [parseResult, setParseResult] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
      setParseResult(null)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    setUploading(true)
    setParseResult(null)
    // TODO: Implement actual upload and parsing logic
    setTimeout(() => {
      setParseResult("(Pretend this is the parsed ruleset from the PDF)")
      setUploading(false)
    }, 2000)
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
                {parseResult && (
                  <div className="mt-4 p-4 bg-[#f0f4f8] rounded text-[#2c2c2c]">
                    <strong>Parsed Ruleset:</strong>
                    <div className="mt-2 whitespace-pre-wrap">{parseResult}</div>
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