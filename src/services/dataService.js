
// Data Service - Handles all data operations
// Currently uses localStorage, but designed to be easily swapped with a real API

const STORAGE_KEYS = {
    USERS: 'users',
    SUBMISSIONS: 'submissions'
};

// Helper to handle storage with error checking
const saveToStorage = (key, data) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return { success: true };
    } catch (error) {
        console.error('Storage error:', error);
        if (error.name === 'QuotaExceededError') {
            return { success: false, error: 'QuotaExceededError' };
        }
        return { success: false, error: 'UnknownError' };
    }
};

const getFromStorage = (key) => {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Error reading from storage:', error);
        return null;
    }
};

export const dataService = {
    // Users
    getUsers: () => {
        return getFromStorage(STORAGE_KEYS.USERS) || [];
    },

    saveUsers: (users) => {
        return saveToStorage(STORAGE_KEYS.USERS, users);
    },

    // Submissions
    getSubmissions: () => {
        return getFromStorage(STORAGE_KEYS.SUBMISSIONS) || [];
    },

    saveSubmissions: (submissions) => {
        return saveToStorage(STORAGE_KEYS.SUBMISSIONS, submissions);
    },

    // Specific Operations
    addSubmission: (submission) => {
        const submissions = getFromStorage(STORAGE_KEYS.SUBMISSIONS) || [];
        const updated = [...submissions, submission];
        return saveToStorage(STORAGE_KEYS.SUBMISSIONS, updated);
    },

    updateSubmission: (id, updates) => {
        const submissions = getFromStorage(STORAGE_KEYS.SUBMISSIONS) || [];
        const updated = submissions.map(sub =>
            sub.id === id ? { ...sub, ...updates } : sub
        );
        return saveToStorage(STORAGE_KEYS.SUBMISSIONS, updated);
    },

    // Soft delete
    deleteSubmission: (id) => {
        const submissions = getFromStorage(STORAGE_KEYS.SUBMISSIONS) || [];
        const updated = submissions.map(sub =>
            sub.id === id ? { ...sub, isDeleted: true, deletedAt: new Date().toISOString() } : sub
        );
        return saveToStorage(STORAGE_KEYS.SUBMISSIONS, updated);
    },

    // Restore from trash
    restoreSubmission: (id) => {
        const submissions = getFromStorage(STORAGE_KEYS.SUBMISSIONS) || [];
        const updated = submissions.map(sub => {
            if (sub.id === id) {
                const { isDeleted, deletedAt, ...rest } = sub;
                return rest;
            }
            return sub;
        });
        return saveToStorage(STORAGE_KEYS.SUBMISSIONS, updated);
    },

    // Hard delete
    permanentDeleteSubmission: (id) => {
        const submissions = getFromStorage(STORAGE_KEYS.SUBMISSIONS) || [];
        const updated = submissions.filter(sub => sub.id !== id);
        return saveToStorage(STORAGE_KEYS.SUBMISSIONS, updated);
    }
};
