import { useState, useEffect } from 'react';
import { FirestoreService } from '../services/firestoreService';

export function useFirebase(userId) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    const unsubscribe = FirestoreService.subscribeToItems(userId, (items) => {
      setItems(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const addItem = async (itemData) => {
    try {
      setError(null);
      await FirestoreService.addItem(userId, itemData);
    } catch (err) {
      setError(err.message);
      console.error('Error adding item:', err);
    }
  };

  const removeItem = async (itemId) => {
    try {
      setError(null);
      await FirestoreService.removeItem(userId, itemId);
    } catch (err) {
      setError(err.message);
      console.error('Error removing item:', err);
    }
  };

  return {
    items,
    loading,
    error,
    addItem,
    removeItem
  };
}
