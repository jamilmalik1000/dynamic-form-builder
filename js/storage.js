/**
 * storage.js - localStorage Management
 * Handles form submissions and data storage
 */

class StorageManager {
    constructor() {
        this.storageKey = 'formSubmissions';
        this.formKey = 'formSchema';
    }

    /**
     * Save a form submission
     */
    saveSubmission(formData) {
        const submissions = this.getSubmissions();
        const submission = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            data: formData
        };
        submissions.push(submission);
        localStorage.setItem(this.storageKey, JSON.stringify(submissions));
        return submission;
    }

    /**
     * Get all form submissions
     */
    getSubmissions() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : [];
    }

    /**
     * Clear all submissions
     */
    clearSubmissions() {
        localStorage.removeItem(this.storageKey);
    }

    /**
     * Export submissions as JSON
     */
    exportAsJSON() {
        const submissions = this.getSubmissions();
        const dataStr = JSON.stringify(submissions, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        this.downloadFile(dataBlob, 'form-submissions.json');
    }

    /**
     * Export submissions as CSV
     */
    exportAsCSV() {
        const submissions = this.getSubmissions();
        if (submissions.length === 0) {
            alert('No submissions to export');
            return;
        }

        // Get all field names from form schema
        const fieldNames = formSchema.getFields().map(f => f.name);

        // Create CSV header
        const headers = ['Timestamp', ...fieldNames];
        const csvRows = [headers.join(',')];

        // Add data rows
        submissions.forEach(submission => {
            const row = [
                new Date(submission.timestamp).toLocaleString(),
                ...fieldNames.map(fieldName => {
                    const value = submission.data[fieldName] || '';
                    // Escape quotes and wrap in quotes if contains comma
                    return this.escapeCSV(value);
                })
            ];
            csvRows.push(row.join(','));
        });

        const csvContent = csvRows.join('\n');
        const dataBlob = new Blob([csvContent], { type: 'text/csv' });
        this.downloadFile(dataBlob, 'form-submissions.csv');
    }

    /**
     * Escape CSV values
     */
    escapeCSV(value) {
        if (typeof value !== 'string') {
            value = String(value);
        }
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
    }

    /**
     * Download file
     */
    downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * Save form schema to localStorage
     */
    saveFormSchema() {
        localStorage.setItem(this.formKey, JSON.stringify(formSchema.getFields()));
    }

    /**
     * Load form schema from localStorage
     */
    loadFormSchema() {
        const data = localStorage.getItem(this.formKey);
        if (data) {
            const fields = JSON.parse(data);
            formSchema.fields = fields;
            if (fields.length > 0) {
                formSchema.fieldIdCounter = Math.max(...fields.map(f => f.id)) + 1;
            }
            return true;
        }
        return false;
    }

    /**
     * Clear form schema from localStorage
     */
    clearFormSchema() {
        localStorage.removeItem(this.formKey);
    }
}

// Global storage manager instance
const storageManager = new StorageManager();
