// Validation utilities
function validatePhoneNumber(phone) {
    // International format validation
    const phoneRegex = /^\+\d{1,3}\s?\d{6,14}$/;
    return phoneRegex.test(phone.trim());
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validateURL(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

function validateMessage(message) {
    if (!message || message.trim().length === 0) {
        return false;
    }
    if (message.length > 4096) {
        return false;
    }
    return true;
}

function validateContactList(contacts) {
    if (!Array.isArray(contacts) || contacts.length === 0) {
        return { valid: false, error: 'Empty contact list' };
    }

    const validContacts = contacts.filter(c => validatePhoneNumber(c.phone));
    if (validContacts.length === 0) {
        return { valid: false, error: 'No valid phone numbers' };
    }

    return { valid: true, validContacts };
}
