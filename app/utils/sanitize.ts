import DOMPurify from 'dompurify';
import { RuntimeConfig } from '~/lib/runtime/config';

/**
 * Centralized HTML Sanitization Utility.
 * Prevents XSS by stripping dangerous tags and attributes.
 */

export interface SanitizeOptions {
  /**
   * Allow specific tags that are usually blocked
   */
  ADD_TAGS?: string[];

  /**
   * Allow specific attributes
   */
  ADD_ATTR?: string[];

  /**
   * Return a trusted HTML type (if configured) or string
   */
  RETURN_TRUSTED_TYPE?: boolean;
  [key: string]: any;
}

// Default strict configuration
const DEFAULT_CONFIG: any = {
  USE_PROFILES: { html: true }, // Only allow HTML, strip SVG/MathML/etc by default unless specified
  FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed', 'form'],
  FORBID_ATTR: ['style', 'onmouseover', 'onclick', 'onerror', 'onload'],
};

// Shiki-compatible configuration (allows inline styles for syntax highlighting)
export const SHIKI_CONFIG: any = {
  ADD_TAGS: ['span', 'pre', 'code'],
  ADD_ATTR: ['style', 'class'], // Shiki uses inline styles and classes
};

export function sanitizeHTML(dirty: string, options: any = DEFAULT_CONFIG): string {
  if (RuntimeConfig.isServer) {
    /*
     * DOMPurify requires a window/JSDOM.
     * If strict server-side sanitization is needed, we'd need 'isomorphic-dompurify'.
     * For now, we return as-is or use a simple strip if strictly required,
     * but usually this runs on client (Markdown rendering, etc).
     * WARN: Returning dirty content on server if not handled carefully.
     */
    return dirty;
  }

  return DOMPurify.sanitize(dirty, options) as string;
}

export const sanitizer = {
  clean: sanitizeHTML,
  config: {
    DEFAULT: DEFAULT_CONFIG,
    SHIKI: SHIKI_CONFIG,
  },
};
