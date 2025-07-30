import motor.motor_asyncio
import os
from dotenv import load_dotenv

load_dotenv()

# MongoDB connection
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb+srv://fatmaabdelhadi:y3may7aga@cluster0.fyg5esd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URI)
db = client.gradpath

async def create_sample_data():
    """Create sample courses and rules data"""
    try:
        # Sample courses
        courses = [
            {
                "code": "CS101",
                "title": "Introduction to Programming",
                "prerequisites": [],
                "min_gpa": 0.0,
                "credit_hours": 3,
                "offered_this_semester": True
            },
            {
                "code": "CS102",
                "title": "Data Structures",
                "prerequisites": ["CS101"],
                "min_gpa": 2.0,
                "credit_hours": 3,
                "offered_this_semester": True
            },
            {
                "code": "CS201",
                "title": "Algorithms",
                "prerequisites": ["CS102"],
                "min_gpa": 2.5,
                "credit_hours": 3,
                "offered_this_semester": True
            },
            {
                "code": "CS204",
                "title": "Operating Systems",
                "prerequisites": ["CS101"],
                "min_gpa": 2.0,
                "credit_hours": 3,
                "offered_this_semester": True
            },
            {
                "code": "CS301",
                "title": "Database Systems",
                "prerequisites": ["CS201", "CS204"],
                "min_gpa": 3.0,
                "credit_hours": 3,
                "offered_this_semester": False
            },
            {
                "code": "CS305",
                "title": "Software Engineering",
                "prerequisites": ["CS201"],
                "min_gpa": 2.8,
                "credit_hours": 3,
                "offered_this_semester": True
            },
            {
                "code": "CS310",
                "title": "Computer Networks",
                "prerequisites": ["CS204"],
                "min_gpa": 2.5,
                "credit_hours": 3,
                "offered_this_semester": True
            }
        ]
        
        # Sample rules
        rules = [
            {
                "title": "Maximum Credit Hours",
                "description": "Students can register for a maximum of 18 credit hours per semester",
                "type": "credit_limit",
                "value": 18
            },
            {
                "title": "Minimum GPA for Registration",
                "description": "Students must maintain a minimum GPA of 2.0 to register for courses",
                "type": "gpa_requirement",
                "value": 2.0
            },
            {
                "title": "Prerequisite Enforcement",
                "description": "All course prerequisites must be completed with a grade of C or better",
                "type": "prerequisite",
                "value": "C"
            },
            {
                "title": "Academic Probation",
                "description": "Students with GPA below 2.0 are placed on academic probation and limited to 12 credit hours",
                "type": "probation",
                "value": 12
            }
        ]
        
        # Clear existing data
        await db.courses.delete_many({})
        await db.rules.delete_many({})
        
        # Insert sample data
        await db.courses.insert_many(courses)
        await db.rules.insert_many(rules)
        
        print(f"Created {len(courses)} sample courses")
        print(f"Created {len(rules)} sample rules")
        print("Sample data created successfully!")
        
    except Exception as e:
        print(f"Error creating sample data: {str(e)}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(create_sample_data()) 