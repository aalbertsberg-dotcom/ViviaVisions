$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host 'Node.js is not installed or is not in PATH.' -ForegroundColor Red
    Write-Host 'Install a current Node.js LTS release, reopen PowerShell, and run this script again.'
    exit 1
}

if (-not (Test-Path (Join-Path $PSScriptRoot 'node_modules'))) {
    Write-Host 'Installing ViviaVisions dependencies...' -ForegroundColor Cyan
    npm install
}

Write-Host 'Starting ViviaVisions...' -ForegroundColor Green
Write-Host 'Press Ctrl+C to stop the local site.' -ForegroundColor DarkGray
npm run dev
