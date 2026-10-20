@echo off
echo ==============================================
echo   iPhone Stock Manager - Menjalankan Aplikasi
echo ==============================================

if not defined JWT_SECRET (
  for /f "delims=" %%i in ('node -e "process.stdout.write(require('crypto').randomBytes(48).toString('base64url'))"') do set "JWT_SECRET=%%i"
)
if not defined JWT_SECRET (
  echo Gagal membuat JWT_SECRET. Pastikan Node.js terpasang atau atur JWT_SECRET secara manual.
  exit /b 1
)

echo Memulai Backend (NestJS di port 3000)...
start "NestJS Backend" cmd /k "cd /d %~dp0backend && npm run start:dev"

echo Memulai Frontend (Next.js di port 3001)...
start "Next.js Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Aplikasi sedang dijalankan!
echo - Backend:  http://localhost:3000/api
echo - Frontend: http://localhost:3001
echo ==============================================
