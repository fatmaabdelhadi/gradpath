import asyncio
import fitz  # PyMuPDF
import json
import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage

load_dotenv()

async def debug_pdf_parsing():
    """Debug PDF parsing and OpenAI extraction"""
    
    # Test with the text file content
    test_content = """
    Course Rules for Computer Science Department

    CS101: Introduction to Programming
    - Prerequisites: None
    - Minimum GPA: 0.0
    - Offered this semester: Yes
    - Credit Hours: 3

    CS102: Data Structures
    - Prerequisites: CS101
    - Minimum GPA: 2.0
    - Offered this semester: Yes
    - Credit Hours: 3

    CS201: Algorithms
    - Prerequisites: CS102
    - Minimum GPA: 2.5
    - Offered this semester: Yes
    - Credit Hours: 3

    CS301: Database Systems
    - Prerequisites: CS201, CS204
    - Minimum GPA: 3.0
    - Offered this semester: No
    - Credit Hours: 3

    CS305: Software Engineering
    - Prerequisites: CS201
    - Minimum GPA: 2.8
    - Offered this semester: Yes
    - Credit Hours: 3
    """
    
    print("=== EXTRACTED TEXT ===")
    print(test_content)
    print("\n" + "="*50 + "\n")
    
    # Test OpenAI parsing
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        print("❌ OPENAI_API_KEY not found in environment")
        return
    
    chat_model = ChatOpenAI(
        api_key=openai_api_key,
        model_name="gpt-3.5-turbo",
        temperature=0.7
    )
    
    prompt = f"""
    Extract course rule information from the following academic document text. 
    Return the data in a valid JSON array format with the following structure for each course:
    
    {{
        "code": "course code (e.g., CS301)",
        "title": "course title",
        "prerequisites": ["list", "of", "prerequisite", "course codes"],
        "min_gpa": float_value,
        "offered_this_semester": boolean
    }}
    
    Rules:
    1. If no prerequisites, use empty array []
    2. If min_gpa is not specified, use 0.0
    3. If offered_this_semester is not specified, use true
    4. Return only valid JSON array, no additional text
    5. If no course rules found, return empty array []
    
    Document text:
    {test_content}
    
    Return only the JSON array:
    """
    
    print("=== SENDING TO OPENAI ===")
    print(prompt)
    print("\n" + "="*50 + "\n")
    
    try:
        messages = [
            SystemMessage(content="You are a helpful assistant that extracts course rule information from academic documents. Return only valid JSON arrays."),
            HumanMessage(content=prompt)
        ]
        
        response = await chat_model.ainvoke(messages)
        response_text = response.content.strip()
        
        print("=== OPENAI RESPONSE ===")
        print(response_text)
        print("\n" + "="*50 + "\n")
        
        # Try to parse the JSON response
        try:
            # Clean the response to extract just the JSON
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            
            print("=== CLEANED RESPONSE ===")
            print(response_text)
            print("\n" + "="*50 + "\n")
            
            parsed_data = json.loads(response_text)
            
            print("=== PARSED DATA ===")
            print(json.dumps(parsed_data, indent=2))
            print(f"\nNumber of rules found: {len(parsed_data)}")
            
        except (json.JSONDecodeError, ValueError, KeyError) as e:
            print(f"❌ JSON parsing error: {str(e)}")
            
    except Exception as e:
        print(f"❌ OpenAI error: {str(e)}")

if __name__ == "__main__":
    asyncio.run(debug_pdf_parsing()) 