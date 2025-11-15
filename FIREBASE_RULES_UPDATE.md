# How to Update Firebase Firestore Security Rules

## Recent Updates

### Booking Cancellation & Auto-Completion Fix (Latest)
**Issue**: Students cannot cancel bookings, and expired bookings don't automatically complete.
**Cause**: Security rules only allowed librarians to update bookings.
**Solution**: Updated rules to allow students to update their own bookings when setting status to 'cancelled' or 'completed'.

**New Feature**: Automatic status updates - expired bookings are automatically marked as "completed".

### User Deletion Fix (Previous)
**Issue**: The current Firestore security rules don't allow librarians to delete users.
**Solution**: Updated rules to include delete permissions for librarians.

## How to Deploy the Updated Rules

### Option 1: Using Firebase Console (Recommended)
1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `library-room-booking-63d6f`
3. Navigate to **Firestore Database** in the left sidebar
4. Click on the **Rules** tab
5. Replace the existing rules with the content from `firestore.rules` file
6. Click **Publish** to deploy the changes

### Option 2: Using Firebase CLI (if you have it installed)
1. Open terminal in your project directory
2. Run: `firebase login` (if not already logged in)
3. Run: `firebase deploy --only firestore:rules`

## Latest Rule Changes

### Bookings Collection Update (Latest)
**Before:**
```javascript
// Only librarians can update bookings
allow update: if isLibrarian();
```

**After:**
```javascript
// Students can update their own bookings (for cancellation and completion), librarians can update any
allow update: if isLibrarian() || 
                 (isSignedIn() && request.auth.uid == resource.data.userId && 
                  (request.resource.data.status == 'cancelled' || request.resource.data.status == 'completed'));
```

### Users Collection (Previous Update)
**Before:**
```javascript
// Librarians can read all users and update roles
allow read, update: if isLibrarian();
```

**After:**
```javascript
// Librarians can read all users, update roles, and delete users
allow read, update, delete: if isLibrarian();
```

## Testing After Deployment
1. Wait 30-60 seconds after deploying the rules
2. Try cancelling a booking from the student dashboard
3. Try deleting a user from the admin dashboard
4. **NEW**: Create a booking for a past time slot and refresh the dashboard to see it auto-complete
5. **NEW**: Verify that students can book again after their previous booking auto-completes
6. Check the browser console (F12) for any error messages
7. All operations should now work successfully

## What These Rules Allow

### Students:
- Read/create their own user documents
- Read/create/delete their own bookings
- **NEW**: Update their own bookings to cancel or complete them
- **AUTOMATIC**: Past bookings are automatically marked as completed

### Librarians:
- Full access to all collections (read/write/update/delete)
- Manage all bookings and users
- Create and manage rooms

### Security:
- Prevents unauthorized access and modifications
- Students can only cancel or complete their own bookings
- All other booking updates require librarian permissions
- **AUTOMATIC**: Expired bookings are auto-completed when dashboard loads

## New Feature: Automatic Booking Completion

### How it works:
1. When a student loads their dashboard, the system checks all active bookings
2. If a booking's end time has passed, it's automatically marked as "completed"
3. Students can then make new bookings (since they no longer have "active" bookings)
4. Completed bookings appear in the booking history with proper status

### Benefits:
- **No manual intervention needed** - bookings complete automatically
- **Students can book again** immediately after their previous booking expires
- **Clean data management** - clear distinction between active, cancelled, and completed bookings
- **Better user experience** - no confusion about booking availability

---

**⚠️ IMPORTANT**: Make sure to deploy these updated rules to Firebase before testing the cancellation functionality!