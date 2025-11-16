// Object-Oriented Models for Library Room Booking System

import { doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, query, where, Timestamp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { db } from './firebase-config.js';

/**
 * User class - Encapsulates user data and authentication-related methods
 */
export class User {
    constructor(uid, email, name = null, role = 'student') {
        this.uid = uid;
        this.email = email;
        this.name = name || email;
        this.role = role;
        this.createdAt = new Date().toISOString();
    }

    // Save user to database
    async saveToDatabase() {
        try {
            await setDoc(doc(db, 'users', this.uid), {
                name: this.name,
                email: this.email,
                role: this.role,
                createdAt: this.createdAt
            });
            return true;
        } catch (error) {
            console.error('Error saving user:', error);
            return false;
        }
    }

    // Check if user is librarian
    isLibrarian() {
        return this.role === 'librarian';
    }

    // Check if user is student
    isStudent() {
        return this.role === 'student';
    }

    // Update user role
    async updateRole(newRole) {
        if (!['student', 'librarian'].includes(newRole)) {
            throw new Error('Invalid role. Must be "student" or "librarian"');
        }

        this.role = newRole;

        try {
            await updateDoc(doc(db, 'users', this.uid), {
                role: this.role
            });
            return true;
        } catch (error) {
            console.error('Error updating user role:', error);
            return false;
        }
    }

    // Create user from database data
    static fromDatabaseData(uid, userData) {
        const user = new User(uid, userData.email, userData.name, userData.role);
        user.createdAt = userData.createdAt;
        return user;
    }

    // Load user from database
    static async loadFromDatabase(uid) {
        try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
                return User.fromDatabaseData(uid, userDoc.data());
            }
            return null;
        } catch (error) {
            console.error('Error loading user:', error);
            return null;
        }
    }
}

/**
 * Room class - Encapsulates room data and availability checking
 */
export class Room {
    constructor(id, number, capacity, floor) {
        this.id = id;
        this.number = number;
        this.capacity = capacity;
        this.floor = floor;
        this.schedule = null;
    }

    // Set room schedule
    setSchedule(startDate, endDate) {
        // Basic validation
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (start >= end) {
            throw new Error('Start date must be before end date');
        }

        this.schedule = {
            startDate: startDate,
            endDate: endDate
        };
    }

    // Check if room is available on a specific date
    isAvailableOnDate(date) {
        if (!this.schedule) {
            return false; // No schedule set
        }

        const requestedDate = new Date(date);
        const startDate = new Date(this.schedule.startDate);
        const endDate = new Date(this.schedule.endDate);

        // Check if date is within available range
        return requestedDate >= startDate && requestedDate <= endDate;
    }

    // Get room capacity category
    getCapacityCategory() {
        if (this.capacity <= 2) return 'Small';
        if (this.capacity <= 6) return 'Medium';
        return 'Large';
    }

    // Save room to database
    async saveToDatabase() {
        try {
            const roomData = {
                number: this.number,
                capacity: this.capacity,
                floor: this.floor
            };

            if (this.schedule) {
                roomData.schedule = this.schedule;
            }

            if (this.id) {
                await updateDoc(doc(db, 'rooms', this.id), roomData);
            } else {
                const docRef = await addDoc(collection(db, 'rooms'), roomData);
                this.id = docRef.id;
            }

            return true;
        } catch (error) {
            console.error('Error saving room:', error);
            return false;
        }
    }

    // Create room from database data
    static fromDatabaseData(id, roomData) {
        const room = new Room(id, roomData.number, roomData.capacity, roomData.floor);
        if (roomData.schedule) {
            room.schedule = roomData.schedule;
        }
        return room;
    }

    // Load room from database
    static async loadFromDatabase(roomId) {
        try {
            const roomDoc = await getDoc(doc(db, 'rooms', roomId));
            if (roomDoc.exists()) {
                return Room.fromDatabaseData(roomId, roomDoc.data());
            }
            return null;
        } catch (error) {
            console.error('Error loading room:', error);
            return null;
        }
    }

    // Get all rooms with specific capacity
    static async getRoomsByCapacity(capacity) {
        try {
            const roomsRef = collection(db, 'rooms');
            const q = query(roomsRef, where('capacity', '==', capacity));
            const snapshot = await getDocs(q);

            const rooms = [];
            snapshot.forEach(doc => {
                rooms.push(Room.fromDatabaseData(doc.id, doc.data()));
            });

            return rooms;
        } catch (error) {
            console.error('Error getting rooms by capacity:', error);
            return [];
        }
    }
}

/**
 * Booking class - Encapsulates booking data and operations
 */
export class Booking {
    constructor(userId, roomId, roomNumber, date, startTime, endTime) {
        this.id = null;
        this.userId = userId;
        this.roomId = roomId;
        this.roomNumber = roomNumber;
        this.date = date;
        this.startTime = startTime;
        this.endTime = endTime;
        this.status = 'active';
        this.createdAt = Timestamp.now();
        this.cancelledAt = null;
        this.completedAt = null;
    }

    // Validate booking data
    isValid() {
        if (!this.userId || !this.roomId || !this.date || !this.startTime || !this.endTime) {
            return false;
        }

        // Check if end time is after start time
        const start = this.timeToMinutes(this.startTime);
        const end = this.timeToMinutes(this.endTime);

        return end > start;
    }

    // Convert time string to minutes
    timeToMinutes(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    }

    // Calculate booking duration in minutes
    getDurationInMinutes() {
        return this.timeToMinutes(this.endTime) - this.timeToMinutes(this.startTime);
    }

    // Get formatted duration string
    getFormattedDuration() {
        const totalMinutes = this.getDurationInMinutes();

        if (totalMinutes >= 60) {
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
        }

        return `${totalMinutes}m`;
    }

    // Check if booking is active
    isActive() {
        return this.status === 'active';
    }

    // Check if booking has expired
    isExpired() {
        if (this.status !== 'active') return false;

        const now = new Date();
        const bookingEnd = new Date(`${this.date}T${this.endTime}:00`);

        return bookingEnd < now;
    }

    // Cancel booking
    cancel() {
        if (this.status === 'active') {
            this.status = 'cancelled';
            this.cancelledAt = Timestamp.now();
            return true;
        }
        return false;
    }

    // Complete booking (mark as finished)
    complete() {
        if (this.status === 'active') {
            this.status = 'completed';
            this.completedAt = Timestamp.now();
            return true;
        }
        return false;
    }

    // Save booking to database
    async saveToDatabase() {
        if (!this.isValid()) {
            throw new Error('Invalid booking data');
        }

        try {
            const bookingData = {
                userId: this.userId,
                roomId: this.roomId,
                roomNumber: this.roomNumber,
                date: this.date,
                startTime: this.startTime,
                endTime: this.endTime,
                status: this.status,
                createdAt: this.createdAt
            };

            if (this.cancelledAt) {
                bookingData.cancelledAt = this.cancelledAt;
            }

            if (this.completedAt) {
                bookingData.completedAt = this.completedAt;
            }

            if (this.id) {
                await updateDoc(doc(db, 'bookings', this.id), bookingData);
            } else {
                const docRef = await addDoc(collection(db, 'bookings'), bookingData);
                this.id = docRef.id;
            }

            return true;
        } catch (error) {
            console.error('Error saving booking:', error);
            return false;
        }
    }

    // Create booking from database data
    static fromDatabaseData(id, bookingData) {
        const booking = new Booking(
            bookingData.userId,
            bookingData.roomId,
            bookingData.roomNumber,
            bookingData.date,
            bookingData.startTime,
            bookingData.endTime
        );

        booking.id = id;
        booking.status = bookingData.status || 'active';
        booking.createdAt = bookingData.createdAt;
        booking.cancelledAt = bookingData.cancelledAt || null;
        booking.completedAt = bookingData.completedAt || null;

        return booking;
    }

    // Get user's active bookings
    static async getUserActiveBookings(userId) {
        try {
            const bookingsRef = collection(db, 'bookings');
            const q = query(
                bookingsRef,
                where('userId', '==', userId),
                where('status', '==', 'active')
            );

            const snapshot = await getDocs(q);
            const bookings = [];

            snapshot.forEach(doc => {
                bookings.push(Booking.fromDatabaseData(doc.id, doc.data()));
            });

            return bookings;
        } catch (error) {
            console.error('Error getting active bookings:', error);
            return [];
        }
    }

    // Check time overlap between two bookings
    static checkTimeOverlap(start1, end1, start2, end2) {
        // Convert times to comparable format
        const timeToMinutes = (timeString) => {
            const [hours, minutes] = timeString.split(':').map(Number);
            return hours * 60 + minutes;
        };

        const start1Minutes = timeToMinutes(start1);
        const end1Minutes = timeToMinutes(end1);
        const start2Minutes = timeToMinutes(start2);
        const end2Minutes = timeToMinutes(end2);

        return (start1Minutes < end2Minutes && end1Minutes > start2Minutes);
    }
}

/**
 * BookingManager class - Coordinates booking operations between User, Room, and Booking classes
 */
export class BookingManager {
    constructor() {
        this.user = null;
        this.rooms = [];
        this.bookings = [];
    }

    // Set current user
    setUser(user) {
        if (!(user instanceof User)) {
            throw new Error('Must provide a User instance');
        }
        this.user = user;
    }

    // Load available rooms for capacity
    async loadRoomsForCapacity(capacity) {
        this.rooms = await Room.getRoomsByCapacity(capacity);
        return this.rooms;
    }

    // Check if user can make a new booking
    async canUserMakeBooking() {
        if (!this.user) return false;

        const activeBookings = await Booking.getUserActiveBookings(this.user.uid);
        return activeBookings.length === 0; // Only allow one active booking per user
    }

    // Create a new booking with validation
    async createBooking(roomId, roomNumber, date, startTime, endTime) {
        if (!this.user) {
            throw new Error('User must be set before creating booking');
        }

        // Check if user can make booking
        const canBook = await this.canUserMakeBooking();
        if (!canBook) {
            throw new Error('User already has an active booking');
        }

        // Create booking instance
        const booking = new Booking(
            this.user.uid,
            roomId,
            roomNumber,
            date,
            startTime,
            endTime
        );

        // Validate booking
        if (!booking.isValid()) {
            throw new Error('Invalid booking data');
        }

        // Save to database
        const success = await booking.saveToDatabase();
        if (!success) {
            throw new Error('Failed to save booking to database');
        }

        return booking;
    }
}

// Export all classes for use in other modules
export { User, Room, Booking, BookingManager };