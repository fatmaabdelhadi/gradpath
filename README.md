# GradPath UI

A unified interface for students and advisors/TA with role-based authentication and MongoDB Atlas integration.

## Features

- **Role-based Authentication**: Students and Advisors/TA have separate interfaces
- **MongoDB Atlas Integration**: Cloud database for user management
- **Modern UI**: Built with Next.js, TypeScript, and Tailwind CSS
- **File-based to Database Migration**: Easy transition from local storage to cloud database

## Setup Instructions

### 1. Environment Configuration

1. Copy the environment example file:
   ```bash
   cp env.example .env
   ```

2. Configure your MongoDB Atlas connection:
   - Go to [MongoDB Atlas](https://cloud.mongodb.com/)
   - Create a new cluster (free tier available)
   - Get your connection string
   - Update `.env` with your MongoDB URI:

   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
   MONGODB_DB_NAME=gradpath
   ```

### 2. MongoDB Atlas Setup

1. **Create a Cluster**:
   - Sign up at [MongoDB Atlas](https://cloud.mongodb.com/)
   - Choose the free tier (M0)
   - Select your preferred cloud provider and region

2. **Set Up Database Access**:
   - Go to "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Create a username and password
   - Select "Read and write to any database"
   - Click "Add User"

3. **Set Up Network Access**:
   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
   - Click "Confirm"

4. **Get Your Connection String**:
   - Go to "Database" in the left sidebar
   - Click "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<username>`, `<password>`, and `<database>` with your values

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
gradpath-ui/
├── app/
│   ├── api/auth/          # Authentication API routes
│   ├── advisor/           # Advisor interface
│   ├── student/           # Student interface
│   ├── signup/            # Signup page
│   └── page.tsx           # Login page
├── components/ui/         # Reusable UI components
├── lib/
│   ├── db.ts             # Database operations
│   ├── mongodb.ts        # MongoDB connection
│   └── storage.ts        # File-based storage (legacy)
├── models/
│   └── User.ts           # Mongoose User model
└── data/                 # Local data storage (legacy)
```

## Database Schema

### User Model
```typescript
{
  email: string,           // Unique, lowercase
  password: string,        // Plain text (should be hashed in production)
  role: 'student' | 'advisor',
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - Authenticate user

## Migration from File Storage

The application now uses MongoDB Atlas instead of local file storage. The old file-based storage system is still available in `lib/storage.ts` for reference.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB Atlas connection string | Yes |
| `MONGODB_DB_NAME` | Database name (default: gradpath) | No |
| `JWT_SECRET` | Secret for JWT tokens | No |
| `NEXTAUTH_URL` | NextAuth.js URL | No |
| `NEXTAUTH_SECRET` | NextAuth.js secret | No |

## Development

- **Database**: MongoDB Atlas (cloud)
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui

## Production Deployment

1. Set up environment variables in your hosting platform
2. Ensure MongoDB Atlas network access includes your production IP
3. Consider implementing password hashing for security
4. Add proper error handling and logging

## Security Notes

- Passwords are currently stored in plain text (should be hashed in production)
- Consider implementing JWT tokens for session management
- Add rate limiting for API endpoints
- Implement proper input validation and sanitization 