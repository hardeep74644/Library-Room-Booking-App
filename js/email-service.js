// Email Service using EmailJS
class EmailService {
    constructor() {
        // Initialize EmailJS - You'll need to get these from https://emailjs.com/
        this.serviceID = 'service_56z5rtf'; // e.g., 'service_abc123'
        this.templateIDBooking = 'template_9anqwke'; // e.g., 'template_booking123'
        this.templateIDCancellation = 'template_i4rot1p'; // e.g., 'template_cancel123'
        this.publicKey = 'uUvTB7tsG4B7hHtIb'; // e.g., 'user_xyz789'

        // Check if credentials are configured
        this.isConfigured = this.checkConfiguration();

        // Initialize EmailJS only if configured
        if (this.isConfigured) {
            this.initEmailJS();
        } else {
            console.log('📧 EmailJS not configured - emails will be skipped');
        }
    }

    checkConfiguration() {
        return this.serviceID !== 'YOUR_SERVICE_ID' &&
            this.templateIDBooking !== 'YOUR_BOOKING_TEMPLATE_ID' &&
            this.templateIDCancellation !== 'YOUR_CANCELLATION_TEMPLATE_ID' &&
            this.publicKey !== 'YOUR_PUBLIC_KEY';
    }

    async initEmailJS() {
        try {
            // Check if already configured
            if (!this.isConfigured) {
                console.log('⚠️ EmailJS credentials not configured');
                return;
            }

            // Load EmailJS library dynamically
            if (!window.emailjs) {
                await this.loadEmailJSLibrary();
            }

            // Initialize with your public key
            emailjs.init(this.publicKey);
            console.log('✅ EmailJS initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize EmailJS:', error);
            this.isConfigured = false;
        }
    }

    loadEmailJSLibrary() {
        return new Promise((resolve, reject) => {
            if (window.emailjs) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async sendBookingConfirmation(userEmail, userName, booking) {
        try {
            // Check if EmailJS is configured
            if (!this.isConfigured) {
                console.log('📧 EmailJS not configured - skipping booking confirmation email');
                return true; // Return true to not break the booking flow
            }

            const templateParams = {
                user_name: userName,
                user_email: 'hardeepsingh01.apex@gmail.com',
                room_number: booking.roomNumber,
                booking_date: booking.date,
                start_time: booking.startTime,
                end_time: booking.endTime,
                duration: this.formatDuration(booking),
                booking_id: booking.id,
                booking_status: booking.status,
                created_at: this.formatDate(booking.createdAt),
                library_name: 'KPU Library'
            };

            // Validate template parameters before sending
            if (!templateParams.user_name || !templateParams.user_email || !templateParams.room_number) {
                console.error('❌ Missing required template parameters:', templateParams);
                return false;
            }

            console.log('📧 Sending booking confirmation email...', templateParams);

            // Try sending with EmailJS
            const response = await emailjs.send(
                this.serviceID,
                this.templateIDBooking,
                templateParams
            );

            console.log('✅ Booking confirmation email sent successfully:', response);
            return true;

        } catch (error) {
            console.error('❌ Failed to send booking confirmation email:', error);
            console.error('Error details:', {
                status: error.status,
                text: error.text,
                message: error.message,
                serviceID: this.serviceID,
                templateID: this.templateIDBooking
            });

            // Log template params for debugging (remove sensitive info)
            const debugParams = { ...templateParams };
            delete debugParams.user_email; // Remove email for privacy
            console.log('Template parameters used:', debugParams);

            // Don't throw error - email failure shouldn't prevent booking
            return false;
        }
    }

    async sendCancellationConfirmation(userEmail, userName, booking) {
        try {
            // Check if EmailJS is configured
            if (!this.isConfigured) {
                console.log('📧 EmailJS not configured - skipping cancellation confirmation email');
                return true; // Return true to not break the cancellation flow
            }

            const templateParams = {
                user_name: userName,
                user_email: 'hardeepsingh01.apex@gmail.com',
                room_number: booking.roomNumber,
                booking_date: booking.date,
                start_time: booking.startTime,
                end_time: booking.endTime,
                duration: this.formatDuration(booking),
                booking_id: booking.id,
                cancelled_at: this.formatDate(booking.cancelledAt || new Date()),
                library_name: 'KPU Library'
            };

            // Validate template parameters before sending
            if (!templateParams.user_name || !templateParams.user_email || !templateParams.room_number) {
                console.error('❌ Missing required template parameters:', templateParams);
                return false;
            }

            console.log('📧 Sending cancellation confirmation email...', templateParams);

            const response = await emailjs.send(
                this.serviceID,
                this.templateIDCancellation,
                templateParams
            );

            console.log('✅ Cancellation confirmation email sent successfully:', response);
            return true;

        } catch (error) {
            console.error('❌ Failed to send cancellation confirmation email:', error);
            console.error('Error details:', {
                status: error.status,
                text: error.text,
                message: error.message,
                serviceID: this.serviceID,
                templateID: this.templateIDCancellation
            });

            // Log template params for debugging (remove sensitive info)
            const debugParams = { ...templateParams };
            delete debugParams.user_email; // Remove email for privacy
            console.log('Template parameters used:', debugParams);

            // Don't throw error - email failure shouldn't prevent cancellation
            return false;
        }
    }

    formatDuration(booking) {
        const start = this.timeToMinutes(booking.startTime);
        const end = this.timeToMinutes(booking.endTime);
        const totalMinutes = end - start;

        if (totalMinutes >= 60) {
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
        }
        return `${totalMinutes}m`;
    }

    timeToMinutes(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    }

    formatDate(timestamp) {
        if (!timestamp) return 'N/A';

        let date;
        if (timestamp.seconds) {
            // Firestore Timestamp
            date = new Date(timestamp.seconds * 1000);
        } else {
            date = new Date(timestamp);
        }

        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Create a singleton instance
const emailService = new EmailService();
export default emailService;