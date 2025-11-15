# Library-Room-Booking-App

A production-ready web-based Library Room Booking System for managing study room reservations with role-based access for students and librarians.

## Features

### User Authentication
- Secure login and registration system using Firebase Authentication
- Role-based access control (Student and Librarian roles)
- Automatic redirection based on user role after login
- Consistent navigation across all pages

### Student Features
- **View Available Rooms**: Browse all study rooms with filtering capabilities
- **Search & Filter**: 
  - Filter by date and time
  - Filter by room capacity (2 or 4 people)
  - Search by room number
- **Visual Availability**: See real-time room availability
- **Make Reservations**: Book rooms for specific time slots (30 min, 1 hr, 1.5 hr, or 2 hr)
- **Booking Management**: View active, cancelled, and completed bookings
- **Booking History**: Track past reservations with status updates
- **Overlap Prevention**: System automatically prevents overlapping bookings
- **Time Restrictions**: Booking only available between 9:00 AM - 9:00 PM

### Librarian Features
- **Student Management**: 
  - View all registered users
  - Change user roles (promote students to librarians)
  - Delete user accounts (with all associated bookings)
  - Track registration dates
- **Room Management**:
  - Add new study rooms with scheduling
  - Set room availability date ranges
  - Delete existing rooms (only if no active bookings)
  - Set room properties (number, floor, capacity)
- **Reservation Management**:
  - View all reservations with advanced filtering
  - Filter by status: active, completed, cancelled
  - Cancel reservations on behalf of students
  - Manage booking conflicts
- **Room Scheduling**: Set availability date ranges for rooms (all-day availability)

### Backend Features
- **Firebase Firestore Database** with collections for:
  - `users`: User profiles with roles and creation timestamps
  - `rooms`: Room information with availability schedules
  - `bookings`: Reservation records with status tracking
- **Advanced Status Management**: Automatic transition from active → completed for expired bookings
- **Overlap Detection**: Prevents double-booking with real-time conflict checking
- **Data Validation**: Comprehensive booking rule enforcement
- **Real-time Updates**: Changes reflect immediately across the system

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6 modules)
- **Backend**: Firebase (Firestore Database, Authentication)
- **Authentication**: Firebase Auth with email/password
- **Database**: Cloud Firestore (NoSQL)

## Project Structure

```
Library-Room-Booking-App/
├── index.html                 # Landing page with navigation
├── login.html                 # Login page with navigation
├── register.html              # Registration page with navigation
├── dashboardStudent.html      # Student dashboard
├── admin-dashboard.html       # Librarian dashboard
├── init-db.html              # Database initialization utility (admin use only)
├── css/
│   └── style.css             # Main stylesheet with responsive design
├── js/
│   ├── firebase-config.js    # Firebase configuration
│   ├── auth.js               # Authentication logic
│   ├── student-dashboard.js  # Student dashboard functionality
│   └── admin-dashboard.js    # Librarian dashboard functionality
├── Documentation/
│   ├── TROUBLESHOOTING.md    # Deployment troubleshooting guide
│   └── BOOKING_ISSUES_DIAGNOSIS.md  # Operational support guide
└── README.md
```

## Production Deployment

This system is production-ready with all debug functionality removed:

### ✅ **Production Features:**
- Clean, professional user interface
- No debug buttons or test functions
- Optimized performance without debug logging
- Secure role-based access control
- Consistent navigation across all pages

### 🚀 **Deployment Instructions:**

1. **Clone the repository**
   ```bash
   git clone https://github.com/hardeep74644/Library-Room-Booking-App.git
   cd Library-Room-Booking-App
   ```

2. **Firebase Setup**
   - The project is configured with Firebase
   - Update Firebase configuration in `js/firebase-config.js` for your environment
   - Deploy Firebase Security Rules from `firestore.rules`

3. **Initialize the Database** (Admin Setup)
   - Open `init-db.html` in your browser (admin access only)
   - Click "Initialize Sample Rooms" to add sample rooms to the database
   - Create initial librarian account manually in Firebase Console

4. **Deploy to Web Server**
   ```bash
   # For local testing
   python -m http.server 8000
   
   # For production deployment
   # Upload all files to your web hosting service
   # Ensure HTTPS is enabled for Firebase authentication
   ```

## Setup Instructions

### Initial Admin Setup

1. **Create Initial Librarian Account:**
   - Use Firebase Console to manually create the first librarian account
   - Set the user's role field to 'librarian' in Firestore
   - Suggested initial account: `admin@yourlibrary.com`

2. **Initialize Sample Data:**
   - Access `init-db.html` (restrict this file in production)
   - Add sample rooms or create rooms through the admin dashboard

### For End Users

1. **Student Registration:**
   - Students can register directly through the registration page
   - All new registrations automatically create student accounts
   - No role selection available for security

2. **Librarian Account Creation:**
   - Only existing librarians can promote students to librarian role
   - Use "Manage Users" section in admin dashboard
   - Cannot create librarian accounts through public registration

## Usage Guide

### For Students

1. **Register/Login**: Create a student account through the registration page or login with existing credentials
2. **Search for Rooms**:
   - Select desired capacity (2 or 4 people)
   - Choose date and time
   - Select duration
   - Optionally search by room number
   - Click "Search Available Rooms"
3. **Book a Room**: Click "Book Now" on any available room
4. **Manage Bookings**: View active bookings in "My Current Booking" section
5. **Cancel Booking**: Click "Cancel" button to cancel a reservation

### For Librarians

**Note**: Librarian accounts cannot be created through the registration page. They must be created manually in Firebase Console or by existing admin users through the admin dashboard.

1. **Login**: Use librarian credentials to access admin dashboard
2. **Manage Rooms** (Rooms Tab):
   - View all existing rooms
   - Add new rooms with room number, floor, and capacity
   - Delete rooms (only if no active bookings)
3. **Manage Reservations** (Reservations Tab):
   - View all bookings (filter by status)
   - Cancel reservations if needed
4. **Manage Students** (Students Tab):
   - View all registered users
   - Change user roles between student and librarian (promote students to librarians)

## Database Schema

### Users Collection
```javascript
{
  name: string,
  email: string,
  role: 'student' | 'librarian',
  createdAt: timestamp
}
```

### Rooms Collection
```javascript
{
  number: string,      // e.g., "R101"
  floor: number,       // e.g., 1, 2, 3
  capacity: number,    // 2 or 4
  createdAt: timestamp
}
```

### Bookings Collection
```javascript
{
  userId: string,
  roomId: string,
  roomNumber: string,
  date: string,        // YYYY-MM-DD format
  startTime: string,   // HH:MM format
  endTime: string,     // HH:MM format
  status: 'active' | 'cancelled' | 'completed',
  createdAt: timestamp
}
```

## Business Rules

1. **Booking Restrictions**:
   - Students can only have one active booking at a time
   - Cannot book rooms for past dates
   - Booking only available between 9:00 AM - 9:00 PM
   - Minimum booking duration: 30 minutes
   - Maximum booking duration: 2 hours

2. **Room Capacity**:
   - Only 2-person and 4-person rooms are supported
   - Room capacity is fixed and cannot be changed after creation

3. **Room Availability**:
   - Librarians must set date ranges for room availability
   - Rooms are available all day within the set date range
   - Specific time slots become unavailable only when booked

4. **Booking Status Management**:
   - **Active**: Current valid bookings
   - **Completed**: Automatically set when booking time has passed
   - **Cancelled**: Manually cancelled by user or librarian

5. **Overlap Prevention**:
   - System checks for time conflicts before allowing bookings
   - Two bookings overlap if their time ranges intersect
   - Real-time availability checking prevents race conditions

6. **Cancellation & Deletion**:
   - Students can cancel their own active bookings
   - Librarians can cancel any booking
   - Rooms with active bookings cannot be deleted
   - User deletion removes user and all associated bookings

## Security Features

### Authentication & Authorization
- Firebase Authentication with email/password
- Role-based access control (student/librarian)
- Automatic role verification on page access
- No public librarian account creation

### Data Protection
- Firebase Security Rules enforce data access permissions
- Users can only access their own booking data
- Librarians have elevated permissions for management tasks
- Secure Firebase configuration

### Production Security
- No debug functions exposed to end users
- No test interfaces in production environment
- Database initialization tools restricted to admin access
- Clean error handling without exposing system details

## Future Enhancements

- Email notifications for booking confirmations and reminders
- Advanced analytics dashboard for librarians
- Mobile app development
- Multi-location support for different library branches
- Integration with library card systems
- Room amenities and equipment booking
- Multi-day booking support
- Recurring bookings for regular events
- Waitlist functionality for popular rooms
- Calendar integration (Google Calendar, Outlook)
- SMS notifications
- Barcode/QR code check-in system

## Browser Compatibility

- **Recommended**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Required**: ES6 module support, Firebase SDK compatibility
- **Mobile**: Responsive design works on tablets and smartphones
- **HTTPS**: Required for Firebase authentication in production

## Performance Considerations

- **Database Queries**: Optimized with proper indexing
- **Real-time Updates**: Efficient Firebase listeners
- **Client-side Validation**: Reduces server load
- **Responsive Images**: Optimized for different screen sizes
- **Minimal Dependencies**: Pure JavaScript with Firebase only

## Support & Documentation

- **Troubleshooting**: See `TROUBLESHOOTING.md` for common issues
- **Booking Issues**: See `BOOKING_ISSUES_DIAGNOSIS.md` for operational problems
- **Firebase Setup**: Detailed configuration instructions in setup section
- **Security Rules**: Pre-configured Firestore security rules included

## Version History

- **v1.0** - Initial release with basic booking functionality
- **v2.0** - Added room scheduling and advanced booking status management
- **v3.0** - Production-ready release with debug removal and enhanced security

## License

This project is for educational and library management purposes.

## Contributors

- **Hardeep** (hardeep74644) - Lead Developer & Project Maintainer

---

**Note**: This is a production-ready system suitable for deployment in real library environments. All debug and testing functionality has been removed for security and performance optimization.
