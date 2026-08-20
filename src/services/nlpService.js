/**
 * NLPService
 * Simple regex-based NLP for intent parsing
 * Handles: ADD, REMOVE intents with quantity extraction
 */
export class NLPService {
  constructor() {
    this.addPatterns = [
      /^add\s+(.+)/i,
      /^i need\s+(.+)/i,
      /^i want\s+(.+)/i,
      /^buy\s+(.+)/i,
      /^get\s+(.+)/i,
      /^put\s+(.+)/i,
    ];

    this.removePatterns = [
      /^remove\s+(.+)/i,
      /^delete\s+(.+)/i,
      /^take out\s+(.+)/i,
      /^don't need\s+(.+)/i,
      /^i don't need\s+(.+)/i,
      /^don't buy\s+(.+)/i,
    ];

    this.quantityPattern = /(\d+)\s+(bottles?|boxes?|packs?|kg|lbs?|cups?|liters?|gallons?|pieces?|items?)\s+of\s+(.+)/i;
  }

  parseIntent(text) {
    if (!text || text.trim().length === 0) {
      return { intent: 'UNKNOWN', fullText: text };
    }

    // Check for REMOVE intent first (higher priority)
    for (let pattern of this.removePatterns) {
      const match = text.match(pattern);
      if (match) {
        return {
          intent: 'REMOVE',
          item: match[1].trim(),
          fullText: text
        };
      }
    }

    // Check for quantity pattern
    const quantityMatch = text.match(this.quantityPattern);
    if (quantityMatch) {
      return {
        intent: 'ADD',
        item: quantityMatch[3].trim(),
        quantity: parseInt(quantityMatch[1]),
        unit: quantityMatch[2],
        fullText: text
      };
    }

    // Check for ADD intent
    for (let pattern of this.addPatterns) {
      const match = text.match(pattern);
      if (match) {
        return {
          intent: 'ADD',
          item: match[1].trim(),
          quantity: 1,
          fullText: text
        };
      }
    }

    // Default: treat as ADD
    return {
      intent: 'ADD',
      item: text.trim(),
      quantity: 1,
      fullText: text
    };
  }
}
