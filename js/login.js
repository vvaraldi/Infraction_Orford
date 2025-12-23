/**
 * login.js
 * Login page functionality
 */

document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginForm');
  const errorMessage = document.getElementById('error-message');
  const successMessage = document.getElementById('success-message');
  
  // Check if already logged in
  auth.onAuthStateChanged(function(user) {
    if (user) {
      // Already logged in, redirect to main page
      window.location.href = '../index.html';
    }
  });
  
  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      
      // Hide previous messages
      if (errorMessage) errorMessage.style.display = 'none';
      if (successMessage) successMessage.style.display = 'none';
      
      // Show loading state
      setButtonLoading(submitBtn, true);
      
      try {
        await loginUser(email, password);
        
        // Show success message
        if (successMessage) {
          successMessage.textContent = 'Connexion réussie! Redirection...';
          successMessage.style.display = 'block';
        }
        
        // Redirect to main page
        setTimeout(() => {
          window.location.href = '../index.html';
        }, 500);
        
      } catch (error) {
        console.error('Login error:', error);
        
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
            case 'account-disabled':
              errorMessage.textContent = 'Votre compte a été désactivé. Contactez l\'administrateur.';
              break;
            case 'account-not-found':
              errorMessage.textContent = 'Compte non configuré. Contactez l\'administrateur.';
              break;
            default:
              errorMessage.textContent = 'Erreur de connexion. Vérifiez vos identifiants.';
          }
        }
        
        setButtonLoading(submitBtn, false);
      }
    });
  }
});