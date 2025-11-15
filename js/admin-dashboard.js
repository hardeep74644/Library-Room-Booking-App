// Admin Dashboard functionality - v3.0 (All Day Availability)
console.log('Admin Dashboard v3.0 loaded - All Day Availability Enabled');
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    doc,
    setDoc,
    query,
    where,
    deleteDoc,
    updateDoc,
    orderBy,
    Timestamp
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

let currentUser = null;

// Check authentication
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;

        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const userData = userDoc.data();

            if (!userData) {
                // If user document doesn't exist, create it with default role
                await setDoc(doc(db, 'users', user.uid), {
                    name: user.displayName || user.email,
                    email: user.email,
                    role: 'student', // Default to student, admin can change later
                    createdAt: new Date().toISOString()
                });
                alert('This account is not set up as a librarian. Please contact an administrator.');
                window.location.href = 'dashboardStudent.html';
                return;
            }

            // Update welcome message
            const nameElement = document.querySelector('.user-info strong');
            if (nameElement) {
                nameElement.textContent = userData?.name || user.email;
            }

            // Check if user is a librarian
            if (userData?.role !== 'librarian') {
                alert('Access denied. This page is for librarians only.');
                window.location.href = 'dashboardStudent.html';
                return;
            }

            // Load initial data
            loadRooms();
            loadReservations();
            loadStudents();
        } catch (error) {
            console.error('Error loading user data:', error);
            alert('Error loading user data. Please try refreshing the page.');
        }
    } else {
        console.log('No user authenticated, redirecting to login');
        window.location.href = 'login.html';
    }
});

// Tab switching
window.showTab = function (tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(`${tabName}-tab`).classList.add('active');

    // Activate button
    event.target.classList.add('active');
};

// Load all rooms
async function loadRooms() {
    try {
        console.log('Loading rooms...');
        const roomsRef = collection(db, 'rooms');
        const snapshot = await getDocs(roomsRef);
        const roomsTable = document.getElementById('rooms-table');

        if (snapshot.empty) {
            roomsTable.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #999;">No rooms found. Add your first room!</td></tr>';
            return;
        }

        roomsTable.innerHTML = '';
        console.log(`Found ${snapshot.size} rooms`);

        snapshot.forEach(doc => {
            const room = doc.data();
            const schedule = room.schedule || {};

            const availableDates = schedule.startDate && schedule.endDate
                ? `${schedule.startDate} to ${schedule.endDate}`
                : 'Not set';

            console.log(`Creating row for room ${room.number} with schedule:`, schedule);

            const row = document.createElement('tr');

            row.innerHTML = `
                <td>Room ${room.number}</td>
                <td>Floor ${room.floor}</td>
                <td>${room.capacity} people</td>
                <td><span style="font-size: 0.9em;">${availableDates}</span></td>
                <td><span class="available-badge available">Active</span></td>
                <td>
                    <button class="btn-secondary" onclick="showRoomScheduleModal('${doc.id}', '${room.number}')" style="margin-right: 5px; font-size: 0.85em;">Schedule</button>
                    <button class="btn-danger" onclick="deleteRoom('${doc.id}', '${room.number}')" style="font-size: 0.85em;">Delete</button>
                </td>
            `;

            roomsTable.appendChild(row);
        });

        console.log('Rooms loaded successfully');

    } catch (error) {
        console.error('Error loading rooms:', error);
    }
}

// Test function to help debug filter issues
window.testFilterFunction = async function () {
    console.log('=== Filter Test Started ===');

    const filterSelect = document.getElementById('reservation-filter');
    if (!filterSelect) {
        console.error('Filter dropdown not found!');
        alert('Filter dropdown not found!');
        return;
    }

    console.log('Current filter value:', filterSelect.value);
    console.log('Available options:', Array.from(filterSelect.options).map(opt => opt.value));

    // Test all filter options
    const testFilters = ['all', 'active', 'cancelled', 'completed'];

    for (const testFilter of testFilters) {
        console.log(`\n--- Testing filter: ${testFilter} ---`);
        filterSelect.value = testFilter;

        try {
            const bookingsRef = collection(db, 'bookings');
            let q;

            if (testFilter === 'all') {
                q = query(bookingsRef);
            } else {
                q = query(bookingsRef, where('status', '==', testFilter));
            }

            const snapshot = await getDocs(q);
            console.log(`Found ${snapshot.size} bookings for filter '${testFilter}'`);

            if (snapshot.size > 0) {
                snapshot.forEach(doc => {
                    const data = doc.data();
                    console.log(`  - Booking ${doc.id}: status=${data.status}, room=${data.roomNumber}, date=${data.date}`);
                });
            }

        } catch (error) {
            console.error(`Error testing filter '${testFilter}':`, error);
        }
    }

    console.log('=== Filter Test Completed ===');
    alert('Filter test completed. Check console for results.');
};

// Load all reservations
window.loadReservations = async function () {
    try {
        const filter = document.getElementById('reservation-filter')?.value || 'all';
        console.log('Loading reservations with filter:', filter);

        const bookingsRef = collection(db, 'bookings');
        const reservationsTable = document.getElementById('reservations-table');

        // Show loading state
        reservationsTable.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #666;">Loading reservations...</td></tr>';

        let snapshot;

        try {
            let q;
            if (filter === 'all') {
                // Get all bookings, ordered by creation date
                q = query(bookingsRef, orderBy('createdAt', 'desc'));
            } else {
                // Try the filtered query with ordering first
                q = query(bookingsRef, where('status', '==', filter), orderBy('createdAt', 'desc'));
            }

            snapshot = await getDocs(q);
        } catch (indexError) {
            console.log('Index not available for filtered query, falling back to unordered query');

            // Fallback: Use simpler query without ordering if index doesn't exist
            let fallbackQuery;
            if (filter === 'all') {
                fallbackQuery = query(bookingsRef);
            } else {
                fallbackQuery = query(bookingsRef, where('status', '==', filter));
            }

            snapshot = await getDocs(fallbackQuery);
        }

        if (snapshot.empty) {
            const message = filter === 'all' ? 'No reservations found' : `No ${filter} reservations found`;
            reservationsTable.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #999;">${message}</td></tr>`;
            return;
        }

        // Convert to array for client-side sorting if needed
        const bookings = [];
        for (const bookingDoc of snapshot.docs) {
            const booking = bookingDoc.data();
            bookings.push({ id: bookingDoc.id, ...booking });
        }

        // Sort by creation date (newest first) on client side if Firebase ordering failed
        bookings.sort((a, b) => {
            if (a.createdAt && b.createdAt) {
                return b.createdAt.toMillis() - a.createdAt.toMillis();
            }
            // Fallback to date comparison if createdAt is missing
            if (a.date && b.date) {
                return new Date(b.date) - new Date(a.date);
            }
            return 0;
        });

        reservationsTable.innerHTML = '';

        for (const booking of bookings) {
            // Get user details
            try {
                const userDoc = await getDoc(doc(db, 'users', booking.userId));
                const userData = userDoc.data();

                const row = document.createElement('tr');

                // Determine status display
                let statusDisplay = 'Unknown';
                let statusClass = booking.status;

                switch (booking.status) {
                    case 'active':
                        statusDisplay = 'Active';
                        break;
                    case 'cancelled':
                        statusDisplay = 'Cancelled';
                        break;
                    case 'completed':
                        statusDisplay = 'Completed';
                        break;
                    default:
                        statusDisplay = booking.status || 'Unknown';
                }

                row.innerHTML = `
                    <td>${userData?.name || 'Unknown'}</td>
                    <td>Room ${booking.roomNumber}</td>
                    <td>${booking.date}</td>
                    <td>${booking.startTime} - ${booking.endTime}</td>
                    <td><span class="status-${statusClass}">${statusDisplay}</span></td>
                    <td>
                        ${booking.status === 'active' ?
                        `<button class="btn-danger" onclick="cancelReservation('${booking.id}')">Cancel</button>` :
                        '<span style="color: #999;">-</span>'}
                    </td>
                `;

                reservationsTable.appendChild(row);
            } catch (userError) {
                console.error('Error loading user data for booking:', booking.id, userError);

                // Still show the booking even if user data fails to load
                const row = document.createElement('tr');

                let statusDisplay = 'Unknown';
                let statusClass = booking.status;

                switch (booking.status) {
                    case 'active':
                        statusDisplay = 'Active';
                        break;
                    case 'cancelled':
                        statusDisplay = 'Cancelled';
                        break;
                    case 'completed':
                        statusDisplay = 'Completed';
                        break;
                    default:
                        statusDisplay = booking.status || 'Unknown';
                }

                row.innerHTML = `
                    <td>Unknown User</td>
                    <td>Room ${booking.roomNumber}</td>
                    <td>${booking.date}</td>
                    <td>${booking.startTime} - ${booking.endTime}</td>
                    <td><span class="status-${statusClass}">${statusDisplay}</span></td>
                    <td>
                        ${booking.status === 'active' ?
                        `<button class="btn-danger" onclick="cancelReservation('${booking.id}')">Cancel</button>` :
                        '<span style="color: #999;">-</span>'}
                    </td>
                `;

                reservationsTable.appendChild(row);
            }
        }

    } catch (error) {
        console.error('Error loading reservations:', error);

        const reservationsTable = document.getElementById('reservations-table');
        reservationsTable.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: #dc3545;">
                    Error loading reservations: ${error.message}<br>
                    <small>Check console for details. Try refreshing the page.</small>
                </td>
            </tr>
        `;
    }
};

// Load all students
async function loadStudents() {
    try {
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);
        const studentsTable = document.getElementById('students-table');

        if (snapshot.empty) {
            studentsTable.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #999;">No users found</td></tr>';
            return;
        }

        studentsTable.innerHTML = '';

        snapshot.forEach(doc => {
            const user = doc.data();
            const isCurrentUser = currentUser && currentUser.uid === doc.id;
            const row = document.createElement('tr');

            row.innerHTML = `
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td><span style="padding: 4px 12px; background: ${user.role === 'librarian' ? '#d4edda' : '#cce5ff'}; border-radius: 12px; font-size: 0.85rem;">${user.role}</span></td>
                <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                    ${isCurrentUser ?
                    '<span style="color: #999; font-style: italic;">Current User</span>' :
                    `<button class="btn-danger" onclick="deleteUser('${doc.id}', '${user.name}', '${user.email}')">Delete User</button>`}
                </td>
            `;

            studentsTable.appendChild(row);
        });

    } catch (error) {
        console.error('Error loading students:', error);
    }
}

// Show add room modal
window.showAddRoomModal = function () {
    document.getElementById('add-room-modal').style.display = 'block';
};

// Close add room modal
window.closeAddRoomModal = function () {
    document.getElementById('add-room-modal').style.display = 'none';
    document.getElementById('add-room-form').reset();
};

// Show room schedule modal
window.showRoomScheduleModal = async function (roomId, roomNumber) {
    console.log(`Opening schedule modal for room ${roomNumber} (ID: ${roomId})`);

    const modal = document.getElementById('room-schedule-modal');
    if (!modal) {
        console.error('Schedule modal not found in DOM');
        alert('Schedule modal not found. Please refresh the page.');
        return;
    }

    modal.style.display = 'block';
    document.getElementById('schedule-room-name').textContent = `Room ${roomNumber}`;

    // Set minimum date to today for new schedules
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('schedule-start-date').min = today;
    document.getElementById('schedule-end-date').min = today;

    // Store current room ID for later use
    window.currentScheduleRoomId = roomId;

    // Load existing schedule if any
    try {
        const roomDoc = await getDoc(doc(db, 'rooms', roomId));
        const roomData = roomDoc.data();
        const schedule = roomData.schedule || {};

        console.log('Existing schedule:', schedule);

        // Set date range values
        document.getElementById('schedule-start-date').value = schedule.startDate || '';
        document.getElementById('schedule-end-date').value = schedule.endDate || '';

        // Update end date minimum when start date changes
        document.getElementById('schedule-start-date').addEventListener('change', function () {
            document.getElementById('schedule-end-date').min = this.value;
        });

    } catch (error) {
        console.error('Error loading room schedule:', error);
        alert('Error loading room schedule: ' + error.message);
    }
};

// Close room schedule modal
window.closeRoomScheduleModal = function () {
    document.getElementById('room-schedule-modal').style.display = 'none';
    document.getElementById('room-schedule-form').reset();
    window.currentScheduleRoomId = null;
};

// Add new room
document.addEventListener('DOMContentLoaded', () => {
    const addRoomForm = document.getElementById('add-room-form');

    if (addRoomForm) {
        addRoomForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const roomNumber = document.getElementById('room-number').value.trim();
            const floor = parseInt(document.getElementById('room-floor').value);
            const capacity = parseInt(document.getElementById('room-capacity').value);

            try {
                // Check if room number already exists
                const roomsRef = collection(db, 'rooms');
                const q = query(roomsRef, where('number', '==', roomNumber));
                const snapshot = await getDocs(q);

                if (!snapshot.empty) {
                    alert('A room with this number already exists!');
                    return;
                }

                // Add room
                await addDoc(collection(db, 'rooms'), {
                    number: roomNumber,
                    floor: floor,
                    capacity: capacity,
                    createdAt: Timestamp.now()
                });

                alert('Room added successfully!');
                closeAddRoomModal();
                loadRooms();
            } catch (error) {
                console.error('Error adding room:', error);
                alert('Failed to add room. Please try again.');
            }
        });
    }

    // Room schedule form handler
    const scheduleForm = document.getElementById('room-schedule-form');
    if (scheduleForm) {
        scheduleForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!window.currentScheduleRoomId) {
                alert('No room selected for scheduling');
                return;
            }

            // Get date range values
            const startDate = document.getElementById('schedule-start-date').value;
            const endDate = document.getElementById('schedule-end-date').value;

            if (!startDate || !endDate) {
                alert('Please select both start and end dates');
                return;
            }

            // Validate date range
            const startDateObj = new Date(startDate);
            const endDateObj = new Date(endDate);

            if (startDateObj > endDateObj) {
                alert('End date must be after start date');
                return;
            }

            try {
                // Update room with schedule (no time restrictions - available all day)
                await updateDoc(doc(db, 'rooms', window.currentScheduleRoomId), {
                    schedule: {
                        startDate: startDate,
                        endDate: endDate,
                        // No time restrictions - rooms are available all day
                        allDay: true,
                        updatedAt: Timestamp.now()
                    }
                });

                alert('Room schedule updated successfully!');
                closeRoomScheduleModal();
                loadRooms();
            } catch (error) {
                console.error('Error updating room schedule:', error);
                alert('Failed to update room schedule. Please try again.');
            }
        });
    }
});

// Clear room schedule
window.clearRoomSchedule = async function () {
    if (!window.currentScheduleRoomId) {
        alert('No room selected');
        return;
    }

    if (!confirm('Are you sure you want to clear the schedule for this room? This will make the room unavailable for booking.')) {
        return;
    }

    try {
        await updateDoc(doc(db, 'rooms', window.currentScheduleRoomId), {
            schedule: null
        });

        alert('Room schedule cleared successfully!');
        closeRoomScheduleModal();
        loadRooms();
    } catch (error) {
        console.error('Error clearing room schedule:', error);
        alert('Failed to clear room schedule. Please try again.');
    }
};

// Delete room
window.deleteRoom = async function (roomId, roomNumber) {
    if (!confirm(`Are you sure you want to delete Room ${roomNumber}?`)) {
        return;
    }

    try {
        // Check if room has any active bookings
        const bookingsRef = collection(db, 'bookings');
        const q = query(
            bookingsRef,
            where('roomId', '==', roomId),
            where('status', '==', 'active')
        );
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            alert('Cannot delete room with active bookings. Please cancel all bookings first.');
            return;
        }

        await deleteDoc(doc(db, 'rooms', roomId));
        alert('Room deleted successfully!');
        loadRooms();
    } catch (error) {
        console.error('Error deleting room:', error);
        alert('Failed to delete room. Please try again.');
    }
};

// Cancel reservation
window.cancelReservation = async function (bookingId) {
    if (!confirm('Are you sure you want to cancel this reservation?')) {
        return;
    }

    try {
        await deleteDoc(doc(db, 'bookings', bookingId));
        alert('Reservation cancelled successfully!');
        loadReservations();
    } catch (error) {
        console.error('Error cancelling reservation:', error);
        alert('Failed to cancel reservation. Please try again.');
    }
};

// Delete user
window.deleteUser = async function (userId, userName, userEmail) {
    if (!confirm(`Are you sure you want to delete user "${userName}" (${userEmail})?\n\nThis action cannot be undone and will also delete all their bookings.`)) {
        return;
    }

    // Show loading state
    const deleteButtons = document.querySelectorAll(`button[onclick*="deleteUser('${userId}"]`);
    deleteButtons.forEach(btn => {
        btn.disabled = true;
        btn.textContent = 'Deleting...';
    });

    try {
        console.log(`Starting deletion process for user: ${userName} (${userId})`);

        // First, delete all bookings made by this user
        const bookingsRef = collection(db, 'bookings');
        const userBookingsQuery = query(bookingsRef, where('userId', '==', userId));
        const bookingsSnapshot = await getDocs(userBookingsQuery);

        console.log(`Found ${bookingsSnapshot.size} bookings for user ${userName}`);

        // Delete all user's bookings
        const deletePromises = [];
        bookingsSnapshot.forEach(bookingDoc => {
            deletePromises.push(deleteDoc(doc(db, 'bookings', bookingDoc.id)));
        });

        if (deletePromises.length > 0) {
            await Promise.all(deletePromises);
            console.log(`Successfully deleted ${deletePromises.length} bookings for user ${userName}`);
        }

        // Delete the user document
        console.log(`Attempting to delete user document for ${userName}`);
        await deleteDoc(doc(db, 'users', userId));
        console.log(`Successfully deleted user document for ${userName}`);

        alert(`User "${userName}" and all their bookings have been deleted successfully!`);
        loadStudents();

        // Also refresh reservations to reflect the changes
        loadReservations();
    } catch (error) {
        console.error('Detailed error deleting user:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);

        let errorMessage = 'Failed to delete user. ';

        // Provide specific error messages based on error type
        if (error.code === 'permission-denied') {
            errorMessage += 'Permission denied. Check Firebase security rules.';
        } else if (error.code === 'not-found') {
            errorMessage += 'User not found in database.';
        } else if (error.code === 'network-request-failed') {
            errorMessage += 'Network error. Please check your internet connection.';
        } else {
            errorMessage += `Error: ${error.message}`;
        }

        alert(errorMessage);

        // Reset button states
        deleteButtons.forEach(btn => {
            btn.disabled = false;
            btn.textContent = 'Delete User';
        });
    }
};

// Logout
window.logout = async function () {
    if (confirm('Are you sure you want to logout?')) {
        try {
            await signOut(auth);
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Logout error:', error);
            alert('Failed to logout. Please try again.');
        }
    }
};

// Close modal when clicking outside
window.onclick = function (event) {
    const addRoomModal = document.getElementById('add-room-modal');
    const scheduleModal = document.getElementById('room-schedule-modal');

    if (event.target === addRoomModal) {
        closeAddRoomModal();
    } else if (event.target === scheduleModal) {
        closeRoomScheduleModal();
    }
};

console.log('✅ Admin dashboard loaded');

// Add a test function to verify the script is working
window.testAdminDashboard = function () {
    console.log('Admin dashboard test function called');
    alert('Admin dashboard script is loaded and working!');
};

// Log when key functions are defined
console.log('showRoomScheduleModal function defined:', typeof window.showRoomScheduleModal);
console.log('loadRooms function defined:', typeof loadRooms);
console.log('deleteRoom function defined:', typeof window.deleteRoom);
