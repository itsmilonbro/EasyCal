// Authentication System for EasyCal

// Sample User Data (In real app, this would be in a database)
const users = [
    {
        phone: '0123456789',
        password: '1234',
        name: 'Demo User',
        role: 'user',
        expiryDate: '2024-12-31',
        customLink: 'https://payment-link.com/user123'
    },
    {
        phone: '0111111111',
        password: 'admin123',
        name: 'System Admin',
        role: 'admin',
        expiryDate: '2099-12-31',
        customLink: ''
    }
];

// DOM Elements
const loginForm = document.getElementById('loginForm');
const phoneInput = document.getElementById('phone');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const phoneError = document.getElementById('phoneError');
const passwordError = document.getElementById('passwordError');

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
    const btnText = loginBtn.querySelector('.btn-text');
    const btnLoading = loginBtn.querySelector('.btn-loading');
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';
    loginBtn.disabled = true;
}

function hideLoading() {
    const btnText = loginBtn.querySelector('.btn-text');
    const btnLoading = loginBtn.querySelector('.btn-loading');
    btnText.style.display = 'inline';
    btnLoading.style.display = 'none';
    loginBtn.disabled = false;
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

// Login Function
function loginUser(phone, password) {
    // Find user by phone number
    const user = users.find(u => u.phone === phone);
    
    if (!user) {
        throw new Error('Phone number not registered');
    }
    
    if (user.password !== password) {
        throw new Error('Invalid password');
    }
    
    // Check if user is expired
    if (user.role === 'user' && isUserExpired(user.expiryDate)) {
        // Store user data for payment page
        localStorage.setItem('expiredUser', JSON.stringify(user));
        window.location.href = 'payment.html';
        return null;
    }
    
    return user;
}

// Event Listeners
phoneInput.addEventListener('input', () => {
    if (validatePhone(phoneInput.value)) {
        hideError(phoneError);
    }
});

passwordInput.addEventListener('input', () => {
    if (validatePassword(passwordInput.value)) {
        hideError(passwordError);
    }
});

// Form Submission
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

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    checkExistingLogin();
    
    // Add demo credentials fill for testing
    if (window.location.search.includes('demo=user')) {
        phoneInput.value = '0123456789';
        passwordInput.value = '1234';
    }
    
    if (window.location.search.includes('demo=admin')) {
        phoneInput.value = '0111111111';
        passwordInput.value = 'admin123';
    }
});
