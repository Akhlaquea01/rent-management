@echo off
echo Building Rent Management APK...
echo.

REM Check if Android SDK is installed
if not defined ANDROID_HOME (
    echo ERROR: ANDROID_HOME environment variable is not set.
    echo Please install Android Studio and set ANDROID_HOME to your Android SDK path.
    echo Example: set ANDROID_HOME=C:\Users\%USERNAME%\AppData\Local\Android\Sdk
    pause
    exit /b 1
)

REM Check if Java JDK is installed
if not defined JAVA_HOME (
    echo ERROR: JAVA_HOME environment variable is not set.
    echo Please install Java JDK and set JAVA_HOME to your JDK path.
    echo Example: set JAVA_HOME=C:\Program Files\Java\jdk-11
    pause
    exit /b 1
)

echo Building APK...
cordova build android --release

if %ERRORLEVEL% EQU 0 (
    echo.
    echo SUCCESS! APK built successfully.
    echo APK location: platforms\android\app\build\outputs\apk\release\app-release.apk
    echo.
    echo You can now install this APK on your Android device.
) else (
    echo.
    echo ERROR: APK build failed.
    echo Please check the error messages above.
)

pause
