# Library Room Booking App - Setup & Troubleshooting Guide

## 🚀 Quick Start

### 1. Initial Setup
1. Open your web browser and navigate to: `http://localhost:8000`
2. First, initialize the database by going to: `http://localhost:8000/init-db.html`
3. Click "Initialize Sample Rooms" to add test rooms to the database
4. Navigate to the registration page to create your first account

### 2. Create Test Accounts

#### Student Account
1. Go to: `http://localhost:8000/register.html`
2. Fill in the form:
   - **Name**: Student Test
   - **Email**: student@test.com
   - **Password**: student123
   - **Role**: Student
3. Click "Register"

#### Librarian Account
1. Go to: `http://localhost:8000/register.html`
2. Fill in the form:
   - **Name**: Librarian Test
   - **Email**: librarian@test.com
   - **Password**: librarian123
   - **Role**: Librarian
3. Click "Register"

## 🔧 Troubleshooting Common Issues

### Issue 1: "No rooms found"
**Solution**: Run the database initialization first
- Go to `http://localhost:8000/init-db.html`
- Click "Initialize Sample Rooms"

### Issue 2: Login not working
**Possible causes & solutions**:
1. **Wrong credentials**: Make sure you're using the correct email/password
2. **Account doesn't exist**: Create an account first via registration
3. **Network issues**: Check your internet connection
4. **Server not running**: Make sure the local server is running on port 8000

### Issue 3: Registration fails
**Possible causes & solutions**:
1. **Email already exists**: Try a different email address
2. **Weak password**: Use at least 6 characters
3. **Missing fields**: Fill in all required fields

### Issue 4: Booking fails
**Possible causes & solutions**:
1. **No rooms available**: Try a different time or date
2. **Already have active booking**: Students can only have one active booking
3. **Past date selected**: Cannot book rooms for past dates

### Issue 5: Firebase errors
**Solution**: Check the debug page
- Go to `http://localhost:8000/debug-test.html`
- Click all test buttons to diagnose issues

## 📝 How to Use the App

### For Students:
1. **Login** with your student account
2. **Select room capacity** (2 or 4 people)
3. **Choose date and time** for your booking
4. **Search for available rooms**
5. **Book your preferred room**
6. **View/cancel your booking** in "My Current Booking" section

### For Librarians:
1. **Login** with your librarian account
2. **Manage Rooms**: Add/delete study rooms
3. **Manage Reservations**: View and cancel student bookings
4. **Manage Students**: View registered users and change roles

## 🔍 Testing the App

### Quick Test Checklist:
- [ ] Server is running on `http://localhost:8000`
- [ ] Database initialized with sample rooms
- [ ] Can register new accounts
- [ ] Can login with existing accounts
- [ ] Students can search and book rooms
- [ ] Librarians can manage rooms and reservations
- [ ] Logout works properly

### Debug Tools:
- **Debug page**: `http://localhost:8000/debug-test.html` - Test Firebase connectivity
- **Init page**: `http://localhost:8000/init-db.html` - Initialize database
- **Browser console**: Press F12 to view error messages

## 🆘 Still Having Issues?

1. **Check the browser console** (F12) for error messages
2. **Make sure you're accessing via localhost** (not file://)
3. **Verify Firebase is working** using the debug test page
4. **Clear browser cache** and try again
5. **Check your internet connection** for Firebase connectivity

## 📋 App Features

### Student Features:
- ✅ Secure authentication
- ✅ Search rooms by capacity (2 or 4 people)
- ✅ Filter by date and time
- ✅ Real-time availability checking
- ✅ Book available rooms
- ✅ View current booking
- ✅ Cancel bookings
- ✅ One active booking limit

### Librarian Features:
- ✅ Admin dashboard
- ✅ Add/remove study rooms
- ✅ View all reservations
- ✅ Cancel student bookings
- ✅ Manage user accounts
- ✅ Role management

### System Features:
- ✅ Role-based access control
- ✅ Conflict prevention
- ✅ Real-time updates
- ✅ Responsive design
- ✅ Error handling

---

**Need help?** Check the debug test page or browser console for specific error messages.