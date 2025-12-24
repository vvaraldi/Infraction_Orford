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

// Firebase services - initialize immediately (scripts are loaded in order)
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Current user data
let currentUser = null;
let currentUserData = null;

/**
 * Check authentication status and handle redirects
 * UPDATED: Now checks for allowInfraction access
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
            showAccessDenied('Votre compte a été désactivé. Contactez l\'administrateur.');
            await auth.signOut();
            return;
          }
          
          // NEW: Check if user has infraction access
          if (currentUserData.allowInfraction !== true) {
            showAccessDenied('Vous n\'avez pas accès au système d\'infractions. Contactez l\'administrateur.');
            await auth.signOut();
            return;
          }
          
          // User is authorized - show content
          if (loading) loading.style.display = 'none';
          if (mainContent) mainContent.style.display = 'block';
          
          // Update UI based on role
          updateUIForRole(currentUserData.role);
          
          // Dispatch authenticated event
          document.dispatchEvent(new CustomEvent('userAuthenticated', {
            detail: currentUserData
          }));
          
        } else {
          // User not found in inspectors collection
          showAccessDenied('Utilisateur non trouvé. Contactez l\'administrateur.');
          await auth.signOut();
        }
        
      } catch (error) {
        console.error('Error checking auth status:', error);
        showAccessDenied('Erreur lors de la vérification des accès.');
        await auth.signOut();
      }
      
    } else {
      // Not logged in - redirect to login
      currentUser = null;
      currentUserData = null;
      
      // Check if we're already on the login page
      if (!window.location.pathname.includes('login.html')) {
        redirectToLogin();
      }
    }
  });
}

/**
 * Update UI elements based on user role
 */
function updateUIForRole(role) {
  const adminLink = document.getElementById('admin-link');
  const mobileAdminLink = document.getElementById('mobile-admin-link');
  const loginLink = document.getElementById('login-link');
  const mobileLoginLink = document.getElementById('mobile-login-link');
  
  // Show admin link for admins
  if (role === 'admin') {
    if (adminLink) adminLink.style.display = 'block';
    if (mobileAdminLink) mobileAdminLink.style.display = 'block';
  }
  
  // Update login links to logout
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
}

/**
 * Display access denied message and redirect
 */
function showAccessDenied(message) {
  const loading = document.getElementById('loading');
  const mainContent = document.getElementById('main-content');
  
  // Hide loading and main content
  if (loading) loading.style.display = 'none';
  if (mainContent) mainContent.style.display = 'none';
  
  // Show alert
  alert(message);
  
  // Redirect to login
  redirectToLogin();
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
    
    // Check if user has infraction access
    if (userData.allowInfraction !== true) {
      await auth.signOut();
      throw new Error('no-infraction-access');
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
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, checking auth status...');
  checkAuthStatus();
});