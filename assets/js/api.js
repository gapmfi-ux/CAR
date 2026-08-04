/**
 * API Module - Google Apps Script Communication
 * Fixed CORS issues by using JSONP-style approach with GET requests
 */

const GAS_API_URL = 'https://script.google.com/macros/s/AKfycby9kpq1umFLzGJTqm4nOsFt46HmiJvTqvs6wyXjQFOinCqT9CG_0QBAYekb2UgtXg8sQg/exec';

class GoogleSheetsAPI {
    constructor() {
        this.baseUrl = GAS_API_URL;
        this.isOnline = navigator.onLine;
        
        window.addEventListener('online', () => { this.isOnline = true; });
        window.addEventListener('offline', () => { this.isOnline = false; });
    }

    /**
     * Send request using GET with URL parameters (bypasses CORS preflight)
     * Google Apps Script Web Apps handle GET requests without CORS issues
     */
    async sendRequest(endpoint, method = 'POST', data = null) {
        if (!this.isOnline) {
            throw new Error('You are offline. Please check your internet connection.');
        }

        // Build URL with all parameters
        let url = `${this.baseUrl}?action=${encodeURIComponent(endpoint)}`;
        url += `&method=${encodeURIComponent(method)}`;
        
        if (data) {
            // For GET requests, encode data as query string
            if (method === 'GET') {
                Object.keys(data).forEach(key => {
                    const value = typeof data[key] === 'object' ? JSON.stringify(data[key]) : data[key];
                    url += `&${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
                });
            } else {
                // For POST, we'll still send JSON in body but use a different approach
                // We'll use the data as URL params to avoid CORS preflight
                Object.keys(data).forEach(key => {
                    const value = typeof data[key] === 'object' ? JSON.stringify(data[key]) : data[key];
                    url += `&${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
                });
            }
        }

        try {
            const response = await fetch(url, {
                method: 'GET',  // Always use GET to avoid CORS preflight
                mode: 'cors',
                cache: 'no-cache',
                headers: {
                    'Accept': 'application/json',
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'API request failed');
            }
            
            return result.data;
            
        } catch (error) {
            console.error('API Error:', error);
            throw new Error(error.message || 'Failed to connect to server');
        }
    }

    // ===== LOAN =====
    async createLoan(data) {
        return this.sendRequest('/loan/create', 'POST', data);
    }
    async getLoans() {
        return this.sendRequest('/loan/list', 'GET');
    }
    async updateLoan(id, data) {
        return this.sendRequest('/loan/update', 'PUT', { id, data: JSON.stringify(data) });
    }
    async deleteLoan(id) {
        return this.sendRequest('/loan/delete', 'DELETE', { id });
    }

    // ===== RECOVERY =====
    async createRecovery(data) {
        return this.sendRequest('/recovery/create', 'POST', data);
    }
    async getRecoveries() {
        return this.sendRequest('/recovery/list', 'GET');
    }
    async updateRecovery(id, data) {
        return this.sendRequest('/recovery/update', 'PUT', { id, data: JSON.stringify(data) });
    }
    async deleteRecovery(id) {
        return this.sendRequest('/recovery/delete', 'DELETE', { id });
    }

    // ===== SALES =====
    async createSales(data) {
        return this.sendRequest('/sales/create', 'POST', data);
    }
    async getSales() {
        return this.sendRequest('/sales/list', 'GET');
    }
    async updateSales(id, data) {
        return this.sendRequest('/sales/update', 'PUT', { id, data: JSON.stringify(data) });
    }
    async deleteSales(id) {
        return this.sendRequest('/sales/delete', 'DELETE', { id });
    }
}

window.GoogleSheetsAPI = GoogleSheetsAPI;
window.api = new GoogleSheetsAPI();
