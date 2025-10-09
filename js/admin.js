// Admin Panel Functionality for EasyCal - COMPLETELY FIXED

class AdminPanel {
    constructor() {
        this.currentAdmin = null;
        this.users = [];
        this.init();
    }

    init() {
    this.checkAdminAuthentication();
    this.loadAdminData();
    this.loadUsersData();
    this.setupEventListeners();
    this.setupTabSystem();
    this.setupModal();
    this.setupBackup(); // ADD THIS LINE
    this.updateStats();
    this.updateBackupTimeDisplay(); // ADD THIS LINE
    }

    // Check if user is admin
    checkAdminAuthentication() {
        const userData = localStorage.getItem('currentUser');
        if (!userData) {
            window.location.href = 'index.html';
            return;
        }

        this.currentAdmin = JSON.parse(userData);
        
        if (this.currentAdmin.role !== 'admin') {
            window.location.href = 'dashboard.html';
            return;
        }
    }

    // Load admin data
    loadAdminData() {
        if (this.currentAdmin) {
            const adminNameElement = document.getElementById('adminName');
            if (adminNameElement) {
                adminNameElement.textContent = this.currentAdmin.name;
            }
        }
    }

    // Load users data from localStorage - FIXED
    loadUsersData() {
        try {
            const storedUsers = localStorage.getItem('easycal_users');
            
            if (storedUsers && storedUsers !== 'undefined') {
                this.users = JSON.parse(storedUsers);
            } else {
                // Initialize with empty array if no users exist
                this.users = [];
                this.saveUsers();
            }
            
            console.log('Loaded users:', this.users); // Debug log
            this.renderUsersTable();
        } catch (error) {
            console.error('Error loading users:', error);
            this.users = [];
            this.saveUsers();
        }
    }

    // Save users to localStorage - FIXED
    saveUsers() {
        try {
            localStorage.setItem('easycal_users', JSON.stringify(this.users));
            console.log('Users saved:', this.users); // Debug log
        } catch (error) {
            console.error('Error saving users:', error);
        }
    }

    // Setup event listeners - FIXED
    setupEventListeners() {
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }

        // Add user button
        const addUserBtn = document.getElementById('addUserBtn');
        if (addUserBtn) {
            addUserBtn.addEventListener('click', () => {
                this.openAddUserModal();
            });
        }

        // Make functions globally available
        window.adminPanel = this;
    }

    // Setup tab system
    setupTabSystem() {
        const tabLinks = document.querySelectorAll('.admin-menu .menu-link[data-tab]');
        
        tabLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                const tabId = link.getAttribute('data-tab');
                this.switchTab(tabId);
                
                // Update active states
                tabLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });
    }

    // Switch between tabs
    switchTab(tabId) {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Show selected tab
        const selectedTab = document.getElementById(tabId + 'Tab');
        if (selectedTab) {
            selectedTab.classList.add('active');
        }
        
        // Update stats if switching to analytics
        if (tabId === 'analytics') {
            this.updateStats();
        }
    }

    // Setup modal functionality - FIXED
    setupModal() {
        const modal = document.getElementById('userModal');
        const closeBtn = document.querySelector('.close');
        const cancelBtn = document.getElementById('cancelBtn');
        const userForm = document.getElementById('userForm');

        if (!modal || !closeBtn || !cancelBtn || !userForm) {
            console.error('Modal elements not found');
            return;
        }

        // Close modal
        const closeModal = () => {
            modal.style.display = 'none';
            userForm.reset();
            document.getElementById('editUserId').value = '';
        };

        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        // Form submission
        userForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveUser();
        });

        console.log('Modal setup completed');
    }

    // Open add user modal - FIXED
    openAddUserModal() {
        const modal = document.getElementById('userModal');
        const modalTitle = document.getElementById('modalTitle');
        
        if (!modal || !modalTitle) {
            console.error('Modal elements not found');
            return;
        }
        
        modalTitle.textContent = 'Add New User';
        document.getElementById('editUserId').value = '';
        
        // Reset form
        const userForm = document.getElementById('userForm');
        if (userForm) {
            userForm.reset();
        }
        
        // Set default expiry date to 30 days from now
        const defaultExpiry = new Date();
        defaultExpiry.setDate(defaultExpiry.getDate() + 30);
        const expiryInput = document.getElementById('userExpiry');
        if (expiryInput) {
            expiryInput.value = defaultExpiry.toISOString().split('T')[0];
        }
        
        modal.style.display = 'block';
        console.log('Add user modal opened');
    }

    // Open edit user modal - FIXED
    openEditUserModal(userId) {
        console.log('Opening edit modal for user:', userId);
        const user = this.users.find(u => u.id === userId);
        if (!user) {
            alert('User not found!');
            return;
        }

        const modal = document.getElementById('userModal');
        const modalTitle = document.getElementById('modalTitle');
        
        if (!modal || !modalTitle) {
            console.error('Modal elements not found');
            return;
        }
        
        modalTitle.textContent = 'Edit User';
        document.getElementById('editUserId').value = user.id;
        document.getElementById('userName').value = user.name;
        document.getElementById('userPhone').value = user.phone;
        document.getElementById('userPassword').value = user.password;
        document.getElementById('userExpiry').value = user.expiryDate;
        document.getElementById('userCustomLink').value = user.customLink || '';
        
        modal.style.display = 'block';
        console.log('Edit user modal opened for:', user.name);
    }

    // Save user (add or edit) - COMPLETELY FIXED
    saveUser() {
        console.log('Save user function called');
        
        const userId = document.getElementById('editUserId').value;
        const userData = {
            name: document.getElementById('userName').value.trim(),
            phone: document.getElementById('userPhone').value.trim(),
            password: document.getElementById('userPassword').value,
            expiryDate: document.getElementById('userExpiry').value,
            customLink: document.getElementById('userCustomLink').value.trim(),
            role: 'user',
            loginHistory: []
        };

        console.log('User data to save:', userData);

        // Validate required fields
        if (!userData.name || !userData.phone || !userData.password || !userData.expiryDate) {
            alert('Please fill in all required fields!');
            return;
        }

        // Validate phone number
        if (!this.validatePhone(userData.phone)) {
            alert('Please enter a valid 10-11 digit phone number');
            return;
        }

        // Validate password
        if (userData.password.length < 4) {
            alert('Password must be at least 4 characters long');
            return;
        }

        // Check if phone number already exists (for new users)
        if (!userId) {
            const existingUser = this.users.find(u => u.phone === userData.phone);
            if (existingUser) {
                alert('Phone number already registered! Please use a different phone number.');
                return;
            }
        }

        try {
            if (userId) {
                // Edit existing user
                const userIndex = this.users.findIndex(u => u.id === userId);
                if (userIndex !== -1) {
                    // Keep existing login history and ID
                    userData.loginHistory = this.users[userIndex].loginHistory || [];
                    userData.id = userId;
                    this.users[userIndex] = userData;
                    console.log('User updated:', userData);
                }
            } else {
                // Add new user
                userData.id = 'user_' + Date.now().toString();
                userData.loginHistory = [];
                this.users.push(userData);
                console.log('New user added:', userData);
            }

            this.saveUsers();
            this.renderUsersTable();
            this.updateStats();
            
            // Close modal
            document.getElementById('userModal').style.display = 'none';
            document.getElementById('userForm').reset();
            
            alert(userId ? 'User updated successfully!' : 'User created successfully!');
            
        } catch (error) {
            console.error('Error saving user:', error);
            alert('Error saving user: ' + error.message);
        }
    }

    // Delete user - FIXED
    deleteUser(userId) {
        console.log('Delete user called:', userId);
        if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            this.users = this.users.filter(user => user.id !== userId);
            this.saveUsers();
            this.renderUsersTable();
            this.updateStats();
            alert('User deleted successfully!');
        }
    }

    // Validate phone number
    validatePhone(phone) {
        const phoneRegex = /^[0-9]{10,11}$/;
        return phoneRegex.test(phone);
    }

    // Render users table - FIXED
    renderUsersTable() {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) {
            console.error('Users table body not found');
            return;
        }
        
        tbody.innerHTML = '';

        console.log('Rendering users:', this.users);

        if (this.users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px; color: #7f8c8d;">
                        No users found. Click "Add New User" to create your first user.
                    </td>
                </tr>
            `;
            return;
        }

        this.users.forEach(user => {
            if (user.role === 'user') { // Don't show admin users
                const row = document.createElement('tr');
                
                const status = this.isUserExpired(user.expiryDate) ? 'expired' : 'active';
                const lastLogin = user.loginHistory && user.loginHistory.length > 0 
                    ? this.formatDateTime(user.loginHistory[user.loginHistory.length - 1].login)
                    : 'Never';
                
                row.innerHTML = `
                    <td>${user.name || 'N/A'}</td>
                    <td>${user.phone || 'N/A'}</td>
                    <td>${this.formatDate(user.expiryDate)}</td>
                    <td>${lastLogin}</td>
                    <td><span class="status-badge status-${status}">${status.toUpperCase()}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-edit btn-sm" onclick="adminPanel.openEditUserModal('${user.id}')">
                                Edit
                            </button>
                            <button class="btn btn-delete btn-sm" onclick="adminPanel.deleteUser('${user.id}')">
                                Delete
                            </button>
                            <button class="btn btn-view btn-sm" onclick="adminPanel.viewUserDetails('${user.id}')">
                                Details
                            </button>
                        </div>
                    </td>
                `;
                
                tbody.appendChild(row);
            }
        });
        
        console.log('Users table rendered successfully');
    }

    // View user details
    viewUserDetails(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) {
            alert('User not found!');
            return;
        }

        let details = `User Details:\n\n`;
        details += `Name: ${user.name}\n`;
        details += `Phone: ${user.phone}\n`;
        details += `Expiry Date: ${this.formatDate(user.expiryDate)}\n`;
        details += `Status: ${this.isUserExpired(user.expiryDate) ? 'EXPIRED' : 'ACTIVE'}\n`;
        details += `Custom Link: ${user.customLink || 'Not set'}\n\n`;
        details += `Login History:\n`;
        
        if (user.loginHistory && user.loginHistory.length > 0) {
            user.loginHistory.forEach((session, index) => {
                details += `${index + 1}. ${this.formatDateTime(session.login)} to ${this.formatDateTime(session.logout || 'Still logged in')}\n`;
            });
        } else {
            details += 'No login history available\n';
        }

        alert(details);
    }

    // Check if user is expired
    isUserExpired(expiryDate) {
        if (!expiryDate) return true;
        const today = new Date().toISOString().split('T')[0];
        return expiryDate < today;
    }

    // Update statistics - FIXED
    updateStats() {
        const totalUsers = this.users.filter(u => u.role === 'user').length;
        const activeUsers = this.users.filter(u => u.role === 'user' && !this.isUserExpired(u.expiryDate)).length;
        const expiredUsers = totalUsers - activeUsers;
        
        // Calculate today's logins
        const today = new Date().toISOString().split('T')[0];
        const todayLogins = this.users.reduce((count, user) => {
            if (user.loginHistory) {
                const hasTodayLogin = user.loginHistory.some(session => 
                    session.login && session.login.startsWith(today)
                );
                return count + (hasTodayLogin ? 1 : 0);
            }
            return count;
        }, 0);

        // Update DOM elements
        const updateElement = (id, value) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        };

        updateElement('totalUsers', totalUsers);
        updateElement('activeUsers', activeUsers);
        updateElement('expiredUsers', expiredUsers);
        updateElement('todayLogins', todayLogins);

        this.renderRecentActivity();
    }

    // Render recent activity - FIXED
    renderRecentActivity() {
        const activityList = document.getElementById('activityList');
        if (!activityList) return;

        // Get all login sessions from all users
        const allSessions = [];
        this.users.forEach(user => {
            if (user.loginHistory) {
                user.loginHistory.forEach(session => {
                    if (session.login) {
                        allSessions.push({
                            user: user.name,
                            phone: user.phone,
                            login: session.login,
                            logout: session.logout
                        });
                    }
                });
            }
        });

        // Sort by login time (newest first)
        allSessions.sort((a, b) => new Date(b.login) - new Date(a.login));
        
        // Show last 10 sessions
        const recentSessions = allSessions.slice(0, 10);
        
        if (recentSessions.length === 0) {
            activityList.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 20px;">No recent activity</p>';
            return;
        }

        activityList.innerHTML = '';
        recentSessions.forEach(session => {
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';
            
            activityItem.innerHTML = `
                <div class="activity-info">
                    <h4>${session.user}</h4>
                    <p>${session.phone} • ${session.logout ? 'Logged out' : 'Active'}</p>
                </div>
                <div class="activity-time">
                    ${this.formatDateTime(session.login)}
                </div>
            `;
            
            activityList.appendChild(activityItem);
        });
    }

    // Format date for display
    formatDate(dateString) {
        if (!dateString) return 'Not set';
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    // Format date and time for display
    formatDateTime(dateTimeString) {
        if (!dateTimeString) return 'Unknown';
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit', 
            minute: '2-digit' 
        };
        return new Date(dateTimeString).toLocaleDateString('en-US', options);
    }

    // Logout admin
    logout() {
        // Store logout time
        const loginTime = localStorage.getItem('loginTime');
        if (loginTime && this.currentAdmin) {
            const logoutTime = new Date().toISOString();
            console.log('Admin session:', {
                admin: this.currentAdmin.name,
                login: loginTime,
                logout: logoutTime
            });
        }
        
        localStorage.removeItem('currentUser');
        localStorage.removeItem('loginTime');
        window.location.href = 'index.html';
    }
}

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Admin Panel...');
    window.adminPanel = new AdminPanel();
});

// Make functions globally available
window.openAddUserModal = () => {
    if (window.adminPanel) {
        window.adminPanel.openAddUserModal();
    }
};

window.openEditUserModal = (userId) => {
    if (window.adminPanel) {
        window.adminPanel.openEditUserModal(userId);
    }
};

// Auto-backup system - COMPLETE IMPLEMENTATION
setupBackup() {
    console.log('Setting up backup system...');
    
    // Create initial backup
    this.createBackup();
    
    // Backup every 30 seconds
    this.backupInterval = setInterval(() => {
        this.createBackup();
    }, 30000); // 30 seconds
    
    // Also backup before page unload
    window.addEventListener('beforeunload', () => {
        this.createBackup();
    });
    
    // Backup when visibility changes (tab switch)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            this.createBackup();
        }
    });
    
    console.log('Backup system activated');
}

createBackup() {
    try {
        if (!this.users || !Array.isArray(this.users)) {
            console.warn('No valid users data to backup');
            return false;
        }
        
        const backupData = {
            users: this.users,
            timestamp: new Date().toISOString(),
            count: this.users.length,
            version: '1.0',
            source: 'easycal_admin'
        };
        
        localStorage.setItem('easycal_backup', JSON.stringify(backupData));
        console.log(`Backup created: ${this.users.length} users at ${new Date().toLocaleTimeString()}`);
        
        // Update backup time display
        this.updateBackupTimeDisplay();
        
        return true;
        
    } catch (error) {
        console.error('Backup creation failed:', error);
        return false;
    }
}

restoreBackup() {
    try {
        const backupData = localStorage.getItem('easycal_backup');
        
        if (!backupData) {
            alert('❌ No backup found! Please create a backup first.');
            return false;
        }
        
        const backup = JSON.parse(backupData);
        
        if (!backup.users || !Array.isArray(backup.users)) {
            alert('❌ Invalid backup format!');
            return false;
        }
        
        if (confirm(`🔄 Restore backup from ${new Date(backup.timestamp).toLocaleString()}?\nThis will replace current ${this.users.length} users with ${backup.users.length} backup users.`)) {
            this.users = backup.users;
            this.saveUsers();
            this.renderUsersTable();
            this.updateStats();
            
            alert(`✅ Backup restored successfully!\nRecovered ${backup.users.length} users from ${new Date(backup.timestamp).toLocaleString()}`);
            return true;
        }
        
    } catch (error) {
        console.error('Backup restoration failed:', error);
        alert('❌ Error restoring backup: ' + error.message);
        return false;
    }
}

// Export users to downloadable file
exportUsers() {
    try {
        const exportData = {
            users: this.users,
            exportedAt: new Date().toISOString(),
            totalUsers: this.users.length,
            activeUsers: this.users.filter(u => !this.isUserExpired(u.expiryDate)).length,
            expiredUsers: this.users.filter(u => this.isUserExpired(u.expiryDate)).length
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `easycal_users_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        alert(`✅ Users exported successfully!\nDownloaded: ${this.users.length} users`);
        
    } catch (error) {
        console.error('Export failed:', error);
        alert('❌ Error exporting users: ' + error.message);
    }
}

// Import users from file
importUsers(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importData = JSON.parse(e.target.result);
            
            if (!importData.users || !Array.isArray(importData.users)) {
                alert('❌ Invalid file format! Please select a valid EasyCal backup file.');
                return;
            }
            
            if (confirm(`📥 Import ${importData.users.length} users from backup?\nThis will add them to your current ${this.users.length} users.`)) {
                // Merge users, avoiding duplicates by phone number
                importData.users.forEach(newUser => {
                    const existingIndex = this.users.findIndex(u => u.phone === newUser.phone);
                    if (existingIndex === -1) {
                        this.users.push(newUser);
                    } else {
                        // Update existing user
                        this.users[existingIndex] = { ...this.users[existingIndex], ...newUser };
                    }
                });
                
                this.saveUsers();
                this.renderUsersTable();
                this.updateStats();
                
                alert(`✅ Users imported successfully!\nTotal users now: ${this.users.length}`);
                
                // Clear file input
                event.target.value = '';
            }
            
        } catch (error) {
            console.error('Import failed:', error);
            alert('❌ Error importing users: ' + error.message);
        }
    };
    
    reader.readAsText(file);
}

// Update backup time display
updateBackupTimeDisplay() {
    const backupTimeElement = document.getElementById('lastBackupTime');
    if (backupTimeElement) {
        backupTimeElement.textContent = new Date().toLocaleString();
    }
    
    const userCountElement = document.getElementById('userCount');
    if (userCountElement) {
        userCountElement.textContent = this.users.length;
    }
}

// Get backup info
getBackupInfo() {
    try {
        const backupData = localStorage.getItem('easycal_backup');
        if (backupData) {
            const backup = JSON.parse(backupData);
            return {
                exists: true,
                timestamp: backup.timestamp,
                userCount: backup.count || 0,
                age: Math.round((new Date() - new Date(backup.timestamp)) / 1000 / 60) // minutes
            };
        }
        return { exists: false };
    } catch (error) {
        return { exists: false, error: error.message };
    }
}
