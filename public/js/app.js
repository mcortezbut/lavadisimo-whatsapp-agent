// App principal para Lavadísimo
document.addEventListener('DOMContentLoaded', function() {
    // Elementos globales
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const loginBtn = document.getElementById('loginBtn');
    const loginModal = document.getElementById('loginModal');
    const closeModal = document.querySelector('.close-modal');
    const loginForm = document.getElementById('loginForm');
    const registerLink = document.getElementById('registerLink');

    // Menu toggle para móviles
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });

        // Cerrar menú al hacer clic en un enlace
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
            });
        });
    }

    // Modal de login
    if (loginBtn && loginModal) {
        loginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            loginModal.style.display = 'flex';
        });
    }

    if (closeModal) {
        closeModal.addEventListener('click', function() {
            loginModal.style.display = 'none';
        });
    }

    // Cerrar modal al hacer clic fuera del contenido
    loginModal?.addEventListener('click', function(e) {
        if (e.target === loginModal) {
            loginModal.style.display = 'none';
        }
    });

    // Manejo del formulario de login
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            // Validación básica
            if (!email || !password) {
                alert('Por favor, completa todos los campos.');
                return;
            }
            
            // Simulación de login exitoso
            alert('¡Inicio de sesión exitoso! Redirigiendo...');
            loginModal.style.display = 'none';
            
            // Limpiar formulario
            loginForm.reset();
            
            // En un entorno real, aquí se haría una petición al servidor
            console.log('Login attempt:', { email, password });
        });
    }

    // Enlace de registro
    if (registerLink) {
        registerLink.addEventListener('click', function(e) {
            e.preventDefault();
            // Redirigir a la página del carrito con parámetro para abrir registro
            window.location.href = 'cart.html?show=register';
        });
    }

    // Sistema de scroll suave para anclas
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Solo manejar anclas internas (que no sean # solo)
            if (href !== '#' && href.startsWith('#')) {
                e.preventDefault();
                const targetElement = document.querySelector(href);
                
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // Detectar parámetros de URL para destacar servicios
    const urlParams = new URLSearchParams(window.location.search);
    const serviceParam = urlParams.get('service');
    
    if (serviceParam) {
        // Scroll a la sección del servicio después de un pequeño delay
        setTimeout(() => {
            const serviceSection = document.getElementById(serviceParam);
            if (serviceSection) {
                window.scrollTo({
                    top: serviceSection.offsetTop - 100,
                    behavior: 'smooth'
                });
                
                // Destacar la sección
                serviceSection.style.backgroundColor = 'var(--light-color)';
                serviceSection.style.transition = 'background-color 0.5s ease';
                
                setTimeout(() => {
                    serviceSection.style.backgroundColor = '';
                }, 3000);
            }
        }, 500);
    }

    // Sistema de notificaciones
    window.showNotification = function(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close"><i class="fas fa-times"></i></button>
        `;
        
        document.body.appendChild(notification);
        
        // Mostrar notificación
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Cerrar notificación
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        });
        
        // Auto cerrar después de 5 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 5000);
    };

    // Agregar estilos para notificaciones
    const notificationStyles = document.createElement('style');
    notificationStyles.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-lg);
            padding: 15px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            min-width: 300px;
            max-width: 400px;
            transform: translateX(400px);
            transition: transform 0.3s ease;
            z-index: 3000;
            border-left: 4px solid var(--primary-color);
        }
        
        .notification.show {
            transform: translateX(0);
        }
        
        .notification-success {
            border-left-color: var(--success-color);
        }
        
        .notification-error {
            border-left-color: var(--danger-color);
        }
        
        .notification-info {
            border-left-color: var(--primary-color);
        }
        
        .notification-content {
            display: flex;
            align-items: center;
            gap: 10px;
            flex: 1;
        }
        
        .notification-content i {
            font-size: 20px;
        }
        
        .notification-success .notification-content i {
            color: var(--success-color);
        }
        
        .notification-error .notification-content i {
            color: var(--danger-color);
        }
        
        .notification-info .notification-content i {
            color: var(--primary-color);
        }
        
        .notification-close {
            background: none;
            border: none;
            color: var(--gray);
            cursor: pointer;
            font-size: 16px;
            padding: 0;
            margin-left: 10px;
        }
        
        .notification-close:hover {
            color: var(--dark-color);
        }
    `;
    
    document.head.appendChild(notificationStyles);

    // Detectar si estamos en la página de servicios y agregar funcionalidad de precios
    if (document.querySelector('.service-detail')) {
        // Simular carga de precios desde API
        const priceItems = document.querySelectorAll('.price-item');
        
        priceItems.forEach(item => {
            item.addEventListener('click', function() {
                const serviceType = this.querySelector('.service-type').textContent;
                const price = this.querySelector('.price').textContent;
                
                // Mostrar notificación con la selección
                showNotification(`Has seleccionado: ${serviceType} - ${price}`, 'info');
                
                // En un entorno real, aquí se guardaría en el estado de la reserva
                console.log('Service selected:', { serviceType, price });
            });
        });
    }

    // Sistema de detección de scroll para navbar
    let lastScroll = 0;
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll <= 100) {
            navbar.style.boxShadow = 'var(--shadow)';
            navbar.style.transform = 'translateY(0)';
        } else if (currentScroll > lastScroll) {
            // Scroll hacia abajo
            navbar.style.transform = 'translateY(-100%)';
        } else {
            // Scroll hacia arriba
            navbar.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.2)';
            navbar.style.transform = 'translateY(0)';
        }
        
        lastScroll = currentScroll;
    });

    // Funcionalidad para formularios de contacto (excluir formularios del sistema de carrito y autenticación)
    const excludedFormIds = ['loginForm', 'registerForm', 'form-alfombras', 'form-vehiculos', 'form-pisos', 'form-simple', 'whatsapp-form', 'login-form', 'name-form', 'email-form'];
    const contactForms = document.querySelectorAll('form');
    
    contactForms.forEach(form => {
        // Solo manejar formularios que no están en la lista de excluidos
        if (!excludedFormIds.includes(form.id)) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                showNotification('Mensaje enviado correctamente. Te contactaremos pronto.', 'success');
                form.reset();
            });
        }
    });

    // Inicializar tooltips si existen
    const tooltipElements = document.querySelectorAll('[title]');
    
    tooltipElements.forEach(element => {
        element.addEventListener('mouseenter', function(e) {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = this.getAttribute('title');
            
            const rect = this.getBoundingClientRect();
            tooltip.style.position = 'fixed';
            tooltip.style.top = rect.top - 40 + 'px';
            tooltip.style.left = rect.left + (rect.width / 2) + 'px';
            tooltip.style.transform = 'translateX(-50%)';
            
            document.body.appendChild(tooltip);
            
            this._tooltip = tooltip;
        });
        
        element.addEventListener('mouseleave', function() {
            if (this._tooltip) {
                this._tooltip.remove();
                this._tooltip = null;
            }
        });
    });

    // Detectar si la página se está ejecutando desde file:// (archivo local)
    if (window.location.protocol === 'file:') {
        alert('⚠️ ADVERTENCIA: Estás abriendo el sitio directamente desde un archivo.\n\nPara que todas las funciones funcionen correctamente (registro, carrito, etc.), debes acceder a través del servidor local:\n\nhttp://localhost:3000\n\nPor favor, asegúrate de que el servidor esté ejecutándose y visita esa dirección.');
    }
});
