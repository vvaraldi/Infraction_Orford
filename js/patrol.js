/**
 * patrol.js
 * Patrol survey form functionality
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
    this.faultSelect = document.getElementById('fault-select'); // NEW: Fault dropdown
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
  }
  
  bindEvents() {
    // Survey selector change
    this.surveySelector.addEventListener('change', (e) => this.handleSurveyChange(e));
    
    // Duplicate button
    this.duplicateBtn.addEventListener('click', () => this.duplicateReport());
    
    // Sector change - populate trails
    this.sectorSelect.addEventListener('change', (e) => this.handleSectorChange(e));
    
    // Trail change - enable off-piste checkbox
    this.trailSelect.addEventListener('change', (e) => this.handleTrailChange(e));
    
    // Photo capture
    this.capturePhotoBtn.addEventListener('click', () => this.photoInput.click());
    this.photoInput.addEventListener('change', (e) => this.handlePhotoSelect(e));
    this.removePhotoBtn.addEventListener('click', () => this.removePhoto());
    
    // Form submission
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    this.modifyBtn.addEventListener('click', () => this.handleModify());
  }
  
  setDefaultValues() {
    // Set patrol name
    this.patrolName.value = this.userData.name || '';
    
    // Set current date and time
    const now = new Date();
    this.offenceDate.value = now.toISOString().split('T')[0];
    this.offenceTime.value = now.toTimeString().slice(0, 5);
  }
  
  async loadUserInfractions() {
    try {
      const userId = getCurrentUserId();
      const snapshot = await db.collection('infractions')
        .where('patrolId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();
      
      // Clear existing options except "new"
      while (this.surveySelector.options.length > 1) {
        this.surveySelector.remove(1);
      }
      
      // Add infractions to selector
      snapshot.forEach(doc => {
        const data = doc.data();
        const date = data.offenceTimestamp ? formatDate(data.offenceTimestamp) : 'N/A';
        const sectorName = this.getSectorDisplayName(data.sector) || 'N/A';
        const option = document.createElement('option');
        option.value = doc.id;
        option.textContent = `${date} - ${sectorName}`;
        this.surveySelector.appendChild(option);
      });
      
    } catch (error) {
      console.error('Error loading infractions:', error);
      showMessage('Erreur lors du chargement des rapports', 'error');
    }
  }
  
  /**
   * Get display name for sector
   * @param {string} sectorId - Sector ID
   * @returns {string} Display name
   */
  getSectorDisplayName(sectorId) {
    const sectors = {
      'mont-orford': 'Mont-Orford',
      'giroux-nord': 'Mont Giroux Nord',
      'giroux-est': 'Mont Giroux Est',
      'alfred-desrochers': 'Mont Alfred-DesRochers',
      'remontees': 'Remontées mécaniques',
      'randonnee-alpine': 'Randonnée alpine'
    };
    return sectors[sectorId] || sectorId || '';
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
      console.error('Error loading infraction:', error);
      showMessage('Erreur lors du chargement du rapport', 'error');
    }
  }
  
  populateForm(id, data) {
    this.currentInfractionId = id;
    this.isNewReport = false;
    
    // Show/hide buttons
    this.saveBtn.style.display = 'none';
    this.modifyBtn.style.display = '';
    this.duplicateBtnContainer.style.display = '';
    
    // Populate fields
    if (data.offenceTimestamp) {
      const date = data.offenceTimestamp.toDate ? data.offenceTimestamp.toDate() : new Date(data.offenceTimestamp);
      this.offenceDate.value = date.toISOString().split('T')[0];
      this.offenceTime.value = date.toTimeString().slice(0, 5);
    }
    
    this.offenderName.value = data.offenderName || '';
    
    // Populate fault select (NEW)
    if (this.faultSelect) {
      this.faultSelect.value = data.fault || '';
    }
    
    // Populate sector and trail
    if (data.sector) {
      this.sectorSelect.value = data.sector;
      this.handleSectorChange({ target: this.sectorSelect });
      
      // Wait a tick for trails to load, then set trail
      setTimeout(() => {
        if (data.trail) {
          this.trailSelect.value = data.trail;
          this.handleTrailChange({ target: this.trailSelect });
        }
        if (data.offPiste) {
          this.offPiste.checked = true;
        }
      }, 100);
    }
    
    this.practiceSelect.value = data.practice || '';
    this.offenceType.value = data.offenceType || '';
    
    // Handle photo
    if (data.offenderImageUrl) {
      this.photoUrl = data.offenderImageUrl;
      this.photoPreview.src = data.offenderImageUrl;
      this.photoPreviewContainer.style.display = '';
      this.capturePhotoBtn.textContent = '📷 Changer la photo';
    } else {
      this.removePhoto();
    }
    
    showMessage('Rapport chargé. Modifiez les champs nécessaires et enregistrez.', 'info');
  }
  
  handleSectorChange(e) {
    const sectorId = e.target.value;
    
    // Reset trail select
    this.trailSelect.innerHTML = '';
    this.offPiste.checked = false;
    this.offPiste.disabled = true;
    
    if (!sectorId) {
      this.trailSelect.innerHTML = '<option value="">-- Sélectionner d\'abord un secteur --</option>';
      this.trailSelect.disabled = true;
      return;
    }
    
    // Populate trails for selected sector
    const trails = getTrailsForSector(sectorId);
    
    this.trailSelect.innerHTML = '<option value="">-- Sélectionner (optionnel) --</option>';
    trails.forEach(trail => {
      const option = document.createElement('option');
      option.value = trail;
      option.textContent = trail;
      this.trailSelect.appendChild(option);
    });
    
    this.trailSelect.disabled = false;
  }
  
  handleTrailChange(e) {
    const trailValue = e.target.value;
    this.offPiste.disabled = !trailValue;
    if (!trailValue) {
      this.offPiste.checked = false;
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
        this.photoPreview.src = e.target.result;
        this.photoPreviewContainer.style.display = '';
        this.capturePhotoBtn.textContent = '📷 Changer la photo';
      };
      reader.readAsDataURL(this.photoFile);
      
    } catch (error) {
      console.error('Error processing photo:', error);
      showMessage('Erreur lors du traitement de la photo', 'error');
    }
  }
  
  removePhoto() {
    this.photoFile = null;
    this.photoUrl = null;
    this.photoInput.value = '';
    this.photoPreviewContainer.style.display = 'none';
    this.capturePhotoBtn.textContent = '📷 Prendre une photo';
  }
  
  async uploadPhoto() {
    if (!this.photoFile) return this.photoUrl;
    
    const timestamp = Date.now();
    const fileName = `infractions/${getCurrentUserId()}/${timestamp}_${this.photoFile.name}`;
    const storageRef = storage.ref(fileName);
    
    const snapshot = await storageRef.put(this.photoFile);
    return await snapshot.ref.getDownloadURL();
  }
  
  /**
   * Get display name for fault type
   * @param {string} faultId - Fault ID
   * @returns {string} Display name
   */
  getFaultDisplayName(faultId) {
    const faults = {
      'downhill': 'Downhill',
      'saut-dangereux': 'Saut dangereux',
      'ski-hors-piste': 'Ski hors piste',
      'ski-piste-fermee': 'Ski piste fermée',
      'saut-des-chaises': 'Saut des chaises',
      'manoeuvre-dangereuse': 'Manoeuvre dangereuse',
      'autres': 'Autres (voir commentaire)'
    };
    return faults[faultId] || faultId;
  }
  
  /**
   * Validate the form - date, time, offender name, fault, and sector are required
   */
  validateForm() {
    let isValid = true;
    const errors = [];
    
    // Check date (required)
    if (!this.offenceDate.value) {
      isValid = false;
      errors.push('La date est requise');
      this.offenceDate.classList.add('is-invalid');
    } else {
      this.offenceDate.classList.remove('is-invalid');
    }
    
    // Check time (required)
    if (!this.offenceTime.value) {
      isValid = false;
      errors.push('L\'heure est requise');
      this.offenceTime.classList.add('is-invalid');
    } else {
      this.offenceTime.classList.remove('is-invalid');
    }
    
    // Check offender name (required)
    if (!this.offenderName.value.trim()) {
      isValid = false;
      errors.push('Le prénom et nom du contrevenant est requis');
      this.offenderName.classList.add('is-invalid');
    } else {
      this.offenderName.classList.remove('is-invalid');
    }
    
    // Check fault type (required)
    if (!this.faultSelect.value) {
      isValid = false;
      errors.push('Le type d\'infraction est requis');
      this.faultSelect.classList.add('is-invalid');
    } else {
      this.faultSelect.classList.remove('is-invalid');
    }
    
    // Check sector (required)
    if (!this.sectorSelect.value) {
      isValid = false;
      errors.push('Le secteur est requis');
      this.sectorSelect.classList.add('is-invalid');
    } else {
      this.sectorSelect.classList.remove('is-invalid');
    }
    
    // Show errors if any
    if (!isValid) {
      showMessage(errors.join('<br>'), 'error');
    }
    
    return isValid;
  }
  
  async handleSubmit(e) {
    e.preventDefault();
    
    if (!this.isNewReport) return;
    
    // Validate form
    if (!this.validateForm()) {
      return;
    }
    
    setButtonLoading(this.saveBtn, true);
    
    try {
      // Upload photo if exists
      const photoUrl = await this.uploadPhoto();
      
      // Combine date and time
      const offenceDateTime = new Date(`${this.offenceDate.value}T${this.offenceTime.value}`);
      
      // Prepare data
      const infractionData = {
        patrolId: getCurrentUserId(),
        patrolName: this.userData.name,
        offenceTimestamp: firebase.firestore.Timestamp.fromDate(offenceDateTime),
        offenderName: this.offenderName.value.trim(),
        offenderImageUrl: photoUrl || null,
        fault: this.faultSelect.value, // NEW: Fault field
        faultDisplayName: this.getFaultDisplayName(this.faultSelect.value), // NEW: Display name for easier reading
        sector: this.sectorSelect.value || null,
        trail: this.trailSelect.value || null,
        offPiste: this.offPiste.checked,
        practice: this.practiceSelect.value || null,
        offenceType: this.offenceType.value.trim() || null,
        archived: false,
        adminComments: null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        modifiedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      // Save to Firestore
      const docRef = await db.collection('infractions').add(infractionData);
      
      showMessage('Rapport enregistré avec succès!', 'success');
      
      // Reset form
      this.resetForm();
      
      // Reload infractions list
      await this.loadUserInfractions();
      
    } catch (error) {
      console.error('Error saving infraction:', error);
      showMessage('Erreur lors de l\'enregistrement du rapport: ' + error.message, 'error');
    } finally {
      setButtonLoading(this.saveBtn, false);
    }
  }
  
  async handleModify() {
    if (!this.currentInfractionId) return;
    
    // Validate form
    if (!this.validateForm()) {
      return;
    }
    
    setButtonLoading(this.modifyBtn, true);
    
    try {
      // Upload new photo if exists
      const photoUrl = await this.uploadPhoto();
      
      // Combine date and time
      const offenceDateTime = new Date(`${this.offenceDate.value}T${this.offenceTime.value}`);
      
      // Prepare update data
      const updateData = {
        offenceTimestamp: firebase.firestore.Timestamp.fromDate(offenceDateTime),
        offenderName: this.offenderName.value.trim(),
        offenderImageUrl: photoUrl || this.photoUrl || null,
        fault: this.faultSelect.value, // NEW: Fault field
        faultDisplayName: this.getFaultDisplayName(this.faultSelect.value), // NEW: Display name
        sector: this.sectorSelect.value || null,
        trail: this.trailSelect.value || null,
        offPiste: this.offPiste.checked,
        practice: this.practiceSelect.value || null,
        offenceType: this.offenceType.value.trim() || null,
        modifiedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      // Update in Firestore
      await db.collection('infractions').doc(this.currentInfractionId).update(updateData);
      
      showMessage('Modifications enregistrées!', 'success');
      
      // Reload infractions list
      await this.loadUserInfractions();
      
    } catch (error) {
      console.error('Error updating infraction:', error);
      showMessage('Erreur lors de la modification', 'error');
    } finally {
      setButtonLoading(this.modifyBtn, false);
    }
  }
  
  duplicateReport() {
    // Keep form data but reset for new report
    this.currentInfractionId = null;
    this.isNewReport = true;
    
    // Reset timestamps
    const now = new Date();
    this.offenceDate.value = now.toISOString().split('T')[0];
    this.offenceTime.value = now.toTimeString().slice(0, 5);
    
    // Show/hide buttons
    this.saveBtn.style.display = '';
    this.modifyBtn.style.display = 'none';
    this.duplicateBtnContainer.style.display = 'none';
    
    // Reset selector
    this.surveySelector.value = 'new';
    
    showMessage('Rapport dupliqué. Modifiez si nécessaire et enregistrez.', 'info');
  }
  
  resetForm() {
    this.currentInfractionId = null;
    this.isNewReport = true;
    
    // Show/hide buttons
    this.saveBtn.style.display = '';
    this.modifyBtn.style.display = 'none';
    this.duplicateBtnContainer.style.display = 'none';
    
    // Reset selector
    this.surveySelector.value = 'new';
    
    // Reset fields
    this.setDefaultValues();
    this.offenderName.value = '';
    this.faultSelect.value = ''; // NEW: Reset fault select
    this.sectorSelect.value = '';
    this.trailSelect.innerHTML = '<option value="">-- Sélectionner d\'abord un secteur --</option>';
    this.trailSelect.disabled = true;
    this.offPiste.checked = false;
    this.offPiste.disabled = true;
    this.practiceSelect.value = '';
    this.offenceType.value = '';
    
    // Reset photo
    this.removePhoto();
    
    // Remove validation classes
    this.offenceDate.classList.remove('is-invalid');
    this.offenceTime.classList.remove('is-invalid');
    this.offenderName.classList.remove('is-invalid');
    this.faultSelect.classList.remove('is-invalid');
    this.sectorSelect.classList.remove('is-invalid');
  }
}

// Initialize patrol form
const patrolForm = new PatrolForm();