# 🚀 How to Build Your App on Expo Cloud (EAS)

Since you are using EAS (Expo Application Services), you can build your app in the cloud.

## 1. Prerequisites
Open your terminal in the project folder (`my-app`) and run:
```bash
npm install -g eas-cli
eas login
```

## 2. Build for Android 🤖

### Option A: Preview Build (APK)
Best for testing on your device immediately.
```bash
eas build --platform android --profile preview
```
- **Output:** An `.apk` file you can install directly.

### Option B: Production Build (AAB)
Required for Google Play Store submission.
```bash
eas build --platform android --profile production
```
- **Output:** An `.aab` file (Android App Bundle).

## 3. Build for iOS 🍎

### Option A: Simulator Build
For testing on iOS Simulator (no Apple Developer Account needed).
```bash
eas build --platform ios --profile simulator
```

### Option B: Production/Ad-hoc
Requires a paid Apple Developer Account ($99/year).
```bash
eas build --platform ios --profile production
```

## 4. Troubleshooting
- **Credentials:** If asked to generate a new Keystore or Provisioning Profile, choose **Yes** (let EAS handle it).
- **Google Services:** Ensure `google-services.json` is in the root folder (it is currently there ✅).
