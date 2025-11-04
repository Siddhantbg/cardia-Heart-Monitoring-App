# Cardia LLM Service

DeepSeek/Phi-2 LLM microservice for generating medical explanations and insights.

## Setup

### 1. Create Virtual Environment

```bash
cd llm-service
python -m venv venv
```

### 2. Activate Virtual Environment

**Windows (PowerShell):**
```powershell
.\venv\Scripts\Activate.ps1
```

**Windows (Command Prompt):**
```cmd
venv\Scripts\activate.bat
```

**Linux/Mac:**
```bash
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

This will install:
- FastAPI (web framework)
- Uvicorn (ASGI server)
- PyTorch (CPU version)
- Transformers (Hugging Face)
- Other dependencies

**Note:** First run will download the model (~5-6 GB for Phi-2). This is cached locally.

## Running the Service

### Development Mode

```bash
python main.py
```

Or with uvicorn directly:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 1
```

**Note:** For CPU-based LLM inference, use only 1 worker to avoid memory issues.

## API Endpoints

### Health Check

```bash
GET http://localhost:8000/health
```

Response:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "model_name": "microsoft/phi-2",
  "timestamp": "2025-10-10T12:00:00"
}
```

### Generate Explanation

```bash
POST http://localhost:8000/explain
Content-Type: application/json

{
  "inputs": {
    "age": 55,
    "sex": "M",
    "restingBP": 140,
    "cholesterol": 240,
    "fastingBS": 1,
    "maxHeartRate": 130,
    "exerciseAngina": "Y",
    "chestPainType": "ASY"
  },
  "prediction": {
    "riskScore": 0.78,
    "status": "High Risk"
  },
  "include_recommendations": true,
  "max_length": 300
}
```

Response:
```json
{
  "explanation": "Based on your medical profile, you have an elevated risk...",
  "key_factors": [
    "Elevated blood pressure (140 mm Hg)",
    "High cholesterol (240 mg/dl)",
    "Exercise-induced angina"
  ],
  "recommendations": [
    "Consult a cardiologist for comprehensive evaluation",
    "Adopt a heart-healthy diet low in saturated fats",
    "Engage in moderate aerobic exercise after medical clearance"
  ],
  "summary": "Regular monitoring and lifestyle modifications are essential.",
  "processing_time": 2.5,
  "model_used": "microsoft/phi-2"
}
```

## Model Configuration

### Current Model: microsoft/phi-2

- **Size:** 2.7B parameters (~5.4 GB)
- **Optimized for:** Reasoning and instruction following
- **Inference time:** 2-5 seconds on modern CPU
- **Memory usage:** ~6-8 GB RAM

### Alternative Models

Edit `MODEL_NAME` in `main.py`:

**Faster (smaller):**
```python
MODEL_NAME = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"  # 1.1B params, ~2 GB
```

**Better quality (larger):**
```python
MODEL_NAME = "meta-llama/Llama-2-7b-chat-hf"  # 7B params, requires HF auth
```

**Specialized medical:**
```python
MODEL_NAME = "epfl-llm/meditron-7b"  # 7B params, medical fine-tuned
```

## Performance Tuning

### Reduce Memory Usage

In `main.py`:
```python
model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME,
    torch_dtype=torch.float16,  # Use float16 instead of float32
    low_cpu_mem_usage=True,
    device_map="cpu"
)
```

### Faster Inference

```python
output_ids = model.generate(
    inputs.input_ids,
    max_length=200,  # Reduce from 300
    temperature=0.6,  # Lower for more focused outputs
    do_sample=False,  # Greedy decoding (faster)
)
```

## Testing

### Test with curl

```bash
curl -X POST http://localhost:8000/explain \
  -H "Content-Type: application/json" \
  -d '{
    "inputs": {"age": 55, "sex": "M", "restingBP": 140, "cholesterol": 240, "fastingBS": 1, "maxHeartRate": 130, "exerciseAngina": "Y", "chestPainType": "ASY"},
    "prediction": {"riskScore": 0.78, "status": "High Risk"}
  }'
```

### Test with PowerShell

```powershell
$body = @{
    inputs = @{
        age = 55
        sex = "M"
        restingBP = 140
        cholesterol = 240
        fastingBS = 1
        maxHeartRate = 130
        exerciseAngina = "Y"
        chestPainType = "ASY"
    }
    prediction = @{
        riskScore = 0.78
        status = "High Risk"
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "http://localhost:8000/explain" -Method Post -ContentType "application/json" -Body $body
```

## Troubleshooting

### Model Download Issues

If model download fails or is slow:
```bash
# Set Hugging Face cache directory
$env:TRANSFORMERS_CACHE="D:\models\huggingface"
python main.py
```

### Out of Memory

- Use a smaller model (TinyLlama)
- Reduce `max_length` in generation
- Close other applications
- Upgrade RAM

### Slow Inference

- Expected: 2-5 seconds per request on CPU
- Use GPU if available (change `device_map="cuda"`)
- Consider smaller model for faster responses

## Integration with Express Backend

The Express backend calls this service at `http://localhost:8000/explain`.

See `server/routes/explain.js` for integration code.

## Production Deployment

### Docker (recommended)

```dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Systemd Service (Linux)

Create `/etc/systemd/system/cardia-llm.service`:
```ini
[Unit]
Description=Cardia LLM Service
After=network.target

[Service]
User=cardia
WorkingDirectory=/path/to/llm-service
ExecStart=/path/to/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

## License

MIT
