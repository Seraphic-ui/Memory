# Memory Makers - APK Build Instructions

## ✅ App is Ready for Building!

Your app has been configured with:
- **App Name:** Memory Makers
- **Package ID:** com.memorymakers.app
- **Version:** 1.0.0

## 📱 Steps to Build APK:

### 1. Install EAS CLI (if not already installed)
```bash
npm install -g eas-cli
```

### 2. Login to Expo Account
```bash
eas login
```
*If you don't have an Expo account, create one at https://expo.dev*

### 3. Build the APK
Navigate to the frontend directory and run:
```bash
cd /app/frontend
eas build --platform android --profile preview
```

### 4. Download Your APK
- The build will run on Expo's servers (takes ~10-15 minutes)
- Once complete, you'll get a download link
- Or visit https://expo.dev to see all your builds
- Download the APK and install it on your Android device

## 🔧 Alternative: Local Build (Advanced)

If you prefer building locally:

1. **Install Prerequisites:**
   - Android Studio
   - Android SDK
   - Java Development Kit (JDK)

2. **Build Locally:**
   ```bash
   cd /app/frontend
   npx expo run:android --variant release
   ```

## 📝 Important Notes:

### For Testing:
- The preview APK is perfect for testing on your own devices
- You can share it with friends for testing
- No Google Play Store submission needed

### For Production/Distribution:
If you want to publish to Google Play Store:
1. Use production profile: `eas build --platform android --profile production`
2. This creates an AAB (App Bundle) file
3. You'll need a Google Play Developer account ($25 one-time fee)

### Google OAuth Configuration:
**Important:** For the app to work on physical devices, you may need to:
1. Get SHA-1 certificate fingerprint from your build
2. Add it to Google Cloud Console OAuth credentials
3. Update your OAuth configuration

Run this after your first build:
```bash
eas credentials
```

## 🎯 Quick Start Commands:

```bash
# In one terminal (if not already done)
npm install -g eas-cli

# Login
eas login

# Navigate to project
cd /app/frontend

# Build APK
eas build --platform android --profile preview
```

## 💡 Tips:

1. **First Build:** May take 15-20 minutes
2. **Subsequent Builds:** Usually faster (5-10 minutes)
3. **Check Progress:** Visit https://expo.dev/accounts/[your-account]/builds
4. **Install APK:** Transfer to Android device and enable "Install from Unknown Sources"

## 🔗 Useful Links:

- Expo Dashboard: https://expo.dev
- EAS Build Docs: https://docs.expo.dev/build/introduction/
- Troubleshooting: https://docs.expo.dev/build-reference/troubleshooting/

---

**Need Help?** If you encounter any issues during the build process, let me know!
