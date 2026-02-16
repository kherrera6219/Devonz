// Output classification system

export type AIOutputClass =
  | 'CODE_CHANGE'
  | 'RESEARCH_REPORT'
  | 'SECURITY_ADVISORY'
  | 'UX_GUIDANCE'
  | 'SYSTEM_ERROR'
  | 'GENERAL_CHAT';

/**
 * AI Governance: Output Classification System
 * Categorizes AI-generated content for better orchestration and UI presentation.
 */
export class OutputClassifier {
  private static _instance: OutputClassifier;

  private constructor() {
    // Singleton
  }

  static getInstance(): OutputClassifier {
    if (!OutputClassifier._instance) {
      OutputClassifier._instance = new OutputClassifier();
    }

    return OutputClassifier._instance;
  }

  /**
   * Classifies the given text into one of the known output classes.
   */
  classify(text: string): AIOutputClass {
    const snippet = text.slice(0, 1000).toLowerCase();

    if (snippet.includes('<boltaction') || snippet.includes('diff --git')) {
      return 'CODE_CHANGE';
    }

    if (snippet.includes('security vulnerability') || snippet.includes('xss') || snippet.includes('injection')) {
      return 'SECURITY_ADVISORY';
    }

    if (
      snippet.includes('research find') ||
      snippet.includes('technical report') ||
      snippet.includes('documentation summary')
    ) {
      return 'RESEARCH_REPORT';
    }

    if (snippet.includes('accessibility') || snippet.includes('purity') || snippet.includes('contrast ratio')) {
      return 'UX_GUIDANCE';
    }

    if (snippet.includes('error') && snippet.includes('failed to')) {
      return 'SYSTEM_ERROR';
    }

    return 'GENERAL_CHAT';
  }
}

export const outputClassifier = OutputClassifier.getInstance();
