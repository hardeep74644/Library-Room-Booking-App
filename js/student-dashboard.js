// Student Dashboard functionality
import { auth, db } from './firebase-config.js';
import { User, Room, Booking, BookingManager } from './models.js';
import { TimeUtils, DateUtils, UIUtils, ValidationUtils, ErrorUtils } from './utils.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    doc,
    setDoc,
    updateDoc,
    query,
    where,
    deleteDoc,
    Timestamp,
    orderBy
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { User, Room, Booking, BookingManager } from './models.js';

let currentUser = null;
let currentUserModel = null;
let bookingManager = new BookingManager();
let selectedCapacity = 2;
let selectedRoom = null;

// Check authentication
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        console.log('✅ User authenticated:', user.email);

        try {
            // Try to load existing user from database
            currentUserModel = await User.loadFromDatabase(user.uid);

            if (!currentUserModel) {
                console.log('⚠️ User document not found, creating default student profile...');
                // Create new User model instance with default student role
                currentUserModel = new User(user.uid, user.email, user.displayName || user.email, 'student');

                // Save to database
                const success = await currentUserModel.saveToDatabase();
                if (!success) {
                    throw new Error('Failed to create user profile');
                }
                console.log('✅ Created user document with student role');
            }

            console.log('👤 User data:', currentUserModel);

            // Update welcome message
            const nameElement = document.querySelector('.user-info strong');
            if (nameElement) {
                nameElement.textContent = currentUserModel.name;
            }

            // Check if user is a student
            if (!currentUserModel.isStudent()) {
                console.log('❌ Access denied - user role:', currentUserModel.role);
                alert('Access denied. This page is for students only.');
                window.location.href = 'admin-dashboard.html';
                return;
            }

            console.log('✅ Student access confirmed, loading bookings...');

            // Set user in booking manager
            bookingManager.setUser(currentUserModel);

            // Load user's bookings
            loadMyBookings();

            // Set minimum date for booking to today
            setMinimumBookingDate();
        } catch (error) {
            console.error('❌ Error loading user data:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);

            // Show user-friendly error
            const nameElement = document.querySelector('.user-info strong');
            if (nameElement) {
                nameElement.textContent = 'Error loading user data';
            }

            // Try to load bookings anyway for testing
            console.log('⚠️ Attempting to load bookings despite user data error...');
            setTimeout(() => {
                loadMyBookings();
            }, 1000);
        }
    } else {
        console.log('❌ No user authenticated, redirecting to login');
        window.location.href = 'login.html';
    }
});

// Set minimum date for booking to today
function setMinimumBookingDate() {
    const today = DateUtils.getTodayDate();
    const bookingDateInput = document.getElementById('booking-date');
    if (bookingDateInput) {
        bookingDateInput.min = today;
        bookingDateInput.value = today; // Set default to today
    }
}

// Select capacity
window.selectCapacity = function (capacity) {
    selectedCapacity = capacity;

    // Update button styles
    document.querySelectorAll('.capacity-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`cap-${capacity}`).classList.add('active');
};

// Search available rooms
window.searchAvailableRooms = async function () {
    const date = document.getElementById('booking-date').value;
    const startTime = document.getElementById('start-time').value;
    const duration = document.getElementById('duration').value;
    const roomSearch = document.getElementById('room-search').value.trim();

    if (!date || !startTime) {
        alert('Please select both date and time');
        return;
    }

    // Validate date is not in the past
    if (DateUtils.isPastDate(date)) {
        alert('Cannot book rooms for past dates');
        return;
    }

    // Check if booking time is within allowed hours (9am - 9pm)
    const endTime = TimeUtils.calculateEndTime(startTime, duration);

    if (!TimeUtils.validateBookingHours(startTime, endTime)) {
        alert(TimeUtils.getBookingHoursMessage(startTime, endTime));
        return;
    }

    try {
        // Calculate end time based on duration
        const endTime = calculateEndTime(startTime, duration);

        // Get all rooms with matching capacity using Room model
        const allRooms = await Room.getRoomsByCapacity(selectedCapacity);
        const rooms = [];

        for (const room of allRooms) {
            // Check if room number matches search (if provided)
            if (roomSearch && !room.number.toLowerCase().includes(roomSearch.toLowerCase())) {
                continue;
            }

            // Check availability
            const isAvailable = await checkRoomAvailability(room.id, date, startTime, endTime);

            rooms.push({
                id: room.id,
                number: room.number,
                capacity: room.capacity,
                floor: room.floor,
                available: isAvailable
            });
        }

        displayAvailableRooms(roomResults, date, startTime, endTime);
    } catch (error) {
        console.error('Error searching rooms:', error);
        alert('Error searching for rooms. Please try again.');
    }
};

// Time calculation functions moved to utils.js

// Check if room is available at the specified time
// Check if room is available at the specified time
async function checkRoomAvailability(roomId, date, startTime, endTime) {
    try {
        // Load room using Room model
        const room = await Room.loadFromDatabase(roomId);

        if (!room) {
            console.log(`Room with ID ${roomId} not found`);
            return false;
        }

        const schedule = room.schedule;

        console.log(`Checking availability for Room ${room.number}:`, {
            requestedDate: date,
            requestedTime: `${startTime} - ${endTime}`,
            schedule: room.schedule
        });

        if (schedule) {
            // Check if schedule has the new date range format
            if (!schedule.startDate || !schedule.endDate) {
                console.log(`Room ${room.number} has old schedule format or missing date range:`, schedule);
                return false;
            }

            // Check if the requested date is within the available date range
            const requestedDate = new Date(date);
            const scheduleStartDate = new Date(schedule.startDate);
            const scheduleEndDate = new Date(schedule.endDate);

            // Ensure all dates are valid
            if (isNaN(requestedDate.getTime()) || isNaN(scheduleStartDate.getTime()) || isNaN(scheduleEndDate.getTime())) {
                console.log(`Room ${room.number} has invalid date format:`, {
                    requestedDate: date,
                    scheduleStartDate: schedule.startDate,
                    scheduleEndDate: schedule.endDate
                });
                return false;
            }

            console.log(`Date comparison for Room ${room.number}:`, {
                requestedDate: requestedDate.toDateString(),
                scheduleStartDate: scheduleStartDate.toDateString(),
                scheduleEndDate: scheduleEndDate.toDateString(),
                requestedDateISO: requestedDate.toISOString(),
                scheduleStartDateISO: scheduleStartDate.toISOString(),
                scheduleEndDateISO: scheduleEndDate.toISOString(),
                withinRange: requestedDate >= scheduleStartDate && requestedDate <= scheduleEndDate
            });

            // Use date comparison (not time comparison)
            const requestedDateOnly = new Date(requestedDate.getFullYear(), requestedDate.getMonth(), requestedDate.getDate());
            const startDateOnly = new Date(scheduleStartDate.getFullYear(), scheduleStartDate.getMonth(), scheduleStartDate.getDate());
            const endDateOnly = new Date(scheduleEndDate.getFullYear(), scheduleEndDate.getMonth(), scheduleEndDate.getDate());

            if (requestedDateOnly < startDateOnly || requestedDateOnly > endDateOnly) {
                console.log(`Room ${room.number} not available on ${date} (available from ${schedule.startDate} to ${schedule.endDate})`);
                return false;
            }

            // Rooms are available all day within the date range - no time restrictions from schedule
            console.log(`Room ${room.number} is within available date range - checking for booking conflicts`);
        } else {
            // If no schedule is set, room is not available
            console.log(`Room ${room.number} has no schedule set - please ask librarian to set availability`);
            return false;
        }

        console.log(`Room ${room.number} is within available date range - checking for booking conflicts`);

        // Check for actual booking conflicts (this is the main availability constraint now)
        try {
            console.log(`🔍 Checking for booking conflicts on ${date} for room ${roomId}...`);

            const bookingsRef = collection(db, 'bookings');

            // Try a simpler query first to avoid index requirements
            let q = query(
                bookingsRef,
                where('roomId', '==', roomId),
                where('date', '==', date)
            );

            const bookingsSnapshot = await getDocs(q);
            console.log(`📋 Found ${bookingsSnapshot.size} total bookings for this room on ${date}`);

            // Filter for active bookings and check overlaps manually
            const activeBookings = [];
            bookingsSnapshot.forEach(doc => {
                const booking = doc.data();
                if (booking.status === 'active') {
                    activeBookings.push(booking);
                }
            });

            console.log(`🔍 Checking ${activeBookings.length} active bookings for conflicts...`);

            for (const booking of activeBookings) {
                const bookingStart = booking.startTime;
                const bookingEnd = booking.endTime;

                console.log(`📋 Existing booking: ${bookingStart}-${bookingEnd} | Requested: ${startTime}-${endTime}`);

                // Check if times overlap using Booking class method
                if (Booking.checkTimeOverlap(startTime, endTime, bookingStart, bookingEnd)) {
                    console.log(`❌ Room ${room.number} has conflicting booking: ${bookingStart}-${bookingEnd}`);
                    return false;
                }
            }

            console.log(`Room ${room.number} is available - no conflicts found`);
            return true;

        } catch (bookingError) {
            console.error('❌ Error checking booking conflicts:', bookingError);
            console.error('Error code:', bookingError.code);
            console.error('Error message:', bookingError.message);

            // Don't assume available if we can't check conflicts!
            // This was the bug - returning true when we couldn't check
            if (bookingError.code === 'failed-precondition') {
                console.log('⚠️ Firebase index required for booking conflict check');
            } else if (bookingError.code === 'permission-denied') {
                console.log('⚠️ Permission denied for booking conflict check');
            }

            // Return false to be safe - if we can't check conflicts, don't allow booking
            console.log(`❌ Room ${room.number} unavailable - cannot verify conflicts`);
            return false;
        }

    } catch (error) {
        console.error('Error checking availability:', error);
        console.log('Availability check failed due to permissions or other error');
        return false;
    }
}

// Display available rooms
async function displayAvailableRooms(rooms, date, startTime, endTime) {
    const roomsSection = document.getElementById('available-rooms-section');
    const roomsList = document.getElementById('rooms-list');

    roomsList.innerHTML = '';

    if (rooms.length === 0) {
        roomsList.innerHTML = '<p style="text-align: center; color: #999;">No rooms found matching your criteria. Please check if rooms have schedules set or try different times.</p>';
        roomsSection.style.display = 'block';
        return;
    }

    for (const room of rooms) {
        // Get room schedule for display
        try {
            const roomDoc = await getDoc(doc(db, 'rooms', room.id));
            const roomData = roomDoc.data();
            const schedule = roomData.schedule;

            const roomDiv = document.createElement('div');
            roomDiv.className = 'room-item';

            let scheduleInfo = '';
            if (schedule && schedule.startDate && schedule.endDate) {
                scheduleInfo = `<p style="margin: 5px 0; color: #666; font-size: 0.9em;">📅 Available: ${schedule.startDate} to ${schedule.endDate} | ⏰ All Day</p>`;
            }

            roomDiv.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h3 style="margin: 0 0 10px 0;">Room ${room.number}</h3>
                        <p style="margin: 5px 0; color: #666;">📍 Floor ${room.floor} | 👥 ${room.capacity} people</p>
                        ${scheduleInfo}
                        <span class="available-badge ${room.available ? 'available' : 'unavailable'}">
                            ${room.available ? '✓ Available' : '✗ Not Available'}
                        </span>
                    </div>
                    ${room.available ? `<button class="btn-success" onclick="bookRoom('${room.id}', '${room.number}', '${date}', '${startTime}', '${endTime}')">Book Now</button>` : ''}
                </div>
            `;

            roomsList.appendChild(roomDiv);
        } catch (error) {
            console.error('Error getting room details:', error);
            // Fallback to basic display
            const roomDiv = document.createElement('div');
            roomDiv.className = 'room-item';
            roomDiv.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h3 style="margin: 0 0 10px 0;">Room ${room.number}</h3>
                        <p style="margin: 5px 0; color: #666;">📍 Floor ${room.floor} | 👥 ${room.capacity} people</p>
                        <span class="available-badge ${room.available ? 'available' : 'unavailable'}">
                            ${room.available ? '✓ Available' : '✗ Not Available'}
                        </span>
                    </div>
                    ${room.available ? `<button class="btn-success" onclick="bookRoom('${room.id}', '${room.number}', '${date}', '${startTime}', '${endTime}')">Book Now</button>` : ''}
                </div>
            `;
            roomsList.appendChild(roomDiv);
        }
    }

    roomsSection.style.display = 'block';
}

// Book a room
window.bookRoom = async function (roomId, roomNumber, date, startTime, endTime) {
    if (!currentUser || !currentUserModel) {
        alert('Please login to book a room');
        return;
    }

    // Check if user already has an active booking using BookingManager
    const canBook = await bookingManager.canUserMakeBooking();
    if (!canBook) {
        alert('You already have an active booking. Please cancel it before making a new booking.');
        return;
    }

    if (!confirm(`Confirm booking for Room ${roomNumber} on ${date} from ${startTime} to ${endTime}?`)) {
        return;
    }

    try {
        // IMPORTANT: Re-check room availability right before booking to prevent race conditions
        console.log('🔍 Final availability check before booking...');
        const isStillAvailable = await checkRoomAvailability(roomId, date, startTime, endTime);

        if (!isStillAvailable) {
            alert('Sorry, this room has just been booked by another user. Please search for available rooms again.');

            // Hide available rooms section and refresh
            document.getElementById('available-rooms-section').style.display = 'none';
            return;
        }

        console.log('✅ Room still available, proceeding with booking...');

        // Create booking using Booking model
        const newBooking = new Booking(currentUser.uid, roomId, roomNumber, date, startTime, endTime);
        await newBooking.saveToDatabase();

        alert('Room booked successfully!');

        // Reload bookings
        loadMyBookings();

        // Hide available rooms section
        document.getElementById('available-rooms-section').style.display = 'none';

        // Clear form
        document.getElementById('booking-date').value = '';
        document.getElementById('start-time').value = '';
        document.getElementById('duration').value = '30min';
        document.getElementById('room-search').value = '';

    } catch (error) {
        console.error('❌ Error booking room:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);

        if (error.code === 'permission-denied') {
            alert('Permission denied: Please make sure you are logged in properly.');
        } else if (error.message.includes('conflict') || error.message.includes('already exists')) {
            alert('This room has been booked by another user just now. Please search for available rooms again.');
            // Hide available rooms section to force refresh
            document.getElementById('available-rooms-section').style.display = 'none';
        } else {
            alert('Failed to book room. This might be due to a booking conflict. Please try searching for available rooms again.');
        }
    }
};

// Check if user has an active booking
async function checkUserActiveBooking() {
    try {
        const activeBookings = await Booking.getUserActiveBookings(currentUser.uid);
        return activeBookings.length > 0;
    } catch (error) {
        console.error('Error checking active booking:', error);
        return false;
    }
}

// Load user's bookings
async function loadMyBookings() {
    if (!currentUser || !currentUserModel) {
        console.log('No user authenticated');
        return;
    }

    console.log('🔄 Loading bookings for user:', currentUserModel.uid);
    const bookingsTable = document.getElementById('bookings-table');

    // Show loading state
    UIUtils.showTableLoading('bookings-table', 6, 'Loading bookings...');

    try {
        const bookingsRef = collection(db, 'bookings');
        console.log('📋 Querying bookings collection...');

        // Use simple query first to avoid index issues
        let q = query(
            bookingsRef,
            where('userId', '==', currentUserModel.uid)
        );

        console.log('🔍 Executing query...');
        const snapshot = await getDocs(q);
        console.log('✅ Query completed. Found', snapshot.size, 'total bookings');

        if (snapshot.empty) {
            console.log('ℹ️ No bookings found for user');
            UIUtils.showTableEmpty('bookings-table', 6, 'No bookings found');
            document.getElementById('booking-alert').style.display = 'none';
            return;
        }

        // Filter and display bookings
        const activeBookings = [];
        const allBookings = [];

        // Check for expired bookings and update them to completed
        const now = new Date();
        const expiredBookingIds = [];

        for (const docSnapshot of snapshot.docs) {
            const booking = Booking.fromDatabaseData(docSnapshot.id, docSnapshot.data());

            // Check if active booking has expired using Booking model method
            if (booking.isExpired()) {
                console.log('⏰ Found expired booking:', booking);
                expiredBookingIds.push({
                    id: booking.id,
                    bookingData: booking
                });

                // Update the booking using model method
                booking.complete();
            }

            console.log('📋 Processing booking:', booking);
            allBookings.push(booking);

            if (booking.isActive()) {
                activeBookings.push(booking);
            }
        }

        // Update expired bookings in the database
        if (expiredBookingIds.length > 0) {
            console.log(`🔄 Updating ${expiredBookingIds.length} expired booking(s) to completed status`);

            // Update bookings in parallel
            const updatePromises = expiredBookingIds.map(async ({ id, bookingData }) => {
                try {
                    await updateDoc(doc(db, 'bookings', id), {
                        status: 'completed',
                        completedAt: Timestamp.now()
                    });
                    console.log(`✅ Updated booking ${id} to completed`);
                } catch (error) {
                    console.error(`❌ Failed to update booking ${id}:`, error);
                }
            });

            // Wait for all updates to complete
            await Promise.allSettled(updatePromises);
        }

        console.log('📊 Found', activeBookings.length, 'active bookings out of', allBookings.length, 'total');

        bookingsTable.innerHTML = '';

        if (activeBookings.length === 0) {
            UIUtils.showTableEmpty('bookings-table', 6, 'No active bookings');
            document.getElementById('booking-alert').style.display = 'none';

            // Show booking history if available
            if (allBookings.length > 0) {
                showBookingHistory(allBookings);
            }
            return;
        }

        // Sort active bookings by date and time (client-side)
        activeBookings.sort((a, b) => {
            const dateCompare = new Date(b.date) - new Date(a.date);
            if (dateCompare !== 0) return dateCompare;
            return b.startTime.localeCompare(a.startTime);
        });

        // Display active bookings
        activeBookings.forEach(booking => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>Room ${booking.roomNumber || 'N/A'}</td>
                <td>${booking.date || 'N/A'}</td>
                <td>${booking.startTime || 'N/A'} - ${booking.endTime || 'N/A'}</td>
                <td>${booking.getFormattedDuration()}</td>
                <td><span class="status-active">Active</span></td>
                <td><button class="btn-danger" onclick="cancelBooking('${booking.id}')">Cancel</button></td>
            `;
            bookingsTable.appendChild(row);
        });

        // Show alert if user has active booking
        document.getElementById('booking-alert').style.display = 'block';
        console.log('✅ Active bookings displayed successfully');

        // Show booking history
        showBookingHistory(allBookings);

    } catch (error) {
        console.error('❌ Error loading bookings:', error);
        console.error('Error details:', error.code, error.message);

        // Show detailed error message
        UIUtils.showTableError('bookings-table', 6, error);
        document.getElementById('booking-alert').style.display = 'none';
    }
}

// Show booking history
function showBookingHistory(allBookings) {
    // Create booking history section if it doesn't exist
    let historySection = document.getElementById('booking-history-section');
    if (!historySection) {
        const dashboard = document.querySelector('.dashboard');
        historySection = document.createElement('div');
        historySection.id = 'booking-history-section';
        historySection.className = 'card';
        historySection.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2>📚 Booking History</h2>
                <button onclick="refreshBookingHistory()" class="btn-secondary">🔄 Refresh</button>
            </div>
            <div id="booking-history">
                <table>
                    <thead>
                        <tr>
                            <th>Room Number</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Duration</th>
                            <th>Status</th>
                            <th>Created</th>
                            <th>Cancellation Date</th>
                        </tr>
                    </thead>
                    <tbody id="history-table">
                    </tbody>
                </table>
            </div>
        `;
        dashboard.appendChild(historySection);
    }

    const historyTable = document.getElementById('history-table');

    if (allBookings.length === 0) {
        historyTable.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #999;">No booking history</td></tr>';
        return;
    }

    // Sort all bookings by creation date (newest first)
    allBookings.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
            return b.createdAt.toMillis() - a.createdAt.toMillis();
        }
        return new Date(b.date) - new Date(a.date);
    });

    historyTable.innerHTML = '';

    // Show last 10 bookings
    allBookings.slice(0, 10).forEach(booking => {
        const row = document.createElement('tr');
        const createdAt = booking.createdAt ?
            new Date(booking.createdAt.toMillis()).toLocaleDateString() : 'N/A';

        let statusClass = 'status-active';
        let statusText = booking.status || 'Unknown';
        let cancellationDate = 'N/A';

        if (booking.status === 'cancelled') {
            statusClass = 'status-cancelled';
            statusText = 'Cancelled';
            cancellationDate = booking.cancelledAt ?
                new Date(booking.cancelledAt.toMillis()).toLocaleDateString() : 'N/A';
        } else if (booking.isActive()) {
            statusText = 'Active';
            cancellationDate = 'N/A';
        } else if (booking.status === 'completed') {
            statusClass = 'status-completed';
            statusText = 'Completed';
            cancellationDate = 'N/A'; // Completed bookings don't have cancellation dates
        }

        row.innerHTML = `
            <td>Room ${booking.roomNumber || 'N/A'}</td>
            <td>${booking.date || 'N/A'}</td>
            <td>${booking.startTime || 'N/A'} - ${booking.endTime || 'N/A'}</td>
            <td>${booking.getFormattedDuration()}</td>
            <td><span class="${statusClass}">${statusText}</span></td>
            <td>${createdAt}</td>
            <td>${cancellationDate}</td>
        `;
        historyTable.appendChild(row);
    });

    console.log('📚 Booking history displayed with', allBookings.length, 'total bookings');
}

// Calculate duration for display
function calculateDuration(startTime, endTime) {
    // Use the Booking class static method
    const booking = new Booking('temp', 'temp', 'temp', '2025-01-01', startTime, endTime);
    return booking.getFormattedDuration();
}

// Cancel booking
window.cancelBooking = async function (bookingId) {
    if (!confirm('Are you sure you want to cancel this booking?')) {
        return;
    }

    try {
        console.log('🔄 Attempting to cancel booking:', bookingId);
        console.log('👤 Current user:', currentUserModel?.uid);

        // Load booking and cancel using Booking model
        const bookingDoc = await getDoc(doc(db, 'bookings', bookingId));
        if (!bookingDoc.exists()) {
            alert('Booking not found');
            return;
        }
        
        const booking = Booking.fromDatabaseData(bookingId, bookingDoc.data());
        booking.cancel();
        await booking.saveToDatabase();

        const booking = Booking.fromDatabaseData(bookingId, bookingDoc.data());

        // Cancel the booking using the model method
        if (booking.cancel()) {
            // Save the updated booking to database
            await booking.saveToDatabase();

            console.log('✅ Booking cancelled successfully');
            alert('Booking cancelled successfully');
            loadMyBookings();
        } else {
            throw new Error('Unable to cancel this booking');
        }
    } catch (error) {
        console.error('❌ Error cancelling booking:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);

        if (error.code === 'permission-denied') {
            alert('Permission denied: Please make sure you are logged in and the Firebase security rules are updated. Check the console for details.');
        } else {
            alert('Failed to cancel booking. Please try again. Check console for error details.');
        }
    }
};

// Refresh bookings manually
window.refreshBookings = function () {
    console.log('🔄 Manual refresh requested');
    if (!currentUser || !currentUserModel) {
        console.log('❌ No authenticated user');
        alert('Please login first');
        return;
    }

    const bookingsTable = document.getElementById('bookings-table');
    bookingsTable.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #666;">Refreshing...</td></tr>';

    loadMyBookings();
};

// Refresh booking history manually
window.refreshBookingHistory = function () {
    console.log('🔄 Manual booking history refresh requested');
    if (!currentUser || !currentUserModel) {
        console.log('❌ No authenticated user');
        alert('Please login first');
        return;
    }

    const historyTable = document.getElementById('history-table');
    if (historyTable) {
        historyTable.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #666;">Refreshing history...</td></tr>';
    }

    // Reload all bookings to refresh history
    loadMyBookings();
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

// Set minimum date to today and add time validation
document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('booking-date');
    if (dateInput) {
        const today = DateUtils.getTodayDate();
        dateInput.min = today;
    }

    // Add time validation for booking hours
    const timeInput = document.getElementById('start-time');
    const durationSelect = document.getElementById('duration');

    function validateBookingTime() {
        const startTime = timeInput.value;
        const duration = durationSelect.value;

        if (startTime) {
            const endTime = TimeUtils.calculateEndTime(startTime, duration);

            // Visual feedback for invalid times
            if (!TimeUtils.validateBookingHours(startTime, endTime)) {
                timeInput.style.borderColor = '#dc3545';
                timeInput.style.backgroundColor = '#ffe6e6';
                timeInput.title = `Booking must be between 9:00 AM - 9:00 PM. Your booking would end at ${endTime}.`;
            } else {
                timeInput.style.borderColor = '#28a745';
                timeInput.style.backgroundColor = '#e6ffe6';
                timeInput.title = `Valid booking time. Your booking will end at ${endTime}.`;
            }
        }
    }

    if (timeInput && durationSelect) {
        timeInput.addEventListener('change', validateBookingTime);
        durationSelect.addEventListener('change', validateBookingTime);
    }
});


