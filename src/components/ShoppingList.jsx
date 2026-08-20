import { useFirebase } from '../hooks/useFirebase';
import { ItemCard } from './ItemCard';

export function ShoppingList({ userId, onRemoveItem }) {
  const { items, loading } = useFirebase(userId);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading your list...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="shopping-list">
        <h2>Shopping List</h2>
        <div className="empty-state">
          <p>📝 No items yet. Start by speaking an item!</p>
        </div>
      </div>
    );
  }

  // Group by category
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="shopping-list">
      <h2>Shopping List ({items.length})</h2>

      {Object.entries(groupedItems).map(([category, categoryItems]) => (
        <div key={category} className="category">
          <h3>{category.toUpperCase()}</h3>
          <div className="items">
            {categoryItems.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                onRemove={() => onRemoveItem(item.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
