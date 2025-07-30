/* ==========================================================================
   CONTACT FORM JAVASCRIPT - script.js
   Casa de Amor Contact Form Interactive Functionality
   ========================================================================== */

'use strict';

/* ==========================================================================
   APPLICATION CONFIGURATION
   ========================================================================== */

const CONFIG = {
    email: {
        serviceId: 'service_ar10rnj',
        issueTemplateId: 'template_bjh7sm3',
        enquiryTemplateId: 'template_l9an0sq',
        publicKey: 'i5TYdclyR0ihs1ZxG',
        adminEmail: 'casadeamorinfo@gmail.com'
    },
    validation: {
        name: {
            minLength: 2,
            pattern: /^[a-zA-Z\s'-]+$/,
            messages: {
                required: 'Full name is required',
                minLength: 'Name must be at least 2 characters long',
                pattern: 'Name can only contain letters, spaces, hyphens, and apostrophes'
            }
        },
        email: {
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            messages: {
                required: 'Email address is required',
                pattern: 'Please enter a valid email address (e.g., name@example.com)'
            }
        },
        phone: {
            pattern: /^[\+]?[0-9\s\-\(\)]{10,}$/,
            messages: {
                required: 'Phone number is required',
                pattern: 'Please enter a valid phone number (minimum 10 digits)'
            }
        },
        date: {
            messages: {
                required: 'Please select a date',
                past: 'Date cannot be in the past',
                invalid: 'Please enter a valid date'
            }
        },
        time: {
            messages: {
                required: 'Please select a time',
                invalid: 'Please enter a valid time'
            }
        },
        textarea: {
            minLength: 10,
            maxLength: 1000,
            messages: {
                required: 'This field is required',
                minLength: 'Please provide at least 10 characters',
                maxLength: 'Maximum 1000 characters allowed'
            }
        },
        select: {
            messages: {
                required: 'Please make a selection'
            }
        }
    },
    debounceDelay: 300,
    animationDuration: 300
};

/* ==========================================================================
   APPLICATION STATE
   ========================================================================== */

let currentTab = 'issue';
let validationTimeouts = new Map();
let isSubmitting = false;

/* ==========================================================================
   INITIALIZATION
   ========================================================================== */

/**
 * Initialize the application when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Validate configuration
        if (!validateConfiguration()) {
            console.error('Invalid configuration - some features may not work');
        }
        
        initializeEmailJS();
        initializeDateFields();
        setupEventListeners();
        setupValidation();
        setupAccessibilityFeatures();
        
        console.log('Contact form initialized successfully');
    } catch (error) {
        console.error('Error initializing contact form:', error);
        // Still try to show the form even if initialization partially fails
        document.body.style.display = 'block';
    }
});

/**
 * Validate application configuration
 * @returns {boolean} - Whether configuration is valid
 */
function validateConfiguration() {
    const requiredEmailConfig = ['serviceId', 'issueTemplateId', 'enquiryTemplateId', 'publicKey', 'adminEmail'];
    const missingConfig = requiredEmailConfig.filter(key => !CONFIG.email[key]);
    
    if (missingConfig.length > 0) {
        console.error('Missing email configuration:', missingConfig);
        return false;
    }
    
    return true;
}

/**
 * Initialize EmailJS service
 */
function initializeEmailJS() {
    if (typeof emailjs !== 'undefined') {
        try {
            emailjs.init(CONFIG.email.publicKey);
            console.log('EmailJS initialized successfully');
        } catch (error) {
            console.error('EmailJS initialization failed:', error);
        }
    } else {
        console.warn('EmailJS not loaded - email functionality will not work');
    }
}

/**
 * Initialize date fields with proper min values
 */
function initializeDateFields() {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        const bookingDate = document.getElementById('booking-date');
        const enquiryDate = document.getElementById('enquiry-date');
        
        if (bookingDate) {
            bookingDate.setAttribute('min', today);
        } else {
            console.warn('Booking date field not found');
        }
        
        if (enquiryDate) {
            enquiryDate.setAttribute('min', today);
        } else {
            console.warn('Enquiry date field not found');
        }
    } catch (error) {
        console.error('Error initializing date fields:', error);
    }
}

/* ==========================================================================
   EVENT LISTENERS SETUP
   ========================================================================== */

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    setupTabNavigation();
    setupContactMethodToggle();
    setupFormSubmissions();
    setupPopupHandlers();
    setupCharacterCounters();
}

/**
 * Setup tab navigation event listeners
 */
function setupTabNavigation() {
    const tabs = document.querySelectorAll('[data-tab]');
    tabs.forEach(tab => {
        tab.addEventListener('click', handleTabClick);
    });
}

/**
 * Setup contact method toggle event listeners
 */
function setupContactMethodToggle() {
    const contactRadios = document.querySelectorAll('input[name="contact-method"]');
    contactRadios.forEach(radio => {
        radio.addEventListener('change', handleContactMethodChange);
    });
}

/**
 * Setup form submission event listeners
 */
function setupFormSubmissions() {
    const issueForm = document.getElementById('issue-form-element');
    const enquiryForm = document.getElementById('enquiry-form-element');
    
    if (issueForm) {
        issueForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleFormSubmit(e.target, 'issue');
        });
    }
    
    if (enquiryForm) {
        enquiryForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleFormSubmit(e.target, 'enquiry');
        });
    }
}

/**
 * Setup popup event handlers
 */
function setupPopupHandlers() {
    const closeButton = document.getElementById('popup-close');
    const overlay = document.getElementById('popup-overlay');
    
    if (closeButton) {
        closeButton.addEventListener('click', closePopup);
    }
    
    if (overlay) {
        overlay.addEventListener('click', closePopup);
    }
}

/**
 * Setup character counters for textareas
 */
function setupCharacterCounters() {
    const textareas = document.querySelectorAll('textarea[maxlength]');
    
    textareas.forEach(textarea => {
        const counterId = textarea.id + '-count';
        const counter = document.getElementById(counterId);
        
        if (counter) {
            textarea.addEventListener('input', () => {
                updateCharacterCount(textarea, counter);
            });
            
            // Initialize count
            updateCharacterCount(textarea, counter);
        }
    });
}

/* ==========================================================================
   TAB NAVIGATION HANDLERS
   ========================================================================== */

/**
 * Handle tab click events
 * @param {Event} event - Click event
 */
function handleTabClick(event) {
    const tabName = event.target.dataset.tab;
    if (tabName) {
        switchTab(tabName);
    }
}

/**
 * Switch between form tabs
 * @param {string} tabName - Name of the tab to switch to
 */
function switchTab(tabName) {
    if (currentTab === tabName) return;
    
    currentTab = tabName;
    
    const tabs = document.querySelectorAll('[role="tab"]');
    const panels = document.querySelectorAll('[role="tabpanel"]');
    
    // Update tab states
    tabs.forEach(tab => {
        const isSelected = tab.dataset.tab === tabName;
        tab.classList.toggle('active', isSelected);
        tab.setAttribute('aria-selected', isSelected);
        tab.setAttribute('tabindex', isSelected ? '0' : '-1');
    });
    
    // Update panel states
    panels.forEach(panel => {
        const isActive = panel.id === tabName + '-form';
        panel.classList.toggle('active', isActive);
        panel.setAttribute('aria-hidden', (!isActive).toString());
    });
    
    // Announce tab change
    const formType = tabName === 'issue' ? 'Report Issue' : 'Make Enquiry';
    announceToScreenReader(`Switched to ${formType} form`);
    
    // Focus management
    setTimeout(() => {
        const firstInput = document.querySelector(
            `#${tabName}-form input:not([type="hidden"]):not([type="radio"]), #${tabName}-form select, #${tabName}-form textarea`
        );
        if (firstInput) {
            firstInput.focus();
        }
    }, CONFIG.animationDuration);
}

/* ==========================================================================
   CONTACT METHOD HANDLERS
   ========================================================================== */

/**
 * Handle contact method change
 * @param {Event} event - Change event
 */
function handleContactMethodChange(event) {
    const contactField = document.querySelector(`#${event.target.dataset.target}`);
    const selectedMethod = event.target.value;
    
    if (!contactField) return;
    
    updateContactField(contactField, selectedMethod);
    announceToScreenReader(`Contact method changed to ${selectedMethod}`);
    
    // Focus the contact field for better UX
    setTimeout(() => {
        contactField.focus();
    }, 100);
}

/**
 * Update contact field based on selected method
 * @param {HTMLElement} field - Contact input field
 * @param {string} method - Selected contact method
 */
function updateContactField(field, method) {
    if (method === 'email') {
        field.type = 'email';
        field.placeholder = 'Enter your email address';
        field.setAttribute('autocomplete', 'email');
        field.setAttribute('aria-label', 'Email address');
        field.setAttribute('data-validation', 'email');
    } else {
        field.type = 'tel';
        field.placeholder = 'Enter your phone number';
        field.setAttribute('autocomplete', 'tel');
        field.setAttribute('aria-label', 'Phone number');
        field.setAttribute('data-validation', 'phone');
    }
    
    field.value = '';
    clearFieldValidation(field);
}

/* ==========================================================================
   VALIDATION SYSTEM
   ========================================================================== */

/**
 * Setup validation for all form fields
 */
function setupValidation() {
    const fields = document.querySelectorAll('input, textarea, select');
    
    fields.forEach(field => {
        // Real-time validation on input
        field.addEventListener('input', (e) => {
            debounceValidation(e.target, CONFIG.debounceDelay);
        });
        
        // Immediate validation on blur
        field.addEventListener('blur', (e) => {
            validateField(e.target);
        });
    });
}

/**
 * Debounced validation to prevent excessive validation calls
 * @param {HTMLElement} field - Field to validate
 * @param {number} delay - Delay in milliseconds
 */
function debounceValidation(field, delay) {
    const fieldId = field.id;
    
    // Clear existing timeout
    if (validationTimeouts.has(fieldId)) {
        clearTimeout(validationTimeouts.get(fieldId));
    }
    
    // Set new timeout
    const timeoutId = setTimeout(() => {
        validateField(field);
        validationTimeouts.delete(fieldId);
    }, delay);
    
    validationTimeouts.set(fieldId, timeoutId);
}

/**
 * Validate a single field
 * @param {HTMLElement} field - Field to validate
 * @returns {boolean} - Whether the field is valid
 */
function validateField(field) {
    const validationType = field.dataset.validation;
    const value = field.value.trim();
    
    // Skip validation for optional fields that are empty
    if (validationType === 'optional' && !value) {
        clearFieldValidation(field);
        return true;
    }
    
    // Required field check
    if (field.hasAttribute('required') && !value) {
        const config = CONFIG.validation[validationType] || {};
        showFieldError(field, config.messages?.required || 'This field is required');
        return false;
    }
    
    // Skip type-specific validation if field is empty and not required
    if (!value && !field.hasAttribute('required')) {
        clearFieldValidation(field);
        return true;
    }
    
    // Type-specific validation
    const validationResult = performTypeSpecificValidation(field, value, validationType);
    
    if (validationResult.isValid) {
        showFieldSuccess(field);
    } else {
        showFieldError(field, validationResult.errorMessage);
    }
    
    return validationResult.isValid;
}

/**
 * Perform type-specific validation
 * @param {HTMLElement} field - Field to validate
 * @param {string} value - Field value
 * @param {string} validationType - Type of validation
 * @returns {Object} - Validation result
 */
function performTypeSpecificValidation(field, value, validationType) {
    switch (validationType) {
        case 'name':
            return validateName(value);
        case 'email':
            return validateEmail(value);
        case 'phone':
            return validatePhone(value);
        case 'date':
            return validateDate(field, value);
        case 'time':
            return validateTime(value);
        case 'textarea':
            return validateTextarea(value);
        case 'select':
            return validateSelect(value);
        default:
            return { isValid: true, errorMessage: '' };
    }
}

/**
 * Validate name field
 * @param {string} value - Name value
 * @returns {Object} - Validation result
 */
function validateName(value) {
    const config = CONFIG.validation.name;
    
    if (value.length < config.minLength) {
        return { isValid: false, errorMessage: config.messages.minLength };
    }
    
    if (!config.pattern.test(value)) {
        return { isValid: false, errorMessage: config.messages.pattern };
    }
    
    return { isValid: true, errorMessage: '' };
}

/**
 * Validate email field
 * @param {string} value - Email value
 * @returns {Object} - Validation result
 */
function validateEmail(value) {
    const config = CONFIG.validation.email;
    const isValid = config.pattern.test(value);
    
    return {
        isValid,
        errorMessage: isValid ? '' : config.messages.pattern
    };
}

/**
 * Validate phone field
 * @param {string} value - Phone value
 * @returns {Object} - Validation result
 */
function validatePhone(value) {
    const config = CONFIG.validation.phone;
    const isValid = config.pattern.test(value);
    
    return {
        isValid,
        errorMessage: isValid ? '' : config.messages.pattern
    };
}

/**
 * Validate date field
 * @param {HTMLElement} field - Date field
 * @param {string} value - Date value
 * @returns {Object} - Validation result
 */
function validateDate(field, value) {
    const config = CONFIG.validation.date;
    
    if (!value) {
        return { isValid: false, errorMessage: config.messages.required };
    }
    
    const selectedDate = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (isNaN(selectedDate.getTime())) {
        return { isValid: false, errorMessage: config.messages.invalid };
    }
    
    if (selectedDate < today) {
        return { isValid: false, errorMessage: config.messages.past };
    }
    
    return { isValid: true, errorMessage: '' };
}

/**
 * Validate time field
 * @param {string} value - Time value
 * @returns {Object} - Validation result
 */
function validateTime(value) {
    const config = CONFIG.validation.time;
    const isValid = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value);
    
    return {
        isValid,
        errorMessage: isValid ? '' : config.messages.invalid
    };
}

/**
 * Validate textarea field
 * @param {string} value - Textarea value
 * @returns {Object} - Validation result
 */
function validateTextarea(value) {
    const config = CONFIG.validation.textarea;
    
    if (value.length < config.minLength) {
        return { isValid: false, errorMessage: config.messages.minLength };
    }
    
    if (value.length > config.maxLength) {
        return { isValid: false, errorMessage: config.messages.maxLength };
    }
    
    return { isValid: true, errorMessage: '' };
}

/**
 * Validate select field
 * @param {string} value - Select value
 * @returns {Object} - Validation result
 */
function validateSelect(value) {
    const config = CONFIG.validation.select;
    const isValid = value !== '';
    
    return {
        isValid,
        errorMessage: isValid ? '' : config.messages.required
    };
}

/* ==========================================================================
   VALIDATION UI FUNCTIONS
   ========================================================================== */

/**
 * Show field error state
 * @param {HTMLElement} field - Field element
 * @param {string} message - Error message
 */
function showFieldError(field, message) {
    const wrapper = field.closest('.input-wrapper');
    const errorEl = document.getElementById(field.id + '-error');
    const successEl = document.getElementById(field.id + '-success');
    
    field.setAttribute('aria-invalid', 'true');
    
    if (wrapper) {
        wrapper.classList.remove('valid');
        wrapper.classList.add('invalid');
    }
    
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }
    
    if (successEl) {
        successEl.style.display = 'none';
    }
    
    // Announce error to screen readers
    const fieldLabel = getFieldLabel(field);
    announceToScreenReader(`Error in ${fieldLabel}: ${message}`);
}

/**
 * Show field success state
 * @param {HTMLElement} field - Field element
 */
function showFieldSuccess(field) {
    const wrapper = field.closest('.input-wrapper');
    const errorEl = document.getElementById(field.id + '-error');
    const successEl = document.getElementById(field.id + '-success');
    
    field.removeAttribute('aria-invalid');
    
    if (wrapper) {
        wrapper.classList.remove('invalid');
        wrapper.classList.add('valid');
    }
    
    if (errorEl) {
        errorEl.style.display = 'none';
    }
    
    if (successEl) {
        successEl.textContent = 'Valid';
        successEl.style.display = 'block';
    }
}

/**
 * Clear field validation state
 * @param {HTMLElement} field - Field element
 */
function clearFieldValidation(field) {
    const wrapper = field.closest('.input-wrapper');
    const errorEl = document.getElementById(field.id + '-error');
    const successEl = document.getElementById(field.id + '-success');
    
    field.removeAttribute('aria-invalid');
    
    if (wrapper) {
        wrapper.classList.remove('valid', 'invalid');
    }
    
    if (errorEl) {
        errorEl.style.display = 'none';
        errorEl.textContent = '';
    }
    
    if (successEl) {
        successEl.style.display = 'none';
        successEl.textContent = '';
    }
}

/**
 * Get field label for accessibility
 * @param {HTMLElement} field - Field element
 * @returns {string} - Field label
 */
function getFieldLabel(field) {
    const label = field.labels?.[0]?.textContent || 
                  field.getAttribute('aria-label') || 
                  field.name || 
                  field.id;
    return label.replace('*', '').trim();
}

/* ==========================================================================
   CHARACTER COUNTER FUNCTIONS
   ========================================================================== */

/**
 * Update character count display
 * @param {HTMLElement} textarea - Textarea element
 * @param {HTMLElement} counter - Counter element
 */
function updateCharacterCount(textarea, counter) {
    const current = textarea.value.length;
    const max = parseInt(textarea.getAttribute('maxlength'));
    const percentage = current / max;
    
    counter.textContent = `${current}/${max} characters`;
    
    // Update styling based on usage
    counter.classList.remove('warning', 'error');
    if (percentage >= 1) {
        counter.classList.add('error');
    } else if (percentage >= 0.8) {
        counter.classList.add('warning');
    }
}

/* ==========================================================================
   FORM SUBMISSION HANDLERS
   ========================================================================== */

/**
 * Handle form submission
 * @param {HTMLFormElement} form - Form element
 * @param {string} formType - Type of form (issue/enquiry)
 */
function handleFormSubmit(form, formType) {
    if (isSubmitting) return;
    
    announceToScreenReader('Validating form...');
    
    // Validate all fields
    const validationResult = validateForm(form);
    
    if (!validationResult.isValid) {
        handleValidationFailure(validationResult.firstErrorField);
        return;
    }

    // Show loading state
    const submitBtn = document.getElementById(formType + '-submit');
    setSubmitButtonLoading(submitBtn, true);
    isSubmitting = true;
    
    announceToScreenReader(`Submitting your ${formType}...`);

    // Collect and send form data
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    sendEmail(data, formType)
        .then(() => {
            showSuccessPopup(formType);
            resetForm(form, formType);
        })
        .catch((error) => {
            console.error('Email send error:', error);
            handleSubmissionError();
        })
        .finally(() => {
            setSubmitButtonLoading(submitBtn, false);
            isSubmitting = false;
        });
}

/**
 * Validate entire form
 * @param {HTMLFormElement} form - Form to validate
 * @returns {Object} - Validation result
 */
function validateForm(form) {
    let isValid = true;
    let firstErrorField = null;
    const fields = form.querySelectorAll('input, textarea, select');
    
    fields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
            if (!firstErrorField) {
                firstErrorField = field;
            }
        }
    });

    return { isValid, firstErrorField };
}

/**
 * Handle validation failure
 * @param {HTMLElement} firstErrorField - First field with error
 */
function handleValidationFailure(firstErrorField) {
    if (firstErrorField) {
        firstErrorField.focus();
        firstErrorField.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
    }
    announceToScreenReader('Please fix the errors in the form before submitting');
}

/**
 * Handle submission error
 */
function handleSubmissionError() {
    const errorMsg = 'Failed to send email. Please try again or contact us directly.';
    announceToScreenReader(errorMsg);
    
    // You could implement a form-level error display here
    // For now, using alert as fallback
    alert(errorMsg);
}

/**
 * Set submit button loading state
 * @param {HTMLElement} button - Submit button
 * @param {boolean} isLoading - Whether button is in loading state
 */
function setSubmitButtonLoading(button, isLoading) {
    button.disabled = isLoading;
    button.classList.toggle('loading', isLoading);
    button.setAttribute('aria-busy', isLoading.toString());
    
    const btnText = button.querySelector('.btn-text');
    const loading = button.querySelector('.loading');
    
    if (isLoading) {
        btnText.textContent = btnText.textContent.replace('Submit', 'Submitting');
        loading.setAttribute('aria-hidden', 'false');
    } else {
        btnText.textContent = btnText.textContent.replace('Submitting', 'Submit');
        loading.setAttribute('aria-hidden', 'true');
    }
}

/**
 * Reset form to initial state
 * @param {HTMLFormElement} form - Form to reset
 * @param {string} formType - Type of form
 */
function resetForm(form, formType) {
    form.reset();
    
    // Clear all validation states
    const fields = form.querySelectorAll('input, textarea, select');
    fields.forEach(field => {
        clearFieldValidation(field);
    });
    
    // Reset contact method for issue form
    if (formType === 'issue') {
        const emailRadio = form.querySelector('input[name="contact-method"][value="email"]');
        if (emailRadio) {
            emailRadio.checked = true;
            const changeEvent = new Event('change', { bubbles: true });
            emailRadio.dispatchEvent(changeEvent);
        }
    }
    
    // Reset character counters
    const textareas = form.querySelectorAll('textarea[maxlength]');
    textareas.forEach(textarea => {
        const counterId = textarea.id + '-count';
        const counter = document.getElementById(counterId);
        if (counter) {
            updateCharacterCount(textarea, counter);
        }
    });
}

/* ==========================================================================
   EMAIL SENDING FUNCTIONS
   ========================================================================== */

/**
 * Send email using EmailJS
 * @param {Object} data - Form data
 * @param {string} formType - Type of form
 * @returns {Promise} - Email sending promise
 */
function sendEmail(data, formType) {
    if (typeof emailjs === 'undefined') {
        return Promise.reject(new Error('EmailJS not loaded - please refresh the page and try again'));
    }

    try {
        const templateParams = createTemplateParams(data, formType);
        const templateId = formType === 'issue' ? 
            CONFIG.email.issueTemplateId : 
            CONFIG.email.enquiryTemplateId;

        return emailjs.send(
            CONFIG.email.serviceId,
            templateId,
            templateParams
        ).catch(error => {
            // Add more specific error handling
            if (error.status === 400) {
                throw new Error('Invalid email configuration. Please contact support.');
            } else if (error.status === 404) {
                throw new Error('Email service not found. Please contact support.');
            } else {
                throw new Error('Failed to send email. Please check your internet connection and try again.');
            }
        });
    } catch (error) {
        return Promise.reject(error);
    }
}

/**
 * Create email template parameters
 * @param {Object} data - Form data
 * @param {string} formType - Type of form
 * @returns {Object} - Template parameters
 */
function createTemplateParams(data, formType) {
    return {
        to_email: CONFIG.email.adminEmail,
        from_name: data.name,
        form_type: formType.toUpperCase(),
        submitted_at: new Date().toLocaleString(),
        
        // Common fields
        contact_method: data['contact-method'] || 'N/A',
        contact_info: data.contact || data['contact-number'] || 'N/A',
        booking_date: data['booking-date'] || 'N/A',
        booking_time: data['booking-time'] || 'N/A',
        
        // Issue-specific fields
        booking_details: data['booking-details'] || 'N/A',
        walkin_time: data['walkin-time'] || 'N/A',
        walkout_time: data['walkout-time'] || 'N/A',
        issue_description: data['issue-description'] || 'N/A',
        
        // Enquiry-specific fields
        contact_number: data['contact-number'] || 'N/A',
        people_count: data['people-count'] || 'N/A',
        enquiry_description: data['enquiry-description'] || 'N/A',
        
        // Email body
        email_body: createEmailBody(data, formType)
    };
}

/**
 * Create formatted email body
 * @param {Object} data - Form data
 * @param {string} formType - Type of form
 * @returns {string} - Formatted email body
 */
function createEmailBody(data, formType) {
    const timestamp = new Date().toLocaleString();
    
    if (formType === 'issue') {
        return `
ISSUE REPORT SUBMISSION
======================

Submitted: ${timestamp}
Name: ${data.name}
Contact Method: ${data['contact-method'] || 'N/A'}
Contact Info: ${data.contact || 'N/A'}

BOOKING INFORMATION:
- Booking Details: ${data['booking-details'] || 'None provided'}
- Booking Date: ${data['booking-date'] || 'N/A'}
- Booking Time: ${data['booking-time'] || 'N/A'}
- Walk-in Time: ${data['walkin-time'] || 'N/A'}
- Walk-out Time: ${data['walkout-time'] || 'N/A'}

ISSUE DESCRIPTION:
${data['issue-description'] || 'No description provided'}

---
This issue report was submitted through the website contact form.
        `.trim();
    } else {
        return `
ENQUIRY SUBMISSION
==================

Submitted: ${timestamp}
Name: ${data.name}
Contact Number: ${data['contact-number'] || 'N/A'}

BOOKING REQUEST:
- Preferred Date: ${data['booking-date'] || 'N/A'}
- Preferred Time: ${data['booking-time'] || 'N/A'}
- Number of People: ${data['people-count'] || 'N/A'}

ENQUIRY DETAILS:
${data['enquiry-description'] || 'No details provided'}

---
This enquiry was submitted through the website contact form.
        `.trim();
    }
}

/* ==========================================================================
   SUCCESS POPUP FUNCTIONS
   ========================================================================== */

/**
 * Show success popup
 * @param {string} formType - Type of form
 */
function showSuccessPopup(formType) {
    const overlay = document.getElementById('popup-overlay');
    const popup = document.getElementById('success-popup');
    const title = document.getElementById('popup-title');
    const message = document.getElementById('popup-message');

    if (!overlay || !popup || !title || !message) return;

    // Set popup content
    if (formType === 'issue') {
        title.textContent = '✅ Issue Reported Successfully!';
        message.innerHTML = `Your issue has been reported and emailed to <strong>${CONFIG.email.adminEmail}</strong>.<br>We will investigate and get back to you soon.`;
    } else {
        title.textContent = '✅ Enquiry Submitted Successfully!';
        message.innerHTML = `Your enquiry has been emailed to <strong>${CONFIG.email.adminEmail}</strong>.<br>We will contact you shortly to confirm your booking.`;
    }

    // Show popup with accessibility
    overlay.style.display = 'block';
    overlay.setAttribute('aria-hidden', 'false');
    popup.style.display = 'block';
    popup.setAttribute('aria-hidden', 'false');
    
    // Focus management
    const closeButton = document.getElementById('popup-close');
    if (closeButton) {
        setTimeout(() => closeButton.focus(), 100);
    }
    
    // Announce success
    const announcement = title.textContent + ' ' + message.textContent.replace(/<[^>]*>/g, '');
    announceToScreenReader(announcement);
    
    // Trap focus in popup
    trapFocusInPopup(popup);
}

/**
 * Close success popup
 */
function closePopup() {
    const overlay = document.getElementById('popup-overlay');
    const popup = document.getElementById('success-popup');
    
    if (overlay) {
        overlay.style.display = 'none';
        overlay.setAttribute('aria-hidden', 'true');
    }
    
    if (popup) {
        popup.style.display = 'none';
        popup.setAttribute('aria-hidden', 'true');
    }
    
    // Return focus to submit button
    const activePanel = document.querySelector('[role="tabpanel"]:not([aria-hidden="true"])');
    const submitButton = activePanel?.querySelector('.submit-btn');
    
    if (submitButton) {
        submitButton.focus();
    }
}

/* ==========================================================================
   ACCESSIBILITY FUNCTIONS
   ========================================================================== */

/**
 * Announce message to screen readers
 * @param {string} message - Message to announce
 */
function announceToScreenReader(message) {
    const statusElement = document.getElementById('form-status');
    if (statusElement) {
        statusElement.textContent = message;
        setTimeout(() => {
            statusElement.textContent = '';
        }, 1000);
    }
}

/**
 * Setup accessibility features
 */
function setupAccessibilityFeatures() {
    setupSkipLink();
    setupKeyboardNavigation();
    setupEscapeKeyHandler();
}

/**
 * Setup skip link functionality
 */
function setupSkipLink() {
    const skipLink = document.querySelector('.skip-link');
    if (skipLink) {
        skipLink.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.focus();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
}

/**
 * Setup keyboard navigation for tabs
 */
function setupKeyboardNavigation() {
    const tabs = document.querySelectorAll('[role="tab"]');
    
    tabs.forEach((tab, index) => {
        tab.addEventListener('keydown', function(e) {
            let targetTab = null;
            
            switch(e.key) {
                case 'ArrowLeft':
                case 'ArrowUp':
                    e.preventDefault();
                    targetTab = tabs[index === 0 ? tabs.length - 1 : index - 1];
                    break;
                case 'ArrowRight':
                case 'ArrowDown':
                    e.preventDefault();
                    targetTab = tabs[index === tabs.length - 1 ? 0 : index + 1];
                    break;
                case 'Home':
                    e.preventDefault();
                    targetTab = tabs[0];
                    break;
                case 'End':
                    e.preventDefault();
                    targetTab = tabs[tabs.length - 1];
                    break;
            }
            
            if (targetTab) {
                targetTab.focus();
                targetTab.click();
            }
        });
    });
}

/**
 * Setup escape key handler
 */
function setupEscapeKeyHandler() {
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const popup = document.getElementById('success-popup');
            if (popup && popup.style.display === 'block') {
                closePopup();
            }
        }
    });
}

/**
 * Trap focus within popup
 * @param {HTMLElement} popup - Popup element
 */
function trapFocusInPopup(popup) {
    const focusableElements = popup.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    function handleTabKey(e) {
        if (e.key === 'Tab') {
            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        }
    }

    const keydownHandler = handleTabKey;
    popup.addEventListener('keydown', keydownHandler);
    
    // Clean up event listener when popup is closed
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                if (popup.style.display === 'none') {
                    popup.removeEventListener('keydown', keydownHandler);
                    observer.disconnect();
                }
            }
        });
    });
    
    observer.observe(popup, { attributes: true });
}

/* ==========================================================================
   UTILITY FUNCTIONS
   ========================================================================== */

/**
 * Log error with context
 * @param {string} message - Error message
 * @param {Error} error - Error object
 */
function logError(message, error) {
    console.error(`Contact Form Error: ${message}`, error);
}

/**
 * Check if EmailJS is available
 * @returns {boolean} - Whether EmailJS is available
 */
function isEmailJSAvailable() {
    return typeof emailjs !== 'undefined';
}

/* ==========================================================================
   MODULE EXPORTS (if using modules)
   ========================================================================== */

// Uncomment if using ES6 modules
// export {
//     switchTab,
//     validateField,
//     sendEmail,
//     showSuccessPopup,
//     closePopup
// };
