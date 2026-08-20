/**
 * FirestoreService
 * Handles all Firestore operations for shopping list items
 */
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  onSnapshot,
  Timestamp,
  orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';

const CATEGORIES = {
  'dairy': ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'ice cream'],
  'produce': ['apple', 'banana', 'carrot', 'lettuce', 'tomato', 'orange', 'grape', 'strawberry', 'broccoli', 'spinach'],
  'meat': ['chicken', 'beef', 'pork', 'fish', 'turkey', 'salmon'],
  'grains': ['bread', 'pasta', 'rice', 'cereal', 'oats', 'flour'],
  'beverages': ['coffee', 'tea', 'juice', 'water', 'soda', 'milk', 'wine'],
  'snacks': ['chips', 'crackers', 'cookies', 'nuts', 'candy', 'popcorn'],
  'frozen': ['pizza', 'ice cream', 'vegetables', 'meals'],
  'pantry': ['oil', 'salt', 'sugar', 'spices', 'sauce', 'peanut butter'],
};

export class FirestoreService {
  /**
   * Add item to shopping list
   */
  static async addItem(userId, itemData) {
    try {
      const itemsRef = collection(db, 'users', userId, 'items');
      const docRef = await addDoc(itemsRef, {
        name: itemData.name.toLowerCase(),
        quantity: itemData.quantity || 1,
        unit: itemData.unit || '',
        category: this.categorizeItem(itemData.name),
        completed: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        voiceInput: itemData.voiceInput || '',
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding item:', error);
      throw error;
    }
  }

  /**
   * Remove item from shopping list
   */
  static async removeItem(userId, itemId) {
    try {
      await deleteDoc(doc(db, 'users', userId, 'items', itemId));
    } catch (error) {
      console.error('Error removing item:', error);
      throw error;
    }
  }

  /**
   * Get all non-completed items
   */
  static async getItems(userId) {
    try {
      const itemsRef = collection(db, 'users', userId, 'items');
      const q = query(
        itemsRef,
        where('completed', '==', false),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting items:', error);
      return [];
    }
  }

  /**
   * Subscribe to real-time item updates
   */
  static subscribeToItems(userId, callback) {
    try {
      const itemsRef = collection(db, 'users', userId, 'items');
      const q = query(
        itemsRef,
        where('completed', '==', false),
        orderBy('createdAt', 'desc')
      );

      return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(items);
      }, (error) => {
        console.error('Error subscribing to items:', error);
      });
    } catch (error) {
      console.error('Error setting up subscription:', error);
      return () => {};
    }
  }

  /**
   * Categorize item based on name
   */
  static categorizeItem(itemName) {
    const lower = itemName.toLowerCase();
    for (let [category, items] of Object.entries(CATEGORIES)) {
      if (items.some(item => lower.includes(item))) {
        return category;
      }
    }
    return 'other';
  }

  /**
   * Get purchase history for recommendation engine
   */
  static async getPurchaseHistory(userId, days = 30) {
    try {
      const itemsRef = collection(db, 'users', userId, 'items');
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - days);

      const q = query(
        itemsRef,
        where('createdAt', '>=', Timestamp.fromDate(pastDate))
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error('Error getting purchase history:', error);
      return [];
    }
  }
}
