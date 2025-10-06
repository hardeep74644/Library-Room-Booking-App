// Admin panel functionality
import { auth, db } from './firebase-config.js';

// Note: Uncomment when Firebase is properly set up
// import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';

// Check if user is admin
export function checkAdminRole(user) {
    // Placeholder for admin role check
    // In production, this would check user's role in Firestore or custom claims
    // For now, we'll just check if email contains 'admin'
    
    const isAdmin = user && user.email && user.email.includes('admin');
    
    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel) {
        adminPanel.style.display = isAdmin ? 'block' : 'none';
    }
    
    return isAdmin;
}

// Add new room (admin only)
export async function addRoom(roomData) {
    try {
        // Placeholder for Firebase Firestore add
        // const roomsRef = collection(db, 'rooms');
        // await addDoc(roomsRef, {
        //     name: roomData.name,
        //     capacity: roomData.capacity,
        //     available: true,
        //     createdAt: new Date()
        // });
        
        console.log('Room added:', roomData);
        alert('Room added successfully!');
        
        // Reload rooms list
        if (typeof loadRooms === 'function') {
            loadRooms();
        }
    } catch (error) {
        console.error('Error adding room:', error);
        alert('Failed to add room. Please try again.');
    }
}

// Delete room (admin only)
export async function deleteRoom(roomId) {
    if (!confirm('Are you sure you want to delete this room?')) {
        return;
    }
    
    try {
        // Placeholder for Firebase Firestore delete
        // await deleteDoc(doc(db, 'rooms', roomId));
        
        console.log('Room deleted:', roomId);
        alert('Room deleted successfully!');
        
        // Reload rooms list
        if (typeof loadRooms === 'function') {
            loadRooms();
        }
    } catch (error) {
        console.error('Error deleting room:', error);
        alert('Failed to delete room. Please try again.');
    }
}

// Load all users (admin only)
export async function loadUsers() {
    try {
        // Placeholder for Firebase Firestore query
        // const usersRef = collection(db, 'users');
        // const usersSnapshot = await getDocs(usersRef);
        
        // Mock data
        const mockUsers = [
            { id: 1, email: 'user1@example.com', role: 'user' },
            { id: 2, email: 'admin@example.com', role: 'admin' },
            { id: 3, email: 'user2@example.com', role: 'user' }
        ];
        
        console.log('Users loaded:', mockUsers);
        return mockUsers;
    } catch (error) {
        console.error('Error loading users:', error);
        throw error;
    }
}

// Display users in admin panel
export function displayUsers(users) {
    const adminContent = document.getElementById('admin-content');
    
    if (!adminContent) return;
    
    adminContent.innerHTML = '<h4>User Management</h4>';
    
    if (users.length === 0) {
        adminContent.innerHTML += '<p>No users found.</p>';
        return;
    }
    
    const usersList = document.createElement('ul');
    usersList.style.listStyle = 'none';
    
    users.forEach(user => {
        const userItem = document.createElement('li');
        userItem.style.padding = '10px';
        userItem.style.marginBottom = '10px';
        userItem.style.backgroundColor = '#f8f9fa';
        userItem.style.borderRadius = '5px';
        
        userItem.innerHTML = `
            <strong>${user.email}</strong> - Role: ${user.role}
            <button class="btn-secondary" style="float: right; padding: 5px 10px; font-size: 0.9rem;">
                Edit Role
            </button>
        `;
        
        usersList.appendChild(userItem);
    });
    
    adminContent.appendChild(usersList);
}

// Initialize admin panel
if (window.location.pathname.includes('dashboard.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        const addRoomBtn = document.getElementById('add-room-btn');
        const manageUsersBtn = document.getElementById('manage-users-btn');
        
        if (addRoomBtn) {
            addRoomBtn.addEventListener('click', () => {
                // Show add room form
                const roomName = prompt('Enter room name:');
                const roomCapacity = prompt('Enter room capacity:');
                
                if (roomName && roomCapacity) {
                    addRoom({
                        name: roomName,
                        capacity: parseInt(roomCapacity)
                    });
                }
            });
        }
        
        if (manageUsersBtn) {
            manageUsersBtn.addEventListener('click', async () => {
                const users = await loadUsers();
                displayUsers(users);
            });
        }
        
        // Check if current user is admin
        const mockAdminUser = {
            email: 'admin@example.com'
        };
        
        checkAdminRole(mockAdminUser);
    });
}

console.log('Admin functionality loaded');
