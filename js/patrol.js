/**
 * patrol.js
 * Patrol survey form functionality - FIXED VERSION
 * Fixes: Save functionality, form validation, error handling
 */

class PatrolForm {
  constructor() {
    this.currentInfractionId = null;
    this.isNewReport = true;
    this.photoFile = null;
    this.photoUrl = null;
    
    // Wait for authentication
    document.addEventListener('userAuthenticated', (e) => {
      this.userData = e.detail;
      this.init();
    });
  }
  
  init() {
    console.log('PatrolForm: Initializing...');
    this.bindElements();
    this.bindEvents();
    this.setDefaultValues();
    this.loadUserInfractions();
  }
  
  bindElements() {
    // Form elements
    this.form = document.getElementById('infraction-form');
    this.surveySelector = document.getElementById('survey-selector');
    this.duplicateBtn = document.getElementById('duplicate-btn');
    this.duplicateBtnContainer = document.getElementById('duplicate-btn-container');
    this.saveBtn = document.getElementById('save-btn');
    this.modifyBtn = document.getElementById('modify-btn');
    
    // Form fields
    this.patrolName = document.getElementById('patrol-name');
    this.offenceDate = document.getElementById('offence-date');
    this.offenceTime = document.getElementById('offence-time');
    this.offenderName = document.getElementById('offender-name');
    this.sectorSelect = document.getElementById('sector-select');
    this.trailSelect = document.getElementById('trail-select');
    this.offPiste = document.getElementById('off-piste');
    this.practiceSelect = document.getElementById('practice-select');
    this.offenceType = document.getElementById('offence-type');
    
    // Photo elements
    this.photoInput = document.getElementById('offender-photo');
    this.capturePhotoBtn = document.getElementById('capture-photo-btn');
    this.photoPreviewContainer = document.getElementById('photo-preview-container');
    this.photoPreview = document.getElementById('photo-preview');
    this.removePhotoBtn = document.getElementById('remove-photo-btn');
    
    // Log any missing elements
    const elements = {
      form: this.form,
      surveySelector: this.surveySelector,
      saveBtn: this.saveBtn,
      modifyBtn: this.modifyBtn,
      patrolName: this.patrolName,
      offenceDate: this.offenceDate,
      offenceTime: this.offenceTime,
      offenderName: this.offenderName,
      sectorSelect: this.sectorSelect,
      trailSelect: this.trailSelect,
      practiceSelect: this.practiceSelect,
      offenceType: this.offenceType
    };
    
    for (const [name, element] of Object.entries(elements)) {
      if (!element) {
        console.warn(`PatrolForm: Element '${name}' not found`);
      }
    }
  }
  
  bindEvents() {
    // Survey selector change
    if (this.surveySelector) {
      this.surveySelector.addEventListener('change', (e) => this.handleSurveyChange(e));
    }
    
    // Duplicate button
    if (this.duplicateBtn) {
      this.duplicateBtn.addEventListener('click', () => this.duplicateReport());
    }
    
    // Sector change - populate trails
    if (this.sectorSelect) {
      this.sectorSelect.addEventListener('change', (e) => this.handleSectorChange(e));
    }
    
    // Trail change - enable off-piste checkbox
    if (this.trailSelect) {
      this.trailSelect.addEventListener('change', (e) => this.handleTrailChange(e));
    }
    
    // Photo capture
    if (this.capturePhotoBtn && this.photoInput) {
      this.capturePhotoBtn.addEventListener('click', () => this.photoInput.click());
      this.photoInput.addEventListener('change', (e) => this.handlePhotoSelect(e));
    }
    
    if (this.removePhotoBtn) {
      this.removePhotoBtn.addEventListener('click', () => this.removePhoto());
    }
    
    // Form submission - THIS IS THE KEY FIX
    if (this.form) {
      this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }
    
    // Modify button
    if (this.modifyBtn) {
      this.modifyBtn.addEventListener('click', () => this.handleModify());
    }
    
    console.log('PatrolForm: Events bound');
  }
  
  setDefaultValues() {
    // Set patrol name
    if (this.patrolName && this.userData) {
      this.patrolName.value = this.userData.name || '';
    }
    
    // Set current date and time
    const now = new Date();
    if (this.offenceDate) {
      this.offenceDate.value = now.toISOString().split('T')[0];
    }
    if (this.offenceTime) {
      this.offenceTime.value = now.toTimeString().slice(0, 5);
    }
    
    console.log('PatrolForm: Default values set');
  }
  
  async loadUserInfractions() {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        console.warn('PatrolForm: No user ID available');
        return;
      }
      
      console.log('PatrolForm: Loading infractions for user', userId);
      
      const snapshot = await db.collection('infractions')
        .where('patrolId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();
      
      // Clear existing options except "new"
      if (this.surveySelector) {
        while (this.surveySelector.options.length > 1) {
          this.surveySelector.remove(1);
        }
        
        // Add infractions to selector
        snapshot.forEach(doc => {
          const data = doc.data();
          const date = data.offenceTimestamp ? formatDate(data.offenceTimestamp) : 'N/A';
          const trail = data.trail || 'N/A';
          const option = document.createElement('option');
          option.value = doc.id;
          option.textContent = `${date} - ${trail}`;
          this.surveySelector.appendChild(option);
        });
        
        console.log(`PatrolForm: Loaded ${snapshot.size} infractions`);
      }
      
    } catch (error) {
      console.error('PatrolForm: Error loading infractions:', error);
      showMessage('Erreur lors du chargement des rapports', 'error');
    }
  }
  
  async handleSurveyChange(e) {
    const selectedId = e.target.value;
    
    if (selectedId === 'new') {
      this.resetForm();
      return;
    }
    
    // Load selected infraction
    try {
      const doc = await db.collection('infractions').doc(selectedId).get();
      
      if (doc.exists) {
        this.populateForm(doc.id, doc.data());
      }
      
    } catch (error) {
      console.error('PatrolForm: Error loading infraction:', error);
      showMessage('Erreur lors du chargement du rapport', 'error');
    }
  }
  
  populateForm(id, data) {
    this.currentInfractionId = id;
    this.isNewReport = false;
    
    // Show/hide buttons
    if (this.saveBtn) this.saveBtn.style.display = 'none';
    if (this.modifyBtn) this.modifyBtn.style.display = '';
    if (this.duplicateBtnContainer) this.duplicateBtnContainer.style.display = '';
    
    // Populate fields
    if (data.offenceTimestamp) {
      const date = data.offenceTimestamp.toDate ? data.offenceTimestamp.toDate() : new Date(data.offenceTimestamp);
      if (this.offenceDate) this.offenceDate.value = date.toISOString().split('T')[0];
      if (this.offenceTime) this.offenceTime.value = date.toTimeString().slice(0, 5);
    }
    
    if (this.offenderName) this.offenderName.value = data.offenderName || '';
    
    // Set sector and trail
    if (this.sectorSelect && data.sector) {
      this.sectorSelect.value = data.sector;
      this.handleSectorChange({ target: this.sectorSelect });
      
      // Need small delay for trails to populate
      setTimeout(() => {
        if (this.trailSelect) {
          this.trailSelect.value = data.trail || '';
          this.handleTrailChange({ target: this.trailSelect });
        }
        if (this.offPiste) this.offPiste.checked = data.offPiste || false;
      }, 100);
    }
    
    if (this.practiceSelect) this.practiceSelect.value = data.practice || '';
    if (this.offenceType) this.offenceType.value = data.offenceType || '';
    
    // Handle photo
    if (data.offenderImageUrl) {
      this.photoUrl = data.offenderImageUrl;
      if (this.photoPreview) this.photoPreview.src = data.offenderImageUrl;
      if (this.photoPreviewContainer) this.photoPreviewContainer.style.display = '';
      if (this.capturePhotoBtn) this.capturePhotoBtn.textContent = '📷 Changer la photo';
    }
    
    showMessage('Rapport chargé. Modifiez les champs nécessaires et enregistrez.', 'info');
  }
  
  resetForm() {
    this.currentInfractionId = null;
    this.isNewReport = true;
    this.photoFile = null;
    this.photoUrl = null;
    
    // Show/hide buttons
    if (this.saveBtn) this.saveBtn.style.display = '';
    if (this.modifyBtn) this.modifyBtn.style.display = 'none';
    if (this.duplicateBtnContainer) this.duplicateBtnContainer.style.display = 'none';
    
    // Reset form
    if (this.form) this.form.reset();
    
    // Reset photo
    if (this.photoPreviewContainer) this.photoPreviewContainer.style.display = 'none';
    if (this.capturePhotoBtn) this.capturePhotoBtn.textContent = '📷 Prendre une photo';
    
    // Reset selects
    if (this.trailSelect) {
      this.trailSelect.innerHTML = '<option value="">-- Sélectionner d\'abord un secteur --</option>';
      this.trailSelect.disabled = true;
    }
    if (this.offPiste) {
      this.offPiste.checked = false;
      this.offPiste.disabled = true;
    }
    
    // Set default values again
    this.setDefaultValues();
    
    console.log('PatrolForm: Form reset');
  }
  
  duplicateReport() {
    if (!this.currentInfractionId) return;
    
    // Mark as new report but keep form data
    this.currentInfractionId = null;
    this.isNewReport = true;
    
    // Reset timestamps
    this.setDefaultValues();
    
    // Show/hide buttons
    if (this.saveBtn) this.saveBtn.style.display = '';
    if (this.modifyBtn) this.modifyBtn.style.display = 'none';
    if (this.duplicateBtnContainer) this.duplicateBtnContainer.style.display = 'none';
    
    // Reset survey selector
    if (this.surveySelector) this.surveySelector.value = 'new';
    
    showMessage('Rapport dupliqué. Modifiez si nécessaire puis enregistrez.', 'info');
  }
  
  handleSectorChange(e) {
    const sectorId = e.target.value;
    
    // Reset trail select
    if (this.trailSelect) {
      this.trailSelect.innerHTML = '';
    }
    if (this.offPiste) {
      this.offPiste.checked = false;
      this.offPiste.disabled = true;
    }
    
    if (!sectorId) {
      if (this.trailSelect) {
        this.trailSelect.innerHTML = '<option value="">-- Sélectionner d\'abord un secteur --</option>';
        this.trailSelect.disabled = true;
      }
      return;
    }
    
    // Populate trails for selected sector
    const trails = typeof getTrailsForSector === 'function' ? getTrailsForSector(sectorId) : [];
    
    if (this.trailSelect) {
      this.trailSelect.innerHTML = '<option value="">-- Sélectionner --</option>';
      trails.forEach(trail => {
        const option = document.createElement('option');
        option.value = trail;
        option.textContent = trail;
        this.trailSelect.appendChild(option);
      });
      this.trailSelect.disabled = false;
    }
  }
  
  handleTrailChange(e) {
    const trailValue = e.target.value;
    if (this.offPiste) {
      this.offPiste.disabled = !trailValue;
      if (!trailValue) {
        this.offPiste.checked = false;
      }
    }
  }
  
  async handlePhotoSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      // Compress image
      const compressedBlob = await compressImage(file, 1200, 0.8);
      this.photoFile = new File([compressedBlob], file.name, { type: 'image/jpeg' });
      
      // Show preview
      const reader = new FileReader();
      reader.onload = (e) => {
        if (this.photoPreview) this.photoPreview.src = e.target.result;
        if (this.photoPreviewContainer) this.photoPreviewContainer.style.display = '';
        if (this.capturePhotoBtn) this.capturePhotoBtn.textContent = '📷 Changer la photo';
      };
      reader.readAsDataURL(this.photoFile);
      
    } catch (error) {
      console.error('PatrolForm: Error processing photo:', error);
      showMessage('Erreur lors du traitement de la photo', 'error');
    }
  }
  
  removePhoto() {
    this.photoFile = null;
    this.photoUrl = null;
    if (this.photoInput) this.photoInput.value = '';
    if (this.photoPreviewContainer) this.photoPreviewContainer.style.display = 'none';
    if (this.capturePhotoBtn) this.capturePhotoBtn.textContent = '📷 Prendre une photo';
  }
  
  async uploadPhoto() {
    if (!this.photoFile) return this.photoUrl;
    
    try {
      const timestamp = Date.now();
      const userId = getCurrentUserId();
      const fileName = `infractions/${userId}/${timestamp}_${this.photoFile.name}`;
      const storageRef = storage.ref(fileName);
      
      const snapshot = await storageRef.put(this.photoFile);
      return await snapshot.ref.getDownloadURL();
    } catch (error) {
      console.error('PatrolForm: Error uploading photo:', error);
      throw error;
    }
  }
  
  // Validate form before submission
  validateForm() {
    const errors = [];
    
    if (!this.offenceDate?.value) errors.push('Date requise');
    if (!this.offenceTime?.value) errors.push('Heure requise');
    if (!this.offenderName?.value?.trim()) errors.push('Nom du contrevenant requis');
    if (!this.sectorSelect?.value) errors.push('Secteur requis');
    if (!this.trailSelect?.value) errors.push('Piste requise');
    if (!this.practiceSelect?.value) errors.push('Type de pratique requis');
    if (!this.offenceType?.value?.trim()) errors.push('Description de l\'infraction requise');
    
    if (errors.length > 0) {
      showMessage('Veuillez remplir tous les champs obligatoires: ' + errors.join(', '), 'warning');
      return false;
    }
    
    return true;
  }
  
  // FIXED: Main submit handler
  async handleSubmit(e) {
    e.preventDefault();
    
    console.log('PatrolForm: handleSubmit called, isNewReport:', this.isNewReport);
    
    // Validate form
    if (!this.validateForm()) {
      return;
    }
    
    // Only save if this is a new report
    if (!this.isNewReport) {
      console.log('PatrolForm: Not a new report, use modify button');
      showMessage('Pour modifier un rapport existant, utilisez le bouton "Sauvegarder les modifications"', 'info');
      return;
    }
    
    if (!this.saveBtn) return;
    
    setButtonLoading(this.saveBtn, true);
    
    try {
      console.log('PatrolForm: Saving new infraction...');
      
      // Upload photo if exists
      const photoUrl = await this.uploadPhoto();
      
      // Create offence timestamp
      const offenceDateTime = new Date(`${this.offenceDate.value}T${this.offenceTime.value}`);
      
      // Prepare data
      const infractionData = {
        patrolName: this.userData?.name || this.patrolName?.value || 'Unknown',
        patrolId: getCurrentUserId(),
        offenceTimestamp: firebase.firestore.Timestamp.fromDate(offenceDateTime),
        offenderName: this.offenderName.value.trim(),
        offenderImageUrl: photoUrl || null,
        sector: this.sectorSelect.value,
        trail: this.trailSelect.value,
        offPiste: this.offPiste?.checked || false,
        practice: this.practiceSelect.value,
        offenceType: this.offenceType.value.trim(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        modifiedAt: firebase.firestore.FieldValue.serverTimestamp(),
        archived: false,
        adminComments: '',
        adminModifiedAt: null,
        archivedAt: null
      };
      
      console.log('PatrolForm: Infraction data:', infractionData);
      
      // Save to Firestore
      const docRef = await db.collection('infractions').add(infractionData);
      
      console.log('PatrolForm: Infraction saved with ID:', docRef.id);
      
      showMessage('Rapport enregistré avec succès!', 'success');
      
      // Reload infractions list and reset form
      await this.loadUserInfractions();
      this.resetForm();
      
    } catch (error) {
      console.error('PatrolForm: Error saving infraction:', error);
      showMessage('Erreur lors de l\'enregistrement du rapport: ' + error.message, 'error');
    } finally {
      setButtonLoading(this.saveBtn, false);
    }
  }
  
  async handleModify() {
    if (!this.currentInfractionId) {
      showMessage('Aucun rapport sélectionné', 'warning');
      return;
    }
    
    // Validate form
    if (!this.validateForm()) {
      return;
    }
    
    if (!this.modifyBtn) return;
    
    setButtonLoading(this.modifyBtn, true);
    
    try {
      console.log('PatrolForm: Modifying infraction:', this.currentInfractionId);
      
      // Upload new photo if changed
      let photoUrl = this.photoUrl;
      if (this.photoFile) {
        photoUrl = await this.uploadPhoto();
      }
      
      // Create offence timestamp
      const offenceDateTime = new Date(`${this.offenceDate.value}T${this.offenceTime.value}`);
      
      // Prepare update data
      const updateData = {
        offenceTimestamp: firebase.firestore.Timestamp.fromDate(offenceDateTime),
        offenderName: this.offenderName.value.trim(),
        offenderImageUrl: photoUrl || null,
        sector: this.sectorSelect.value,
        trail: this.trailSelect.value,
        offPiste: this.offPiste?.checked || false,
        practice: this.practiceSelect.value,
        offenceType: this.offenceType.value.trim(),
        modifiedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      // Update in Firestore
      await db.collection('infractions').doc(this.currentInfractionId).update(updateData);
      
      console.log('PatrolForm: Infraction updated');
      
      showMessage('Modifications enregistrées!', 'success');
      
      // Reload infractions list
      await this.loadUserInfractions();
      
    } catch (error) {
      console.error('PatrolForm: Error updating infraction:', error);
      showMessage('Erreur lors de la modification: ' + error.message, 'error');
    } finally {
      setButtonLoading(this.modifyBtn, false);
    }
  }
}

// Initialize patrol form
const patrolForm = new PatrolForm();
