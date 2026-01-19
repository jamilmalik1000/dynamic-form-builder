/**
 * data.js - Form Schema Management
 * Handles the form data structure and field definitions
 */

class FormSchema {
    constructor() {
        this.fields = [];
        this.fieldIdCounter = 0;
    }

    /**
     * Add a new field to the form
     */
    addField(fieldData) {
        const field = {
            id: this.fieldIdCounter++,
            name: fieldData.name,
            type: fieldData.type,
            options: fieldData.options || [],
            required: fieldData.required || false,
            minLength: fieldData.minLength || null,
            maxLength: fieldData.maxLength || null,
            errorMessage: fieldData.errorMessage || this.getDefaultErrorMessage(fieldData.type),
            value: ''
        };
        this.fields.push(field);
        return field;
    }

    /**
     * Remove a field by ID
     */
    removeField(fieldId) {
        this.fields = this.fields.filter(f => f.id !== fieldId);
    }

    /**
     * Get a field by ID
     */
    getField(fieldId) {
        return this.fields.find(f => f.id === fieldId);
    }

    /**
     * Update a field
     */
    updateField(fieldId, updates) {
        const field = this.getField(fieldId);
        if (field) {
            Object.assign(field, updates);
        }
        return field;
    }

    /**
     * Move field up in the list
     */
    moveFieldUp(fieldId) {
        const index = this.fields.findIndex(f => f.id === fieldId);
        if (index > 0) {
            [this.fields[index], this.fields[index - 1]] = [this.fields[index - 1], this.fields[index]];
            return true;
        }
        return false;
    }

    /**
     * Move field down in the list
     */
    moveFieldDown(fieldId) {
        const index = this.fields.findIndex(f => f.id === fieldId);
        if (index < this.fields.length - 1) {
            [this.fields[index], this.fields[index + 1]] = [this.fields[index + 1], this.fields[index]];
            return true;
        }
        return false;
    }

    /**
     * Clear all fields
     */
    clearFields() {
        this.fields = [];
        this.fieldIdCounter = 0;
    }

    /**
     * Get all fields
     */
    getFields() {
        return this.fields;
    }

    /**
     * Get default error message for field type
     */
    getDefaultErrorMessage(type) {
        const messages = {
            text: 'This field is required',
            email: 'Please enter a valid email address',
            number: 'Please enter a valid number',
            select: 'Please select an option',
            radio: 'Please select an option',
            checkbox: 'Please select at least one option'
        };
        return messages[type] || 'This field is invalid';
    }

    /**
     * Get form as JSON
     */
    toJSON() {
        return {
            fields: this.fields,
            createdAt: new Date().toISOString()
        };
    }

    /**
     * Get form from JSON
     */
    fromJSON(data) {
        this.fields = data.fields || [];
        this.fieldIdCounter = this.fields.length > 0 ? Math.max(...this.fields.map(f => f.id)) + 1 : 0;
    }
}

// Global form schema instance
const formSchema = new FormSchema();
