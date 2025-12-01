# NexusCRM Mobile App

A complete React Native mobile application for NexusCRM built with Expo, featuring real-time voice calling, AI assistant, and full CRM functionality.

## 🚀 Features

### ✅ Complete Feature Set

- **Authentication**
  - Email/Password login
  - Google OAuth integration
  - JWT token management with auto-refresh
  - Secure token storage

- **Multi-Tenant System**
  - Switch between multiple companies
  - Role-based access (ADMIN, STAFF, CUSTOMER)
  - Workspace management

- **CRM Modules**
  - Customers (Admin only)
  - Leads (Admin + Staff)
  - Contacts (Admin + Staff)
  - Tasks (All roles)
  - Notes (Admin + Staff)
  - Activities (Admin + Staff)
  - Issues (Customer + Admin)

- **Real-Time Voice Calling**
  - WebRTC-based voice calls
  - Socket.io for signaling
  - Incoming/outgoing call UI
  - Mute functionality
  - Call duration tracking

- **AI Assistant**
  - Gemini AI integration
  - Role-based tools
  - Chat history
  - CRM data access

- **Integrations**
  - Gmail API (send emails, tracking)
  - Telegram Bot (notifications)

- **UI/UX**
  - Modern card-based design
  - Light/Dark theme support
  - Smooth animations
  - Responsive layouts

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`)
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

## 🛠️ Installation

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `mobile` directory:

```env
EXPO_PUBLIC_API_URL=http://localhost:5000/api
EXPO_PUBLIC_WS_URL=http://localhost:5000
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
EXPO_PUBLIC_GOOGLE_REDIRECT_URI=com.nexuscrm.mobile:/oauth2redirect
```

### 3. Start Development Server

```bash
npm start
```

This will start the Expo development server. You can then:
- Press `a` to open on Android emulator
- Press `i` to open on iOS simulator
- Scan QR code with Expo Go app on physical device

## 📱 Running on Device

### Android

1. Install Expo Go from Google Play Store
2. Scan the QR code from the terminal
3. The app will load on your device

### iOS

1. Install Expo Go from App Store
2. Scan the QR code from the terminal
3. The app will load on your device

## 🏗️ Building APK/IPA

### Setup EAS Build

1. Login to Expo:
```bash
eas login
```

2. Configure your project:
```bash
eas build:configure
```

### Build Android APK (Preview)

```bash
eas build -p android --profile preview
```

This will create an APK file that you can install on any Android device.

### Build Android AAB (Production)

```bash
eas build -p android --profile production
```

This creates an Android App Bundle for Google Play Store submission.

### Build iOS IPA

```bash
eas build -p ios --profile production
```

Note: iOS builds require an Apple Developer account.

## 📦 Project Structure

```
mobile/
├── app/                      # Expo Router pages
│   ├── (auth)/              # Authentication screens
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/              # Main tab navigation
│   │   ├── dashboard.tsx
│   │   ├── crm.tsx
│   │   ├── tasks.tsx
│   │   ├── calls.tsx
│   │   └── ai.tsx
│   ├── crm/                 # CRM module screens
│   │   ├── customers/
│   │   ├── leads/
│   │   ├── contacts/
│   │   ├── notes/
│   │   ├── activities/
│   │   └── issues/
│   ├── integrations/        # Integration screens
│   │   ├── gmail.tsx
│   │   └── telegram.tsx
│   ├── profile.tsx
│   ├── workspace.tsx
│   ├── _layout.tsx
│   └── index.tsx
├── components/              # Reusable components
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   ├── LoadingSpinner.tsx
│   └── EmptyState.tsx
├── context/                 # React Context providers
│   ├── AuthContext.tsx
│   ├── ThemeContext.tsx
│   └── CallContext.tsx
├── services/                # API services
│   ├── authService.ts
│   ├── companyService.ts
│   ├── customerService.ts
│   ├── leadService.ts
│   ├── contactService.ts
│   ├── taskService.ts
│   ├── noteService.ts
│   ├── activityService.ts
│   ├── issueService.ts
│   ├── callService.ts
│   ├── aiService.ts
│   ├── emailService.ts
│   └── telegramService.ts
├── utils/                   # Utility functions
│   ├── axios.ts
│   └── storage.ts
├── theme/                   # Theme configuration
│   ├── colors.ts
│   └── index.ts
├── types/                   # TypeScript types
│   └── index.ts
├── constants/               # App constants
│   └── config.ts
├── app.json                 # Expo configuration
├── eas.json                 # EAS Build configuration
├── package.json
├── tsconfig.json
└── babel.config.js
```

## 🔧 Configuration Files

### app.json
Main Expo configuration with app metadata, permissions, and build settings.

### eas.json
EAS Build profiles for development, preview, and production builds.

### babel.config.js
Babel configuration with module resolver for path aliases.

### tsconfig.json
TypeScript configuration with path mappings.

## 🎨 Theming

The app supports light and dark themes. Users can switch themes from the Profile screen.

Theme configuration is in `theme/` directory:
- `colors.ts` - Color definitions
- `index.ts` - Complete theme object

## 🔐 Authentication Flow

1. User opens app
2. Check for stored access token
3. If token exists, validate and load user data
4. If token expired, use refresh token
5. If refresh fails, redirect to login
6. User can login with email/password or Google OAuth

## 🏢 Multi-Tenant System

- Users can belong to multiple companies
- Each company membership has a role (ADMIN/STAFF/CUSTOMER)
- Active company/role stored in SecureStore
- Switch workspace from Profile or Dashboard
- All API requests include `x-company-id` header

## 📞 WebRTC Calling

The calling system uses:
- `react-native-webrtc` for WebRTC functionality
- `socket.io-client` for signaling
- STUN servers for NAT traversal

Call flow:
1. Caller initiates call
2. Socket.io sends offer to receiver
3. Receiver accepts and sends answer
4. ICE candidates exchanged
5. Peer connection established
6. Audio streams connected

## 🤖 AI Assistant

The AI assistant integrates with Gemini AI and provides:
- Natural language chat interface
- Role-based tool access
- CRM data queries
- Email drafting
- Task management

## 📧 Gmail Integration

Features:
- OAuth 2.0 authentication
- Send emails from app
- Email tracking (opens/clicks)
- Email history per contact
- Template support

## 📱 Telegram Bot

Features:
- Phone number linking
- Real-time notifications
- Event updates
- Issue alerts

## 🧪 Testing

### Run on Emulator

**Android:**
```bash
npm run android
```

**iOS:**
```bash
npm run ios
```

### Test on Physical Device

Use Expo Go app to scan QR code from development server.

## 🚀 Deployment

### Android

1. Build APK/AAB:
```bash
eas build -p android --profile production
```

2. Download the build from EAS dashboard

3. Submit to Google Play Store:
```bash
eas submit -p android
```

### iOS

1. Build IPA:
```bash
eas build -p ios --profile production
```

2. Submit to App Store:
```bash
eas submit -p ios
```

## 📝 Environment Variables

Required environment variables:

- `EXPO_PUBLIC_API_URL` - Backend API URL
- `EXPO_PUBLIC_WS_URL` - WebSocket server URL
- `EXPO_PUBLIC_GOOGLE_CLIENT_ID` - Google OAuth client ID
- `EXPO_PUBLIC_GOOGLE_REDIRECT_URI` - OAuth redirect URI

## 🔒 Security

- JWT tokens stored in SecureStore (encrypted)
- Automatic token refresh
- Secure API communication
- OAuth 2.0 for Google login
- Role-based access control

## 📚 Key Dependencies

- **expo** - React Native framework
- **expo-router** - File-based routing
- **react-native-webrtc** - WebRTC support
- **socket.io-client** - Real-time communication
- **axios** - HTTP client
- **@tanstack/react-query** - Data fetching
- **zustand** - State management
- **react-hook-form** - Form handling
- **zod** - Schema validation
- **lucide-react-native** - Icons

## 🐛 Troubleshooting

### Common Issues

**1. Metro bundler issues:**
```bash
npx expo start -c
```

**2. Build failures:**
```bash
rm -rf node_modules
npm install
eas build:configure
```

**3. Android emulator not detected:**
- Ensure Android Studio is installed
- Check ANDROID_HOME environment variable
- Start emulator manually

**4. iOS simulator issues:**
- Ensure Xcode is installed (macOS only)
- Run `sudo xcode-select --switch /Applications/Xcode.app`

## 📞 Support

For issues or questions:
- Check the documentation
- Review error logs in Expo dashboard
- Contact development team

## 📄 License

Copyright © 2024 NexusCRM. All rights reserved.

