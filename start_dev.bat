@echo off
echo ==========================================
echo Starting ServiceFlow Development Environment
echo ==========================================

:: Check for Docker
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is NOT running. Please start Docker Desktop and run this script again.
    pause
    exit /b 1
)

echo [1/4] Starting Database & Storage (Docker)...
docker-compose up -d
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start Docker services.
    pause
    exit /b 1
)

echo [2/4] Waiting for Database to be ready...
timeout /t 5 /nobreak >nul

echo [3/4] Running Database Migrations & Seeding...
cd backend
call npx prisma migrate dev --name init
if %errorlevel% neq 0 (
    echo [WARNING] Migration failed or already applied. Continuing...
)
call npm run seed
cd ..

echo [4/4] Starting Backend & Frontend...
start "ServiceFlow Backend" cmd /k "cd backend && npm run start:dev"
start "ServiceFlow Frontend" cmd /k "cd frontend && npm run dev"

echo ==========================================
echo System is starting!
echo Backend API: http://localhost:3001
echo Frontend App: http://localhost:3000
echo ==========================================
pause
