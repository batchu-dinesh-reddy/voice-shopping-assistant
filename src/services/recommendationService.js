/**
 * RecommendationService
 * Rules-based recommendation engine
 * Rules:
 * 1. Frequency-based: Items user buys often
 * 2. Category complementary: Related items in same category
 * 3. Temporal patterns: Items bought on specific days
 * 4. Seasonal: Items based on current month
 */
import { FirestoreService } from './firestoreService';

const COMPLEMENTS = {
  'dairy': ['bread', 'butter', 'cereal', 'jam'],
  'produce': ['olive oil', 'salt', 'pepper', 'garlic'],
  'meat': ['salt', 'pepper', 'oil', 'spices'],
  'grains': ['butter', 'cheese', 'eggs', 'milk'],
  'snacks': ['beverages', 'water', 'juice'],
};

const SEASONAL = {
  1: ['oranges', 'lemons', 'kale', 'carrots'],
  2: ['strawberries', 'kiwi', 'cabbage'],
  3: ['asparagus', 'broccoli', 'spring onions'],
  4: ['lettuce', 'peas', 'spinach'],
  5: ['strawberries', 'cherries', 'artichokes'],
  6: ['tomatoes', 'berries', 'zucchini'],
  7: ['peaches', 'melons', 'cucumber'],
  8: ['grapes', 'berries', 'eggplant'],
  9: ['apples', 'pears', 'grapes'],
  10: ['pumpkin', 'squash', 'apples'],
  11: ['cranberries', 'brussels sprouts', 'turkey'],
  12: ['cranberries', 'nuts', 'cookies'],
};

export class RecommendationService {
  /**
   * Get recommendations based on rules engine
   */
  static async getRecommendations(userId) {
    try {
      const history = await FirestoreService.getPurchaseHistory(userId, 30);

      if (history.length === 0) {
        return this.getDefaultRecommendations();
      }

      const recommendations = [];

      // Rule 1: Frequency-based recommendations
      const frequentItems = this.getFrequentItems(history, 2);
      recommendations.push(...frequentItems);

      // Rule 2: Category complementary items
      const categoryRecs = this.getCategoryComplementaryItems(frequentItems);
      recommendations.push(...categoryRecs);

      // Rule 3: Seasonal items
      const seasonalItems = this.getSeasonalItems();
      recommendations.push(...seasonalItems);

      // Deduplicate and return top 5
      return this.deduplicateAndLimit(recommendations, 5);
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return this.getDefaultRecommendations();
    }
  }

  /**
   * Rule 1: Get items user frequently buys
   */
  static getFrequentItems(history, minFrequency = 2) {
    const itemFrequency = {};

    history.forEach(item => {
      const key = item.name.toLowerCase();
      itemFrequency[key] = (itemFrequency[key] || 0) + 1;
    });

    return Object.entries(itemFrequency)
      .filter(([_, count]) => count >= minFrequency)
      .sort(([_, countA], [__, countB]) => countB - countA)
      .slice(0, 3)
      .map(([name, frequency]) => ({
        name: this.capitalize(name),
        frequency,
        reason: `You bought this ${frequency} times in the last 30 days`,
        score: frequency
      }));
  }

  /**
   * Rule 2: Suggest complementary items
   */
  static getCategoryComplementaryItems(frequentItems) {
    const recommendations = [];

    frequentItems.forEach(item => {
      const category = FirestoreService.categorizeItem(item.name);
      const complementaryItems = COMPLEMENTS[category] || [];

      complementaryItems.forEach(comp => {
        recommendations.push({
          name: this.capitalize(comp),
          reason: `Goes well with ${item.name}`,
          score: item.frequency * 0.7
        });
      });
    });

    return recommendations;
  }

  /**
   * Rule 3: Seasonal recommendations
   */
  static getSeasonalItems() {
    const month = new Date().getMonth() + 1;
    const items = SEASONAL[month] || [];

    return items.map(item => ({
      name: this.capitalize(item),
      reason: 'In season this month',
      score: 0.8
    }));
  }

  /**
   * Default recommendations for new users
   */
  static getDefaultRecommendations() {
    return [
      { name: 'Milk', reason: 'Popular item', score: 1.0 },
      { name: 'Bread', reason: 'Popular item', score: 1.0 },
      { name: 'Eggs', reason: 'Popular item', score: 0.9 },
      { name: 'Butter', reason: 'Popular item', score: 0.9 },
      { name: 'Cheese', reason: 'Popular item', score: 0.8 },
    ];
  }

  /**
   * Deduplicate and limit recommendations
   */
  static deduplicateAndLimit(recommendations, limit = 5) {
    const seen = new Set();
    const unique = [];

    recommendations.sort((a, b) => b.score - a.score);

    for (let rec of recommendations) {
      const key = rec.name.toLowerCase();
      if (!seen.has(key)) {
        unique.push(rec);
        seen.add(key);
        if (unique.length >= limit) break;
      }
    }

    return unique;
  }

  static capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
