// Main application logic
import { auth, db } from './firebase-config.js';

// Note: Uncomment when Firebase is properly set up
// import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';

// Display user information
export function displayUserInfo(user) {
    const userName = document.getElementById('user-name');
    const userEmail = document.getElementById('user-email');
    
    if (userName && user) {
        userName.textContent = user.displayName || user.email.split('@')[0];
    }
    
    if (userEmail && user) {
        userEmail.textContent = user.email;
    }
}

// Load available rooms
export async function loadRooms() {
    const roomsList = document.getElementById('rooms-list');
    
    if (!roomsList) return;
    
    try {
        // Placeholder for Firebase Firestore query
        // const roomsRef = collection(db, 'rooms');
        // const roomsSnapshot = await getDocs(roomsRef);
        
        // Mock data for demonstration
        const mockRooms = [
            { id: 1, name: 'Study Room A', capacity: 4, available: true },
            { id: 2, name: 'Study Room B', capacity: 6, available: true },
            { id: 3, name: 'Meeting Room 1', capacity: 10, available: false },
            { id: 4, name: 'Conference Room', capacity: 20, available: true }
        ];
        
        roomsList.innerHTML = '';
        
        mockRooms.forEach(room => {
            const roomCard = createRoomCard(room);
            roomsList.appendChild(roomCard);
        });
        
        console.log('Rooms loaded');
    } catch (error) {
        console.error('Error loading rooms:', error);
        roomsList.innerHTML = '<p>Error loading rooms. Please try again later.</p>';
    }
}

// Create room card element
function createRoomCard(room) {
    const card = document.createElement('div');
    card.className = 'room-card';
    card.innerHTML = `
        <h4>${room.name}</h4>
        <p>Capacity: ${room.capacity} people</p>
        <p>Status: <span class="${room.available ? 'available' : 'unavailable'}">
            ${room.available ? 'Available' : 'Booked'}
        </span></p>
        <button class="btn-primary" ${!room.available ? 'disabled' : ''}>
            ${room.available ? 'Book Now' : 'Not Available'}
        </button>
    `;
    
    const bookButton = card.querySelector('button');
    if (room.available) {
        bookButton.addEventListener('click', () => bookRoom(room));
    }
    
    return card;
}

// Book a room
export async function bookRoom(room) {
    try {
        // Placeholder for Firebase booking logic
        // const bookingsRef = collection(db, 'bookings');
        // await addDoc(bookingsRef, {
        //     roomId: room.id,
        //     userId: auth.currentUser.uid,
        //     timestamp: new Date()
        // });
        
        alert(`Room "${room.name}" booked successfully!`);
        console.log('Room booked:', room);
        
        // Reload rooms to update availability
        loadRooms();
        loadUserBookings();
    } catch (error) {
        console.error('Error booking room:', error);
        alert('Failed to book room. Please try again.');
    }
}

// Load user's bookings
export async function loadUserBookings() {
    const bookingsList = document.getElementById('bookings-list');
    
    if (!bookingsList) return;
    
    try {
        // Placeholder for Firebase query
        // const bookingsRef = collection(db, 'bookings');
        // const q = query(bookingsRef, where('userId', '==', auth.currentUser.uid));
        // const bookingsSnapshot = await getDocs(q);
        
        // Mock data
        const mockBookings = [
            { id: 1, roomName: 'Study Room A', date: new Date().toLocaleDateString() }
        ];
        
        if (mockBookings.length === 0) {
            bookingsList.innerHTML = '<p>No bookings yet.</p>';
            return;
        }
        
        bookingsList.innerHTML = '<ul>';
        mockBookings.forEach(booking => {
            bookingsList.innerHTML += `
                <li>
                    ${booking.roomName} - ${booking.date}
                    <button class="btn-secondary" onclick="cancelBooking(${booking.id})">Cancel</button>
                </li>
            `;
        });
        bookingsList.innerHTML += '</ul>';
        
        console.log('User bookings loaded');
    } catch (error) {
        console.error('Error loading bookings:', error);
        bookingsList.innerHTML = '<p>Error loading bookings.</p>';
    }
}

// Initialize app on dashboard page
if (window.location.pathname.includes('dashboard.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        // Mock user for demonstration
        const mockUser = {
            email: 'user@example.com',
            displayName: 'Demo User'
        };
        
        displayUserInfo(mockUser);
        loadRooms();
        loadUserBookings();
    });
}

console.log('Main app logic loaded');
