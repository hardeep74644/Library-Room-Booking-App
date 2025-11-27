# Quick Setup Guide

## Prerequisites
- A modern web browser (Chrome, Firefox, Safari, or Edge)
- Internet connection (for Firebase services)

## Getting Started

### Step 1: Initial Setup
The Firebase configuration is already set up in the project. No additional Firebase configuration is needed.

### Step 2: Deploy Firestore Security Rules (Optional but Recommended)
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login to Firebase: `firebase login`
3. Initialize Firebase in the project: `firebase init firestore`
   - Select "Use an existing project"
   - Choose "library-room-booking"
   - Use the existing `firestore.rules` file
4. Deploy rules: `firebase deploy --only firestore:rules`

### Step 3: Initialize the Database
1. Create a librarian account first (see Step 4)
2. Log in to the admin dashboard with the librarian account
3. Navigate to the "Rooms" tab
4. Use the "Add Room" button to create study rooms for your library

### Step 4: Create Test Accounts
Create at least one student and one librarian account:

**Student Account:**
1. Navigate to `register.html`
2. Fill in:
   - Name: Test Student
   - Email: student@test.com
   - Password: student123
   - Role: Student
3. Click Register

**Librarian Account:**
1. Navigate to `register.html`
2. Fill in:
   - Name: Test Librarian
   - Email: librarian@test.com
   - Password: librarian123
   - Role: Librarian
3. Click Register

### Step 5: Start Using the Application

**For Students:**
1. Login at `login.html`
2. You'll be redirected to the Student Dashboard
3. Select room capacity (2 or 4 people)
4. Choose date and time
5. Click "Search Available Rooms"
6. Book an available room
7. View and manage your booking in "My Current Booking"

**For Librarians:**
1. Login at `login.html`
2. You'll be redirected to the Librarian Dashboard
3. Use the tabs to:
   - **Manage Rooms**: Add or delete rooms
   - **Manage Reservations**: View and cancel reservations
   - **Manage Students**: View users and change roles

## Running Locally

### Option 1: Python HTTP Server
```bash
cd Library-Room-Booking-App
python3 -m http.server 8000
```
Then navigate to: http://localhost:8000

### Option 2: Node.js HTTP Server
```bash
cd Library-Room-Booking-App
npx http-server
```
Then navigate to: http://localhost:8080

### Option 3: PHP Built-in Server
```bash
cd Library-Room-Booking-App
php -S localhost:8000
```
Then navigate to: http://localhost:8000

## Features Overview

### Student Features
- ✅ Search rooms by capacity (2 or 4 people)
- ✅ Filter by date and time
- ✅ Search by room number
- ✅ Select booking duration (30min, 1hr, 1.5hr, 2hr)
- ✅ View real-time availability
- ✅ Make reservations
- ✅ View active bookings
- ✅ Cancel bookings
- ✅ One active booking limit per student

### Librarian Features
- ✅ Add new rooms
- ✅ Delete rooms (if no active bookings)
- ✅ View all reservations
- ✅ Filter reservations by status
- ✅ Cancel any reservation
- ✅ View all registered users
- ✅ Change user roles

### System Features
- ✅ Secure authentication
- ✅ Role-based access control
- ✅ Overlap prevention
- ✅ Past date validation
- ✅ Real-time data updates

## Troubleshooting

### "Failed to load resource: net::ERR_BLOCKED_BY_CLIENT"
This is a browser ad-blocker or privacy extension blocking Firebase CDN resources. You can safely ignore this in development, or temporarily disable ad-blockers for localhost.

### Cannot login after registration
Make sure you're using the correct email and password. Passwords must be at least 6 characters.

### Rooms not showing up
1. Make sure you've added rooms through the admin dashboard
2. Check browser console for any Firebase errors
3. Ensure you're logged in with a valid account

### Bookings not saving
1. Check that you're logged in
2. Ensure you've selected both date and time
3. Verify the date is not in the past
4. Check that you don't already have an active booking

## Support

For issues or questions, please check:
1. Browser console for error messages
2. Firebase console for database status
3. README.md for detailed documentation
