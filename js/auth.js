// Authentication functionality
import { auth, db } from './firebase-config.js';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { User } from './models.js';

// Check authentication state
export function checkAuthState() {
    return new Promise((resolve) => {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                console.log('✅ User is signed in:', user.email);

                // Get user role from Firestore
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    const userData = userDoc.data();

                    // Only redirect if on login page
                    if (window.location.pathname.includes('login.html')) {
                        if (userData && userData.role === 'librarian') {
                            window.location.href = 'admin-dashboard.html';
                        } else {
                            window.location.href = 'dashboardStudent.html';
                        }
                    }

                    resolve({ user, userData });
                } catch (error) {
                    console.error('Error getting user data:', error);
                    resolve({ user, userData: null });
                }
            } else {
                console.log('❌ No user signed in');
                // Only redirect to login if on protected page
                const protectedPages = ['dashboardStudent.html', 'admin-dashboard.html'];
                const currentPage = window.location.pathname.split('/').pop();

                if (protectedPages.includes(currentPage)) {
                    window.location.href = 'login.html';
                }

                resolve({ user: null, userData: null });
            }
        });
    });
}

// Login function
export async function login(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Get user role
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();

        console.log('✅ Login successful:', user.email);
        return { user, role: userData?.role || 'student' };
    } catch (error) {
        console.error('❌ Login error:', error);
        throw error;
    }
}

// Register function
export async function register(email, password, name) {
    try {
        // Create user account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update profile with name
        await updateProfile(user, {
            displayName: name
        });

        // Save user data to Firestore using User model - all new users are students
        const newUser = new User(user.uid, email, name, 'student');
        await newUser.saveToDatabase();

        console.log('✅ Registration successful:', user.email);
        return { user, role: 'student' };
    } catch (error) {
        console.error('❌ Registration error:', error);
        throw error;
    }
}

// Logout function
export async function logout() {
    try {
        await signOut(auth);
        console.log('✅ Logout successful');
        window.location.href = 'login.html';
    } catch (error) {
        console.error('❌ Logout error:', error);
        throw error;
    }
}

// Get error message
export function getAuthErrorMessage(errorCode) {
    switch (errorCode) {
        case 'auth/invalid-email':
            return 'Invalid email address format.';
        case 'auth/user-not-found':
            return 'No user found with this email.';
        case 'auth/wrong-password':
            return 'Incorrect password.';
        case 'auth/invalid-credential':
            return 'Invalid email or password.';
        case 'auth/email-already-in-use':
            return 'An account with this email already exists.';
        case 'auth/weak-password':
            return 'Password should be at least 6 characters.';
        case 'auth/network-request-failed':
            return 'Network error. Please check your connection.';
        default:
            return 'An error occurred. Please try again.';
    }
}

// Initialize auth listeners
checkAuthState();

// Login form handler (if on login page)
if (window.location.pathname.includes('login.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        const loginForm = document.getElementById('login-form');

        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const email = document.getElementById('email').value.trim();
                const password = document.getElementById('password').value;
                const submitBtn = loginForm.querySelector('button[type="submit"]');

                if (!email || !password) {
                    alert('Please fill in all fields');
                    return;
                }

                // Disable button during login
                submitBtn.disabled = true;
                submitBtn.textContent = 'Logging in...';

                try {
                    const { user, role } = await login(email, password);

                    // Redirect based on role
                    if (role === 'librarian') {
                        window.location.href = 'admin-dashboard.html';
                    } else {
                        window.location.href = 'dashboardStudent.html';
                    }
                } catch (error) {
                    console.error('Login error:', error);
                    alert(getAuthErrorMessage(error.code));
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Login';
                }
            });
        }
    });
}

// Logout button handler (works on any page)
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                await logout();
            }
        });
    }
});

