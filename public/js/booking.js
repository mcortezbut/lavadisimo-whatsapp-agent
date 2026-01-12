// JavaScript para el proceso de agendamiento - Conectado a API real
document.addEventListener('DOMContentLoaded', function() {
    // Elementos del formulario
    const bookingForm = document.getElementById('bookingForm');
    const bookingSteps = document.querySelectorAll('.booking-step');
    const formSteps = document.querySelectorAll('.form-step');
    const nextStepButtons = document.querySelectorAll('.next-step');
    const prevStepButtons = document.querySelectorAll('.prev-step');
    const successModal = document.getElementById('successModal');
    const closeSuccessBtn = document.getElementById('close-success');
    const printBtn = document.getElementById('print-btn');
    
    // Variables globales
    let currentService = null;
    let currentServiceId = null;
    let currentServicePrice = 0;
    let availableTimeSlots = [];

    // Mapeo de servicios con IDs y precios
    const serviceInfo = {
        'vehiculo': { id: 1, name: 'Limpieza de Vehículo', basePrice: 15000 },
        'alfombra': { id: 2, name: 'Limpieza de Alfombra', basePrice: 2500 },
        'lavanderia': { id: 3, name: 'Lavandería', basePrice: 2500 },
        'mueble': { id: 4, name: 'Limpieza de Mueble', basePrice: 18000 }
    };

    // Mapeo de métodos de pago
    const paymentMethods = {
        'cash': 'Efectivo al recibir',
        'card': 'Tarjeta de crédito/débito',
        'transfer': 'Transferencia bancaria'
    };

    // Inicializar datepicker
    const datepicker = flatpickr("#booking-date", {
        locale: "es",
        minDate: "today",
        dateFormat: "Y-m-d",
        disable: [
            function(date) {
                // Deshabilitar domingos
                return date.getDay() === 0;
            }
        ],
        onChange: function(selectedDates, dateStr) {
            if (dateStr) {
                checkAvailability(dateStr);
            }
        }
    });

    // Función para verificar disponibilidad
    async function checkAvailability(date) {
        try {
            showNotification('Consultando horarios disponibles...', 'info');
            
            const response = await fetch('/api/availability', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    date: date,
                    serviceId: currentServiceId
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                availableTimeSlots = data.availableSlots;
                updateTimeSelect();
                showNotification(`Hay ${availableTimeSlots.length} horarios disponibles para esta fecha`, 'success');
            } else {
                showNotification('Error al verificar disponibilidad', 'error');
            }
        } catch (error) {
            console.error('Error checking availability:', error);
            showNotification('Error de conexión al servidor', 'error');
        }
    }

    // Función para actualizar select de horas
    function updateTimeSelect() {
        const timeSelect = document.getElementById('booking-time');
        timeSelect.innerHTML = '<option value="">Selecciona una hora</option>';
        
        availableTimeSlots.forEach(slot => {
            const option = document.createElement('option');
            option.value = slot;
            option.textContent = slot + ' hrs';
            timeSelect.appendChild(option);
        });
        
        if (availableTimeSlots.length === 0) {
            timeSelect.innerHTML = '<option value="">No hay horarios disponibles</option>';
            timeSelect.disabled = true;
        } else {
            timeSelect.disabled = false;
        }
    }

    // Función para actualizar los indicadores de pasos
    function updateStepIndicators(currentStep) {
        bookingSteps.forEach((step, index) => {
            if (index < currentStep - 1) {
                step.classList.add('completed');
                step.classList.remove('active');
            } else if (index === currentStep - 1) {
                step.classList.add('active');
                step.classList.remove('completed');
            } else {
                step.classList.remove('active', 'completed');
            }
        });
    }

    // Función para cambiar entre pasos
    function goToStep(stepNumber) {
        // Ocultar todos los pasos
        formSteps.forEach(step => {
            step.classList.remove('active');
        });
        
        // Mostrar el paso actual
        const currentStep = document.querySelector(`.form-step[data-step="${stepNumber}"]`);
        if (currentStep) {
            currentStep.classList.add('active');
            updateStepIndicators(stepNumber);
            
            // Actualizar resumen en el paso 4
            if (stepNumber === 4) {
                updateConfirmationSummary();
            }
        }
    }

    // Validación del paso 1
    function validateStep1() {
        const selectedService = document.querySelector('input[name="service"]:checked');
        if (!selectedService) {
            showNotification('Por favor, selecciona un servicio.', 'error');
            return false;
        }
        
        // Guardar servicio seleccionado
        currentService = selectedService.value;
        currentServiceId = serviceInfo[currentService]?.id || null;
        currentServicePrice = serviceInfo[currentService]?.basePrice || 0;
        
        return true;
    }

    // Validación del paso 2
    function validateStep2() {
        const date = document.getElementById('booking-date').value;
        const time = document.getElementById('booking-time').value;
        
        if (!date) {
            showNotification('Por favor, selecciona una fecha.', 'error');
            return false;
        }
        
        if (!time) {
            showNotification('Por favor, selecciona una hora.', 'error');
            return false;
        }
        
        return true;
    }

    // Validación del paso 3
    function validateStep3() {
        const fullName = document.getElementById('full-name').value;
        const phone = document.getElementById('phone').value;
        const email = document.getElementById('email').value;
        const address = document.getElementById('address').value;
        
        if (!fullName) {
            showNotification('Por favor, ingresa tu nombre completo.', 'error');
            return false;
        }
        
        if (!phone) {
            showNotification('Por favor, ingresa tu teléfono.', 'error');
            return false;
        }
        
        if (!email) {
            showNotification('Por favor, ingresa tu email.', 'error');
            return false;
        }
        
        if (!address) {
            showNotification('Por favor, ingresa tu dirección.', 'error');
            return false;
        }
        
        // Validación básica de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showNotification('Por favor, ingresa un email válido.', 'error');
            return false;
        }
        
        // Validación básica de teléfono (solo números y +)
        const phoneRegex = /^[\d\s\+\-\(\)]+$/;
        if (!phoneRegex.test(phone)) {
            showNotification('Por favor, ingresa un teléfono válido.', 'error');
            return false;
        }
        
        return true;
    }

    // Función para actualizar el resumen de confirmación
    function updateConfirmationSummary() {
        // Servicio
        const selectedService = document.querySelector('input[name="service"]:checked');
        if (selectedService) {
            const serviceName = serviceInfo[selectedService.value]?.name || 'No seleccionado';
            document.getElementById('confirm-service').textContent = serviceName;
        }
        
        // Fecha y hora
        const date = document.getElementById('booking-date').value;
        const time = document.getElementById('booking-time').value;
        if (date && time) {
            const formattedDate = new Date(date).toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            document.getElementById('confirm-datetime').textContent = `${formattedDate} a las ${time} hrs`;
        }
        
        // Datos personales
        document.getElementById('confirm-name').textContent = document.getElementById('full-name').value || '-';
        document.getElementById('confirm-phone').textContent = document.getElementById('phone').value || '-';
        document.getElementById('confirm-email').textContent = document.getElementById('email').value || '-';
        document.getElementById('confirm-address').textContent = document.getElementById('address').value || '-';
        
        // Instrucciones especiales
        const instructions = document.getElementById('special-instructions').value;
        document.getElementById('confirm-instructions').textContent = instructions || 'Ninguna';
    }

    // Event listeners para botones de siguiente paso
    nextStepButtons.forEach(button => {
        button.addEventListener('click', function() {
            const currentStep = parseInt(this.closest('.form-step').dataset.step);
            const nextStep = parseInt(this.dataset.next);
            
            // Validar paso actual antes de avanzar
            let isValid = true;
            switch (currentStep) {
                case 1:
                    isValid = validateStep1();
                    break;
                case 2:
                    isValid = validateStep2();
                    break;
                case 3:
                    isValid = validateStep3();
                    break;
            }
            
            if (isValid) {
                goToStep(nextStep);
                
                // Scroll suave al inicio del formulario
                document.querySelector('.booking-process').scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Event listeners para botones de paso anterior
    prevStepButtons.forEach(button => {
        button.addEventListener('click', function() {
            const prevStep = parseInt(this.dataset.prev);
            goToStep(prevStep);
            
            // Scroll suave al inicio del formulario
            document.querySelector('.booking-process').scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        });
    });

    // Manejo del envío del formulario
    bookingForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Validar términos y condiciones
        const termsAccepted = document.getElementById('terms').checked;
        if (!termsAccepted) {
            showNotification('Debes aceptar los términos y condiciones.', 'error');
            return;
        }
        
        // Obtener datos del formulario
        const formData = {
            serviceId: currentServiceId,
            serviceName: serviceInfo[currentService]?.name || '',
            customerName: document.getElementById('full-name').value,
            customerPhone: document.getElementById('phone').value,
            customerEmail: document.getElementById('email').value,
            customerAddress: document.getElementById('address').value,
            bookingDate: document.getElementById('booking-date').value,
            bookingTime: document.getElementById('booking-time').value,
            specialInstructions: document.getElementById('special-instructions').value,
            paymentMethod: document.querySelector('input[name="payment"]:checked')?.value,
            estimatedPrice: currentServicePrice
        };
        
        try {
            // Enviar datos al servidor
            showNotification('Procesando reserva...', 'info');
            
            const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Mostrar modal de éxito con datos reales
                showSuccessModal(result.bookingNumber, formData);
                
                // Limpiar formulario
                bookingForm.reset();
                datepicker.clear();
                
                // Volver al paso 1 después de un tiempo
                setTimeout(() => {
                    goToStep(1);
                }, 5000);
            } else {
                showNotification(result.message || 'Error al crear la reserva', 'error');
            }
        } catch (error) {
            console.error('Error submitting booking:', error);
            showNotification('Error de conexión al servidor', 'error');
        }
    });

    // Función para mostrar modal de éxito
    function showSuccessModal(bookingNumber, formData) {
        // Actualizar detalles en el modal
        document.getElementById('booking-number').textContent = bookingNumber;
        
        const formattedDate = new Date(formData.bookingDate).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        document.getElementById('booking-details').textContent = 
            `${formData.serviceName} para el ${formattedDate} a las ${formData.bookingTime} hrs`;
        
        document.getElementById('success-message').textContent = 
            `Tu servicio de ${formData.serviceName.toLowerCase()} ha sido agendado exitosamente. Te hemos enviado un correo de confirmación a ${formData.customerEmail}.`;
        
        // Mostrar modal
        successModal.style.display = 'flex';
    }

    // Event listener para cerrar modal de éxito
    if (closeSuccessBtn) {
        closeSuccessBtn.addEventListener('click', function() {
            successModal.style.display = 'none';
            window.location.href = 'index.html';
        });
    }

    // Event listener para botón de imprimir
    if (printBtn) {
        printBtn.addEventListener('click', function() {
            const bookingNumber = document.getElementById('booking-number').textContent;
            const serviceName = document.getElementById('confirm-service').textContent;
            const dateTime = document.getElementById('confirm-datetime').textContent;
            const customerName = document.getElementById('confirm-name').textContent;
            const customerPhone = document.getElementById('confirm-phone').textContent;
            const customerEmail = document.getElementById('confirm-email').textContent;
            const customerAddress = document.getElementById('confirm-address').textContent;
            
            const printContent = `
                <html>
                <head>
                    <title>Confirmación de Reserva - Lavadísimo</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .header h1 { color: #2d6ae3; }
                        .details { margin: 20px 0; }
                        .detail-item { margin: 10px 0; }
                        .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Lavadísimo</h1>
                        <h2>Confirmación de Reserva</h2>
                    </div>
                    <div class="details">
                        <div class="detail-item"><strong>Número de Reserva:</strong> ${bookingNumber}</div>
                        <div class="detail-item"><strong>Servicio:</strong> ${serviceName}</div>
                        <div class="detail-item"><strong>Fecha y Hora:</strong> ${dateTime}</div>
                        <div class="detail-item"><strong>Nombre:</strong> ${customerName}</div>
                        <div class="detail-item"><strong>Teléfono:</strong> ${customerPhone}</div>
                        <div class="detail-item"><strong>Email:</strong> ${customerEmail}</div>
                        <div class="detail-item"><strong>Dirección:</strong> ${customerAddress}</div>
                    </div>
                    <div class="footer">
                        <p>Gracias por confiar en Lavadísimo</p>
                        <p>Contacto: +56 9 1234 5678 | info@lavadisimo.cl</p>
                    </div>
                </body>
                </html>
            `;
            
            const printWindow = window.open('', '_blank');
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.print();
        });
    }

    // Función para mostrar notificaciones (importada de app.js)
    function showNotification(message, type = 'info') {
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            alert(message);
        }
    }

    // Cargar parámetros de URL para preseleccionar servicio
    const urlParams = new URLSearchParams(window.location.search);
    const serviceParam = urlParams.get('service');
    
    if (serviceParam) {
        // Buscar y seleccionar el servicio correspondiente
        const serviceInput = document.getElementById(`service-${serviceParam}`);
        if (serviceInput) {
            serviceInput.checked = true;
            currentService = serviceParam;
            currentServiceId = serviceInfo[serviceParam]?.id || null;
            currentServicePrice = serviceInfo[serviceParam]?.basePrice || 0;
        }
    }
});
