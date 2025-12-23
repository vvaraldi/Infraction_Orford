/**
 * common.js
 * Shared utilities and mobile menu functionality
 */

// Mobile menu functionality
document.addEventListener('DOMContentLoaded', function() {
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileNav = document.getElementById('mobile-nav');
  const mobileNavClose = document.getElementById('mobile-nav-close');

  if (mobileMenuBtn && mobileNav) {
    mobileMenuBtn.addEventListener('click', function() {
      mobileNav.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  }

  if (mobileNavClose && mobileNav) {
    mobileNavClose.addEventListener('click', function() {
      mobileNav.classList.remove('active');
      document.body.style.overflow = '';
    });
  }

  // Close mobile nav when clicking outside
  if (mobileNav) {
    mobileNav.addEventListener('click', function(e) {
      if (e.target === mobileNav) {
        mobileNav.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }
});

/**
 * Format date for display
 * @param {Date|Object} date - Date object or Firestore timestamp
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  if (!date) return '-';
  
  // Handle Firestore timestamp
  if (date.toDate) {
    date = date.toDate();
  }
  
  // Handle string dates
  if (typeof date === 'string') {
    date = new Date(date);
  }
  
  return date.toLocaleDateString('fr-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

/**
 * Format time for display
 * @param {Date|Object} date - Date object or Firestore timestamp
 * @returns {string} Formatted time string
 */
function formatTime(date) {
  if (!date) return '-';
  
  if (date.toDate) {
    date = date.toDate();
  }
  
  if (typeof date === 'string') {
    date = new Date(date);
  }
  
  return date.toLocaleTimeString('fr-CA', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format date and time for display
 * @param {Date|Object} date - Date object or Firestore timestamp
 * @returns {string} Formatted date and time string
 */
function formatDateTime(date) {
  if (!date) return '-';
  return `${formatDate(date)} ${formatTime(date)}`;
}

/**
 * Show a status message
 * @param {string} message - Message to display
 * @param {string} type - Message type: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Duration in ms (0 for permanent)
 */
function showMessage(message, type = 'info', duration = 5000) {
  const container = document.getElementById('status-messages');
  if (!container) return;
  
  const alert = document.createElement('div');
  alert.className = `alert alert-${type === 'error' ? 'danger' : type}`;
  alert.textContent = message;
  
  container.appendChild(alert);
  
  if (duration > 0) {
    setTimeout(() => {
      alert.remove();
    }, duration);
  }
  
  return alert;
}

/**
 * Show loading state on a button
 * @param {HTMLButtonElement} button - Button element
 * @param {boolean} loading - Whether to show loading state
 */
function setButtonLoading(button, loading) {
  if (loading) {
    button.disabled = true;
    button.dataset.originalText = button.textContent;
    button.textContent = 'Chargement...';
    button.classList.add('loading');
  } else {
    button.disabled = false;
    button.textContent = button.dataset.originalText || button.textContent;
    button.classList.remove('loading');
  }
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Get practice display name
 * @param {string} practiceId - Practice ID
 * @returns {string} Display name
 */
function getPracticeName(practiceId) {
  const practices = {
    'ski-alpin': 'Ski alpin',
    'planche': 'Planche à neige',
    'randonnee-alpine': 'Randonnée alpine',
    'randonnee-pedestre': 'Randonnée pédestre',
    'autre': 'Autre'
  };
  return practices[practiceId] || practiceId;
}

/**
 * Compress image before upload
 * @param {File} file - Image file
 * @param {number} maxWidth - Maximum width
 * @param {number} quality - JPEG quality (0-1)
 * @returns {Promise<Blob>} Compressed image blob
 */
function compressImage(file, maxWidth = 1200, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(resolve, 'image/jpeg', quality);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}