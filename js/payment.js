// Payment Page Functionality - COMPLETE

class PaymentPage {
    constructor() {
        this.expiredUser = null;
        this.init();
    }

    init() {
        this.loadUserData();
        this.setupPaymentLink();
        this.setupEventListeners();
    }

    // Load expired user data
    loadUserData() {
        const expiredUserData = localStorage.getItem('expiredUser');
        
        if (!expiredUserData) {
            // No expired user data, redirect to login
            window.location.href = 'index.html';
            return;
        }

        this.expiredUser = JSON.parse(expiredUserData);
        this.displayUserInfo();
    }

    // Display user information
    displayUserInfo() {
        if (this.expiredUser) {
            document.getElementById('userName').textContent = this.expiredUser.name;
            document.getElementById('userPhone').textContent = this.expiredUser.phone;
            document.getElementById('expiryDate').textContent = this.formatDate(this.expiredUser.expiryDate);
            
            // Set payment link
            const paymentLink = this.expiredUser.customLink || 'https://easypayment.example.com';
            const paymentLinkElement = document.getElementById('paymentLink');
            paymentLinkElement.textContent = paymentLink;
            paymentLinkElement.setAttribute('href', paymentLink);
            
            // Set payment link button
            document.getElementById('paymentLinkBtn').setAttribute('href', paymentLink);
            
            // Set user reference for bank transfer
            document.getElementById('userReference').textContent = `EC${this.expiredUser.phone}`;
        }
    }

    // Setup payment link functionality
    setupPaymentLink() {
        const paymentLinkBtn = document.getElementById('paymentLinkBtn');
        
        paymentLinkBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const link = paymentLinkBtn.getAttribute('href');
            if (link && link !== '#') {
                window.open(link, '_blank');
            } else {
                alert('Payment link is not configured. Please contact support.');
            }
        });
    }

    // Setup event listeners
    setupEventListeners() {
        // WhatsApp button with dynamic message
        const whatsappBtn = document.querySelector('.whatsapp-btn');
        if (whatsappBtn && this.expiredUser) {
            const message = `Hello EasyCal Support, I need help with payment renewal my Subscriptions for user: ${this.expiredUser.name} (${this.expiredUser.phone})`;
            const encodedMessage = encodeURIComponent(message);
            whatsappBtn.href = `https://wa.me/+8801955255066?text=${encodedMessage}`;
        }

        // Refresh status button
        const refreshBtn = document.querySelector('.btn-primary');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.checkPaymentStatus();
            });
        }
    }

    // Check payment status (simulated)
    checkPaymentStatus() {
        // In a real app, this would check with your payment processor
        alert('Payment status checked. If you have completed payment, your account will be activated shortly. Please contact support if activation is delayed.');
        
        // Simulate checking with server
        setTimeout(() => {
            // For demo purposes, we'll just redirect to login
            // In real app, you would verify payment and update user expiry
            window.location.href = 'index.html';
        }, 2000);
    }

    // Format date for display
    formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }
}

// Initialize payment page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PaymentPage();
});
