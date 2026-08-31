/**
 * API Module - Google Apps Script Communication
 * Uses JSONP (script tag) approach to bypass CORS
 */

class ApiService {
    constructor() {
        // UPDATE THIS with your Google Apps Script Web App URL
        this.BASE_URL = 'https://script.google.com/macros/s/AKfycby9kpq1umFLzGJTqm4nOsFt46HmiJvTqvs6wyXjQFOinCqT9CG_0QBAYekb2UgtXg8sQg/exec';
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000;
        this.pendingRequests = new Map();
        this.debug = true; // Set to true for debugging
        this.requestTimeout = 30000;
        this.userName = 'Credit Officer';

        // In-memory store for mock data (fallback when API fails)
        this._store = { loans: [], recoveries: [], sales: [] };
        this._notificationStore = { loans: new Set(), recoveries: new Set(), sales: new Set() };
        this._useMockData = false; // Set to true to use mock data instead of API
    }

    log(...args) {
        if (this.debug) {
            console.log('[API]', ...args);
        }
    }

    error(...args) {
        console.error('[API]', ...args);
    }

    setUser(name) {
        this.userName = name || 'Credit Officer';
        console.log('👤 User set to:', this.userName);
    }

    getUser() {
        return this.userName;
    }

    // ===== NOTIFICATION TRACKING =====
    hasNotification(type, id) {
        return this._notificationStore[type]?.has(id) || false;
    }

    clearNotification(type, id) {
        if (this._notificationStore[type]) {
            this._notificationStore[type].delete(id);
        }
    }

    clearAllNotifications(type) {
        if (this._notificationStore[type]) {
            this._notificationStore[type].clear();
        }
    }

    markNotified(type, id) {
        if (!this._notificationStore[type]) this._notificationStore[type] = new Set();
        this._notificationStore[type].add(id);
    }

    hasAnyNotifications(type) {
        if (!this._notificationStore[type]) return false;
        return this._notificationStore[type].size > 0;
    }

    getNotificationCount(type) {
        if (!this._notificationStore[type]) return 0;
        return this._notificationStore[type].size;
    }

    // ===== GENERIC REQUEST =====
    async request(action, data = {}, options = {}) {
        // If using mock data, return mock response
        if (this._useMockData) {
            this.log('Using mock data for:', action);
            return this._handleMockRequest(action, data);
        }

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
                this.log(`Requesting: ${action}`, 'Data:', data);
                
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

    // ===== MOCK REQUEST HANDLER =====
    _handleMockRequest(action, data) {
        switch(action) {
            case '/loan/list':
                return { success: true, data: this._store.loans };
            case '/loan/create':
                const newLoan = { ...data, id: 'mock_' + Date.now() };
                this._store.loans.unshift(newLoan);
                return { success: true, data: newLoan };
            case '/loan/update':
                const loanIdx = this._store.loans.findIndex(l => l.id === data.id);
                if (loanIdx !== -1) {
                    this._store.loans[loanIdx] = { ...this._store.loans[loanIdx], ...data.data };
                    return { success: true, data: this._store.loans[loanIdx] };
                }
                return { success: false, error: 'Record not found' };
            case '/loan/delete':
                const delIdx = this._store.loans.findIndex(l => l.id === data.id);
                if (delIdx !== -1) {
                    this._store.loans.splice(delIdx, 1);
                    return { success: true, data: { deleted: true } };
                }
                return { success: false, error: 'Record not found' };
            case '/recovery/list':
                return { success: true, data: this._store.recoveries };
            case '/recovery/create':
                const newRec = { ...data, id: 'mock_' + Date.now() };
                this._store.recoveries.unshift(newRec);
                return { success: true, data: newRec };
            case '/recovery/update':
                const recIdx = this._store.recoveries.findIndex(r => r.id === data.id);
                if (recIdx !== -1) {
                    this._store.recoveries[recIdx] = { ...this._store.recoveries[recIdx], ...data.data };
                    return { success: true, data: this._store.recoveries[recIdx] };
                }
                return { success: false, error: 'Record not found' };
            case '/recovery/delete':
                const delRecIdx = this._store.recoveries.findIndex(r => r.id === data.id);
                if (delRecIdx !== -1) {
                    this._store.recoveries.splice(delRecIdx, 1);
                    return { success: true, data: { deleted: true } };
                }
                return { success: false, error: 'Record not found' };
            case '/sales/list':
                return { success: true, data: this._store.sales };
            case '/sales/create':
                const newSale = { ...data, id: 'mock_' + Date.now() };
                this._store.sales.unshift(newSale);
                return { success: true, data: newSale };
            case '/sales/update':
                const saleIdx = this._store.sales.findIndex(s => s.id === data.id);
                if (saleIdx !== -1) {
                    this._store.sales[saleIdx] = { ...this._store.sales[saleIdx], ...data.data };
                    return { success: true, data: this._store.sales[saleIdx] };
                }
                return { success: false, error: 'Record not found' };
            case '/sales/delete':
                const delSaleIdx = this._store.sales.findIndex(s => s.id === data.id);
                if (delSaleIdx !== -1) {
                    this._store.sales.splice(delSaleIdx, 1);
                    return { success: true, data: { deleted: true } };
                }
                return { success: false, error: 'Record not found' };
            case 'test':
                return { success: true, message: 'Mock API is working', timestamp: new Date().toISOString() };
            default:
                return { success: false, error: 'Unknown action: ' + action };
        }
    }

    // ===== BATCH REQUEST =====
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

    // ===== CLEAR CACHE =====
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

    // ===== LOAN CRUD =====
    async getLoans(options = {}) {
        this.log('getLoans called');
        return this.request('/loan/list', {}, options);
    }

    async createLoan(data, options = {}) {
        this.log('createLoan called with:', data);
        return this.request('/loan/create', data, options);
    }

    async updateLoan(id, data, options = {}) {
        this.log('updateLoan called:', id, data);
        return this.request('/loan/update', { id, data }, options);
    }

    async deleteLoan(id, options = {}) {
        this.log('deleteLoan called:', id);
        return this.request('/loan/delete', { id }, options);
    }

    // ===== RECOVERY CRUD =====
    async getRecoveries(options = {}) {
        this.log('getRecoveries called');
        return this.request('/recovery/list', {}, options);
    }

    async createRecovery(data, options = {}) {
        this.log('createRecovery called with:', data);
        return this.request('/recovery/create', data, options);
    }

    async updateRecovery(id, data, options = {}) {
        this.log('updateRecovery called:', id, data);
        return this.request('/recovery/update', { id, data }, options);
    }

    async deleteRecovery(id, options = {}) {
        this.log('deleteRecovery called:', id);
        return this.request('/recovery/delete', { id }, options);
    }

    // ===== SALES CRUD =====
    async getSales(options = {}) {
        this.log('getSales called');
        return this.request('/sales/list', {}, options);
    }

    async createSales(data, options = {}) {
        this.log('createSales called with:', data);
        return this.request('/sales/create', data, options);
    }

    async updateSales(id, data, options = {}) {
        this.log('updateSales called:', id, data);
        return this.request('/sales/update', { id, data }, options);
    }

    async deleteSales(id, options = {}) {
        this.log('deleteSales called:', id);
        return this.request('/sales/delete', { id }, options);
    }

    // ===== CODE PREVIEW =====
    async getNextCode(type, options = {}) {
        this.log('getNextCode called for type:', type);
        return this.request('/code/preview', { type }, options);
    }

    // ===== TEST CONNECTION =====
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
console.log('👤 Current user:', window.API.getUser());
