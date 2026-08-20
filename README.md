# Voice Shopping Assistant 🛒🎤

AI-powered voice-controlled shopping list with **hybrid ML recommendations** (60% rules-based + 40% collaborative filtering).

## ✨ Features

- **🎤 Voice Commands**: Add/remove items using Web Speech API
- **📝 Smart NLP**: Regex-based intent parsing (ADD, REMOVE)
- **🧠 Hybrid Recommendations**:
  - **Rules Engine**: Frequency-based, seasonal, category complementary items
  - **Collaborative Filtering**: k-NN with Jaccard similarity
  - **Hybrid Mode** (Default): Weighted 60% rules + 40% collaborative
- **🔄 Real-time Sync**: Firestore subscriptions for live updates
- **📊 Category Grouping**: Auto-categorize items by type
- **🎯 Personalization**: Learns from user's purchase history

## 🏗️ Architecture

```
src/
├── config/
│   └── firebase.js                 # Firebase initialization
├── services/
│   ├── voiceService.js            # Web Speech API wrapper
│   ├── nlpService.js              # Intent parsing (ADD/REMOVE)
│   ├── firestoreService.js        # Firestore CRUD + history
│   ├── recommendationService.js   # Rules-based engine
│   └── collaborativeFilteringService.js  # k-NN collaborative filtering
├── hooks/
│   ├── useVoiceRecognition.js    # Voice state management
│   └── useFirebase.js             # Firestore state management
├── components/
│   ├── VoiceInput.jsx             # Mic button + listening state
│   ├── ItemCard.jsx               # Single item display
│   ├── ShoppingList.jsx           # Category-grouped list
│   └── Recommendations.jsx        # Hybrid recommendations panel
├── App.jsx                        # Main app + intent handler
├── App.css                        # Styling
└── main.jsx                       # Entry point
```

## 🧮 ML Algorithms

### Rules-Based Engine

**Rule 1: Frequency-Based** 📊
- Items user bought 2+ times in last 30 days
- Score = buy frequency

**Rule 2: Category Complementary** 🔗
- Related items: milk→bread, meat→salt, etc.
- Score = parent item frequency × 0.7

**Rule 3: Seasonal** 🌱
- Current month's in-season produce
- Score = 0.8 (static)

### Collaborative Filtering (k-NN)

**User Vector**: Set of items user bought (last 90 days)

**Similarity Metric**: Jaccard Similarity
```
Jaccard(A, B) = |A ∩ B| / |A ∪ B|
Range: [0, 1]
```

**Algorithm**:
1. Build target user's vector
2. Find top-5 similar users (Jaccard > 0)
3. Collect items from similar users that target user hasn't bought
4. Score each item = Σ(similarity of users who bought it)
5. Return top-5 by score

### Hybrid Recommendation

**Weighting**:
- Rules recommendations × 0.6 (60% weight)
- Collaborative recommendations × 0.4 (40% weight)
- Merge by item name, sum scores, return top-5

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- Firebase project with Firestore enabled

### Setup

1. **Clone & Install**
```bash
cd voice-shopping-assistant
npm install
```

2. **Configure Firebase**
```bash
cp .env.example .env.local
# Edit .env.local with your Firebase credentials
```

3. **Run Dev Server**
```bash
npm run dev
# Open http://localhost:5173
```

4. **Build for Production**
```bash
npm run build
```

## 📊 Data Schema (Firestore)

```
users/
  {userId}/
    items/
      {itemId}/
        - name: string (lowercase)
        - quantity: number
        - unit: string (optional, e.g., "kg", "bottles")
        - category: string (auto-derived)
        - completed: boolean
        - voiceInput: string (original voice transcription)
        - createdAt: Timestamp
        - updatedAt: Timestamp
```

## 🔧 How It Works

### Voice Flow
1. User clicks mic button
2. Web Speech API captures audio
3. NLPService parses intent: "add 2 bottles of milk" → {intent: 'ADD', item: 'milk', quantity: 2, unit: 'bottles'}
4. FirestoreService stores item in user's collection
5. Firestore subscription triggers → UI updates

### Recommendation Flow
1. User toggles recommendation type (Hybrid/Rules/Collaborative)
2. Fetch user's 30-day history → Rules recommendations
3. Fetch all users + calculate Jaccard similarities → Collaborative recommendations
4. Merge and weight → Return top-5
5. User clicks "+" → Add recommendation to list

## 🎯 Key Implementation Details

**NLP Patterns** (Regex-based)
```javascript
ADD: "add milk", "i need eggs", "buy bread"
REMOVE: "remove cheese", "delete butter", "don't need yogurt"
Quantity: "2 bottles of milk" → {quantity: 2, unit: 'bottles', item: 'milk'}
```

**Categories** (Auto-detection)
```
dairy, produce, meat, grains, beverages, snacks, frozen, pantry, other
```

**Seasonal Items** (By month 1-12)
```javascript
1: ['oranges', 'lemons', 'kale']
6: ['tomatoes', 'berries', 'zucchini']
12: ['cranberries', 'nuts', 'cookies']
```

## 🧪 Testing Recommendations

### Rules-Based
1. Add milk 3 times
2. Add bread 2 times
3. Toggle "Rules" → See milk + bread + complementary items (butter, cheese)

### Collaborative Filtering
1. Create 2 users: User A (milk, bread, cheese) & User B (milk, bread, eggs)
2. Login as User A
3. Toggle "Collaborative" → Should recommend eggs (from User B who has similar taste)

### Hybrid
1. Toggle "Hybrid" → See weighted blend of both
2. Combine strengths: personal history + social recommendations

## 🌐 Browser Support

- Chrome/Edge: ✅ Full support
- Safari: ⚠️ Limited (webkit prefix required)
- Firefox: ✅ Full support
- Mobile: ✅ Chrome/Firefox (Android), Safari (iOS)

## 📝 Environment Variables

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

## 🎨 UI Components

- **VoiceInput**: Animated mic button + listening state
- **ItemCard**: Item name + quantity with delete button
- **ShoppingList**: Category-grouped list view
- **Recommendations**: Type toggle (Hybrid/Rules/Collaborative) + recommendation cards

## 🔐 Security

- Anonymous Firebase auth (no login required)
- Firestore rules restrict users to own items
- Client-side processing (no sensitive data sent)

## 🚧 Future Enhancements

- [ ] Price integration (API for item prices)
- [ ] Budget tracking
- [ ] Share list with family
- [ ] OCR for receipt scanning
- [ ] Advanced NLP (BERT, Hugging Face)
- [ ] User preferences customization
- [ ] Analytics dashboard

## 📄 License

MIT License - Built for technical interviews

## 🙋 Support

For issues or suggestions, create a GitHub issue.
