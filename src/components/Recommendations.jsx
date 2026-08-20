import { useState, useEffect } from 'react';
import { RecommendationService } from '../services/recommendationService';
import { CollaborativeFilteringService } from '../services/collaborativeFilteringService';
import { Plus, Lightbulb } from 'lucide-react';

export function Recommendations({ userId, onAddItem }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recType, setRecType] = useState('hybrid');

  useEffect(() => {
    if (!userId) return;

    const fetchRecommendations = async () => {
      setLoading(true);
      let recs;

      if (recType === 'hybrid') {
        recs = await CollaborativeFilteringService.getHybridRecommendations(userId);
      } else if (recType === 'collaborative') {
        recs = await CollaborativeFilteringService.getCollaborativeRecommendations(userId);
      } else {
        recs = await RecommendationService.getRecommendations(userId);
      }

      setRecommendations(recs);
      setLoading(false);
    };

    fetchRecommendations();
  }, [userId, recType]);

  if (loading) {
    return (
      <div className="recommendations">
        <div className="recommendations-header">
          <Lightbulb size={20} />
          <h3>Smart Suggestions</h3>
        </div>
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="recommendations">
      <div className="recommendations-header">
        <Lightbulb size={20} />
        <h3>Smart Suggestions</h3>

        <div className="rec-type-toggle">
          <button
            className={recType === 'hybrid' ? 'active' : ''}
            onClick={() => setRecType('hybrid')}
            title="Hybrid: 60% rules + 40% collaborative"
          >
            Hybrid
          </button>
          <button
            className={recType === 'rules' ? 'active' : ''}
            onClick={() => setRecType('rules')}
            title="Rules-based: frequency, seasonal, complementary"
          >
            Rules
          </button>
          <button
            className={recType === 'collaborative' ? 'active' : ''}
            onClick={() => setRecType('collaborative')}
            title="Collaborative: k-NN similar users"
          >
            Collaborative
          </button>
        </div>
      </div>

      <div className="recommendations-list">
        {recommendations.length === 0 ? (
          <p className="no-recs">💡 Add more items to get personalized recommendations!</p>
        ) : (
          recommendations.map((rec) => (
            <div key={rec.name} className="recommendation-card">
              <div className="rec-info">
                <h4>{rec.name}</h4>
                <p className="rec-reason">{rec.reason}</p>
                {rec.type === 'hybrid' && (
                  <span className="rec-badge">{rec.type}</span>
                )}
              </div>
              <button
                onClick={() => onAddItem({ name: rec.name, quantity: 1 })}
                className="add-btn"
                aria-label={`Add ${rec.name} to list`}
              >
                <Plus size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
