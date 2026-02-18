// Admin Panel Functionality for EasyCal - REFINED & CLEAN
// Admin Panel Functionality for EasyCal - FIXED VERSION
class AdminPanel {
    constructor() {
        this.currentAdmin = null;
        this.users = [];
        this.init();
    }

    init() {
        console.log('🚀 Initializing Admin Panel...');
        
        // Check if we're on admin page
        if (!document.querySelector('.admin-container')) {
            console.log('Not on admin page, skipping initialization');
            return;
        }
        
        this.checkAdminAuthentication();
        this.loadAdminData();
        this.loadUsersData();
        
        // Small delay to ensure DOM is fully ready
        setTimeout(() => {
            this.setupEventListeners();
            this.setupTabSystem();
            this.setupModal();
            this.updateStats();
            console.log('✅ Admin Panel initialized successfully');
        }, 100);
    }

    // Check if user is admin
    checkAdminAuthentication() {
        const userData = localStorage.getItem('currentUser');
        if (!userData) {
            window.location.href = 'index.html';
            return;
        }

        try {
            this.currentAdmin = JSON.parse(userData);
            
            if (this.currentAdmin.role !== 'admin') {
                window.location.href = 'dashboard.html';
                return;
            }
        } catch (error) {
            console.error('Error parsing user data:', error);
            window.location.href = 'index.html';
        }
    }

    // Load admin data
    loadAdminData() {
        if (this.currentAdmin) {
            const adminNameElement = document.getElementById('adminName');
            if (adminNameElement) {
                adminNameElement.textContent = this.currentAdmin.name || 'Admin';
            }
            
            // Also update any other admin info elements
            const adminEmailElement = document.getElementById('adminEmail');
            if (adminEmailElement && this.currentAdmin.email) {
                adminEmailElement.textContent = this.currentAdmin.email;
            }
        }
    }

    // Load users data from localStorage and merge with default users
    loadUsersData() {
        try {
            // Load from localStorage
            const storedUsers = localStorage.getItem("easycal_users");
            let localUsers = [];

            if (storedUsers && storedUsers !== "undefined") {
                localUsers = JSON.parse(storedUsers);
            } else {
                localUsers = [];
                localStorage.setItem("easycal_users", JSON.stringify(localUsers));
            }

            // Load default users from auth.js if available
            let defaultUsers = [];
            if (typeof window.defaultUsers !== 'undefined') {
                defaultUsers = window.defaultUsers;
            }

            // Merge localStorage users + default users
            const mergedUsers = [...localUsers];

            defaultUsers.forEach(defaultUser => {
                if (!mergedUsers.find(u => u.phone === defaultUser.phone)) {
                    // Ensure default users have required fields
                    const newUser = {
                        ...defaultUser,
                        role: defaultUser.role || 'user',
                        loginHistory: defaultUser.loginHistory || [],
                        id: defaultUser.id || 'user_' + Date.now() + Math.random().toString(36).substr(2, 9)
                    };
                    mergedUsers.push(newUser);
                }
            });

            this.users = mergedUsers;
            
            // Save merged users back to localStorage
            localStorage.setItem("easycal_users", JSON.stringify(this.users));

            console.log("Loaded users:", this.users.length);
            this.renderUsersTable();
        } catch (error) {
            console.error("Error loading users:", error);
            this.users = [];
            localStorage.setItem("easycal_users", JSON.stringify([]));
            this.renderUsersTable();
        }
    }

    // Save users to localStorage
    saveUsers() {
        try {
            localStorage.setItem('easycal_users', JSON.stringify(this.users));
            console.log('Users saved:', this.users.length);
            return true;
        } catch (error) {
            console.error('Error saving users:', error);
            return false;
        }
    }

    // Setup event listeners
    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            // Remove any existing listeners to prevent duplicates
            logoutBtn.replaceWith(logoutBtn.cloneNode(true));
            const newLogoutBtn = document.getElementById('logoutBtn');
            newLogoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Logout button clicked');
                this.logout();
            });
        } else {
            console.error('Logout button not found!');
        }

        // Add user button
        const addUserBtn = document.getElementById('addUserBtn');
        if (addUserBtn) {
            addUserBtn.replaceWith(addUserBtn.cloneNode(true));
            const newAddUserBtn = document.getElementById('addUserBtn');
            newAddUserBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Add user button clicked');
                this.openAddUserModal();
            });
        } else {
            console.error('Add user button not found!');
        }

        // Mobile menu toggle if exists
        const menuToggle = document.getElementById('menuToggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                document.querySelector('.admin-sidebar').classList.toggle('active');
            });
        }

        // Make adminPanel globally available
        window.adminPanel = this;
        console.log('✅ Event listeners setup completed');
    }

    // Setup tab system
    setupTabSystem() {
        const tabLinks = document.querySelectorAll('.admin-menu .menu-link[data-tab]');
        
        if (tabLinks.length === 0) {
            console.warn('No tab links found');
            return;
        }
        
        console.log(`Found ${tabLinks.length} tab links`);
        
        tabLinks.forEach(link => {
            // Remove existing listeners
            link.replaceWith(link.cloneNode(true));
        });
        
        // Re-query after cloning
        const newTabLinks = document.querySelectorAll('.admin-menu .menu-link[data-tab]');
        
        newTabLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                const tabId = link.getAttribute('data-tab');
                console.log('Tab clicked:', tabId);
                
                // Update active states for menu items
                newTabLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                // Switch tab content
                this.switchTab(tabId);
            });
        });
        
        // Set first tab as active by default if none active
        const hasActive = Array.from(newTabLinks).some(link => link.classList.contains('active'));
        if (!hasActive && newTabLinks.length > 0) {
            newTabLinks[0].classList.add('active');
            this.switchTab(newTabLinks[0].getAttribute('data-tab'));
        }
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
            console.log(`Switched to tab: ${tabId}`);
        } else {
            console.error(`Tab content not found: ${tabId}Tab`);
        }
        
        // Update stats if switching to analytics
        if (tabId === 'analytics') {
            this.updateStats();
        }
        
        // Refresh table if switching to users tab
        if (tabId === 'users') {
            this.renderUsersTable();
        }
    }

    // Setup modal functionality
    setupModal() {
        const modal = document.getElementById('userModal');
        const closeBtn = document.querySelector('.close');
        const cancelBtn = document.getElementById('cancelBtn');
        const userForm = document.getElementById('userForm');

        if (!modal) {
            console.error('Modal element not found');
            return;
        }

        // Close modal function
        const closeModal = () => {
            console.log('Closing modal');
            modal.style.display = 'none';
            if (userForm) {
                userForm.reset();
            }
            const editUserId = document.getElementById('editUserId');
            if (editUserId) {
                editUserId.value = '';
            }
            
            // Remove modal-open class from body
            document.body.classList.remove('modal-open');
        };

        // Close button
        if (closeBtn) {
            closeBtn.replaceWith(closeBtn.cloneNode(true));
            document.querySelector('.close').addEventListener('click', closeModal);
        }

        // Cancel button
        if (cancelBtn) {
            cancelBtn.replaceWith(cancelBtn.cloneNode(true));
            document.getElementById('cancelBtn').addEventListener('click', closeModal);
        }

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'block') {
                closeModal();
            }
        });

        // Form submission
        if (userForm) {
            userForm.replaceWith(userForm.cloneNode(true));
            const newUserForm = document.getElementById('userForm');
            newUserForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('User form submitted');
                this.saveUser();
            });
        }

        console.log('✅ Modal setup completed');
    }

    // Open add user modal
    openAddUserModal() {
        console.log('Opening add user modal...');
        
        const modal = document.getElementById('userModal');
        const modalTitle = document.getElementById('modalTitle');
        
        if (!modal) {
            console.error('Modal element not found!');
            alert('Error: Modal not available');
            return;
        }
        
        if (modalTitle) {
            modalTitle.textContent = 'Add New User';
        }
        
        const editUserId = document.getElementById('editUserId');
        if (editUserId) {
            editUserId.value = '';
        }
        
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
        
        // Clear password field for new user
        const passwordInput = document.getElementById('userPassword');
        if (passwordInput) {
            passwordInput.value = '';
            passwordInput.removeAttribute('readonly');
        }
        
        modal.style.display = 'block';
        document.body.classList.add('modal-open');
        console.log('✅ Add user modal opened successfully');
    }

    // Open edit user modal
    openEditUserModal(userId) {
        console.log('Opening edit modal for user:', userId);
        const user = this.users.find(u => u.id === userId);
        
        if (!user) {
            alert('User not found!');
            return;
        }

        const modal = document.getElementById('userModal');
        const modalTitle = document.getElementById('modalTitle');
        
        if (!modal) {
            console.error('Modal element not found!');
            return;
        }
        
        if (modalTitle) {
            modalTitle.textContent = 'Edit User';
        }
        
        // Fill form with user data
        const editUserId = document.getElementById('editUserId');
        if (editUserId) editUserId.value = user.id;
        
        const userName = document.getElementById('userName');
        if (userName) userName.value = user.name || '';
        
        const userPhone = document.getElementById('userPhone');
        if (userPhone) userPhone.value = user.phone || '';
        
        const userPassword = document.getElementById('userPassword');
        if (userPassword) {
            userPassword.value = user.password || '';
            // Optional: Make password read-only in edit mode
            // userPassword.setAttribute('readonly', true);
        }
        
        const userExpiry = document.getElementById('userExpiry');
        if (userExpiry) userExpiry.value = user.expiryDate || '';
        
        const userCustomLink = document.getElementById('userCustomLink');
        if (userCustomLink) userCustomLink.value = user.customLink || '';
        
        modal.style.display = 'block';
        document.body.classList.add('modal-open');
        console.log('✅ Edit user modal opened for:', user.name);
    }

    // Save user (add or edit)
    saveUser() {
        console.log('Save user function called');
        
        const userId = document.getElementById('editUserId').value;
        
        // Get form values
        const nameInput = document.getElementById('userName');
        const phoneInput = document.getElementById('userPhone');
        const passwordInput = document.getElementById('userPassword');
        const expiryInput = document.getElementById('userExpiry');
        const customLinkInput = document.getElementById('userCustomLink');
        
        // Validate inputs exist
        if (!nameInput || !phoneInput || !passwordInput || !expiryInput) {
            alert('Form elements not found!');
            return;
        }
        
        const userData = {
            name: nameInput.value.trim(),
            phone: phoneInput.value.trim(),
            password: passwordInput.value,
            expiryDate: expiryInput.value,
            customLink: customLinkInput ? customLinkInput.value.trim() : '',
            role: 'user',
            loginHistory: []
        };

        console.log('User data to save:', userData);

        // Validate required fields
        if (!userData.name) {
            alert('Please enter user name!');
            nameInput.focus();
            return;
        }
        
        if (!userData.phone) {
            alert('Please enter phone number!');
            phoneInput.focus();
            return;
        }
        
        if (!userData.password) {
            alert('Please enter password!');
            passwordInput.focus();
            return;
        }
        
        if (!userData.expiryDate) {
            alert('Please select expiry date!');
            expiryInput.focus();
            return;
        }

        // Validate phone number
        if (!this.validatePhone(userData.phone)) {
            alert('Please enter a valid 10-11 digit phone number');
            phoneInput.focus();
            return;
        }

        // Validate password
        if (userData.password.length < 4) {
            alert('Password must be at least 4 characters long');
            passwordInput.focus();
            return;
        }

        // Check if phone number already exists (for new users)
        if (!userId) {
            const existingUser = this.users.find(u => u.phone === userData.phone);
            if (existingUser) {
                alert('Phone number already registered! Please use a different phone number.');
                phoneInput.focus();
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
                userData.id = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                userData.loginHistory = [];
                this.users.push(userData);
                console.log('New user added:', userData);
            }

            // Save to localStorage
            const saved = this.saveUsers();
            if (!saved) {
                throw new Error('Failed to save to localStorage');
            }
            
            // Refresh the table
            this.renderUsersTable();
            this.updateStats();
            
            // Close modal
            const modal = document.getElementById('userModal');
            if (modal) {
                modal.style.display = 'none';
                document.body.classList.remove('modal-open');
            }
            
            // Reset form
            const userForm = document.getElementById('userForm');
            if (userForm) userForm.reset();
            
            alert(userId ? 'User updated successfully!' : 'User created successfully!');
            
        } catch (error) {
            console.error('Error saving user:', error);
            alert('Error saving user: ' + error.message);
        }
    }

    // Delete user
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

    // View user details
    viewUserDetails(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) {
            alert('User not found!');
            return;
        }

        let details = `📋 USER DETAILS\n`;
        details += `═══════════════\n\n`;
        details += `👤 Name: ${user.name}\n`;
        details += `📱 Phone: ${user.phone}\n`;
        details += `⏰ Expiry: ${this.formatDate(user.expiryDate)}\n`;
        details += `📊 Status: ${this.isUserExpired(user.expiryDate) ? '❌ EXPIRED' : '✅ ACTIVE'}\n`;
        details += `🔗 Custom Link: ${user.customLink || 'Not set'}\n\n`;
        details += `📝 Login History:\n`;
        
        if (user.loginHistory && user.loginHistory.length > 0) {
            user.loginHistory.forEach((session, index) => {
                const loginTime = this.formatDateTime(session.login);
                const logoutTime = session.logout ? this.formatDateTime(session.logout) : 'Still logged in';
                details += `  ${index + 1}. 📅 ${loginTime} → ${logoutTime}\n`;
            });
        } else {
            details += '  No login history available\n';
        }

        // Use a custom modal or alert (consider using a nice modal instead of alert)
        alert(details);
    }

    // Validate phone number
    validatePhone(phone) {
        const phoneRegex = /^[0-9]{10,11}$/;
        return phoneRegex.test(phone);
    }

    // Render users table
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
                    <td colspan="7" style="text-align: center; padding: 40px; color: #7f8c8d;">
                        <div style="font-size: 16px; margin-bottom: 10px;">📭 No users found</div>
                        <div style="font-size: 14px;">Click "Add New User" to create your first user.</div>
                    </td>
                </tr>
            `;
            return;
        }

        // Filter out admin users if needed
        const regularUsers = this.users.filter(user => user.role === 'user');
        
        if (regularUsers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 40px; color: #7f8c8d;">
                        <div style="font-size: 16px; margin-bottom: 10px;">👥 No regular users found</div>
                        <div style="font-size: 14px;">Click "Add New User" to create your first user.</div>
                    </td>
                </tr>
            `;
            return;
        }

        regularUsers.forEach(user => {
            const row = document.createElement('tr');
            
            const isExpired = this.isUserExpired(user.expiryDate);
            const status = isExpired ? 'expired' : 'active';
            const statusText = isExpired ? 'Expired' : 'Active';
            
            const lastLogin = user.loginHistory && user.loginHistory.length > 0 
                ? this.formatDateTime(user.loginHistory[user.loginHistory.length - 1].login)
                : 'Never';
            
            // Safely escape user data for onclick attributes
            const safeUserId = user.id.replace(/'/g, "\\'");
            
            row.innerHTML = `
                <td>${this.escapeHtml(user.name || 'N/A')}</td>
                <td>${this.escapeHtml(user.phone || 'N/A')}</td>
                <td>${this.formatDate(user.expiryDate)}</td>
                <td>${lastLogin}</td>
                <td><span class="status-badge status-${status}">${statusText}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-edit btn-sm" onclick="adminPanel.openEditUserModal('${safeUserId}')">
                            Edit
                        </button>
                        <button class="btn btn-delete btn-sm" onclick="adminPanel.deleteUser('${safeUserId}')">
                            Delete
                        </button>
                        <button class="btn btn-view btn-sm" onclick="adminPanel.viewUserDetails('${safeUserId}')">
                            Details
                        </button>
                    </div>
                </td>
            `;
            
            tbody.appendChild(row);
        });
        
        console.log('✅ Users table rendered successfully with', regularUsers.length, 'users');
    }

    // Helper method to escape HTML
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Check if user is expired
    isUserExpired(expiryDate) {
        if (!expiryDate) return true;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = new Date(expiryDate);
        expiry.setHours(0, 0, 0, 0);
        return expiry < today;
    }

    // Update statistics
    updateStats() {
        const regularUsers = this.users.filter(u => u.role === 'user');
        const totalUsers = regularUsers.length;
        const activeUsers = regularUsers.filter(u => !this.isUserExpired(u.expiryDate)).length;
        const expiredUsers = totalUsers - activeUsers;
        
        // Calculate today's logins
        const today = new Date().toISOString().split('T')[0];
        const todayLogins = regularUsers.reduce((count, user) => {
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
            if (element) {
                element.textContent = value;
            } else {
                console.warn(`Element not found: ${id}`);
            }
        };

        updateElement('totalUsers', totalUsers);
        updateElement('activeUsers', activeUsers);
        updateElement('expiredUsers', expiredUsers);
        updateElement('todayLogins', todayLogins);

        this.renderRecentActivity();
    }

    // Render recent activity
    renderRecentActivity() {
        const activityList = document.getElementById('activityList');
        if (!activityList) {
            console.warn('Activity list element not found');
            return;
        }

        // Get all login sessions from all users
        const allSessions = [];
        this.users.forEach(user => {
            if (user.loginHistory && user.loginHistory.length > 0) {
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
            activityList.innerHTML = '<div style="text-align: center; color: #7f8c8d; padding: 20px;">No recent activity</div>';
            return;
        }

        activityList.innerHTML = '';
        recentSessions.forEach(session => {
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';
            
            const isActive = !session.logout;
            const statusIcon = isActive ? '🟢' : '🔴';
            const statusText = isActive ? 'Active' : 'Logged out';
            
            activityItem.innerHTML = `
                <div class="activity-info">
                    <h4>${this.escapeHtml(session.user)}</h4>
                    <p>${this.escapeHtml(session.phone)} • ${statusIcon} ${statusText}</p>
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
        try {
            const options = { year: 'numeric', month: 'short', day: 'numeric' };
            return new Date(dateString).toLocaleDateString('en-US', options);
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Invalid date';
        }
    }

    // Format date and time for display
    formatDateTime(dateTimeString) {
        if (!dateTimeString) return 'Unknown';
        try {
            const options = { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit', 
                minute: '2-digit' 
            };
            return new Date(dateTimeString).toLocaleDateString('en-US', options);
        } catch (error) {
            console.error('Error formatting datetime:', error);
            return 'Invalid date';
        }
    }

    // Logout admin
    logout() {
        console.log('Logging out admin...');
        
        // Store logout time
        const loginTime = localStorage.getItem('loginTime');
        if (loginTime && this.currentAdmin) {
            const logoutTime = new Date().toISOString();
            console.log('Admin session ended:', {
                admin: this.currentAdmin.name,
                login: loginTime,
                logout: logoutTime
            });
        }
        
        // Clear admin session
        localStorage.removeItem('currentUser');
        localStorage.removeItem('loginTime');
        
        // Redirect to login page
        window.location.href = 'index.html';
    }
}

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing Admin Panel...');
    
    // Check if we're on admin page
    if (document.querySelector('.admin-container')) {
        window.adminPanel = new AdminPanel();
    } else {
        console.log('Not on admin page, skipping admin panel initialization');
    }
});

// Global functions for HTML onclick attributes
window.openAddUserModal = function() {
    if (window.adminPanel) {
        window.adminPanel.openAddUserModal();
    } else {
        console.error('adminPanel not initialized!');
        alert('Admin panel not ready. Please refresh the page.');
    }
};

window.openEditUserModal = function(userId) {
    if (window.adminPanel) {
        window.adminPanel.openEditUserModal(userId);
    } else {
        console.error('adminPanel not initialized!');
        alert('Admin panel not ready. Please refresh the page.');
    }
};

window.deleteUser = function(userId) {
    if (window.adminPanel) {
        window.adminPanel.deleteUser(userId);
    } else {
        console.error('adminPanel not initialized!');
        alert('Admin panel not ready. Please refresh the page.');
    }
};

window.viewUserDetails = function(userId) {
    if (window.adminPanel) {
        window.adminPanel.viewUserDetails(userId);
    } else {
        console.error('adminPanel not initialized!');
        alert('Admin panel not ready. Please refresh the page.');
    }
};