import motor.motor_asyncio
import os
from dotenv import load_dotenv

load_dotenv()

# MongoDB connection
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb+srv://fatmaabdelhadi:y3may7aga@cluster0.fyg5esd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URI)
db = client.gradpath

async def update_user_model():
    """Update existing users to include GPA and completed courses"""
    try:
        # Update all existing users to include GPA and completed courses
        result = await db.users.update_many(
            {},
            {
                "$set": {
                    "gpa": 0.0,
                    "completed_courses": []
                }
            }
        )
        print(f"Updated {result.modified_count} users with GPA and completed courses fields")
        
        # Create sample data for testing
        sample_student = {
            "email": "student@gradpath.edu",
            "password": "password123",
            "role": "student",
            "gpa": 3.2,
            "completed_courses": ["CS101", "CS102"]
        }
        
        # Insert sample student if it doesn't exist
        existing = await db.users.find_one({"email": sample_student["email"]})
        if not existing:
            await db.users.insert_one(sample_student)
            print("Added sample student data")
        
        print("User model update completed successfully!")
        
    except Exception as e:
        print(f"Error updating user model: {str(e)}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(update_user_model()) 