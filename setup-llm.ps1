# Setup LLM Service - Python Environment
# Run this script once before starting the LLM service for the first time

Write-Host "🐍 Setting up Python Environment for LLM Service..." -ForegroundColor Cyan
Write-Host ""

# Check if Python is installed
if (!(Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Python not found! Please install Python 3.10 or higher." -ForegroundColor Red
    Write-Host "   Download from: https://www.python.org/downloads/" -ForegroundColor Yellow
    exit 1
}

# Check Python version
$pythonVersion = python --version
Write-Host "✅ Found: $pythonVersion" -ForegroundColor Green

# Navigate to llm-service directory
if (!(Test-Path "llm-service")) {
    Write-Host "❌ llm-service directory not found!" -ForegroundColor Red
    Write-Host "   Make sure you're running this from the project root." -ForegroundColor Yellow
    exit 1
}

Set-Location llm-service

Write-Host ""
Write-Host "📦 Step 1: Creating virtual environment..." -ForegroundColor Yellow
python -m venv venv

if (!(Test-Path "venv")) {
    Write-Host "❌ Failed to create virtual environment!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Virtual environment created" -ForegroundColor Green

Write-Host ""
Write-Host "📦 Step 2: Activating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

Write-Host "✅ Virtual environment activated" -ForegroundColor Green

Write-Host ""
Write-Host "📦 Step 3: Installing Python dependencies..." -ForegroundColor Yellow
Write-Host "   This may take several minutes (downloading ~5GB for model)" -ForegroundColor Gray
Write-Host ""

pip install --upgrade pip
pip install -r requirements.txt

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ All dependencies installed successfully!" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 Setup Complete!" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Run the main startup script: .\start-with-llm.ps1" -ForegroundColor White
Write-Host "   2. Or manually start services:" -ForegroundColor White
Write-Host "      - Backend & Frontend: npm run dev" -ForegroundColor Gray
Write-Host "      - LLM Service: cd llm-service; python main.py" -ForegroundColor Gray
Write-Host ""
Write-Host "📖 For more information, see LLM_INTEGRATION.md" -ForegroundColor Gray
Write-Host ""

Set-Location ..
