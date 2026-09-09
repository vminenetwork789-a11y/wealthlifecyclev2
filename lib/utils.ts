import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely retrieve the current origin without throwing DOMException in sandboxed / cross-origin iframes.
 */
export function getSafeOrigin(): string {
  if (typeof window === 'undefined') {
    return 'https://wealthlifecycle.io';
  }
  
  try {
    if (window.location && typeof window.location.href === 'string') {
      try {
        const parsed = new URL(window.location.href);
        if (parsed.origin && parsed.origin !== 'null') {
          return parsed.origin;
        }
      } catch {
        // Ignore URL parsing error
      }
    }
  } catch {
    // Suppress cross-origin frame access error
  }

  try {
    if (window.location && typeof window.location.origin === 'string' && window.location.origin !== 'null' && window.location.origin !== '') {
      return window.location.origin;
    }
  } catch {
    // Suppress cross-origin frame access error
  }

  try {
    if (window.location && window.location.protocol && window.location.host) {
      return `${window.location.protocol}//${window.location.host}`;
    }
  } catch {
    // Suppress cross-origin frame access error
  }

  return 'https://wealthlifecycle.io';
}

/**
 * Safely construct a referral link for a given ID without throwing cross-origin frame errors.
 */
export function getSafeReferralUrl(userId: number | string): string {
  try {
    const origin = getSafeOrigin();
    return `${origin}?ref=${userId}`;
  } catch {
    return `https://wealthlifecycle.io?ref=${userId}`;
  }
}

/**
 * Safely extract search query parameters (e.g. ?ref=123) without throwing cross-origin frame errors.
 */
export function getSafeQueryParam(key: string): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    if (window.location && typeof window.location.search === 'string' && window.location.search.length > 0) {
      const params = new URLSearchParams(window.location.search);
      return params.get(key);
    }
  } catch {
    // Suppress cross-origin frame access error
  }

  try {
    if (window.location && typeof window.location.href === 'string' && window.location.href.includes('?')) {
      const url = new URL(window.location.href);
      return url.searchParams.get(key);
    }
  } catch {
    // Suppress cross-origin frame access error
  }

  return null;
}

/**
 * Safely copy text to clipboard with fallback for sandboxed iframes.
 */
export async function copyToClipboardSafe(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to fallback
    }
  }

  // Fallback for document.execCommand('copy') in iframes
  if (typeof document !== 'undefined') {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch {
      return false;
    }
  }

  return false;
}
