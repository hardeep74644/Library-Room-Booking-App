# Library-Room-Booking-App

A web-based Library Room Booking System for managing study room reservations with role-based access for students and librarians.

## Features

### User Authentication
- Secure login and registration system using Firebase Authentication
- Role-based access control (Student and Librarian roles)
- Automatic redirection based on user role after login

### Student Features
- **View Available Rooms**: Browse all study rooms with filtering capabilities
- **Search & Filter**: 
  - Filter by date and time
  - Filter by room capacity (2 or 4 people)
  - Search by room number
- **Visual Availability**: See real-time room availability
- **Make Reservations**: Book rooms for specific time slots (30 min, 1 hr, 1.5 hr, or 2 hr)
- **Booking Management**: View and cancel active bookings
- **Overlap Prevention**: System automatically prevents overlapping bookings

### Librarian Features
- **Student Management**: 
  - View all registered users
  - Change user roles (student ↔ librarian)
  - Track registration dates
- **Room Management**:
  - Add new study rooms
  - Delete existing rooms
  - Set room properties (number, floor, capacity)
- **Reservation Management**:
  - View all reservations (active and cancelled)
  - Filter reservations by status
  - Cancel reservations on behalf of students
- **Room Availability**: System automatically manages availability based on bookings

### Backend Features
- **Firebase Firestore Database** with collections for:
  - `users`: User profiles with roles
  - `rooms`: Room information (number, floor, capacity)
  - `bookings`: Reservation records with timestamps
- **Overlap Detection**: Prevents double-booking of rooms
- **Data Validation**: Ensures booking rules are enforced
- **Real-time Updates**: Changes reflect immediately across the system

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6 modules)
- **Backend**: Firebase (Firestore Database, Authentication)
- **Authentication**: Firebase Auth with email/password
- **Database**: Cloud Firestore (NoSQL)

## Project Structure

```
Library-Room-Booking-App/
├── index.html                 # Landing page
├── login.html                 # Login page
├── register.html              # Registration page
├── dashboardStudent.html      # Student dashboard
├── admin-dashboard.html       # Librarian dashboard
├── init-db.html              # Database initialization utility
├── css/
│   └── style.css             # Main stylesheet
├── js/
│   ├── firebase-config.js    # Firebase configuration
│   ├── auth.js               # Authentication logic
│   ├── student-dashboard.js  # Student dashboard functionality
│   └── admin-dashboard.js    # Librarian dashboard functionality
└── README.md
```

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/hardeep74644/Library-Room-Booking-App.git
   cd Library-Room-Booking-App
   ```

2. **Firebase Setup**
   - The project is already configured with Firebase
   - Firebase configuration is in `js/firebase-config.js`

3. **Initialize the Database**
   - Open `init-db.html` in your browser
   - Click "Initialize Sample Rooms" to add sample rooms to the database
   - This creates 6 rooms (3 with 2-person capacity, 3 with 4-person capacity)

4. **Create User Accounts**
   - Navigate to `register.html`
   - Create at least one student account and one librarian account
   - Suggested test accounts:
     - Student: `student@test.com` / `student123`
     - Librarian: `librarian@test.com` / `librarian123`

5. **Run the Application**
   - Open `index.html` in a modern web browser
   - Or use a local server (recommended):
     ```bash
     # Using Python 3
     python -m http.server 8000
     
     # Using Node.js
     npx http-server
     ```
   - Navigate to `http://localhost:8000`

## Usage Guide

### For Students

1. **Register/Login**: Create an account or login with existing credentials
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
   - Change user roles between student and librarian

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
  status: 'active' | 'cancelled',
  createdAt: timestamp
}
```

## Business Rules

1. **Booking Restrictions**:
   - Students can only have one active booking at a time
   - Cannot book rooms for past dates
   - Minimum booking duration: 30 minutes
   - Maximum booking duration: 2 hours

2. **Room Capacity**:
   - Only 2-person and 4-person rooms are supported
   - Room capacity is fixed and cannot be changed after creation

3. **Overlap Prevention**:
   - System checks for time conflicts before allowing bookings
   - Two bookings overlap if their time ranges intersect

4. **Cancellation**:
   - Students can cancel their own bookings
   - Librarians can cancel any booking
   - Rooms with active bookings cannot be deleted

## Future Enhancements

- Email notifications for booking confirmations
- Booking history (past bookings)
- Advanced filtering options
- Room amenities and features
- Multi-day booking support
- Recurring bookings
- Waitlist functionality
- Mobile responsive improvements
- Analytics dashboard for librarians

## Security Considerations

- Firebase Security Rules should be configured to:
  - Allow users to read their own data
  - Allow users to create bookings only for themselves
  - Restrict librarian operations to users with librarian role
  - Prevent unauthorized data access

## License

This project is for educational purposes.

## Contributors

- Hardeep (hardeep74644)
