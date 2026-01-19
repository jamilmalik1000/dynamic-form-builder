/**
 * renderer.js - Form Renderer
 * Renders form fields and manages DOM updates
 */

class FormRenderer {
    /**
     * Render a single field in the form preview
     */
    static renderField(field) {
        const container = document.createElement('div');
        container.className = 'form-group-preview';
        container.id = `field-${field.id}`;
        container.dataset.fieldId = field.id;

        let html = '';

        // Create label
        if (field.type !== 'checkbox') {
            html += `<label for="${field.name}">${field.name}${field.required ? ' <span style="color: red;">*</span>' : ''}</label>`;
        }

        // Create input based on type
        switch (field.type) {
            case 'text':
            case 'email':
            case 'number':
                html += `<input 
                    type="${field.type}" 
                    name="${field.name}" 
                    id="${field.name}"
                    class="form-control"
                    ${field.required ? 'required' : ''}
                    ${field.minLength ? `minlength="${field.minLength}"` : ''}
                    ${field.maxLength ? `maxlength="${field.maxLength}"` : ''}
                    placeholder="Enter ${field.name.toLowerCase()}"
                >`;
                break;

            case 'select':
                html += `<select 
                    name="${field.name}" 
                    id="${field.name}"
                    class="form-select"
                    ${field.required ? 'required' : ''}
                >
                    <option value="">Select an option</option>
                    ${field.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                </select>`;
                break;

            case 'radio':
                html += `<div class="radio-group">`;
                field.options.forEach(opt => {
                    html += `
                        <div class="form-check">
                            <input 
                                type="radio" 
                                name="${field.name}" 
                                id="${field.name}-${opt}"
                                value="${opt}"
                                class="form-check-input"
                                ${field.required ? 'required' : ''}
                            >
                            <label class="form-check-label" for="${field.name}-${opt}">
                                ${opt}
                            </label>
                        </div>
                    `;
                });
                html += `</div>`;
                break;

            case 'checkbox':
                html += `<div class="checkbox-group">`;
                field.options.forEach(opt => {
                    html += `
                        <div class="form-check">
                            <input 
                                type="checkbox" 
                                name="${field.name}" 
                                id="${field.name}-${opt}"
                                value="${opt}"
                                class="form-check-input"
                                ${field.required ? 'required' : ''}
                            >
                            <label class="form-check-label" for="${field.name}-${opt}">
                                ${opt}
                            </label>
                        </div>
                    `;
                });
                html += `</div>`;
                if (field.required) {
                    html = `<label>${field.name} <span style="color: red;">*</span></label>${html}`;
                }
                break;
        }

        container.innerHTML = html;

        // Add real-time validation
        const inputs = container.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                const value = input.type === 'checkbox' 
                    ? Array.from(document.querySelectorAll(`input[name="${field.name}"]:checked`))
                        .map(cb => cb.value)
                        .join(', ')
                    : input.value;
                ValidationEngine.validateFieldRealTime(field, value);
            });

            input.addEventListener('change', () => {
                this.updateSubmitButtonState();
                const value = input.type === 'checkbox' 
                    ? Array.from(document.querySelectorAll(`input[name="${field.name}"]:checked`))
                        .map(cb => cb.value)
                        .join(', ')
                    : input.value;
                ValidationEngine.validateFieldRealTime(field, value);
            });
        });

        return container;
    }

    /**
     * Render all fields in the preview
     */
    static renderPreview() {
        const formFields = document.getElementById('formFields');
        formFields.innerHTML = '';

        formSchema.getFields().forEach(field => {
            const fieldElement = this.renderField(field);
            formFields.appendChild(fieldElement);
        });

        this.updateSubmitButtonState();
    }

    /**
     * Render field item in builder (left panel)
     */
    static renderFieldItem(field) {
        const item = document.createElement('div');
        item.className = `field-item ${field.required ? 'required' : ''}`;
        item.id = `field-builder-${field.id}`;
        item.dataset.fieldId = field.id;

        let validationInfo = '';
        if (field.minLength || field.maxLength) {
            validationInfo += `<span>Length: ${field.minLength || 'no min'} - ${field.maxLength || 'no max'}</span>`;
        }

        item.innerHTML = `
            <div class="field-item-header">
                <h5 class="field-item-name">${field.name}</h5>
                <span class="field-item-type">${field.type}</span>
            </div>
            ${validationInfo ? `<div class="field-item-validation">${validationInfo}</div>` : ''}
            <div class="field-item-controls">
                <button type="button" class="field-item-up" title="Move up">
                    <i class="fas fa-arrow-up"></i>
                </button>
                <button type="button" class="field-item-down" title="Move down">
                    <i class="fas fa-arrow-down"></i>
                </button>
                <button type="button" class="field-item-edit" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button type="button" class="field-item-delete" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        // Add event listeners
        const upBtn = item.querySelector('.field-item-up');
        const downBtn = item.querySelector('.field-item-down');
        const editBtn = item.querySelector('.field-item-edit');
        const deleteBtn = item.querySelector('.field-item-delete');

        upBtn.addEventListener('click', () => {
            if (formSchema.moveFieldUp(field.id)) {
                FormBuilder.updateUI();
                storageManager.saveFormSchema();
            }
        });

        downBtn.addEventListener('click', () => {
            if (formSchema.moveFieldDown(field.id)) {
                FormBuilder.updateUI();
                storageManager.saveFormSchema();
            }
        });

        editBtn.addEventListener('click', () => {
            FormBuilder.openEditModal(field.id);
        });

        deleteBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this field?')) {
                formSchema.removeField(field.id);
                FormBuilder.updateUI();
                storageManager.saveFormSchema();
            }
        });

        return item;
    }

    /**
     * Render all field items in builder
     */
    static renderFieldsList() {
        const fieldsList = document.getElementById('fieldsList');
        const fields = formSchema.getFields();

        if (fields.length === 0) {
            fieldsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>No fields yet. Add one to get started!</p>
                </div>
            `;
        } else {
            fieldsList.innerHTML = '';
            fields.forEach(field => {
                const fieldItem = this.renderFieldItem(field);
                fieldsList.appendChild(fieldItem);
            });
        }
    }

    /**
     * Render submissions table
     */
    static renderSubmissionsTable() {
        const submissions = storageManager.getSubmissions();
        const fields = formSchema.getFields();

        if (submissions.length === 0) {
            document.getElementById('submissionsSection').classList.add('d-none');
            return;
        }

        document.getElementById('submissionsSection').classList.remove('d-none');

        // Render table header
        const thead = document.getElementById('submissionsHead');
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = `
            <th>Timestamp</th>
            ${fields.map(f => `<th>${f.name}</th>`).join('')}
        `;
        thead.innerHTML = '';
        thead.appendChild(headerRow);

        // Render table rows
        const tbody = document.getElementById('submissionsBody');
        tbody.innerHTML = '';
        submissions.forEach(submission => {
            const row = document.createElement('tr');
            const timestamp = new Date(submission.timestamp).toLocaleString();
            row.innerHTML = `
                <td>${timestamp}</td>
                ${fields.map(f => {
                    const value = submission.data[f.name] || '-';
                    return `<td>${value}</td>`;
                }).join('')}
            `;
            tbody.appendChild(row);
        });
    }

    /**
     * Update submit button state based on form validity
     */
    static updateSubmitButtonState() {
        const form = document.getElementById('previewForm');
        const submitBtn = document.getElementById('submitBtn');

        if (ValidationEngine.isFormValid(form)) {
            submitBtn.disabled = false;
        } else {
            submitBtn.disabled = true;
        }
    }
}
