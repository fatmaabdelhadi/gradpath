import { NextRequest, NextResponse } from 'next/server'
import { createUser } from '../../../../lib/db'

export async function POST(request: NextRequest) {
  try {
    const { email, password, role } = await request.json()

    // Validation
    if (!email || !password || !role) {
      return NextResponse.json(
        { error: 'Email, password, and role are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    if (!['student', 'advisor'].includes(role)) {
      return NextResponse.json(
        { error: 'Role must be either "student" or "advisor"' },
        { status: 400 }
      )
    }

    // Create user in MongoDB
    const user = await createUser(email, password, role as "student" | "advisor")

    // Return user data (password is automatically excluded by the schema)
    return NextResponse.json({
      message: 'User created successfully',
      user: user.toJSON()
    }, { status: 201 })

  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 