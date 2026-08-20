# Architecture & Design Decisions

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│  ┌─────────────┐  ┌────────────┐  ┌────────────────┐   │
│  │ VoiceInput  │  │ ItemCard   │  │ Recommendations│   │
│  └──────┬──────┘  └────────────┘  └────────────────┘   │
└─────────┼─────────────────────────────────────────────────┘
          │
    ┌─────▼────────────────────────────────┐
    │        Service Layer                  │
    │  ┌──────────┐  ┌────────────────┐    │
    │  │ Voice    │  │ Recommendation │    │
    │  │ Service  │  │ Services       │    │
    │  └──────────┘  └────────────────┘    │
    │  ┌──────────┐  ┌────────────────┐    │
    │  │ NLP      │  │ Collaborative  │    │
    │  │ Service  │  │ Filtering      │    │
    │  └──────────┘  └────────────────┘    │
    │  ┌──────────────────────────┐        │
    │  │ Firestore Service        │        │
    │  └──────────────────────────┘        │
    └─────┬───────���───────────────────────┘
          │
    ┌─────▼──────────────────┐
    │   Firebase Firestore   │
    │   (Real-time DB)       │
    └────────────────────────┘
```

## Why These Choices?

### 1. Voice Input (Web Speech API)
- ✅ No backend required, runs in browser
- ✅ Free, no API key needed
- ✅ Natural language for shopping is intuitive
- ⚠️ Trade-off: Limited browser support

### 2. NLP (Regex-based)
- ✅ Lightweight, predictable for shopping domain
- ✅ Fast, no ML model loading
- ⚠️ Trade-off: Not robust for complex sentences
- 🎯 Sufficient for: "add milk", "remove eggs", "2 bottles of water"

### 3. Firestore
- ✅ Real-time subscriptions (no polling)
- ✅ Built-in auth integration
- ✅ Scalable to millions of users
- ✅ Free tier for prototyping
- ⚠️ Trade-off: Limited query flexibility

### 4. Recommendation: Hybrid Approach
- **Rules-based** (60%):
  - Interpretable (users understand why)
  - Personalized to individual behavior
  - Zero cold-start (works day 1)
  - Fast (no similarity computation)

- **Collaborative Filtering** (40%):
  - Discovers patterns from community
  - Surprises (find items outside personal routine)
  - Improves over time with more users
  
- **Hybrid Weight (60/40)**:
  - 60% rules: High confidence in user's patterns
  - 40% collab: Low confidence, use as secondary
  - Adjustable for different use cases

### 5. Jaccard Similarity (vs Cosine/Euclidean)
- ✅ Set-based (items are discrete, not continuous)
- ✅ Interpretable: |common items| / |total items|
- ✅ Works with sparse data (most users haven't bought most items)
- ✅ No need for vector dimensionality

## Key Design Decisions

### Decision 1: Anonymous Auth
**Why**: No login friction, instant use
- Firebase anonymous auth signs up automatically
- Each device gets unique userId
- Optional: Later upgrade to named accounts

### Decision 2: Client-Side ML
**Why**: Privacy + cost efficiency
- User data never leaves their device (except to Firestore)
- No backend inference server needed
- Scales to millions without server cost

### Decision 3: Category Mapping
**Why**: Better UX via grouping
- Manual category mapping (not ML classifier)
- Regex pattern: "milk" → dairy, "apple" → produce
- UI groups by category in shopping list
- Recommendation rule uses category complementarity

### Decision 4: 30-day History Window
**Why**: Balance recency vs stability
- 30 days = ~4 weeks, captures most recurring patterns
- Too short (7 days): Noise from one-time purchases
- Too long (90 days): Miss seasonal changes
- Collaborative filtering uses 90 days (more data for similarity)

### Decision 5: Top-5 Recommendations
**Why**: Cognitive load vs discovery
- More than 5: User overwhelmed
- Less than 3: Feels empty
- 5 strikes balance

## Data Flow

### Adding an Item
```
1. User: "add 2 bottles of milk"
2. VoiceService: Captures audio → "add 2 bottles of milk"
3. NLPService: Parse → {intent: 'ADD', item: 'milk', quantity: 2, unit: 'bottles'}
4. App.jsx: handleIntentDetected → FirestoreService.addItem()
5. FirestoreService: 
   - Categorize: milk → dairy
   - Store: {name: 'milk', quantity: 2, unit: 'bottles', category: 'dairy', createdAt: NOW}
6. Firestore: Write to users/{userId}/items/{itemId}
7. useFirebase Hook: Subscription fires → setItems()
8. ShoppingList: Re-render with new item in dairy category
```

### Getting Recommendations
```
1. User: Toggles "Hybrid" mode
2. Recommendations.jsx: Calls CollaborativeFilteringService.getHybridRecommendations(userId)
3. Service:
   a. Get user's history (30 days) → [milk, bread, cheese, eggs, ...]
   b. Rules engine:
      - Frequency: milk 3x → score 3
      - Complements: butter → score 3×0.7 = 2.1
      - Seasonal: tomatoes → score 0.8
   c. Collaborative filtering:
      - Find similar users via Jaccard
      - Their items we don't have → score by summed similarity
   d. Merge + weight:
      - Rules: score × 0.6
      - Collab: score × 0.4
      - Sum, sort, top-5
4. UI: Display with reasons ("You bought this 3x", "Based on users like you")
```

## Performance Considerations

### Speed Optimizations
- Voice recognition: Real-time (no latency)
- NLP: Regex parsing in <10ms
- Firestore: Subscriptions (not polling)
- Recommendations: Cached in component state, only recompute on toggle

### Scalability
- Users: Firebase scales to millions
- Items per user: Firestore queries limited to active items (where completed == false)
- Collaborative filtering: Efficient for up to 10k users (O(n) similarity checks)
- For 100k+ users: Would need to shard or use sampling

## Error Handling

1. **Voice API not supported**: Fallback to text input
2. **Firestore offline**: Local cache persists
3. **NLP parse failure**: Default to ADD intent
4. **Empty history**: Show default recommendations
5. **Similarity = 0**: Return only rules recommendations

## Security & Privacy

- ✅ User data encrypted at rest (Firestore)
- ✅ Data only visible to that user (Firestore rules)
- ✅ No analytics/tracking
- ✅ No third-party API calls
- ✅ Anonymous (no email/password)

## Future: Scaling to Production

### Database Layer
- Add Elasticsearch for full-text search
- Add Redis cache for popular recommendations
- Shard users by region

### Backend (if needed)
- Node.js API for complex aggregations
- Background jobs for batch recommendation computation
- ML training pipeline (TensorFlow/PyTorch)

### Advanced ML
- Replace rules with learned weights (regression)
- Use embeddings (Word2Vec, BERT) for semantic similarity
- Add cold-start handling (content-based filtering)
- A/B test recommendation strategies

## Testing Strategy

### Unit Tests (Services)
```javascript
// NLP parsing
assert(nlp.parseIntent('add milk') == {intent: 'ADD', item: 'milk', quantity: 1})
assert(nlp.parseIntent('2 bottles of milk') == {intent: 'ADD', item: 'milk', quantity: 2, unit: 'bottles'})

// Jaccard similarity
assert(similarity({a,b,c}, {b,c,d}) == 2/4 == 0.5)
```

### Integration Tests (Components)
- Voice input → Firestore storage
- Firestore subscription → UI update
- Recommendation toggle → Fetch new recommendations

### E2E Tests (User Flows)
- Add 5 items → See them in list
- Toggle recommendation modes → See different results
- Add item from recommendation → Appears in list

## Metrics for Success

1. **Accuracy**: Do recommendations match user behavior?
2. **Diversity**: Mix of personalized + serendipitous items?
3. **Speed**: <200ms voice → item in UI?
4. **Adoption**: % users enabling voice vs typing?
5. **Engagement**: % users checking recommendations?
