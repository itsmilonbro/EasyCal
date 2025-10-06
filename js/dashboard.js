// Dashboard Functionality for EasyCal - UPDATED

class Dashboard {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.checkAuthentication();
        this.loadUserData();
        this.setupEventListeners();
        this.setupMenuInteractions();
    }

    // Check if user is authenticated
    checkAuthentication() {
        const userData = localStorage.getItem('currentUser');
        if (!userData) {
            window.location.href = 'index.html';
            return;
        }

        this.currentUser = JSON.parse(userData);
        
        // Check if user is expired
        if (this.isUserExpired(this.currentUser.expiryDate)) {
            localStorage.setItem('expiredUser', JSON.stringify(this.currentUser));
            window.location.href = 'payment.html';
            return;
        }
    }

    // Check if user is expired
    isUserExpired(expiryDate) {
        const today = new Date().toISOString().split('T')[0];
        return expiryDate < today;
    }

    // Load user data into the dashboard
    loadUserData() {
        if (this.currentUser) {
            document.getElementById('userName').textContent = this.currentUser.name;
            document.getElementById('expiryDate').textContent = this.formatDate(this.currentUser.expiryDate);
        }
    }

    // Format date for display
    formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    // Setup event listeners
    setupEventListeners() {
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }

        // Iframe load event
        const toolFrame = document.getElementById('toolFrame');
        if (toolFrame) {
            toolFrame.addEventListener('load', () => {
                this.updateToolInfo();
            });
        }

        // Handle browser back/forward buttons
        window.addEventListener('popstate', (event) => {
            if (event.state && event.state.toolUrl) {
                this.loadTool(event.state.toolUrl, event.state.toolTitle);
            }
        });
    }

    // Setup menu interactions
    setupMenuInteractions() {
        const menuItems = document.querySelectorAll('.has-submenu');
        
        menuItems.forEach(item => {
            const menuLink = item.querySelector('.menu-link');
            
            menuLink.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Close other open menus
                menuItems.forEach(otherItem => {
                    if (otherItem !== item && otherItem.classList.contains('active')) {
                        otherItem.classList.remove('active');
                    }
                });
                
                // Toggle current menu
                item.classList.toggle('active');
            });
        });

        // Submenu link clicks
        const submenuLinks = document.querySelectorAll('.submenu a');
        submenuLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                const toolUrl = link.getAttribute('href');
                const toolTitle = link.textContent;
                
                this.loadTool(toolUrl, toolTitle);
                
                // Update active states
                submenuLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                // Update URL without reloading
                history.pushState(
                    { toolUrl, toolTitle }, 
                    toolTitle, 
                    `?tool=${encodeURIComponent(toolTitle)}`
                );
            });
        });
    }

    // Load tool in iframe
    loadTool(url, title) {
        const toolFrame = document.getElementById('toolFrame');
        const toolTitle = document.getElementById('toolTitle');
        const toolDescription = document.getElementById('toolDescription');
        
        if (!toolFrame || !toolTitle || !toolDescription) return;
        
        // Show loading state
        toolTitle.textContent = 'Loading...';
        toolDescription.textContent = 'Please wait while the tool loads';
        
        toolFrame.onload = () => {
            this.updateToolInfo();
        };
        
        toolFrame.src = url;
        
        // Store current tool info
        this.currentTool = { url, title };
    }

    // Update tool information display
    updateToolInfo() {
        const toolTitle = document.getElementById('toolTitle');
        const toolDescription = document.getElementById('toolDescription');
        
        if (!toolTitle || !toolDescription) return;
        
        if (this.currentTool) {
            toolTitle.textContent = this.currentTool.title;
            toolDescription.textContent = `${this.currentTool.title} - EasyCal Calculation Tool`;
        } else {
            toolTitle.textContent = 'EasyCal Dashboard';
            toolDescription.textContent = 'Select a tool from the menu to start calculating';
        }
    }

    // Logout user
    logout() {
        // Store logout time
        const loginTime = localStorage.getItem('loginTime');
        if (loginTime && this.currentUser) {
            const logoutTime = new Date().toISOString();
            
            // Update user logout time in localStorage
            this.updateUserLogoutTime(this.currentUser.phone, logoutTime);
        }
        
        // Clear storage and redirect
        localStorage.removeItem('currentUser');
        localStorage.removeItem('loginTime');
        window.location.href = 'index.html';
    }

    // Update user logout time in localStorage
    updateUserLogoutTime(phone, logoutTime) {
        const storedUsers = localStorage.getItem('easycal_users');
        if (storedUsers) {
            const users = JSON.parse(storedUsers);
            const userIndex = users.findIndex(u => u.phone === phone);
            if (userIndex !== -1 && users[userIndex].loginHistory) {
                const lastSession = users[userIndex].loginHistory[users[userIndex].loginHistory.length - 1];
                if (lastSession && !lastSession.logout) {
                    lastSession.logout = logoutTime;
                    localStorage.setItem('easycal_users', JSON.stringify(users));
                }
            }
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Dashboard();
});

// Handle page visibility changes (tab switch)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden - user switched tabs or minimized window
        console.log('User navigated away from EasyCal');
    }
});
