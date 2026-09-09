'use client';

import { useEffect } from 'react';

/**
 * CrossFrameGuard prevents unhandled promise rejections and DOMExceptions
 * caused by browser extensions or sandboxed cross-origin iframes attempting
 * to inspect window.parent.location or window.top.location.
 */
export function CrossFrameGuard() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isCrossOriginError = (reasonOrMsg: unknown): boolean => {
      try {
        if (!reasonOrMsg) return false;
        let str = '';
        if (typeof reasonOrMsg === 'string') {
          str = reasonOrMsg;
        } else if (typeof reasonOrMsg === 'object') {
          const err = reasonOrMsg as { message?: string; name?: string; stack?: string; toString?: () => string };
          str = `${err.name || ''} ${err.message || ''} ${err.stack || ''} ${err.toString?.() || ''}`;
        }
        return (
          str.includes('cross-origin frame') ||
          str.includes('Blocked a frame with origin') ||
          str.includes('Failed to read a named property') ||
          str.includes("Failed to read the 'origin' property from 'Location'") ||
          str.includes("Failed to read a named property 'origin' from 'Location'") ||
          str.includes('SecurityError') ||
          str.includes('Permission denied') ||
          str.includes('ResizeObserver')
        );
      } catch {
        return false;
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      try {
        if (isCrossOriginError(event?.reason)) {
          event.preventDefault();
          if (typeof event.stopImmediatePropagation === 'function') {
            event.stopImmediatePropagation();
          }
        }
      } catch {
        // Suppress any error inside the handler itself
      }
    };

    const handleError = (event: ErrorEvent) => {
      try {
        if (isCrossOriginError(event?.message) || isCrossOriginError(event?.error)) {
          event.preventDefault();
          if (typeof event.stopImmediatePropagation === 'function') {
            event.stopImmediatePropagation();
          }
        }
      } catch {
        // Suppress any error inside the handler itself
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection, true);
    window.addEventListener('error', handleError, true);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection, true);
      window.removeEventListener('error', handleError, true);
    };
  }, []);

  return null;
}

