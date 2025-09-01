import { logError, trackAction } from './monitoring';

export interface RetryConfig {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
}

interface ErrorContext {
  component?: string;
  action?: string;
  [key: string]: any;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class ErrorHandler {
  async withRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig = {},
    context: ErrorContext = {}
  ): Promise<T> {
    const { maxRetries = 3, baseDelay = 1000, maxDelay = 30000, backoffFactor = 2 } = config;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        return await operation();
      } catch (error) {
        attempt++;
        const isLastAttempt = attempt >= maxRetries;

        logError('Operation failed, retrying...', {
          ...context,
          attempt,
          maxRetries,
          error: error instanceof Error ? error.message : String(error),
        });

        if (isLastAttempt) {
          trackAction('operation_failed_max_retries', context.component || 'unknown', {
            ...context,
            error: error instanceof Error ? error.message : String(error),
          });
          throw error;
        }

        const delayTime = Math.min(baseDelay * Math.pow(backoffFactor, attempt - 1), maxDelay);
        await delay(delayTime);
      }
    }
    // This should not be reached, but typescript needs a return path.
    throw new Error('Retry logic failed unexpectedly.');
  }
}

export const errorHandler = new ErrorHandler();