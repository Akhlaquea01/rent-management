@echo off
echo Preparing Rent Management Mobile for GitHub...
echo.

REM Create .gitignore if it doesn't exist
if not exist .gitignore (
    echo Creating .gitignore...
    echo node_modules/ > .gitignore
    echo platforms/ >> .gitignore
    echo plugins/ >> .gitignore
    echo .cordova/ >> .gitignore
    echo *.log >> .gitignore
    echo .DS_Store >> .gitignore
    echo Thumbs.db >> .gitignore
)

REM Initialize git repository
if not exist .git (
    echo Initializing Git repository...
    git init
)

REM Add all files
echo Adding files to Git...
git add .

REM Create initial commit
echo Creating initial commit...
git commit -m "Initial commit: Rent Management Mobile App"

echo.
echo ✅ Project prepared for GitHub!
echo.
echo Next steps:
echo 1. Go to https://github.com and create a new repository
echo 2. Copy the repository URL
echo 3. Run these commands:
echo    git remote add origin YOUR_REPOSITORY_URL
echo    git push -u origin main
echo.
echo 4. GitHub Actions will automatically build your APK!
echo.
pause
