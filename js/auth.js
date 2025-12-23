/**
 * auth.js
 * Firebase Authentication for Infractions system
 * Uses shared inspectors collection from Ski-Track
 */

// Firebase configuration (same as Ski-Track project)
const firebaseConfig = {
  apiKey: "AIzaSyDcBZrwGTskM7QUvanzLTACEJ_T-55j-DA",
  authDomain: "trail-inspection.firebaseapp.com",
  projectId: "trail-inspection",
  storageBucket: "trail-inspection.firebasestorage.app",
  messagingSenderId: "415995272058",
  appId: "1:415995272058:web:dc476de8ffee052e2ad4c3",
  measurementId: "G-EBLYWBM9YB"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Current user data
let currentUser = null;
let currentUserData = null;

/**
 * Check authentication status and handle redirects
 */
function checkAuthStatus() {
  const loading = document.getElementById('loading');
  const mainContent = document.getElementById('main-content');
  const loginLink = document.getElementById('login-link');
  const mobileLoginLink = document.getElementById('mobile-login-link');
  const adminLink = document.getElementById('admin-link');
  const mobileAdminLink = document.getElementById('mobile-admin-link');
  
  auth.onAuthStateChanged(async function(user) {
    if (user) {
      currentUser = user;
      
      try {
        // Get user data from inspectors collection
        const inspectorDoc = await db.collection('inspectors').doc(user.uid).get();
        
        if (inspectorDoc.exists) {
          currentUserData = inspectorDoc.data();
          currentUserData.uid = user.uid;
          
          // Check if user is active
          if (currentUserData.status !== 'active') {
            alert('Votre compte a été désactivé. Contactez l\'administrateur.');
            await auth.signOut();
            redirectToLogin();
            return;
          }
          
          // Update UI for logged in user
          if (loginLink) {
            loginLink.textContent = 'Déconnexion';
            loginLink.href = '#';
            loginLink.onclick = handleLogout;
          }
          if (mobileLoginLink) {
            mobileLoginLink.textContent = 'Déconnexion';
            mobileLoginLink.href = '#';
            mobileLoginLink.onclick = handleLogout;
          }
          
          // Show admin link if user is admin
          if (currentUserData.role === 'admin') {
            if (adminLink) adminLink.style.display = '';
            if (mobileAdminLink) mobileAdminLink.style.display = '';
          }
          
          // Hide loading, show content
          if (loading) loading.style.display = 'none';
          if (mainContent) mainContent.style.display = 'block';
          
          // Trigger custom event for page-specific initialization
          document.dispatchEvent(new CustomEvent('userAuthenticated', { 
            detail: currentUserData 
          }));
          
        } else {
          console.error('User not found in inspectors collection');
          alert('Votre compte n\'est pas configuré correctement. Contactez l\'administrateur.');
          await auth.signOut();
          redirectToLogin();
        }
        
      } catch (error) {
        console.error('Error fetching user data:', error);
        if (loading) loading.style.display = 'none';
        alert('Erreur lors du chargement des données utilisateur.');
      }
      
    } else {
      // User not logged in
      currentUser = null;
      currentUserData = null;
      
      // Redirect to login if on protected page
      const currentPage = window.location.pathname;
      if (!currentPage.includes('login.html')) {
        redirectToLogin();
      } else {
        if (loading) loading.style.display = 'none';
        if (mainContent) mainContent.style.display = 'block';
      }
    }
  });
}

/**
 * Redirect to login page
 */
function redirectToLogin() {
  const isInPages = window.location.pathname.includes('/pages/');
  const loginUrl = isInPages ? 'login.html' : 'pages/login.html';
  window.location.href = loginUrl;
}

/**
 * Redirect to main page
 */
function redirectToMain() {
  const isInPages = window.location.pathname.includes('/pages/');
  const mainUrl = isInPages ? '../index.html' : 'index.html';
  window.location.href = mainUrl;
}

/**
 * Handle user login
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise} Login result
 */
async function loginUser(email, password) {
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    
    // Check if user exists in inspectors collection
    const inspectorDoc = await db.collection('inspectors').doc(userCredential.user.uid).get();
    
    if (!inspectorDoc.exists) {
      await auth.signOut();
      throw new Error('account-not-found');
    }
    
    const userData = inspectorDoc.data();
    
    // Check if user is active
    if (userData.status !== 'active') {
      await auth.signOut();
      throw new Error('account-disabled');
    }
    
    return userCredential.user;
    
  } catch (error) {
    throw error;
  }
}

/**
 * Handle user logout
 */
async function handleLogout(e) {
  if (e) e.preventDefault();
  
  try {
    await auth.signOut();
    redirectToLogin();
  } catch (error) {
    console.error('Logout error:', error);
    alert('Erreur lors de la déconnexion.');
  }
}

/**
 * Get current user data
 * @returns {Object|null} Current user data
 */
function getCurrentUser() {
  return currentUserData;
}

/**
 * Get current user ID
 * @returns {string|null} Current user ID
 */
function getCurrentUserId() {
  return currentUser ? currentUser.uid : null;
}

/**
 * Check if current user is admin
 * @returns {boolean} True if admin
 */
function isAdmin() {
  return currentUserData && currentUserData.role === 'admin';
}

/**
 * Get Firebase config for secondary app instances
 * @returns {Object} Firebase config
 */
function getFirebaseConfig() {
  return firebaseConfig;
}

// Initialize auth check on page load
document.addEventListener('DOMContentLoaded', checkAuthStatus);