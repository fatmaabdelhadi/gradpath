import connectDB from './mongodb'
import User, { IUser } from '../models/User'

// User management functions
export const getAllUsers = async (): Promise<IUser[]> => {
  await connectDB()
  return await User.find({}).select('-password')
}

export const getUserByEmail = async (email: string): Promise<IUser | null> => {
  await connectDB()
  return await User.findOne({ email: email.toLowerCase() })
}

export const createUser = async (email: string, password: string, role: "student" | "advisor"): Promise<IUser> => {
  await connectDB()
  
  const existingUser = await getUserByEmail(email)
  if (existingUser) {
    throw new Error('User with this email already exists')
  }

  const user = new User({
    email: email.toLowerCase(),
    password, // In a real app, this should be hashed
    role
  })

  return await user.save()
}

export const validateUser = async (email: string, password: string): Promise<IUser | null> => {
  await connectDB()
  const user = await getUserByEmail(email)
  
  if (user && user.password === password) {
    return user
  }
  return null
}

export const updateUser = async (id: string, updates: Partial<IUser>): Promise<IUser | null> => {
  await connectDB()
  
  const user = await User.findByIdAndUpdate(
    id,
    { ...updates, updatedAt: new Date() },
    { new: true, runValidators: true }
  )
  
  return user
}

export const deleteUser = async (id: string): Promise<boolean> => {
  await connectDB()
  
  const result = await User.findByIdAndDelete(id)
  return !!result
}

export const getUserById = async (id: string): Promise<IUser | null> => {
  await connectDB()
  return await User.findById(id).select('-password')
} 