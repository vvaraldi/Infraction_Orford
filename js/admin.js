/**
 * admin.js
 * Admin panel functionality for managing infractions and users - FIXED VERSION
 */

class AdminManager {
  constructor() {
    this.currentInfractionId = null;
    this.currentUserId = null;
    this.userToDelete = null;
    this.showArchived = false;
    
    document.addEventListener('userAuthenticated', (e) => {
      this.userData = e.detail;
      
      if (this.userData.role !== 'admin') {
        alert('Accès non autorisé. Vous devez être administrateur.');
        window.location.href = '../index.html';
        return;
      }
      
      const adminNameEl = document.getElementById('admin-name');
      if (adminNameEl) {
        adminNameEl.textContent = this.userData.name || this.userData.email;
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
    this.tabBtns = document.querySelectorAll('.tab-btn');
    this.tabContents = document.querySelectorAll('.tab-content');
    this.infractionsTbody = document.getElementById('infractions-tbody');
    this.showArchivedCheckbox = document.getElementById('show-archived');
    this.infractionModal = document.getElementById('infraction-modal');
    this.infractionModalBody = document.getElementById('infraction-modal-body');
    this.closeInfractionModal = document.getElementById('close-infraction-modal');
    this.closeInfractionBtn = document.getElementById('close-infraction-btn');
    this.archiveBtn = document.getElementById('archive-btn');
    this.saveSanctionBtn = document.getElementById('save-sanction-btn');
    this.usersTbody = document.getElementById('users-tbody');
    this.addUserBtn = document.getElementById('add-user-btn');
    this.userModal = document.getElementById('user-modal');
    this.userModalTitle = document.getElementById('user-modal-title');
    this.userForm = document.getElementById('user-form');
    this.closeUserModal = document.getElementById('close-user-modal');
    this.cancelUserBtn = document.getElementById('cancel-user-btn');
    this.saveUserBtn = document.getElementById('save-user-btn');
    this.passwordGroup = document.getElementById('password-group');
    this.userNameInput = document.getElementById('user-name');
    this.userEmailInput = document.getElementById('user-email');
    this.userPasswordInput = document.getElementById('user-password');
    this.userRoleSelect = document.getElementById('user-role');
    this.userStatusSelect = document.getElementById('user-status');
    this.deleteModal = document.getElementById('delete-modal');
    this.deleteMessage = document.getElementById('delete-message');
    this.closeDeleteModal = document.getElementById('close-delete-modal');
    this.cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    this.confirmDeleteBtn = document.getElementById('confirm-delete-btn');
  }
  
  bindEvents() {
    this.tabBtns.forEach(btn => {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
    });
    
    if (this.showArchivedCheckbox) {
      this.showArchivedCheckbox.addEventListener('change', () => {
        this.showArchived = this.showArchivedCheckbox.checked;
        this.loadInfractions();
      });
    }
    
    if (this.closeInfractionModal) this.closeInfractionModal.addEventListener('click', () => this.hideInfractionModal());
    if (this.closeInfractionBtn) this.closeInfractionBtn.addEventListener('click', () => this.hideInfractionModal());
    if (this.archiveBtn) this.archiveBtn.addEventListener('click', () => this.toggleArchive());
    if (this.saveSanctionBtn) this.saveSanctionBtn.addEventListener('click', () => this.saveSanction());
    if (this.addUserBtn) this.addUserBtn.addEventListener('click', () => this.showAddUserModal());
    if (this.closeUserModal) this.closeUserModal.addEventListener('click', () => this.hideUserModal());
    if (this.cancelUserBtn) this.cancelUserBtn.addEventListener('click', () => this.hideUserModal());
    if (this.saveUserBtn) this.saveUserBtn.addEventListener('click', () => this.saveUser());
    if (this.closeDeleteModal) this.closeDeleteModal.addEventListener('click', () => this.hideDeleteModal());
    if (this.cancelDeleteBtn) this.cancelDeleteBtn.addEventListener('click', () => this.hideDeleteModal());
    if (this.confirmDeleteBtn) this.confirmDeleteBtn.addEventListener('click', () => this.confirmDelete());
    
    [this.infractionModal, this.userModal, this.deleteModal].forEach(modal => {
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) modal.style.display = 'none';
        });
      }
    });
  }
  
  switchTab(tabId) {
    this.tabBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabId));
    this.tabContents.forEach(content => content.classList.toggle('active', content.id === `${tabId}-tab`));
  }
  
  async loadInfractions() {
    if (!this.infractionsTbody) return;
    
    this.infractionsTbody.innerHTML = '<tr><td colspan="6" class="text-center">Chargement...</td></tr>';
    
    try {
      let query = db.collection('infractions').orderBy('createdAt', 'desc');
      if (!this.showArchived) query = query.where('archived', '==', false);
      
      const snapshot = await query.get();
      
      if (snapshot.empty) {
        this.infractionsTbody.innerHTML = '<tr><td colspan="6" class="text-center">Aucune infraction trouvée</td></tr>';
        return;
      }
      
      let html = '';
      snapshot.forEach(doc => {
        const data = doc.data();
        const date = formatDate(data.offenceTimestamp);
        const location = data.trail ? `${data.trail}${data.offPiste ? ' (HP)' : ''}` : '-';
        const status = data.archived ? '<span class="badge badge-secondary">Archivée</span>' : '<span class="badge badge-primary">Active</span>';
        
        html += `<tr>
          <td>${date}</td>
          <td>${escapeHtml(data.patrolName || '-')}</td>
          <td>${escapeHtml(data.offenderName || '-')}</td>
          <td>${escapeHtml(location)}</td>
          <td>${status}</td>
          <td><button class="btn btn-sm btn-secondary" onclick="adminManager.viewInfraction('${doc.id}')">👁️ Voir</button></td>
        </tr>`;
      });
      
      this.infractionsTbody.innerHTML = html;
    } catch (error) {
      console.error('Error loading infractions:', error);
      this.infractionsTbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Erreur: ${error.message}</td></tr>`;
    }
  }
  
  async viewInfraction(id) {
    try {
      const doc = await db.collection('infractions').doc(id).get();
      if (!doc.exists) { showMessage('Infraction non trouvée', 'error'); return; }
      
      this.currentInfractionId = id;
      const data = doc.data();
      const sectorName = (typeof getSectorName === 'function' ? getSectorName(data.sector) : data.sector) || '-';
      const location = `${sectorName} - ${data.trail || '-'}${data.offPiste ? ' (HP)' : ''}`;
      const practiceName = (typeof getPracticeName === 'function' ? getPracticeName(data.practice) : data.practice) || '-';
      
      let photoHtml = data.offenderImageUrl ? `<div class="detail-section"><h3>Photo</h3><img src="${data.offenderImageUrl}" class="infraction-photo" onclick="window.open('${data.offenderImageUrl}', '_blank')"></div>` : '';
      
      this.infractionModalBody.innerHTML = `
        <div class="infraction-details">
          <div class="detail-section"><h3>Informations</h3>
            <ul class="detail-list">
              <li><strong>Date:</strong> ${formatDateTime(data.offenceTimestamp)}</li>
              <li><strong>Patrouilleur:</strong> ${escapeHtml(data.patrolName || '-')}</li>
              <li><strong>Contrevenant:</strong> ${escapeHtml(data.offenderName || '-')}</li>
            </ul>
          </div>
          <div class="detail-section"><h3>Localisation</h3>
            <ul class="detail-list">
              <li><strong>Emplacement:</strong> ${escapeHtml(location)}</li>
              <li><strong>Pratique:</strong> ${practiceName}</li>
            </ul>
          </div>
          <div class="detail-section"><h3>Description</h3><p class="infraction-description">${escapeHtml(data.offenceType || '-')}</p></div>
          ${photoHtml}
          <div class="detail-section"><h3>Commentaires Admin</h3>
            <textarea class="form-textarea" id="admin-comments" rows="4" placeholder="Commentaires...">${escapeHtml(data.adminComments || '')}</textarea>
          </div>
          <div class="detail-section"><h3>Métadonnées</h3>
            <ul class="detail-list detail-list-small">
              <li><strong>Créé:</strong> ${formatDateTime(data.createdAt)}</li>
              <li><strong>Modifié:</strong> ${formatDateTime(data.modifiedAt)}</li>
              ${data.adminModifiedAt ? `<li><strong>Admin:</strong> ${formatDateTime(data.adminModifiedAt)}</li>` : ''}
              ${data.archivedAt ? `<li><strong>Archivé:</strong> ${formatDateTime(data.archivedAt)}</li>` : ''}
            </ul>
          </div>
        </div>`;
      
      if (this.archiveBtn) this.archiveBtn.textContent = data.archived ? '📤 Désarchiver' : '📦 Archiver';
      if (this.infractionModal) this.infractionModal.style.display = 'flex';
    } catch (error) {
      console.error('Error:', error);
      showMessage('Erreur lors du chargement', 'error');
    }
  }
  
  hideInfractionModal() {
    if (this.infractionModal) this.infractionModal.style.display = 'none';
    this.currentInfractionId = null;
  }
  
  async saveSanction() {
    if (!this.currentInfractionId) return;
    const comments = document.getElementById('admin-comments')?.value || '';
    if (this.saveSanctionBtn) setButtonLoading(this.saveSanctionBtn, true);
    
    try {
      await db.collection('infractions').doc(this.currentInfractionId).update({
        adminComments: comments,
        adminModifiedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      showMessage('Sauvegardé', 'success');
      this.hideInfractionModal();
      this.loadInfractions();
    } catch (error) {
      showMessage('Erreur', 'error');
    } finally {
      if (this.saveSanctionBtn) setButtonLoading(this.saveSanctionBtn, false);
    }
  }
  
  async toggleArchive() {
    if (!this.currentInfractionId) return;
    if (this.archiveBtn) setButtonLoading(this.archiveBtn, true);
    
    try {
      const doc = await db.collection('infractions').doc(this.currentInfractionId).get();
      const isArchived = doc.data().archived;
      await db.collection('infractions').doc(this.currentInfractionId).update({
        archived: !isArchived,
        archivedAt: !isArchived ? firebase.firestore.FieldValue.serverTimestamp() : null
      });
      showMessage(isArchived ? 'Désarchivée' : 'Archivée', 'success');
      this.hideInfractionModal();
      this.loadInfractions();
    } catch (error) {
      showMessage('Erreur', 'error');
    } finally {
      if (this.archiveBtn) setButtonLoading(this.archiveBtn, false);
    }
  }
  
  async loadUsers() {
    if (!this.usersTbody) return;
    
    try {
      const snapshot = await db.collection('inspectors').orderBy('name').get();
      
      if (snapshot.empty) {
        this.usersTbody.innerHTML = '<tr><td colspan="5" class="text-center">Aucun utilisateur</td></tr>';
        return;
      }
      
      let html = '';
      snapshot.forEach(doc => {
        const data = doc.data();
        const roleLabel = data.role === 'admin' ? '<span class="badge badge-warning">Admin</span>' : '<span class="badge badge-primary">Patrouilleur</span>';
        const statusLabel = data.status === 'active' ? '<span class="badge badge-success">Actif</span>' : '<span class="badge badge-secondary">Inactif</span>';
        
        html += `<tr>
          <td>${escapeHtml(data.name || '-')}</td>
          <td>${escapeHtml(data.email || '-')}</td>
          <td>${roleLabel}</td>
          <td>${statusLabel}</td>
          <td>
            <button class="btn btn-sm btn-secondary" onclick="adminManager.editUser('${doc.id}')">✏️</button>
            <button class="btn btn-sm btn-danger" onclick="adminManager.deleteUser('${doc.id}', '${escapeHtml(data.name)}')">🗑️</button>
          </td>
        </tr>`;
      });
      
      this.usersTbody.innerHTML = html;
    } catch (error) {
      this.usersTbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Erreur</td></tr>`;
    }
  }
  
  showAddUserModal() {
    this.currentUserId = null;
    if (this.userModalTitle) this.userModalTitle.textContent = 'Nouvel utilisateur';
    if (this.userForm) this.userForm.reset();
    if (this.passwordGroup) this.passwordGroup.style.display = '';
    if (this.userEmailInput) this.userEmailInput.disabled = false;
    if (this.userModal) this.userModal.style.display = 'flex';
  }
  
  async editUser(id) {
    try {
      const doc = await db.collection('inspectors').doc(id).get();
      if (!doc.exists) { showMessage('Non trouvé', 'error'); return; }
      
      this.currentUserId = id;
      const data = doc.data();
      
      if (this.userModalTitle) this.userModalTitle.textContent = 'Modifier';
      if (this.userNameInput) this.userNameInput.value = data.name || '';
      if (this.userEmailInput) { this.userEmailInput.value = data.email || ''; this.userEmailInput.disabled = true; }
      if (this.passwordGroup) this.passwordGroup.style.display = 'none';
      if (this.userRoleSelect) this.userRoleSelect.value = data.role || 'patrol';
      if (this.userStatusSelect) this.userStatusSelect.value = data.status || 'active';
      if (this.userModal) this.userModal.style.display = 'flex';
    } catch (error) {
      showMessage('Erreur', 'error');
    }
  }
  
  hideUserModal() {
    if (this.userModal) this.userModal.style.display = 'none';
    this.currentUserId = null;
  }
  
  async saveUser() {
    const name = this.userNameInput?.value?.trim();
    const email = this.userEmailInput?.value?.trim();
    const password = this.userPasswordInput?.value;
    const role = this.userRoleSelect?.value;
    const status = this.userStatusSelect?.value;
    
    if (!name || !email) { showMessage('Nom et courriel requis', 'warning'); return; }
    if (this.saveUserBtn) setButtonLoading(this.saveUserBtn, true);
    
    try {
      if (this.currentUserId) {
        await db.collection('inspectors').doc(this.currentUserId).update({
          name, role, status,
          modifiedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        showMessage('Modifié', 'success');
      } else {
        if (!password || password.length < 6) {
          showMessage('Mot de passe: 6 caractères minimum', 'warning');
          if (this.saveUserBtn) setButtonLoading(this.saveUserBtn, false);
          return;
        }
        
        const secondaryApp = firebase.initializeApp(getFirebaseConfig(), 'secondary-' + Date.now());
        try {
          const userCredential = await secondaryApp.auth().createUserWithEmailAndPassword(email, password);
          await db.collection('inspectors').doc(userCredential.user.uid).set({
            name, email, role, status,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdBy: getCurrentUserId()
          });
          showMessage('Créé', 'success');
        } finally {
          await secondaryApp.delete();
        }
      }
      this.hideUserModal();
      this.loadUsers();
    } catch (error) {
      showMessage(error.code === 'auth/email-already-in-use' ? 'Courriel déjà utilisé' : 'Erreur', 'error');
    } finally {
      if (this.saveUserBtn) setButtonLoading(this.saveUserBtn, false);
    }
  }
  
  deleteUser(id, name) {
    this.userToDelete = id;
    if (this.deleteMessage) this.deleteMessage.textContent = `Supprimer "${name}"?`;
    if (this.deleteModal) this.deleteModal.style.display = 'flex';
  }
  
  hideDeleteModal() {
    if (this.deleteModal) this.deleteModal.style.display = 'none';
    this.userToDelete = null;
  }
  
  async confirmDelete() {
    if (!this.userToDelete) return;
    if (this.confirmDeleteBtn) setButtonLoading(this.confirmDeleteBtn, true);
    
    try {
      await db.collection('inspectors').doc(this.userToDelete).delete();
      showMessage('Supprimé', 'success');
      this.hideDeleteModal();
      this.loadUsers();
    } catch (error) {
      showMessage('Erreur', 'error');
    } finally {
      if (this.confirmDeleteBtn) setButtonLoading(this.confirmDeleteBtn, false);
    }
  }
}

const adminManager = new AdminManager();
