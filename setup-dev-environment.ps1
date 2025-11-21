# Space Game - Development Environment Setup Script
# This script sets up the VS Code environment to run the game

Write-Host "🚀 Space Game - Development Environment Setup" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js is installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# Check if npm is installed
Write-Host "Checking npm installation..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✓ npm is installed: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ npm is not installed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to install dependencies!" -ForegroundColor Red
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

Write-Host "✓ Dependencies installed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "✓ Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To start the development server, run:" -ForegroundColor Yellow
Write-Host "  npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "Or press 'Y' to start the server now..." -ForegroundColor Yellow

$response = Read-Host "Start dev server? (Y/N)"
if ($response -eq 'Y' -or $response -eq 'y') {
    Write-Host ""
    Write-Host "Starting development server..." -ForegroundColor Green
    Write-Host "The game will be available at: http://localhost:5173" -ForegroundColor Cyan
    Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
    Write-Host ""
    npm run dev
} else {
    Write-Host ""
    Write-Host "Setup complete! Run 'npm run dev' when you're ready." -ForegroundColor Green
}
