#!/usr/bin/env python3
"""
Quick test script for Post-Harvest Field Validation System
Tests the agricultural field detection before recommendations
"""

import asyncio
import httpx
import base64
from pathlib import Path

# Configuration
API_BASE = "http://localhost:8000/api/post-harvest"
TEST_IMAGES = {
    "rice_field": None,  # Replace with path to rice field image
    "non_agricultural": None,  # Replace with path to non-agricultural image
}

async def test_field_validation():
    """Test field validation endpoint"""
    print("=" * 60)
    print("POST-HARVEST FIELD VALIDATION TEST SUITE")
    print("=" * 60)
    
    # Test 1: Validate a file path
    test_image_path = Path("test_image.jpg")
    if not test_image_path.exists():
        print("\n⚠️  No test image found. Create 'test_image.jpg' in project root.")
        print("   Usage: Place your test images in the project root directory")
        return
    
    async with httpx.AsyncClient() as client:
        print("\n1️⃣  Testing Field Validation Endpoint")
        print("-" * 60)
        
        try:
            with open(test_image_path, "rb") as f:
                files = {"file": ("test_image.jpg", f, "image/jpeg")}
                data = {"crop": "Rice"}
                
                response = await client.post(
                    f"{API_BASE}/validate-field",
                    files=files,
                    data=data
                )
                
                result = response.json()
                
                print(f"Status Code: {response.status_code}")
                print(f"Response: {result}")
                
                # Display in user-friendly format
                if result.get("valid"):
                    print("\n✅ VALIDATION PASSED")
                    print(f"   Field Type: {result.get('field_type')}")
                    print(f"   Detected Crops: {', '.join(result.get('detected_crops', []))}")
                    print(f"   Confidence: {result.get('confidence', 0):.0%}")
                else:
                    print("\n❌ VALIDATION FAILED")
                    print(f"   Error: {result.get('error')}")
                    print(f"   Recommendation: {result.get('recommendation')}")
                    print(f"   Confidence: {result.get('confidence', 0):.0%}")
                
        except httpx.ConnectError:
            print("❌ Cannot connect to API. Is the server running?")
            print("   Run: python main.py (in backend_fastapi directory)")
        except Exception as e:
            print(f"❌ Test failed: {e}")

async def test_image_analysis():
    """Test image analysis with automatic validation"""
    print("\n2️⃣  Testing Image Analysis (with auto-validation)")
    print("-" * 60)
    
    test_image_path = Path("test_image.jpg")
    if not test_image_path.exists():
        print("⚠️  No test image found.")
        return
    
    async with httpx.AsyncClient() as client:
        try:
            with open(test_image_path, "rb") as f:
                files = {"file": ("test_image.jpg", f, "image/jpeg")}
                data = {"crop": "Rice"}
                
                # Test check-readiness endpoint
                response = await client.post(
                    f"{API_BASE}/check-readiness",
                    files=files,
                    data=data
                )
                
                result = response.json()
                
                if result.get("valid", False):
                    print("✅ Analysis completed successfully")
                    print(f"   Status: {result.get('status')}")
                    print(f"   Confidence: {result.get('confidence'):.0%}")
                    print(f"   Analysis: {result.get('analysis')}")
                else:
                    print("❌ Validation failed before analysis")
                    print(f"   Error: {result.get('error')}")
                
        except Exception as e:
            print(f"❌ Analysis test failed: {e}")

async def test_endpoints():
    """Test all available endpoints"""
    print("\n3️⃣  Available Endpoints")
    print("-" * 60)
    
    endpoints = [
        ("POST", "/validate-field", "Validates if image is agricultural field"),
        ("POST", "/check-readiness", "Checks harvest readiness (with validation)"),
        ("POST", "/grade-quality", "Grades produce quality (with validation)"),
        ("POST", "/detect-damage", "Detects damage (with validation)"),
        ("POST", "/detect-spoilage", "Detects spoilage (with validation)"),
        ("POST", "/detect-phase", "Detects post-harvest phase (with validation)"),
        ("GET", "/harvesting-guidance", "Get harvesting guidance for crop"),
        ("GET", "/cleaning-sorting", "Get cleaning & sorting guidance"),
        ("GET", "/drying-curing", "Get drying/curing guidance"),
        ("GET", "/storage-specs", "Get storage recommendations"),
        ("GET", "/packaging-guidance", "Get packaging guidance"),
        ("GET", "/transport-guidance", "Get transport guidance"),
        ("GET", "/shelf-life", "Get shelf life prediction"),
        ("GET", "/market-decision", "Get market decision"),
    ]
    
    for method, endpoint, description in endpoints:
        print(f"   {method:4} {endpoint:25} - {description}")

async def main():
    """Run all tests"""
    await test_field_validation()
    await test_image_analysis()
    await test_endpoints()
    
    print("\n" + "=" * 60)
    print("TESTING GUIDE")
    print("=" * 60)
    print("""
1. Prepare Test Images:
   - Place a crop field image as 'test_image.jpg' in project root
   - Or modify TEST_IMAGES dict in this script

2. Start the Backend:
   cd backend_fastapi
   python main.py

3. Run this Test Script:
   python test_post_harvest.py

4. Check Results:
   ✅ Green results = validation working
   ❌ Red results = check backend logs

5. What to Expect:
   - Agricultural field images: PASS validation
   - Non-agricultural images: FAIL validation with reason
   - Crop mismatch: FAIL validation with detected crop
   - All failures show helpful recommendation
    """)

if __name__ == "__main__":
    asyncio.run(main())
