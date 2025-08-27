import { errorHandler, handleApiError } from './errorHandler';
import { monitoring } from './monitoring';

export interface ApiClientConfig {
  baseURL?: string;
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

export class ApiClient {
  private config: ApiClientConfig;
  private abortControllers: Map<string, AbortController> = new Map();

  constructor(config: ApiClientConfig = {}) {
    this.config = {
      baseURL: '',
      timeout: 30000,
      retries: 3,
      headers: {
        'Content-Type': 'application/json',
      },
      ...config,
    };
  }

  /**
   * Make HTTP request with error handling and retry logic
   */
  private async request<T>(
    method: string,
    url: string,
    options: RequestInit & { 
      timeout?: number;
      retries?: number;
      retryDelay?: number;
      data?: any;
      params?: Record<string, string>;
    } = {}
  ): Promise<ApiResponse<T>> {
    const {
      timeout = this.config.timeout,
      retries = this.config.retries,
      retryDelay = 1000,
      data,
      params,
      ...fetchOptions
    } = options;

    // Build URL with query parameters
    const fullUrl = this.buildUrl(url, params);
    
    // Create unique request ID for tracking
    const requestId = `${method}_${url}_${Date.now()}`;
    
    // Create abort controller for timeout
    const abortController = new AbortController();
    this.abortControllers.set(requestId, abortController);

    // Set timeout
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, timeout!);

    const startTime = Date.now();

    try {
      const response = await errorHandler.withRetry(
        async () => {
          const response = await fetch(fullUrl, {
            method,
            headers: {
              ...this.config.headers,
              ...fetchOptions.headers,
            },
            body: data ? JSON.stringify(data) : fetchOptions.body,
            signal: abortController.signal,
            ...fetchOptions,
          });

          if (!response.ok) {
            const errorData = await this.parseErrorResponse(response);
            throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
          }

          return response;
        },
        {
          maxRetries: retries!,
          baseDelay: retryDelay,
        },
        {
          component: 'ApiClient',
          action: `${method} ${url}`,
        }
      );

      const responseData = await this.parseResponse<T>(response);
      const duration = Date.now() - startTime;

      // Log successful API call
      monitoring.trackApiCall(method, fullUrl, duration, response.status);

      return {
        data: responseData,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const apiError = this.createApiError(error);

      // Log failed API call
      monitoring.trackApiCall(method, fullUrl, duration, apiError.status || 0, apiError);

      throw apiError;
    } finally {
      clearTimeout(timeoutId);
      this.abortControllers.delete(requestId);
    }
  }

  /**
   * GET request
   */
  async get<T>(url: string, options: Omit<Parameters<typeof this.request>[2], 'data'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>('GET', url, options);
  }

  /**
   * POST request
   */
  async post<T>(url: string, data?: any, options: Omit<Parameters<typeof this.request>[2], 'data'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>('POST', url, { ...options, data });
  }

  /**
   * PUT request
   */
  async put<T>(url: string, data?: any, options: Omit<Parameters<typeof this.request>[2], 'data'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', url, { ...options, data });
  }

  /**
   * PATCH request
   */
  async patch<T>(url: string, data?: any, options: Omit<Parameters<typeof this.request>[2], 'data'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', url, { ...options, data });
  }

  /**
   * DELETE request
   */
  async delete<T>(url: string, options: Omit<Parameters<typeof this.request>[2], 'data'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', url, options);
  }

  /**
   * Upload file with progress tracking
   */
  async uploadFile<T>(
    url: string,
    file: File,
    options: {
      onProgress?: (progress: number) => void;
      fieldName?: string;
      additionalData?: Record<string, string>;
    } = {}
  ): Promise<ApiResponse<T>> {
    const { onProgress, fieldName = 'file', additionalData = {} } = options;

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      
      formData.append(fieldName, file);
      
      // Add additional form data
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });

      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        try {
          if (xhr.status >= 200 && xhr.status < 300) {
            const data = JSON.parse(xhr.responseText);
            resolve({
              data,
              status: xhr.status,
              statusText: xhr.statusText,
              headers: new Headers(),
            });
          } else {
            const error = this.createApiError(new Error(`Upload failed: ${xhr.statusText}`));
            error.status = xhr.status;
            reject(error);
          }
        } catch (error) {
          reject(this.createApiError(error));
        }
      });

      xhr.addEventListener('error', () => {
        reject(this.createApiError(new Error('Upload failed')));
      });

      xhr.addEventListener('timeout', () => {
        reject(this.createApiError(new Error('Upload timeout')));
      });

      xhr.open('POST', this.buildUrl(url));
      
      // Add headers
      Object.entries(this.config.headers || {}).forEach(([key, value]) => {
        if (key !== 'Content-Type') { // Let browser set Content-Type for FormData
          xhr.setRequestHeader(key, value);
        }
      });

      xhr.timeout = this.config.timeout || 30000;
      xhr.send(formData);
    });
  }

  /**
   * Cancel all pending requests
   */
  cancelAllRequests() {
    this.abortControllers.forEach((controller) => {
      controller.abort();
    });
    this.abortControllers.clear();
  }

  /**
   * Cancel specific request
   */
  cancelRequest(requestId: string) {
    const controller = this.abortControllers.get(requestId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(requestId);
    }
  }

  /**
   * Build full URL with query parameters
   */
  private buildUrl(url: string, params?: Record<string, string>): string {
    const baseUrl = url.startsWith('http') ? url : `${this.config.baseURL}${url}`;
    
    if (!params || Object.keys(params).length === 0) {
      return baseUrl;
    }

    const urlObj = new URL(baseUrl);
    Object.entries(params).forEach(([key, value]) => {
      urlObj.searchParams.append(key, value);
    });

    return urlObj.toString();
  }

  /**
   * Parse response data
   */
  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      return response.json();
    }
    
    if (contentType?.includes('text/')) {
      return response.text() as any;
    }
    
    return response.blob() as any;
  }

  /**
   * Parse error response
   */
  private async parseErrorResponse(response: Response): Promise<{ message: string; code?: string; details?: any }> {
    try {
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        const errorData = await response.json();
        return {
          message: errorData.message || errorData.error || 'An error occurred',
          code: errorData.code,
          details: errorData.details,
        };
      }
      
      const text = await response.text();
      return { message: text || `HTTP ${response.status}: ${response.statusText}` };
    } catch {
      return { message: `HTTP ${response.status}: ${response.statusText}` };
    }
  }

  /**
   * Create standardized API error
   */
  private createApiError(error: any): ApiError {
    if (error.name === 'AbortError') {
      return {
        message: 'Request was cancelled',
        code: 'request_cancelled',
      };
    }

    if (error.message?.includes('timeout')) {
      return {
        message: 'Request timed out',
        code: 'request_timeout',
      };
    }

    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      return {
        message: 'Network error. Please check your connection.',
        code: 'network_error',
      };
    }

    return {
      message: handleApiError(error, { component: 'ApiClient' }),
      status: error.status,
      code: error.code,
      details: error.details,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ApiClientConfig>) {
    this.config = { ...this.config, ...config };
  }

  /**
   * Set authentication header
   */
  setAuthToken(token: string) {
    this.config.headers = {
      ...this.config.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  /**
   * Remove authentication header
   */
  clearAuthToken() {
    const { Authorization, ...headers } = this.config.headers || {};
    this.config.headers = headers;
  }
}

// Default API client instance
export const apiClient = new ApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '',
});

// Convenience functions
export async function get<T>(url: string, options?: Parameters<typeof apiClient.get>[1]) {
  return apiClient.get<T>(url, options);
}

export async function post<T>(url: string, data?: any, options?: Parameters<typeof apiClient.post>[2]) {
  return apiClient.post<T>(url, data, options);
}

export async function put<T>(url: string, data?: any, options?: Parameters<typeof apiClient.put>[2]) {
  return apiClient.put<T>(url, data, options);
}

export async function patch<T>(url: string, data?: any, options?: Parameters<typeof apiClient.patch>[2]) {
  return apiClient.patch<T>(url, data, options);
}

export async function del<T>(url: string, options?: Parameters<typeof apiClient.delete>[1]) {
  return apiClient.delete<T>(url, options);
}

export async function uploadFile<T>(
  url: string,
  file: File,
  options?: Parameters<typeof apiClient.uploadFile>[2]
) {
  return apiClient.uploadFile<T>(url, file, options);
}