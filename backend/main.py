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

@app.get("/")
async def root():
    return {"message": "GradPath Chatbot API"}

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
        
        # Create prompt for OpenAI to extract ONLY student rules and restrictions
        prompt = f"""
        Extract ONLY specific rules about what students CAN and CANNOT do from the following academic document text.
        Focus ONLY on rules that directly tell students what they are allowed or not allowed to do.
        
        Return the data in a valid JSON array format with the following structure for each rule:
        
        {{
            "title": "brief rule title",
            "description": "the specific rule about what students can/cannot do",
            "category": "prerequisites|probation|gpa|registration|advising|other"
        }}
        
        ONLY extract rules that contain phrases like:
        - "students CANNOT..." or "students CAN NOT..."
        - "students are NOT allowed to..."
        - "students MUST..." or "students HAVE TO..."
        - "students can add up to..." or "students can take..."
        - "if student fails..." then "they must..."
        - "students with GPA..." then specific restrictions
        - "students are eligible for..." or "students are not eligible for..."
        
        IGNORE:
        - Course listings and schedules
        - Contact information and office details
        - General descriptions and explanations
        - Procedural steps that don't contain restrictions
        - Course codes and credit hours
        - General advising information without specific rules
        
        Focus ONLY on rules that directly restrict or permit student actions.
        
        Document text:
        {extracted_text}
        
        Return only the JSON array with student rules:
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 