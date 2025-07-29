import fs from 'fs'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'data', 'users.json')

interface User {
  id: string
  email: string
  password: string
  role: "student" | "advisor"
  createdAt: string
  updatedAt: string
}

interface StorageData {
  users: User[]
  version: string
}

// Ensure data directory exists
const ensureDataDir = () => {
  const dataDir = path.dirname(DATA_FILE)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

// Initialize storage file if it doesn't exist
const initializeStorage = () => {
  ensureDataDir()
  if (!fs.existsSync(DATA_FILE)) {
    const initialData: StorageData = {
      users: [],
      version: "1.0.0"
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2))
  }
}

// Read data from file
export const readData = (): StorageData => {
  try {
    initializeStorage()
    const data = fs.readFileSync(DATA_FILE, 'utf8')
    return JSON.parse(data) as StorageData
  } catch (error) {
    console.error('Error reading data file:', error)
    return { users: [], version: "1.0.0" }
  }
}

// Write data to file
export const writeData = (data: StorageData): void => {
  try {
    ensureDataDir()
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Error writing data file:', error)
    throw new Error('Failed to save data')
  }
}

// User management functions
export const getAllUsers = (): User[] => {
  const data = readData()
  return data.users
}

export const getUserByEmail = (email: string): User | undefined => {
  const users = getAllUsers()
  return users.find(user => user.email === email)
}

export const createUser = (email: string, password: string, role: "student" | "advisor"): User => {
  const existingUser = getUserByEmail(email)
  if (existingUser) {
    throw new Error('User with this email already exists')
  }

  const newUser: User = {
    id: Date.now().toString(),
    email,
    password, // In a real app, this should be hashed
    role,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  const data = readData()
  data.users.push(newUser)
  writeData(data)

  return newUser
}

export const validateUser = (email: string, password: string): User | null => {
  const user = getUserByEmail(email)
  if (user && user.password === password) {
    return user
  }
  return null
}

export const updateUser = (id: string, updates: Partial<User>): User | null => {
  const data = readData()
  const userIndex = data.users.findIndex(user => user.id === id)
  
  if (userIndex === -1) {
    return null
  }

  data.users[userIndex] = {
    ...data.users[userIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  }

  writeData(data)
  return data.users[userIndex]
}

export const deleteUser = (id: string): boolean => {
  const data = readData()
  const userIndex = data.users.findIndex(user => user.id === id)
  
  if (userIndex === -1) {
    return false
  }

  data.users.splice(userIndex, 1)
  writeData(data)
  return true
} 