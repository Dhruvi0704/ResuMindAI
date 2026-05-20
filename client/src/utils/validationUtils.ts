// Validation utility functions for resume form fields

export interface ValidationResult {
    isValid: boolean;
    error?: string;
}

/**
 * Validates that a name contains only alphabets and spaces
 */
export function validateFullName(name: string): ValidationResult {
    if (!name || name.trim() === '') {
        return { isValid: false, error: 'Full name is required' };
    }

    const alphaSpaceRegex = /^[A-Za-z\s]+$/;
    if (!alphaSpaceRegex.test(name)) {
        return { isValid: false, error: 'Full name can only contain letters and spaces' };
    }

    return { isValid: true };
}

/**
 * Validates that a job title contains only alphabets and spaces
 */
export function validateJobTitle(title: string): ValidationResult {
    if (!title || title.trim() === '') {
        return { isValid: false, error: 'Job title is required' };
    }

    const alphaSpaceRegex = /^[A-Za-z\s]+$/;
    if (!alphaSpaceRegex.test(title)) {
        return { isValid: false, error: 'Job title can only contain letters and spaces' };
    }

    return { isValid: true };
}

/**
 * Validates phone number (exactly 10 digits)
 */
export function validatePhone(phone: string): ValidationResult {
    if (!phone || phone.trim() === '') {
        return { isValid: false, error: 'Phone number is required' };
    }

    const digitsOnly = phone.replace(/\D/g, '');

    if (digitsOnly.length !== 10) {
        return { isValid: false, error: 'Phone number must be exactly 10 digits' };
    }

    return { isValid: true };
}

/**
 * Validates email format
 */
export function validateEmail(email: string): ValidationResult {
    if (!email || email.trim() === '') {
        return { isValid: false, error: 'Email is required' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { isValid: false, error: 'Please enter a valid email address' };
    }

    return { isValid: true };
}

/**
 * Validates skill name (alphabets and spaces only, no numbers or special characters)
 */
export function validateSkill(skill: string): ValidationResult {
    if (!skill || skill.trim() === '') {
        return { isValid: false, error: 'Skill name is required' };
    }

    const alphaSpaceRegex = /^[A-Za-z\s]+$/;
    if (!alphaSpaceRegex.test(skill)) {
        return { isValid: false, error: 'Skill name can only contain letters and spaces' };
    }

    return { isValid: true };
}

/**
 * Validates URL (must be valid and start with https://)
 */
export function validateUrl(url: string, fieldName: string = 'URL'): ValidationResult {
    // URLs are optional - empty is valid
    if (!url || url.trim() === '') {
        return { isValid: true };
    }

    // Check if URL starts with https://
    if (!url.startsWith('https://')) {
        return { isValid: false, error: `${fieldName} must start with https://` };
    }

    // Validate URL format
    try {
        new URL(url);
        return { isValid: true };
    } catch {
        return { isValid: false, error: `Please enter a valid ${fieldName}` };
    }
}

/**
 * Sanitizes input to allow only alphabets and spaces
 */
export function sanitizeAlphabetsAndSpaces(input: string): string {
    return input.replace(/[^A-Za-z\s]/g, '');
}

/**
 * Sanitizes input to allow only digits
 */
export function sanitizeDigits(input: string): string {
    return input.replace(/\D/g, '');
}

/**
 * Sanitizes input to allow only valid location characters (letters, spaces, commas, periods)
 */
export function sanitizeLocation(input: string): string {
    return input.replace(/[^A-Za-z\s,\.]/g, '');
}

/**
 * Validates required text with minimum length
 */
export function validateTextRequired(text: string, fieldName: string, minLength: number = 2): ValidationResult {
    if (!text || text.trim() === '') {
        return { isValid: false, error: `${fieldName} is required` };
    }

    if (text.trim().length < minLength) {
        return { isValid: false, error: `${fieldName} must be at least ${minLength} characters` };
    }

    return { isValid: true };
}

/**
 * Validates that end date is after start date
 */
export function validateDateRange(startDate: string, endDate: string, fieldName: string = 'End date'): ValidationResult {
    if (!startDate || !endDate) {
        return { isValid: true }; // Let required validation handle empty fields
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
        return { isValid: false, error: `${fieldName} must be after start date` };
    }

    return { isValid: true };
}

/**
 * Validates GPA format (e.g., "3.8" or "3.8/4.0")
 */
export function validateGPA(gpa: string): ValidationResult {
    if (!gpa || gpa.trim() === '') {
        return { isValid: true }; // GPA is optional
    }

    // Allow formats like "3.8" or "3.8/4.0"
    const gpaRegex = /^(\d{1}\.\d{1,2})(\/\d{1}\.\d{1})?$/;
    if (!gpaRegex.test(gpa.trim())) {
        return { isValid: false, error: 'GPA must be in format "3.8" or "3.8/4.0"' };
    }

    return { isValid: true };
}

/**
 * Validates that a date is not in the future
 */
export function validateNotFutureDate(date: string, fieldName: string): ValidationResult {
    if (!date || date.trim() === '') {
        return { isValid: false, error: `${fieldName} is required` };
    }

    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day

    if (selectedDate > today) {
        return { isValid: false, error: `${fieldName} cannot be in the future` };
    }

    return { isValid: true };
}

/**
 * Validates required date field
 */
export function validateDateRequired(date: string, fieldName: string): ValidationResult {
    if (!date || date.trim() === '') {
        return { isValid: false, error: `${fieldName} is required` };
    }

    return { isValid: true };
}

/**
 * Validates location field (required)
 * Location should contain letters and can include spaces, commas, periods
 * but should not be purely numeric
 */
export function validateLocation(location: string): ValidationResult {
    if (!location || location.trim() === '') {
        return { isValid: false, error: 'Location is required' };
    }

    // Location should contain only letters, spaces, commas, and periods
    const locationRegex = /^[A-Za-z\s,\.]+$/;
    if (!locationRegex.test(location)) {
        return { isValid: false, error: 'Location can only contain letters, spaces, commas, and periods' };
    }

    // Ensure location contains at least one letter (not purely punctuation/spaces)
    const hasLetter = /[A-Za-z]/.test(location);
    if (!hasLetter) {
        return { isValid: false, error: 'Location must contain at least one letter' };
    }

    return { isValid: true };
}
