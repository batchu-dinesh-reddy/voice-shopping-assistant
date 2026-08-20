# Features & Use Cases

## Core Features

### 🎤 Voice Input

**What it does**:
- Click microphone button
- Speak naturally: "add milk", "remove eggs", "2 bottles of water"
- App captures voice and converts to text (Web Speech API)
- Automatically parses intent and adds/removes item

**Supported Commands**:
```
ADD (variations):
- "add milk"
- "i need eggs"
- "i want bread"
- "buy cheese"
- "get butter"
- "put yogurt"

ADD (with quantity):
- "add 2 bottles of milk"
- "buy 3 kg of tomatoes"
- "i need 1 box of cereal"

REMOVE (variations):
- "remove cheese"
- "delete eggs"
- "take out butter"
- "don't need milk"
- "i don't need yogurt"
- "don't buy bread"
```

**Browser Support**:
- ✅ Chrome/Edge (full)
- ✅ Firefox (full)
- ✅ Safari (iOS 14.5+)
- ❌ IE11 (not supported)

**Latency**: ~500ms (speak → item in list)

---

### 📝 Shopping List

**What it does**:
- Real-time list of items you need to buy
- Auto-grouped by category (dairy, produce, meat, etc.)
- Delete items individually
- Persistent (saved in Firestore)

**Categories**:
```
Dairy: milk, cheese, yogurt, butter, cream, ice cream
Produce: apple, banana, carrot, lettuce, tomato, orange, grape, etc.
Meat: chicken, beef, pork, fish, turkey, salmon
Grains: bread, pasta, rice, cereal, oats, flour
Beverages: coffee, tea, juice, water, soda, wine, milk
Snacks: chips, crackers, cookies, nuts, candy, popcorn
Frozen: pizza, ice cream, vegetables, meals
Pantry: oil, salt, sugar, spices, sauce, peanut butter
Other: (anything else)
```

**Example List**:
```
Dairy (3)
  🥛 Milk
  🧀 Cheese
  🧈 Butter

Produce (2)
  🍎 Apple
  🥕 Carrot

Beverages (1)
  ☕ Coffee
```

---

### 💡 Smart Recommendations

**What it does**:
- Suggests items you should add to your list
- Three recommendation modes:
  1. **Rules** (60% weight): Your personal patterns
  2. **Collaborative** (40% weight): What users like you buy
  3. **Hybrid** (default): Combination of both

**Recommendation Types**:

#### Rule 1: Frequency-Based
**When you should see it**: You've bought this item 2+ times in last 30 days
**Example**: "You bought this 5 times in the last 30 days"
**Items**: milk, bread, eggs, butter

#### Rule 2: Category Complementary
**When you should see it**: Related items (dairy → bread, meat → salt)
**Example**: "Goes well with milk"
**Items**: butter, bread, cereal

#### Rule 3: Seasonal
**When you should see it**: Item is in-season this month
**Example**: "In season this month"
**Items**: tomatoes (June), apples (September), cranberries (November)

#### Collaborative Filtering
**When you should see it**: Users with similar shopping habits bought this
**Example**: "Based on users with similar shopping habits"
**Items**: Discover new things within your taste

#### Hybrid (Default)
**When you should see it**: Multiple engines agree on recommendation
**Example**: "You bought this 3x + Based on similar users"
**Advantage**: High confidence, balanced discovery

**Example Recommendations**:
```
🧈 Butter
   Goes well with milk
   ➕ Add

🍅 Tomato (seasonal)
   In season this month
   ➕ Add

🍌 Banana
   Based on users like you
   ➕ Add

☕ Coffee
   You bought this 4 times in last 30 days
   ➕ Add
```

**How to Use**:
1. Toggle recommendation type: **Hybrid** | **Rules** | **Collaborative**
2. See suggestions update instantly
3. Click **➕** button to add to your list
4. Observe which type gives best recommendations for you

---

## Advanced Features

### Real-Time Sync
**What it does**: Your list updates instantly across devices
- Add item on phone → Desktop shows it immediately
- Delete on web → Mobile reflects instantly
- Powered by Firestore subscriptions
- No manual refresh needed

### Purchase History
**What it does**: App learns from your past purchases
- Tracks items for last 30 days (recommendations) / 90 days (collaborative)
- Uses frequency, patterns, seasonality
- Improves recommendations over time

### Anonymous Login
**What it does**: No sign-up required
- Each device gets unique ID
- Data only visible to that device
- Optional: Later add named login

### Category Auto-Detection
**What it does**: Automatically categorizes items
- "milk" → dairy
- "apple" → produce
- "chicken" → meat
- Allows smart grouping in UI

---

## Use Cases

### Use Case 1: Busy Professional

**Scenario**: Sarah works 9-5, barely has time to cook

**How she uses it**:
1. Voice input at lunch: "add chicken breasts", "add rice", "add olive oil"
2. Gets home, opens app on phone
3. Shopping list ready with categories
4. Goes to store, checks off items as she buys them
5. Next week, recommendations suggest meals she hasn't tried

**Benefits**:
- ✅ Hands-free while multitasking
- ✅ No forgotten items
- ✅ Discovers new recipes via collaborative filtering

### Use Case 2: Family Grocery Planning

**Scenario**: Family of 4 needs coordinated shopping

**How they use it**:
1. Parents add items throughout week:
   - Mom: "add milk, bread, eggs" (Mon)
   - Dad: "add chicken, beef" (Wed)
   - Kids: "add pizza" (Thu)
2. App groups by category automatically
3. One person takes list to store
4. Real-time updates if anyone adds item during shopping

**Benefits**:
- ✅ One shared list (instead of 4 separate ones)
- ✅ No duplicate items
- ✅ Easy to see what's needed
- ⚠️ Note: Currently anonymous per device; would need family account feature

### Use Case 3: Meal Prep Enthusiast

**Scenario**: Alex does meal prep every Sunday

**How they use it**:
1. Plan meals for the week
2. Add items via voice: "add chicken thighs", "add sweet potatoes", "add broccoli"
3. Get recommendations: App suggests complementary items (olive oil, salt, pepper)
4. Check seasonal recommendations: "tomatoes in season this month"
5. Go to store with organized list grouped by section

**Benefits**:
- ✅ Fast item entry via voice
- ✅ Don't forget seasonings/oils
- ✅ Save money with seasonal produce
- ✅ More efficient shopping

### Use Case 4: Dietary Restrictions

**Scenario**: Vegan person needs to avoid animal products

**How they use it**:
1. Build history over time by adding only vegan items
2. Collaborative filtering learns their pattern
3. Get recommendations only from similar vegans
4. Discover new vegan brands/products

**Benefits**:
- ✅ Personalized to dietary needs
- ✅ Discover community of similar shoppers
- ✅ New product recommendations within constraints

### Use Case 5: Student on Budget

**Scenario**: College student with limited budget

**How they use it**:
1. Add cheap staples regularly: rice, beans, eggs, pasta
2. Get recommendations for complementary items
3. Check seasonal: cheaper produce varies by season
4. Rules engine learns their budget-friendly patterns

**Benefits**:
- ✅ No costly impulse buying
- ✅ Fast to make shopping list
- ✅ Reminders of staple items

---

## Voice Command Examples

### Basic ADD
```
User: "add milk"
Result: {name: 'milk', quantity: 1} → Added to list

User: "i need eggs"
Result: {name: 'eggs', quantity: 1} → Added to list

User: "buy bread"
Result: {name: 'bread', quantity: 1} → Added to list
```

### ADD with Quantity
```
User: "add 2 bottles of milk"
Result: {name: 'milk', quantity: 2, unit: 'bottles'} → Added with quantity

User: "get 1 kg of tomatoes"
Result: {name: 'tomatoes', quantity: 1, unit: 'kg'} → Added with quantity

User: "i need 3 boxes of cereal"
Result: {name: 'cereal', quantity: 3, unit: 'boxes'} → Added with quantity
```

### REMOVE
```
User: "remove cheese"
Result: Cheese removed from list

User: "delete butter"
Result: Butter removed from list

User: "don't need milk"
Result: Milk removed from list
```

---

## Tips & Tricks

### Tip 1: Use Specific Quantities
**Instead of**: "add milk"
**Say**: "add 2 liters of milk"
**Why**: More useful when shopping (know exactly how much)

### Tip 2: Check All Recommendation Types
**Rules**: Shows your patterns (reliable)
**Collaborative**: Shows community favorites (discovery)
**Hybrid**: Best of both (recommended)

### Tip 3: Build History for Better Recommendations
**After 1 day**: Mostly seasonal items
**After 1 week**: Some frequency-based items
**After 1 month**: Full personalized recommendations
**After 3 months**: Accurate collaborative filtering

### Tip 4: Review Recommendations Before Buying
**Hybrid recommendations** might suggest items you:
- Already have at home
- Dislike but similar users like
- Are expensive this month

### Tip 5: Seasonal Shopping
**In-season items** are usually:
- Cheaper
- Fresher
- Better quality
- More nutritious

App highlights seasonal items — take advantage!

---

## Future Feature Ideas

- [ ] 💰 Price tracking (alert when price drops)
- [ ] 💵 Budget tracking (alert when over budget)
- [ ] 👥 Share list with family
- [ ] 📸 Scan receipts (OCR)
- [ ] 🏪 Store integration (Instacart, Amazon Fresh)
- [ ] 📊 Nutrition tracking (calories, macros)
- [ ] 🏷️ Coupon integration
- [ ] 📱 Mobile app (iOS/Android)
- [ ] 🔊 Better speech recognition (Whisper API)
- [ ] 🤖 Advanced NLP (BERT, GPT-3)
- [ ] 📈 Analytics dashboard
- [ ] 🎯 Personalization settings (adjust rec weights)

---

## FAQ

### Q: Is my data private?
**A**: Yes! Data is anonymous and only visible to your device. Each device gets unique ID. We don't track you.

### Q: Can multiple people use the same device?
**A**: Currently no (one ID per device). Future: Family accounts.

### Q: How many items can I have?
**A**: Unlimited! Firestore supports millions of items per user.

### Q: Works offline?
**A**: Voice input: No (needs internet for Web Speech API). Firebase: Yes (offline cache, syncs when online).

### Q: Mobile friendly?
**A**: Yes! Works on iOS Safari and Android Chrome. Voice input works on mobile too.

### Q: Can I export my list?
**A**: Currently no. Future: CSV export.

### Q: Why are recommendations sometimes weird?
**A**: 
- Collaborative: You're the only user with that pattern
- Rules: Not enough purchase history yet
- Solution: Add more items, wait a few days

### Q: Can I turn off recommendations?
**A**: Yes, just don't click them 😊

---

## Support

Having issues? Check:
1. **README.md** - Setup instructions
2. **SETUP.md** - Troubleshooting
3. **GitHub Issues** - Report bugs
4. **Firebase Docs** - Database questions

---

Enjoy your personalized shopping experience! 🛒✨
