/**
 * UI Module - DOM Manipulation and Rendering
 * Handles all UI updates, form interactions, and view management
 */

class UI {
    constructor() {
        this.container = document.querySelector('.report-container');
        this.toastElement = document.getElementById('statusMessage');
        this.toastText = document.getElementById('statusText');
        this.currentView = 'officer';
    }

    // ===== VIEW MANAGEMENT =====

    /**
     * Update the view based on role (Officer/Supervisor)
     * @param {string} view - 'officer' or 'supervisor'
     */
    updateView(view) {
        this.currentView = view;
        
        if (view === 'supervisor') {
            this.container.classList.remove('officer-view');
            this.container.classList.add('supervisor-view');
            document.getElementById('roleIndicator').textContent = 'Supervisor';
            document.getElementById('roleIndicator').style.background = '#1f5a8a';
            document.getElementById('viewModeLabel').textContent = 'Supervisor view';
        } else {
            this.container.classList.remove('supervisor-view');
            this.container.classList.add('officer-view');
            document.getElementById('roleIndicator').textContent = 'Officer';
            document.getElementById('roleIndicator').style.background = '#6b8ba4';
            document.getElementById('viewModeLabel').textContent = 'Officer view';
        }
    }

    // ===== TOAST NOTIFICATIONS =====

    /**
     * Show a toast notification
     * @param {string} message - Message to display
     * @param {boolean} isError - Whether this is an error message
     * @param {number} duration - Display duration in ms
     */
    showToast(message, isError = false, duration = 3000) {
        this.toastText.textContent = message;
        this.toastElement.style.display = 'block';
        this.toastElement.style.background = isError ? '#a13d3d' : '#1a4a6e';
        
        // Clear any existing timeout
        if (this.toastTimeout) {
            clearTimeout(this.toastTimeout);
        }
        
        this.toastTimeout = setTimeout(() => {
            this.toastElement.style.display = 'none';
        }, duration);
    }

    /**
     * Hide the toast notification
     */
    hideToast() {
        this.toastElement.style.display = 'none';
        if (this.toastTimeout) {
            clearTimeout(this.toastTimeout);
        }
    }

    // ===== PARAGRAPH CELL RENDERER =====

    /**
     * Create a paragraph-formatted cell from text
     * @param {string} text - Text content with line breaks
     * @param {string} className - CSS class for the cell
     * @returns {HTMLElement} - TD element with paragraph formatting
     */
    createParagraphCell(text, className = 'remark-cell') {
        const td = document.createElement('td');
        td.className = className;
        
        if (!text || text.trim() === '') {
            td.textContent = '—';
            return td;
        }
        
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
        if (lines.length === 0) {
            td.textContent = '—';
            return td;
        }
        
        lines.forEach((line) => {
            const p = document.createElement('p');
            p.textContent = line.trim();
            td.appendChild(p);
        });
        
        return td;
    }

    /**
     * Create a status badge cell
     * @param {string} status - Status value
     * @returns {HTMLElement} - TD element with status badge
     */
    createStatusCell(status) {
        const td = document.createElement('td');
        const badge = document.createElement('span');
        badge.className = 'status-badge';
        
        const label = status || '—';
        const lower = label.toLowerCase();
        
        if (lower === 'approved' || lower === 'done') {
            badge.style.background = '#b8d9b0';
        } else if (lower === 'review' || lower === 'pending') {
            badge.style.background = '#faeec2';
        } else if (lower === 'declined' || lower === 'closed') {
            badge.style.background = '#f5cfcf';
        }
        
        badge.textContent = label;
        td.appendChild(badge);
        return td;
    }

    // ===== LOAN TABLE RENDERER =====

    /**
     * Render loan records to the table
     * @param {Array} loans - Array of loan records
     */
    renderLoanTable(loans) {
        const tbody = document.getElementById('loanTableBody');
        const inputRow = document.getElementById('loanInputRow');
        
        // Clear existing rows (keep input row)
        while (tbody.firstChild) {
            tbody.removeChild(tbody.firstChild);
        }
        
        // Add input row first
        tbody.appendChild(inputRow);
        
        // Add each loan record
        if (loans && loans.length > 0) {
            loans.forEach(loan => {
                const row = this.createLoanRow(loan);
                tbody.insertBefore(row, inputRow);
            });
        }
        
        // Update count
        document.getElementById('loanCount').textContent = loans ? loans.length : 0;
    }

    /**
     * Create a loan row from record data
     * @param {object} loan - Loan record
     * @returns {HTMLElement} - TR element
     */
    createLoanRow(loan) {
        const tr = document.createElement('tr');
        
        // Product
        const productTd = document.createElement('td');
        productTd.textContent = loan.product || loan.Product || '—';
        tr.appendChild(productTd);
        
        // Customer
        const customerTd = document.createElement('td');
        customerTd.textContent = loan.customer || loan.Customer || '—';
        tr.appendChild(customerTd);
        
        // Amount
        const amountTd = document.createElement('td');
        const amount = loan.amount || loan.Amount || 0;
        amountTd.textContent = typeof amount === 'number' ? amount.toLocaleString() : amount;
        tr.appendChild(amountTd);
        
        // Stage
        const stage = loan.stage || loan.Stage || 'Review';
        tr.appendChild(this.createStatusCell(stage));
        
        // Remarks
        const remarks = loan.remarks || loan.Remarks || '';
        tr.appendChild(this.createParagraphCell(remarks, 'remark-cell'));
        
        // Supervisor Comments (only visible in supervisor view)
        const supervisor = loan.supervisor || loan.SupervisorComments || '';
        tr.appendChild(this.createParagraphCell(supervisor, 'supervisor-cell supervisor-col'));
        
        // Action
        const actionTd = document.createElement('td');
        actionTd.style.textAlign = 'center';
        const editBtn = document.createElement('button');
        editBtn.className = 'action-btn';
        editBtn.title = 'Edit';
        editBtn.innerHTML = '<i class="fas fa-edit"></i> ✏️ Edit';
        editBtn.addEventListener('click', () => {
            // In a real app, this would open an edit modal
            // For now, we'll show the data in an alert
            alert('✏️ Edit Loan Record:\n\n' + JSON.stringify(loan, null, 2));
        });
        actionTd.appendChild(editBtn);
        tr.appendChild(actionTd);
        
        return tr;
    }

    /**
     * Add a single loan row (for new records)
     * @param {object} loan - New loan record
     */
    addLoanRow(loan) {
        const tbody = document.getElementById('loanTableBody');
        const inputRow = document.getElementById('loanInputRow');
        const row = this.createLoanRow(loan);
        tbody.insertBefore(row, inputRow);
        
        // Update count
        const count = tbody.querySelectorAll('tr:not(.input-row)').length;
        document.getElementById('loanCount').textContent = count;
    }

    /**
     * Get loan form data from input fields
     * @returns {object} - Loan data object
     */
    getLoanFormData() {
        return {
            product: document.getElementById('loanType').value.trim(),
            customer: document.getElementById('loanCustomer').value.trim(),
            amount: parseFloat(document.getElementById('loanAmount').value) || 0,
            stage: document.getElementById('loanStage').value,
            remarks: document.getElementById('loanRemarks').value,
            supervisor: document.getElementById('loanSupervisor').value
        };
    }

    /**
     * Clear loan form fields
     */
    clearLoanForm() {
        document.getElementById('loanType').value = '';
        document.getElementById('loanCustomer').value = '';
        document.getElementById('loanAmount').value = '';
        document.getElementById('loanStage').selectedIndex = 0;
        document.getElementById('loanRemarks').value = '';
        document.getElementById('loanSupervisor').value = '';
    }

    // ===== RECOVERY TABLE RENDERER =====

    /**
     * Render recovery records to the table
     * @param {Array} recoveries - Array of recovery records
     */
    renderRecoveryTable(recoveries) {
        const tbody = document.getElementById('recoveryTableBody');
        const inputRow = document.getElementById('recoveryInputRow');
        
        while (tbody.firstChild) {
            tbody.removeChild(tbody.firstChild);
        }
        tbody.appendChild(inputRow);
        
        if (recoveries && recoveries.length > 0) {
            recoveries.forEach(recovery => {
                const row = this.createRecoveryRow(recovery);
                tbody.insertBefore(row, inputRow);
            });
        }
        
        document.getElementById('recoveryCount').textContent = recoveries ? recoveries.length : 0;
    }

    /**
     * Create a recovery row from record data
     * @param {object} recovery - Recovery record
     * @returns {HTMLElement} - TR element
     */
    createRecoveryRow(recovery) {
        const tr = document.createElement('tr');
        
        // Customer
        const customerTd = document.createElement('td');
        customerTd.textContent = recovery.customer || recovery.Customer || '—';
        tr.appendChild(customerTd);
        
        // Balance
        const balanceTd = document.createElement('td');
        const balance = recovery.balance || recovery.Balance || 0;
        balanceTd.textContent = typeof balance === 'number' ? balance.toLocaleString() : balance;
        tr.appendChild(balanceTd);
        
        // Loan Type
        const loanTypeTd = document.createElement('td');
        loanTypeTd.textContent = recovery.loanType || recovery.LoanType || '—';
        tr.appendChild(loanTypeTd);
        
        // Location
        const locationTd = document.createElement('td');
        locationTd.textContent = recovery.location || recovery.Location || '—';
        tr.appendChild(locationTd);
        
        // Action Taken
        const action = recovery.actionTaken || recovery.ActionTaken || '';
        tr.appendChild(this.createParagraphCell(action, 'remark-cell'));
        
        // Supervisor Comments
        const supervisor = recovery.supervisor || recovery.SupervisorComments || '';
        tr.appendChild(this.createParagraphCell(supervisor, 'supervisor-cell supervisor-col'));
        
        // Action
        const actionTd = document.createElement('td');
        actionTd.style.textAlign = 'center';
        const editBtn = document.createElement('button');
        editBtn.className = 'action-btn';
        editBtn.title = 'Edit';
        editBtn.innerHTML = '<i class="fas fa-edit"></i> ✏️ Edit';
        editBtn.addEventListener('click', () => {
            alert('✏️ Edit Recovery Record:\n\n' + JSON.stringify(recovery, null, 2));
        });
        actionTd.appendChild(editBtn);
        tr.appendChild(actionTd);
        
        return tr;
    }

    /**
     * Add a single recovery row
     * @param {object} recovery - New recovery record
     */
    addRecoveryRow(recovery) {
        const tbody = document.getElementById('recoveryTableBody');
        const inputRow = document.getElementById('recoveryInputRow');
        const row = this.createRecoveryRow(recovery);
        tbody.insertBefore(row, inputRow);
        
        const count = tbody.querySelectorAll('tr:not(.input-row)').length;
        document.getElementById('recoveryCount').textContent = count;
    }

    /**
     * Get recovery form data
     * @returns {object} - Recovery data object
     */
    getRecoveryFormData() {
        return {
            customer: document.getElementById('recCustomer').value.trim(),
            balance: parseFloat(document.getElementById('recBalance').value) || 0,
            loanType: document.getElementById('recLoanType').value.trim(),
            location: document.getElementById('recLocation').value.trim(),
            actionTaken: document.getElementById('recAction').value,
            supervisor: document.getElementById('recSupervisor').value
        };
    }

    /**
     * Clear recovery form fields
     */
    clearRecoveryForm() {
        document.getElementById('recCustomer').value = '';
        document.getElementById('recBalance').value = '';
        document.getElementById('recLoanType').value = '';
        document.getElementById('recLocation').value = '';
        document.getElementById('recAction').value = '';
        document.getElementById('recSupervisor').value = '';
    }

    // ===== SALES TABLE RENDERER =====

    /**
     * Render sales records to the table
     * @param {Array} sales - Array of sales records
     */
    renderSalesTable(sales) {
        const tbody = document.getElementById('salesTableBody');
        const inputRow = document.getElementById('salesInputRow');
        
        while (tbody.firstChild) {
            tbody.removeChild(tbody.firstChild);
        }
        tbody.appendChild(inputRow);
        
        if (sales && sales.length > 0) {
            sales.forEach(sale => {
                const row = this.createSalesRow(sale);
                tbody.insertBefore(row, inputRow);
            });
        }
        
        document.getElementById('salesCount').textContent = sales ? sales.length : 0;
    }

    /**
     * Create a sales row from record data
     * @param {object} sale - Sales record
     * @returns {HTMLElement} - TR element
     */
    createSalesRow(sale) {
        const tr = document.createElement('tr');
        
        // Location
        const locationTd = document.createElement('td');
        locationTd.textContent = sale.location || sale.Location || '—';
        tr.appendChild(locationTd);
        
        // Date
        const dateTd = document.createElement('td');
        dateTd.textContent = sale.date || sale.Date || '—';
        tr.appendChild(dateTd);
        
        // Purpose
        const purposeTd = document.createElement('td');
        purposeTd.textContent = sale.purpose || sale.Purpose || '—';
        tr.appendChild(purposeTd);
        
        // Status
        const status = sale.status || sale.Status || 'Open';
        tr.appendChild(this.createStatusCell(status));
        
        // Remarks
        const remarks = sale.remarks || sale.Remarks || '';
        tr.appendChild(this.createParagraphCell(remarks, 'remark-cell'));
        
        // Supervisor Comments
        const supervisor = sale.supervisor || sale.SupervisorComments || '';
        tr.appendChild(this.createParagraphCell(supervisor, 'supervisor-cell supervisor-col'));
        
        // Action
        const actionTd = document.createElement('td');
        actionTd.style.textAlign = 'center';
        const editBtn = document.createElement('button');
        editBtn.className = 'action-btn';
        editBtn.title = 'Edit';
        editBtn.innerHTML = '<i class="fas fa-edit"></i> ✏️ Edit';
        editBtn.addEventListener('click', () => {
            alert('✏️ Edit Sales Record:\n\n' + JSON.stringify(sale, null, 2));
        });
        actionTd.appendChild(editBtn);
        tr.appendChild(actionTd);
        
        return tr;
    }

    /**
     * Add a single sales row
     * @param {object} sale - New sales record
     */
    addSalesRow(sale) {
        const tbody = document.getElementById('salesTableBody');
        const inputRow = document.getElementById('salesInputRow');
        const row = this.createSalesRow(sale);
        tbody.insertBefore(row, inputRow);
        
        const count = tbody.querySelectorAll('tr:not(.input-row)').length;
        document.getElementById('salesCount').textContent = count;
    }

    /**
     * Get sales form data
     * @returns {object} - Sales data object
     */
    getSalesFormData() {
        return {
            location: document.getElementById('salesLocation').value.trim(),
            date: document.getElementById('salesDate').value.trim() || this.getCurrentDate(),
            purpose: document.getElementById('salesPurpose').value.trim(),
            status: document.getElementById('salesStatus').value,
            remarks: document.getElementById('salesRemarks').value,
            supervisor: document.getElementById('salesSupervisor').value
        };
    }

    /**
     * Clear sales form fields
     */
    clearSalesForm() {
        document.getElementById('salesLocation').value = '';
        document.getElementById('salesDate').value = '';
        document.getElementById('salesPurpose').value = '';
        document.getElementById('salesStatus').selectedIndex = 0;
        document.getElementById('salesRemarks').value = '';
        document.getElementById('salesSupervisor').value = '';
    }

    // ===== HELPER FUNCTIONS =====

    /**
     * Get current date in DD-MMM format
     * @returns {string} - Formatted date
     */
    getCurrentDate() {
        const date = new Date();
        const day = String(date.getDate()).padStart(2, '0');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${day}-${months[date.getMonth()]}`;
    }

    /**
     * Get current week range
     * @returns {string} - Week range string
     */
    getCurrentWeek() {
        const now = new Date();
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(now);
        monday.setDate(diff);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const format = (d) => `${d.getDate()} ${months[d.getMonth()]}`;
        
        return `${format(monday)} – ${format(sunday)}, ${sunday.getFullYear()}`;
    }

    /**
     * Update the week badge
     */
    updateWeekBadge() {
        document.getElementById('currentWeek').textContent = this.getCurrentWeek();
    }
}

// Export as global
window.UI = UI;
