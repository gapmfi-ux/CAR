/**
 * Main Application Module
 * Orchestrates the entire application with tab switching
 */

class CreditOfficerApp {
    constructor() {
        this.ui = new UI();
        this.api = window.API;
        this.supervisor = window.supervisor;
        this.currentTab = 'officer';
        this.isLoading = false;
        
        // Set user name - can be customized
        this.setUserName('Credit Officer');
        
        this.init();
    }

    /**
     * Set the user name displayed in the header
     * @param {string} name - User's display name
     */
    setUserName(name) {
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = name || 'Credit Officer';
        }
        // Also update the API
        if (this.api) {
            this.api.setUser(name || 'Credit Officer');
        }
    }

    /**
     * Get the current user name
     * @returns {string} - Current user name
     */
    getUserName() {
        const userNameElement = document.getElementById('userName');
        return userNameElement ? userNameElement.textContent : 'Credit Officer';
    }

    async init() {
        try {
            // Setup tab navigation
            this.setupTabs();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Test connection first
            await this.testConnection();
            
            // Load data for both views
            await this.loadAllData();
            
            // Show success
            this.ui.showToast('✅ Data loaded successfully', false, 2000);
            
            console.log('✅ Credit Officer Activity Report initialized');
            console.log('👤 User:', this.getUserName());
            
        } catch (error) {
            console.error('Initialization error:', error);
            this.ui.showToast('❌ Failed to initialize: ' + error.message, true, 5000);
        }
    }

    async testConnection() {
        try {
            const result = await this.api.testConnection();
            if (!result.connected) {
                this.ui.showToast('⚠️ ' + result.message, true, 3000);
            } else {
                console.log('✅ Connection successful');
            }
            return result;
        } catch (error) {
            console.error('Connection test failed:', error);
            this.ui.showToast('⚠️ Cannot connect to server: ' + error.message, true, 5000);
            return { connected: false, message: error.message };
        }
    }

    setupTabs() {
        const tabs = document.querySelectorAll('.tab-btn');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.dataset.tab;
                this.switchTab(tabId);
            });
        });
        
        // Set initial tab
        this.switchTab('officer');
    }

    switchTab(tabId) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === tabId + 'View');
        });
        
        this.currentTab = tabId;
        document.getElementById('viewModeLabel').textContent = 
            tabId === 'officer' ? 'Officer View' : 'Supervisor View';
    }

    setupEventListeners() {
        // ===== LOAN =====
        document.getElementById('saveLoanBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.handleLoanSave();
        });

        ['loanType', 'loanCustomer', 'loanAmount'].forEach(id => {
            document.getElementById(id).addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this.handleLoanSave();
            });
        });

        // ===== RECOVERY =====
        document.getElementById('saveRecoveryBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.handleRecoverySave();
        });

        ['recCustomer', 'recBalance', 'recLoanType', 'recLocation'].forEach(id => {
            document.getElementById(id).addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this.handleRecoverySave();
            });
        });

        // ===== SALES =====
        document.getElementById('saveSalesBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.handleSalesSave();
        });

        ['salesLocation', 'salesDate', 'salesPurpose'].forEach(id => {
            document.getElementById(id).addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this.handleSalesSave();
            });
        });

        // ===== KEYBOARD SHORTCUTS =====
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                const active = document.activeElement;
                if (active.closest('#loanInputRow')) this.handleLoanSave();
                else if (active.closest('#recoveryInputRow')) this.handleRecoverySave();
                else if (active.closest('#salesInputRow')) this.handleSalesSave();
            }
        });
    }

    /**
     * Extract data from API response - handles multiple response formats
     */
    extractData(response) {
        if (!response) return [];
        
        // If response has an error, return empty array
        if (response.error) {
            console.warn('API returned error:', response.error);
            return [];
        }
        
        // If response has a data property that is an array
        if (response.data && Array.isArray(response.data)) {
            return response.data;
        }
        
        // If response itself is an array
        if (Array.isArray(response)) {
            return response;
        }
        
        // If response has a data property that is an object with data property
        if (response.data && response.data.data && Array.isArray(response.data.data)) {
            return response.data.data;
        }
        
        // Log unexpected format
        console.warn('Unexpected response format:', response);
        return [];
    }

    /**
     * Extract a single record from API response
     */
    extractSingleRecord(response) {
        if (!response) return null;
        
        // If response has a data property
        if (response.data) {
            // If data is an array, return first item or null
            if (Array.isArray(response.data)) {
                return response.data[0] || null;
            }
            // If data is an object
            if (typeof response.data === 'object') {
                return response.data;
            }
        }
        
        // If response itself is the record
        if (typeof response === 'object' && !response.error) {
            return response;
        }
        
        return null;
    }

    async loadAllData() {
        if (this.isLoading) return;
        this.isLoading = true;
        
        try {
            // Use batch request for better performance
            const results = await this.api.batchRequest({
                loans: { action: '/loan/list', data: {} },
                recoveries: { action: '/recovery/list', data: {} },
                sales: { action: '/sales/list', data: {} }
            });
            
            // Extract data from responses - handle both formats
            const loans = this.extractData(results.loans);
            const recoveries = this.extractData(results.recoveries);
            const sales = this.extractData(results.sales);
            
            console.log('Loaded data:', { 
                loansCount: loans.length, 
                recoveriesCount: recoveries.length, 
                salesCount: sales.length 
            });
            
            // Officer view
            this.ui.renderLoanTable(loans);
            this.ui.renderRecoveryTable(recoveries);
            this.ui.renderSalesTable(sales);
            
            // Supervisor view
            if (this.supervisor) {
                this.supervisor.renderLoanTable(loans);
                this.supervisor.renderRecoveryTable(recoveries);
                this.supervisor.renderSalesTable(sales);
            }
            
        } catch (error) {
            console.error('Error loading data:', error);
            this.ui.showToast('❌ Failed to load data: ' + error.message, true, 5000);
            
            this.ui.renderLoanTable([]);
            this.ui.renderRecoveryTable([]);
            this.ui.renderSalesTable([]);
            
        } finally {
            this.isLoading = false;
        }
    }

    // ===== LOAN SAVE =====
    async handleLoanSave() {
        if (this.isLoading) return;
        
        try {
            const data = this.ui.getLoanFormData();
            const errors = this.validateLoan(data);
            if (errors.length > 0) {
                this.ui.showToast('❌ ' + errors.join(' • '), true, 4000);
                return;
            }
            
            this.isLoading = true;
            this.ui.showToast('⏳ Saving loan...', false, 0);
            
            const result = await this.api.createLoan(data);
            
            // Extract the created loan from response
            const newLoan = this.extractSingleRecord(result);
            
            if (newLoan) {
                this.ui.addOfficerLoanRow(newLoan);
            } else {
                // If we can't extract, just refresh
                await this.loadAllData();
            }
            
            this.ui.clearLoanForm();
            
            // Clear cache for loan list
            this.api.clearCache('/loan/list');
            
            // Refresh supervisor view
            if (this.supervisor) {
                await this.supervisor.refreshAll();
            }
            
            this.ui.showToast('✅ Loan saved successfully', false, 2500);
            
        } catch (error) {
            this.ui.showToast('❌ ' + error.message, true, 4000);
        } finally {
            this.isLoading = false;
        }
    }

    // ===== RECOVERY SAVE =====
    async handleRecoverySave() {
        if (this.isLoading) return;
        
        try {
            const data = this.ui.getRecoveryFormData();
            const errors = this.validateRecovery(data);
            if (errors.length > 0) {
                this.ui.showToast('❌ ' + errors.join(' • '), true, 4000);
                return;
            }
            
            this.isLoading = true;
            this.ui.showToast('⏳ Saving recovery...', false, 0);
            
            const result = await this.api.createRecovery(data);
            
            const newRecord = this.extractSingleRecord(result);
            if (newRecord) {
                this.ui.addOfficerRecoveryRow(newRecord);
            } else {
                await this.loadAllData();
            }
            
            this.ui.clearRecoveryForm();
            this.api.clearCache('/recovery/list');
            
            if (this.supervisor) {
                await this.supervisor.refreshAll();
            }
            
            this.ui.showToast('✅ Recovery saved successfully', false, 2500);
            
        } catch (error) {
            this.ui.showToast('❌ ' + error.message, true, 4000);
        } finally {
            this.isLoading = false;
        }
    }

    // ===== SALES SAVE =====
    async handleSalesSave() {
        if (this.isLoading) return;
        
        try {
            const data = this.ui.getSalesFormData();
            const errors = this.validateSales(data);
            if (errors.length > 0) {
                this.ui.showToast('❌ ' + errors.join(' • '), true, 4000);
                return;
            }
            
            this.isLoading = true;
            this.ui.showToast('⏳ Saving sales...', false, 0);
            
            const result = await this.api.createSales(data);
            
            const newRecord = this.extractSingleRecord(result);
            if (newRecord) {
                this.ui.addOfficerSalesRow(newRecord);
            } else {
                await this.loadAllData();
            }
            
            this.ui.clearSalesForm();
            this.api.clearCache('/sales/list');
            
            if (this.supervisor) {
                await this.supervisor.refreshAll();
            }
            
            this.ui.showToast('✅ Sales saved successfully', false, 2500);
            
        } catch (error) {
            this.ui.showToast('❌ ' + error.message, true, 4000);
        } finally {
            this.isLoading = false;
        }
    }

    // ===== VALIDATION =====
    validateLoan(data) {
        const errors = [];
        if (!data.product?.trim()) errors.push('Product is required');
        if (!data.customer?.trim()) errors.push('Customer is required');
        if (!data.amount || data.amount <= 0) errors.push('Amount must be > 0');
        return errors;
    }

    validateRecovery(data) {
        const errors = [];
        if (!data.customer?.trim()) errors.push('Customer is required');
        if (data.balance < 0) errors.push('Balance must be >= 0');
        if (!data.location?.trim()) errors.push('Location is required');
        return errors;
    }

    validateSales(data) {
        const errors = [];
        if (!data.location?.trim()) errors.push('Location is required');
        if (!data.purpose?.trim()) errors.push('Purpose is required');
        return errors;
    }

    async refreshData() {
        await this.loadAllData();
        this.ui.showToast('🔄 Data refreshed', false, 2000);
    }
}

// ===== INITIALIZE =====
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CreditOfficerApp();
});

// Expose methods globally for debugging
console.log('📋 Available methods:');
console.log('  - window.app.setUserName("Your Name") - Set user name');
console.log('  - window.app.refreshData() - Refresh all data');
console.log('  - window.app.api.getLoans() - Fetch loans');
console.log('  - window.app.api.getRecoveries() - Fetch recoveries');
console.log('  - window.app.api.getSales() - Fetch sales');
