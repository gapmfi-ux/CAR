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

        const parts = (text || '').split(/\n---\n/).filter(p => p.trim() !== '');
        parts.forEach(part => {
            const p = document.createElement('p');
            p.textContent = part.trim();
            td.appendChild(p);
        });
        return td;
    }

    // Check if row has new activity
    isNewActivity(record, type) {
        if (!record) return false;
        if (record._hasNewActivity) return true;
        const typeMap = { loans: 'loan', recoveries: 'recovery', sales: 'sales' };
        const key = Object.keys(typeMap).find(k => typeMap[k] === type);
        if (key && this.api) {
            return this.api.hasNotification(key, record.id);
        }
        return false;
    }

    // ===== HELPER FUNCTIONS =====

    getCurrentDate() {
        const date = new Date();
        const day = String(date.getDate()).padStart(2, '0');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${day}-${months[date.getMonth()]}`;
    }
}

window.UI = UI;
console.log('✅ UI loaded');
