// Cart functionality for Lavadísimo website
// Simplified version without WhatsApp verification

// State
let cart = JSON.parse(localStorage.getItem('lavadisimo_cart')) || {};
let currentService = null;
let currentArea = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadCartFromStorage();
    updateCartDisplay();
    initServiceSelectors();
    initContactForm();
    initFileUploads();
    initPaymentMethod();
    checkServerAvailability();
});

// Check if server is running
async function checkServerAvailability() {
    if (window.location.protocol === 'file:') {
        const alert = document.createElement('div');
        alert.className = 'server-alert';
        alert.innerHTML = `
            <ol>
                <li><strong>Abre una terminal en la carpeta del proyecto</strong> (c:\\Lavadísimo\\lavadisimo-whatsapp-agent)</li>
                <li><strong>Ejecuta el servidor:</strong> <code>node src/server.js</code></li>
                <li><strong>Abre en tu navegador:</strong> <code>http://localhost:3000</code></li>
            </ol>
        `;
        document.body.prepend(alert);
    }
}

// Service selection handlers
function initServiceSelectors() {
    const serviceItems = document.querySelectorAll('.service-item');
    serviceItems.forEach(item => {
        item.addEventListener('click', function() {
            const serviceId = this.dataset.service;
            const area = this.dataset.area;
            selectService(serviceId, area);
        });
    });

    // Quantity controls
    document.querySelectorAll('.quantity-control').forEach(control => {
        control.querySelector('.minus').addEventListener('click', function() {
            const input = this.parentElement.querySelector('input');
            const current = parseInt(input.value);
            if (current > 1) input.value = current - 1;
        });
        control.querySelector('.plus').addEventListener('click', function() {
            const input = this.parentElement.querySelector('input');
            const current = parseInt(input.value);
            input.value = current + 1;
        });
    });
}

function selectService(serviceId, area) {
    currentService = serviceId;
    currentArea = area;
    showServiceForm(area, serviceId);
}

function showServiceForm(area, serviceId) {
    const formId = `form-${area}`;
    const form = document.getElementById(formId);
    if (form) {
        document.querySelectorAll('.service-form').forEach(f => f.style.display = 'none');
        form.style.display = 'block';
        form.scrollIntoView({ behavior: 'smooth' });
    }
}

// Add to cart
function addToCart(area, serviceId, serviceName, description, basePrice) {
    const quantity = parseInt(document.getElementById(`${area}-quantity`)?.value || 1);
    const itemKey = `${area}-${serviceId}`;
    
    if (!cart[area]) cart[area] = [];
    
    const existingIndex = cart[area].findIndex(item => item.service === serviceId && item.description === description);
    
    if (existingIndex >= 0) {
        cart[area][existingIndex].quantity += quantity;
    } else {
        cart[area].push({
            service: serviceId,
            serviceName: serviceName,
            description: description,
            price: basePrice,
            quantity: quantity
        });
    }
    
    saveCart();
    updateCartDisplay();
    showNotification(`${serviceName} agregado al carrito`, 'success');
}

// Cart display
function updateCartDisplay() {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');
    
    if (!cartItems) return;
    
    let itemsHtml = '';
    let total = 0;
    
    for (const [area, items] of Object.entries(cart)) {
        if (items.length === 0) continue;
        
        itemsHtml += `<div class="cart-area"><h4>${area.charAt(0).toUpperCase() + area.slice(1)}</h4>`;
        
        items.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            itemsHtml += `
                <div class="cart-item">
                    <div class="item-info">
                        <strong>${item.serviceName}</strong>
                        <p>${item.description}</p>
                        <span class="item-price">$${item.price.toLocaleString('es-CL')} x ${item.quantity}</span>
                    </div>
                    <div class="item-actions">
                        <span class="item-total">$${itemTotal.toLocaleString('es-CL')}</span>
                        <button onclick="removeFromCart('${area}', ${index})" class="remove-btn">×</button>
                    </div>
                </div>
            `;
        });
        itemsHtml += '</div>';
    }
    
    if (itemsHtml === '') {
        itemsHtml = '<p class="empty-cart">Tu carrito está vacío</p>';
        if (checkoutBtn) checkoutBtn.disabled = true;
    } else {
        if (checkoutBtn) checkoutBtn.disabled = false;
    }
    
    cartItems.innerHTML = itemsHtml;
    if (cartTotal) cartTotal.textContent = `$${total.toLocaleString('es-CL')}`;
}

function removeFromCart(area, index) {
    if (cart[area]) {
        cart[area].splice(index, 1);
        if (cart[area].length === 0) delete cart[area];
        saveCart();
        updateCartDisplay();
    }
}

function saveCart() {
    localStorage.setItem('lavadisimo_cart', JSON.stringify(cart));
}

function loadCartFromStorage() {
    cart = JSON.parse(localStorage.getItem('lavadisimo_cart')) || {};
}

// Contact form
function initContactForm() {
    const contactForms = document.querySelectorAll('form:not(#loginForm):not(#registerForm):not([id*="form-"])');
    contactForms.forEach(form => {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            
            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const result = await response.json();
                showNotification(result.message || 'Mensaje enviado', result.success ? 'success' : 'error');
                if (result.success) this.reset();
            } catch (error) {
                showNotification('Error al enviar mensaje', 'error');
            }
        });
    });
}

// File uploads
function initFileUploads() {
    document.querySelectorAll('.file-upload-area').forEach(area => {
        const input = area.querySelector('input[type="file"]');
        const preview = area.querySelector('.file-preview');
        
        if (input && preview) {
            input.addEventListener('change', function() {
                preview.innerHTML = '';
                Array.from(this.files).forEach(file => {
                    preview.innerHTML += `<div class="file-item">📎 ${file.name}</div>`;
                });
            });
        }
    });
}

// Payment method
function initPaymentMethod() {
    const paymentSelect = document.getElementById('payment-method');
    if (paymentSelect) {
        paymentSelect.addEventListener('change', function() {
            const transferDetails = document.getElementById('transfer-details');
            if (transferDetails) {
                transferDetails.style.display = this.value === 'transfer' ? 'block' : 'none';
            }
        });
    }
}

// Checkout process
async function processCheckout(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Procesando...';
    
    // Collect form data
    const formData = new FormData(form);
    const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        address: formData.get('address'),
        instructions: {
            lavanderia: formData.get('instructions-lavanderia'),
            alfombras: formData.get('instructions-alfombras'),
            pisos: formData.get('instructions-pisos'),
            tapicesVehiculos: formData.get('instructions-tapices-vehiculos')
        },
        items: cart,
        totals: calculateTotals(),
        user: JSON.parse(localStorage.getItem('lavadisimo_user') || '{}')
    };
    
    try {
        // Create order
        const orderResponse = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const orderResult = await orderResponse.json();
        
        if (orderResult.success) {
            // Process payment
            const paymentData = {
                bookingNumber: orderResult.orderNumber,
                amount: data.totals.totalPrice,
                paymentMethod: formData.get('payment-method') || 'cash',
                transactionId: formData.get('transaction-id') || null
            };
            
            const paymentResponse = await fetch('/api/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(paymentData)
            });
            
            const paymentResult = await paymentResponse.json();
            
            if (paymentResult.success) {
                showNotification('¡Orden creada exitosamente!', 'success');
                localStorage.removeItem('lavadisimo_cart');
                cart = {};
                updateCartDisplay();
                form.reset();
                window.location.href = `/seguimiento.html?order=${orderResult.orderNumber}`;
            } else {
                throw new Error(paymentResult.message);
            }
        } else {
            throw new Error(orderResult.message);
        }
    } catch (error) {
        showNotification(error.message || 'Error al procesar la orden', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

function calculateTotals() {
    let subtotal = 0;
    
    for (const [area, items] of Object.entries(cart)) {
        items.forEach(item => {
            subtotal += item.price * item.quantity;
        });
    }
    
    return {
        subtotal: subtotal,
        shippingCost: subtotal >= 30000 ? 0 : 3500,
        totalPrice: subtotal + (subtotal >= 30000 ? 0 : 3500)
    };
}

// Notification system
function showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// User authentication state
function checkAuth() {
    const user = JSON.parse(localStorage.getItem('lavadisimo_user') || '{}');
    const authElements = {
        loginBtn: document.getElementById('loginBtn'),
        registerBtn: document.getElementById('registerBtn'),
        userInfo: document.getElementById('userInfo'),
        userName: document.getElementById('userName'),
        logoutBtn: document.getElementById('logoutBtn')
    };
    
    if (user.id_usuario) {
        if (authElements.loginBtn) authElements.loginBtn.style.display = 'none';
        if (authElements.registerBtn) authElements.registerBtn.style.display = 'none';
        if (authElements.userInfo) authElements.userInfo.style.display = 'flex';
        if (authElements.userName) authElements.userName.textContent = user.nombre_completo;
    } else {
        if (authElements.loginBtn) authElements.loginBtn.style.display = 'inline-flex';
        if (authElements.registerBtn) authElements.registerBtn.style.display = 'inline-flex';
        if (authElements.userInfo) authElements.userInfo.style.display = 'none';
    }
}

// Logout function
function logout() {
    localStorage.removeItem('lavadisimo_user');
    window.location.reload();
}

// Make functions globally available
window.removeFromCart = removeFromCart;
window.logout = logout;
window.addToCart = addToCart;
