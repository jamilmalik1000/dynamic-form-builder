/**
 * validation.js - Validation Engine
 * Handles real-time validation of form fields
 */

class ValidationEngine {
    /**
     * Validate a single field
     */
    static validateField(field, value) {
        const errors = [];

        // Check required
        if (field.required) {
            if (field.type === 'checkbox') {
                const checkboxes = document.querySelectorAll(`input[name="${field.name}"]`);
                const checked = Array.from(checkboxes).some(cb => cb.checked);
                if (!checked) {
                    errors.push(field.errorMessage);
                }
            } else if (!value || (typeof value === 'string' && value.trim() === '')) {
                errors.push(field.errorMessage);
            }
        }

        // Skip further validation if field is empty and not required
        if (!value || (typeof value === 'string' && value.trim() === '')) {
            return errors;
        }

        // Type-specific validation
        switch (field.type) {
            case 'email':
                if (!this.isValidEmail(value)) {
                    errors.push(field.errorMessage);
                }
                break;
            case 'number':
                if (!this.isValidNumber(value)) {
                    errors.push(field.errorMessage);
                }
                break;
            case 'text':
                if (field.minLength && value.length < field.minLength) {
                    errors.push(`Minimum ${field.minLength} characters required`);
                }
                if (field.maxLength && value.length > field.maxLength) {
                    errors.push(`Maximum ${field.maxLength} characters allowed`);
                }
                break;
        }

        return errors;
    }

    /**
     * Validate all form fields
     */
    static validateForm(form) {
        const formData = new FormData(form);
        const errors = {};
        let isValid = true;

        // Validate each field
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

            const fieldErrors = this.validateField(field, value);
            if (fieldErrors.length > 0) {
                errors[field.name] = fieldErrors[0];
                isValid = false;
            }
        });

        return { isValid, errors };
    }

    /**
     * Validate email format
     */
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate number format
     */
    static isValidNumber(number) {
        return !isNaN(number) && number !== '';
    }

    /**
     * Real-time field validation
     */
    static validateFieldRealTime(field, value) {
        const fieldElement = document.querySelector(`[name="${field.name}"]`);
        if (!fieldElement) return;

        const formGroup = fieldElement.closest('.form-group-preview');
        if (!formGroup) return;

        // Get existing error element or create new one
        let errorElement = formGroup.querySelector('.invalid-feedback');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'invalid-feedback';
            formGroup.appendChild(errorElement);
        }

        const errors = this.validateField(field, value);

        if (errors.length > 0) {
            formGroup.classList.add('invalid');
            errorElement.textContent = errors[0];
        } else {
            formGroup.classList.remove('invalid');
            errorElement.textContent = '';
        }
    }

    /**
     * Check if form is valid (for disabling submit button)
     */
    static isFormValid(form) {
        const { isValid } = this.validateForm(form);
        return isValid;
    }
}
