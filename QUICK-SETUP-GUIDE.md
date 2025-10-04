# Quick Setup Guide for Android APK

## 🚀 Quick Start (Recommended)

### Step 1: Install Android Studio
1. Download Android Studio from: https://developer.android.com/studio
2. Install it with default settings (this will install Android SDK automatically)
3. Open Android Studio and complete the setup wizard

### Step 2: Set Environment Variables
1. Open System Properties → Environment Variables
2. Add these variables:

**JAVA_HOME:**
```
C:\Program Files\Android\Android Studio\jbr
```

**ANDROID_HOME:**
```
C:\Users\%USERNAME%\AppData\Local\Android\Sdk
```

**Add to PATH:**
```
%JAVA_HOME%\bin
%ANDROID_HOME%\tools
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\build-tools\33.0.0
```

### Step 3: Build APK
1. Open Command Prompt as Administrator
2. Navigate to: `D:\rent-management\rent-management-mobile`
3. Run: `cordova build android --release`

### Step 4: Find Your APK
The APK will be created at:
```
D:\rent-management\rent-management-mobile\platforms\android\app\build\outputs\apk\release\app-release.apk
```

## 📱 Install on Android Device

1. Copy the APK file to your Android device
2. On your Android device, go to Settings → Security → Enable "Install from unknown sources"
3. Open the APK file and install it
4. Launch "Rent Management" app

## 🔧 Alternative: Use Android Studio

If command line doesn't work:
1. Open Android Studio
2. File → Open → Navigate to `D:\rent-management\rent-management-mobile\platforms\android`
3. Wait for Gradle sync to complete
4. Build → Build Bundle(s) / APK(s) → Build APK(s)
5. Find APK in: `app\build\outputs\apk\debug\app-debug.apk`

## ✅ Your App Features

- **Tenant Management**: Add, edit, and track tenants
- **Rent Collection**: Track rent payments and dues
- **Advance Tracking**: Monitor advance payments
- **Reports**: Generate detailed reports
- **Expenditure Tracking**: Track property expenses
- **Mobile Optimized**: Works great on phones and tablets
- **Offline Support**: Works without internet connection

## 🆘 Need Help?

If you encounter issues:
1. Make sure Android Studio is fully installed
2. Restart your computer after setting environment variables
3. Try the Android Studio method if command line fails
4. Check that all environment variables are set correctly

Your rent management system is now ready to use as a mobile app! 🎉
