# GradPath Backend

This is the FastAPI backend for the GradPath application, providing the chatbot functionality that integrates with MongoDB and uses LangChain with OpenAI.

## Setup

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Get OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create an account and get your API key
3. Add it to your `.env` file

## Running the Backend

### Option 1: Use the startup script (Recommended)
```bash
python start_backend.py
```

This will:
- Set up the database with sample data
- Start the FastAPI server on port 8000

### Option 2: Manual setup
```bash
# Set up database
python backend/update_user_model.py
python backend/sample_data.py

# Start server
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## API Endpoints

### POST /chatbot
Accepts a JSON body with:
- `message` (string): The student's chat input
- `user_id` (string): The student's user ID

Returns:
```json
{
  "response": "The chatbot's reply"
}
```

## Database Collections

### users
- `_id`: ObjectId
- `email`: string
- `password`: string (hashed)
- `role`: "student" | "advisor"
- `gpa`: float (default: 0.0)
- `completed_courses`: array of strings

### courses
- `code`: string (e.g., "CS101")
- `title`: string
- `prerequisites`: array of strings
- `min_gpa`: float
- `credit_hours`: int
- `offered_this_semester`: boolean

### rules
- `title`: string
- `description`: string
- `type`: string
- `value`: mixed

## Features

- **Dynamic Chatbot**: Uses LangChain with OpenAI to provide intelligent responses
- **Student Context**: Includes student's GPA, completed courses, and academic history
- **Course Information**: Provides detailed course information including prerequisites and requirements
- **University Rules**: Incorporates university policies and academic rules
- **Real-time Responses**: Fast, contextual responses based on the student's academic profile 