/**
 * API Module - Google Apps Script Communication
 * Handles all backend API calls
 */

// ===== CONFIGURATION =====
// REPLACE THIS WITH YOUR ACTUAL GAS DEPLOYMENT URL
const GAS_API_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';

// ===== API CLASS =====
class GoogleSheetsAPI {
    constructor() {
        this.baseUrl = GAS_API_URL;
        this.isOnline = navigator.onLine;
        
        // Listen for online/offline events
        window.addEventListener('online', () => { this.isOnline = true; });
        window.addEventListener('offline', () => { this.isOnline = false; });
    }

    /**
     * Send request to Google Apps Script backend
     * @param {string} endpoint - API endpoint (e.g., '/loan/create')
     * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
     * @param {object} data - Request payload
     * @returns {Promise<object>} - Response data
     */
    async sendRequest(endpoint, method = 'POST', data = null) {
        // Check online status
        if (!this.isOnline) {
            throw new Error('You are offline. Please check your internet connection.');
        }

        const url = `${this.baseUrl}?action=${encodeURIComponent(endpoint)}`;
        
        const options = {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ 
                method: method.toUpperCase(),
                data: data || {} 
            })
        };

        try {
            const response = await fetch(url, options);
            
            // Check if response is OK
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            // Check for API-level errors
            if (!result.success) {
                throw new Error(result.error || 'API request failed');
            }
            
            return result.data;
            
        } catch (error) {
            console.error('API Error:', error);
            throw new Error(error.message || 'Failed to connect to server');
        }
    }

    // ===== LOAN ENDPOINTS =====
    
    /**
     * Create a new loan record
     * @param {object} loanData - Loan data object
     * @returns {Promise<object>} - Created loan record
     */
    async createLoan(loanData) {
        return this.sendRequest('/loan/create', 'POST', loanData);
    }

    /**
     * Get all loan records
     * @returns {Promise<Array>} - Array of loan records
     */
    async getLoans() {
        return this.sendRequest('/loan/list', 'GET');
    }

    /**
     * Update an existing loan record
     * @param {string|number} id - Record ID or row index
     * @param {object} loanData - Updated loan data
     * @returns {Promise<object>} - Updated loan record
     */
    async updateLoan(id, loanData) {
        return this.sendRequest('/loan/update', 'PUT', { id, data: loanData });
    }

    /**
     * Delete a loan record
     * @param {string|number} id - Record ID or row index
     * @returns {Promise<object>} - Deletion confirmation
     */
    async deleteLoan(id) {
        return this.sendRequest('/loan/delete', 'DELETE', { id });
    }

    // ===== RECOVERY ENDPOINTS =====
    
    /**
     * Create a new recovery record
     * @param {object} recoveryData - Recovery data object
     * @returns {Promise<object>} - Created recovery record
     */
    async createRecovery(recoveryData) {
        return this.sendRequest('/recovery/create', 'POST', recoveryData);
    }

    /**
     * Get all recovery records
     * @returns {Promise<Array>} - Array of recovery records
     */
    async getRecoveries() {
        return this.sendRequest('/recovery/list', 'GET');
    }

    /**
     * Update an existing recovery record
     * @param {string|number} id - Record ID or row index
     * @param {object} recoveryData - Updated recovery data
     * @returns {Promise<object>} - Updated recovery record
     */
    async updateRecovery(id, recoveryData) {
        return this.sendRequest('/recovery/update', 'PUT', { id, data: recoveryData });
    }

    /**
     * Delete a recovery record
     * @param {string|number} id - Record ID or row index
     * @returns {Promise<object>} - Deletion confirmation
     */
    async deleteRecovery(id) {
        return this.sendRequest('/recovery/delete', 'DELETE', { id });
    }

    // ===== SALES ENDPOINTS =====
    
    /**
     * Create a new sales record
     * @param {object} salesData - Sales data object
     * @returns {Promise<object>} - Created sales record
     */
    async createSales(salesData) {
        return this.sendRequest('/sales/create', 'POST', salesData);
    }

    /**
     * Get all sales records
     * @returns {Promise<Array>} - Array of sales records
     */
    async getSales() {
        return this.sendRequest('/sales/list', 'GET');
    }

    /**
     * Update an existing sales record
     * @param {string|number} id - Record ID or row index
     * @param {object} salesData - Updated sales data
     * @returns {Promise<object>} - Updated sales record
     */
    async updateSales(id, salesData) {
        return this.sendRequest('/sales/update', 'PUT', { id, data: salesData });
    }

    /**
     * Delete a sales record
     * @param {string|number} id - Record ID or row index
     * @returns {Promise<object>} - Deletion confirmation
     */
    async deleteSales(id) {
        return this.sendRequest('/sales/delete', 'DELETE', { id });
    }
}

// Export as global for use in main.js
window.GoogleSheetsAPI = GoogleSheetsAPI;
window.api = new GoogleSheetsAPI();
