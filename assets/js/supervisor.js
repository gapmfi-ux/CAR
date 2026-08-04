/**
 * Supervisor Module - Supervisor View Rendering
 * Handles supervisor-specific UI with comment input capability
 */

class SupervisorUI {
    constructor() {
        this.api = window.api;
        this.ui = window.ui;
        this.currentOfficer = 'All Officers';
    }

    // ===== LOAN TABLE - SUPERVISOR =====

    renderLoanTable(loans) {
        const tbody = document.getElementById('supervisorLoanTableBody');
        
        while (tbody.firstChild) {
            tbody.removeChild(tbody.firstChild);
        }
        
        if (!loans || loans.length === 0) {
            this.showEmptyState(tbody, 'No loan records found');
            document.getElementById('supervisorLoanCount').textContent = '0';
            return;
        }
        
        loans.forEach((loan, index) => {
            const row = this.createSupervisorLoanRow(loan, index);
            tbody.appendChild(row);
        });
        
        document.getElementById('supervisorLoanCount').textContent = loans.length;
    }

    createSupervisorLoanRow(loan, index) {
        const tr = document.createElement('tr');
        
        // Credit Officer
        const officerTd = document.createElement('td');
        officerTd.innerHTML = `<span class="officer-badge"><i class="fas fa-user"></i> ${loan.officerId || loan.OfficerId || 'Unknown'}</span>`;
        tr.appendChild(officerTd);
        
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
        tr.appendChild(this.ui.createStatusCell(loan.stage || loan.Stage || 'Review'));
        
        // Remarks
        tr.appendChild(this.ui.createParagraphCell(loan.remarks || loan.Remarks || '', 'remark-cell'));
        
        // Supervisor Comments (with edit capability)
        const commentTd = document.createElement('td');
        const currentComment = loan.supervisor || loan.SupervisorComments || '';
        commentTd.className = 'supervisor-cell';
        if (currentComment) {
            const lines = currentComment.split(/\r?\n/).filter(line => line.trim() !== '');
            lines.forEach(line => {
                const p = document.createElement('p');
                p.textContent = line.trim();
                commentTd.appendChild(p);
            });
        } else {
            commentTd.innerHTML = '<span class="no-comment"><i class="far fa-comment"></i> No comment</span>';
        }
        tr.appendChild(commentTd);
        
        // Action - Add/Edit Comment
        const actionTd = document.createElement('td');
        actionTd.style.textAlign = 'center';
        
        const commentBtn = document.createElement('button');
        commentBtn.className = 'comment-btn';
        commentBtn.innerHTML = `<i class="fas fa-comment"></i> ${currentComment ? 'Edit' : 'Add'} Comment`;
        commentBtn.addEventListener('click', () => {
            this.openCommentModal('loan', index, loan, currentComment);
        });
        actionTd.appendChild(commentBtn);
        tr.appendChild(actionTd);
        
        return tr;
    }

    // ===== RECOVERY TABLE - SUPERVISOR =====

    renderRecoveryTable(recoveries) {
        const tbody = document.getElementById('supervisorRecoveryTableBody');
        
        while (tbody.firstChild) {
            tbody.removeChild(tbody.firstChild);
        }
        
        if (!recoveries || recoveries.length === 0) {
            this.showEmptyState(tbody, 'No recovery records found');
            document.getElementById('supervisorRecoveryCount').textContent = '0';
            return;
        }
        
        recoveries.forEach((recovery, index) => {
            const row = this.createSupervisorRecoveryRow(recovery, index);
            tbody.appendChild(row);
        });
        
        document.getElementById('supervisorRecoveryCount').textContent = recoveries.length;
    }

    createSupervisorRecoveryRow(recovery, index) {
        const tr = document.createElement('tr');
        
        // Credit Officer
        const officerTd = document.createElement('td');
        officerTd.innerHTML = `<span class="officer-badge"><i class="fas fa-user"></i> ${recovery.officerId || recovery.OfficerId || 'Unknown'}</span>`;
        tr.appendChild(officerTd);
        
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
        tr.appendChild(this.ui.createParagraphCell(recovery.actionTaken || recovery.ActionTaken || '', 'remark-cell'));
        
        // Supervisor Comments
        const commentTd = document.createElement('td');
        const currentComment = recovery.supervisor || recovery.SupervisorComments || '';
        commentTd.className = 'supervisor-cell';
        if (currentComment) {
            const lines = currentComment.split(/\r?\n/).filter(line => line.trim() !== '');
            lines.forEach(line => {
                const p = document.createElement('p');
                p.textContent = line.trim();
                commentTd.appendChild(p);
            });
        } else {
            commentTd.innerHTML = '<span class="no-comment"><i class="far fa-comment"></i> No comment</span>';
        }
        tr.appendChild(commentTd);
        
        // Action
        const actionTd = document.createElement('td');
        actionTd.style.textAlign = 'center';
        
        const commentBtn = document.createElement('button');
        commentBtn.className = 'comment-btn';
        commentBtn.innerHTML = `<i class="fas fa-comment"></i> ${currentComment ? 'Edit' : 'Add'} Comment`;
        commentBtn.addEventListener('click', () => {
            this.openCommentModal('recovery', index, recovery, currentComment);
        });
        actionTd.appendChild(commentBtn);
        tr.appendChild(actionTd);
        
        return tr;
    }

    // ===== SALES TABLE - SUPERVISOR =====

    renderSalesTable(sales) {
        const tbody = document.getElementById('supervisorSalesTableBody');
        
        while (tbody.firstChild) {
            tbody.removeChild(tbody.firstChild);
        }
        
        if (!sales || sales.length === 0) {
            this.showEmptyState(tbody, 'No sales records found');
            document.getElementById('supervisorSalesCount').textContent = '0';
            return;
        }
        
        sales.forEach((sale, index) => {
            const row = this.createSupervisorSalesRow(sale, index);
            tbody.appendChild(row);
        });
        
        document.getElementById('supervisorSalesCount').textContent = sales.length;
    }

    createSupervisorSalesRow(sale, index) {
        const tr = document.createElement('tr');
        
        // Credit Officer
        const officerTd = document.createElement('td');
        officerTd.innerHTML = `<span class="officer-badge"><i class="fas fa-user"></i> ${sale.officerId || sale.OfficerId || 'Unknown'}</span>`;
        tr.appendChild(officerTd);
        
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
        tr.appendChild(this.ui.createStatusCell(sale.status || sale.Status || 'Open'));
        
        // Remarks
        tr.appendChild(this.ui.createParagraphCell(sale.remarks || sale.Remarks || '', 'remark-cell'));
        
        // Supervisor Comments
        const commentTd = document.createElement('td');
        const currentComment = sale.supervisor || sale.SupervisorComments || '';
        commentTd.className = 'supervisor-cell';
        if (currentComment) {
            const lines = currentComment.split(/\r?\n/).filter(line => line.trim() !== '');
            lines.forEach(line => {
                const p = document.createElement('p');
                p.textContent = line.trim();
                commentTd.appendChild(p);
            });
        } else {
            commentTd.innerHTML = '<span class="no-comment"><i class="far fa-comment"></i> No comment</span>';
        }
        tr.appendChild(commentTd);
        
        // Action
        const actionTd = document.createElement('td');
        actionTd.style.textAlign = 'center';
        
        const commentBtn = document.createElement('button');
        commentBtn.className = 'comment-btn';
        commentBtn.innerHTML = `<i class="fas fa-comment"></i> ${currentComment ? 'Edit' : 'Add'} Comment`;
        commentBtn.addEventListener('click', () => {
            this.openCommentModal('sales', index, sale, currentComment);
        });
        actionTd.appendChild(commentBtn);
        tr.appendChild(actionTd);
        
        return tr;
    }

    // ===== COMMENT MODAL =====

    openCommentModal(type, index, record, currentComment) {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            animation: fadeIn 0.2s ease;
        `;
        
        const modal = document.createElement('div');
        modal.className = 'modal-content';
        modal.style.cssText = `
            background: white;
            border-radius: 20px;
            padding: 2rem;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            animation: slideUp 0.3s ease;
        `;
        
        const typeLabels = {
            loan: 'Loan Pipeline',
            recovery: 'Recovery Activity',
            sales: 'Sales Activity'
        };
        
        modal.innerHTML = `
            <h3 style="margin-bottom: 0.5rem; color: #1f3a5e;">
                <i class="fas fa-comment"></i> Supervisor Comment
            </h3>
            <p style="color: #5b6f88; margin-bottom: 1rem; font-size: 0.9rem;">
                ${typeLabels[type] || 'Record'} - ${record.customer || record.Customer || record.location || record.Location || 'N/A'}
            </p>
            <textarea id="commentInput" style="
                width: 100%;
                min-height: 100px;
                padding: 0.8rem;
                border: 2px solid #ccd8e9;
                border-radius: 12px;
                font-size: 0.9rem;
                font-family: inherit;
                resize: vertical;
                transition: 0.15s;
                margin-bottom: 1rem;
            " placeholder="Enter your comment here...">${currentComment || ''}</textarea>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button id="cancelComment" style="
                    padding: 0.5rem 1.5rem;
                    border: 1px solid #ccd8e9;
                    background: transparent;
                    border-radius: 30px;
                    cursor: pointer;
                    font-weight: 500;
                    color: #5b6f88;
                ">Cancel</button>
                <button id="saveComment" style="
                    padding: 0.5rem 1.5rem;
                    border: none;
                    background: #1f5a8a;
                    color: white;
                    border-radius: 30px;
                    cursor: pointer;
                    font-weight: 500;
                "><i class="fas fa-save"></i> Save Comment</button>
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // Focus textarea
        const textarea = modal.querySelector('#commentInput');
        textarea.focus();
        
        // Close handlers
        const closeModal = () => {
            document.body.removeChild(overlay);
        };
        
        modal.querySelector('#cancelComment').addEventListener('click', closeModal);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });
        
        // Save handler
        modal.querySelector('#saveComment').addEventListener('click', async () => {
            const comment = textarea.value.trim();
            
            // Update the record with comment
            const updatedRecord = { ...record, supervisor: comment };
            
            try {
                this.ui.showToast('⏳ Saving comment...', false, 0);
                
                // Call appropriate API endpoint
                let result;
                if (type === 'loan') {
                    result = await this.api.updateLoan(index, updatedRecord);
                } else if (type === 'recovery') {
                    result = await this.api.updateRecovery(index, updatedRecord);
                } else if (type === 'sales') {
                    result = await this.api.updateSales(index, updatedRecord);
                }
                
                // Re-render supervisor tables with updated data
                await this.refreshAll();
                
                this.ui.showToast('✅ Comment saved successfully', false, 2500);
                closeModal();
                
            } catch (error) {
                console.error('Error saving comment:', error);
                this.ui.showToast('❌ Failed to save comment: ' + error.message, true, 4000);
            }
        });
        
        // Keyboard shortcut: Ctrl+Enter to save
        textarea.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                modal.querySelector('#saveComment').click();
            }
        });
    }

    // ===== REFRESH ALL SUPERVISOR TABLES =====

    async refreshAll() {
        try {
            const [loans, recoveries, sales] = await Promise.all([
                this.api.getLoans(),
                this.api.getRecoveries(),
                this.api.getSales()
            ]);
            
            this.renderLoanTable(loans || []);
            this.renderRecoveryTable(recoveries || []);
            this.renderSalesTable(sales || []);
            
        } catch (error) {
            console.error('Error refreshing supervisor data:', error);
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
});
