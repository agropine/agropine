/**
 * API Request Utilities
 * Handles timeouts, retries, and rate limiting
 */


const DEFAULT_TIMEOUT_MS = 15000; // 15 seconds
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000; // 1 second

/**
 * Rate limiter for client-side API calls
 */
class RateLimiter {
  constructor(maxRequests = 10, windowMs = 1000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  isAllowed() {
    const now = Date.now();
    // Remove old requests outside the window
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return true;
    }
    return false;
  }

  getRetryAfter() {
    if (this.requests.length === 0) return 0;
    const oldestRequest = this.requests[0];
    return Math.ceil((oldestRequest + this.windowMs - Date.now()) / 1000);
  }
}

// Create rate limiters for different operations
export const apiRateLimiters = {
  search: new RateLimiter(20, 1000), // 20 requests per second
  productFetch: new RateLimiter(30, 1000), // 30 requests per second
  location: new RateLimiter(5, 1000), // 5 requests per second for geocoding
  general: new RateLimiter(50, 1000), // 50 requests per second
};

/**
 * Check if a request is rate limited
 */
export const checkRateLimit = (limiterKey = 'general') => {
  const limiter = apiRateLimiters[limiterKey] || apiRateLimiters.general;
  if (!limiter.isAllowed()) {
    const retryAfter = limiter.getRetryAfter();
    throw new Error(`Rate limited. Retry after ${retryAfter}s`);
  }
};

/**
 * Exponential backoff for retries
 */
const getRetryDelay = (attempt) => {
  return INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
};

/**
 * Retry wrapper for async functions
 */
export const withRetry = async (fn, maxRetries = MAX_RETRIES, fnName = 'Operation') => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`${fnName} - Attempt ${attempt}/${maxRetries}`);
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on validation or auth errors
      if (
        error.message?.includes('validation') ||
        error.message?.includes('Invalid') ||
        error.status === 401 ||
        error.status === 403
      ) {
        throw error;
      }

      if (attempt < maxRetries) {
        const delay = getRetryDelay(attempt);
        console.warn(`${fnName} failed on attempt ${attempt}, retrying in ${delay}ms:`, error.message);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  console.error(`${fnName} failed after ${maxRetries} attempts:`, lastError);
  throw lastError;
};

/**
 * Timeout wrapper for promises
 */
export const withTimeout = (promise, timeoutMs = DEFAULT_TIMEOUT_MS, operationName = 'Request') => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`${operationName} timeout after ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ]);
};

/**
 * Combined: Retry + Timeout
 */
export const withRetryAndTimeout = async (
  fn,
  maxRetries = MAX_RETRIES,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  operationName = 'Operation'
) => {
  return withRetry(
    async () => {
      return withTimeout(fn(), timeoutMs, operationName);
    },
    maxRetries,
    operationName
  );
};
