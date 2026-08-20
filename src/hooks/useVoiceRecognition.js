import { useState, useCallback } from 'react';
import { VoiceService } from '../services/voiceService';
import { NLPService } from '../services/nlpService';

export function useVoiceRecognition() {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);
  const [intent, setIntent] = useState(null);

  const voiceService = new VoiceService();
  const nlpService = new NLPService();

  const startListening = useCallback(() => {
    setError(null);
    setTranscript('');
    voiceService.startListening(
      (result) => {
        setTranscript(result);
        const parsedIntent = nlpService.parseIntent(result);
        setIntent(parsedIntent);
        setIsListening(false);
      },
      (err) => {
        setError(err);
        setIsListening(false);
      }
    );
    setIsListening(true);
  }, []);

  const stopListening = useCallback(() => {
    voiceService.stopListening();
    setIsListening(false);
  }, []);

  return {
    transcript,
    isListening,
    error,
    intent,
    startListening,
    stopListening
  };
}
