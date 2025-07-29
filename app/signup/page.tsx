"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState<"student" | "advisor">("student")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsLoading(true)

    // Validation
    if (!email || !password || !confirmPassword) {
      setError("Please fill in all fields.")
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          role
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create account')
        setIsLoading(false)
        return
      }

      setSuccess("Account created successfully! Redirecting to login...")
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/")
      }, 2000)

    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#e6f0fa]">
      <form
        onSubmit={handleSignUp}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-md space-y-6"
      >
        <h1 className="text-2xl font-bold text-center text-[#022131]">Create Account</h1>
        
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="mt-1"
            required
            disabled={isLoading}
          />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="mt-1"
            required
            disabled={isLoading}
          />
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            className="mt-1"
            required
            disabled={isLoading}
          />
        </div>

        <div>
          <Label htmlFor="role">Role</Label>
          <div className="flex gap-4 mt-1">
            <button
              type="button"
              className={`px-4 py-2 rounded border ${role === "student" ? "bg-[#669bbb] text-white" : "bg-white text-[#022131]"}`}
              onClick={() => setRole("student")}
              disabled={isLoading}
            >
              Student
            </button>
            <button
              type="button"
              className={`px-4 py-2 rounded border ${role === "advisor" ? "bg-[#669bbb] text-white" : "bg-white text-[#022131]"}`}
              onClick={() => setRole("advisor")}
              disabled={isLoading}
            >
              Advisor/TA
            </button>
          </div>
        </div>

        {error && <div className="text-red-500 text-sm text-center">{error}</div>}
        {success && <div className="text-green-500 text-sm text-center">{success}</div>}

        <Button 
          type="submit" 
          className="w-full bg-[#669bbb] hover:bg-[#022131] text-white"
          disabled={isLoading}
        >
          {isLoading ? "Creating Account..." : "Create Account"}
        </Button>

        <div className="text-center">
          <span className="text-sm text-gray-600">Already have an account? </span>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-sm text-[#669bbb] hover:underline"
            disabled={isLoading}
          >
            Sign In
          </button>
        </div>
      </form>
    </div>
  )
} 