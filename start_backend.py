#!/usr/bin/env python3
"""
Startup script for GradPath Backend
This script will:
1. Update user models with GPA and completed courses
2. Create sample data for courses and rules
3. Start the FastAPI server
"""

import asyncio
import subprocess
import sys
import os
from pathlib import Path

# Add backend directory to Python path
backend_dir = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_dir))

async def setup_database():
    """Set up the database with sample data"""
    print("Setting up database...")
    
    # Import the setup functions
    from update_user_model import update_user_model
    from sample_data import create_sample_data
    
    try:
        # Update user models
        await update_user_model()
        
        # Create sample data
        await create_sample_data()
        
        print("✅ Database setup completed!")
        
    except Exception as e:
        print(f"❌ Error setting up database: {e}")
        return False
    
    return True

def start_fastapi_server():
    """Start the FastAPI server"""
    print("Starting FastAPI server...")
    
    # Change to backend directory
    os.chdir("backend")
    
    # Start the server
    try:
        subprocess.run([
            sys.executable, "-m", "uvicorn", 
            "main:app", 
            "--host", "0.0.0.0", 
            "--port", "8000",
            "--reload"
        ], check=True)
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Error starting server: {e}")

async def main():
    """Main function"""
    print("🚀 Starting GradPath Backend...")
    
    # Set up database
    success = await setup_database()
    if not success:
        print("❌ Failed to set up database. Exiting.")
        return
    
    # Start server
    start_fastapi_server()

if __name__ == "__main__":
    asyncio.run(main()) 