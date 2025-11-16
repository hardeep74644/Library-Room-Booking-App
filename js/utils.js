// Utility functions to reduce code duplication across the application

/**
 * Time calculation utilities
 */
export class TimeUtils {
    // Convert time string to minutes for calculations
    static timeToMinutes(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    }

    // Calculate end time based on start time and duration
    static calculateEndTime(startTime, duration) {
        const [hours, minutes] = startTime.split(':').map(Number);
        let totalMinutes = hours * 60 + minutes;

        switch (duration) {
            case '30min':
                totalMinutes += 30;
                break;
            case '1hr':
                totalMinutes += 60;
                break;
            case '1.5hr':
                totalMinutes += 90;
                break;
            case '2hr':
                totalMinutes += 120;
                break;
        }

        const endHours = Math.floor(totalMinutes / 60);
        const endMinutes = totalMinutes % 60;

        return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
    }

    // Validate booking time is within allowed hours
    static validateBookingHours(startTime, endTime) {
        const startMinutes = this.timeToMinutes(startTime);
        const endMinutes = this.timeToMinutes(endTime);
        const allowedStartTime = 9 * 60; // 9:00 AM
        const allowedEndTime = 21 * 60;  // 9:00 PM

        return startMinutes >= allowedStartTime && endMinutes <= allowedEndTime;
    }

    // Get booking hours validation message
    static getBookingHoursMessage(startTime, endTime) {
        const startMinutes = this.timeToMinutes(startTime);
        const endMinutes = this.timeToMinutes(endTime);
        const allowedStartTime = 9 * 60; // 9:00 AM
        const allowedEndTime = 21 * 60;  // 9:00 PM

        let message = '⏰ Room booking is only available between 9:00 AM and 9:00 PM.\n\n';

        if (startMinutes < allowedStartTime) {
            message += `• Your selected start time (${startTime}) is before 9:00 AM\n`;
        }

        if (endMinutes > allowedEndTime) {
            message += `• Your booking would end at ${endTime}, which is after 9:00 PM\n`;
        }

        message += '\nPlease select a different time slot within the allowed hours.';
        return message;
    }
}

/**
 * Date utilities
 */
export class DateUtils {
    // Get today's date in YYYY-MM-DD format
    static getTodayDate() {
        return new Date().toISOString().split('T')[0];
    }

    // Check if date is in the past
    static isPastDate(dateString) {
        const selectedDate = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return selectedDate < today;
    }

    // Format date for display
    static formatDate(dateString) {
        return new Date(dateString).toLocaleDateString();
    }
}

/**
 * UI utilities
 */
export class UIUtils {
    // Show loading state in table
    static showTableLoading(tableId, colspan, message = 'Loading...') {
        const table = document.getElementById(tableId);
        if (table) {
            table.innerHTML = `<tr><td colspan="${colspan}" style="text-align: center; color: #666;">${message}</td></tr>`;
        }
    }

    // Show empty state in table
    static showTableEmpty(tableId, colspan, message = 'No data found') {
        const table = document.getElementById(tableId);
        if (table) {
            table.innerHTML = `<tr><td colspan="${colspan}" style="text-align: center; color: #999;">${message}</td></tr>`;
        }
    }

    // Show error state in table
    static showTableError(tableId, colspan, error) {
        const table = document.getElementById(tableId);
        if (table) {
            table.innerHTML = `
                <tr>
                    <td colspan="${colspan}" style="text-align: center; color: #dc3545;">
                        Error: ${error.message}<br>
                        <small>Check browser console for details</small>
                    </td>
                </tr>
            `;
        }
    }

    // Update user welcome message
    static updateWelcomeMessage(userData, fallbackEmail) {
        const nameElement = document.querySelector('.user-info strong');
        if (nameElement) {
            nameElement.textContent = userData?.name || fallbackEmail || 'Unknown User';
        }
    }
}

/**
 * Validation utilities
 */
export class ValidationUtils {
    // Validate email format
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Validate booking form data
    static validateBookingForm(date, startTime, duration) {
        const errors = [];

        if (!date) {
            errors.push('Please select a date');
        } else if (DateUtils.isPastDate(date)) {
            errors.push('Cannot book rooms for past dates');
        }

        if (!startTime) {
            errors.push('Please select a start time');
        }

        if (!duration) {
            errors.push('Please select a duration');
        }

        if (date && startTime && duration) {
            const endTime = TimeUtils.calculateEndTime(startTime, duration);
            if (!TimeUtils.validateBookingHours(startTime, endTime)) {
                errors.push(TimeUtils.getBookingHoursMessage(startTime, endTime));
            }
        }

        return errors;
    }

    // Validate room form data
    static validateRoomForm(number, floor, capacity) {
        const errors = [];

        if (!number || number.trim() === '') {
            errors.push('Room number is required');
        }

        if (!floor || floor < 1) {
            errors.push('Floor must be a positive number');
        }

        if (!capacity || ![2, 4].includes(parseInt(capacity))) {
            errors.push('Capacity must be either 2 or 4 people');
        }

        return errors;
    }
}

/**
 * Error handling utilities
 */
export class ErrorUtils {
    // Get user-friendly authentication error message
    static getAuthErrorMessage(errorCode) {
        switch (errorCode) {
            case 'auth/invalid-email':
                return 'Invalid email address format.';
            case 'auth/user-not-found':
                return 'No user found with this email.';
            case 'auth/wrong-password':
                return 'Incorrect password.';
            case 'auth/invalid-credential':
                return 'Invalid email or password.';
            case 'auth/email-already-in-use':
                return 'An account with this email already exists.';
            case 'auth/weak-password':
                return 'Password should be at least 6 characters.';
            case 'auth/network-request-failed':
                return 'Network error. Please check your connection.';
            default:
                return 'An error occurred. Please try again.';
        }
    }

    // Get user-friendly Firebase error message
    static getFirebaseErrorMessage(errorCode) {
        switch (errorCode) {
            case 'permission-denied':
                return 'Permission denied. Please check your access rights.';
            case 'not-found':
                return 'The requested data was not found.';
            case 'already-exists':
                return 'The data already exists.';
            case 'failed-precondition':
                return 'Operation failed due to database constraints.';
            case 'unavailable':
                return 'Service temporarily unavailable. Please try again later.';
            case 'network-request-failed':
                return 'Network error. Please check your internet connection.';
            default:
                return `Database error: ${errorCode}`;
        }
    }
}

// Export all utility classes
export { TimeUtils, DateUtils, UIUtils, ValidationUtils, ErrorUtils };