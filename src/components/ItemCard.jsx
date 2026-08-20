import { Trash2 } from 'lucide-react';

export function ItemCard({ item, onRemove }) {
  return (
    <div className="item-card">
      <div className="item-info">
        <h4>{item.name}</h4>
        {item.quantity > 1 && (
          <span className="quantity">{item.quantity} {item.unit || 'items'}</span>
        )}
      </div>
      <button 
        onClick={onRemove} 
        className="delete-btn"
        aria-label={`Remove ${item.name}`}
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}
