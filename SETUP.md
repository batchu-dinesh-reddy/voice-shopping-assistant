# Setup Guide

## Prerequisites

- **Node.js** 16+ ([download](https://nodejs.org/))
- **npm** 8+ (comes with Node.js)
- **Firebase Account** (free tier works)
- **Modern Browser** (Chrome, Firefox, Safari, Edge)

## Step 1: Clone & Install Dependencies

```bash
# Clone repository
git clone https://github.com/batchu-dinesh-reddy/voice-shopping-assistant.git
cd voice-shopping-assistant

# Install dependencies
npm install
```

## Step 2: Setup Firebase Project

### Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Create a project**
3. Enter project name: `voice-shopping-assistant`
4. Accept terms and click **Create project**
5. Wait for project creation (1-2 minutes)
6. Click **Continue**

### Enable Firestore Database

1. In left sidebar, click **Build** → **Firestore Database**
2. Click **Create database**
3. Select region (closest to you)
4. Choose **Start in test mode** (for development)
5. Click **Create**

### Enable Authentication

1. In left sidebar, click **Build** → **Authentication**
2. Click **Get started**
3. Click on **Anonymous** provider
4. Toggle **Enable** to ON
5. Click **Save**

### Get Firebase Credentials

1. In left sidebar, click **⚙️ Project Settings**
2. Go to **General** tab
3. Scroll down to **Your apps** section
4. Click **</> Web** icon
5. Enter app nickname: `voice-shopping-assistant-web`
6. Check "Also set up Firebase Hosting for this app" (optional)
7. Click **Register app**
8. Copy the Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-bucket.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

## Step 3: Configure Environment Variables

```bash
# Copy example to local file
cp .env.example .env.local

# Edit .env.local with your Firebase credentials
# Use nano, vim, or your favorite editor
nano .env.local
```

**Paste your Firebase config**:

```env
VITE_FIREBASE_API_KEY=YOUR_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-bucket.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

**Save and close** (Ctrl+O, Enter, Ctrl+X if using nano)

## Step 4: Run Development Server

```bash
npm run dev
```

You should see:
```
  VITE v5.0.8  ready in 245 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

✅ Open http://localhost:5173 in your browser

## Step 5: Test the App

1. **Click the microphone button** 🎤
2. **Allow browser microphone access** (if prompted)
3. **Speak**: "add milk"
4. **You should see** "milk" appear in the shopping list!
5. **Repeat**: Try adding more items (eggs, bread, etc.)
6. **Try recommendations**: Click the recommendation type toggles

## Troubleshooting

### Issue: "Microphone not working"

**Solution 1**: Check browser permissions
- Chrome: Settings → Privacy → Site Settings → Microphone → Allowed
- Firefox: Preferences → Privacy → Microphone → Allowed
- Safari: System Preferences → Security & Privacy → Microphone → Allowed

**Solution 2**: Use HTTPS
- Web Speech API requires HTTPS (or localhost)
- Dev server uses localhost ✅
- Production needs SSL certificate

**Solution 3**: Browser support
- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ⚠️ Limited (iOS 14.5+)
- IE11: ❌ Not supported

### Issue: "Firebase connection error"

**Solution 1**: Check credentials
```bash
# Verify .env.local is loaded
cat .env.local
```

**Solution 2**: Check Firestore rules
1. Firebase Console → Firestore Database → Rules
2. Should allow anonymous read/write:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Solution 3**: Check internet connection
- Dev tools (F12) → Network tab
- Look for Firebase API calls
- Should see 200/201 responses

### Issue: "Items not saving"

**Solution 1**: Check Firestore quota
- Firebase Console → Usage
- Free tier: 1 million reads/day, 50k writes/day
- If exceeded, upgrade to Blaze plan

**Solution 2**: Check browser console
```bash
# Open Dev Tools (F12)
# Console tab
# Look for error messages
# Copy-paste into GitHub issue
```

### Issue: "npm install fails"

**Solution 1**: Clear cache
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Solution 2**: Update npm
```bash
npm install -g npm@latest
npm install
```

**Solution 3**: Use Node 16 (LTS)
```bash
# Check version
node --version  # Should be v16+

# If old, install nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 16
nvm use 16
```

## Development Commands

```bash
# Start dev server (http://localhost:5173)
npm run dev

# Build for production (creates ./dist folder)
npm run build

# Preview production build
npm run preview

# Format code (Prettier)
npm run format

# Lint code (ESLint)
npm run lint
```

## Project Structure

```
.
├── index.html              # Entry HTML
├── vite.config.js          # Vite config
├── package.json            # Dependencies
├── .env.example            # Environment template
├── .gitignore              # Git ignore
├── README.md               # Main docs
├── ARCHITECTURE.md         # System design
├── APPROACH.md             # ML algorithms
├── SETUP.md                # This file
├── FEATURES.md             # Feature list
└── src/
    ├── main.jsx            # Entry point
    ├── App.jsx             # Main component
    ├── App.css             # Main styles
    ├── index.css           # Global styles
    ├── config/
    │   └── firebase.js     # Firebase setup
    ├── services/
    │   ├── voiceService.js
    │   ├── nlpService.js
    │   ├── firestoreService.js
    │   ├── recommendationService.js
    │   └── collaborativeFilteringService.js
    ├── hooks/
    │   ├── useVoiceRecognition.js
    │   └── useFirebase.js
    └── components/
        ├── VoiceInput.jsx
        ├── ItemCard.jsx
        ├── ShoppingList.jsx
        └── Recommendations.jsx
```

## Deploy to Production

### Option 1: Firebase Hosting (Recommended)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize hosting
firebase init hosting

# Build
npm run build

# Deploy
firebase deploy
```

### Option 2: Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### Option 3: Netlify

1. Push to GitHub
2. Go to [Netlify](https://netlify.com)
3. Connect GitHub repo
4. Set build command: `npm run build`
5. Set publish directory: `dist`
6. Add environment variables
7. Deploy!

## Performance Tips

1. **Enable Compression**: Gzip all assets
2. **Cache Firestore**: Use offline persistence
3. **Lazy Load**: Code-split components
4. **Monitor**: Use Lighthouse (DevTools)

## Security Checklist

- ✅ Never commit `.env.local`
- ✅ Use test mode rules for development
- ✅ Add production Firestore rules before going live
- ✅ Enable rate limiting
- ✅ Use HTTPS in production
- ✅ Regenerate API keys if exposed

## Next Steps

1. ✅ Explore the code
2. ✅ Try adding items and getting recommendations
3. ✅ Read APPROACH.md to understand ML algorithms
4. ✅ Read ARCHITECTURE.md for system design
5. ✅ Customize recommendations (adjust weights, rules)
6. ✅ Deploy to production
7. ✅ Share with friends!

## Getting Help

- **GitHub Issues**: Report bugs or feature requests
- **Firebase Docs**: https://firebase.google.com/docs
- **React Docs**: https://react.dev
- **Vite Docs**: https://vitejs.dev

## License

MIT - Feel free to use, modify, and share!

Happy shopping! 🛒
