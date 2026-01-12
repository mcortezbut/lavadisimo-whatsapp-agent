// JavaScript para nueva página de servicios - Lavadísimo (minimalista)
document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const selectCategoryButtons = document.querySelectorAll('.select-category');
    const categoryCards = document.querySelectorAll('.category-card');
    const cartCount = document.getElementById('cart-count');
    
    // Modales
    const modals = {
        'alfombras': document.getElementById('modal-alfombras'),
        'vehiculos': document.getElementById('modal-vehiculos'),
        'pisos': document.getElementById('modal-pisos'),
        'simple': document.getElementById('modal-simple')
    };
    
    // Formularios
    const forms = {
        'alfombras': document.getElementById('form-alfombras'),
        'vehiculos': document.getElementById('form-vehiculos'),
        'pisos': document.getElementById('form-pisos'),
        'simple': document.getElementById('form-simple')
    };
    
    // Configuración por categoría
    const categoryConfig = {
        'ropa-cama': {
            modal: 'simple',
            title: 'Ropa de Cama',
            description: 'Selecciona las opciones para el servicio de ropa de cama.',
            fields: [
                {
                    type: 'select',
                    id: 'tipo-ropa-cama',
                    label: 'Tipo de Ropa de Cama',
                    options: [
                        { value: 'COBERTOR', text: 'Cobertor' },
                        { value: 'FRAZADA', text: 'Frazada' },
                        { value: 'SABANAS', text: 'Sábanas' },
                        { value: 'CUBRE_COBERTOR', text: 'Cubre Cobertor' },
                        { value: 'CUBRE_COLCHON', text: 'Cubre Colchón' },
                        { value: 'PIECERA', text: 'Piecera' }
                    ]
                },
                {
                    type: 'select',
                    id: 'tamano-ropa-cama',
                    label: 'Tamaño',
                    options: [
                        { value: 'S', text: 'S (1 y 1,5 plazas)' },
                        { value: 'L', text: 'L (2 plazas, queen, king)' },
                        { value: 'XL', text: 'XL (super king)' }
                    ]
                },
                {
                    type: 'select',
                    id: 'subtipo-ropa-cama',
                    label: 'Subtipo',
                    options: [
                        // Opciones dinámicas que se actualizarán según el tipo seleccionado
                        { value: '', text: 'Selecciona primero el tipo' }
                    ]
                }
            ],
            area: 'lavanderia'
        },
        'telas-vestuario': {
            modal: 'simple',
            title: 'Telas y Vestuario',
            description: 'Selecciona las opciones para el servicio de telas y vestuario.',
            fields: [
                {
                    type: 'select',
                    id: 'tipo-vestuario',
                    label: 'Tipo de Prenda',
                    options: [
                        { value: 'ropa-diaria', text: 'Ropa diaria' },
                        { value: 'prenda-delicada', text: 'Prenda delicada' },
                        { value: 'uniforme', text: 'Uniforme' },
                        { value: 'traje', text: 'Traje' },
                        { value: 'vestido', text: 'Vestido' },
                        { value: 'abrigo', text: 'Abrigo' }
                    ]
                },
                {
                    type: 'number',
                    id: 'peso-vestuario',
                    label: 'Peso aproximado (kg)',
                    min: 1,
                    max: 20,
                    step: 0.5,
                    placeholder: 'Ej: 5.5'
                }
            ],
            area: 'lavanderia'
        },
        'alfombras': {
            modal: 'alfombras',
            area: 'alfombras'
        },
        'pisos': {
            modal: 'pisos',
            area: 'pisos'
        },
        'sofas-sillas': {
            modal: 'simple',
            title: 'Sofás y Sillas',
            description: 'Selecciona las opciones para el servicio de sofás y sillas.',
            fields: [
                {
                    type: 'select',
                    id: 'tipo-mueble',
                    label: 'Tipo de Mueble',
                    options: [
                        { value: 'sofa-2plazas', text: 'Sofá 2 plazas' },
                        { value: 'sofa-3plazas', text: 'Sofá 3 plazas' },
                        { value: 'sofa-esquinero', text: 'Sofá esquinero' },
                        { value: 'sillon-individual', text: 'Sillón individual' },
                        { value: 'poltrona', text: 'Poltrona' },
                        { value: 'silla', text: 'Silla' }
                    ]
                },
                {
                    type: 'select',
                    id: 'material-tapiz',
                    label: 'Material del Tapiz',
                    options: [
                        { value: 'tela', text: 'Tela' },
                        { value: 'cuero', text: 'Cuero' },
                        { value: 'ecocuero', text: 'Ecocuero' },
                        { value: 'microfibra', text: 'Microfibra' },
                        { value: 'piel', text: 'Piel' }
                    ]
                }
            ],
            area: 'tapices'
        },
        'colchones': {
            modal: 'simple',
            title: 'Colchones',
            description: 'Selecciona las opciones para el servicio de colchones.',
            fields: [
                {
                    type: 'select',
                    id: 'tamano-colchon',
                    label: 'Tamaño del Colchón',
                    options: [
                        { value: 'individual', text: 'Individual (90x190)' },
                        { value: 'matrimonial', text: 'Matrimonial (140x190)' },
                        { value: 'queen', text: 'Queen (160x190)' },
                        { value: 'king', text: 'King (200x190)' },
                        { value: 'super-king', text: 'Super King (200x200)' }
                    ]
                },
                {
                    type: 'select',
                    id: 'tipo-colchon',
                    label: 'Tipo de Colchón',
                    options: [
                        { value: 'resortes', text: 'Resortes' },
                        { value: 'espuma', text: 'Espuma' },
                        { value: 'latex', text: 'Látex' },
                        { value: 'viscoelastico', text: 'Viscoelástico' },
                        { value: 'hibrido', text: 'Híbrido' }
                    ]
                }
            ],
            area: 'tapices'
        },
        'cortinas-visillos': {
            modal: 'simple',
            title: 'Cortinas y Visillos',
            description: 'Selecciona las opciones para el servicio de cortinas y visillos.',
            fields: [
                {
                    type: 'select',
                    id: 'tipo-cortina',
                    label: 'Tipo de Cortina',
                    options: [
                        { value: 'cortina-tela', text: 'Cortina de tela' },
                        { value: 'cortina-blackout', text: 'Cortina blackout' },
                        { value: 'cortina-roller', text: 'Cortina roller' },
                        { value: 'visillo', text: 'Visillo' },
                        { value: 'panel-japones', text: 'Panel japonés' }
                    ]
                },
                {
                    type: 'number',
                    id: 'cantidad-paneles',
                    label: 'Cantidad de paneles',
                    min: 1,
                    max: 10,
                    placeholder: 'Ej: 2'
                }
            ],
            area: 'tapices'
        },
        'vehiculos': {
            modal: 'vehiculos',
            area: 'vehiculos'
        },
        'otros': {
            modal: 'simple',
            title: 'Otros Servicios',
            description: 'Selecciona las opciones para el servicio especial.',
            fields: [
                {
                    type: 'select',
                    id: 'tipo-otro',
                    label: 'Tipo de Servicio',
                    options: [
                        { value: 'cojines', text: 'Cojines' },
                        { value: 'almohadones', text: 'Almohadones' },
                        { value: 'tapices-decorativos', text: 'Tapices decorativos' },
                        { value: 'fundas-muebles', text: 'Fundas de muebles' },
                        { value: 'otros', text: 'Otros' }
                    ]
                },
                {
                    type: 'text',
                    id: 'descripcion-otro',
                    label: 'Descripción breve',
                    placeholder: 'Describa el servicio requerido'
                }
            ],
            area: 'tapices'
        }
    };
    
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
    
    // Manejar selección de categoría
    function handleCategorySelection(event) {
        const button = event.currentTarget;
        const category = button.getAttribute('data-category');
        const config = categoryConfig[category];
        
        if (!config) {
            console.error('Configuración no encontrada para categoría:', category);
            return;
        }
        
        // Preparar modal simple si corresponde
        if (config.modal === 'simple') {
            prepareSimpleModal(category, config);
        }
        
        // Mostrar modal
        const modal = modals[config.modal];
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }
    
    // Preparar modal simple con campos dinámicos
    function prepareSimpleModal(category, config) {
        const titleElement = document.getElementById('modal-simple-title');
        const descriptionElement = document.getElementById('modal-simple-description');
        const extraFieldsContainer = document.getElementById('simple-extra-fields');
        
        // Establecer título y descripción
        titleElement.textContent = config.title;
        descriptionElement.textContent = config.description;
        
        // Limpiar campos anteriores
        extraFieldsContainer.innerHTML = '';
        
        // Agregar campos dinámicos
        config.fields.forEach(field => {
            const fieldElement = createFormField(field);
            extraFieldsContainer.appendChild(fieldElement);
        });
        
        // Establecer categoría en el formulario
        forms.simple.setAttribute('data-category', category);
    }
    
    // Crear campo de formulario dinámico
    function createFormField(field) {
        const fieldGroup = document.createElement('div');
        fieldGroup.className = 'form-group';
        
        const label = document.createElement('label');
        label.setAttribute('for', field.id);
        label.textContent = field.label;
        
        fieldGroup.appendChild(label);
        
        let input;
        
        switch (field.type) {
            case 'select':
                input = document.createElement('select');
                input.id = field.id;
                input.required = true;
                
                // Agregar opción vacía
                const emptyOption = document.createElement('option');
                emptyOption.value = '';
                emptyOption.textContent = 'Selecciona una opción';
                input.appendChild(emptyOption);
                
                // Agregar opciones
                field.options.forEach(option => {
                    const optionElement = document.createElement('option');
                    optionElement.value = option.value;
                    optionElement.textContent = option.text;
                    input.appendChild(optionElement);
                });
                break;
                
            case 'number':
                input = document.createElement('input');
                input.type = 'number';
                input.id = field.id;
                input.min = field.min || 1;
                input.max = field.max || 100;
                input.step = field.step || 1;
                input.required = true;
                if (field.placeholder) input.placeholder = field.placeholder;
                break;
                
            case 'text':
                input = document.createElement('input');
                input.type = 'text';
                input.id = field.id;
                input.required = true;
                if (field.placeholder) input.placeholder = field.placeholder;
                break;
        }
        
        fieldGroup.appendChild(input);
        return fieldGroup;
    }
    
    // Manejar envío de formulario de alfombras
    if (forms.alfombras) {
        forms.alfombras.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const ancho = parseFloat(document.getElementById('ancho-alfombra').value);
            const largo = parseFloat(document.getElementById('largo-alfombra').value);
            const cantidad = parseInt(document.getElementById('cantidad-alfombra').value);
            const tipo = document.getElementById('tipo-alfombra').value;
            const nivelSuciedad = document.getElementById('nivel-suciedad').value;
            
            const metrosCuadrados = ancho * largo;
            
            const service = {
                area: 'alfombras',
                category: 'alfombras',
                service: `Limpieza de Alfombra (${tipo})`,
                description: `${ancho}m x ${largo}m = ${metrosCuadrados.toFixed(2)} m² | Nivel: ${nivelSuciedad}`,
                quantity: cantidad,
                metrosCuadrados: metrosCuadrados,
                tipo: tipo,
                nivelSuciedad: nivelSuciedad
            };
            
            addToCart(service);
            closeModal(modals.alfombras);
        });
    }
    
    // Manejar envío de formulario de vehículos
    if (forms.vehiculos) {
        forms.vehiculos.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const tamano = document.getElementById('tamano-vehiculo').value;
            const tipoLavado = document.getElementById('tipo-lavado').value;
            const cantidad = parseInt(document.getElementById('cantidad-vehiculos').value);
            const instrucciones = document.getElementById('instrucciones-vehiculo').value;
            
            const tamanoText = {
                'city-car': 'City Car',
                'suv-5': 'SUV capacidad 5',
                'suv-7': 'SUV capacidad 7',
                'pickup-estandar': 'Pick Up Estándar',
                'pickup-xl': 'Pick Up XL'
            }[tamano] || tamano;
            
            const tipoLavadoText = {
                'solo-interior': 'Solo interior',
                'solo-exterior': 'Solo exterior',
                'completo': 'Completo',
                'premium': 'Premium',
                'super-premium': 'Super Premium'
            }[tipoLavado] || tipoLavado;
            
            const service = {
                area: 'vehiculos',
                category: 'vehiculos',
                service: `Lavado de Vehículo`,
                description: `${tamanoText} | ${tipoLavadoText}`,
                quantity: cantidad,
                tamano: tamano,
                tipoLavado: tipoLavado,
                instrucciones: instrucciones || 'Ninguna'
            };
            
            addToCart(service);
            closeModal(modals.vehiculos);
        });
    }
    
    // Manejar envío de formulario de pisos
    if (forms.pisos) {
        forms.pisos.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const tipoPiso = document.getElementById('tipo-piso').value;
            const metros = parseFloat(document.getElementById('metros-pisos').value);
            const tratamiento = document.getElementById('tratamiento-pisos').value;
            const cantidadAmbientes = parseInt(document.getElementById('cantidad-ambientes').value);
            
            const tipoPisoText = {
                'ceramica': 'Cerámica',
                'porcelanato': 'Porcelanato',
                'madera': 'Madera natural',
                'flotante': 'Piso flotante',
                'vinilico': 'Vinílico',
                'marmol': 'Mármol',
                'otro': 'Otro'
            }[tipoPiso] || tipoPiso;
            
            const tratamientoText = {
                'limpieza-basica': 'Limpieza básica',
                'limpieza-profunda': 'Limpieza profunda',
                'pulido': 'Pulido y abrillantado',
                'desinfeccion': 'Desinfección completa',
                'tratamiento-madera': 'Tratamiento para madera'
            }[tratamiento] || tratamiento;
            
            const service = {
                area: 'pisos',
                category: 'pisos',
                service: `Limpieza de Pisos`,
                description: `${tipoPisoText} | ${metros} m² | ${tratamientoText}`,
                quantity: cantidadAmbientes,
                tipoPiso: tipoPiso,
                metrosCuadrados: metros,
                tratamiento: tratamiento
            };
            
            addToCart(service);
            closeModal(modals.pisos);
        });
    }
    
    // Manejar envío de formulario simple
    if (forms.simple) {
        forms.simple.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const category = forms.simple.getAttribute('data-category');
            const config = categoryConfig[category];
            if (!config) return;
            
            const cantidad = parseInt(document.getElementById('cantidad-simple').value);
            const instrucciones = document.getElementById('instrucciones-simple').value;
            
            // Recoger datos de campos dinámicos
            const extraData = {};
            let description = '';
            
            config.fields.forEach(field => {
                const element = document.getElementById(field.id);
                if (element) {
                    const value = element.value;
                    extraData[field.id] = value;
                    
                    // Construir descripción
                    if (field.type === 'select') {
                        const selectedOption = element.options[element.selectedIndex];
                        description += `${selectedOption.text} | `;
                    } else {
                        description += `${value} | `;
                    }
                }
            });
            
            // Remover último separador
            description = description.slice(0, -3);
            
            // Mapa de iconos por área
            const areaIcons = {
                lavanderia: 'fas fa-tshirt',
                alfombras: 'fas fa-rug',
                pisos: 'fas fa-home',
                tapices: 'fas fa-couch',
                vehiculos: 'fas fa-car'
            };
            
            // Mapa de precios por categoría (precios base para pruebas)
            const priceMap = {
                'ropa-cama': 15000,
                'telas-vestuario': 8000,
                'alfombras': 12000,
                'pisos': 18000,
                'sofas-sillas': 20000,
                'colchones': 25000,
                'cortinas-visillos': 10000,
                'vehiculos': 30000,
                'otros': 5000
            };
            
            const service = {
                area: config.area,
                category: category,
                service: config.title,
                description: description,
                quantity: cantidad,
                price: priceMap[category] || 10000,
                icon: areaIcons[config.area] || 'fas fa-concierge-bell',
                ...extraData,
                instrucciones: instrucciones || 'Ninguna'
            };
            
            addToCart(service);
            closeModal(modals.simple);
        });
    }
    
    // Agregar servicio al carrito
    function addToCart(service) {
        // Guardar en localStorage para que cart.js lo pueda leer
        const savedCart = localStorage.getItem('lavadisimoCart');
        let cart = savedCart ? JSON.parse(savedCart) : {
            lavanderia: [],
            alfombras: [],
            pisos: [],
            tapices: [],
            vehiculos: []
        };
        
        const { area, service: serviceName, price, quantity = 1, icon, description } = service;
        
        // Verificar si el servicio ya está en el carrito
        const existingItemIndex = cart[area].findIndex(item => item.service === serviceName);
        
        if (existingItemIndex >= 0) {
            // Incrementar cantidad
            cart[area][existingItemIndex].quantity += quantity;
        } else {
            // Agregar nuevo item
            cart[area].push({
                service: serviceName,
                price: parseInt(price),
                quantity,
                icon: icon || 'fas fa-concierge-bell',
                description: description || ''
            });
        }
        
        // Guardar en localStorage
        localStorage.setItem('lavadisimoCart', JSON.stringify(cart));
        
        // Disparar evento personalizado para que cart.js lo maneje (si está en la misma página)
        const addToCartEvent = new CustomEvent('addToCart', {
            detail: service,
            bubbles: true
        });
        
        window.dispatchEvent(addToCartEvent);
        
        // Mostrar feedback visual
        showAddToCartFeedback();
        
        // Actualizar contador
        updateCartCount();
    }
    
    // Mostrar feedback visual
    function showAddToCartFeedback() {
        // Si hay función de notificación en app.js, usarla
        if (window.showNotification) {
            window.showNotification('Servicio agregado al carrito', 'success');
        } else {
            // Feedback simple
            const feedback = document.createElement('div');
            feedback.className = 'cart-feedback';
            feedback.innerHTML = '<i class="fas fa-check-circle"></i> Servicio agregado al carrito';
            feedback.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: var(--success-color);
                color: white;
                padding: 15px 20px;
                border-radius: var(--border-radius);
                z-index: 10000;
                box-shadow: var(--shadow);
                display: flex;
                align-items: center;
                gap: 10px;
            `;
            
            document.body.appendChild(feedback);
            
            setTimeout(() => {
                feedback.remove();
            }, 3000);
        }
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
    
    // Cerrar modal
    function closeModal(modal) {
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            
            // Limpiar formulario simple
            if (modal === modals.simple) {
                forms.simple.reset();
            }
        }
    }
    
    // Cerrar modales al hacer clic en X o fuera
    function setupModalCloseListeners() {
        // Cerrar al hacer clic en X
        document.querySelectorAll('.close-modal, .close-form').forEach(element => {
            element.addEventListener('click', function() {
                const modal = this.closest('.modal');
                closeModal(modal);
            });
        });
        
        // Cerrar al hacer clic fuera del contenido
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', function(e) {
                if (e.target === this) {
                    closeModal(this);
                }
            });
        });
        
        // Cerrar con ESC
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal').forEach(modal => {
                    if (modal.style.display === 'flex') {
                        closeModal(modal);
                    }
                });
            }
        });
    }
    
    // Manejar enlaces de categoría en el footer
    function setupFooterCategoryLinks() {
        document.querySelectorAll('.footer-col a[data-category]').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const category = this.getAttribute('data-category');
                const card = document.querySelector(`.category-card[data-category="${category}"]`);
                
                if (card) {
                    // Simular clic en el botón de selección
                    const button = card.querySelector('.select-category');
                    if (button) {
                        button.click();
                    }
                    
                    // Scroll suave a la sección de categorías
                    document.querySelector('.services-list').scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            });
        });
    }
    
    // Inicializar todo
    function init() {
        // Inicializar contador del carrito
        initCartCount();
        
        // Agregar event listeners a los botones de categoría
        selectCategoryButtons.forEach(button => {
            button.addEventListener('click', handleCategorySelection);
        });
        
        // Configurar cierre de modales
        setupModalCloseListeners();
        
        // Configurar enlaces de categoría en footer
        setupFooterCategoryLinks();
        
        // Escuchar actualizaciones del carrito
        window.addEventListener('cartUpdated', updateCartCount);
        window.addEventListener('addToCart', updateCartCount);
        
        // Agregar estilos adicionales
        addAdditionalStyles();
    }
    
    // Agregar estilos CSS adicionales
    function addAdditionalStyles() {
        const styles = document.createElement('style');
        styles.textContent = `
            .categories-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 30px;
                margin: 40px 0;
            }
            
            .category-card {
                background: white;
                border-radius: var(--border-radius);
                padding: 25px;
                box-shadow: var(--shadow);
                transition: transform 0.3s ease, box-shadow 0.3s ease;
                border: 1px solid var(--gray-light);
                text-align: center;
                display: flex;
                flex-direction: column;
                height: 100%;
            }
            
            .category-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            }
            
            .category-icon {
                font-size: 3rem;
                color: var(--primary-color);
                margin-bottom: 20px;
            }
            
            .category-card h3 {
                margin-bottom: 15px;
                color: var(--dark-color);
                font-size: 1.4rem;
            }
            
            .category-card p {
                color: var(--gray);
                margin-bottom: 25px;
                line-height: 1.6;
                flex-grow: 1;
            }
            
            .category-card .btn {
                margin-top: auto;
            }
            
            .category-modal .modal-content {
                max-width: 500px;
                max-height: 90vh;
                overflow-y: auto;
            }
            
            .category-form {
                margin-top: 20px;
            }
            
            .category-form .form-group {
                margin-bottom: 20px;
            }
            
            .category-form label {
                display: block;
                margin-bottom: 8px;
                font-weight: 500;
                color: var(--dark-color);
            }
            
            .category-form input,
            .category-form select,
            .category-form textarea {
                width: 100%;
                padding: 12px 15px;
                border: 1px solid var(--gray-light);
                border-radius: var(--border-radius);
                font-size: 1rem;
                transition: border-color 0.3s ease;
            }
            
            .category-form input:focus,
            .category-form select:focus,
            .category-form textarea:focus {
                outline: none;
                border-color: var(--primary-color);
            }
            
            .form-actions {
                display: flex;
                gap: 15px;
                justify-content: flex-end;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid var(--gray-light);
            }
            
            .form-separator {
                text-align: center;
                margin: 20px 0;
                position: relative;
            }
            
            .form-separator span {
                background: white;
                padding: 0 15px;
                color: var(--gray);
                font-size: 0.9rem;
            }
            
            .form-separator::before {
                content: '';
                position: absolute;
                top: 50%;
                left: 0;
                right: 0;
                height: 1px;
                background: var(--gray-light);
                z-index: -1;
            }
            
            @media (max-width: 768px) {
                .categories-grid {
                    grid-template-columns: 1fr;
                    gap: 20px;
                }
                
                .category-card {
                    padding: 20px;
                }
                
                .form-actions {
                    flex-direction: column;
                }
                
                .form-actions .btn {
                    width: 100%;
                }
            }
        `;
        document.head.appendChild(styles);
    }
    
    // Ejecutar inicialización
    init();
});
