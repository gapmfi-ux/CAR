/**
 * API Module - Google Apps Script Communication
 * Uses JSONP (script tag) approach to bypass CORS
 */

class ApiService {
  constructor() {
    // UPDATE THIS with your Google Apps Script Web App URL
    this.BASE_URL = 'https://script.google.com/macros/s/AKfycby9kpq1umFLzGJTqm4nOsFt46HmiJvTqvs6wyXjQFOinCqT9CG_0QBAYekb2UgtXg8sQg/exec';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
    this.pendingRequests = new Map();
    this.debug = true; // Set to true for debugging
    this.requestTimeout = 30000; // 30 seconds
  }

  log(...args) {
    if (this.debug) {
      console.log('[API]', ...args);
    }
  }

  error(...args) {
    console.error('[API]', ...args);
  }

  /**
   * Generic request method using JSONP (script tag)
   */
  async request(action, data = {}, options = {}) {
    const cacheKey = `${action}_${JSON.stringify(data)}`;
    const useCache = options.useCache !== false;
    
    // Check cache first
    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        this.log(`Cache hit for ${action}`);
        return cached.data;
      } else {
        this.cache.delete(cacheKey);
      }
    }

    // Deduplicate concurrent requests
    if (this.pendingRequests.has(cacheKey)) {
      this.log(`Deduplicating request for ${action}`);
      return this.pendingRequests.get(cacheKey);
    }

    // Create the request promise
    const requestPromise = new Promise((resolve, reject) => {
      try {
        // Generate a unique callback name
        const callbackName = 'api_callback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Build the URL with parameters
        const url = new URL(this.BASE_URL);
        url.searchParams.append('action', action);
        url.searchParams.append('data', JSON.stringify(data));
        url.searchParams.append('callback', callbackName);
        
        const fullUrl = url.toString();
        this.log(`Requesting: ${action}`, 'Data:', data, 'URL:', fullUrl);
        
        // Set timeout
        const timeoutId = setTimeout(() => {
          if (window[callbackName]) {
            delete window[callbackName];
            this.error(`Request timeout for ${action}`);
            reject(new Error('Request timeout after 30 seconds'));
          }
        }, this.requestTimeout);
        
        // Create the callback function
        window[callbackName] = (response) => {
          clearTimeout(timeoutId);
          delete window[callbackName];
          
          if (script.parentNode) {
            script.parentNode.removeChild(script);
          }
          
          this.log(`Response for ${action}:`, response);
          
          if (response && response.success !== false) {
            // Cache the response
            this.cache.set(cacheKey, {
              data: response,
              timestamp: Date.now()
            });
            resolve(response);
          } else {
            const errorMsg = (response && response.error) || 'API request failed';
            this.error(`API error for ${action}:`, errorMsg);
            reject(new Error(errorMsg));
          }
        };
        
        // Create and add the script tag
        const script = document.createElement('script');
        script.src = fullUrl;
        script.onerror = (error) => {
          clearTimeout(timeoutId);
          delete window[callbackName];
          if (script.parentNode) script.parentNode.removeChild(script);
          this.error(`Script error for ${action}`, error);
          reject(new Error('Network error - failed to connect to server'));
        };
        
        document.head.appendChild(script);
        this.log(`Script tag added for ${action}`);
        
      } catch (error) {
        this.error(`Request error for ${action}:`, error);
        reject(error);
      }
    });

    // Store the pending request
    this.pendingRequests.set(cacheKey, requestPromise);
    
    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  /**
   * Batch load multiple requests
   */
  async batchRequest(requests) {
    const results = {};
    const promises = [];
    
    for (const [key, { action, data }] of Object.entries(requests)) {
      promises.push(
        this.request(action, data, { useCache: true })
          .then(result => { results[key] = result; })
          .catch(err => { 
            results[key] = { error: err.message };
            this.error(`Batch request failed for ${key}:`, err.message);
          })
      );
    }
    
    await Promise.all(promises);
    return results;
  }

  /**
   * Clear cache
   */
  clearCache(action = null) {
    if (action) {
      const keysToDelete = [];
      for (const key of this.cache.keys()) {
        if (key.startsWith(action)) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach(key => this.cache.delete(key));
      this.log(`Cleared cache for action: ${action}`);
    } else {
      this.cache.clear();
      this.log('Cleared all cache');
    }
  }

  // ============================================
  // CREDIT OFFICER ACTIVITY REPORT API
  // ============================================

  async createLoan(data, options = {}) {
    this.log('createLoan called with:', data);
    return this.request('/loan/create', data, options);
  }

  async getLoans(options = {}) {
    this.log('getLoans called');
    return this.request('/loan/list', {}, options);
  }

  async updateLoan(id, data, options = {}) {
    this.log('updateLoan called:', id, data);
    return this.request('/loan/update', { id, data }, options);
  }

  async deleteLoan(id, options = {}) {
    this.log('deleteLoan called:', id);
    return this.request('/loan/delete', { id }, options);
  }

  async createRecovery(data, options = {}) {
    this.log('createRecovery called with:', data);
    return this.request('/recovery/create', data, options);
  }

  async getRecoveries(options = {}) {
    this.log('getRecoveries called');
    return this.request('/recovery/list', {}, options);
  }

  async updateRecovery(id, data, options = {}) {
    this.log('updateRecovery called:', id, data);
    return this.request('/recovery/update', { id, data }, options);
  }

  async deleteRecovery(id, options = {}) {
    this.log('deleteRecovery called:', id);
    return this.request('/recovery/delete', { id }, options);
  }

  async createSales(data, options = {}) {
    this.log('createSales called with:', data);
    return this.request('/sales/create', data, options);
  }

  async getSales(options = {}) {
    this.log('getSales called');
    return this.request('/sales/list', {}, options);
  }

  async updateSales(id, data, options = {}) {
    this.log('updateSales called:', id, data);
    return this.request('/sales/update', { id, data }, options);
  }

  async deleteSales(id, options = {}) {
    this.log('deleteSales called:', id);
    return this.request('/sales/delete', { id }, options);
  }

  async testConnection(options = {}) {
    try {
      this.log('Testing connection...');
      const response = await this.request('test', {}, options);
      this.log('Connection test response:', response);
      return {
        connected: response && response.success !== false,
        message: response && response.success !== false ? 'Connected to server' : 'Connection failed',
        data: response
      };
    } catch (error) {
      this.error('Connection test failed:', error);
      return {
        connected: false,
        message: 'Connection failed: ' + error.message
      };
    }
  }
}

// Create global API instance
window.API = new ApiService();
window.api = window.API;

console.log('✅ API Service initialized with JSONP approach');
console.log('📍 API URL:', window.API.BASE_URL);
console.log('🔍 Debug mode:', window.API.debug);
