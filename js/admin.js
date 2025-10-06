// Admin Panel Functionality for EasyCal

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
        this.updateStats();
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
            document.getElementById('adminName').textContent = this.currentAdmin.name;
        }
    }

    // Load users data from localStorage
    loadUsersData() {
        // In a real app, this would come from a server
        // For demo, we'll use sample data and localStorage
        const storedUsers = localStorage.getItem('easycal_users');
        
        if (storedUsers) {
            this.users = JSON.parse(storedUsers);
        } else {
            // Sample users for demo
            this.users = [
                {
                    id: '1',
                    phone: '0123456789',
                    password: '1234',
                    name: 'Demo User',
                    role: 'user',
                    expiryDate: '2024-12-31',
                    customLink: 'https://payment.com/user123',
                    loginHistory: [
                        { login: '2024-01-15T10:30:00Z', logout: '2024-01-15T12:45:00Z' },
                        { login: '2024-01-14T09:15:00Z', logout: '2024-01-14T11:20:00Z' }
                    ]
                },
                {
                    id: '2',
                    phone: '0987654321',
                    password: '1234',
                    name: 'Test User',
                    role: 'user',
                    expiryDate: '2024-01-20',
                    customLink: '',
                    loginHistory: [
                        { login: '2024-01-15T14:20:00Z', logout: '2024-01-15T16:30:00Z' }
                    ]
                }
            ];
            this.saveUsers();
        }
        
        this.renderUsersTable();
    }

    // Save users to localStorage
    saveUsers() {
        localStorage.setItem('easycal_users', JSON.stringify(this.users));
    }

    // Setup event listeners
    setupEventListeners() {
        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        // Add user button
        document.getElementById('addUserBtn').addEventListener('click', () => {
            this.openAddUserModal();
        });
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

    // Setup modal functionality
    setupModal() {
        const modal = document.getElementById('userModal');
        const closeBtn = document.querySelector('.close');
        const cancelBtn = document.getElementById('cancelBtn');
        const userForm = document.getElementById('userForm');

        // Open modal
        window.openAddUserModal = () => this.openAddUserModal();
        window.openEditUserModal = (userId) => this.openEditUserModal(userId);

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
    }

    // Open add user modal
    openAddUserModal() {
        const modal = document.getElementById('userModal');
        const modalTitle = document.getElementById('modalTitle');
        
        modalTitle.textContent = 'Add New User';
        document.getElementById('editUserId').value = '';
        document.getElementById('userForm').reset();
        
        // Set default expiry date to 30 days from now
        const defaultExpiry = new Date();
        defaultExpiry.setDate(defaultExpiry.getDate() + 30);
        document.getElementById('userExpiry').value = defaultExpiry.toISOString().split('T')[0];
        
        modal.style.display = 'block';
    }

    // Open edit user modal
    openEditUserModal(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        const modal = document.getElementById('userModal');
        const modalTitle = document.getElementById('modalTitle');
        
        modalTitle.textContent = 'Edit User';
        document.getElementById('editUserId').value = user.id;
        document.getElementById('userName').value = user.name;
        document.getElementById('userPhone').value = user.phone;
        document.getElementById('userPassword').value = user.password;
        document.getElementById('userExpiry').value = user.expiryDate;
        document.getElementById('userCustomLink').value = user.customLink || '';
        
        modal.style.display = 'block';
    }

    // Save user (add or edit)
    saveUser() {
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

        if (userId) {
            // Edit existing user
            const userIndex = this.users.findIndex(u => u.id === userId);
            if (userIndex !== -1) {
                // Keep existing login history
                userData.loginHistory = this.users[userIndex].loginHistory;
                userData.id = userId;
                this.users[userIndex] = userData;
            }
        } else {
            // Add new user
            userData.id = Date.now().toString();
            this.users.push(userData);
        }

        this.saveUsers();
        this.renderUsersTable();
        this.updateStats();
        
        // Close modal
        document.querySelector('.close').click();
        
        alert(userId ? 'User updated successfully!' : 'User created successfully!');
    }

    // Delete user
    deleteUser(userId) {
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

    // Render users table
    renderUsersTable() {
        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = '';

        this.users.forEach(user => {
            if (user.role === 'user') { // Don't show admin users
                const row = document.createElement('tr');
                
                const status = this.isUserExpired(user.expiryDate) ? 'expired' : 'active';
                const lastLogin = user.loginHistory && user.loginHistory.length > 0 
                    ? this.formatDateTime(user.loginHistory[user.loginHistory.length - 1].login)
                    : 'Never';
                
                row.innerHTML = `
                    <td>${user.name}</td>
                    <td>${user.phone}</td>
                    <td>${this.formatDate(user.expiryDate)}</td>
                    <td>${lastLogin}</td>
                    <td><span class="status-badge status-${status}">${status.toUpperCase()}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-edit btn-sm" onclick="window.openEditUserModal('${user.id}')">
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
    }

    // View user details
    viewUserDetails(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

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
        const today = new Date().toISOString().split('T')[0];
        return expiryDate < today;
    }

    // Update statistics
    updateStats() {
        const totalUsers = this.users.filter(u => u.role === 'user').length;
        const activeUsers = this.users.filter(u => u.role === 'user' && !this.isUserExpired(u.expiryDate)).length;
        const expiredUsers = totalUsers - activeUsers;
        
        // Calculate today's logins (simplified)
        const today = new Date().toISOString().split('T')[0];
        const todayLogins = this.users.reduce((count, user) => {
            if (user.loginHistory) {
                const hasTodayLogin = user.loginHistory.some(session => 
                    session.login.startsWith(today)
                );
                return count + (hasTodayLogin ? 1 : 0);
            }
            return count;
        }, 0);

        document.getElementById('totalUsers').textContent = totalUsers;
        document.getElementById('activeUsers').textContent = activeUsers;
        document.getElementById('expiredUsers').textContent = expiredUsers;
        document.getElementById('todayLogins').textContent = todayLogins;

        this.renderRecentActivity();
    }

    // Render recent activity
    renderRecentActivity() {
        const activityList = document.getElementById('activityList');
        activityList.innerHTML = '';

        // Get all login sessions from all users
        const allSessions = [];
        this.users.forEach(user => {
            if (user.loginHistory) {
                user.loginHistory.forEach(session => {
                    allSessions.push({
                        user: user.name,
                        phone: user.phone,
                        login: session.login,
                        logout: session.logout
                    });
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
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    // Format date and time for display
    formatDateTime(dateTimeString) {
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
        localStorage.removeItem('currentUser');
        localStorage.removeItem('loginTime');
        window.location.href = 'index.html';
    }
}

// Initialize admin panel when DOM is loaded
let adminPanel;
document.addEventListener('DOMContentLoaded', () => {
    adminPanel = new AdminPanel();
});
