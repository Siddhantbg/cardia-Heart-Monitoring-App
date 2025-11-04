#!/usr/bin/env python3
"""
Test script for LLM service
Tests the explain endpoint with sample medical data
"""

import requests
import json
import time

def test_llm_health():
    """Test if LLM service is running"""
    print("🏥 Testing LLM Service Health...")
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            print("✅ LLM service is healthy!")
            return True
        else:
            print(f"❌ LLM service returned status {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ LLM service is not reachable: {e}")
        return False

def test_llm_explanation():
    """Test explanation generation"""
    print("\n🤖 Testing Explanation Generation...")
    
    # Sample medical data
    test_data = {
        "inputs": {
            "age": 45,
            "sex": "Male",
            "chestPainType": "Typical Angina",
            "restingBP": 130,
            "cholesterol": 250,
            "fastingBS": True,
            "maxHeartRate": 150,
            "exerciseAngina": False
        },
        "prediction": {
            "risk": 0.613,
            "riskLevel": "Moderate",
            "confidence": 0.89,
            "usingONNX": True
        }
    }
    
    print(f"📤 Sending request with {test_data['inputs']['age']}-year-old male...")
    print(f"   Risk: {test_data['prediction']['risk']*100:.1f}%")
    
    try:
        start_time = time.time()
        response = requests.post(
            "http://localhost:8000/explain",
            json=test_data,
            timeout=120  # 2 minutes for model inference
        )
        elapsed = time.time() - start_time
        
        if response.status_code == 200:
            print(f"✅ Explanation generated in {elapsed:.1f} seconds")
            
            result = response.json()
            print("\n📋 Response Structure:")
            print(f"   - Explanation: {len(result.get('explanation', ''))} characters")
            print(f"   - Key Factors: {len(result.get('key_factors', []))} items")
            print(f"   - Recommendations: {len(result.get('recommendations', []))} items")
            print(f"   - Summary: {len(result.get('summary', ''))} characters")
            
            print("\n📝 Sample Output:")
            print(f"   Explanation: {result.get('explanation', 'N/A')[:100]}...")
            if result.get('key_factors'):
                print(f"   First Factor: {result['key_factors'][0]}")
            if result.get('recommendations'):
                print(f"   First Recommendation: {result['recommendations'][0]}")
            
            return True
        else:
            print(f"❌ Request failed with status {response.status_code}")
            print(f"   Error: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print(f"❌ Request timed out after 120 seconds")
        print("   Note: First request takes longer as model loads into memory")
        return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
        return False

def test_backend_integration():
    """Test backend /explain endpoint"""
    print("\n🔗 Testing Backend Integration...")
    
    test_data = {
        "inputs": {
            "age": 55,
            "sex": "Female",
            "chestPainType": "Atypical Angina",
            "restingBP": 140,
            "cholesterol": 280,
            "fastingBS": False,
            "maxHeartRate": 145,
            "exerciseAngina": True
        },
        "prediction": {
            "risk": 0.782,
            "riskLevel": "High",
            "confidence": 0.91,
            "usingONNX": True
        }
    }
    
    try:
        response = requests.post(
            "http://localhost:5000/explain",
            json=test_data,
            timeout=120
        )
        
        if response.status_code == 200:
            print("✅ Backend integration working!")
            result = response.json()
            print(f"   Cached: {result.get('cached', False)}")
            return True
        else:
            print(f"❌ Backend returned status {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Backend not reachable: {e}")
        return False

def main():
    print("=" * 60)
    print("🧪 Cardia LLM Integration Test Suite")
    print("=" * 60)
    
    # Test 1: Health check
    health_ok = test_llm_health()
    
    if not health_ok:
        print("\n❌ LLM service is not running. Please start it with:")
        print("   cd llm-service && python main.py")
        return
    
    # Test 2: Direct LLM service
    llm_ok = test_llm_explanation()
    
    # Test 3: Backend integration
    backend_ok = test_backend_integration()
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Test Summary")
    print("=" * 60)
    print(f"   Health Check: {'✅' if health_ok else '❌'}")
    print(f"   LLM Service: {'✅' if llm_ok else '❌'}")
    print(f"   Backend Integration: {'✅' if backend_ok else '❌'}")
    
    if health_ok and llm_ok and backend_ok:
        print("\n🎉 All tests passed! LLM integration is working correctly.")
    else:
        print("\n⚠️  Some tests failed. Check the error messages above.")

if __name__ == "__main__":
    main()
