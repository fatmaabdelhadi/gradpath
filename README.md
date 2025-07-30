# GradPath UI

A unified interface for students and advisors/TA with role-based authentication and MongoDB Atlas integration.

## Features

- **Role-based Authentication**: Students and Advisors/TA have separate interfaces
- **MongoDB Atlas Integration**: Cloud database for user management
- **Modern UI**: Built with Next.js, TypeScript, and Tailwind CSS
- **File-based to Database Migration**: Easy transition from local storage to cloud database


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
