/**
 * builder.js - Form Builder Main Logic
 * Orchestrates the form building interface and interactions
 */

class FormBuilder {
    static init() {
        this.loadSavedForm();
        this.renderUI();
        this.attachEventListeners();
    }

    /**
     * Render the complete UI
     */
    static renderUI() {
        FormRenderer.renderFieldsList();
        FormRenderer.renderPreview();
        FormRenderer.renderSubmissionsTable();
    }

    /**
     * Update UI (used after changes)
     */
    static updateUI() {
        this.renderUI();
    }

    /**
     * Attach event listeners
     */
    static attachEventListeners() {
        // Add field button
        document.getElementById('addFieldBtn').addEventListener('click', () => this.handleAddField());

        // Clear form button
        document.getElementById('clearFormBtn').addEventListener('click', () => this.handleClearForm());

        // Form submission
        document.getElementById('previewForm').addEventListener('submit', (e) => this.handleFormSubmit(e));

        // Export buttons
        document.getElementById('exportJsonBtn').addEventListener('click', () => {
            storageManager.exportAsJSON();
        });

        document.getElementById('exportCsvBtn').addEventListener('click', () => {
            storageManager.exportAsCSV();
        });

        document.getElementById('clearSubmissionsBtn').addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all submissions?')) {
                storageManager.clearSubmissions();
                this.updateUI();
            }
        });

        // Save field button in modal
        document.getElementById('saveFieldBtn').addEventListener('click', () => this.handleSaveEditField());

        // Auto-close add field modal after adding
        const addFieldModal = bootstrap.Modal.getInstance(document.getElementById('addFieldModal'));
    }

    /**
     * Handle add field
     */
    static handleAddField() {
        const fieldName = document.getElementById('fieldName').value.trim();
        const fieldType = document.getElementById('fieldType').value;
        const fieldOptions = document.getElementById('fieldOptions').value;
        const fieldRequired = document.getElementById('fieldRequired').checked;
        const fieldMinLength = document.getElementById('fieldMinLength').value;
        const fieldMaxLength = document.getElementById('fieldMaxLength').value;
        const fieldErrorMsg = document.getElementById('fieldErrorMsg').value;

        // Validation
        if (!fieldName) {
            alert('Please enter a field name');
            return;
        }

        if (['select', 'radio', 'checkbox'].includes(fieldType) && !fieldOptions.trim()) {
            alert('Please enter options for this field type');
            return;
        }

        // Parse options
        const options = fieldOptions
            ? fieldOptions.split(',').map(opt => opt.trim()).filter(opt => opt)
            : [];

        // Add field to schema
        formSchema.addField({
            name: fieldName,
            type: fieldType,
            options: options,
            required: fieldRequired,
            minLength: fieldMinLength ? parseInt(fieldMinLength) : null,
            maxLength: fieldMaxLength ? parseInt(fieldMaxLength) : null,
            errorMessage: fieldErrorMsg || undefined
        });

        // Save to localStorage
        storageManager.saveFormSchema();

        // Update UI
        this.updateUI();

        // Reset form and close modal
        this.resetAddFieldForm();
        const modal = bootstrap.Modal.getInstance(document.getElementById('addFieldModal'));
        modal.hide();
    }

    /**
     * Reset add field form
     */
    static resetAddFieldForm() {
        document.getElementById('fieldName').value = '';
        document.getElementById('fieldType').value = 'text';
        document.getElementById('fieldOptions').value = '';
        document.getElementById('fieldRequired').checked = false;
        document.getElementById('fieldMinLength').value = '';
        document.getElementById('fieldMaxLength').value = '';
        document.getElementById('fieldErrorMsg').value = '';
    }

    /**
     * Handle clear form
     */
    static handleClearForm() {
        if (confirm('Are you sure you want to delete all fields? This cannot be undone.')) {
            formSchema.clearFields();
            storageManager.clearFormSchema();
            this.updateUI();
        }
    }

    /**
     * Handle form submission
     */
    static handleFormSubmit(e) {
        e.preventDefault();

        const form = document.getElementById('previewForm');
        const validation = ValidationEngine.validateForm(form);

        if (!validation.isValid) {
            // Display errors
            Object.keys(validation.errors).forEach(fieldName => {
                const input = form.querySelector(`[name="${fieldName}"]`);
                if (input) {
                    const formGroup = input.closest('.form-group-preview');
                    formGroup.classList.add('invalid');
                    let errorElement = formGroup.querySelector('.invalid-feedback');
                    if (!errorElement) {
                        errorElement = document.createElement('div');
                        errorElement.className = 'invalid-feedback';
                        formGroup.appendChild(errorElement);
                    }
                    errorElement.textContent = validation.errors[fieldName];
                }
            });
            return;
        }

        // Collect form data
        const formData = new FormData(form);
        const submission = {};

        formSchema.getFields().forEach(field => {
            let value = formData.get(field.name);

            // For checkboxes, get all checked values
            if (field.type === 'checkbox') {
                const checkboxes = document.querySelectorAll(`input[name="${field.name}"]`);
                value = Array.from(checkboxes)
                    .filter(cb => cb.checked)
                    .map(cb => cb.value)
                    .join(', ');
            }

            submission[field.name] = value || '';
        });

        // Save submission
        storageManager.saveSubmission(submission);

        // Show success message
        const successModal = new bootstrap.Modal(document.getElementById('successModal'));
        successModal.show();

        // Reset form
        form.reset();
        FormRenderer.updateSubmitButtonState();

        // Update submissions table
        this.updateUI();
    }

    /**
     * Open edit field modal
     */
    static openEditModal(fieldId) {
        const field = formSchema.getField(fieldId);
        if (!field) return;

        // Populate edit modal
        document.getElementById('editFieldName').value = field.name;
        document.getElementById('editFieldType').value = field.type;
        document.getElementById('editFieldOptions').value = field.options.join(', ');
        document.getElementById('editFieldRequired').checked = field.required;
        document.getElementById('editFieldMinLength').value = field.minLength || '';
        document.getElementById('editFieldMaxLength').value = field.maxLength || '';
        document.getElementById('editFieldErrorMsg').value = field.errorMessage;

        // Store field ID for later use
        document.getElementById('editFieldModal').dataset.fieldId = fieldId;

        // Show modal
        const editModal = new bootstrap.Modal(document.getElementById('editFieldModal'));
        editModal.show();
    }

    /**
     * Handle save edited field
     */
    static handleSaveEditField() {
        const fieldId = parseInt(document.getElementById('editFieldModal').dataset.fieldId);
        const fieldName = document.getElementById('editFieldName').value.trim();
        const fieldType = document.getElementById('editFieldType').value;
        const fieldOptions = document.getElementById('editFieldOptions').value;
        const fieldRequired = document.getElementById('editFieldRequired').checked;
        const fieldMinLength = document.getElementById('editFieldMinLength').value;
        const fieldMaxLength = document.getElementById('editFieldMaxLength').value;
        const fieldErrorMsg = document.getElementById('editFieldErrorMsg').value;

        // Validation
        if (!fieldName) {
            alert('Please enter a field name');
            return;
        }

        if (['select', 'radio', 'checkbox'].includes(fieldType) && !fieldOptions.trim()) {
            alert('Please enter options for this field type');
            return;
        }

        // Parse options
        const options = fieldOptions
            ? fieldOptions.split(',').map(opt => opt.trim()).filter(opt => opt)
            : [];

        // Update field
        formSchema.updateField(fieldId, {
            name: fieldName,
            type: fieldType,
            options: options,
            required: fieldRequired,
            minLength: fieldMinLength ? parseInt(fieldMinLength) : null,
            maxLength: fieldMaxLength ? parseInt(fieldMaxLength) : null,
            errorMessage: fieldErrorMsg
        });

        // Save to localStorage
        storageManager.saveFormSchema();

        // Update UI
        this.updateUI();

        // Close modal
        const editModal = bootstrap.Modal.getInstance(document.getElementById('editFieldModal'));
        editModal.hide();
    }

    /**
     * Load saved form from localStorage
     */
    static loadSavedForm() {
        storageManager.loadFormSchema();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    FormBuilder.init();
});
