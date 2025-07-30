import asyncio
import motor.motor_asyncio
import os
from dotenv import load_dotenv

load_dotenv()

async def check_users():
    client = motor.motor_asyncio.AsyncIOMotorClient(os.getenv('MONGODB_URI'))
    db = client.gradpath
    
    users = await db.users.find({}).to_list(length=None)
    print("Users in database:")
    for user in users:
        print(f"- Email: {user.get('email')}, ID: {user['_id']}, Role: {user.get('role')}")

if __name__ == "__main__":
    asyncio.run(check_users()) 