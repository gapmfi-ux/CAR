/**
 * UI Module - DOM Manipulation and Rendering
 * Handles all UI updates, form interactions, and view management
 */

class UI {
    constructor() {
        this.toastElement = document.getElementById('statusMessage');
        this.toastText = document.getElementById('statusText');
        this.toastTimeout = null;
    }

    // ===== DATA EXTRACTION HELPERS =====
    
    extractData(response) {
        if (!response) return [];
        if (response.error) return [];
        if (response.data && Array.isArray(response.data)) return response.data;
        if (Array.isArray(response)) return response;
        if (response.data && response.data.data && Array.isArray(response.data.data)) {
            return response.data.data;
        }
        return [];
    }

    // ===== TOAST NOTIFICATIONS =====

    showToast(message, isError = false, duration = 3000) {
        this.toastText.textContent = message;
        this.toastElement.style.display = 'block';
        this.toastElement.style.background = isError ? '#a13d3d' : '#1a4a6e';
        
        if (this.toastTimeout) {
            clearTimeout(this.toastTimeout);
        }
        
        if (duration > 0) {
            this.toastTimeout = setTimeout(() => {
                this.toastElement.style.display = 'none';
            }, duration);
        }
    }

    hideToast() {
        this.toastElement.style.display = 'none';
        if (this.toastTimeout) {
            clearTimeout(this.toastTimeout);
        }
    }

    // ===== PARAGRAPH CELL RENDERER =====

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

    // ===== SUPERVISOR CELL RENDERER (for Officer view) =====
    createSupervisorCell(text) {
        const td = document.createElement('td');
        td.className = 'supervisor-cell';

        if (!text || text.trim() === '') {
            td.innerHTML = '<span class="no-comment"><i class="far fa-comment"></i> No comment</span>';
            return td;
        }

        // Comments stored as multiple entries separated by "\n---\n"
        const parts = (text || '').split(/\n---\n/).filter(p => p.trim() !== '');
        parts.forEach(part => {
            const p = document.createElement('p');
            p.textContent = part.trim();
            td.appendChild(p);
        });
        return td;
    }

    // ===== OFFICER VIEW - LOAN TABLE =====

    renderLoanTable(loans) {
        const tbody = document.getElementById('loanTableBody');
        const inputRow = document.getElementById('loanInputRow');
        
        while (tbody.firstChild) {
            tbody.removeChild(tbody.firstChild);
        }
        tbody.appendChild(inputRow);
        
        const loansArray = Array.isArray(loans) ? loans : this.extractData(loans);
        
        if (loansArray && loansArray.length > 0) {
            loansArray.forEach(loan => {
                const row = this.createOfficerLoanRow(loan);
                tbody.insertBefore(row, inputRow);
            });
        }
        
        document.getElementById('loanCount').textContent = loansArray ? loansArray.length : 0;
    }

    createOfficerLoanRow(loan) {
        const tr = document.createElement('tr');
        
        const fields = [
            loan.product || loan.Product || '—',
            loan.customer || loan.Customer || '—',
            (typeof (loan.amount || loan.Amount || 0) === 'number') 
                ? (loan.amount || loan.Amount || 0).toLocaleString() 
                : (loan.amount || loan.Amount || '—')
        ];
        
        fields.forEach(val => {
            const td = document.createElement('td');
            td.textContent = val;
            tr.appendChild(td);
        });
        
        tr.appendChild(this.createStatusCell(loan.stage || loan.Stage || 'Review'));
        tr.appendChild(this.createParagraphCell(loan.remarks || loan.Remarks || '', 'remark-cell'));
        // Supervisor comments visible on officer row
        tr.appendChild(this.createSupervisorCell(loan.supervisor || loan.SupervisorComments || ''));
        
        const actionTd = document.createElement('td');
        actionTd.style.textAlign = 'center';
        const editBtn = document.createElement('button');
        editBtn.className = 'action-btn';
        editBtn.title = 'Edit';
        editBtn.innerHTML = '<i class="fas fa-edit"></i> ✏️ Edit';
        editBtn.addEventListener('click', () => {
            alert('✏️ Edit Loan Record:\n\n' + JSON.stringify(loan, null, 2));
        });
        actionTd.appendChild(editBtn);
        tr.appendChild(actionTd);
        
        return tr;
    }

    addOfficerLoanRow(loan) {
        const tbody = document.getElementById('loanTableBody');
        const inputRow = document.getElementById('loanInputRow');
        const row = this.createOfficerLoanRow(loan);
        tbody.insertBefore(row, inputRow);
        document.getElementById('loanCount').textContent = tbody.querySelectorAll('tr:not(.input-row)').length;
    }

    getLoanFormData() {
        return {
            product: document.getElementById('loanType').value.trim(),
            customer: document.getElementById('loanCustomer').value.trim(),
            amount: parseFloat(document.getElementById('loanAmount').value) || 0,
            stage: document.getElementById('loanStage').value,
            remarks: document.getElementById('loanRemarks').value
        };
    }

    clearLoanForm() {
        document.getElementById('loanType').value = '';
        document.getElementById('loanCustomer').value = '';
        document.getElementById('loanAmount').value = '';
        document.getElementById('loanStage').selectedIndex = 0;
        document.getElementById('loanRemarks').value = '';
    }

    // ===== OFFICER VIEW - RECOVERY TABLE =====

    renderRecoveryTable(recoveries) {
        const tbody = document.getElementById('recoveryTableBody');
        const inputRow = document.getElementById('recoveryInputRow');
        
        while (tbody.firstChild) {
            tbody.removeChild(tbody.firstChild);
        }
        tbody.appendChild(inputRow);
        
        const recoveriesArray = Array.isArray(recoveries) ? recoveries : this.extractData(recoveries);
        
        if (recoveriesArray && recoveriesArray.length > 0) {
            recoveriesArray.forEach(recovery => {
                const row = this.createOfficerRecoveryRow(recovery);
                tbody.insertBefore(row, inputRow);
            });
        }
        
        document.getElementById('recoveryCount').textContent = recoveriesArray ? recoveriesArray.length : 0;
    }

    createOfficerRecoveryRow(recovery) {
        const tr = document.createElement('tr');
        
        const fields = [
            recovery.customer || recovery.Customer || '—',
            (typeof (recovery.balance || recovery.Balance || 0) === 'number') 
                ? (recovery.balance || recovery.Balance || 0).toLocaleString() 
                : (recovery.balance || recovery.Balance || '—'),
            recovery.loanType || recovery.LoanType || '—',
            recovery.location || recovery.Location || '—'
        ];
        
        fields.forEach(val => {
            const td = document.createElement('td');
            td.textContent = val;
            tr.appendChild(td);
        });
        
        tr.appendChild(this.createParagraphCell(recovery.actionTaken || recovery.ActionTaken || '', 'remark-cell'));
        // Supervisor comments visible on officer row
        tr.appendChild(this.createSupervisorCell(recovery.supervisor || recovery.SupervisorComments || ''));
        
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

    addOfficerRecoveryRow(recovery) {
        const tbody = document.getElementById('recoveryTableBody');
        const inputRow = document.getElementById('recoveryInputRow');
        const row = this.createOfficerRecoveryRow(recovery);
        tbody.insertBefore(row, inputRow);
        document.getElementById('recoveryCount').textContent = tbody.querySelectorAll('tr:not(.input-row)').length;
    }

    getRecoveryFormData() {
        return {
            customer: document.getElementById('recCustomer').value.trim(),
            balance: parseFloat(document.getElementById('recBalance').value) || 0,
            loanType: document.getElementById('recLoanType').value.trim(),
            location: document.getElementById('recLocation').value.trim(),
            actionTaken: document.getElementById('recAction').value
        };
    }

    clearRecoveryForm() {
        document.getElementById('recCustomer').value = '';
        document.getElementById('recBalance').value = '';
        document.getElementById('recLoanType').value = '';
        document.getElementById('recLocation').value = '';
        document.getElementById('recAction').value = '';
    }

    // ===== OFFICER VIEW - SALES TABLE =====

    renderSalesTable(sales) {
        const tbody = document.getElementById('salesTableBody');
        const inputRow = document.getElementById('salesInputRow');
        
        while (tbody.firstChild) {
            tbody.removeChild(tbody.firstChild);
        }
        tbody.appendChild(inputRow);
        
        const salesArray = Array.isArray(sales) ? sales : this.extractData(sales);
        
        if (salesArray && salesArray.length > 0) {
            salesArray.forEach(sale => {
                const row = this.createOfficerSalesRow(sale);
                tbody.insertBefore(row, inputRow);
            });
        }
        
        document.getElementById('salesCount').textContent = salesArray ? salesArray.length : 0;
    }

    createOfficerSalesRow(sale) {
        const tr = document.createElement('tr');
        
        const fields = [
            sale.location || sale.Location || '—',
            sale.date || sale.Date || '—',
            sale.purpose || sale.Purpose || '—'
        ];
        
        fields.forEach(val => {
            const td = document.createElement('td');
            td.textContent = val;
            tr.appendChild(td);
        });
        
        tr.appendChild(this.createStatusCell(sale.status || sale.Status || 'Open'));
        tr.appendChild(this.createParagraphCell(sale.remarks || sale.Remarks || '', 'remark-cell'));
        // Supervisor comments visible on officer row
        tr.appendChild(this.createSupervisorCell(sale.supervisor || sale.SupervisorComments || ''));
        
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

    addOfficerSalesRow(sale) {
        const tbody = document.getElementById('salesTableBody');
        const inputRow = document.getElementById('salesInputRow');
        const row = this.createOfficerSalesRow(sale);
        tbody.insertBefore(row, inputRow);
        document.getElementById('salesCount').textContent = tbody.querySelectorAll('tr:not(.input-row)').length;
    }

    getSalesFormData() {
        return {
            location: document.getElementById('salesLocation').value.trim(),
            date: document.getElementById('salesDate').value.trim() || this.getCurrentDate(),
            purpose: document.getElementById('salesPurpose').value.trim(),
            status: document.getElementById('salesStatus').value,
            remarks: document.getElementById('salesRemarks').value
        };
    }

    clearSalesForm() {
        document.getElementById('salesLocation').value = '';
        document.getElementById('salesDate').value = '';
        document.getElementById('salesPurpose').value = '';
        document.getElementById('salesStatus').selectedIndex = 0;
        document.getElementById('salesRemarks').value = '';
    }

    // ===== HELPER FUNCTIONS =====

    getCurrentDate() {
        const date = new Date();
        const day = String(date.getDate()).padStart(2, '0');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${day}-${months[date.getMonth()]}`;
    }

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

    updateWeekBadge() {
        document.getElementById('currentWeek').textContent = this.getCurrentWeek();
    }
}

window.UI = UI;
