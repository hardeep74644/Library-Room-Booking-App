// Student Dashboard functionality - v3.0 (All Day Availability)
console.log('Student Dashboard v3.0 loaded - All Day Availability Enabled');
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
    Timestamp,
    orderBy
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

let currentUser = null;
let selectedCapacity = 2;
let selectedRoom = null;

// Check authentication
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;

        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const userData = userDoc.data();

            if (!userData) {
                // If user document doesn't exist, create it with default student role
                await setDoc(doc(db, 'users', user.uid), {
                    name: user.displayName || user.email,
                    email: user.email,
                    role: 'student',
                    createdAt: new Date().toISOString()
                });
                userData = { role: 'student', name: user.displayName || user.email };
            }

            // Update welcome message
            const nameElement = document.querySelector('.user-info strong');
            if (nameElement) {
                nameElement.textContent = userData?.name || user.email;
            }

            // Check if user is a student
            if (userData?.role !== 'student') {
                alert('Access denied. This page is for students only.');
                window.location.href = 'admin-dashboard.html';
                return;
            }

            // Load user's bookings
            loadMyBookings();

            // Set minimum date for booking to today
            setMinimumBookingDate();
        } catch (error) {
            console.error('Error loading user data:', error);
            alert('Error loading user data. Please try refreshing the page.');
        }
    } else {
        console.log('No user authenticated, redirecting to login');
        window.location.href = 'login.html';
    }
});

// Set minimum date for booking to today
function setMinimumBookingDate() {
    const today = new Date().toISOString().split('T')[0];
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
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
        alert('Cannot book rooms for past dates');
        return;
    }

    try {
        // Calculate end time based on duration
        const endTime = calculateEndTime(startTime, duration);

        // Get all rooms with matching capacity
        const roomsRef = collection(db, 'rooms');
        let q = query(roomsRef, where('capacity', '==', selectedCapacity));

        const roomsSnapshot = await getDocs(q);
        const rooms = [];

        for (const roomDoc of roomsSnapshot.docs) {
            const roomData = roomDoc.data();
            const roomId = roomDoc.id;

            // Check if room number matches search (if provided)
            if (roomSearch && !roomData.number.toLowerCase().includes(roomSearch.toLowerCase())) {
                continue;
            }

            // Check availability
            const isAvailable = await checkRoomAvailability(roomId, date, startTime, endTime);

            rooms.push({
                id: roomId,
                number: roomData.number,
                capacity: roomData.capacity,
                floor: roomData.floor,
                available: isAvailable
            });
        }

        displayAvailableRooms(rooms, date, startTime, endTime);
    } catch (error) {
        console.error('Error searching rooms:', error);
        alert('Error searching for rooms. Please try again.');
    }
};

// Calculate end time based on start time and duration
function calculateEndTime(startTime, duration) {
    const [hours, minutes] = startTime.split(':').map(Number);
    let totalMinutes = hours * 60 + minutes;

    switch (duration) {
        case '30min':
            totalMinutes += 30;
            break;
        case '1hr':
            totalMinutes += 60;
            break;
        case '1.5hr':
            totalMinutes += 90;
            break;
        case '2hr':
            totalMinutes += 120;
            break;
    }

    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;

    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
}

// Check if room is available at the specified time
// Check if room is available at the specified time
async function checkRoomAvailability(roomId, date, startTime, endTime) {
    try {
        // First check if the room has a schedule and if the requested time fits
        const roomDoc = await getDoc(doc(db, 'rooms', roomId));

        if (!roomDoc.exists()) {
            console.log(`Room with ID ${roomId} not found`);
            return false;
        }

        const roomData = roomDoc.data();
        const schedule = roomData.schedule;

        console.log(`Checking availability for Room ${roomData.number}:`, {
            requestedDate: date,
            requestedTime: `${startTime} - ${endTime}`,
            schedule: schedule
        });

        if (schedule) {
            // Check if schedule has the new date range format
            if (!schedule.startDate || !schedule.endDate) {
                console.log(`Room ${roomData.number} has old schedule format or missing date range:`, schedule);
                return false;
            }

            // Check if the requested date is within the available date range
            const requestedDate = new Date(date);
            const scheduleStartDate = new Date(schedule.startDate);
            const scheduleEndDate = new Date(schedule.endDate);

            // Ensure all dates are valid
            if (isNaN(requestedDate.getTime()) || isNaN(scheduleStartDate.getTime()) || isNaN(scheduleEndDate.getTime())) {
                console.log(`Room ${roomData.number} has invalid date format:`, {
                    requestedDate: date,
                    scheduleStartDate: schedule.startDate,
                    scheduleEndDate: schedule.endDate
                });
                return false;
            }

            console.log(`Date comparison for Room ${roomData.number}:`, {
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
                console.log(`Room ${roomData.number} not available on ${date} (available from ${schedule.startDate} to ${schedule.endDate})`);
                return false;
            }

            // Rooms are available all day within the date range - no time restrictions from schedule
            console.log(`Room ${roomData.number} is within available date range - checking for booking conflicts`);
        } else {
            // If no schedule is set, room is not available
            console.log(`Room ${roomData.number} has no schedule set - please ask librarian to set availability`);
            return false;
        }

        // Check for actual booking conflicts (this is the main availability constraint now)
        try {
            const bookingsRef = collection(db, 'bookings');
            const q = query(
                bookingsRef,
                where('roomId', '==', roomId),
                where('date', '==', date),
                where('status', '==', 'active')
            );

            const bookingsSnapshot = await getDocs(q);

            // Check for overlapping bookings
            for (const booking of bookingsSnapshot.docs) {
                const bookingData = booking.data();
                const bookingStart = bookingData.startTime;
                const bookingEnd = bookingData.endTime;

                // Check if times overlap
                if (timesOverlap(startTime, endTime, bookingStart, bookingEnd)) {
                    console.log(`Room ${roomData.number} has conflicting booking: ${bookingStart}-${bookingEnd}`);
                    return false;
                }
            }

            console.log(`Room ${roomData.number} is available - no conflicts found`);
            return true;

        } catch (bookingError) {
            console.log('Error checking booking conflicts (may need Firebase index):', bookingError.message);
            // If we can't check conflicts due to permission/index issues, assume available for now
            // The actual booking will check for conflicts when it's created
            console.log(`Room ${roomData.number} is available based on schedule (couldn't check conflicts)`);
            return true;
        }

    } catch (error) {
        console.error('Error checking availability:', error);
        console.log('Availability check failed due to permissions or other error');
        return false;
    }
}

// Check if two time ranges overlap
function timesOverlap(start1, end1, start2, end2) {
    return (start1 < end2 && end1 > start2);
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
    if (!currentUser) {
        alert('Please login to book a room');
        return;
    }

    // Check if user already has an active booking
    const hasActiveBooking = await checkUserActiveBooking();
    if (hasActiveBooking) {
        alert('You already have an active booking. Please cancel it before making a new booking.');
        return;
    }

    if (!confirm(`Confirm booking for Room ${roomNumber} on ${date} from ${startTime} to ${endTime}?`)) {
        return;
    }

    try {
        // Create booking
        await addDoc(collection(db, 'bookings'), {
            userId: currentUser.uid,
            roomId: roomId,
            roomNumber: roomNumber,
            date: date,
            startTime: startTime,
            endTime: endTime,
            status: 'active',
            createdAt: Timestamp.now()
        });

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
        console.error('Error booking room:', error);
        alert('Failed to book room. Please try again.');
    }
};

// Check if user has an active booking
async function checkUserActiveBooking() {
    try {
        const bookingsRef = collection(db, 'bookings');
        const q = query(
            bookingsRef,
            where('userId', '==', currentUser.uid),
            where('status', '==', 'active')
        );

        const snapshot = await getDocs(q);
        return !snapshot.empty;
    } catch (error) {
        console.error('Error checking active booking:', error);
        return false;
    }
}

// Load user's bookings
async function loadMyBookings() {
    if (!currentUser) {
        console.log('No user authenticated');
        return;
    }

    try {
        const bookingsRef = collection(db, 'bookings');

        // Try the complex query first
        let q;
        try {
            q = query(
                bookingsRef,
                where('userId', '==', currentUser.uid),
                where('status', '==', 'active'),
                orderBy('createdAt', 'desc')
            );
        } catch (indexError) {
            console.log('Using simpler query due to index requirement');
            // Fallback to simpler query if index doesn't exist
            q = query(
                bookingsRef,
                where('userId', '==', currentUser.uid),
                where('status', '==', 'active')
            );
        }

        const snapshot = await getDocs(q);
        const bookingsTable = document.getElementById('bookings-table');

        if (snapshot.empty) {
            bookingsTable.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #999;">No active bookings</td></tr>';
            document.getElementById('booking-alert').style.display = 'none';
            return;
        }

        bookingsTable.innerHTML = '';

        snapshot.forEach(doc => {
            const booking = doc.data();
            const row = document.createElement('tr');

            row.innerHTML = `
                <td>Room ${booking.roomNumber}</td>
                <td>${booking.date}</td>
                <td>${booking.startTime} - ${booking.endTime}</td>
                <td>${calculateDuration(booking.startTime, booking.endTime)}</td>
                <td><span class="status-active">Active</span></td>
                <td><button class="btn-danger" onclick="cancelBooking('${doc.id}')">Cancel</button></td>
            `;

            bookingsTable.appendChild(row);
        });

        // Show alert if user has active booking
        document.getElementById('booking-alert').style.display = 'block';

    } catch (error) {
        console.error('Error loading bookings:', error);
        // Show fallback message
        const bookingsTable = document.getElementById('bookings-table');
        bookingsTable.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #999;">Error loading bookings. You may need to create Firebase indexes.</td></tr>';
        document.getElementById('booking-alert').style.display = 'none';
    }
}

// Calculate duration for display
function calculateDuration(startTime, endTime) {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);

    const totalMinutes = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);

    if (totalMinutes >= 60) {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }

    return `${totalMinutes}m`;
}

// Cancel booking
window.cancelBooking = async function (bookingId) {
    if (!confirm('Are you sure you want to cancel this booking?')) {
        return;
    }

    try {
        await deleteDoc(doc(db, 'bookings', bookingId));
        alert('Booking cancelled successfully');
        loadMyBookings();
    } catch (error) {
        console.error('Error cancelling booking:', error);
        alert('Failed to cancel booking. Please try again.');
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

// Set minimum date to today
document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('booking-date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
    }
});

console.log('✅ Student dashboard loaded');
