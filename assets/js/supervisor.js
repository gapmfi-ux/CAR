/**
 * Supervisor Module - Supervisor View Rendering
 * Handles supervisor-specific UI with comment input capability
 */

class SupervisorUI {
    constructor() {
        this.api = window.API;
        this.ui = window.ui || new UI();
        this.currentOfficer = 'All Officers';
    }

    // ===== DATA EXTRACTION =====

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

    // ===== RENDER TABLES =====

    renderLoanTable(loans) {
        const tbody = document.getElementById('supervisorLoanTableBody');
        tbody.innerHTML = '';

        const loansArray = Array.isArray(loans) ? loans : this.extractData(loans);

        if (!loansArray || loansArray.length === 0) {
            this.showEmptyState(tbody, 'No loan records found');
            document.getElementById('supervisorLoanCount').textContent = '0';
            return;
        }

        loansArray.forEach((loan, index) => {
            const row = this.createSupervisorRow(loan, index, 'loan');
            tbody.appendChild(row);
        });

        document.getElementById('supervisorLoanCount').textContent = loansArray.length;
    }

    renderRecoveryTable(recoveries) {
        const tbody = document.getElementById('supervisorRecoveryTableBody');
        tbody.innerHTML = '';

        const recoveriesArray = Array.isArray(recoveries) ? recoveries : this.extractData(recoveries);

        if (!recoveriesArray || recoveriesArray.length === 0) {
            this.showEmptyState(tbody, 'No recovery records found');
            document.getElementById('supervisorRecoveryCount').textContent = '0';
            return;
        }

        recoveriesArray.forEach((recovery, index) => {
            const row = this.createSupervisorRow(recovery, index, 'recovery');
            tbody.appendChild(row);
        });

        document.getElementById('supervisorRecoveryCount').textContent = recoveriesArray.length;
    }

    renderSalesTable(sales) {
        const tbody = document.getElementById('supervisorSalesTableBody');
        tbody.innerHTML = '';

        const salesArray = Array.isArray(sales) ? sales : this.extractData(sales);

        if (!salesArray || salesArray.length === 0) {
            this.showEmptyState(tbody, 'No sales records found');
            document.getElementById('supervisorSalesCount').textContent = '0';
            return;
        }

        salesArray.forEach((sale, index) => {
            const row = this.createSupervisorRow(sale, index, 'sales');
            tbody.appendChild(row);
        });

        document.getElementById('supervisorSalesCount').textContent = salesArray.length;
    }

    createSupervisorRow(record, index, type) {
        const tr = document.createElement('tr');
        const hasNew = this.api.hasNotification(type + 's', record.id) || record._hasNewActivity;
        if (hasNew) tr.className = 'row-new-activity';

        // Define field sets for each type
        const fieldSets = {
            loan: ['product', 'customer', 'amount', 'stage', 'remarks'],
            recovery: ['customer', 'balance', 'loanType', 'location', 'actionTaken'],
            sales: ['location', 'date', 'purpose', 'status', 'remarks']
        };

        const fields = fieldSets[type] || [];

        let html = `<td><span class="officer-badge"><i class="fas fa-user"></i> Officer</span></td>`;

        fields.forEach(f => {
            let val = record[f] || '—';
            if (f === 'amount' || f === 'balance') {
                val = typeof record[f] === 'number' ? record[f].toLocaleString() : val;
            }
            if (f === 'stage' || f === 'status') {
                const badge = document.createElement('span');
                badge.className = 'status-badge';
                badge.textContent = val;
                html += `<td>${badge.outerHTML}</td>`;
            } else {
                html += `<td>${val}</td>`;
            }
        });

        html += `<td>${record.supervisor || '<span style="color:#8a9bb0;"><i class="far fa-comment"></i> No comment</span>'}</td>`;
        html += `<td style="text-align:center;"><button class="comment-btn" data-id="${record.id}" data-type="${type}">${hasNew ? '🔴 View' : 'View'}</button></td>`;

        tr.innerHTML = html;
        return tr;
    }

    // ===== REFRESH ALL =====

    async refreshAll() {
        try {
            const [loans, recoveries, sales] = await Promise.all([
                this.api.getLoans({ useCache: false }),
                this.api.getRecoveries({ useCache: false }),
                this.api.getSales({ useCache: false })
            ]);

            this.renderLoanTable(loans);
            this.renderRecoveryTable(recoveries);
            this.renderSalesTable(sales);

            console.log('✅ Supervisor tables refreshed');

        } catch (error) {
            console.error('Error refreshing supervisor data:', error);
            if (this.ui) {
                this.ui.showToast('⚠️ Error refreshing supervisor view', true, 3000);
            }
        }
    }

    // ===== EMPTY STATE =====

    showEmptyState(tbody, message) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 8;
        td.className = 'empty-state';
        td.innerHTML = `
            <i class="fas fa-inbox"></i>
            <p>${message}</p>
        `;
        tr.appendChild(td);
        tbody.appendChild(tr);
    }
}

// Initialize supervisor module
document.addEventListener('DOMContentLoaded', () => {
    window.supervisor = new SupervisorUI();
    console.log('✅ Supervisor UI loaded');
});
