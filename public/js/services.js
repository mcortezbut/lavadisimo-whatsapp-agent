// JavaScript para página de servicios - Lavadísimo
document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    const cartCount = document.getElementById('cart-count');
    
    // Inicializar contador del carrito
    function initCartCount() {
        const savedCart = localStorage.getItem('lavadisimoCart');
        if (savedCart) {
            try {
                const cart = JSON.parse(savedCart);
                let totalItems = 0;
                
                // Sumar cantidades de todos los items en todas las áreas
                Object.values(cart).forEach(areaItems => {
                    areaItems.forEach(item => {
                        totalItems += item.quantity || 1;
                    });
                });
                
                cartCount.textContent = totalItems;
            } catch (error) {
                console.error('Error parsing cart from localStorage:', error);
                cartCount.textContent = '0';
            }
        } else {
            cartCount.textContent = '0';
        }
    }
    
    // Agregar servicio al carrito
    function handleAddToCart(event) {
        const button = event.currentTarget;
        const serviceCard = button.closest('.service-card');
        
        // Obtener datos del servicio
        const area = serviceCard.getAttribute('data-area');
        const serviceName = serviceCard.getAttribute('data-service');
        const price = parseInt(serviceCard.getAttribute('data-price'));
        const serviceTitle = serviceCard.querySelector('h3').textContent;
        const serviceDescription = serviceCard.querySelector('p').textContent;
        const serviceIcon = serviceCard.querySelector('.service-icon i').className;
        
        // Determinar el área correcta para el carrito
        let cartArea = area;
        // Si es área "tapices-vehiculos", necesitamos determinar si es tapices o vehiculos
        if (area === 'tapices-vehiculos') {
            // Basado en el servicio específico
            if (serviceName.includes('vehiculo')) {
                cartArea = 'vehiculos';
            } else {
                cartArea = 'tapices';
            }
        }
        
        // Crear objeto del servicio
        const service = {
            area: cartArea,
            service: serviceTitle,
            price: price,
            quantity: 1,
            icon: serviceIcon,
            description: serviceDescription
        };
        
        // Disparar evento personalizado para que cart.js lo maneje
        const addToCartEvent = new CustomEvent('addToCart', {
            detail: service,
            bubbles: true
        });
        
        window.dispatchEvent(addToCartEvent);
        
        // Mostrar feedback visual
        showAddToCartFeedback(button);
        
        // Actualizar contador local
        updateCartCount();
    }
    
    // Mostrar feedback visual al agregar al carrito
    function showAddToCartFeedback(button) {
        const originalText = button.innerHTML;
        const originalBgColor = button.style.backgroundColor;
        
        // Cambiar texto y color temporalmente
        button.innerHTML = '<i class="fas fa-check"></i> Agregado';
        button.style.backgroundColor = 'var(--success-color)';
        button.disabled = true;
        
        // Mostrar notificación si está disponible
        if (window.showNotification) {
            window.showNotification('Servicio agregado al carrito', 'success');
        }
        
        // Restaurar después de 2 segundos
        setTimeout(() => {
            button.innerHTML = originalText;
            button.style.backgroundColor = originalBgColor;
            button.disabled = false;
        }, 2000);
    }
    
    // Actualizar contador del carrito
    function updateCartCount() {
        // Si cartManager está disponible, usarlo
        if (window.cartManager && window.cartManager.getCart) {
            const cart = window.cartManager.getCart();
            let totalItems = 0;
            
            Object.values(cart).forEach(areaItems => {
                areaItems.forEach(item => {
                    totalItems += item.quantity || 1;
                });
            });
            
            cartCount.textContent = totalItems;
        } else {
            // Fallback: recalcular desde localStorage
            initCartCount();
        }
    }
    
    // Inicializar tooltips para precios
    function initPriceTooltips() {
        const priceElements = document.querySelectorAll('.service-price');
        
        priceElements.forEach(element => {
            element.addEventListener('mouseenter', function(e) {
                const tooltip = document.createElement('div');
                tooltip.className = 'price-tooltip';
                tooltip.textContent = 'Precio por unidad';
                
                const rect = this.getBoundingClientRect();
                tooltip.style.position = 'absolute';
                tooltip.style.top = (rect.top - 35) + 'px';
                tooltip.style.left = (rect.left + rect.width / 2) + 'px';
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
    }
    
    // Inicializar sistema de filtros por área
    function initAreaFilters() {
        const areaLinks = document.querySelectorAll('.footer-col a[href^="#area-"]');
        
        areaLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                const targetId = href.substring(1); // Remover el #
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    // Destacar el área
                    targetElement.style.backgroundColor = 'rgba(45, 106, 227, 0.05)';
                    targetElement.style.transition = 'background-color 0.3s ease';
                    
                    setTimeout(() => {
                        targetElement.style.backgroundColor = '';
                    }, 3000);
                }
            });
        });
    }
    
    // Sistema de comparación de servicios
    function initServiceComparison() {
        const serviceCards = document.querySelectorAll('.service-card');
        let selectedServices = [];
        
        serviceCards.forEach(card => {
            const compareBtn = document.createElement('button');
            compareBtn.className = 'btn btn-secondary compare-btn';
            compareBtn.innerHTML = '<i class="fas fa-balance-scale"></i> Comparar';
            compareBtn.style.marginTop = '10px';
            compareBtn.style.width = '100%';
            
            card.appendChild(compareBtn);
            
            compareBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                
                const area = card.getAttribute('data-area');
                const serviceName = card.getAttribute('data-service');
                const price = card.getAttribute('data-price');
                const serviceTitle = card.querySelector('h3').textContent;
                
                // Agregar o remover de la comparación
                const serviceIndex = selectedServices.findIndex(s => 
                    s.area === area && s.serviceName === serviceName
                );
                
                if (serviceIndex >= 0) {
                    // Remover
                    selectedServices.splice(serviceIndex, 1);
                    compareBtn.innerHTML = '<i class="fas fa-balance-scale"></i> Comparar';
                    compareBtn.classList.remove('active');
                    
                    if (window.showNotification) {
                        window.showNotification('Servicio removido de la comparación', 'info');
                    }
                } else {
                    // Agregar (máximo 3)
                    if (selectedServices.length >= 3) {
                        if (window.showNotification) {
                            window.showNotification('Máximo 3 servicios para comparar', 'warning');
                        }
                        return;
                    }
                    
                    selectedServices.push({
                        area,
                        serviceName,
                        serviceTitle,
                        price
                    });
                    
                    compareBtn.innerHTML = '<i class="fas fa-check"></i> Comparando';
                    compareBtn.classList.add('active');
                    
                    if (window.showNotification) {
                        window.showNotification('Servicio agregado para comparación', 'success');
                    }
                }
                
                // Actualizar botón de comparación global
                updateGlobalCompareButton(selectedServices.length);
            });
        });
        
        // Crear botón global de comparación
        const globalCompareBtn = document.createElement('button');
        globalCompareBtn.id = 'global-compare-btn';
        globalCompareBtn.className = 'btn btn-secondary';
        globalCompareBtn.innerHTML = '<i class="fas fa-balance-scale"></i> Comparar (0)';
        globalCompareBtn.style.position = 'fixed';
        globalCompareBtn.style.bottom = '20px';
        globalCompareBtn.style.right = '20px';
        globalCompareBtn.style.zIndex = '1000';
        globalCompareBtn.style.display = 'none';
        
        document.body.appendChild(globalCompareBtn);
        
        globalCompareBtn.addEventListener('click', function() {
            if (selectedServices.length > 0) {
                showComparisonModal(selectedServices);
            }
        });
    }
    
    // Actualizar botón global de comparación
    function updateGlobalCompareButton(count) {
        const globalCompareBtn = document.getElementById('global-compare-btn');
        
        if (!globalCompareBtn) return;
        
        if (count > 0) {
            globalCompareBtn.innerHTML = `<i class="fas fa-balance-scale"></i> Comparar (${count})`;
            globalCompareBtn.style.display = 'block';
        } else {
            globalCompareBtn.style.display = 'none';
        }
    }
    
    // Mostrar modal de comparación
    function showComparisonModal(services) {
        // Crear modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'comparisonModal';
        
        let comparisonHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <span class="close-modal">&times;</span>
                <h2>Comparación de Servicios</h2>
                <div class="comparison-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Servicio</th>
                                <th>Área</th>
                                <th>Precio</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        services.forEach((service, index) => {
            comparisonHTML += `
                <tr>
                    <td>${service.serviceTitle}</td>
                    <td>${service.area}</td>
                    <td>$${parseInt(service.price).toLocaleString('es-CL')}</td>
                    <td>
                        <button class="btn btn-primary btn-small add-selected" data-index="${index}">
                            <i class="fas fa-cart-plus"></i> Agregar
                        </button>
                    </td>
                </tr>
            `;
        });
        
        comparisonHTML += `
                        </tbody>
                    </table>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-secondary" id="clear-comparison">
                        <i class="fas fa-trash"></i> Limpiar Comparación
                    </button>
                    <button class="btn btn-primary" id="add-all-to-cart">
                        <i class="fas fa-shopping-cart"></i> Agregar Todos al Carrito
                    </button>
                </div>
            </div>
        `;
        
        modal.innerHTML = comparisonHTML;
        document.body.appendChild(modal);
        
        // Mostrar modal
        modal.style.display = 'flex';
        
        // Event listeners del modal
        const closeBtn = modal.querySelector('.close-modal');
        closeBtn.addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // Agregar servicio individual
        const addSelectedBtns = modal.querySelectorAll('.add-selected');
        addSelectedBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                const service = services[index];
                
                // Buscar el elemento del servicio en la página
                const serviceCard = document.querySelector(
                    `.service-card[data-area="${service.area}"][data-service="${service.serviceName}"]`
                );
                
                if (serviceCard) {
                    const addToCartBtn = serviceCard.querySelector('.add-to-cart');
                    addToCartBtn.click();
                }
                
                if (window.showNotification) {
                    window.showNotification('Servicio agregado al carrito', 'success');
                }
            });
        });
        
        // Agregar todos al carrito
        const addAllBtn = modal.querySelector('#add-all-to-cart');
        addAllBtn.addEventListener('click', () => {
            services.forEach(service => {
                const serviceCard = document.querySelector(
                    `.service-card[data-area="${service.area}"][data-service="${service.serviceName}"]`
                );
                
                if (serviceCard) {
                    const addToCartBtn = serviceCard.querySelector('.add-to-cart');
                    addToCartBtn.click();
                }
            });
            
            if (window.showNotification) {
                window.showNotification('Todos los servicios agregados al carrito', 'success');
            }
            
            modal.remove();
        });
        
        // Limpiar comparación
        const clearBtn = modal.querySelector('#clear-comparison');
        clearBtn.addEventListener('click', () => {
            // Remover estado activo de todos los botones de comparación
            document.querySelectorAll('.compare-btn.active').forEach(btn => {
                btn.innerHTML = '<i class="fas fa-balance-scale"></i> Comparar';
                btn.classList.remove('active');
            });
            
            // Ocultar botón global
            const globalCompareBtn = document.getElementById('global-compare-btn');
            if (globalCompareBtn) {
                globalCompareBtn.style.display = 'none';
            }
            
            // Limpiar array
            services.length = 0;
            
            if (window.showNotification) {
                window.showNotification('Comparación limpiada', 'info');
            }
            
            modal.remove();
        });
    }
    
    // Inicializar todo
    function init() {
        // Inicializar contador del carrito
        initCartCount();
        
        // Agregar event listeners a los botones "Agregar al Carrito"
        addToCartButtons.forEach(button => {
            button.addEventListener('click', handleAddToCart);
        });
        
        // Inicializar tooltips de precios
        initPriceTooltips();
        
        // Inicializar filtros por área
        initAreaFilters();
        
        // Inicializar sistema de comparación (opcional)
        initServiceComparison();
        
        // Escuchar actualizaciones del carrito desde cart.js
        window.addEventListener('cartUpdated', updateCartCount);
        
        // También escuchar el evento personalizado que cart.js podría disparar
        window.addEventListener('addToCart', updateCartCount);
    }
    
    // Ejecutar inicialización
    init();
    
    // Agregar estilos para tooltips
    const styles = document.createElement('style');
    styles.textContent = `
        .price-tooltip {
            background: var(--dark-color);
            color: white;
            padding: 5px 10px;
            border-radius: var(--border-radius);
            font-size: 12px;
            white-space: nowrap;
            z-index: 1000;
            box-shadow: var(--shadow);
        }
        
        .price-tooltip::after {
            content: '';
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            border: 5px solid transparent;
            border-top-color: var(--dark-color);
        }
        
        .compare-btn.active {
            background-color: var(--success-color) !important;
        }
        
        .comparison-table {
            overflow-x: auto;
            margin: 20px 0;
        }
        
        .comparison-table table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .comparison-table th,
        .comparison-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid var(--gray-light);
        }
        
        .comparison-table th {
            background-color: var(--light-color);
            font-weight: 600;
        }
        
        .comparison-table tr:hover {
            background-color: rgba(45, 106, 227, 0.02);
        }
        
        .modal-actions {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid var(--gray-light);
        }
    `;
    document.head.appendChild(styles);
});
