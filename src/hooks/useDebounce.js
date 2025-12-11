import { useCallback, useEffect, useState } from 'react';

/**
 * Custom hook for debounced search
 * Reduces API calls by waiting for user to finish typing
 */
export const useDebounce = (value, delayMs = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set up a timer
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    // Clean up the timer if value changes before delay expires
    return () => clearTimeout(handler);
  }, [value, delayMs]);

  return debouncedValue;
};

/**
 * Custom hook for debounced callback
 * Useful for search handlers, scroll handlers, etc.
 */
export const useDebouncedCallback = (callback, delayMs = 300) => {
  const [timeoutId, setTimeoutId] = useState(null);

  const debouncedCallback = useCallback(
    (...args) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      const newTimeoutId = setTimeout(() => {
        callback(...args);
      }, delayMs);

      setTimeoutId(newTimeoutId);
    },
    [callback, delayMs, timeoutId]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  return debouncedCallback;
};

/**
 * Custom hook for throttled callback
 * Ensures callback runs at most once every delayMs
 */
export const useThrottledCallback = (callback, delayMs = 300) => {
  const [lastCallTime, setLastCallTime] = useState(0);

  const throttledCallback = useCallback(
    (...args) => {
      const now = Date.now();
      if (now - lastCallTime >= delayMs) {
        setLastCallTime(now);
        callback(...args);
      }
    },
    [callback, delayMs, lastCallTime]
  );

  return throttledCallback;
};
