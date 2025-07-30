from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import motor.motor_asyncio
from bson import ObjectId
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
import os
import fitz  # PyMuPDF
import json
from dotenv import load_dotenv
from bson.errors import InvalidId

load_dotenv()

app = FastAPI(title="GradPath Chatbot API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb+srv://fatmaabdelhadi:y3may7aga@cluster0.fyg5esd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URI)
db = client.gradpath

# OpenAI setup
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    raise ValueError("OPENAI_API_KEY environment variable is required")

chat_model = ChatOpenAI(
    api_key=openai_api_key,
    model_name="gpt-3.5-turbo",
    temperature=0.7
)

# Pydantic models
class ChatRequest(BaseModel):
    message: str
    user_id: str

class ChatResponse(BaseModel):
    response: str

class Course(BaseModel):
    code: str
    title: str
    prerequisites: List[str]
    min_gpa: float
    credit_hours: int
    offered_this_semester: bool

class Student(BaseModel):
    user_id: str
    email: str
    gpa: float
    completed_courses: List[str]

class CourseRule(BaseModel):
    code: str
    title: str
    prerequisites: List[str]
    min_gpa: float
    offered_this_semester: bool

class AcademicRule(BaseModel):
    title: str
    description: str
    category: str

class ParsedRulesResponse(BaseModel):
    rules: List[AcademicRule]
    message: str

class ParsedCoursesResponse(BaseModel):
    courses: List[CourseRule]
    message: str

class UpdateStudentRequest(BaseModel):
    gpa: Optional[float] = None
    completed_courses: Optional[List[str]] = None
    academic_standing: Optional[str] = None

class UpdatePasswordRequest(BaseModel):
    current_password: str
    new_password: str

@app.get("/")
async def root():
    return {"message": "GradPath Chatbot API"}

@app.get("/test")
async def test_endpoint():
    """
    Test endpoint to verify FastAPI is working.
    """
    return {"message": "Test endpoint working"}

@app.get("/courses")
async def get_courses():
    """
    Get all courses from the database.
    """
    try:
        courses = await db.courses.find({}).to_list(length=None)
        
        # Convert ObjectId to string for JSON serialization
        for course in courses:
            course["_id"] = str(course["_id"])
        
        return {
            "courses": courses,
            "count": len(courses)
        }
        
    except Exception as e:
        print(f"Error fetching courses: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/test-rules")
async def test_rules():
    """
    Test endpoint for rules.
    """
    return {"message": "Rules endpoint test"}

@app.get("/rules")
async def get_rules():
    """
    Get all rules from the database.
    """
    try:
        rules = await db.rules.find({}).to_list(length=None)
        
        # Convert ObjectId to string for JSON serialization
        for rule in rules:
            rule["_id"] = str(rule["_id"])
        
        return {
            "rules": rules,
            "count": len(rules)
        }
        
    except Exception as e:
        print(f"Error fetching rules: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.delete("/rules")
async def delete_rules(rule_ids: List[str]):
    """
    Delete rules by their IDs.
    """
    try:
        # Convert string IDs to ObjectId
        object_ids = [ObjectId(rule_id) for rule_id in rule_ids]
        
        # Delete rules from database
        result = await db.rules.delete_many({"_id": {"$in": object_ids}})
        
        return {
            "message": f"Successfully deleted {result.deleted_count} rules",
            "deleted_count": result.deleted_count
        }
        
    except Exception as e:
        print(f"Error deleting rules: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.delete("/courses")
async def delete_courses(course_ids: List[str]):
    """
    Delete courses by their IDs.
    """
    try:
        # Convert string IDs to ObjectId
        object_ids = [ObjectId(course_id) for course_id in course_ids]
        
        # Delete courses from database
        result = await db.courses.delete_many({"_id": {"$in": object_ids}})
        
        return {
            "message": f"Successfully deleted {result.deleted_count} courses",
            "deleted_count": result.deleted_count
        }
        
    except Exception as e:
        print(f"Error deleting courses: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/chatbot", response_model=ChatResponse)
async def chatbot(request: ChatRequest):
    try:
        # Get student data - try both ObjectId and string
        try:
            student = await db.users.find_one({"_id": ObjectId(request.user_id), "role": "student"})
        except:
            student = await db.users.find_one({"_id": request.user_id, "role": "student"})
        
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        
        # Get all courses
        courses_cursor = db.courses.find({})
        courses = await courses_cursor.to_list(length=None)
        
        # Get all rules
        rules_cursor = db.rules.find({})
        rules = await rules_cursor.to_list(length=None)
        
        # Extract student data (with defaults if not present)
        student_data = {
            "user_id": str(student["_id"]),
            "email": student.get("email", ""),
            "gpa": student.get("gpa", 0.0),
            "completed_courses": student.get("completed_courses", [])
        }
        
        # Create system prompt
        system_prompt = f"""You are an academic advisor bot for GradPath University. 

STUDENT INFORMATION:
- Student ID: {student_data['user_id']}
- Email: {student_data['email']}
- Current GPA: {student_data['gpa']}
- Completed Courses: {', '.join(student_data['completed_courses']) if student_data['completed_courses'] else 'None'}

AVAILABLE COURSES:
{chr(10).join([f"- {course['code']}: {course['title']} (Prerequisites: {', '.join(course.get('prerequisites', []))}, Min GPA: {course.get('min_gpa', 'None')}, Credit Hours: {course.get('credit_hours', 3)})" for course in courses])}

UNIVERSITY RULES:
{chr(10).join([f"- {rule['title']}: {rule['description']}" for rule in rules])}

Your role is to help students with:
1. Course registration advice
2. Prerequisite checking
3. GPA requirements
4. Academic planning
5. General academic questions

Provide helpful, encouraging, and accurate responses. If a student can't take a course, explain why and suggest alternatives. Always be supportive and educational in your tone.

Current student message: {request.message}"""

        # Create messages for the chat model
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=request.message)
        ]
        
        # Get response from OpenAI
        response = await chat_model.ainvoke(messages)
        
        return ChatResponse(response=response.content)
        
    except Exception as e:
        print(f"Error in chatbot endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/parse_rules_pdf", response_model=ParsedRulesResponse)
async def parse_rules_pdf(file: UploadFile = File(...)):
    """
    Parse a PDF file containing course rules and extract structured data.
    Returns the parsed rules for review before insertion into database.
    """
    try:
        print(f"DEBUG: Received file: {file.filename}")
        
        # Validate file type (allow PDF and text files for testing)
        if not file.filename.lower().endswith(('.pdf', '.txt')):
            raise HTTPException(status_code=400, detail="File must be a PDF or text file")
        
        # Read file content
        file_content = await file.read()
        print(f"DEBUG: File size: {len(file_content)} bytes")
        
        # Extract text from file
        if file.filename.lower().endswith('.pdf'):
            # Extract text from PDF using PyMuPDF
            doc = fitz.open(stream=file_content, filetype="pdf")
            extracted_text = ""
            
            for page in doc:
                extracted_text += page.get_text()
            
            doc.close()
        else:
            # For text files, just decode the content
            extracted_text = file_content.decode('utf-8')
        
        print(f"DEBUG: Extracted text length: {len(extracted_text)}")
        print(f"DEBUG: First 200 chars: {extracted_text[:200]}")
        
        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="No text content found in file")
        
        # Create prompt for OpenAI to extract academic rules and guidelines
        prompt = f"""
        Extract academic rules, guidelines, and policies from the following academic document text.
        Look for any rules, requirements, restrictions, or guidelines that students need to follow.
        
        Return the data in a valid JSON array format with the following structure for each rule:
        
        {{
            "title": "brief rule title",
            "description": "the specific rule, guideline, or requirement",
            "category": "prerequisites|probation|gpa|registration|advising|graduation|academic_standing|other"
        }}
        
        Look for rules and guidelines that contain:
        - Requirements students must meet
        - Restrictions on what students can/cannot do
        - Academic policies and procedures
        - Advising requirements and guidelines
        - Registration rules and deadlines
        - GPA requirements and academic standing rules
        - Graduation requirements
        - Course selection rules
        - Academic probation or suspension policies
        - Any "must", "should", "required", "not allowed", "eligible", "ineligible" statements
        
        Examples of what to extract:
        - "Students must meet with their advisor before registration"
        - "Students cannot register for more than 18 credit hours"
        - "Students with GPA below 2.0 are on academic probation"
        - "Students must complete prerequisites before taking advanced courses"
        - "Students are eligible for graduation after completing 120 credits"
        - "Students must attend advising sessions"
        - "Students cannot take courses without advisor approval"
        
        IGNORE:
        - Course listings and schedules
        - Contact information and office details
        - General descriptions without specific requirements
        - Course codes and credit hours (unless part of a rule)
        
        Focus on extracting any academic policies, requirements, or guidelines that students need to follow.
        
        Document text:
        {extracted_text}
        
        Return only the JSON array with academic rules:
        """
        
        print(f"DEBUG: Sending prompt to OpenAI...")
        
        # Use OpenAI to parse the text
        messages = [
            SystemMessage(content="You are a helpful assistant that extracts course rule information from academic documents. Return only valid JSON arrays."),
            HumanMessage(content=prompt)
        ]
        
        response = await chat_model.ainvoke(messages)
        response_text = response.content.strip()
        
        print(f"DEBUG: OpenAI response: {response_text}")
        
        # Try to parse the JSON response
        try:
            # Clean the response to extract just the JSON
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            
            parsed_data = json.loads(response_text)
            
            print(f"DEBUG: Parsed data: {parsed_data}")
            
            # Validate the structure
            if not isinstance(parsed_data, list):
                raise ValueError("Response must be a list")
            
            rules = []
            for item in parsed_data:
                if not isinstance(item, dict):
                    print(f"DEBUG: Skipping non-dict item: {item}")
                    continue
                
                # Validate required fields for academic rules
                if not all(key in item for key in ["title", "description", "category"]):
                    print(f"DEBUG: Skipping item missing required fields: {item}")
                    continue
                
                rule = AcademicRule(
                    title=item["title"],
                    description=item["description"],
                    category=item["category"]
                )
                rules.append(rule)
                print(f"DEBUG: Added rule: {rule}")
            
            print(f"DEBUG: Final rules count: {len(rules)}")
            
            return ParsedRulesResponse(
                rules=rules,
                message=f"Successfully parsed {len(rules)} academic rules from file"
            )
            
        except (json.JSONDecodeError, ValueError, KeyError) as e:
            print(f"DEBUG: JSON parsing error: {str(e)}")
            raise HTTPException(
                status_code=400, 
                detail=f"Failed to parse course rules from file: {str(e)}. Please ensure the file contains clear course information."
            )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error parsing file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/parse_courses_pdf", response_model=ParsedCoursesResponse)
async def parse_courses_pdf(file: UploadFile = File(...)):
    """
    Parse a PDF file containing course information and extract structured data.
    Returns the parsed courses for review before insertion into database.
    """
    try:
        print(f"DEBUG: Received file: {file.filename}")
        
        # Validate file type (allow PDF and text files for testing)
        if not file.filename.lower().endswith(('.pdf', '.txt')):
            raise HTTPException(status_code=400, detail="File must be a PDF or text file")
        
        # Read file content
        file_content = await file.read()
        print(f"DEBUG: File size: {len(file_content)} bytes")
        
        # Extract text from file
        if file.filename.lower().endswith('.pdf'):
            # Extract text from PDF using PyMuPDF
            doc = fitz.open(stream=file_content, filetype="pdf")
            extracted_text = ""
            
            for page in doc:
                extracted_text += page.get_text()
            
            doc.close()
        else:
            # For text files, just decode the content
            extracted_text = file_content.decode('utf-8')
        
        print(f"DEBUG: Extracted text length: {len(extracted_text)}")
        print(f"DEBUG: First 200 chars: {extracted_text[:200]}")
        
        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="No text content found in file")
        
        # Create prompt for OpenAI to extract course information
        prompt = f"""
        Extract course information from the following academic document text. 
        Look for course codes, names, credit hours, prerequisites, and any other course details.
        Return the data in a valid JSON array format with the following structure for each course:
        
        {{
            "code": "course code (e.g., INCS 101, MATH 101)",
            "title": "course title/name",
            "credit_hours": number,
            "prerequisites": ["list", "of", "prerequisite", "course codes"],
            "min_gpa": float_value,
            "offered_this_semester": boolean
        }}
        
        Rules:
        1. Look for course codes like "INCS 101", "MATH 101", "PHYS 101", etc.
        2. Extract the course name/title that follows the code
        3. Extract credit hours if mentioned (default to 3 if not specified)
        4. If prerequisites are mentioned, extract them (look for words like "prerequisite", "requires", "after")
        5. If no prerequisites mentioned, use empty array []
        6. If min_gpa is not specified, use 0.0
        7. If offered_this_semester is not specified, use true
        8. Return only valid JSON array, no additional text
        9. If no courses found, return empty array []
        10. Focus on courses with codes like INCS, MATH, PHYS, AE, AS, DE, SM, CPS, BUAD, HUMA
        
        Document text:
        {extracted_text}
        
        Return only the JSON array:
        """
        
        print(f"DEBUG: Sending prompt to OpenAI...")
        
        # Use OpenAI to parse the text
        messages = [
            SystemMessage(content="You are a helpful assistant that extracts course information from academic documents. Return only valid JSON arrays."),
            HumanMessage(content=prompt)
        ]
        
        response = await chat_model.ainvoke(messages)
        response_text = response.content.strip()
        
        print(f"DEBUG: OpenAI response: {response_text}")
        
        # Try to parse the JSON response
        try:
            # Clean the response to extract just the JSON
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            
            parsed_data = json.loads(response_text)
            
            print(f"DEBUG: Parsed data: {parsed_data}")
            
            # Validate the structure
            if not isinstance(parsed_data, list):
                raise ValueError("Response must be a list")
            
            courses = []
            for item in parsed_data:
                if not isinstance(item, dict):
                    print(f"DEBUG: Skipping non-dict item: {item}")
                    continue
                
                # Validate required fields for courses
                if not all(key in item for key in ["code", "title"]):
                    print(f"DEBUG: Skipping item missing required fields: {item}")
                    continue
                
                course = CourseRule(
                    code=item["code"],
                    title=item["title"],
                    prerequisites=item.get("prerequisites", []),
                    min_gpa=float(item.get("min_gpa", 0.0)),
                    offered_this_semester=bool(item.get("offered_this_semester", True))
                )
                courses.append(course)
                print(f"DEBUG: Added course: {course}")
            
            print(f"DEBUG: Final courses count: {len(courses)}")
            
            return ParsedCoursesResponse(
                courses=courses,
                message=f"Successfully parsed {len(courses)} courses from file"
            )
            
        except (json.JSONDecodeError, ValueError, KeyError) as e:
            print(f"DEBUG: JSON parsing error: {str(e)}")
            raise HTTPException(
                status_code=400, 
                detail=f"Failed to parse courses from file: {str(e)}. Please ensure the file contains clear course information."
            )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error parsing file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/test_parse_text")
async def test_parse_text(content: dict):
    """
    Test endpoint to parse text content directly (for debugging)
    """
    try:
        # Create prompt for OpenAI to extract course rules
        prompt = f"""
        Extract course information from the following academic document text. 
        Look for course codes, names, and any prerequisites mentioned.
        Return the data in a valid JSON array format with the following structure for each course:
        
        {{
            "code": "course code (e.g., INCS 101, MATH 101)",
            "title": "course title/name",
            "prerequisites": ["list", "of", "prerequisite", "course codes"],
            "min_gpa": float_value,
            "offered_this_semester": boolean
        }}
        
        Rules:
        1. Look for course codes like "INCS 101", "MATH 101", "PHYS 101", etc.
        2. Extract the course name/title that follows the code
        3. If prerequisites are mentioned, extract them (look for words like "prerequisite", "requires", "after")
        4. If no prerequisites mentioned, use empty array []
        5. If min_gpa is not specified, use 0.0
        6. If offered_this_semester is not specified, use true
        7. Return only valid JSON array, no additional text
        8. If no course rules found, return empty array []
        9. Focus on courses with codes like INCS, MATH, PHYS, AE, AS, DE, SM, CPS, BUAD, HUMA
        
        Document text:
        {content}
        
        Return only the JSON array:
        """
        
        # Use OpenAI to parse the text
        messages = [
            SystemMessage(content="You are a helpful assistant that extracts course rule information from academic documents. Return only valid JSON arrays."),
            HumanMessage(content=prompt)
        ]
        
        response = await chat_model.ainvoke(messages)
        response_text = response.content.strip()
        
        print(f"DEBUG: OpenAI response: {response_text}")
        
        # Try to parse the JSON response
        try:
            # Clean the response to extract just the JSON
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            
            parsed_data = json.loads(response_text)
            
            # Validate the structure
            if not isinstance(parsed_data, list):
                raise ValueError("Response must be a list")
            
            rules = []
            for item in parsed_data:
                if not isinstance(item, dict):
                    continue
                
                # Validate required fields
                if not all(key in item for key in ["code", "title"]):
                    continue
                
                rule = AcademicRule(
                    title=item["title"],
                    description=item["description"],
                    category=item.get("category", "other")
                )
                rules.append(rule)
            
            return ParsedRulesResponse(
                rules=rules,
                message=f"Successfully parsed {len(rules)} course rules from text"
            )
            
        except (json.JSONDecodeError, ValueError, KeyError) as e:
            raise HTTPException(
                status_code=400, 
                detail=f"Failed to parse course rules from text: {str(e)}"
            )
        
    except Exception as e:
        print(f"Error parsing text: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/confirm_rules")
async def confirm_rules(rules: List[AcademicRule]):
    """
    Insert the confirmed rules into the database.
    """
    try:
        # Convert Pydantic models to dictionaries
        rules_data = [rule.dict() for rule in rules]
        
        # Insert into MongoDB
        result = await db.rules.insert_many(rules_data)
        
        return {
            "message": f"Successfully added {len(rules)} rules to database",
            "inserted_ids": [str(id) for id in result.inserted_ids]
        }
        
    except Exception as e:
        print(f"Error inserting rules: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/confirm_courses")
async def confirm_courses(courses: List[CourseRule]):
    """
    Insert the confirmed courses into the database.
    """
    try:
        # Convert Pydantic models to dictionaries
        courses_data = [course.dict() for course in courses]
        
        # Insert into MongoDB
        result = await db.courses.insert_many(courses_data)
        
        return {
            "message": f"Successfully added {len(courses)} courses to database",
            "inserted_ids": [str(id) for id in result.inserted_ids]
        }
        
    except Exception as e:
        print(f"Error inserting courses: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.put("/students/{user_id}")
async def update_student(user_id: str, request: UpdateStudentRequest):
    """
    Update student information including GPA, completed courses, and academic standing.
    """
    try:
        # Convert string user_id to ObjectId if possible
        try:
            object_id = ObjectId(user_id)
        except InvalidId:
            # If not a valid ObjectId, try to find by email
            user = await db.users.find_one({"email": user_id})
            if not user:
                raise HTTPException(status_code=404, detail="Student not found")
            object_id = user["_id"]
        
        # Build update data
        update_data = {}
        if request.gpa is not None:
            update_data["gpa"] = request.gpa
        if request.completed_courses is not None:
            # Remove duplicates from completed_courses
            unique_courses = list(dict.fromkeys(request.completed_courses))
            update_data["completed_courses"] = unique_courses
        if request.academic_standing is not None:
            update_data["academic_standing"] = request.academic_standing
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No data provided for update")
        
        # Update the user
        result = await db.users.update_one(
            {"_id": object_id, "role": "student"},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Student not found")
        
        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail="No changes made")
        
        return {"message": "Student information updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating student: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/students/{user_id}")
async def get_student(user_id: str):
    """
    Get student information including GPA, completed courses, and academic standing.
    """
    try:
        # Convert string user_id to ObjectId if possible
        try:
            object_id = ObjectId(user_id)
        except InvalidId:
            # If not a valid ObjectId, try to find by email
            user = await db.users.find_one({"email": user_id})
            if not user:
                raise HTTPException(status_code=404, detail="Student not found")
            object_id = user["_id"]
        
        # Get the student
        student = await db.users.find_one({"_id": object_id, "role": "student"})
        
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        
        # Convert ObjectId to string for JSON serialization
        student["_id"] = str(student["_id"])
        
        return {
            "student": {
                "id": student["_id"],
                "email": student["email"],
                "role": student["role"],
                "gpa": student.get("gpa", 0.0),
                "completed_courses": student.get("completed_courses", []),
                "academic_standing": student.get("academic_standing", "good")
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting student: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.put("/users/{user_id}/password")
async def update_password(user_id: str, request: UpdatePasswordRequest):
    """
    Update user password.
    """
    try:
        # Convert string user_id to ObjectId if possible
        try:
            object_id = ObjectId(user_id)
        except InvalidId:
            # If not a valid ObjectId, try to find by email
            user = await db.users.find_one({"email": user_id})
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            object_id = user["_id"]
        
        # Get the user
        user = await db.users.find_one({"_id": object_id})
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if current password matches
        if user.get("password") != request.current_password:
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        
        # Update the password
        result = await db.users.update_one(
            {"_id": object_id},
            {"$set": {"password": request.new_password}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail="No changes made")
        
        return {"message": "Password updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating password: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 