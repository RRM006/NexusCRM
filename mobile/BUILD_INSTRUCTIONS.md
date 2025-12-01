# 📱 NexusCRM Mobile - Complete Build Instructions

## 🎯 Quick Start Guide

### Prerequisites Installation

1. **Install Node.js 18+**
   ```bash
   # Download from https://nodejs.org/
   # Verify installation
   node --version
   npm --version
   ```

2. **Install Expo CLI**
   ```bash
   npm install -g expo-cli
   ```

3. **Install EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

4. **Create Expo Account**
   - Go to https://expo.dev/signup
   - Create a free account
   - Verify your email

## 📦 Project Setup

### Step 1: Install Dependencies

```bash
cd mobile
npm install
```

This will install all required packages including:
- React Native and Expo
- Navigation libraries
- WebRTC support
- Socket.io client
- UI components
- And more...

### Step 2: Configure Environment

Create `.env` file in the `mobile` directory:

```env
EXPO_PUBLIC_API_URL=http://YOUR_BACKEND_IP:5000/api
EXPO_PUBLIC_WS_URL=http://YOUR_BACKEND_IP:5000
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-google-oauth-client-id
EXPO_PUBLIC_GOOGLE_REDIRECT_URI=com.nexuscrm.mobile:/oauth2redirect
```

**Important Notes:**
- Replace `YOUR_BACKEND_IP` with your actual backend server IP
- For local testing, use your computer's local IP (not localhost)
- Get Google Client ID from Google Cloud Console

### Step 3: Update app.json

Edit `app.json` and update:
```json
{
  "expo": {
    "name": "NexusCRM",
    "slug": "nexuscrm-mobile",
    "android": {
      "package": "com.yourcompany.nexuscrm"
    },
    "ios": {
      "bundleIdentifier": "com.yourcompany.nexuscrm"
    }
  }
}
```

## 🧪 Development & Testing

### Run on Development Server

```bash
npm start
```

This opens the Expo DevTools. You can:
- Press `a` for Android emulator
- Press `i` for iOS simulator
- Scan QR code with Expo Go app

### Test on Physical Device

1. **Install Expo Go**
   - Android: Google Play Store
   - iOS: App Store

2. **Connect to Same Network**
   - Ensure your device and computer are on the same WiFi

3. **Scan QR Code**
   - Open Expo Go app
   - Scan the QR code from terminal
   - App will load on your device

## 🏗️ Building APK (Android)

### Method 1: EAS Build (Recommended)

#### Step 1: Login to Expo

```bash
eas login
```

Enter your Expo account credentials.

#### Step 2: Configure EAS Build

```bash
eas build:configure
```

This creates/updates `eas.json` configuration.

#### Step 3: Build APK

**For Testing (APK):**
```bash
eas build -p android --profile preview
```

**For Production (AAB):**
```bash
eas build -p android --profile production
```

#### Step 4: Download Build

- Build will be uploaded to Expo servers
- You'll receive a URL to download the APK/AAB
- Or download from: https://expo.dev/accounts/[your-account]/projects/nexuscrm-mobile/builds

### Method 2: Local Build

```bash
npx expo run:android
```

This requires Android Studio and Android SDK installed.

## 🍎 Building IPA (iOS)

### Requirements

- macOS computer
- Xcode installed
- Apple Developer account ($99/year)

### Steps

1. **Login to EAS:**
   ```bash
   eas login
   ```

2. **Build IPA:**
   ```bash
   eas build -p ios --profile production
   ```

3. **Follow Prompts:**
   - EAS will guide you through Apple authentication
   - Certificates and provisioning profiles are managed automatically

4. **Download IPA:**
   - Get the IPA from Expo dashboard
   - Install via TestFlight or App Store

## 📤 Publishing to Stores

### Google Play Store (Android)

1. **Create Google Play Developer Account**
   - Go to https://play.google.com/console
   - Pay one-time $25 fee

2. **Build Production AAB:**
   ```bash
   eas build -p android --profile production
   ```

3. **Submit to Play Store:**
   ```bash
   eas submit -p android
   ```

   Or manually:
   - Download AAB from EAS dashboard
   - Upload to Google Play Console
   - Fill in store listing details
   - Submit for review

### Apple App Store (iOS)

1. **Enroll in Apple Developer Program**
   - Go to https://developer.apple.com
   - Pay $99/year

2. **Build Production IPA:**
   ```bash
   eas build -p ios --profile production
   ```

3. **Submit to App Store:**
   ```bash
   eas submit -p ios
   ```

   Or use Xcode:
   - Download IPA
   - Open in Xcode
   - Archive and upload

## 🔧 Build Profiles Explained

### eas.json Configuration

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

**Profiles:**
- `development` - For development builds with dev client
- `preview` - For internal testing (APK format)
- `production` - For store submission (AAB/IPA format)

## 🎨 Customization Before Building

### 1. App Icon

Replace these files:
- `assets/icon.png` (1024x1024)
- `assets/adaptive-icon.png` (1024x1024)
- `assets/favicon.png` (48x48)

### 2. Splash Screen

Replace:
- `assets/splash.png` (2048x2048 or larger)

### 3. App Name

In `app.json`:
```json
{
  "expo": {
    "name": "Your App Name",
    "slug": "your-app-slug"
  }
}
```

### 4. Package Name

In `app.json`:
```json
{
  "expo": {
    "android": {
      "package": "com.yourcompany.yourapp"
    },
    "ios": {
      "bundleIdentifier": "com.yourcompany.yourapp"
    }
  }
}
```

## 🐛 Common Build Issues

### Issue 1: Build Fails with "Network Error"

**Solution:**
```bash
# Clear cache and rebuild
npm cache clean --force
rm -rf node_modules
npm install
eas build -p android --profile preview --clear-cache
```

### Issue 2: "ANDROID_HOME not set"

**Solution:**
```bash
# Add to ~/.bashrc or ~/.zshrc
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### Issue 3: "Unable to resolve module"

**Solution:**
```bash
# Reset Metro bundler
npx expo start -c
```

### Issue 4: Build Succeeds but App Crashes

**Check:**
1. Environment variables are set correctly
2. Backend API is accessible from device
3. All permissions are granted in app.json
4. Check logs: `npx expo logs`

## 📊 Build Size Optimization

### Reduce APK Size

1. **Enable ProGuard** (in `app.json`):
```json
{
  "android": {
    "enableProguardInReleaseBuilds": true
  }
}
```

2. **Use AAB instead of APK** for Play Store
   - AAB is smaller and optimized per device

3. **Remove unused dependencies**
   ```bash
   npm prune
   ```

## 🔐 Code Signing

### Android

EAS handles signing automatically. To use your own keystore:

```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "apk",
        "credentialsSource": "local"
      }
    }
  }
}
```

### iOS

EAS manages certificates and provisioning profiles automatically.

## 📱 Testing Builds

### Android APK Testing

1. **Enable Unknown Sources** on Android device
2. **Transfer APK** via USB, email, or cloud
3. **Install APK** by tapping the file
4. **Test all features** thoroughly

### iOS IPA Testing

1. **Use TestFlight**
   - Upload to App Store Connect
   - Add internal/external testers
   - Distribute via TestFlight

2. **Or use Ad Hoc distribution**
   - Requires device UDIDs
   - Limited to 100 devices

## 🚀 Continuous Integration

### Setup GitHub Actions

Create `.github/workflows/build.yml`:

```yaml
name: EAS Build
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npx eas-cli build --platform android --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

## 📞 Support & Resources

- **Expo Documentation:** https://docs.expo.dev
- **EAS Build Docs:** https://docs.expo.dev/build/introduction/
- **React Native Docs:** https://reactnative.dev/docs/getting-started
- **Expo Forums:** https://forums.expo.dev

## ✅ Pre-Launch Checklist

Before releasing your app:

- [ ] Test on multiple devices (different screen sizes)
- [ ] Test all authentication flows
- [ ] Test WebRTC calling on real network
- [ ] Verify all API endpoints work
- [ ] Test offline behavior
- [ ] Check app permissions
- [ ] Verify push notifications
- [ ] Test deep linking
- [ ] Review app store guidelines
- [ ] Prepare store listing (screenshots, description)
- [ ] Set up analytics
- [ ] Configure crash reporting

## 🎉 You're Ready!

Your NexusCRM mobile app is now ready to build and deploy. Follow the steps above based on your target platform and deployment method.

For any issues, refer to the troubleshooting section or check the Expo documentation.

Good luck with your app launch! 🚀

