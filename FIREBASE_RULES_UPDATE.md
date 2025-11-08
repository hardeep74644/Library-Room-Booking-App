# How to Update Firebase Firestore Security Rules

## The Issue
The current Firestore security rules don't allow librarians to delete users, which is why you're getting the "Failed to delete user" error.

## Solution
I've updated the `firestore.rules` file to include delete permissions for librarians.

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

## Updated Rule Change
The key change in the users collection rule:

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
2. Try deleting a user from the admin dashboard
3. Check the browser console (F12) for any error messages
4. The delete operation should now work successfully

## What These Rules Allow
- **Students**: Can only read/create their own user document
- **Librarians**: Can read all users, update user data, and delete users
- **Security**: Prevents unauthorized access and modifications

---

**Note**: Make sure to deploy these rules to Firebase before testing the delete functionality!