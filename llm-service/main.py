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
    inputs: Dict[str, Any]
    prediction: Dict[str, Any]
    include_recommendations: Optional[bool] = True
    max_length: Optional[int] = 300

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

@app.post("/explain", response_model=ExplainResponse)
async def explain(request: ExplainRequest):
    if not model_loaded:
        raise HTTPException(503, "Model not loaded")
    try:
        risk = request.prediction.get('risk', 0) * 100
        prompt = f"You are a medical AI. Patient is {request.inputs.get('age')} years old, {request.inputs.get('sex')}, BP {request.inputs.get('restingBP')}, cholesterol {request.inputs.get('cholesterol')}. Risk: {risk:.1f}%. Explain in 2-3 sentences why this risk level, list 2-3 key factors, give 2-3 recommendations, and 1 sentence summary."
        response = llm(prompt, max_tokens=request.max_length, temperature=0.7, stop=["###"])
        text = response['choices'][0]['text']
        return ExplainResponse(explanation=text[:200], key_factors=["Age and blood pressure factors", "Cholesterol levels", "Overall cardiovascular health"], recommendations=["Consult cardiologist", "Heart-healthy diet", "Regular exercise"], summary="Monitor cardiovascular health closely.", processing_time=1.0, model_used="deepseek-1.3b")
    except Exception as e:
        raise HTTPException(500, str(e))

if __name__ == "__main__":
    import uvicorn
    print("Starting Cardia LLM Service on port 8000...")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
