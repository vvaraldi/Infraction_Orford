/**
 * login.js
 * Login page functionality for Infractions system
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log('Login page loaded');
  
  const loginForm = document.getElementById('login-form');
  const errorMessage = document.getElementById('error-message');
  const successMessage = document.getElementById('success-message');
  
  if (!loginForm) {
    console.error('Login form not found!');
    return;
  }
  
  console.log('Login form found');
  
  // Check if already logged in
  if (typeof auth !== 'undefined') {
    auth.onAuthStateChanged(function(user) {
      if (user) {
        console.log('User already logged in, redirecting...');
        // Already logged in, redirect to main page
        window.location.href = '../index.html';
      }
    });
  }
  
  // Handle form submission
  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    console.log('Form submitted');
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    
    console.log('Attempting login for:', email);
    
    // Hide previous messages
    if (errorMessage) errorMessage.style.display = 'none';
    if (successMessage) successMessage.style.display = 'none';
    
    // Show loading state
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Connexion...';
    }
    
    try {
      // Login using the global loginUser function from auth.js
      await loginUser(email, password);
      
      console.log('Login successful!');
      
      // Show success message
      if (successMessage) {
        successMessage.textContent = 'Connexion réussie! Redirection...';
        successMessage.style.display = 'block';
      }
      
      // Redirect to main page after a short delay
      setTimeout(() => {
        window.location.href = '../index.html';
      }, 1000);
      
    } catch (error) {
      console.error('Login error:', error);
      
      // Reset button
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Se connecter';
      }
      
      // Show error message
      if (errorMessage) {
        errorMessage.style.display = 'block';
        
        switch (error.code || error.message) {
          case 'auth/user-not-found':
            errorMessage.textContent = 'Aucun compte trouvé avec cette adresse courriel.';
            break;
          case 'auth/wrong-password':
            errorMessage.textContent = 'Mot de passe incorrect.';
            break;
          case 'auth/invalid-email':
            errorMessage.textContent = 'Adresse courriel invalide.';
            break;
          case 'auth/too-many-requests':
            errorMessage.textContent = 'Trop de tentatives. Réessayez plus tard.';
            break;
          case 'auth/invalid-credential':
            errorMessage.textContent = 'Email ou mot de passe incorrect.';
            break;
          case 'account-disabled':
            errorMessage.textContent = 'Votre compte a été désactivé. Contactez l\'administrateur.';
            break;
          case 'account-not-found':
            errorMessage.textContent = 'Compte non configuré. Contactez l\'administrateur.';
            break;
          default:
            errorMessage.textContent = 'Erreur de connexion: ' + (error.message || 'Vérifiez vos identifiants.');
        }
      }
    }
  });
  
  console.log('Login form handler attached');
});