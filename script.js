/* Contact Form JavaScript - Optimized Version */

'use strict';

/* Contact Form JavaScript - Production Version */

'use strict';

/* Configuration */
const CONFIG = {
    email: {
        serviceId: 'service_6jnewbb',            // ✅ Your working Service ID
        issueTemplateId: 'template_bjh7sm3',     // ✅ Your Issue Template
        enquiryTemplateId: 'template_l9an0sq',   // ✅ Your Enquiry Template
        publicKey: 'i5TYdclyR0ihs1ZxG',         // ✅ Your Public Key
        adminEmail: 'casadeamorinfo@gmail.com'   // ✅ Your Email
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
        pastDate: {
            messages: {
                required: 'Please select a date',
                invalid: 'Please enter a valid date'
            }
        },
        futureDate: {
            messages: {
                required: 'Please select a date',
                past: 'Date cannot be in the past - please select a future date',
                invalid: 'Please enter a valid date'
            }
        },
        time: {
            messages: {
                required: 'Please select a time'
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
    }
};

/* State */
let currentTab = 'issue';
let validationTimeouts = new Map();
let isSubmitting = false;

/* Initialize */
document.addEventListener('DOMContentLoaded', function() {
    initializeEmailJS();
    initializeDateFields();
    setupEventListeners();
    setupValidation();
    setupAccessibilityFeatures();
});

/* EmailJS Initialization */
function initializeEmailJS() {
    if (typeof emailjs !== 'undefined') {
        try {
            emailjs.init(CONFIG.email.publicKey);
        } catch (error) {
            console.error('EmailJS initialization failed:', error);
        }
    }
}

/* Date Fields Setup */
function initializeDateFields() {
    const today = new Date().toISOString().split('T')[0];
    
    // Issue form booking date - allow past dates (no minimum)
    const bookingDate = document.getElementById('booking-date');
    // Don't set min date for issue form - past dates are allowed
    
    // Enquiry form date - only future dates
    const enquiryDate = document.getElementById('enquiry-date');
    if (enquiryDate) enquiryDate.setAttribute('min', today);
}

/* Event Listeners */
function setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('[data-tab]').forEach(tab => {
        tab.addEventListener('click', handleTabClick);
    });

    // Contact method toggle
    document.querySelectorAll('input[name="contact-method"]').forEach(radio => {
        radio.addEventListener('change', handleContactMethodChange);
    });

    // Form submissions
    document.getElementById('issue-form-element').addEventListener('submit', (e) => {
        e.preventDefault();
        handleFormSubmit(e.target, 'issue');
    });

    document.getElementById('enquiry-form-element').addEventListener('submit', (e) => {
        e.preventDefault();
        handleFormSubmit(e.target, 'enquiry');
    });

    // Popup handlers
    document.getElementById('popup-close').addEventListener('click', closePopup);
    document.getElementById('popup-overlay').addEventListener('click', closePopup);

    // Character counters
    setupCharacterCounters();
}

/* Tab Navigation */
function handleTabClick(event) {
    const tabName = event.target.dataset.tab;
    if (tabName) switchTab(tabName);
}

function switchTab(tabName) {
    if (currentTab === tabName) return;
    
    currentTab = tabName;
    
    // Update tab states
    document.querySelectorAll('[role="tab"]').forEach(tab => {
        const isSelected = tab.dataset.tab === tabName;
        tab.classList.toggle('active', isSelected);
        tab.setAttribute('aria-selected', isSelected);
    });
    
    // Update panel states
    document.querySelectorAll('[role="tabpanel"]').forEach(panel => {
        const isActive = panel.id === tabName + '-form';
        panel.classList.toggle('active', isActive);
        panel.setAttribute('aria-hidden', (!isActive).toString());
    });
    
    // Focus first input
    setTimeout(() => {
        const firstInput = document.querySelector(`#${tabName}-form input:not([type="radio"]), #${tabName}-form select, #${tabName}-form textarea`);
        if (firstInput) firstInput.focus();
    }, 300);
}

/* Contact Method Toggle */
function handleContactMethodChange(event) {
    const contactField = document.querySelector(`#${event.target.dataset.target}`);
    const selectedMethod = event.target.value;
    
    if (!contactField) return;
    
    if (selectedMethod === 'email') {
        contactField.type = 'email';
        contactField.placeholder = 'Enter your email address';
        contactField.setAttribute('autocomplete', 'email');
        contactField.setAttribute('data-validation', 'email');
    } else {
        contactField.type = 'tel';
        contactField.placeholder = 'Enter your phone number';
        contactField.setAttribute('autocomplete', 'tel');
        contactField.setAttribute('data-validation', 'phone');
    }
    
    contactField.value = '';
    clearFieldValidation(contactField);
    setTimeout(() => contactField.focus(), 100);
}

/* Validation Setup */
function setupValidation() {
    document.querySelectorAll('input, textarea, select').forEach(field => {
        field.addEventListener('input', (e) => debounceValidation(e.target, 300));
        field.addEventListener('blur', (e) => validateField(e.target));
    });
}

function debounceValidation(field, delay) {
    const fieldId = field.id;
    
    if (validationTimeouts.has(fieldId)) {
        clearTimeout(validationTimeouts.get(fieldId));
    }
    
    const timeoutId = setTimeout(() => {
        validateField(field);
        validationTimeouts.delete(fieldId);
    }, delay);
    
    validationTimeouts.set(fieldId, timeoutId);
}

function validateField(field) {
    const validationType = field.dataset.validation;
    const value = field.value.trim();
    
    // Skip optional empty fields
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
    
    // Skip validation if empty and not required
    if (!value && !field.hasAttribute('required')) {
        clearFieldValidation(field);
        return true;
    }
    
    // Type-specific validation
    const validationResult = performValidation(field, value, validationType);
    
    if (validationResult.isValid) {
        showFieldSuccess(field);
    } else {
        showFieldError(field, validationResult.errorMessage);
    }
    
    return validationResult.isValid;
}

function performValidation(field, value, validationType) {
    switch (validationType) {
        case 'name':
            return validateName(value);
        case 'email':
            return validateEmail(value);
        case 'phone':
            return validatePhone(value);
        case 'past-date':
            return validatePastDate(value);
        case 'future-date':
            return validateFutureDate(value);
        case 'textarea':
            return validateTextarea(value);
        case 'select':
            return { isValid: value !== '', errorMessage: CONFIG.validation.select.messages.required };
        default:
            return { isValid: true, errorMessage: '' };
    }
}

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

function validateEmail(value) {
    const config = CONFIG.validation.email;
    const isValid = config.pattern.test(value);
    return { isValid, errorMessage: isValid ? '' : config.messages.pattern };
}

function validatePhone(value) {
    const config = CONFIG.validation.phone;
    const isValid = config.pattern.test(value);
    return { isValid, errorMessage: isValid ? '' : config.messages.pattern };
}

function validatePastDate(value) {
    const config = CONFIG.validation.pastDate;
    
    if (!value) {
        return { isValid: false, errorMessage: config.messages.required };
    }
    
    const selectedDate = new Date(value);
    
    if (isNaN(selectedDate.getTime())) {
        return { isValid: false, errorMessage: config.messages.invalid };
    }
    
    // For past dates (issue form), any valid date is acceptable
    return { isValid: true, errorMessage: '' };
}

function validateFutureDate(value) {
    const config = CONFIG.validation.futureDate;
    
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

/* Validation UI */
function showFieldError(field, message) {
    const wrapper = field.closest('.input-wrapper');
    const errorEl = document.getElementById(field.id + '-error');
    
    field.setAttribute('aria-invalid', 'true');
    
    if (wrapper) {
        wrapper.classList.remove('valid');
        wrapper.classList.add('invalid');
    }
    
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }
}

function showFieldSuccess(field) {
    const wrapper = field.closest('.input-wrapper');
    const errorEl = document.getElementById(field.id + '-error');
    
    field.removeAttribute('aria-invalid');
    
    if (wrapper) {
        wrapper.classList.remove('invalid');
        wrapper.classList.add('valid');
    }
    
    if (errorEl) {
        errorEl.style.display = 'none';
    }
}

function clearFieldValidation(field) {
    const wrapper = field.closest('.input-wrapper');
    const errorEl = document.getElementById(field.id + '-error');
    
    field.removeAttribute('aria-invalid');
    
    if (wrapper) {
        wrapper.classList.remove('valid', 'invalid');
    }
    
    if (errorEl) {
        errorEl.style.display = 'none';
        errorEl.textContent = '';
    }
}

/* Character Counters */
function setupCharacterCounters() {
    document.querySelectorAll('textarea[maxlength]').forEach(textarea => {
        const counterId = textarea.id + '-count';
        const counter = document.getElementById(counterId);
        
        if (counter) {
            textarea.addEventListener('input', () => updateCharacterCount(textarea, counter));
            updateCharacterCount(textarea, counter);
        }
    });
}

function updateCharacterCount(textarea, counter) {
    const current = textarea.value.length;
    const max = parseInt(textarea.getAttribute('maxlength'));
    const percentage = current / max;
    
    counter.textContent = `${current}/${max} characters`;
    
    counter.classList.remove('warning', 'error');
    if (percentage >= 1) {
        counter.classList.add('error');
    } else if (percentage >= 0.8) {
        counter.classList.add('warning');
    }
}

/* Form Submission */
function handleFormSubmit(form, formType) {
    if (isSubmitting) return;
    
    // Validate all fields
    let isValid = true;
    let firstErrorField = null;
    const fields = form.querySelectorAll('input, textarea, select');
    
    fields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
            if (!firstErrorField) firstErrorField = field;
        }
    });

    if (!isValid) {
        if (firstErrorField) {
            firstErrorField.focus();
            firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }

    // Show loading state
    const submitBtn = document.getElementById(formType + '-submit');
    setSubmitButtonLoading(submitBtn, true);
    isSubmitting = true;

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
            alert('Failed to send email. Please try again or contact us directly.');
        })
        .finally(() => {
            setSubmitButtonLoading(submitBtn, false);
            isSubmitting = false;
        });
}

function setSubmitButtonLoading(button, isLoading) {
    button.disabled = isLoading;
    button.classList.toggle('loading', isLoading);
    
    const btnText = button.querySelector('.btn-text');
    if (isLoading) {
        btnText.textContent = btnText.textContent.replace('Submit', 'Submitting');
    } else {
        btnText.textContent = btnText.textContent.replace('Submitting', 'Submit');
    }
}

function resetForm(form, formType) {
    form.reset();
    
    // Clear validation states
    form.querySelectorAll('input, textarea, select').forEach(field => {
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
    form.querySelectorAll('textarea[maxlength]').forEach(textarea => {
        const counterId = textarea.id + '-count';
        const counter = document.getElementById(counterId);
        if (counter) updateCharacterCount(textarea, counter);
    });
}

/* Email Sending */
function sendEmail(data, formType) {
    if (typeof emailjs === 'undefined') {
        return Promise.reject(new Error('EmailJS not loaded - please refresh the page and try again'));
    }

    const templateParams = {
        to_email: CONFIG.email.adminEmail,
        from_name: data.name,
        form_type: formType.toUpperCase(),
        submitted_at: new Date().toLocaleString(),
        contact_method: data['contact-method'] || 'N/A',
        contact_info: data.contact || data['contact-number'] || 'N/A',
        booking_date: data['booking-date'] || 'N/A',
        booking_time: data['booking-time'] || 'N/A',
        booking_details: data['booking-details'] || 'N/A',
        walkin_time: data['walkin-time'] || 'N/A',
        walkout_time: data['walkout-time'] || 'N/A',
        issue_description: data['issue-description'] || 'N/A',
        contact_number: data['contact-number'] || 'N/A',
        people_count: data['people-count'] || 'N/A',
        enquiry_description: data['enquiry-description'] || 'N/A',
        email_body: createEmailBody(data, formType)
    };

    const templateId = formType === 'issue' ? 
        CONFIG.email.issueTemplateId : 
        CONFIG.email.enquiryTemplateId;

    return emailjs.send(CONFIG.email.serviceId, templateId, templateParams);
}

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

/* Success Popup */
function showSuccessPopup(formType) {
    const overlay = document.getElementById('popup-overlay');
    const popup = document.getElementById('success-popup');
    const title = document.getElementById('popup-title');
    const message = document.getElementById('popup-message');

    if (formType === 'issue') {
        title.textContent = '✅ Issue Reported Successfully!';
        message.innerHTML = `Your issue has been reported and emailed to <strong>${CONFIG.email.adminEmail}</strong>.<br>We will investigate and get back to you soon.`;
    } else {
        title.textContent = '✅ Enquiry Submitted Successfully!';
        message.innerHTML = `Your enquiry has been emailed to <strong>${CONFIG.email.adminEmail}</strong>.<br>We will contact you shortly to confirm your booking.`;
    }

    overlay.style.display = 'block';
    overlay.setAttribute('aria-hidden', 'false');
    popup.style.display = 'block';
    popup.setAttribute('aria-hidden', 'false');
    
    document.getElementById('popup-close').focus();
}

function closePopup() {
    const overlay = document.getElementById('popup-overlay');
    const popup = document.getElementById('success-popup');
    
    overlay.style.display = 'none';
    overlay.setAttribute('aria-hidden', 'true');
    popup.style.display = 'none';
    popup.setAttribute('aria-hidden', 'true');
    
    // Return focus to submit button
    const activePanel = document.querySelector('[role="tabpanel"]:not([aria-hidden="true"])');
    const submitButton = activePanel?.querySelector('.submit-btn');
    if (submitButton) submitButton.focus();
}

/* Accessibility */
function setupAccessibilityFeatures() {
    // Skip link
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

    // Keyboard navigation for tabs
    document.querySelectorAll('[role="tab"]').forEach((tab, index, tabs) => {
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

    // Escape key for popup
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const popup = document.getElementById('success-popup');
            if (popup && popup.style.display === 'block') {
                closePopup();
            }
        }
    });
}
