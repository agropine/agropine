/**
 * Centralized Error Handler
 * Provides consistent error handling and user-friendly messages
 */

// Error types
export const ErrorType = {
  NETWORK: 'NETWORK',
  AUTH: 'AUTH',
  VALIDATION: 'VALIDATION',
  NOT_FOUND: 'NOT_FOUND',
  PERMISSION: 'PERMISSION',
  UNKNOWN: 'UNKNOWN',
};

/**
 * Parse and categorize errors
 */
export const parseError = (error) => {
  if (!error) return null;

  const errorMessage = error.message || error.toString();
  const errorCode = error.code || error.status;

  // Network errors
  if (errorMessage.includes('Network') || errorMessage.includes('fetch') || errorCode === 'NETWORK_ERROR') {
    return {
      type: ErrorType.NETWORK,
      title: 'Connection Error',
      message: 'Unable to connect to the server. Please check your internet connection.',
      retryable: true,
    };
  }

  // Authentication errors
  if (errorMessage.includes('JWT') || errorMessage.includes('token') || errorCode === 401) {
    return {
      type: ErrorType.AUTH,
      title: 'Authentication Error',
      message: 'Your session has expired. Please sign in again.',
      retryable: false,
    };
  }

  // Validation errors
  if (errorMessage.includes('invalid') || errorMessage.includes('validation') || errorCode === 400) {
    return {
      type: ErrorType.VALIDATION,
      title: 'Invalid Input',
      message: errorMessage || 'Please check your input and try again.',
      retryable: false,
    };
  }

  // Not found errors
  if (errorMessage.includes('not found') || errorCode === 404) {
    return {
      type: ErrorType.NOT_FOUND,
      title: 'Not Found',
      message: 'The requested resource could not be found.',
      retryable: false,
    };
  }

  // Permission errors
  if (errorMessage.includes('permission') || errorMessage.includes('unauthorized') || errorCode === 403) {
    return {
      type: ErrorType.PERMISSION,
      title: 'Permission Denied',
      message: 'You don\'t have permission to perform this action.',
      retryable: false,
    };
  }

  // Unknown errors
  return {
    type: ErrorType.UNKNOWN,
    title: 'Something Went Wrong',
    message: errorMessage || 'An unexpected error occurred. Please try again.',
    retryable: true,
  };
};

/**
 * Get user-friendly error message
 */
export const getErrorMessage = (error) => {
  const parsed = parseError(error);
  return parsed ? parsed.message : 'An unexpected error occurred';
};

/**
 * Check if error is retryable
 */
export const isRetryableError = (error) => {
  const parsed = parseError(error);
  return parsed ? parsed.retryable : false;
};

/**
 * Log error for debugging
 */
export const logError = (context, error) => {
  const parsed = parseError(error);
  console.error(`[${context}]`, {
    type: parsed?.type || 'UNKNOWN',
    message: parsed?.message || error?.message || error,
    originalError: error,
  });
};

/**
 * Handle async operations with error handling
 */
export const withErrorHandling = async (operation, context = 'Operation') => {
  try {
    return await operation();
  } catch (error) {
    logError(context, error);
    throw error;
  }
};
