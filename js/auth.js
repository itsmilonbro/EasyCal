// Authentication System for EasyCal - UPDATED & FIXED

// Utility Functions
function showError(element, message) {
    element.textContent = message;
    element.style.display = 'block';
}

function hideError(element) {
    element.textContent = '';
    element.style.display = 'none';
}

function showLoading() {
    const btnText = document.querySelector('.btn-text');
    const btnLoading = document.querySelector('.btn-loading');
    if (btnText && btnLoading) {
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline';
    }
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) loginBtn.disabled = true;
}

function hideLoading() {
    const btnText = document.querySelector('.btn-text');
    const btnLoading = document.querySelector('.btn-loading');
    if (btnText && btnLoading) {
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
    }
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) loginBtn.disabled = false;
}

function validatePhone(phone) {
    const phoneRegex = /^[0-9]{10,11}$/;
    return phoneRegex.test(phone);
}

function validatePassword(password) {
    return password.length >= 4;
}

// Check if user is expired
function isUserExpired(expiryDate) {
    const today = new Date().toISOString().split('T')[0];
    return expiryDate < today;
}

// Login Function - UPDATED TO PROPERLY CHECK ALL USERS
function loginUser(phone, password) {
    console.log('Login attempt for phone:', phone);
    
    // Get users from localStorage (from admin panel)
    const storedUsers = localStorage.getItem('easycal_users');
    let allUsers = [];
    
    if (storedUsers && storedUsers !== 'undefined') {
        try {
            allUsers = JSON.parse(storedUsers);
            console.log('Loaded users from storage:', allUsers);
        } catch (error) {
            console.error('Error parsing stored users:', error);
            allUsers = [];
        }
    }
    
    // Also include the default demo users
    const defaultUsers = [
        {
            id: '1',
            phone: '0123456789',
            password: '1234',
            name: 'Demo User',
            role: 'user',
            expiryDate: '2024-12-31',
            customLink: 'https://payment-link.com/user123',
            loginHistory: []
        },
        {
            id: '2',
            phone: '01955255066',
            password: '12345',
            name: 'System Admin',
            role: 'admin',
            expiryDate: '2099-12-31',
            customLink: '',
            loginHistory: []
        }
    ];
    
    // Combine all users - prioritize stored users over defaults
    const combinedUsers = [...allUsers];
    defaultUsers.forEach(defaultUser => {
        if (!combinedUsers.find(u => u.phone === defaultUser.phone)) {
            combinedUsers.push(defaultUser);
        }
    });
    
    console.log('All available users:', combinedUsers);
    
    // Find user by phone number
    const user = combinedUsers.find(u => u.phone === phone);
    
    if (!user) {
        console.log('User not found for phone:', phone);
        throw new Error('Phone number not registered');
    }
    
    if (user.password !== password) {
        console.log('Invalid password for user:', user.name);
        throw new Error('Invalid password');
    }
    
    // Check if user is expired
    if (user.role === 'user' && isUserExpired(user.expiryDate)) {
        console.log('User expired:', user.name);
        // Store user data for payment page
        localStorage.setItem('expiredUser', JSON.stringify(user));
        window.location.href = 'payment.html';
        return null;
    }
    
    console.log('Login successful for user:', user.name);
    return user;
}

// Event Listeners and Form Submission
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const phoneInput = document.getElementById('phone');
    const passwordInput = document.getElementById('password');
    const phoneError = document.getElementById('phoneError');
    const passwordError = document.getElementById('passwordError');

    // Check if user is already logged in
    function checkExistingLogin() {
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
            const user = JSON.parse(currentUser);
            if (user.role === 'admin') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'dashboard.html';
            }
        }
    }

    // Phone input validation
    if (phoneInput) {
        phoneInput.addEventListener('input', () => {
            if (validatePhone(phoneInput.value)) {
                hideError(phoneError);
            }
        });
    }

    // Password input validation
    if (passwordInput) {
        passwordInput.addEventListener('input', () => {
            if (validatePassword(passwordInput.value)) {
                hideError(passwordError);
            }
        });
    }

    // Form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const phone = phoneInput.value.trim();
            const password = passwordInput.value.trim();
            
            // Reset errors
            hideError(phoneError);
            hideError(passwordError);
            
            // Validate inputs
            let isValid = true;
            
            if (!validatePhone(phone)) {
                showError(phoneError, 'Please enter a valid 10-11 digit phone number');
                isValid = false;
            }
            
            if (!validatePassword(password)) {
                showError(passwordError, 'Password must be at least 4 characters long');
                isValid = false;
            }
            
            if (!isValid) return;
            
            showLoading();
            
            try {
                // Simulate API call delay
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                const user = loginUser(phone, password);
                
                if (user) {
                    // Store user in localStorage
                    localStorage.setItem('currentUser', JSON.stringify(user));
                    localStorage.setItem('loginTime', new Date().toISOString());
                    
                    // Update login history
                    updateUserLoginHistory(user.phone);
                    
                    // Redirect based on role
                    if (user.role === 'admin') {
                        window.location.href = 'admin.html';
                    } else {
                        window.location.href = 'dashboard.html';
                    }
                }
            } catch (error) {
                hideLoading();
                showError(passwordError, error.message);
                passwordInput.focus();
            }
        });
    }

    // Update user login history
    function updateUserLoginHistory(phone) {
        const storedUsers = localStorage.getItem('easycal_users');
        let users = [];
        
        if (storedUsers) {
            users = JSON.parse(storedUsers);
        }
        
        const userIndex = users.findIndex(u => u.phone === phone);
        if (userIndex !== -1) {
            if (!users[userIndex].loginHistory) {
                users[userIndex].loginHistory = [];
            }
            users[userIndex].loginHistory.push({
                login: new Date().toISOString(),
                logout: null
            });
            localStorage.setItem('easycal_users', JSON.stringify(users));
        }
    }

    // Add demo credentials fill for testing
    if (phoneInput && passwordInput) {
        // Auto-fill demo credentials for testing
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('demo') === 'user') {
            phoneInput.value = '0123456789';
            passwordInput.value = '1234';
        }
        if (urlParams.get('demo') === 'admin') {
            phoneInput.value = '01955255066';
            passwordInput.value = '12345';
        }
    }

    checkExistingLogin();
});
