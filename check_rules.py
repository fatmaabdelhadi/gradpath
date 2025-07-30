#!/usr/bin/env python3

import asyncio
import motor.motor_asyncio
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def check_rules():
    # Connect to MongoDB
    client = motor.motor_asyncio.AsyncIOMotorClient(os.getenv("MONGODB_URI"))
    db = client.gradpath
    
    try:
        # Get all rules from the database
        rules = await db.rules.find({}).to_list(length=None)
        
        print(f"Found {len(rules)} rules in the database:")
        print("-" * 50)
        
        for i, rule in enumerate(rules, 1):
            print(f"{i}. Title: {rule.get('title', 'N/A')}")
            print(f"   Description: {rule.get('description', 'N/A')}")
            print(f"   Category: {rule.get('category', 'N/A')}")
            print(f"   ID: {rule.get('_id', 'N/A')}")
            print()
        
        if not rules:
            print("No rules found in the database.")
            
    except Exception as e:
        print(f"Error checking rules: {str(e)}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(check_rules()) 