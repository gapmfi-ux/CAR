/**
 * Main Application Module
 * Orchestrates the entire application with tab switching, modals, and notifications
 */

class CreditOfficerApp {
    constructor() {
        this.ui = new UI();
        this.api = window.API;
        this.supervisor = window.supervisor;
        this.currentMainTab = 'officer';
        this.currentSubTab = 'loan';
        this.isLoading = false;
        this.editingRecord = null;

        this.setUserName('Credit Officer');

        this.init();
    }

    // ===== USER =====

    setUserName(name) {
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = name || 'Credit Officer';
        }
        if (this.api) {
            this.api.setUser(name || 'Credit Officer');
        }
    }

    getUserName() {
        const userNameElement = document.getElementById('userName');
        return userNameElement ? userNameElement.textContent : 'Credit Officer';
    }

    // ===== INIT =====

    async init() {
        try {
            this.setupTabs();
            this.setupSubTabs();
            this.setupEventListeners();

            // Test connection first
            await this.testConnection();
            
            // Load data from the sheet
            await this.loadAllData();

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
                this.ui.showToast('⚠️ ' + result.message + ' - Using mock data', true, 3000);
                // Fallback to mock data if API is not available
                this.api._useMockData = true;
                this.loadMockData();
            } else {
                console.log('✅ Connection successful');
                // Use real API
                this.api._useMockData = false;
            }
            return result;
        } catch (error) {
            console.error('Connection test failed:', error);
            this.ui.showToast('⚠️ Cannot connect to server - Using mock data', true, 5000);
            this.api._useMockData = true;
            this.loadMockData();
            return { connected: false, message: error.message };
        }
    }

    // ===== MOCK DATA (for development/fallback) =====

    loadMockData() {
        // Only load mock data if store is empty
        if (this.api._store.loans.length === 0) {
            this.api._store.loans = [
                { id: 'l1', product: 'SME Loan', customer: 'John Doe', amount: 25000, stage: 'Approved', remarks: 'First draw done', supervisor: 'Looks good. Approved.',
                  history: [{ type: 'officer', content: 'First draw done', timestamp: '2026-08-31T10:00:00Z' }],
                  supervisorHistory: [{ content: 'Looks good. Approved.', timestamp: '2026-08-31T10:30:00Z' }] },
                { id: 'l2', product: 'Agri Loan', customer: 'Jane Smith', amount: 12000, stage: 'Review', remarks: 'Pending docs', supervisor: 'Need KYC update.',
                  history: [{ type: 'officer', content: 'Pending docs', timestamp: '2026-08-30T14:00:00Z' }],
                  supervisorHistory: [{ content: 'Need KYC update.', timestamp: '2026-08-31T09:00:00Z' }] },
            ];
            this.api._store.recoveries = [
                { id: 'r1', customer: 'ABC Ltd', balance: 5400, loanType: 'SME', location: 'Nairobi', actionTaken: 'Called client', supervisor: 'Follow up next week.',
                  history: [{ type: 'officer', content: 'Called client', timestamp: '2026-08-30T11:00:00Z' }],
                  supervisorHistory: [{ content: 'Follow up next week.', timestamp: '2026-08-30T15:00:00Z' }] },
                { id: 'r2', customer: 'XYZ Traders', balance: 2200, loanType: 'Micro', location: 'Kisumu', actionTaken: 'Visited premises', supervisor: 'Payment plan agreed.',
                  history: [{ type: 'officer', content: 'Visited premises', timestamp: '2026-08-29T09:00:00Z' }],
                  supervisorHistory: [{ content: 'Payment plan agreed.', timestamp: '2026-08-29T16:00:00Z' }] },
            ];
            this.api._store.sales = [
                { id: 's1', location: 'Mombasa', date: '10-Mar', purpose: 'New account', status: 'Done', remarks: 'Opened 3 new accounts', supervisor: 'Good work.',
                  history: [{ type: 'officer', content: 'Opened 3 new accounts', timestamp: '2026-08-28T13:00:00Z' }],
                  supervisorHistory: [{ content: 'Good work.', timestamp: '2026-08-28T14:00:00Z' }] },
                { id: 's2', location: 'Eldoret', date: '12-Mar', purpose: 'Cross-sell', status: 'Pending', remarks: 'Follow up next week', supervisor: 'Pending approval.',
                  history: [{ type: 'officer', content: 'Follow up next week', timestamp: '2026-08-29T10:00:00Z' }],
                  supervisorHistory: [{ content: 'Pending approval.', timestamp: '2026-08-29T12:00:00Z' }] },
            ];
        }

        // Mark some as new activity for demo
        this.api.markNotified('loans', 'l1');
        this.api.markNotified('recoveries', 'r1');
    }

    // ===== TABS =====

    setupTabs() {
        const tabs = document.querySelectorAll('.tab-navigation .tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.dataset.tab;
                this.switchMainTab(tabId);
            });
        });
        this.switchMainTab('officer');
    }

    switchMainTab(tab) {
        document.querySelectorAll('.tab-navigation .tab-btn').forEach(b =>
            b.classList.toggle('active', b.dataset.tab === tab)
        );
        document.querySelectorAll('.tab-content').forEach(el =>
            el.classList.toggle('active', el.id === tab + 'View')
        );
        this.currentMainTab = tab;
        document.getElementById('viewModeLabel').textContent =
            tab === 'officer' ? 'Officer View' : 'Supervisor View';

        if (tab === 'supervisor' && this.supervisor) {
            this.supervisor.refreshAll();
        }
        this.updateBadges();
    }

    setupSubTabs() {
        const btns = document.querySelectorAll('#officerSubTabs .sub-tab-btn');
        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchSubTab(btn.dataset.subtab);
            });
        });
        this.switchSubTab('loan');
    }

    switchSubTab(sub) {
        document.querySelectorAll('#officerSubTabs .sub-tab-btn').forEach(b =>
            b.classList.toggle('active', b.dataset.subtab === sub)
        );
        document.querySelectorAll('.sub-tab-content').forEach(el => el.style.display = 'none');
        const target = document.getElementById('subtab' + sub.charAt(0).toUpperCase() + sub.slice(1));
        if (target) target.style.display = 'block';
        this.currentSubTab = sub;
        this.updateBadges();
    }

    // ===== BADGES =====

    updateBadges() {
        const hasLoanNotif = this.api.hasAnyNotifications('loans');
        const hasRecoveryNotif = this.api.hasAnyNotifications('recoveries');
        const hasSalesNotif = this.api.hasAnyNotifications('sales');
        const hasAny = hasLoanNotif || hasRecoveryNotif || hasSalesNotif;

        document.getElementById('officerBadge').classList.toggle('show', hasAny);
        document.getElementById('supervisorBadge').classList.toggle('show', hasAny);
        document.getElementById('loanSubBadge').classList.toggle('show', hasLoanNotif);
        document.getElementById('recoverySubBadge').classList.toggle('show', hasRecoveryNotif);
        document.getElementById('salesSubBadge').classList.toggle('show', hasSalesNotif);
    }

    // ===== EVENT LISTENERS =====

    setupEventListeners() {
        // Add buttons
        document.getElementById('addLoanBtn').addEventListener('click', () => this.openModal('loan'));
        document.getElementById('addRecoveryBtn').addEventListener('click', () => this.openModal('recovery'));
        document.getElementById('addSalesBtn').addEventListener('click', () => this.openModal('sales'));

        // Update record events from UI
        document.addEventListener('updateRecord', (e) => {
            const { type, record } = e.detail;
            this.openModal(type, record);
        });

        // Supervisor comment events
        document.addEventListener('supervisorComment', (e) => {
            const { type, record } = e.detail;
            this.openModal(type, record);
        });
    }

    // ===== MODAL SYSTEM =====

    openModal(type, record = null) {
        this.editingRecord = record;
        const isEdit = !!record;
        const title = isEdit ? `Update ${type.charAt(0).toUpperCase() + type.slice(1)}` :
            `Add New ${type.charAt(0).toUpperCase() + type.slice(1)}`;
        const isSupervisor = this.currentMainTab === 'supervisor';

        // Build history section
        let historyHtml = '';
        if (isEdit) {
            const allHistory = [];
            if (record.history) {
                record.history.forEach(h => {
                    allHistory.push({ type: 'officer', content: h.content, timestamp: h.timestamp });
                });
            }
            if (record.supervisorHistory) {
                record.supervisorHistory.forEach(h => {
                    allHistory.push({ type: 'supervisor', content: h.content, timestamp: h.timestamp });
                });
            }

            const isNew = this.api.hasNotification(type + 's', record.id) || record._hasNewActivity;

            if (allHistory.length > 0) {
                historyHtml = `<div class="history-section"><h4><i class="fas fa-history"></i> Activity History</h4>`;
                allHistory.forEach((item, index) => {
                    const cls = item.type === 'supervisor' ? 'supervisor' : '';
                    const isLatestNew = isNew && index === allHistory.length - 1;
                    const label = item.type === 'supervisor' ? '👤 Supervisor' : '📝 Officer';
                    const time = item.timestamp ? new Date(item.timestamp).toLocaleString() : '';
                    historyHtml += `
                        <div class="history-item ${cls} ${isLatestNew ? 'new' : ''}">
                            <span class="timestamp">${time}</span>
                            <span class="label">${label} ${isLatestNew ? '🔴 NEW' : ''}</span>
                            <div class="content">${item.content || '—'}</div>
                        </div>
                    `;
                });
                historyHtml += `</div>`;
            }
        }

        // Build form fields - Supervisor Comment field ONLY in Supervisor View
        let supervisorField = '';
        if (isSupervisor) {
            supervisorField = `
                <div class="modal-field">
                    <label>Supervisor Comment</label>
                    <textarea id="modalSupervisor" rows="2" placeholder="Add supervisor comment...">${record?.supervisor || ''}</textarea>
                </div>
            `;
        }

        let fields = '';
        if (type === 'loan') {
            fields = `
                <div class="modal-field"><label>Product</label><input id="modalProduct" value="${record?.product || ''}" placeholder="SME Loan" /></div>
                <div class="modal-field"><label>Customer</label><input id="modalCustomer" value="${record?.customer || ''}" placeholder="Customer name" /></div>
                <div class="modal-field"><label>Amount</label><input id="modalAmount" type="number" step="0.01" value="${record?.amount || ''}" placeholder="0" /></div>
                <div class="modal-field"><label>Stage</label>
                    <select id="modalStage">
                        <option value="Review" ${record?.stage === 'Review' ? 'selected' : ''}>Review</option>
                        <option value="Approved" ${record?.stage === 'Approved' ? 'selected' : ''}>Approved</option>
                        <option value="Pending" ${record?.stage === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="Declined" ${record?.stage === 'Declined' ? 'selected' : ''}>Declined</option>
                    </select>
                </div>
                <div class="modal-field"><label>Remarks</label><textarea id="modalRemarks" rows="2">${record?.remarks || ''}</textarea></div>
                ${supervisorField}
            `;
        } else if (type === 'recovery') {
            fields = `
                <div class="modal-field"><label>Customer</label><input id="modalCustomer" value="${record?.customer || ''}" placeholder="Customer" /></div>
                <div class="modal-field"><label>Balance</label><input id="modalBalance" type="number" step="0.01" value="${record?.balance || ''}" placeholder="0.00" /></div>
                <div class="modal-field"><label>Loan Type</label><input id="modalLoanType" value="${record?.loanType || ''}" placeholder="SME" /></div>
                <div class="modal-field"><label>Location</label><input id="modalLocation" value="${record?.location || ''}" placeholder="City" /></div>
                <div class="modal-field"><label>Action Taken</label><textarea id="modalAction" rows="2">${record?.actionTaken || ''}</textarea></div>
                ${supervisorField}
            `;
        } else if (type === 'sales') {
            fields = `
                <div class="modal-field"><label>Location</label><input id="modalLocation" value="${record?.location || ''}" placeholder="Location" /></div>
                <div class="modal-field"><label>Date</label><input id="modalDate" value="${record?.date || ''}" placeholder="DD-MMM" /></div>
                <div class="modal-field"><label>Purpose</label><input id="modalPurpose" value="${record?.purpose || ''}" placeholder="Purpose" /></div>
                <div class="modal-field"><label>Status</label>
                    <select id="modalStatus">
                        <option value="Open" ${record?.status === 'Open' ? 'selected' : ''}>Open</option>
                        <option value="Done" ${record?.status === 'Done' ? 'selected' : ''}>Done</option>
                        <option value="Pending" ${record?.status === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="Closed" ${record?.status === 'Closed' ? 'selected' : ''}>Closed</option>
                    </select>
                </div>
                <div class="modal-field"><label>Remarks</label><textarea id="modalRemarks" rows="2">${record?.remarks || ''}</textarea></div>
                ${supervisorField}
            `;
        }

        // Create modal
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal-box">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" id="modalCloseBtn">&times;</button>
                </div>
                <form id="modalForm">
                    ${historyHtml}
                    ${fields}
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="modalCancelBtn">Cancel</button>
                        <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Save'}</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(overlay);

        const closeModal = () => {
            document.body.removeChild(overlay);
            if (record) {
                this.api.clearNotification(type + 's', record.id);
                this.updateBadges();
                this.renderAll();
            }
        };

        overlay.querySelector('#modalCloseBtn').addEventListener('click', closeModal);
        overlay.querySelector('#modalCancelBtn').addEventListener('click', closeModal);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

        overlay.querySelector('#modalForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = this.collectModalData(type, overlay, isSupervisor);
            if (!data) {
                this.ui.showToast('❌ Please fill required fields', true, 2000);
                return;
            }

            try {
                let result;
                if (isEdit) {
                    if (type === 'loan') result = await this.api.updateLoan(record.id, data);
                    else if (type === 'recovery') result = await this.api.updateRecovery(record.id, data);
                    else if (type === 'sales') result = await this.api.updateSales(record.id, data);
                } else {
                    if (type === 'loan') result = await this.api.createLoan(data);
                    else if (type === 'recovery') result = await this.api.createRecovery(data);
                    else if (type === 'sales') result = await this.api.createSales(data);
                }

                if (result && result.success) {
                    this.ui.showToast(isEdit ? '✅ Updated successfully' : '✅ Saved successfully', false, 1500);
                    if (isEdit) {
                        this.api.clearNotification(type + 's', record.id);
                    }
                    closeModal();
                    await this.loadAllData(); // Refresh data from sheet
                    if (this.currentMainTab === 'supervisor' && this.supervisor) {
                        this.supervisor.refreshAll();
                    }
                    this.updateBadges();
                } else {
                    this.ui.showToast('❌ Operation failed: ' + (result?.error || 'Unknown error'), true, 2000);
                }
            } catch (err) {
                this.ui.showToast('❌ Error: ' + err.message, true, 2500);
            }
        });
    }

    collectModalData(type, overlay, isSupervisor) {
        const get = (id) => overlay.querySelector(id)?.value || '';
        const supervisor = isSupervisor ? get('#modalSupervisor').trim() : '';

        if (type === 'loan') {
            const product = get('#modalProduct').trim();
            const customer = get('#modalCustomer').trim();
            const amount = parseFloat(get('#modalAmount')) || 0;
            if (!product || !customer || amount <= 0) return null;
            const data = { product, customer, amount, stage: get('#modalStage'), remarks: get('#modalRemarks') };
            if (isSupervisor) data.supervisor = supervisor;
            return data;
        } else if (type === 'recovery') {
            const customer = get('#modalCustomer').trim();
            const balance = parseFloat(get('#modalBalance')) || 0;
            const location = get('#modalLocation').trim();
            if (!customer || balance < 0 || !location) return null;
            const data = { customer, balance, loanType: get('#modalLoanType'), location, actionTaken: get('#modalAction') };
            if (isSupervisor) data.supervisor = supervisor;
            return data;
        } else if (type === 'sales') {
            const location = get('#modalLocation').trim();
            const purpose = get('#modalPurpose').trim();
            if (!location || !purpose) return null;
            const data = { location, date: get('#modalDate'), purpose, status: get('#modalStatus'), remarks: get('#modalRemarks') };
            if (isSupervisor) data.supervisor = supervisor;
            return data;
        }
        return null;
    }

    // ===== LOAD DATA FROM SHEET =====

    async loadAllData() {
        if (this.isLoading) return;
        this.isLoading = true;
        this.ui.showToast('⏳ Loading data...', false, 0);

        try {
            const results = await this.api.batchRequest({
                loans: { action: '/loan/list', data: {} },
                recoveries: { action: '/recovery/list', data: {} },
                sales: { action: '/sales/list', data: {} }
            });

            // Extract data from responses
            let loans = this.ui.extractData(results.loans);
            let recoveries = this.ui.extractData(results.recoveries);
            let sales = this.ui.extractData(results.sales);

            // If using mock data, use the store
            if (this.api._useMockData) {
                loans = this.api._store.loans || [];
                recoveries = this.api._store.recoveries || [];
                sales = this.api._store.sales || [];
            }

            console.log('Loaded data:', { 
                loansCount: loans.length, 
                recoveriesCount: recoveries.length, 
                salesCount: sales.length 
            });

            // Update the UI
            this.ui.renderLoanTable(loans);
            this.ui.renderRecoveryTable(recoveries);
            this.ui.renderSalesTable(sales);

            // Update supervisor view
            if (this.supervisor) {
                this.supervisor.renderLoanTable(loans);
                this.supervisor.renderRecoveryTable(recoveries);
                this.supervisor.renderSalesTable(sales);
            }

            this.ui.showToast('✅ Data loaded: ' + loans.length + ' loans, ' + recoveries.length + ' recoveries, ' + sales.length + ' sales', false, 2000);

        } catch (error) {
            console.error('Error loading data:', error);
            this.ui.showToast('❌ Failed to load data: ' + error.message, true, 5000);
            
            // Fallback to mock data
            if (!this.api._useMockData) {
                this.api._useMockData = true;
                this.loadMockData();
                this.renderAll();
            }
        } finally {
            this.isLoading = false;
        }
    }

    // ===== RENDER ALL =====

    renderAll() {
        // Use the store data
        const loans = this.api._useMockData ? this.api._store.loans || [] : [];
        const recoveries = this.api._useMockData ? this.api._store.recoveries || [] : [];
        const sales = this.api._useMockData ? this.api._store.sales || [] : [];

        this.ui.renderLoanTable(loans);
        this.ui.renderRecoveryTable(recoveries);
        this.ui.renderSalesTable(sales);
        this.updateBadges();
    }

    // ===== REFRESH =====

    async refreshData() {
        await this.loadAllData();
        this.ui.showToast('🔄 Data refreshed', false, 2000);
    }
}

// ===== INITIALIZE =====
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CreditOfficerApp();
});

console.log('📋 Available methods:');
console.log('  - window.app.setUserName("Your Name") - Set user name');
console.log('  - window.app.refreshData() - Refresh all data');
console.log('  - window.app.api.getLoans() - Fetch loans');
console.log('  - window.app.api.getRecoveries() - Fetch recoveries');
console.log('  - window.app.api.getSales() - Fetch sales');
