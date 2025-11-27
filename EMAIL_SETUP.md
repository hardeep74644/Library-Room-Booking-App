# Email Confirmation Setup Guide

## EmailJS Setup Instructions

### 1. Create EmailJS Account
1. Go to [https://emailjs.com/](https://emailjs.com/)
2. Sign up for a free account
3. Verify your email address

### 2. Create Email Service
1. Go to "Email Services" in your dashboard
2. Click "Add New Service"
3. Choose your email provider (Gmail, Outlook, etc.)
4. Follow the setup instructions for your provider
5. Note the **Service ID** (e.g., `service_abc123`)

### 3. Create Email Templates

#### Template 1: Booking Confirmation
**Template ID:** `template_booking_confirmation`

**Subject:** `🎉 KPU Library - Room Booking Confirmed!`

**Content:**
```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: #667eea; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .booking-details { background: white; padding: 15px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #667eea; }
        .footer { background: #333; color: white; padding: 15px; text-align: center; font-size: 0.9em; }
        .highlight { color: #667eea; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📚 {{library_name}}</h1>
        <h2>Room Booking Confirmation</h2>
    </div>
    
    <div class="content">
        <p>Dear <strong>{{to_name}}</strong>,</p>
        
        <p>Great news! Your room booking has been confirmed. Here are your booking details:</p>
        
        <div class="booking-details">
            <h3>🏢 Booking Details</h3>
            <p><strong>Room Number:</strong> <span class="highlight">{{room_number}}</span></p>
            <p><strong>Date:</strong> <span class="highlight">{{booking_date}}</span></p>
            <p><strong>Time:</strong> <span class="highlight">{{start_time}} - {{end_time}}</span></p>
            <p><strong>Duration:</strong> <span class="highlight">{{duration}}</span></p>
            <p><strong>Booking ID:</strong> <span class="highlight">{{booking_id}}</span></p>
            <p><strong>Status:</strong> <span class="highlight">{{booking_status}}</span></p>
            <p><strong>Booked on:</strong> {{created_at}}</p>
        </div>
        
        <p><strong>Important Reminders:</strong></p>
        <ul>
            <li>Please arrive on time for your booking</li>
            <li>Remember to bring your student ID</li>
            <li>You can cancel your booking through the student dashboard if needed</li>
            <li>Room bookings are available only between 9:00 AM - 9:00 PM</li>
        </ul>
        
        <p>If you have any questions, please contact the library staff.</p>
        
        <p>Happy studying!</p>
    </div>
    
    <div class="footer">
        <p>This is an automated message from {{library_name}} Room Booking System</p>
        <p>Please do not reply to this email</p>
    </div>
</body>
</html>
```

#### Template 2: Cancellation Confirmation
**Template ID:** `template_cancellation_confirmation`

**Subject:** `✅ KPU Library - Room Booking Cancelled`

**Content:**
```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .booking-details { background: white; padding: 15px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #dc3545; }
        .footer { background: #333; color: white; padding: 15px; text-align: center; font-size: 0.9em; }
        .highlight { color: #dc3545; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📚 {{library_name}}</h1>
        <h2>Room Booking Cancelled</h2>
    </div>
    
    <div class="content">
        <p>Dear <strong>{{to_name}}</strong>,</p>
        
        <p>Your room booking has been successfully cancelled. Here are the details of the cancelled booking:</p>
        
        <div class="booking-details">
            <h3>🚫 Cancelled Booking Details</h3>
            <p><strong>Room Number:</strong> <span class="highlight">{{room_number}}</span></p>
            <p><strong>Date:</strong> <span class="highlight">{{booking_date}}</span></p>
            <p><strong>Time:</strong> <span class="highlight">{{start_time}} - {{end_time}}</span></p>
            <p><strong>Duration:</strong> <span class="highlight">{{duration}}</span></p>
            <p><strong>Booking ID:</strong> <span class="highlight">{{booking_id}}</span></p>
            <p><strong>Cancelled on:</strong> {{cancelled_at}}</p>
        </div>
        
        <p><strong>What's Next?</strong></p>
        <ul>
            <li>You can now make a new booking if needed</li>
            <li>The room is now available for other students</li>
            <li>You can book another room through the student dashboard</li>
        </ul>
        
        <p>If you have any questions or need assistance with a new booking, please contact the library staff.</p>
    </div>
    
    <div class="footer">
        <p>This is an automated message from {{library_name}} Room Booking System</p>
        <p>Please do not reply to this email</p>
    </div>
</body>
</html>
```

### 4. Update Configuration
1. Copy your Service ID, Template IDs, and Public Key
2. Update the `email-service.js` file with your actual credentials:

```javascript
this.serviceID = 'your_service_id_here';
this.templateIDBooking = 'template_booking_confirmation';
this.templateIDCancellation = 'template_cancellation_confirmation';
this.publicKey = 'your_public_key_here';
```

### 5. Test Email System
1. Make a test booking
2. Check if confirmation email is received
3. Cancel the booking and check cancellation email

## Alternative: Using Firebase Functions with Nodemailer

For a more robust server-side solution, you can also use Firebase Functions:

### Setup Firebase Functions
```bash
npm install -g firebase-tools
firebase login
firebase init functions
cd functions
npm install nodemailer
```

### Function Example
```javascript
// functions/index.js
const functions = require('firebase-functions');
const nodemailer = require('nodemailer');

// Configure your email transport
const transporter = nodemailer.createTransporter({
    service: 'gmail', // or your email service
    auth: {
        user: 'your-email@gmail.com',
        pass: 'your-app-password'
    }
});

exports.sendBookingConfirmation = functions.firestore
    .document('bookings/{bookingId}')
    .onCreate(async (snap, context) => {
        const booking = snap.data();
        
        const mailOptions = {
            from: 'your-email@gmail.com',
            to: booking.userEmail,
            subject: 'Room Booking Confirmed - KPU Library',
            html: `<!-- Your HTML template here -->`
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log('Booking confirmation email sent');
        } catch (error) {
            console.error('Error sending email:', error);
        }
    });
```

## Security Considerations

1. **EmailJS Limits**: Free tier has monthly limits
2. **Rate Limiting**: Implement client-side rate limiting
3. **Email Validation**: Ensure user emails are valid
4. **Privacy**: Only send emails to verified user emails

## Testing Checklist

- [ ] EmailJS service configured correctly
- [ ] Templates created with proper variable names
- [ ] Email credentials added to email-service.js
- [ ] Booking confirmation emails working
- [ ] Cancellation confirmation emails working
- [ ] Error handling working (booking/cancellation succeeds even if email fails)
- [ ] Emails formatted correctly on mobile and desktop