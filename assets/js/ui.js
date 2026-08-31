/**
 * UI Module - DOM Manipulation and Rendering
 * Handles all UI updates, form interactions, and view management
 */

class UI {
    constructor() {
        this.toastElement = document.getElementById('statusMessage');
        this.toastText = document.getElementById('statusText');
        this.toastTimeout = null;
        this.api = window.API;
    }

    // ===== DATA EXTRACTION HELPERS =====

    extractData(response) {
        if (!response) return [];
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

    // ===== CELL RENDERERS =====

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
        tbody.innerHTML = '';

        const loansArray = Array.isArray(loans) ? loans : this.extractData(loans);

        if (!loansArray || loansArray.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty-state"><i class="fas fa-inbox"></i> No loan records</td></tr>';
            document.getElementById('loanCount').textContent = '0';
            return;
        }

        loansArray.forEach(loan => {
            const row = this.createOfficerLoanRow(loan);
            tbody.appendChild(row);
        });

        document.getElementById('loanCount').textContent = loansArray.length;
    }

    createOfficerLoanRow(loan) {
        const tr = document.createElement('tr');
        const hasNew = this.api?.hasNotification('loans', loan.id) || loan._hasNewActivity || false;
        if (hasNew) tr.className = 'row-new-activity';

        // Product
        const td1 = document.createElement('td');
        td1.textContent = loan.product || loan.Product || '—';
        tr.appendChild(td1);

        // Customer
        const td2 = document.createElement('td');
        td2.textContent = loan.customer || loan.Customer || '—';
        tr.appendChild(td2);

        // Amount
        const td3 = document.createElement('td');
        const amount = loan.amount || loan.Amount || 0;
        td3.textContent = typeof amount === 'number' ? amount.toLocaleString() : amount;
        tr.appendChild(td3);

        // Stage
        tr.appendChild(this.createStatusCell(loan.stage || loan.Stage || 'Review'));

        // Remarks
        tr.appendChild(this.createParagraphCell(loan.remarks || loan.Remarks || '', 'remark-cell'));

        // Supervisor Comments (read-only for officer)
        tr.appendChild(this.createSupervisorCell(loan.supervisor || loan.SupervisorComments || ''));

        // Action - Update button
        const actionTd = document.createElement('td');
        actionTd.style.textAlign = 'center';
        const updateBtn = document.createElement('button');
        updateBtn.className = 'action-btn update-btn';
        updateBtn.innerHTML = '<i class="fas fa-pen"></i>';
        updateBtn.title = 'Update Record';
        updateBtn.addEventListener('click', () => {
            // Dispatch event to main app
            const event = new CustomEvent('updateRecord', { 
                detail: { type: 'loan', record: loan } 
            });
            document.dispatchEvent(event);
        });
        actionTd.appendChild(updateBtn);
        tr.appendChild(actionTd);

        return tr;
    }

    // ===== OFFICER VIEW - RECOVERY TABLE =====

    renderRecoveryTable(recoveries) {
        const tbody = document.getElementById('recoveryTableBody');
        tbody.innerHTML = '';

        const recoveriesArray = Array.isArray(recoveries) ? recoveries : this.extractData(recoveries);

        if (!recoveriesArray || recoveriesArray.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty-state"><i class="fas fa-inbox"></i> No recovery records</td></tr>';
            document.getElementById('recoveryCount').textContent = '0';
            return;
        }

        recoveriesArray.forEach(recovery => {
            const row = this.createOfficerRecoveryRow(recovery);
            tbody.appendChild(row);
        });

        document.getElementById('recoveryCount').textContent = recoveriesArray.length;
    }

    createOfficerRecoveryRow(recovery) {
        const tr = document.createElement('tr');
        const hasNew = this.api?.hasNotification('recoveries', recovery.id) || recovery._hasNewActivity || false;
        if (hasNew) tr.className = 'row-new-activity';

        // Customer
        const td1 = document.createElement('td');
        td1.textContent = recovery.customer || recovery.Customer || '—';
        tr.appendChild(td1);

        // Balance
        const td2 = document.createElement('td');
        const balance = recovery.balance || recovery.Balance || 0;
        td2.textContent = typeof balance === 'number' ? balance.toLocaleString() : balance;
        tr.appendChild(td2);

        // Loan Type
        const td3 = document.createElement('td');
        td3.textContent = recovery.loanType || recovery.LoanType || '—';
        tr.appendChild(td3);

        // Location
        const td4 = document.createElement('td');
        td4.textContent = recovery.location || recovery.Location || '—';
        tr.appendChild(td4);

        // Action Taken
        tr.appendChild(this.createParagraphCell(recovery.actionTaken || recovery.ActionTaken || '', 'remark-cell'));

        // Supervisor Comments (read-only for officer)
        tr.appendChild(this.createSupervisorCell(recovery.supervisor || recovery.SupervisorComments || ''));

        // Action - Update button
        const actionTd = document.createElement('td');
        actionTd.style.textAlign = 'center';
        const updateBtn = document.createElement('button');
        updateBtn.className = 'action-btn update-btn';
        updateBtn.innerHTML = '<i class="fas fa-pen"></i>';
        updateBtn.title = 'Update Record';
        updateBtn.addEventListener('click', () => {
            const event = new CustomEvent('updateRecord', { 
                detail: { type: 'recovery', record: recovery } 
            });
            document.dispatchEvent(event);
        });
        actionTd.appendChild(updateBtn);
        tr.appendChild(actionTd);

        return tr;
    }

    // ===== OFFICER VIEW - SALES TABLE =====

    renderSalesTable(sales) {
        const tbody = document.getElementById('salesTableBody');
        tbody.innerHTML = '';

        const salesArray = Array.isArray(sales) ? sales : this.extractData(sales);

        if (!salesArray || salesArray.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty-state"><i class="fas fa-inbox"></i> No sales records</td></tr>';
            document.getElementById('salesCount').textContent = '0';
            return;
        }

        salesArray.forEach(sale => {
            const row = this.createOfficerSalesRow(sale);
            tbody.appendChild(row);
        });

        document.getElementById('salesCount').textContent = salesArray.length;
    }

    createOfficerSalesRow(sale) {
        const tr = document.createElement('tr');
        const hasNew = this.api?.hasNotification('sales', sale.id) || sale._hasNewActivity || false;
        if (hasNew) tr.className = 'row-new-activity';

        // Location
        const td1 = document.createElement('td');
        td1.textContent = sale.location || sale.Location || '—';
        tr.appendChild(td1);

        // Date
        const td2 = document.createElement('td');
        td2.textContent = sale.date || sale.Date || '—';
        tr.appendChild(td2);

        // Purpose
        const td3 = document.createElement('td');
        td3.textContent = sale.purpose || sale.Purpose || '—';
        tr.appendChild(td3);

        // Status
        tr.appendChild(this.createStatusCell(sale.status || sale.Status || 'Open'));

        // Remarks
        tr.appendChild(this.createParagraphCell(sale.remarks || sale.Remarks || '', 'remark-cell'));

        // Supervisor Comments (read-only for officer)
        tr.appendChild(this.createSupervisorCell(sale.supervisor || sale.SupervisorComments || ''));

        // Action - Update button
        const actionTd = document.createElement('td');
        actionTd.style.textAlign = 'center';
        const updateBtn = document.createElement('button');
        updateBtn.className = 'action-btn update-btn';
        updateBtn.innerHTML = '<i class="fas fa-pen"></i>';
        updateBtn.title = 'Update Record';
        updateBtn.addEventListener('click', () => {
            const event = new CustomEvent('updateRecord', { 
                detail: { type: 'sales', record: sale } 
            });
            document.dispatchEvent(event);
        });
        actionTd.appendChild(updateBtn);
        tr.appendChild(actionTd);

        return tr;
    }
}

window.UI = UI;
console.log('✅ UI loaded');
