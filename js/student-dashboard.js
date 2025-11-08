// Student Dashboard functionality
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
        } catch (error) {
            console.error('Error loading user data:', error);
            alert('Error loading user data. Please try refreshing the page.');
        }
    } else {
        console.log('No user authenticated, redirecting to login');
        window.location.href = 'login.html';
    }
});

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
async function checkRoomAvailability(roomId, date, startTime, endTime) {
    try {
        // First check if the room has a schedule and if the requested time fits
        const roomDoc = await getDoc(doc(db, 'rooms', roomId));
        const roomData = roomDoc.data();
        const schedule = roomData.schedule;

        if (schedule) {
            // Check if the requested day is available
            const requestedDate = new Date(date);
            const dayOfWeek = requestedDate.toLocaleDateString('en-US', { weekday: 'lowercase' });

            if (!schedule.days || !schedule.days.includes(dayOfWeek)) {
                console.log(`Room ${roomData.number} not available on ${dayOfWeek}`);
                return false;
            }

            // Check if the requested time is within available hours
            if (schedule.startTime && schedule.endTime) {
                if (startTime < schedule.startTime || endTime > schedule.endTime) {
                    console.log(`Room ${roomData.number} not available during ${startTime}-${endTime} (available ${schedule.startTime}-${schedule.endTime})`);
                    return false;
                }
            }
        } else {
            // If no schedule is set, room is not available
            console.log(`Room ${roomData.number} has no schedule set`);
            return false;
        }

        // Then check for booking conflicts
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
                return false;
            }
        }

        return true;
    } catch (error) {
        console.error('Error checking availability:', error);
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
            if (schedule && schedule.days && schedule.startTime && schedule.endTime) {
                const daysFormatted = schedule.days.map(day => day.charAt(0).toUpperCase() + day.slice(1)).join(', ');
                scheduleInfo = `<p style="margin: 5px 0; color: #666; font-size: 0.9em;">📅 Available: ${daysFormatted} | ⏰ ${schedule.startTime} - ${schedule.endTime}</p>`;
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
    try {
        const bookingsRef = collection(db, 'bookings');
        const q = query(
            bookingsRef,
            where('userId', '==', currentUser.uid),
            where('status', '==', 'active'),
            orderBy('createdAt', 'desc')
        );

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
