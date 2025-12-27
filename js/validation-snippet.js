/**
 * VALIDATION SNIPPET FOR infraction-form.js
 * 
 * Add this validation function to your existing infraction-form.js
 * This validates that either a photo OR an offender name is provided
 */

/**
 * Validate that either photo or offender name is provided
 * @returns {boolean} True if valid
 */
function validatePhotoOrName() {
  const photoInput = document.getElementById('photo-input');
  const offenderName = document.getElementById('offender-name');
  const validationError = document.getElementById('validation-error');
  
  const hasPhoto = photoInput && photoInput.files && photoInput.files.length > 0;
  const hasName = offenderName && offenderName.value.trim() !== '';
  
  // Also check if there's an existing photo (for editing existing reports)
  const previewImage = document.getElementById('preview-image');
  const hasExistingPhoto = previewImage && previewImage.src && previewImage.src !== '' && previewImage.src !== window.location.href;
  
  if (!hasPhoto && !hasExistingPhoto && !hasName) {
    // Show error
    if (validationError) {
      validationError.textContent = 'Veuillez fournir soit une photo, soit le nom du contrevenant (ou les deux).';
      validationError.style.display = 'block';
    }
    
    // Highlight the fields
    if (photoInput) photoInput.classList.add('is-invalid');
    if (offenderName) offenderName.classList.add('is-invalid');
    
    return false;
  }
  
  // Clear error
  if (validationError) {
    validationError.style.display = 'none';
  }
  
  // Remove highlights
  if (photoInput) photoInput.classList.remove('is-invalid');
  if (offenderName) offenderName.classList.remove('is-invalid');
  
  return true;
}

/**
 * INTEGRATION INSTRUCTIONS:
 * 
 * 1. Add this function to your existing infraction-form.js
 * 
 * 2. In your form submit handler, add this validation:
 * 
 *    async function handleFormSubmit(e) {
 *      e.preventDefault();
 *      
 *      // Validate photo or name
 *      if (!validatePhotoOrName()) {
 *        return; // Stop submission
 *      }
 *      
 *      // ... rest of your existing validation and submission code
 *    }
 * 
 * 3. Optionally, add real-time validation when fields change:
 * 
 *    document.getElementById('photo-input').addEventListener('change', validatePhotoOrName);
 *    document.getElementById('offender-name').addEventListener('input', validatePhotoOrName);
 * 
 * 4. Add CSS for invalid state:
 * 
 *    .is-invalid {
 *      border-color: #dc2626 !important;
 *      box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1) !important;
 *    }
 */

// Example of integrating into existing form handler
// (This is how you would modify your existing code)

/*
// Find your existing form submit handler and add the validation:

document.getElementById('infraction-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  // NEW: Validate photo or name requirement
  if (!validatePhotoOrName()) {
    return;
  }
  
  // ... existing validation code ...
  
  // ... existing submission code ...
});
*/
