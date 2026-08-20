import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth } from './config/firebase';
import { VoiceInput } from './components/VoiceInput';
import { ShoppingList } from './components/ShoppingList';
import { Recommendations } from './components/Recommendations';
import { FirestoreService } from './services/firestoreService';
import './App.css';

export default function App() {
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          setUserId(user.uid);
        } else {
          // Sign in anonymously
          const result = await signInAnonymously(auth);
          setUserId(result.user.uid);
        }
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleIntentDetected = async (intent) => {
    if (!userId) return;

    try {
      if (intent.intent === 'ADD') {
        await FirestoreService.addItem(userId, {
          name: intent.item,
          quantity: intent.quantity || 1,
          unit: intent.unit,
          voiceInput: intent.fullText
        });
      } else if (intent.intent === 'REMOVE') {
        // In a real app, we'd search for the item first
        // For now, we'll just log it
        console.log('Remove intent:', intent.item);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error processing intent:', err);
    }
  };

  const handleRemoveItem = async (itemId) => {
    if (!userId) return;
    try {
      await FirestoreService.removeItem(userId, itemId);
    } catch (err) {
      setError(err.message);
      console.error('Error removing item:', err);
    }
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header>
        <h1>🛒 Voice Shopping Assistant</h1>
        <p>Talk to add items, get smart recommendations</p>
      </header>

      {error && (
        <div className="app-error">
          <button onClick={() => setError(null)}>✕</button>
          <p>{error}</p>
        </div>
      )}

      <main>
        <VoiceInput onIntentDetected={handleIntentDetected} />
        <ShoppingList userId={userId} onRemoveItem={handleRemoveItem} />
        <Recommendations userId={userId} onAddItem={handleIntentDetected} />
      </main>

      <footer>
        <p>Made with ❤️ • Voice Shopping Assistant v1.0</p>
      </footer>
    </div>
  );
}
