// src/utils/errorHandler.ts - Type-safe error handling

import { ApiError } from '../types';

/**
 * Extracts error message from various error formats
 */
export function getErrorMessage(error: unknown): string {
  if (!error) {
    return 'An unknown error occurred';
  }

  // Check if it's an ApiError with response
  if (typeof error === 'object' && error !== null) {
    const apiError = error as ApiError;
    
    // Check for response.data.error
    if (apiError.response?.data?.error) {
      return apiError.response.data.error;
    }
    
    // Check for response.data.message
    if (apiError.response?.data?.message) {
      return apiError.response.data.message;
    }
    
    // Check for direct message property
    if (apiError.message) {
      return apiError.message;
    }
  }

  // Fallback to string conversion
  return String(error);
}

/**
 * Handles API errors in catch blocks
 */
export function handleApiError(
  error: unknown,
  fallbackMessage: string = 'An error occurred'
): string {
  const message = getErrorMessage(error);
  console.error('API Error:', error);
  return message || fallbackMessage;
}

/**
 * Type guard for checking if error has response
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error
  );
}

/**
 * Formats error for display to user
 */
export function formatErrorForUser(error: unknown): string {
  const message = getErrorMessage(error);
  
  // Remove technical details that users don't need
  if (message.includes('fetch failed')) {
    return 'Network error. Please check your connection and try again.';
  }
  
  if (message.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }
  
  return message;
}

// Example usage in components:
/*
import { handleApiError } from '../utils/errorHandler';

try {
  const res = await api.get('/some-endpoint');
  setData(res.data);
} catch (error) {
  setError(handleApiError(error, 'Failed to load data'));
}
*/