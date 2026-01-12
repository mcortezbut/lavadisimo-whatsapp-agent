// JavaScript para la página de estado de servicios - Conectado a API real
document.addEventListener('DOMContentLoaded', function() {
    // Elementos de la página
    const searchBookingBtn = document.getElementById('search-booking');
    const bookingNumberInput = document.getElementById('booking-number-input');
    const emailInput = document.getElementById('email-input');
    const searchResults = document.getElementById('search-results');
    const bookingCardsContainer = document.getElementById('booking-cards');
    const statusTabs = document.querySelectorAll('.status-tab');
    const statusCards = document.querySelectorAll('.status-card');
    const emptyState = document.getElementById('empty-state');
    const statusCardsContainer = document.querySelector('.status-cards-container');
    const historyTableBody = document.querySelector('.history-table tbody');
    const historyStatsContainer = document.querySelector('.history-stats');

    // Mapeo de estados a clases CSS
    const statusClasses = {
        'pending': 'status-pending',
        'confirmed': 'status-confirmed',
        'in-progress': 'status-in-progress',
        'completed': 'status-completed',
        'cancelled': 'status-cancelled'
    };

    // Mapeo de estados a iconos
    const statusIcons = {
        'pending': 'fas fa-clock',
        'confirmed': 'fas fa-check-circle',
        'in-progress': 'fas fa-spinner',
        'completed': 'fas fa-check-double',
        'cancelled': 'fas fa-times-circle'
    };

    // Mapeo de estados a textos
    const statusTexts = {
        'pending': 'Pendiente',
        'confirmed': 'Confirmado',
        'in-progress': 'En Progreso',
        'completed': 'Completado',
        'cancelled': 'Cancelado'
    };

    // Mapeo de servicios a iconos
    const serviceIcons = {
        'Limpieza de Vehículo': 'fas fa-car',
        'Limpieza de Alfombra': 'fas fa-couch',
        'Lavandería': 'fas fa-tshirt',
        'Limpieza de Mueble': 'fas fa-chair'
    };

    // Función para crear tarjeta de reserva
    function createBookingCard(booking) {
        const statusClass = statusClasses[booking.status] || 'status-pending';
        const statusIcon = statusIcons[booking.status] || 'fas fa-clock';
        const statusText = statusTexts[booking.status] || 'Pendiente';
        const serviceIcon = serviceIcons[booking.serviceName] || 'fas fa-concierge-bell';
        
        // Formatear fecha
        const formattedDate = booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) : 'Fecha no disponible';
        
        // Formatear hora
        const formattedTime = booking.bookingTime || 'Hora no disponible';
        
        return `
            <div class="status-card" data-status="${booking.status}">
                <div class="status-header">
                    <div class="status-badge ${statusClass}">
                        <i class="${statusIcon}"></i>
                        <span>${statusText}</span>
                    </div>
                    <span class="booking-number">${booking.bookingNumber}</span>
                </div>
                <div class="status-content">
                    <div class="service-info">
                        <div class="service-icon">
                            <i class="${serviceIcon}"></i>
                        </div>
                        <div>
                            <h4>${booking.serviceName}</h4>
                            <p class="service-detail">${booking.specialInstructions || 'Sin instrucciones especiales'}</p>
                        </div>
                    </div>
                    <div class="booking-details">
                        <div class="detail">
                            <i class="fas fa-calendar-alt"></i>
                            <span>${formattedDate}</span>
                        </div>
                        <div class="detail">
                            <i class="fas fa-clock"></i>
                            <span>${formattedTime} hrs</span>
                        </div>
                        <div class="detail">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${booking.customerAddress || 'Dirección no disponible'}</span>
                        </div>
                        <div class="detail">
                            <i class="fas fa-credit-card"></i>
                            <span>${booking.paymentMethod || 'Método de pago no especificado'}</span>
                        </div>
                    </div>
                </div>
                <div class="status-actions">
                    <button class="btn btn-secondary btn-small view-details" data-booking="${booking.bookingNumber}">
                        <i class="fas fa-eye"></i> Ver Detalles
                    </button>
                    <button class="btn btn-secondary btn-small print-btn" data-booking="${booking.bookingNumber}">
                        <i class="fas fa-print"></i> Imprimir
                    </button>
                </div>
            </div>
        `;
    }

    // Función para crear fila de historial
    function createHistoryRow(booking) {
        const statusClass = statusClasses[booking.status] || 'status-pending';
        const statusText = statusTexts[booking.status] || 'Pendiente';
        const formattedDate = booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }) : 'N/A';
        
        return `
            <tr>
                <td>${booking.bookingNumber}</td>
                <td>${booking.serviceName}</td>
                <td>${formattedDate}</td>
                <td>${booking.bookingTime || 'N/A'}</td>
                <td><span class="status-badge-table ${statusClass}">${statusText}</span></td>
                <td>$${booking.estimatedPrice || 0}</td>
                <td>
                    <button class="btn-icon view-history" data-booking="${booking.bookingNumber}" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon download-history" data-booking="${booking.bookingNumber}" title="Descargar factura">
                        <i class="fas fa-download"></i>
                    </button>
                </td>
            </tr>
        `;
    }

    // Función para crear tarjeta de estadísticas
    function createStatCard(stat) {
        return `
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-chart-bar"></i>
                </div>
                <div class="stat-content">
                    <h3>${stat.value}</h3>
                    <p>${stat.label}</p>
                </div>
            </div>
        `;
    }

    // Función para buscar reservas
    async function searchBookings() {
        const bookingNumber = bookingNumberInput.value.trim();
        const email = emailInput.value.trim();
        
        if (!bookingNumber && !email) {
            showNotification('Por favor, ingresa un número de reserva o correo electrónico.', 'error');
            return;
        }

        try {
            showNotification('Buscando reservas...', 'info');
            
            const response = await fetch('/api/bookings/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    bookingNumber: bookingNumber || null,
                    email: email || null
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Mostrar resultados
                if (data.bookings && data.bookings.length > 0) {
                    bookingCardsContainer.innerHTML = '';
                    data.bookings.forEach(booking => {
                        bookingCardsContainer.innerHTML += createBookingCard(booking);
                    });
                    searchResults.style.display = 'block';
                    
                    // Añadir event listeners a los nuevos botones
                    addBookingCardEventListeners();
                    
                    // Scroll suave a los resultados
                    searchResults.scrollIntoView({ behavior: 'smooth' });
                    
                    showNotification(`Se encontraron ${data.bookings.length} reservas`, 'success');
                } else {
                    showNotification('No se encontraron reservas con los criterios de búsqueda.', 'info');
                    searchResults.style.display = 'none';
                }
            } else {
                showNotification(data.message || 'Error al buscar reservas', 'error');
            }
        } catch (error) {
            console.error('Error searching bookings:', error);
            showNotification('Error de conexión al servidor', 'error');
        }
    }

    // Función para cargar historial por email
    async function loadBookingHistory(email) {
        try {
            const response = await fetch(`/api/customers/${email}/bookings?limit=50`);
            const data = await response.json();
            
            if (data.success && data.bookings.length > 0) {
                // Actualizar tabla de historial
                if (historyTableBody) {
                    historyTableBody.innerHTML = '';
                    data.bookings.forEach(booking => {
                        historyTableBody.innerHTML += createHistoryRow(booking);
                    });
                }
                
                // Actualizar estadísticas
                if (historyStatsContainer) {
                    const stats = [
                        { label: 'Reservas Totales', value: data.total },
                        { label: 'Completadas', value: data.bookings.filter(b => b.status === 'completed').length },
                        { label: 'En Progreso', value: data.bookings.filter(b => b.status === 'in-progress').length },
                        { label: 'Pendientes', value: data.bookings.filter(b => b.status === 'pending').length }
                    ];
                    
                    historyStatsContainer.innerHTML = '';
                    stats.forEach(stat => {
                        historyStatsContainer.innerHTML += createStatCard(stat);
                    });
                }
                
                // Añadir event listeners a los botones del historial
                addHistoryEventListeners();
            }
        } catch (error) {
            console.error('Error loading booking history:', error);
        }
    }

    // Función para cargar estadísticas del sistema
    async function loadSystemStats() {
        try {
            const response = await fetch('/api/stats');
            const data = await response.json();
            
            if (data.success) {
                // Actualizar estadísticas en la página si existen
                const statsElement = document.getElementById('system-stats');
                if (statsElement) {
                    statsElement.innerHTML = `
                        <div class="stats-grid">
                            <div class="stat-item">
                                <h3>${data.stats.totalBookings || 0}</h3>
                                <p>Reservas Totales</p>
                            </div>
                            <div class="stat-item">
                                <h3>${data.stats.completedBookings || 0}</h3>
                                <p>Completadas</p>
                            </div>
                            <div class="stat-item">
                                <h3>$${data.stats.totalRevenue || 0}</h3>
                                <p>Ingresos Totales</p>
                            </div>
                        </div>
                    `;
                }
            }
        } catch (error) {
            console.error('Error loading system stats:', error);
        }
    }

    // Función para filtrar por estado
    function filterByStatus(status) {
        let visibleCards = 0;
        
        statusCards.forEach(card => {
            const cardStatus = card.getAttribute('data-status');
            
            if (status === 'all' || cardStatus === status) {
                card.style.display = 'block';
                visibleCards++;
            } else {
                card.style.display = 'none';
            }
        });

        // Mostrar estado vacío si no hay tarjetas visibles
        if (visibleCards === 0) {
            emptyState.style.display = 'block';
        } else {
            emptyState.style.display = 'none';
        }
    }

    // Función para añadir event listeners a las tarjetas de reserva
    function addBookingCardEventListeners() {
        // Botones de ver detalles
        document.querySelectorAll('.view-details').forEach(button => {
            button.addEventListener('click', function() {
                const bookingNumber = this.getAttribute('data-booking');
                showBookingDetails(bookingNumber);
            });
        });

        // Botones de imprimir
        document.querySelectorAll('.print-btn').forEach(button => {
            button.addEventListener('click', function() {
                const bookingNumber = this.getAttribute('data-booking');
                printBooking(bookingNumber);
            });
        });
    }

    // Función para añadir event listeners al historial
    function addHistoryEventListeners() {
        // Botones de ver detalles en historial
        document.querySelectorAll('.view-history').forEach(button => {
            button.addEventListener('click', function() {
                const bookingNumber = this.getAttribute('data-booking');
                showBookingDetails(bookingNumber);
            });
        });

        // Botones de descargar factura en historial
        document.querySelectorAll('.download-history').forEach(button => {
            button.addEventListener('click', function() {
                const bookingNumber = this.getAttribute('data-booking');
                downloadInvoice(bookingNumber);
            });
        });
    }

    // Función para mostrar detalles de reserva
    async function showBookingDetails(bookingNumber) {
        try {
            const response = await fetch(`/api/bookings/${bookingNumber}`);
            const data = await response.json();
            
            if (data.success && data.booking) {
                const booking = data.booking;
                const statusClass = statusClasses[booking.status] || 'status-pending';
                const statusText = statusTexts[booking.status] || 'Pendiente';
                const serviceIcon = serviceIcons[booking.serviceName] || 'fas fa-concierge-bell';
                
                const formattedDate = booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }) : 'Fecha no disponible';
                
                const modalContent = `
                    <div class="modal" id="bookingDetailsModal">
                        <div class="modal-content" style="max-width: 600px;">
                            <span class="close-modal">&times;</span>
                            <h2>Detalles de Reserva</h2>
                            <div class="booking-details-modal">
                                <div class="detail-section">
                                    <h3><i class="fas fa-ticket-alt"></i> Información de Reserva</h3>
                                    <p><strong>Número:</strong> ${booking.bookingNumber}</p>
                                    <p><strong>Estado:</strong> <span class="status-badge ${statusClass}">${statusText}</span></p>
                                    <p><strong>Servicio:</strong> ${booking.serviceName}</p>
                                    <p><strong>Instrucciones:</strong> ${booking.specialInstructions || 'Ninguna'}</p>
                                </div>
                                <div class="detail-section">
                                    <h3><i class="fas fa-calendar-alt"></i> Fecha y Hora</h3>
                                    <p><strong>Fecha:</strong> ${formattedDate}</p>
                                    <p><strong>Hora:</strong> ${booking.bookingTime || 'N/A'}</p>
                                </div>
                                <div class="detail-section">
                                    <h3><i class="fas fa-user"></i> Información del Cliente</h3>
                                    <p><strong>Nombre:</strong> ${booking.customerName}</p>
                                    <p><strong>Teléfono:</strong> ${booking.customerPhone}</p>
                                    <p><strong>Email:</strong> ${booking.customerEmail}</p>
                                    <p><strong>Dirección:</strong> ${booking.customerAddress}</p>
                                </div>
                                <div class="detail-section">
                                    <h3><i class="fas fa-credit-card"></i> Información de Pago</h3>
                                    <p><strong>Método:</strong> ${booking.paymentMethod}</p>
                                    <p><strong>Precio Estimado:</strong> $${booking.estimatedPrice || 0}</p>
                                </div>
                            </div>
                            <div class="modal-actions">
                                <button class="btn btn-secondary" id="printModalBtn">
                                    <i class="fas fa-print"></i> Imprimir
                                </button>
                                <button class="btn btn-primary" id="closeDetailsBtn">
                                    <i class="fas fa-check"></i> Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                
                // Crear y mostrar modal
                const modalContainer = document.createElement('div');
                modalContainer.innerHTML = modalContent;
                document.body.appendChild(modalContainer);
                
                const modal = document.getElementById('bookingDetailsModal');
                modal.style.display = 'flex';
                
                // Event listeners del modal
                modal.querySelector('.close-modal').addEventListener('click', () => {
                    modal.remove();
                });
                
                modal.querySelector('#closeDetailsBtn').addEventListener('click', () => {
                    modal.remove();
                });
                
                modal.querySelector('#printModalBtn').addEventListener('click', () => {
                    printBooking(bookingNumber);
                });
                
                // Cerrar al hacer clic fuera
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.remove();
                    }
                });
            } else {
                showNotification('No se encontraron detalles para esta reserva.', 'error');
            }
        } catch (error) {
            console.error('Error loading booking details:', error);
            showNotification('Error al cargar los detalles de la reserva', 'error');
        }
    }

    // Función para imprimir reserva
    function printBooking(bookingNumber) {
        const printContent = `
            <html>
            <head>
                <title>Comprobante de Reserva - Lavadísimo</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .header h1 { color: #2d6ae3; margin-bottom: 5px; }
                    .header h2 { color: #666; margin-bottom: 20px; }
                    .details { margin: 20px 0; border: 1px solid #ddd; border-radius: 8px; padding: 20px; }
                    .detail-item { margin: 10px 0; display: flex; }
                    .detail-label { font-weight: bold; min-width: 150px; }
                    .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px; }
                    .status-badge-print { display: inline-block; padding: 5px 10px; border-radius: 4px; color: white; font-weight: bold; }
                    .status-confirmed { background-color: #28a745; }
                    .status-pending { background-color: #ffc107; }
                    .status-in-progress { background-color: #17a2b8; }
                    .status-completed { background-color: #28a745; }
                    .status-cancelled { background-color: #dc3545; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Lavadísimo</h1>
                    <h2>Comprobante de Reserva</h2>
                    <p>Fecha de impresión: ${new Date().toLocaleDateString('es-ES', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}</p>
                </div>
                <div class="details">
                    <div class="detail-item">
                        <div class="detail-label">Número de Reserva:</div>
                        <div>${bookingNumber}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Fecha de Impresión:</div>
                        <div>${new Date().toLocaleDateString('es-ES')}</div>
                    </div>
                </div>
                <div class="footer">
                    <p>Gracias por confiar en Lavadísimo</p>
                    <p>Contacto: +56 9 1234 5678 | info@lavadisimo.cl</p>
                    <p>www.lavadisimo.cl</p>
                </div>
            </body>
            </html>
        `;
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
    }

    // Función para descargar factura
    function downloadInvoice(bookingNumber) {
        showNotification('Funcionalidad de descarga de factura en desarrollo', 'info');
    }

    // Función para mostrar notificaciones
    function showNotification(message, type = 'info') {
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            alert(message);
        }
    }

    // Event listeners
    if (searchBookingBtn) {
        searchBookingBtn.addEventListener('click', searchBookings);
    }

    // Permitir búsqueda con Enter
    if (bookingNumberInput) {
        bookingNumberInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchBookings();
            }
        });
    }

    if (emailInput) {
        emailInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchBookings();
            }
        });
    }

    // Event listeners para pestañas de estado
    statusTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remover clase active de todas las pestañas
            statusTabs.forEach(t => t.classList.remove('active'));
            
            // Añadir clase active a la pestaña clickeada
            this.classList.add('active');
            
            // Filtrar tarjetas por estado
            const status = this.getAttribute('data-status');
            filterByStatus(status);
        });
    });

    // Event listeners para botones de acción en tarjetas existentes
    document.querySelectorAll('.status-actions button').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const action = this.querySelector('i').className;
            
            if (action.includes('fa-eye')) {
                // Ver detalles
                const card = this.closest('.status-card');
                const bookingNumber = card.querySelector('.booking-number').textContent;
                showBookingDetails(bookingNumber);
            } else if (action.includes('fa-print')) {
                // Imprimir
                const card = this.closest('.status-card');
                const bookingNumber = card.querySelector('.booking-number').textContent;
                printBooking(bookingNumber);
            }
        });
    });

    // Inicializar: cargar estadísticas del sistema
    loadSystemStats();
    
    // Si hay un email en el input, cargar historial automáticamente
    if (emailInput.value.trim()) {
        loadBookingHistory(emailInput.value.trim());
    }

    // Inicializar: filtrar para mostrar todas las tarjetas
    filterByStatus('all');
});
