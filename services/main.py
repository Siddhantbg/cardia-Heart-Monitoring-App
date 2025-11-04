from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, Optional, Any, List
from llama_cpp import Llama
import logging
import time
from datetime import datetime
from pathlib import Path

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI(title="Cardia LLM Service", version="2.0.0")

app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5000", "http://localhost:5173"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

MODEL_PATH = Path(__file__).parent.parent / "server" / "models" / "deepseek-coder-1.3b-instruct.Q4_K_M.gguf"
llm = None
model_loaded = False

class ExplainRequest(BaseModel):
    prompt: Optional[str] = None  # Phase 4: Accept pre-built contextual prompt
    inputs: Optional[Dict[str, Any]] = None
    prediction: Optional[Dict[str, Any]] = None
    include_recommendations: Optional[bool] = True
    max_length: Optional[int] = 400

class ExplainResponse(BaseModel):
    explanation: str
    key_factors: List[str]
    recommendations: List[str]
    summary: str
    processing_time: float
    model_used: str

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_name: str
    model_path: str
    timestamp: str

@app.on_event("startup")
async def load_model():
    global llm, model_loaded
    try:
        logger.info(f"Loading DeepSeek from: {MODEL_PATH}")
        if not MODEL_PATH.exists():
            logger.error(f"Model not found: {MODEL_PATH}")
            return
        llm = Llama(model_path=str(MODEL_PATH), n_ctx=2048, n_threads=4, n_gpu_layers=0, verbose=False)
        model_loaded = True
        logger.info("Model loaded successfully")
    except Exception as e:
        logger.error(f"Failed to load: {e}")

@app.get("/")
async def root():
    return {"service": "Cardia LLM", "model": "DeepSeek 1.3B", "status": "running" if model_loaded else "not loaded"}

@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(status="healthy" if model_loaded else "not loaded", model_loaded=model_loaded, model_name="deepseek-coder-1.3b-instruct.Q4_K_M", model_path=str(MODEL_PATH), timestamp=datetime.utcnow().isoformat())

def parse_llm_output(text: str) -> Dict[str, Any]:
    """Phase 4.1: Enhanced parser for analytical, structured LLM output"""
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    
    explanation = ""
    key_factors = []
    recommendations = []
    summary = ""
    
    current_section = "explanation"
    
    for line in lines:
        line_lower = line.lower()
        
        # Phase 4.1: Enhanced section detection with emojis and headers
        if any(marker in line for marker in ['🔍', 'KEY INSIGHTS', 'Key Insights', 'INSIGHTS:', 'Insights:']):
            current_section = "factors"
            continue
        elif any(marker in line for marker in ['💡', 'WELLNESS STRATEGY', 'PERSONALIZED', 'Recommendations:', 'RECOMMENDATIONS']):
            current_section = "recommendations"
            continue
        elif any(marker in line for marker in ['🌱', '🎯', '💪', '"']) or (line.startswith('"') and line.endswith('"')):
            # Motivational closing line
            current_section = "summary"
            summary = line.strip('"\'')
            continue
        
        # Skip section headers and formatting
        if line.startswith('━') or line in ['', ' '] or len(line) < 5:
            continue
        
        # Add content to appropriate section
        if current_section == "explanation":
            # First few lines are explanation (before structured sections)
            if len(explanation) < 400 and not any(marker in line for marker in ['•', '✓', '-', '1.', '2.', '3.']):
                explanation += line + " "
        
        elif current_section == "factors":
            # Extract bullet points or numbered items
            cleaned = line.lstrip('-*•✓123456789. ')
            # Phase 4.1: Look for data-specific insights (numbers, mg/dL, mmHg, etc.)
            if len(cleaned) > 15 and any(indicator in cleaned.lower() for indicator in [
                'cholesterol', 'blood pressure', 'bp', 'heart rate', 'age', 
                'mg/dl', 'mmhg', 'bpm', 'angina', 'risk', 'indicates', 'suggests',
                'combined', 'relationship', 'correlation', 'physiological'
            ]):
                key_factors.append(cleaned)
        
        elif current_section == "recommendations":
            # Extract actionable items
            cleaned = line.lstrip('-*•✓123456789. ')
            # Phase 4.1: Look for specific, actionable recommendations
            if len(cleaned) > 15 and any(action in cleaned.lower() for action in [
                'reduce', 'increase', 'maintain', 'monitor', 'focus', 'aim', 
                'target', 'consult', 'track', 'avoid', 'include', 'consider',
                'diet', 'exercise', 'lifestyle', 'stress', 'sodium', 'physical'
            ]):
                recommendations.append(cleaned)
    
    # Phase 4.1: Enhanced fallback with more contextual defaults
    if not explanation or len(explanation) < 50:
        # Try to extract first complete sentence
        sentences = [s.strip() for s in text.split('.') if len(s.strip()) > 30]
        explanation = (sentences[0] + '.' if sentences else text[:300]) if text else "Cardiovascular risk assessment completed with detailed parameter analysis."
    
    if not key_factors or len(key_factors) < 2:
        # Extract any lines with medical terms as fallback
        for line in lines:
            if any(term in line.lower() for term in ['cholesterol', 'pressure', 'heart', 'risk', 'age']) and len(line) > 20:
                cleaned = line.lstrip('-*•✓123456789. ')
                if cleaned not in key_factors:
                    key_factors.append(cleaned)
                if len(key_factors) >= 3:
                    break
    
    if not key_factors:
        key_factors = [
            "Multiple cardiovascular parameters analyzed for risk correlation",
            "Blood pressure and lipid profile impact arterial health",
            "Age-related factors influence baseline cardiovascular risk"
        ]
    
    if not recommendations or len(recommendations) < 2:
        recommendations = [
            "Focus on heart-healthy Mediterranean-style diet with emphasis on fiber and omega-3s",
            "Maintain consistent aerobic exercise (150 minutes weekly) to improve cardiovascular efficiency",
            "Regular monitoring of key biomarkers (BP, lipid panel) for trend analysis"
        ]
    
    if not summary:
        # Extract last sentence or use fallback
        sentences = [s.strip() for s in text.split('.') if len(s.strip()) > 20]
        summary = sentences[-1] + '.' if sentences else "Your cardiovascular health data provides actionable insights for risk management."
    
    logger.info(f"Parsed: {len(explanation)} chars explanation, {len(key_factors)} factors, {len(recommendations)} recommendations")
    
    return {
        "explanation": explanation.strip()[:500],  # Limit to prevent overflow
        "key_factors": key_factors[:3],
        "recommendations": recommendations[:3],
        "summary": summary.strip()[:200]
    }

@app.post("/explain", response_model=ExplainResponse)
async def explain(request: ExplainRequest):
    """Phase 4.1: Generate enhanced analytical explanation using DeepSeek"""
    if not model_loaded:
        raise HTTPException(503, "Model not loaded")
    
    try:
        start_time = time.time()
        
        # Phase 4.1: Use enhanced contextual prompt if provided
        if request.prompt:
            prompt = request.prompt
            logger.info("Using Phase 4.1 enhanced contextual prompt from backend")
        else:
            # Fallback to basic prompt building
            risk = request.prediction.get('risk', 0) * 100 if request.prediction else 0
            prompt = f"Explain heart risk of {risk:.1f}% for patient age {request.inputs.get('age')} with BP {request.inputs.get('restingBP')}."
        
        logger.info(f"Generating explanation (prompt length: {len(prompt)} chars)")
        
        # Phase 4.1: Enhanced generation parameters for more creative, analytical responses
        response = llm(
            prompt,
            max_tokens=450,           # Increased for richer insights
            temperature=0.8,          # Higher creativity for varied, insightful responses
            top_p=0.92,               # Slightly higher for diverse vocabulary
            top_k=50,                 # Consider more token options for analytical language
            repeat_penalty=1.15,      # Reduce repetition for more varied insights
            stop=[                    # Enhanced stop sequences
                "PATIENT DATA:", 
                "CONTEXT:",
                "YOUR ROLE:",
                "━━━",
                "###", 
                "\n\n\n\n",
                "Note:",
                "Disclaimer:"
            ],
            echo=False
        )
        
        generated_text = response['choices'][0]['text'].strip()
        logger.info(f"Generated {len(generated_text)} characters")
        
        # Parse structured output with enhanced extraction
        parsed = parse_llm_output(generated_text)
        
        processing_time = time.time() - start_time
        logger.info(f"✅ Phase 4.1 analytical explanation completed in {processing_time:.2f}s")
        
        return ExplainResponse(
            explanation=parsed['explanation'],
            key_factors=parsed['key_factors'],
            recommendations=parsed['recommendations'],
            summary=parsed['summary'],
            processing_time=processing_time,
            model_used="deepseek-coder-1.3b-Q4_K_M-phase4.1"
        )
        
    except Exception as e:
        logger.error(f"Error generating Phase 4.1 explanation: {e}")
        raise HTTPException(500, f"Failed to generate explanation: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    print("Starting Cardia LLM Service on port 8000...")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
