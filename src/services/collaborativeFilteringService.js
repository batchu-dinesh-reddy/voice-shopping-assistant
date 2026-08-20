/**
 * CollaborativeFilteringService
 * ML-based k-NN collaborative filtering for personalized recommendations
 *
 * Algorithm:
 * 1. Build user vector (set of items they bought)
 * 2. Find similar users using Jaccard similarity
 * 3. Get items from similar users that target user hasn't bought
 * 4. Rank by score and return top-K
 */
import { FirestoreService } from './firestoreService';
import { RecommendationService } from './recommendationService';
import { db } from '../config/firebase';
import { collection, getDocs } from 'firebase/firestore';

export class CollaborativeFilteringService {
  /**
   * Get user vector (items they bought)
   */
  static async getUserVector(userId) {
    try {
      const history = await FirestoreService.getPurchaseHistory(userId, 90);
      return new Set(history.map(item => item.name.toLowerCase()));
    } catch (error) {
      console.error('Error getting user vector:', error);
      return new Set();
    }
  }

  /**
   * Calculate Jaccard Similarity between two users
   * Similarity = |A ∩ B| / |A ∪ B|
   * Range: 0 to 1
   */
  static calculateJaccardSimilarity(userA, userB) {
    if (userA.size === 0 || userB.size === 0) return 0;

    const intersection = new Set([...userA].filter(x => userB.has(x)));
    const union = new Set([...userA, ...userB]);

    if (union.size === 0) return 0;
    return intersection.size / union.size;
  }

  /**
   * Find similar users
   */
  static async findSimilarUsers(userId, topK = 5) {
    try {
      const targetUserVector = await this.getUserVector(userId);

      // Get all user IDs
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);

      const similarities = [];

      // Calculate similarity with each user
      for (let doc of snapshot.docs) {
        const otherUserId = doc.id;
        if (otherUserId === userId) continue;

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

      // Return top-K similar users
      return similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK);
    } catch (error) {
      console.error('Error finding similar users:', error);
      return [];
    }
  }

  /**
   * Get recommendations from similar users
   */
  static async getCollaborativeRecommendations(userId) {
    try {
      const targetUserVector = await this.getUserVector(userId);

      // If user has no history, return empty
      if (targetUserVector.size === 0) {
        return [];
      }

      const similarUsers = await this.findSimilarUsers(userId, topK=5);

      if (similarUsers.length === 0) {
        return [];
      }

      // Count items in similar users that target user hasn't bought
      const itemScores = {};

      similarUsers.forEach(({ similarity, vector }) => {
        vector.forEach(item => {
          // Don't recommend items they already bought
          if (!targetUserVector.has(item)) {
            itemScores[item] = (itemScores[item] || 0) + similarity;
          }
        });
      });

      // Convert to array and sort by score
      const recommendations = Object.entries(itemScores)
        .map(([name, score]) => ({
          name: RecommendationService.capitalize(name),
          score,
          reason: 'Based on users with similar shopping habits',
          type: 'collaborative'
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      return recommendations;
    } catch (error) {
      console.error('Error getting collaborative recommendations:', error);
      return [];
    }
  }

  /**
   * Hybrid recommendations: combine rules + collaborative filtering
   * Weight: 60% rules, 40% collaborative
   */
  static async getHybridRecommendations(userId) {
    try {
      // Get both types
      const rulesRecs = await RecommendationService.getRecommendations(userId);
      const collaborativeRecs = await this.getCollaborativeRecommendations(userId);

      // Score: rules get 0.6x weight, collaborative get 0.4x
      rulesRecs.forEach(rec => rec.score = (rec.score || 1) * 0.6);
      collaborativeRecs.forEach(rec => rec.score = (rec.score || 1) * 0.4);

      // Merge by item name
      const merged = {};

      [...rulesRecs, ...collaborativeRecs].forEach(rec => {
        const key = rec.name.toLowerCase();
        if (!merged[key]) {
          merged[key] = { ...rec, type: 'hybrid' };
        } else {
          merged[key].score += rec.score;
          merged[key].reason = `${merged[key].reason} + ${rec.reason}`;
        }
      });

      // Sort by score and return top 5
      return Object.values(merged)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
    } catch (error) {
      console.error('Error getting hybrid recommendations:', error);
      return [];
    }
  }
}
