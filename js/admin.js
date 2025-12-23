/**
 * admin.js
 * Admin panel functionality for managing infractions and users
 */

class AdminManager {
  constructor() {
    this.currentInfractionId = null;
    this.currentUserId = null;
    this.userToDelete = null;
    this.showArchived = false;
    
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
    this.loadUsers();
  }
  
  bindElements() {
    // Tabs
    this.tabBtns = document.querySelectorAll('.tab-btn');
    this.tabContents = document.querySelectorAll('.tab-content');
    
    // Infractions
    this.infractionsTbody = document.getElementById('infractions-tbody');
    this.showArchivedCheckbox = document.getElementById('show-archived');
    
    // Infraction modal
    this.infractionModal = document.getElementById('infraction-modal');
    this.infractionModalBody = document.getElementById('infraction-modal-body');
    this.closeInfractionModal = document.getElementById('close-infraction-modal');
    this.closeInfractionBtn = document.getElementById('close-infraction-btn');
    this.archiveBtn = document.getElementById('archive-btn');
    this.saveSanctionBtn = document.getElementById('save-sanction-btn');
    
    // Users
    this.usersTbody = document.getElementById('users-tbody');
    this.addUserBtn = document.getElementById('add-user-btn');
    
    // User modal
    this.userModal = document.getElementById('user-modal');
    this.userModalTitle = document.getElementById('user-modal-title');
    this.userForm = document.getElementById('user-form');
    this.closeUserModal = document.getElementById('close-user-modal');
    this.cancelUserBtn = document.getElementById('cancel-user-btn');
    this.saveUserBtn = document.getElementById('save-user-btn');
    this.passwordGroup = document.getElementById('password-group');
    
    // Delete modal
    this.deleteModal = document.getElementById('delete-modal');
    this.deleteMessage = document.getElementById('delete-message');
    this.closeDeleteModal = document.getElementById('close-delete-modal');
    this.cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    this.confirmDeleteBtn = document.getElementById('confirm-delete-btn');
  }
  
  bindEvents() {
    // Tab switching
    this.tabBtns.forEach(btn => {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
    });
    
    // Show archived toggle
    this.showArchivedCheckbox.addEventListener('change', () => {
      this.showArchived = this.showArchivedCheckbox.checked;
      this.loadInfractions();
    });
    
    // Infraction modal
    this.closeInfractionModal.addEventListener('click', () => this.hideInfractionModal());
    this.closeInfractionBtn.addEventListener('click', () => this.hideInfractionModal());
    this.archiveBtn.addEventListener('click', () => this.toggleArchive());
    this.saveSanctionBtn.addEventListener('click', () => this.saveSanction());
    
    // User modal
    this.addUserBtn.addEventListener('click', () => this.showAddUserModal());
    this.closeUserModal.addEventListener('click', () => this.hideUserModal());
    this.cancelUserBtn.addEventListener('click', () => this.hideUserModal());
    this.saveUserBtn.addEventListener('click', () => this.saveUser());
    
    // Delete modal
    this.closeDeleteModal.addEventListener('click', () => this.hideDeleteModal());
    this.cancelDeleteBtn.addEventListener('click', () => this.hideDeleteModal());
    this.confirmDeleteBtn.addEventListener('click', () => this.confirmDelete());
    
    // Close modals on outside click
    [this.infractionModal, this.userModal, this.deleteModal].forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.style.display = 'none';
        }
      });
    });
  }
  
  switchTab(tabId) {
    // Update tab buttons
    this.tabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    
    // Update tab content
    this.tabContents.forEach(content => {
      content.classList.toggle('active', content.id === `${tabId}-tab`);
    });
  }
  
  // ==================== INFRACTIONS ====================
  
  async loadInfractions() {
    try {
      let query = db.collection('infractions').orderBy('createdAt', 'desc');
      
      if (!this.showArchived) {
        query = query.where('archived', '==', false);
      }
      
      const snapshot = await query.get();
      
      if (snapshot.empty) {
        this.infractionsTbody.innerHTML = `
          <tr>
            <td colspan="6" class="text-center">Aucune infraction trouvée</td>
          </tr>
        `;
        return;
      }
      
      let html = '';
      snapshot.forEach(doc => {
        const data = doc.data();
        const date = formatDate(data.offenceTimestamp);
        const location = data.trail ? `${data.trail}${data.offPiste ? ' (HP)' : ''}` : '-';
        const status = data.archived ? 
          '<span class="badge badge-secondary">Archivée</span>' : 
          '<span class="badge badge-primary">Active</span>';
        
        html += `
          <tr>
            <td>${date}</td>
            <td>${escapeHtml(data.patrolName)}</td>
            <td>${escapeHtml(data.offenderName)}</td>
            <td>${escapeHtml(location)}</td>
            <td>${status}</td>
            <td>
              <button class="btn btn-sm btn-secondary" onclick="adminManager.viewInfraction('${doc.id}')">
                👁️ Voir
              </button>
            </td>
          </tr>
        `;
      });
      
      this.infractionsTbody.innerHTML = html;
      
    } catch (error) {
      console.error('Error loading infractions:', error);
      this.infractionsTbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center text-danger">Erreur de chargement</td>
        </tr>
      `;
    }
  }
  
  async viewInfraction(id) {
    try {
      const doc = await db.collection('infractions').doc(id).get();
      
      if (!doc.exists) {
        showMessage('Infraction non trouvée', 'error');
        return;
      }
      
      this.currentInfractionId = id;
      const data = doc.data();
      
      // Build modal content
      const sectorName = getSectorName(data.sector) || data.sector || '-';
      const location = `${sectorName} - ${data.trail || '-'}${data.offPiste ? ' (Hors-piste)' : ''}`;
      
      let photoHtml = '';
      if (data.offenderImageUrl) {
        photoHtml = `
          <div class="detail-section">
            <h3>Photo</h3>
            <img src="${data.offenderImageUrl}" alt="Photo du contrevenant" class="infraction-photo" onclick="window.open('${data.offenderImageUrl}', '_blank')">
          </div>
        `;
      }
      
      this.infractionModalBody.innerHTML = `
        <div class="infraction-details">
          <div class="detail-section">
            <h3>Informations générales</h3>
            <ul class="detail-list">
              <li><strong>Date de l'infraction:</strong> ${formatDateTime(data.offenceTimestamp)}</li>
              <li><strong>Patrouilleur:</strong> ${escapeHtml(data.patrolName)}</li>
              <li><strong>Contrevenant:</strong> ${escapeHtml(data.offenderName)}</li>
            </ul>
          </div>
          
          <div class="detail-section">
            <h3>Localisation</h3>
            <ul class="detail-list">
              <li><strong>Emplacement:</strong> ${escapeHtml(location)}</li>
              <li><strong>Pratique:</strong> ${getPracticeName(data.practice)}</li>
            </ul>
          </div>
          
          <div class="detail-section">
            <h3>Description de l'infraction</h3>
            <p class="infraction-description">${escapeHtml(data.offenceType)}</p>
          </div>
          
          ${photoHtml}
          
          <div class="detail-section">
            <h3>Commentaires et sanctions (Admin)</h3>
            <textarea class="form-textarea" id="admin-comments" rows="4" placeholder="Ajouter des commentaires ou sanctions...">${escapeHtml(data.adminComments || '')}</textarea>
          </div>
          
          <div class="detail-section">
            <h3>Métadonnées</h3>
            <ul class="detail-list detail-list-small">
              <li><strong>Créé le:</strong> ${formatDateTime(data.createdAt)}</li>
              <li><strong>Modifié le:</strong> ${formatDateTime(data.modifiedAt)}</li>
              ${data.adminModifiedAt ? `<li><strong>Admin modifié le:</strong> ${formatDateTime(data.adminModifiedAt)}</li>` : ''}
              ${data.archivedAt ? `<li><strong>Archivé le:</strong> ${formatDateTime(data.archivedAt)}</li>` : ''}
            </ul>
          </div>
        </div>
      `;
      
      // Update archive button text
      this.archiveBtn.textContent = data.archived ? '📤 Désarchiver' : '📦 Archiver';
      
      this.infractionModal.style.display = 'flex';
      
    } catch (error) {
      console.error('Error loading infraction:', error);
      showMessage('Erreur lors du chargement de l\'infraction', 'error');
    }
  }
  
  hideInfractionModal() {
    this.infractionModal.style.display = 'none';
    this.currentInfractionId = null;
  }
  
  async saveSanction() {
    if (!this.currentInfractionId) return;
    
    const comments = document.getElementById('admin-comments').value;
    
    setButtonLoading(this.saveSanctionBtn, true);
    
    try {
      await db.collection('infractions').doc(this.currentInfractionId).update({
        adminComments: comments,
        adminModifiedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      showMessage('Commentaires sauvegardés', 'success');
      this.hideInfractionModal();
      this.loadInfractions();
      
    } catch (error) {
      console.error('Error saving comments:', error);
      showMessage('Erreur lors de la sauvegarde', 'error');
    } finally {
      setButtonLoading(this.saveSanctionBtn, false);
    }
  }
  
  async toggleArchive() {
    if (!this.currentInfractionId) return;
    
    setButtonLoading(this.archiveBtn, true);
    
    try {
      const doc = await db.collection('infractions').doc(this.currentInfractionId).get();
      const isArchived = doc.data().archived;
      
      await db.collection('infractions').doc(this.currentInfractionId).update({
        archived: !isArchived,
        archivedAt: !isArchived ? firebase.firestore.FieldValue.serverTimestamp() : null
      });
      
      showMessage(isArchived ? 'Infraction désarchivée' : 'Infraction archivée', 'success');
      this.hideInfractionModal();
      this.loadInfractions();
      
    } catch (error) {
      console.error('Error toggling archive:', error);
      showMessage('Erreur lors de l\'archivage', 'error');
    } finally {
      setButtonLoading(this.archiveBtn, false);
    }
  }
  
  // ==================== USERS ====================
  
  async loadUsers() {
    try {
      const snapshot = await db.collection('inspectors').orderBy('name').get();
      
      if (snapshot.empty) {
        this.usersTbody.innerHTML = `
          <tr>
            <td colspan="5" class="text-center">Aucun utilisateur trouvé</td>
          </tr>
        `;
        return;
      }
      
      let html = '';
      snapshot.forEach(doc => {
        const data = doc.data();
        const roleLabel = data.role === 'admin' ? 
          '<span class="badge badge-warning">Admin</span>' : 
          '<span class="badge badge-info">Patrouilleur</span>';
        const statusLabel = data.status === 'active' ? 
          '<span class="badge badge-success">Actif</span>' : 
          '<span class="badge badge-secondary">Inactif</span>';
        
        html += `
          <tr>
            <td>${escapeHtml(data.name)}</td>
            <td>${escapeHtml(data.email)}</td>
            <td>${roleLabel}</td>
            <td>${statusLabel}</td>
            <td>
              <button class="btn btn-sm btn-secondary" onclick="adminManager.editUser('${doc.id}')">
                ✏️ Modifier
              </button>
              <button class="btn btn-sm btn-danger" onclick="adminManager.deleteUser('${doc.id}', '${escapeHtml(data.name)}')">
                🗑️
              </button>
            </td>
          </tr>
        `;
      });
      
      this.usersTbody.innerHTML = html;
      
    } catch (error) {
      console.error('Error loading users:', error);
      this.usersTbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-danger">Erreur de chargement</td>
        </tr>
      `;
    }
  }
  
  showAddUserModal() {
    this.currentUserId = null;
    this.userModalTitle.textContent = 'Ajouter un utilisateur';
    this.userForm.reset();
    this.passwordGroup.style.display = '';
    document.getElementById('user-password').required = true;
    this.userModal.style.display = 'flex';
  }
  
  async editUser(id) {
    try {
      const doc = await db.collection('inspectors').doc(id).get();
      
      if (!doc.exists) {
        showMessage('Utilisateur non trouvé', 'error');
        return;
      }
      
      this.currentUserId = id;
      const data = doc.data();
      
      this.userModalTitle.textContent = 'Modifier l\'utilisateur';
      document.getElementById('user-name').value = data.name || '';
      document.getElementById('user-email').value = data.email || '';
      document.getElementById('user-password').value = '';
      document.getElementById('user-password').required = false;
      document.getElementById('user-role').value = data.role || 'patrol';
      document.getElementById('user-status').value = data.status || 'active';
      
      // Hide password field for editing (can't change via this method)
      this.passwordGroup.style.display = 'none';
      
      this.userModal.style.display = 'flex';
      
    } catch (error) {
      console.error('Error loading user:', error);
      showMessage('Erreur lors du chargement de l\'utilisateur', 'error');
    }
  }
  
  hideUserModal() {
    this.userModal.style.display = 'none';
    this.currentUserId = null;
  }
  
  async saveUser() {
    const name = document.getElementById('user-name').value.trim();
    const email = document.getElementById('user-email').value.trim();
    const password = document.getElementById('user-password').value;
    const role = document.getElementById('user-role').value;
    const status = document.getElementById('user-status').value;
    
    if (!name || !email) {
      showMessage('Veuillez remplir tous les champs obligatoires', 'warning');
      return;
    }
    
    setButtonLoading(this.saveUserBtn, true);
    
    try {
      if (this.currentUserId) {
        // Update existing user
        await db.collection('inspectors').doc(this.currentUserId).update({
          name: name,
          role: role,
          status: status,
          modifiedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showMessage('Utilisateur modifié avec succès', 'success');
        
      } else {
        // Create new user
        if (!password || password.length < 6) {
          showMessage('Le mot de passe doit contenir au moins 6 caractères', 'warning');
          setButtonLoading(this.saveUserBtn, false);
          return;
        }
        
        // Create secondary Firebase app to avoid auto-login
        const secondaryApp = firebase.initializeApp(getFirebaseConfig(), 'secondary');
        const secondaryAuth = secondaryApp.auth();
        
        try {
          const userCredential = await secondaryAuth.createUserWithEmailAndPassword(email, password);
          
          // Add to inspectors collection
          await db.collection('inspectors').doc(userCredential.user.uid).set({
            name: name,
            email: email,
            role: role,
            status: status,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdBy: getCurrentUserId()
          });
          
          showMessage('Utilisateur créé avec succès', 'success');
          
        } finally {
          // Clean up secondary app
          await secondaryApp.delete();
        }
      }
      
      this.hideUserModal();
      this.loadUsers();
      
    } catch (error) {
      console.error('Error saving user:', error);
      
      if (error.code === 'auth/email-already-in-use') {
        showMessage('Cette adresse courriel est déjà utilisée', 'error');
      } else {
        showMessage('Erreur lors de la sauvegarde', 'error');
      }
    } finally {
      setButtonLoading(this.saveUserBtn, false);
    }
  }
  
  deleteUser(id, name) {
    this.userToDelete = id;
    this.deleteMessage.textContent = `Êtes-vous sûr de vouloir supprimer l'utilisateur "${name}"?`;
    this.deleteModal.style.display = 'flex';
  }
  
  hideDeleteModal() {
    this.deleteModal.style.display = 'none';
    this.userToDelete = null;
  }
  
  async confirmDelete() {
    if (!this.userToDelete) return;
    
    setButtonLoading(this.confirmDeleteBtn, true);
    
    try {
      // Note: This only removes from Firestore, not from Firebase Auth
      // The user won't be able to access the system but their auth account remains
      await db.collection('inspectors').doc(this.userToDelete).delete();
      
      showMessage('Utilisateur supprimé', 'success');
      this.hideDeleteModal();
      this.loadUsers();
      
    } catch (error) {
      console.error('Error deleting user:', error);
      showMessage('Erreur lors de la suppression', 'error');
    } finally {
      setButtonLoading(this.confirmDeleteBtn, false);
    }
  }
}

// Initialize admin manager
const adminManager = new AdminManager();