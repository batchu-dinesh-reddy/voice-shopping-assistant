import { Mic, Square } from 'lucide-react';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import React from 'react';

export function VoiceInput({ onIntentDetected }) {
  const { isListening, error, intent, startListening, stopListening } = useVoiceRecognition();

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  React.useEffect(() => {
    if (intent) {
      onIntentDetected(intent);
    }
  }, [intent, onIntentDetected]);

  return (
    <div className="voice-input-container">
      <button
        onClick={handleMicClick}
        className={`mic-button ${isListening ? 'listening' : ''}`}
        aria-label={isListening ? 'Stop listening' : 'Start listening'}
      >
        {isListening ? (
          <Square size={24} className="animate-pulse" />
        ) : (
          <Mic size={24} />
        )}
      </button>

      {error && <div className="error-message">❌ {error}</div>}

      {isListening && (
        <div className="listening-indicator">🎤 Listening...</div>
      )}
    </div>
  );
}
