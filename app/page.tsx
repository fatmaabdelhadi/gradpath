"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    // Validation
    if (!email || !password) {
      setError("Please enter both email and password.")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Login failed')
        setIsLoading(false)
        return
      }

      // Store current user in session (without password)
      localStorage.setItem("currentUser", JSON.stringify(data.user))

      // Redirect based on role
      if (data.user.role === "student") {
        router.push("/student")
      } else {
        router.push("/advisor")
      }

    } catch (error) {
      setError("Network error. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#e6f0fa]">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-md space-y-6"
      >
        <h1 className="text-2xl font-bold text-center text-[#022131]">GradPath Login</h1>
        
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

        {error && <div className="text-red-500 text-sm text-center">{error}</div>}

        <Button 
          type="submit" 
          className="w-full bg-[#669bbb] hover:bg-[#022131] text-white"
          disabled={isLoading}
        >
          {isLoading ? "Signing In..." : "Sign In"}
        </Button>

        <div className="text-center">
          <span className="text-sm text-gray-600">Don't have an account? </span>
          <button
            type="button"
            onClick={() => router.push("/signup")}
            className="text-sm text-[#669bbb] hover:underline"
            disabled={isLoading}
          >
            Create Account
          </button>
        </div>
      </form>
    </div>
  )
} 