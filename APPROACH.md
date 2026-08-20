# Technical Approach & ML Deep Dive

## Problem Statement

Design a voice-controlled shopping list app with smart recommendations. Recommendations should be:
1. **Fast** (interactive, not batch)
2. **Personalized** (learns from user behavior)
3. **Interpretable** (user understands "why")
4. **Scalable** (works for 1 user → 1M users)

## Dataset

**Source**: User's own shopping history
- Items they've purchased in last 30-90 days
- Stored in Firestore (app-generated data)
- No external dataset needed
- Purely collaborative filtering on user data

**Example Data**:
```
User A (30 days): [milk, bread, cheese, eggs, butter, apple, orange]
User B (30 days): [milk, bread, eggs, butter, tomato, lettuce]
User C (30 days): [milk, yogurt, butter, banana, grapes]
```

## Recommendation Approaches Considered

### Option 1: Rules-Based Only ❌ Rejected
**Pros**: Fast, interpretable, no cold-start
**Cons**: Boring, no discovery, doesn't scale with community
**Verdict**: Good but incomplete

### Option 2: Collaborative Filtering Only ❌ Rejected
**Pros**: Discovers patterns, community-driven
**Cons**: Slow with many users, hard to interpret, cold-start problem
**Verdict**: Overkill for shopping (domain too simple)

### Option 3: Content-Based (Item Features) ❌ Rejected
**Pros**: Interpretable, scales well
**Cons**: Requires item metadata (prices, ingredients, etc.)
**Verdict**: Not available in this app

### Option 4: Hybrid (Rules + Collaborative) ✅ CHOSEN
**Pros**: Best of both worlds
- Rules provide quick, personal wins
- Collaborative adds serendipity
- Hybrid weight is tunable (60/40)
**Cons**: Complexity
**Verdict**: Sweet spot for shopping

## Algorithm Design

### Part 1: Rules-Based Engine

#### Rule 1: Frequency-Based Recommendations
**Intuition**: If you've bought milk 5 times in 30 days, you'll probably buy it again.

**Formula**:
```
score(item) = frequency_count(item, 30_days)
filter: score >= 2 (bought at least twice)
```

**Example**:
- Milk: bought 5 times → score 5 ✅ Recommend
- Bread: bought 3 times → score 3 ✅ Recommend
- Lobster: bought 1 time → score 1 ❌ Skip

**Code**:
```javascript
static getFrequentItems(history, minFrequency = 2) {
  const itemFrequency = {};
  history.forEach(item => {
    const key = item.name.toLowerCase();
    itemFrequency[key] = (itemFrequency[key] || 0) + 1;
  });
  
  return Object.entries(itemFrequency)
    .filter(([_, count]) => count >= minFrequency)
    .map(([name, frequency]) => ({
      name,
      score: frequency,
      reason: `You bought this ${frequency} times`
    }));
}
```

#### Rule 2: Category Complementary Items
**Intuition**: People who buy milk also buy butter, bread, cheese (dairy/breakfast staples).

**Pre-computed Complement Map**:
```javascript
COMPLEMENTS = {
  'dairy': ['bread', 'butter', 'cereal'],
  'produce': ['olive oil', 'salt', 'pepper'],
  'meat': ['salt', 'pepper', 'oil'],
  ...
}
```

**Formula**:
```
score(complement) = score(parent_item) × 0.7
reason: "Goes well with [parent_item]"
```

**Example**:
- User frequently buys milk (score 5)
- Milk is in dairy category
- Recommend: butter (5 × 0.7 = 3.5), bread (3.5), cereal (3.5)

**Code**:
```javascript
static getCategoryComplementaryItems(frequentItems) {
  const recommendations = [];
  frequentItems.forEach(item => {
    const category = FirestoreService.categorizeItem(item.name);
    const complementaryItems = COMPLEMENTS[category] || [];
    
    complementaryItems.forEach(comp => {
      recommendations.push({
        name: this.capitalize(comp),
        score: item.frequency * 0.7,  // Decay by 0.7
        reason: `Goes well with ${item.name}`
      });
    });
  });
  return recommendations;
}
```

#### Rule 3: Seasonal Items
**Intuition**: People buy tomatoes in summer, cranberries in winter.

**Pre-computed Seasonal Map**:
```javascript
SEASONAL = {
  1: ['oranges', 'lemons', 'kale'],      // January
  6: ['tomatoes', 'berries', 'zucchini'], // June
  12: ['cranberries', 'nuts', 'cookies'],  // December
  ...
}
```

**Formula**:
```
current_month = new Date().getMonth() + 1
score(seasonal_item) = 0.8 (constant, low priority)
```

**Example** (June):
- Recommend: tomatoes (0.8), berries (0.8), zucchini (0.8)
- Reason: "In season this month"

#### Combining Rules
1. Get frequent items (Rule 1)
2. Get complements (Rule 2)
3. Get seasonal (Rule 3)
4. Merge all, deduplicate by item name
5. Sort by score, return top-5

**Complexity**: O(n) where n = history size (~100)

---

### Part 2: Collaborative Filtering (k-NN)

#### User Representation
**User Vector**: Binary set of items they've bought

```javascript
User A vector (90 days): {milk, bread, cheese, eggs, butter, apple}
User B vector (90 days): {milk, bread, eggs, butter, tomato, lettuce}
User C vector (90 days): {milk, yogurt, butter, banana, grapes}
```

#### Similarity Metric: Jaccard Index
**Why Jaccard?**
- Items are discrete (not continuous vectors)
- Set-based: natural for "did they buy this" (yes/no)
- Interpretable: fraction of common items
- Sparse-friendly: most users don't overlap much

**Formula**:
```
Jaccard(A, B) = |A ∩ B| / |A ∪ B|
Range: [0, 1]
```

**Example**:
```
User A: {milk, bread, cheese, eggs, butter, apple}
User B: {milk, bread, eggs, butter, tomato, lettuce}

Intersection: {milk, bread, eggs, butter} = 4 items
Union: {milk, bread, cheese, eggs, butter, apple, tomato, lettuce} = 8 items

Jaccard = 4 / 8 = 0.5 ✅ Similarity score
```

**Code**:
```javascript
static calculateJaccardSimilarity(userA, userB) {
  if (userA.size === 0 || userB.size === 0) return 0;
  
  const intersection = new Set([...userA].filter(x => userB.has(x)));
  const union = new Set([...userA, ...userB]);
  
  return intersection.size / union.size;  // [0, 1]
}
```

#### Algorithm: k-NN Collaborative Filtering

**Step 1: Find Similar Users**
```
1. Get target user's vector: {milk, bread, cheese, eggs, butter, apple}
2. For each other user in database:
   - Calculate Jaccard similarity
   - Keep if similarity > 0
3. Sort by similarity
4. Return top-k (k=5)
```

**Code**:
```javascript
static async findSimilarUsers(userId, topK = 5) {
  const targetUserVector = await this.getUserVector(userId);
  const usersRef = collection(db, 'users');
  const snapshot = await getDocs(usersRef);
  
  const similarities = [];
  for (let doc of snapshot.docs) {
    const otherUserId = doc.id;
    if (otherUserId === userId) continue;  // Skip self
    
    const otherUserVector = await this.getUserVector(otherUserId);
    const similarity = this.calculateJaccardSimilarity(
      targetUserVector,
      otherUserVector
    );
    
    if (similarity > 0) {
      similarities.push({
        userId: otherUserId,
        similarity,
        vector: otherUserVector
      });
    }
  }
  
  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}
```

**Example**:
```
Target User A: {milk, bread, cheese, eggs, butter, apple}

User B Similarity: 0.50 (common: milk, bread, eggs, butter)
User C Similarity: 0.40 (common: milk, butter)
User D Similarity: 0.30 (common: bread, apple)
User E Similarity: 0.20 (common: milk)
User F Similarity: 0.10 (common: apple)

Top-5 similar: [B(0.50), C(0.40), D(0.30), E(0.20), F(0.10)]
```

**Step 2: Get Items from Similar Users**
```
1. For each similar user's vector:
   - Get all items
   - Exclude items target user already bought
   - Score by: similarity of that user
2. Aggregate:
   - If 2 similar users recommend tomato, score increases
3. Sort by score, return top-5
```

**Formula**:
```
score(item) = Σ similarity(user) for all users who bought item
           (and target user hasn't bought it)
```

**Code**:
```javascript
const itemScores = {};

similarUsers.forEach(({ similarity, vector }) => {
  vector.forEach(item => {
    // Don't recommend items they already have
    if (!targetUserVector.has(item)) {
      itemScores[item] = (itemScores[item] || 0) + similarity;
    }
  });
});

const recommendations = Object.entries(itemScores)
  .map(([name, score]) => ({ name, score, reason: 'Based on users like you' }))
  .sort((a, b) => b.score - a.score)
  .slice(0, 5);
```

**Example**:
```
Target User A items: {milk, bread, cheese, eggs, butter, apple}

Similar users have:
- User B (sim=0.50): {milk, bread, eggs, butter, tomato, lettuce}
- User C (sim=0.40): {milk, yogurt, butter, banana, grapes}
- User D (sim=0.30): {bread, apple, orange, salmon}

Items not in A:
- tomato: 0.50 (from B)
- lettuce: 0.50 (from B)
- yogurt: 0.40 (from C)
- banana: 0.40 (from C)
- grapes: 0.40 (from C)
- orange: 0.30 (from D)
- salmon: 0.30 (from D)

Top-5: tomato(0.50), lettuce(0.50), yogurt(0.40), banana(0.40), grapes(0.40)
```

**Complexity**: O(U × H) where U = number of users, H = avg items per user
- For 1000 users, 100 items avg: ~100k comparisons (~1 second)

---

### Part 3: Hybrid Recommendations

**Idea**: Combine both engines, weight them

**Formula**:
```
final_score(item) = rules_score(item) × 0.6 + collab_score(item) × 0.4
```

**Why 60/40?**
- 60% rules: High confidence in personal patterns
- 40% collab: Lower confidence, use for "surprise me" factor
- Tunable: Can adjust based on A/B testing

**Code**:
```javascript
static async getHybridRecommendations(userId) {
  // Get both types
  const rulesRecs = await RecommendationService.getRecommendations(userId);
  const collaborativeRecs = await this.getCollaborativeRecommendations(userId);
  
  // Weight them
  rulesRecs.forEach(rec => rec.score = (rec.score || 1) * 0.6);
  collaborativeRecs.forEach(rec => rec.score = (rec.score || 1) * 0.4);
  
  // Merge by item name
  const merged = {};
  [...rulesRecs, ...collaborativeRecs].forEach(rec => {
    const key = rec.name.toLowerCase();
    if (!merged[key]) {
      merged[key] = { ...rec, type: 'hybrid' };
    } else {
      merged[key].score += rec.score;  // Sum scores if in both
      merged[key].reason = `${merged[key].reason} + ${rec.reason}`;
    }
  });
  
  // Return top-5
  return Object.values(merged)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}
```

**Example**:
```
Rules recommendations:
- milk: 5.0 × 0.6 = 3.0 (frequent)
- butter: 3.5 × 0.6 = 2.1 (complement)
- tomato: 0.8 × 0.6 = 0.48 (seasonal)

Collaborative recommendations:
- yogurt: 0.8 × 0.4 = 0.32 (from similar users)
- chicken: 0.6 × 0.4 = 0.24 (from similar users)
- milk: 1.2 × 0.4 = 0.48 (also from similar users)

Merged (deduplicated):
- milk: 3.0 + 0.48 = 3.48 (both engines agree) ⭐
- butter: 2.1 (only rules) ⭐
- yogurt: 0.32 (only collab)
- tomato: 0.48 (only rules)
- chicken: 0.24 (only collab)

Top-5: [milk(3.48), butter(2.1), yogurt(0.32), tomato(0.48), chicken(0.24)]
```

---

## Comparison: Approaches

| Feature | Rules | Collaborative | Hybrid |
|---------|-------|----------------|--------|
| **Speed** | Fast (O(n)) | Slow (O(U×H)) | Medium |
| **Interpretability** | High | Low | Medium |
| **Personaliz.** | High | High | High |
| **Discovery** | Low | High | High |
| **Cold-start** | ✅ Works | ❌ Fails | ✅ Works |
| **Scalability** | ✅ Scales | ⚠️ Limited | ✅ Scales |
| **Community** | ❌ No | ✅ Yes | ✅ Yes |

**Verdict**: Hybrid is best for shopping (quick win + exploration)

---

## Trade-offs & Limitations

### Limitation 1: Jaccard Similarity
**Issue**: Treats all items equally
- Buying milk once = same weight as milk 10 times
- Solution: Weighted Jaccard (TF-IDF style)

### Limitation 2: No Item Features
**Issue**: Doesn't use price, nutrition, category
- Missing: "Buy similar-priced items" or "Healthy alternatives"
- Solution: Add content-based filtering layer

### Limitation 3: Temporal Decay
**Issue**: Old purchase = recent purchase (same weight)
- Missing: Recent trend (milk → oat milk?)
- Solution: Exponential decay: score × e^(-age_days/30)

### Limitation 4: Cold-Start
**Issue**: New users have no history
- Missing: Can't compute collaborative filtering
- Solution: Show popular items + default rules

### Limitation 5: Scalability
**Issue**: For 1M users, O(U×H) becomes slow
- Collaborative filtering: ~1000 seconds
- Solution: Approximate (sample users, not all)

---

## Evaluation Metrics

### For Recommendations
1. **Precision@5**: % recommended items user actually buys
2. **Recall@5**: % user's purchases that were recommended
3. **Diversity**: % recommended items outside user's normal purchase pattern
4. **Latency**: Time to compute recommendations (<500ms)

### For Voice
1. **WER** (Word Error Rate): Speech recognition accuracy
2. **Intent Accuracy**: % correctly parsed intents (ADD vs REMOVE)
3. **RTT** (Round-Trip Time): Voice input → Item in list

---

## Future Improvements

1. **Learned Weights**: Replace 60/40 with ML model learning
2. **Embeddings**: Use Word2Vec/BERT for semantic similarity
3. **Matrix Factorization**: SVD for latent factors
4. **Content-Based**: Combine with item metadata
5. **Context**: Time-of-day, day-of-week, holidays
6. **Feedback Loop**: User explicitly rates recommendations

---

## Conclusion

**Dataset**: User's 30-90 day shopping history  
**Approach**: Hybrid (60% rules + 40% collaborative filtering)  
**Metric**: Jaccard similarity for user-user similarity  
**Complexity**: O(n) rules + O(U×H) collaborative = manageable for 10k users  
**Result**: Fast, interpretable, personalized, scalable recommendations 🎯
