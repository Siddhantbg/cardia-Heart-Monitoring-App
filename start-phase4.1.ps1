# Cardia Phase 4.1 Startup Script
# Starts all three services: LLM, Backend, Frontend

Write-Host "🚀 Starting Cardia Phase 4.1..." -ForegroundColor Cyan
Write-Host ""

# Check if services are already running
$llmRunning = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
$backendRunning = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue
$frontendRunning = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue

if ($llmRunning -or $backendRunning -or $frontendRunning) {
    Write-Host "⚠️  Some services are already running:" -ForegroundColor Yellow
    if ($llmRunning) { Write-Host "   • LLM Service (8000) ✓" -ForegroundColor Green }
    if ($backendRunning) { Write-Host "   • Backend (5000) ✓" -ForegroundColor Green }
    if ($frontendRunning) { Write-Host "   • Frontend (5173) ✓" -ForegroundColor Green }
    Write-Host ""
    $confirm = Read-Host "Stop and restart all services? (Y/N)"
    if ($confirm -ne "Y" -and $confirm -ne "y") {
        Write-Host "❌ Startup cancelled" -ForegroundColor Red
        exit
    }
    
    # Kill existing processes
    if ($llmRunning) { 
        Write-Host "Stopping LLM service..." -ForegroundColor Yellow
        Stop-Process -Id $llmRunning.OwningProcess -Force -ErrorAction SilentlyContinue
    }
    if ($backendRunning) { 
        Write-Host "Stopping Backend..." -ForegroundColor Yellow
        Stop-Process -Id $backendRunning.OwningProcess -Force -ErrorAction SilentlyContinue
    }
    if ($frontendRunning) { 
        Write-Host "Stopping Frontend..." -ForegroundColor Yellow
        Stop-Process -Id $frontendRunning.OwningProcess -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  Starting Services..." -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Start LLM Service in new window
Write-Host "1️⃣  Starting LLM Service (DeepSeek) on port 8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\llm-service'; Write-Host '🧠 LLM Service (DeepSeek)' -ForegroundColor Magenta; python main.py"
Start-Sleep -Seconds 5

# Wait for LLM to be ready
Write-Host "   Waiting for LLM service to load model..." -ForegroundColor Yellow
$maxWait = 30
$waited = 0
while ($waited -lt $maxWait) {
    $llmCheck = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
    if ($llmCheck) {
        Write-Host "   ✅ LLM Service ready!" -ForegroundColor Green
        break
    }
    Start-Sleep -Seconds 1
    $waited++
}

if ($waited -ge $maxWait) {
    Write-Host "   ⚠️  LLM Service taking longer than expected..." -ForegroundColor Yellow
}

Write-Host ""

# Start Backend + Frontend in new window
Write-Host "2️⃣  Starting Backend (port 5000) + Frontend (port 5173)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; Write-Host '⚙️  Backend + Frontend' -ForegroundColor Cyan; npm run dev"
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  🎉 All Services Started!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Open your browser:" -ForegroundColor White
Write-Host "   Frontend UI:   http://localhost:5173" -ForegroundColor Cyan
Write-Host "   Backend API:   http://localhost:5000" -ForegroundColor Cyan
Write-Host "   LLM Service:   http://localhost:8000" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Phase 4.1 Features:" -ForegroundColor White
Write-Host "   ✅ Data-driven insights (age, BP, cholesterol analysis)" -ForegroundColor Green
Write-Host "   ✅ Parameter-specific explanations" -ForegroundColor Green
Write-Host "   ✅ Enhanced creativity (temp=0.8)" -ForegroundColor Green
Write-Host "   ✅ Personalized wellness strategies" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Test with different risk levels:" -ForegroundColor Yellow
Write-Host "   • LOW:  Age 35, BP 110, Chol 180" -ForegroundColor White
Write-Host "   • MID:  Age 55, BP 145, Chol 235" -ForegroundColor White
Write-Host "   • HIGH: Age 65, BP 180, Chol 400" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to close this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
