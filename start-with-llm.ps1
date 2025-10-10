# Cardia App - Startup Script with LLM Service
# This script starts all three services: Backend, Frontend, and LLM Service

Write-Host "🚀 Starting Cardia Heart Monitoring App with AI Explanations..." -ForegroundColor Cyan
Write-Host ""

# Check if Python is installed
if (!(Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Python not found! Please install Python 3.10+ first." -ForegroundColor Red
    exit 1
}

# Check if Node.js is installed
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js not found! Please install Node.js first." -ForegroundColor Red
    exit 1
}

Write-Host "📋 Step 1: Checking LLM Service..." -ForegroundColor Yellow

# Check if llm-service directory exists
if (!(Test-Path "llm-service")) {
    Write-Host "❌ llm-service directory not found!" -ForegroundColor Red
    exit 1
}

# Check if requirements are installed
$venvPath = "llm-service\venv\Scripts\python.exe"
if (Test-Path $venvPath) {
    Write-Host "✅ Found virtual environment" -ForegroundColor Green
    $pythonCmd = $venvPath
} else {
    Write-Host "⚠️  No virtual environment found, using system Python" -ForegroundColor Yellow
    $pythonCmd = "python"
}

Write-Host ""
Write-Host "📋 Step 2: Starting LLM Service (this may take 30-60 seconds)..." -ForegroundColor Yellow
Write-Host "   Model: microsoft/phi-2 (2.7B parameters)" -ForegroundColor Gray

# Start LLM service in background
$llmJob = Start-Job -ScriptBlock {
    param($pythonCmd, $workingDir)
    Set-Location $workingDir
    & $pythonCmd main.py
} -ArgumentList $pythonCmd, (Resolve-Path "llm-service").Path

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "📋 Step 3: Starting Backend & Frontend..." -ForegroundColor Yellow

# Start backend and frontend using npm script
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "✅ All services starting!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Service URLs:" -ForegroundColor Cyan
Write-Host "   Frontend:    http://localhost:5173" -ForegroundColor White
Write-Host "   Backend:     http://localhost:5000" -ForegroundColor White
Write-Host "   LLM Service: http://localhost:8000" -ForegroundColor White
Write-Host "   LLM Docs:    http://localhost:8000/docs" -ForegroundColor Gray
Write-Host ""
Write-Host "⏳ Note: First LLM request will take longer as model loads into memory" -ForegroundColor Yellow
Write-Host ""
Write-Host "🛑 To stop all services:" -ForegroundColor Red
Write-Host "   Press Ctrl+C in this window, then close the backend/frontend window" -ForegroundColor Gray
Write-Host ""

# Monitor LLM service job
Write-Host "📊 Monitoring LLM Service..." -ForegroundColor Cyan
while ($true) {
    if ($llmJob.State -eq "Failed") {
        Write-Host "❌ LLM Service failed to start!" -ForegroundColor Red
        Write-Host "Error: " -ForegroundColor Red
        Receive-Job $llmJob
        break
    }
    
    # Check if port 8000 is listening
    $llmRunning = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
    if ($llmRunning) {
        Write-Host "✅ LLM Service is ready on port 8000!" -ForegroundColor Green
        break
    }
    
    Start-Sleep -Seconds 2
    Write-Host "." -NoNewline -ForegroundColor Gray
}

Write-Host ""
Write-Host "🎉 All systems operational! Navigate to http://localhost:5173 to start" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop the LLM service..." -ForegroundColor Yellow

# Keep script running until user interrupts
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    Write-Host ""
    Write-Host "🛑 Stopping LLM Service..." -ForegroundColor Red
    Stop-Job $llmJob -ErrorAction SilentlyContinue
    Remove-Job $llmJob -ErrorAction SilentlyContinue
    Write-Host "✅ Cleanup complete" -ForegroundColor Green
}
