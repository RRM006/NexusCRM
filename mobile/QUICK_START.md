# 🚀 Quick Start Guide - NexusCRM Mobile

## ✅ Installation Complete!

All dependencies have been successfully installed. Follow these steps to run the app:

## 📋 Next Steps

### 1. Configure Environment Variables

Create a `.env` file in the `mobile` directory:

```env
EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_IP:5000/api
EXPO_PUBLIC_WS_URL=http://YOUR_COMPUTER_IP:5000
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
EXPO_PUBLIC_GOOGLE_REDIRECT_URI=com.nexuscrm.mobile:/oauth2redirect
```

**Important:** Replace `YOUR_COMPUTER_IP` with your actual local IP address (not localhost):
- Windows: Run `ipconfig` and look for IPv4 Address
- Example: `http://192.168.1.100:5000/api`

### 2. Start the Backend Server

Make sure your NexusCRM backend is running:

```bash
cd ../backend
npm run dev
```

The backend should be running on `http://localhost:5000`

### 3. Start the Expo Development Server

```bash
npm start
```

This will open the Expo DevTools in your browser.

### 4. Run the App

You have several options:

#### Option A: Android Emulator
- Press `a` in the terminal
- Or click "Run on Android device/emulator" in DevTools

#### Option B: iOS Simulator (macOS only)
- Press `i` in the terminal
- Or click "Run on iOS simulator" in DevTools

#### Option C: Physical Device
1. Install **Expo Go** app:
   - Android: [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)

2. Scan the QR code shown in terminal with:
   - Android: Expo Go app
   - iOS: Camera app (opens in Expo Go)

## 🎯 First Time Setup

When you first run the app:

1. **Register a new account** or **Login**
2. The app will connect to your backend API
3. You can test all features:
   - Dashboard
   - CRM modules
   - Tasks
   - Voice calling (requires 2 devices)
   - AI Assistant
   - And more!

## 🔧 Common Commands

```bash
# Start development server
npm start

# Start with cache cleared
npm start -- --clear

# Run on Android
npm run android

# Run on iOS (macOS only)
npm run ios

# Check for issues
npx expo doctor
```

## 🐛 Troubleshooting

### Issue: "Unable to connect to backend"

**Solution:** 
- Make sure backend is running
- Use your computer's IP address (not localhost) in `.env`
- Check firewall settings

### Issue: "Metro bundler not starting"

**Solution:**
```bash
npm start -- --clear
```

### Issue: "App crashes on startup"

**Solution:**
- Check that all environment variables are set
- Verify backend API is accessible
- Check console logs for errors

### Issue: "TypeScript errors"

**Solution:**
```bash
# Already fixed! But if you see any:
npm install --save-dev typescript @types/react @types/react-native
```

## 📱 Testing Features

### Test Authentication
1. Register a new account
2. Login with credentials
3. Try Google OAuth (requires Google Client ID)

### Test CRM Modules
1. Go to CRM tab
2. Open any module (Leads, Customers, etc.)
3. Create, view, edit, delete items

### Test Voice Calling
1. Need 2 devices or 1 device + 1 emulator
2. Login as CUSTOMER on one device
3. Login as ADMIN on another device
4. Customer can call Admin from Calls tab

### Test AI Assistant
1. Go to AI tab
2. Ask questions like:
   - "Show me all leads"
   - "Create a task"
   - "Draft an email"

## 🎨 Customization

### Change Theme
- Go to Profile → Dark Mode toggle

### Switch Workspace
- Go to Profile → Switch Workspace
- Select different company/role

## 📚 Documentation

- **README.md** - Complete documentation
- **BUILD_INSTRUCTIONS.md** - How to build APK/IPA
- **PROJECT_SUMMARY.md** - Feature overview

## 🚀 Building for Production

When ready to build APK:

```bash
# Install EAS CLI (if not already)
npm install -g eas-cli

# Login to Expo
eas login

# Build Android APK
eas build -p android --profile preview
```

See **BUILD_INSTRUCTIONS.md** for detailed steps.

## ✅ You're All Set!

Your NexusCRM mobile app is ready to run. Start the development server and enjoy! 🎉

## 📞 Need Help?

- Check the console for error messages
- Review the full documentation in README.md
- Ensure backend is running and accessible
- Verify environment variables are correct

---

**Happy Coding! 🚀**

