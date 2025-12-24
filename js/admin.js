/**
 * admin-infraction-only.js
 * Admin panel functionality for managing infractions ONLY
 * User management is handled by the Inspection project
 */

class AdminManager {
  constructor() {
    this.currentInfractionId = null;
    this.showArchived = false;
    this.sortBy = 'date'; // 'date' or 'offender'
    this.infractionsData = []; // Store fetched infractions for client-side sorting
    
    // Wait for authentication
    document.addEventListener('userAuthenticated', (e) => {
      this.userData = e.detail;
      
      // Check if user is admin
      if (this.userData.role !== 'admin') {
        alert('Accès non autorisé. Vous devez être administrateur.');
        window.location.href = '../index.html';
        return;
      }
      
      this.init();
    });
  }
  
  init() {
    this.bindElements();
    this.bindEvents();
    this.loadInfractions();
  }
  
  bindElements() {
    // Infractions
    this.infractionsTbody = document.getElementById('infractions-tbody');
    this.showArchivedCheckbox = document.getElementById('show-archived');
    this.sortBySelect = document.getElementById('sort-by');
    
    // Infraction modal
    this.infractionModal = document.getElementById('infraction-modal');
    this.infractionModalBody = document.getElementById('infraction-modal-body');
    this.closeInfractionModal = document.getElementById('close-infraction-modal');
    this.closeInfractionBtn = document.getElementById('close-infraction-btn');
    this.archiveBtn = document.getElementById('archive-btn');
    this.saveSanctionBtn = document.getElementById('save-sanction-btn');
  }
  
  bindEvents() {
    // Infraction controls
    if (this.showArchivedCheckbox) {
      this.showArchivedCheckbox.addEventListener('change', () => {
        this.showArchived = this.showArchivedCheckbox.checked;
        this.loadInfractions();
      });
    }
    
    if (this.sortBySelect) {
      this.sortBySelect.addEventListener('change', () => {
        this.sortBy = this.sortBySelect.value;
        this.renderInfractions();
      });
    }
    
    // Modal controls
    if (this.closeInfractionModal) {
      this.closeInfractionModal.addEventListener('click', () => this.hideInfractionModal());
    }
    
    if (this.closeInfractionBtn) {
      this.closeInfractionBtn.addEventListener('click', () => this.hideInfractionModal());
    }
    
    if (this.archiveBtn) {
      this.archiveBtn.addEventListener('click', () => this.archiveInfraction());
    }
    
    if (this.saveSanctionBtn) {
      this.saveSanctionBtn.addEventListener('click', () => this.saveSanction());
    }
    
    // Close modal on overlay click
    if (this.infractionModal) {
      const overlay = this.infractionModal.querySelector('.modal-overlay');
      if (overlay) {
        overlay.addEventListener('click', () => this.hideInfractionModal());
      }
      
      // Also close when clicking on the modal background (fallback)
      this.infractionModal.addEventListener('click', (e) => {
        if (e.target === this.infractionModal) {
          this.hideInfractionModal();
        }
      });
    }
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
    return faults[faultId] || faultId || '-';
  }
  
  // ==================== INFRACTIONS ====================
  
  async loadInfractions() {
    try {
      // Always fetch by createdAt descending, then sort client-side
      let query = db.collection('infractions').orderBy('createdAt', 'desc');
      
      if (!this.showArchived) {
        query = query.where('archived', '==', false);
      }
      
      const snapshot = await query.get();
      
      // Store data for client-side sorting
      this.infractionsData = [];
      snapshot.forEach(doc => {
        this.infractionsData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Render with current sort
      this.renderInfractions();
      
    } catch (error) {
      console.error('Error loading infractions:', error);
      if (this.infractionsTbody) {
        this.infractionsTbody.innerHTML = `
          <tr>
            <td colspan="7" class="text-center text-danger">Erreur de chargement: ${error.message}</td>
          </tr>
        `;
      }
    }
  }
  
  /**
   * Sort and render infractions based on current sort selection
   */
  renderInfractions() {
    if (!this.infractionsTbody) return;
    
    if (this.infractionsData.length === 0) {
      this.infractionsTbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center">Aucune infraction trouvée</td>
        </tr>
      `;
      return;
    }
    
    // Sort data based on sortBy
    let sortedData = [...this.infractionsData];
    
    if (this.sortBy === 'date') {
      // Sort by date descending (newest first)
      sortedData.sort((a, b) => {
        const dateA = a.offenceTimestamp ? (a.offenceTimestamp.toDate ? a.offenceTimestamp.toDate() : new Date(a.offenceTimestamp)) : new Date(0);
        const dateB = b.offenceTimestamp ? (b.offenceTimestamp.toDate ? b.offenceTimestamp.toDate() : new Date(b.offenceTimestamp)) : new Date(0);
        return dateB - dateA; // Descending (newest first)
      });
    } else if (this.sortBy === 'offender') {
      // Sort by offender name alphabetically (A → Z)
      sortedData.sort((a, b) => {
        const nameA = (a.offenderName || '').toLowerCase();
        const nameB = (b.offenderName || '').toLowerCase();
        return nameA.localeCompare(nameB, 'fr'); // Alphabetical A-Z
      });
    }
    
    // Build HTML - Updated to show fault instead of offenceType in the list
    let html = '';
    sortedData.forEach(data => {
      const date = formatDate(data.offenceTimestamp);
      const location = data.trail ? `${data.trail}${data.offPiste ? ' (HP)' : ''}` : '-';
      const status = data.archived ? 
        '<span class="badge badge-secondary">Archivé</span>' : 
        '<span class="badge badge-warning">En cours</span>';
      
      // Use faultDisplayName if available, otherwise use getFaultDisplayName
      const faultDisplay = data.faultDisplayName || this.getFaultDisplayName(data.fault);
      
      html += `
        <tr class="clickable-row" data-id="${data.id}">
          <td>${date}</td>
          <td>${escapeHtml(data.offenderName) || '-'}</td>
          <td>${escapeHtml(faultDisplay)}</td>
          <td>${escapeHtml(location)}</td>
          <td>${escapeHtml(data.patrolName) || '-'}</td>
          <td>${status}</td>
          <td>
            <button class="btn btn-sm btn-primary" onclick="adminManager.viewInfraction('${data.id}')">
              Voir
            </button>
          </td>
        </tr>
      `;
    });
    
    this.infractionsTbody.innerHTML = html;
  }
  
  async viewInfraction(id) {
    try {
      const doc = await db.collection('infractions').doc(id).get();
      
      if (!doc.exists) {
        alert('Infraction non trouvée');
        return;
      }
      
      this.currentInfractionId = id;
      const data = doc.data();
      
      // Build modal content
      const date = formatDate(data.offenceTimestamp);
      const location = data.trail ? `${data.trail}${data.offPiste ? ' (HP)' : ''}` : '-';
      
      // Use faultDisplayName if available, otherwise use getFaultDisplayName
      const faultDisplay = data.faultDisplayName || this.getFaultDisplayName(data.fault);
      
      let imageHtml = '';
      if (data.offenderImageUrl) {
        imageHtml = `<img src="${data.offenderImageUrl}" alt="Photo" class="infraction-photo">`;
      } else {
        imageHtml = '<p class="text-muted">Aucune photo</p>';
      }
      
      if (this.infractionModalBody) {
        this.infractionModalBody.innerHTML = `
          <div class="infraction-details">
            <div class="detail-section">
              <h4>Informations générales</h4>
              <p><strong>Date:</strong> ${date}</p>
              <p><strong>Contrevenant:</strong> ${escapeHtml(data.offenderName) || '-'}</p>
              <p><strong>Type d'infraction:</strong> ${escapeHtml(faultDisplay)}</p>
              <p><strong>Lieu:</strong> ${escapeHtml(location)}</p>
              <p><strong>Pratique:</strong> ${escapeHtml(data.practice) || '-'}</p>
              <p><strong>Patrouilleur:</strong> ${escapeHtml(data.patrolName) || '-'}</p>
              <p><strong>Créé le:</strong> ${formatDate(data.createdAt)}</p>
              ${data.modifiedAt ? `<p><strong>Modifié le:</strong> ${formatDate(data.modifiedAt)}</p>` : ''}
            </div>
            
            ${data.offenceType ? `
            <div class="detail-section">
              <h4>Commentaires / Description</h4>
              <div class="infraction-description">${escapeHtml(data.offenceType)}</div>
            </div>
            ` : ''}
            
            <div class="detail-section">
              <h4>Photo</h4>
              <div class="photos-grid">
                ${imageHtml}
              </div>
            </div>
            
            <div class="detail-section">
              <h4>Sanction et commentaires administratifs</h4>
              <textarea id="admin-comments" class="form-control form-textarea" rows="4" 
                        placeholder="Entrez les commentaires et sanctions...">${escapeHtml(data.commentsAndSanctionAdmin) || ''}</textarea>
              ${data.timestampModificationAdmin ? 
                `<p class="text-muted mt-2">Dernière modification admin: ${formatDate(data.timestampModificationAdmin)}</p>` : 
                ''}
            </div>
          </div>
        `;
      }
      
      // Update archive button
      if (this.archiveBtn) {
        if (data.archived) {
          this.archiveBtn.textContent = 'Désarchiver';
          this.archiveBtn.classList.remove('btn-warning');
          this.archiveBtn.classList.add('btn-secondary');
        } else {
          this.archiveBtn.textContent = 'Archiver';
          this.archiveBtn.classList.remove('btn-secondary');
          this.archiveBtn.classList.add('btn-warning');
        }
      }
      
      this.showInfractionModal();
      
    } catch (error) {
      console.error('Error loading infraction:', error);
      alert('Erreur lors du chargement de l\'infraction');
    }
  }
  
  async saveSanction() {
    if (!this.currentInfractionId) return;
    
    try {
      const commentsEl = document.getElementById('admin-comments');
      const comments = commentsEl ? commentsEl.value : '';
      
      await db.collection('infractions').doc(this.currentInfractionId).update({
        commentsAndSanctionAdmin: comments,
        timestampModificationAdmin: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      alert('Sanction enregistrée avec succès');
      this.loadInfractions();
      
    } catch (error) {
      console.error('Error saving sanction:', error);
      alert('Erreur lors de l\'enregistrement');
    }
  }
  
  async archiveInfraction() {
    if (!this.currentInfractionId) return;
    
    try {
      const doc = await db.collection('infractions').doc(this.currentInfractionId).get();
      const currentStatus = doc.data().archived || false;
      const newStatus = !currentStatus;
      
      const updateData = {
        archived: newStatus
      };
      
      if (newStatus) {
        updateData.timestampArchivedAdmin = firebase.firestore.FieldValue.serverTimestamp();
      }
      
      await db.collection('infractions').doc(this.currentInfractionId).update(updateData);
      
      alert(newStatus ? 'Infraction archivée' : 'Infraction désarchivée');
      this.hideInfractionModal();
      this.loadInfractions();
      
    } catch (error) {
      console.error('Error archiving infraction:', error);
      alert('Erreur lors de l\'archivage');
    }
  }
  
  showInfractionModal() {
    if (this.infractionModal) {
      this.infractionModal.style.display = 'flex';
      this.infractionModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }
  
  hideInfractionModal() {
    if (this.infractionModal) {
      this.infractionModal.style.display = 'none';
      this.infractionModal.classList.remove('active');
      document.body.style.overflow = '';
    }
    this.currentInfractionId = null;
  }
}

// Helper function if not defined in common.js
if (typeof escapeHtml === 'undefined') {
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize the admin manager
const adminManager = new AdminManager();