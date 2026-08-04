/**
 * Main Application Module
 * Orchestrates the entire application
 */

// ===== APP CLASS =====
class CreditOfficerApp {
    constructor() {
        // Initialize UI
        this.ui = new UI();
        
        // Initialize API (already global)
        this.api = window.api;
        
        // State
        this.isLoading = false;
        this.currentView = 'officer';
        
        // Initialize the app
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            // Update week badge
            this.ui.updateWeekBadge();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Setup role toggle
            this.setupRoleToggle();
            
            // Load all data
            await this.loadAllData();
            
            // Show success message
            this.ui.showToast('✅ Data loaded successfully', false, 2000);
            
            console.log('✅ Credit Officer Activity Report initialized');
            
        } catch (error) {
            console.error('Initialization error:', error);
            this.ui.showToast('❌ Failed to initialize: ' + error.message, true, 5000);
        }
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // ----- LOAN EVENTS -----
        document.getElementById('saveLoanBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.handleLoanSave();
        });

        // Allow Enter key to submit (on input fields)
        document.getElementById('loanType').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.handleLoanSave();
        });
        document.getElementById('loanCustomer').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.handleLoanSave();
        });

        // ----- RECOVERY EVENTS -----
        document.getElementById('saveRecoveryBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.handleRecoverySave();
        });

        document.getElementById('recCustomer').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.handleRecoverySave();
        });

        // ----- SALES EVENTS -----
        document.getElementById('saveSalesBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.handleSalesSave();
        });

        document.getElementById('salesLocation').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.handleSalesSave();
        });

        // ----- GLOBAL KEYBOARD SHORTCUTS -----
        document.addEventListener('keydown', (e) => {
            // Ctrl+Enter to save focused form
            if (e.ctrlKey && e.key === 'Enter') {
                const activeElement = document.activeElement;
                if (activeElement.closest('#loanInputRow')) {
                    this.handleLoanSave();
                } else if (activeElement.closest('#recoveryInputRow')) {
                    this.handleRecoverySave();
                } else if (activeElement.closest('#salesInputRow')) {
                    this.handleSalesSave();
                }
            }
        });
    }

    /**
     * Setup role toggle (Officer/Supervisor)
     */
    setupRoleToggle() {
        const toggle = document.getElementById('roleSwitch');
        
        // Set initial state
        toggle.checked = false;
        this.ui.updateView('officer');
        
        toggle.addEventListener('change', (e) => {
            const view = e.target.checked ? 'supervisor' : 'officer';
            this.currentView = view;
            this.ui.updateView(view);
            this.ui.showToast(`👁️ Switched to ${view} view`, false, 1500);
        });
    }

    /**
     * Load all data from the API
     */
    async loadAllData() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.ui.showToast('⏳ Loading data...', false, 0);
        
        try {
            const [loans, recoveries, sales] = await Promise.all([
                this.api.getLoans(),
                this.api.getRecoveries(),
                this.api.getSales()
            ]);
            
            this.ui.renderLoanTable(loans || []);
            this.ui.renderRecoveryTable(recoveries || []);
            this.ui.renderSalesTable(sales || []);
            
            // Hide loading toast
            this.ui.hideToast();
            
        } catch (error) {
            console.error('Error loading data:', error);
            this.ui.showToast('❌ Failed to load data: ' + error.message, true, 5000);
            
            // Render empty tables
            this.ui.renderLoanTable([]);
            this.ui.renderRecoveryTable([]);
            this.ui.renderSalesTable([]);
            
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Handle saving a loan record
     */
    async handleLoanSave() {
        if (this.isLoading) return;
        
        try {
            // Get form data
            const loanData = this.ui.getLoanFormData();
            
            // Validate
            const errors = this.validateLoan(loanData);
            if (errors.length > 0) {
                this.ui.showToast('❌ ' + errors.join(' • '), true, 4000);
                return;
            }
            
            // Save
            this.isLoading = true;
            this.ui.showToast('⏳ Saving loan record...', false, 0);
            
            const result = await this.api.createLoan(loanData);
            
            // Add row to table
            this.ui.addLoanRow(result);
            
            // Clear form
            this.ui.clearLoanForm();
            
            // Show success
            this.ui.showToast('✅ Loan record saved successfully', false, 2500);
            
        } catch (error) {
            console.error('Error saving loan:', error);
            this.ui.showToast('❌ ' + error.message, true, 4000);
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Handle saving a recovery record
     */
    async handleRecoverySave() {
        if (this.isLoading) return;
        
        try {
            const recoveryData = this.ui.getRecoveryFormData();
            
            const errors = this.validateRecovery(recoveryData);
            if (errors.length > 0) {
                this.ui.showToast('❌ ' + errors.join(' • '), true, 4000);
                return;
            }
            
            this.isLoading = true;
            this.ui.showToast('⏳ Saving recovery record...', false, 0);
            
            const result = await this.api.createRecovery(recoveryData);
            
            this.ui.addRecoveryRow(result);
            this.ui.clearRecoveryForm();
            
            this.ui.showToast('✅ Recovery record saved successfully', false, 2500);
            
        } catch (error) {
            console.error('Error saving recovery:', error);
            this.ui.showToast('❌ ' + error.message, true, 4000);
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Handle saving a sales record
     */
    async handleSalesSave() {
        if (this.isLoading) return;
        
        try {
            const salesData = this.ui.getSalesFormData();
            
            const errors = this.validateSales(salesData);
            if (errors.length > 0) {
                this.ui.showToast('❌ ' + errors.join(' • '), true, 4000);
                return;
            }
            
            this.isLoading = true;
            this.ui.showToast('⏳ Saving sales record...', false, 0);
            
            const result = await this.api.createSales(salesData);
            
            this.ui.addSalesRow(result);
            this.ui.clearSalesForm();
            
            this.ui.showToast('✅ Sales record saved successfully', false, 2500);
            
        } catch (error) {
            console.error('Error saving sales:', error);
            this.ui.showToast('❌ ' + error.message, true, 4000);
        } finally {
            this.isLoading = false;
        }
    }

    // ===== VALIDATION METHODS =====

    /**
     * Validate loan data
     * @param {object} data - Loan data
     * @returns {Array} - Array of error messages
     */
    validateLoan(data) {
        const errors = [];
        
        if (!data.product || data.product.trim() === '') {
            errors.push('Product/Loan Type is required');
        }
        if (!data.customer || data.customer.trim() === '') {
            errors.push('Customer Name is required');
        }
        if (!data.amount || data.amount <= 0) {
            errors.push('Loan Amount must be greater than 0');
        }
        
        return errors;
    }

    /**
     * Validate recovery data
     * @param {object} data - Recovery data
     * @returns {Array} - Array of error messages
     */
    validateRecovery(data) {
        const errors = [];
        
        if (!data.customer || data.customer.trim() === '') {
            errors.push('Customer Name is required');
        }
        if (!data.balance || data.balance < 0) {
            errors.push('Outstanding Balance must be 0 or greater');
        }
        if (!data.location || data.location.trim() === '') {
            errors.push('Location is required');
        }
        
        return errors;
    }

    /**
     * Validate sales data
     * @param {object} data - Sales data
     * @returns {Array} - Array of error messages
     */
    validateSales(data) {
        const errors = [];
        
        if (!data.location || data.location.trim() === '') {
            errors.push('Location is required');
        }
        if (!data.purpose || data.purpose.trim() === '') {
            errors.push('Purpose is required');
        }
        
        return errors;
    }

    /**
     * Refresh all data from the server
     */
    async refreshData() {
        await this.loadAllData();
        this.ui.showToast('🔄 Data refreshed', false, 2000);
    }
}

// ===== INITIALIZE APP =====
document.addEventListener('DOMContentLoaded', () => {
    // Make app globally accessible for debugging
    window.app = new CreditOfficerApp();
});

// ===== SERVICE WORKER (Optional - for offline support) =====
// Uncomment to enable PWA features
/*
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
            console.log('SW registered:', registration);
        }).catch(error => {
            console.log('SW registration failed:', error);
        });
    });
}
*/
