#!/usr/bin/env python3
"""
Test script to verify Python dependencies are properly installed
"""

import sys
import importlib

def test_import(module_name, package_name=None):
    """Test if a module can be imported"""
    try:
        importlib.import_module(module_name)
        print(f"✅ {package_name or module_name}")
        return True
    except ImportError as e:
        print(f"❌ {package_name or module_name}: {e}")
        return False

def main():
    print("🔍 Testing Python dependencies...")
    print("=" * 50)
    
    # Core dependencies
    core_deps = [
        ("dotenv", "python-dotenv"),
        ("requests", "requests"),
        ("pydantic", "pydantic"),
    ]
    
    # AI/ML dependencies
    ai_deps = [
        ("openai", "openai"),
        ("langchain", "langchain"),
        ("langchain_openai", "langchain-openai"),
        ("numpy", "numpy"),
        ("pandas", "pandas"),
    ]
    
    # Database dependencies
    db_deps = [
        ("pymongo", "pymongo"),
        ("motor", "motor"),
        ("beanie", "beanie"),
    ]
    
    # Web framework dependencies
    web_deps = [
        ("fastapi", "fastapi"),
        ("uvicorn", "uvicorn"),
    ]
    
    # Utility dependencies
    util_deps = [
        ("multipart", "python-multipart"),
        ("httpx", "httpx"),
        ("aiofiles", "aiofiles"),
    ]
    
    # Development dependencies
    dev_deps = [
        ("pytest", "pytest"),
        ("black", "black"),
        ("flake8", "flake8"),
    ]
    
    print("\n📦 Core Dependencies:")
    core_success = all(test_import(module, package) for module, package in core_deps)
    
    print("\n🤖 AI/ML Dependencies:")
    ai_success = all(test_import(module, package) for module, package in ai_deps)
    
    print("\n🗄️ Database Dependencies:")
    db_success = all(test_import(module, package) for module, package in db_deps)
    
    print("\n🌐 Web Framework Dependencies:")
    web_success = all(test_import(module, package) for module, package in web_deps)
    
    print("\n🔧 Utility Dependencies:")
    util_success = all(test_import(module, package) for module, package in util_deps)
    
    print("\n🛠️ Development Dependencies:")
    dev_success = all(test_import(module, package) for module, package in dev_deps)
    
    print("\n" + "=" * 50)
    
    total_success = core_success and ai_success and db_success and web_success and util_success and dev_success
    
    if total_success:
        print("🎉 All Python dependencies are properly installed!")
        print("\n📋 Summary:")
        print("- Core dependencies: ✅")
        print("- AI/ML dependencies: ✅")
        print("- Database dependencies: ✅")
        print("- Web framework dependencies: ✅")
        print("- Utility dependencies: ✅")
        print("- Development dependencies: ✅")
    else:
        print("❌ Some dependencies failed to import.")
        print("\n🔧 To fix missing dependencies, run:")
        print("pip install -r requirements.txt")
    
    return 0 if total_success else 1

if __name__ == "__main__":
    sys.exit(main())
