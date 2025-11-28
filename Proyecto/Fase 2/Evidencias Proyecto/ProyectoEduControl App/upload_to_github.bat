@echo off
echo ========================================
echo  EduControl Project Upload Helper
echo ========================================
echo.
echo This script will help you prepare the project for GitHub upload
echo.
echo Step 1: Clone your repository
echo git clone https://github.com/Eugenio9737/Backup-Correa-Fredes.git
echo.
echo Step 2: Navigate to Fase2 folder
echo cd Backup-Correa-Fredes/Fase2
echo.
echo Step 3: Create Evidencia Proyecto folder
echo mkdir "Evidencia Proyecto"
echo.
echo Step 4: Copy EdControl project to the new folder
echo xcopy /E /I "%~dp0EdControl" "Evidencia Proyecto\EdControl"
echo.
echo Step 5: Add, commit and push to GitHub
echo git add .
echo git commit -m "Add EduControl project evidence - Complete educational management system"
echo git push origin main
echo.
echo ========================================
echo Manual steps required:
echo 1. Open Command Prompt or Git Bash
echo 2. Navigate to your desired location
echo 3. Run the git commands shown above
echo ========================================
pause