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
    this.showArchivedCheckbox.addEventListener('change', () => {
      this.showArchived = this.showArchivedCheckbox.checked;
      this.loadInfractions();
    });
    
    this.sortBySelect.addEventListener('change', () => {
      this.sortBy = this.sortBySelect.value;
      this.renderInfractions();
    });
    
    // Modal controls
    this.closeInfractionModal.addEventListener('click', () => this.hideInfractionModal());
    this.closeInfractionBtn.addEventListener('click', () => this.hideInfractionModal());
    this.archiveBtn.addEventListener('click', () => this.archiveInfraction());
    this.saveSanctionBtn.addEventListener('click', () => this.saveSanction());
    
    // Close modal on overlay click
    this.infractionModal.querySelector('.modal-overlay').addEventListener('click', () => this.hideInfractionModal());
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
      this.infractionsTbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center text-danger">Erreur de chargement</td>
        </tr>
      `;
    }
  }
  
  /**
   * Sort and render infractions based on current sort selection
   */
  renderInfractions() {
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
    
    // Build HTML
    let html = '';
    sortedData.forEach(data => {
      const date = formatDate(data.offenceTimestamp);
      const location = data.trail ? `${data.trail}${data.offPiste ? ' (HP)' : ''}` : '-';
      const status = data.archived ? 
        '<span class="badge badge-secondary">Archivé</span>' : 
        '<span class="badge badge-warning">En cours</span>';
      
      html += `
        <tr class="clickable-row" data-id="${data.id}">
          <td>${date}</td>
          <td>${data.offenderName || '-'}</td>
          <td>${data.offenceType || '-'}</td>
          <td>${location}</td>
          <td>${data.patrolName || '-'}</td>
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
      
      let imagesHtml = '';
      if (data.offenderImage && data.offenderImage.length > 0) {
        imagesHtml = data.offenderImage.map(url => 
          `<img src="${url}" alt="Photo" class="infraction-photo">`
        ).join('');
      } else {
        imagesHtml = '<p class="text-muted">Aucune photo</p>';
      }
      
      this.infractionModalBody.innerHTML = `
        <div class="infraction-details">
          <div class="detail-section">
            <h4>Informations générales</h4>
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Contrevenant:</strong> ${data.offenderName || '-'}</p>
            <p><strong>Type d'infraction:</strong> ${data.offenceType || '-'}</p>
            <p><strong>Lieu:</strong> ${location}</p>
            <p><strong>Pratique:</strong> ${data.practice || '-'}</p>
            <p><strong>Patrouilleur:</strong> ${data.patrolName || '-'}</p>
            <p><strong>Créé le:</strong> ${formatDate(data.timestampCreation)}</p>
            ${data.timestampModification ? `<p><strong>Modifié le:</strong> ${formatDate(data.timestampModification)}</p>` : ''}
          </div>
          
          <div class="detail-section">
            <h4>Photos</h4>
            <div class="photos-grid">
              ${imagesHtml}
            </div>
          </div>
          
          <div class="detail-section">
            <h4>Sanction et commentaires administratifs</h4>
            <textarea id="admin-comments" class="form-control" rows="4" 
                      placeholder="Entrez les commentaires et sanctions...">${data.commentsAndSanctionAdmin || ''}</textarea>
            ${data.timestampModificationAdmin ? 
              `<p class="text-muted mt-2">Dernière modification admin: ${formatDate(data.timestampModificationAdmin)}</p>` : 
              ''}
          </div>
        </div>
      `;
      
      // Update archive button
      if (data.archived) {
        this.archiveBtn.textContent = 'Désarchiver';
        this.archiveBtn.classList.remove('btn-warning');
        this.archiveBtn.classList.add('btn-secondary');
      } else {
        this.archiveBtn.textContent = 'Archiver';
        this.archiveBtn.classList.remove('btn-secondary');
        this.archiveBtn.classList.add('btn-warning');
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
      const comments = document.getElementById('admin-comments').value;
      
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
    this.infractionModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  
  hideInfractionModal() {
    this.infractionModal.classList.remove('active');
    document.body.style.overflow = '';
    this.currentInfractionId = null;
  }
}

// Initialize the admin manager
const adminManager = new AdminManager();