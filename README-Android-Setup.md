# Android APK Build Setup

## Prerequisites

To build the Android APK, you need to install the following:

### 1. Java JDK (Java Development Kit)
- Download and install Java JDK 11 or higher from: https://adoptium.net/
- Set the `JAVA_HOME` environment variable to your JDK installation path
- Example: `JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-11.0.19.7-hotspot`

### 2. Android Studio and Android SDK
- Download and install Android Studio from: https://developer.android.com/studio
- During installation, make sure to install the Android SDK
- Set the `ANDROID_HOME` environment variable to your Android SDK path
- Example: `ANDROID_HOME=C:\Users\%USERNAME%\AppData\Local\Android\Sdk`
- Add the following to your PATH environment variable:
  - `%ANDROID_HOME%\tools`
  - `%ANDROID_HOME%\platform-tools`
  - `%ANDROID_HOME%\build-tools\33.0.0` (or latest version)

### 3. Environment Variables Setup
Add these to your system environment variables:

```
JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-11.0.19.7-hotspot
ANDROID_HOME=C:\Users\%USERNAME%\AppData\Local\Android\Sdk
PATH=%PATH%;%JAVA_HOME%\bin;%ANDROID_HOME%\tools;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\build-tools\33.0.0
```

## Building the APK

### Option 1: Using the Build Script
1. Open Command Prompt as Administrator
2. Navigate to the `rent-management-mobile` directory
3. Run: `build-apk.bat`

### Option 2: Manual Build
1. Open Command Prompt
2. Navigate to the `rent-management-mobile` directory
3. Run: `cordova build android --release`

## Installing the APK

1. The APK will be created at: `platforms\android\app\build\outputs\apk\release\app-release.apk`
2. Transfer this APK to your Android device
3. Enable "Install from unknown sources" in your Android device settings
4. Install the APK file

## Troubleshooting

### Common Issues:
1. **"JAVA_HOME not found"**: Install Java JDK and set JAVA_HOME environment variable
2. **"ANDROID_HOME not found"**: Install Android Studio and set ANDROID_HOME environment variable
3. **"Gradle not found"**: Make sure Android SDK is properly installed and PATH is set correctly
4. **Build fails**: Check that all environment variables are set correctly and restart Command Prompt

### Alternative: Use Android Studio
1. Open Android Studio
2. Import the project from `rent-management-mobile\platforms\android`
3. Build the project using Android Studio's build tools

## App Features

Your Rent Management app includes:
- Tenant management
- Rent collection tracking
- Advance payment tracking
- Reports and analytics
- Expenditure tracking
- Mobile-optimized interface

The app will work offline and sync data when internet is available.
