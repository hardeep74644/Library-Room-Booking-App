// Admin Dashboard functionality
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { 
    collection, 
    addDoc, 
    getDocs, 
    getDoc,
    doc, 
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
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        
        // Update welcome message
        document.querySelector('.user-info strong').textContent = userData?.name || user.email;
        
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
    } else {
        window.location.href = 'login.html';
    }
});

// Tab switching
window.showTab = function(tabName) {
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
        const roomsRef = collection(db, 'rooms');
        const snapshot = await getDocs(roomsRef);
        const roomsTable = document.getElementById('rooms-table');
        
        if (snapshot.empty) {
            roomsTable.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #999;">No rooms found. Add your first room!</td></tr>';
            return;
        }
        
        roomsTable.innerHTML = '';
        
        snapshot.forEach(doc => {
            const room = doc.data();
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>Room ${room.number}</td>
                <td>Floor ${room.floor}</td>
                <td>${room.capacity} people</td>
                <td><span class="available-badge available">Active</span></td>
                <td>
                    <button class="btn-danger" onclick="deleteRoom('${doc.id}', '${room.number}')">Delete</button>
                </td>
            `;
            
            roomsTable.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error loading rooms:', error);
    }
}

// Load all reservations
window.loadReservations = async function() {
    try {
        const filter = document.getElementById('reservation-filter')?.value || 'all';
        const bookingsRef = collection(db, 'bookings');
        
        let q;
        if (filter === 'all') {
            q = query(bookingsRef, orderBy('createdAt', 'desc'));
        } else {
            q = query(bookingsRef, where('status', '==', filter), orderBy('createdAt', 'desc'));
        }
        
        const snapshot = await getDocs(q);
        const reservationsTable = document.getElementById('reservations-table');
        
        if (snapshot.empty) {
            reservationsTable.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #999;">No reservations found</td></tr>';
            return;
        }
        
        reservationsTable.innerHTML = '';
        
        for (const bookingDoc of snapshot.docs) {
            const booking = bookingDoc.data();
            
            // Get user details
            const userDoc = await getDoc(doc(db, 'users', booking.userId));
            const userData = userDoc.data();
            
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${userData?.name || 'Unknown'}</td>
                <td>Room ${booking.roomNumber}</td>
                <td>${booking.date}</td>
                <td>${booking.startTime} - ${booking.endTime}</td>
                <td><span class="status-${booking.status}">${booking.status === 'active' ? 'Active' : 'Cancelled'}</span></td>
                <td>
                    ${booking.status === 'active' ? 
                        `<button class="btn-danger" onclick="cancelReservation('${bookingDoc.id}')">Cancel</button>` : 
                        '<span style="color: #999;">-</span>'}
                </td>
            `;
            
            reservationsTable.appendChild(row);
        }
        
    } catch (error) {
        console.error('Error loading reservations:', error);
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
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td><span style="padding: 4px 12px; background: ${user.role === 'librarian' ? '#d4edda' : '#cce5ff'}; border-radius: 12px; font-size: 0.85rem;">${user.role}</span></td>
                <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                    ${user.role === 'student' ? 
                        `<button class="btn-secondary" onclick="toggleUserRole('${doc.id}', '${user.role}')">Make Librarian</button>` : 
                        `<button class="btn-secondary" onclick="toggleUserRole('${doc.id}', '${user.role}')">Make Student</button>`}
                </td>
            `;
            
            studentsTable.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error loading students:', error);
    }
}

// Show add room modal
window.showAddRoomModal = function() {
    document.getElementById('add-room-modal').style.display = 'block';
};

// Close add room modal
window.closeAddRoomModal = function() {
    document.getElementById('add-room-modal').style.display = 'none';
    document.getElementById('add-room-form').reset();
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
});

// Delete room
window.deleteRoom = async function(roomId, roomNumber) {
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
window.cancelReservation = async function(bookingId) {
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

// Toggle user role
window.toggleUserRole = async function(userId, currentRole) {
    const newRole = currentRole === 'student' ? 'librarian' : 'student';
    
    if (!confirm(`Change user role to ${newRole}?`)) {
        return;
    }
    
    try {
        await updateDoc(doc(db, 'users', userId), {
            role: newRole
        });
        
        alert(`User role changed to ${newRole} successfully!`);
        loadStudents();
    } catch (error) {
        console.error('Error updating user role:', error);
        alert('Failed to update user role. Please try again.');
    }
};

// Logout
window.logout = async function() {
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
window.onclick = function(event) {
    const modal = document.getElementById('add-room-modal');
    if (event.target === modal) {
        closeAddRoomModal();
    }
};

console.log('✅ Admin dashboard loaded');
