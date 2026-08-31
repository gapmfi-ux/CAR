/**
 * Configuration Constants
 * Updated with code generation logic
 */

const CONFIG = {
    SHEET_ID: '15hriw7T6lgAqM-DA83SJAlGqx9CoIjk34xRVWbwH0SU',
    SHEET_NAMES: {
        LOAN_PIPELINE: 'LoanPipeline',
        RECOVERY_ACTIVITIES: 'RecoveryActivities',
        SALES_ACTIVITIES: 'SalesActivities',
        USERS: 'Users',
        CODE_COUNTERS: 'CodeCounters'
    },
    COLUMNS: {
        LOAN: ['Code', 'Product', 'Customer', 'Amount', 'Stage', 'Remarks', 'SupervisorComments', 'Timestamp', 'OfficerId'],
        RECOVERY: ['Code', 'Customer', 'Balance', 'LoanType', 'Location', 'ActionTaken', 'SupervisorComments', 'Timestamp', 'OfficerId'],
        SALES: ['Code', 'Location', 'Date', 'Purpose', 'Status', 'Remarks', 'SupervisorComments', 'Timestamp', 'OfficerId']
    },
    CODE_PREFIXES: {
        LOAN: 'LP',
        RECOVERY: 'RA',
        SALES: 'SA'
    }
};

console.log('✅ Config loaded');
