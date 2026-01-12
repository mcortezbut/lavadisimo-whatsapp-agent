/**
 * LAVADÍSIMO - Sistema de Autenticación Premium
 * Maneja registro, login y verificación SMS
 */

class AuthSystem {
    constructor() {
        this.currentStep = 1;
        this.verificationId = null;
        this.phone = null;
        this.countryCode = null;
        this.resendTimer = null;
        this.resendTimeout = 30;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupCodeInputs();
    }

    bindEvents() {
        // Step 1: Options
        document.getElementById('btn-login-option')?.addEventListener('click', () => this.showLoginForm());
        document.getElementById('btn-register-option')?.addEventListener('click', () => this.goToStep(2));
        document.getElementById('btn-back-to-choice')?.addEventListener('click', () => this.hideLoginForm());
        
        // Step 1: Login form
        document.getElementById('loginForm')?.addEventListener('submit', (e) => this.handleLogin(e));
        
        // Step 2: Phone form
        document.getElementById('phoneForm')?.addEventListener('submit', (e) => this.handleSendCode(e));
        document.getElementById('btn-back-to-step1')?.addEventListener('click', () => this.goToStep(1));
        
        // Step 3: Verification
        document.getElementById('btn-verify')?.addEventListener('click', () => this.handleVerifyCode());
        document.getElementById('btn-resend')?.addEventListener('click', () => this.handleResendCode());
        document.getElementById('btn-change-phone')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.goToStep(2);
        });
        
        // Step 4: Data form
        document.getElementById('dataForm')?.addEventListener('submit', (e) => this.handleCompleteRegistration(e));
        
        // Phone input formatting
        const phoneInput = document.getElementById('phone-number');
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => this.formatPhoneNumber(e));
        }
    }

    setupCodeInputs() {
        const codeInputs = document.querySelectorAll('.code-input');
        codeInputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                if (e.target.value.length === 1) {
                    if (index < codeInputs.length - 1) {
                        codeInputs[index + 1].focus();
                    }
                }
                this.checkCodeComplete();
            });

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !e.target.value && index > 0) {
                    codeInputs[index - 1].focus();
                }
            });

            input.addEventListener('paste', (e) => {
                e.preventDefault();
                const paste = e.clipboardData.getData('text');
                const digits = paste.replace(/\D/g, '').split('');
                codeInputs.forEach((input, i) => {
                    if (digits[i]) {
                        input.value = digits[i];
                        if (i < codeInputs.length - 1) {
                            codeInputs[i + 1].focus();
                        }
                    }
                });
                this.checkCodeComplete();
            });
        });
    }

    formatPhoneNumber(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 0) {
            // Formato secuencial para números chilenos de 9 dígitos: "9 1234 5678"
            if (value.startsWith('9')) {
                // Mientras escribe: mostrar "9 1234" cuando tiene 5 dígitos
                // Y "9 1234 5" cuando tiene 6 dígitos
                value = value.replace(/(\d)(\d{0,4})(\d{0,4})/, function(match, p1, p2, p3) {
                    let result = p1;
                    if (p2.length > 0) result += ' ' + p2;
                    if (p3.length > 0) result += ' ' + p3;
                    return result;
                });
            } else {
                // Otros números: formato estándar
                value = value.replace(/(\d{2})(\d)/, '$1 $2');
                value = value.replace(/(\d{4})(\d)/, '$1 $2');
            }
        }
        e.target.value = value;
    }

    showLoginForm() {
        document.querySelector('.auth-options')?.classList.add('hidden');
        document.getElementById('loginForm')?.classList.remove('hidden');
    }

    hideLoginForm() {
        document.querySelector('.auth-options')?.classList.remove('hidden');
        document.getElementById('loginForm')?.classList.add('hidden');
    }

    goToStep(step) {
        // Hide all steps
        document.querySelectorAll('.auth-step').forEach(el => el.classList.remove('active'));
        
        // Show target step
        document.getElementById(`step-${step}`)?.classList.add('active');
        
        // Show/hide progress bar (only visible from step 2+)
        const progressContainer = document.getElementById('progressContainer');
        if (progressContainer) {
            if (step >= 2) {
                progressContainer.classList.remove('hidden');
            } else {
                progressContainer.classList.add('hidden');
            }
        }
        
        // Update progress
        this.updateProgress(step);
        
        this.currentStep = step;
    }

    updateProgress(step) {
        const fill = document.getElementById('progressFill');
        const steps = document.querySelectorAll('.step');
        
        if (fill) {
            const percentage = ((step - 1) / 4) * 100;
            fill.style.width = `${Math.max(25, percentage)}%`;
        }

        steps.forEach((s, index) => {
            const stepNum = index + 1;
            s.classList.remove('active', 'completed');
            if (stepNum < step) {
                s.classList.add('completed');
            } else if (stepNum === step) {
                s.classList.add('active');
            }
        });
    }

    showError(elementId, message) {
        const el = document.getElementById(elementId);
        if (el) {
            el.textContent = message;
            el.classList.remove('hidden');
            setTimeout(() => el.classList.add('hidden'), 5000);
        }
    }

    showSuccess(elementId, message) {
        const el = document.getElementById(elementId);
        if (el) {
            el.textContent = message;
            el.classList.remove('hidden');
        }
    }

    setLoading(button, loading) {
        if (!button) return;
        const span = button.querySelector('span');
        const icon = button.querySelector('i');
        
        if (loading) {
            button.disabled = true;
            if (span) span.textContent = 'Cargando...';
            if (icon) icon.className = 'fas fa-spinner fa-spin';
        } else {
            button.disabled = false;
            if (span) span.textContent = button.dataset.originalText || 'Continuar';
            if (icon) icon.className = button.dataset.originalIcon || 'fas fa-arrow-right';
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        this.setLoading(btn, true);
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Save user session
                localStorage.setItem('lavadisimo_user', JSON.stringify(data.user));
                window.location.href = 'services.html';
            } else {
                this.showError('phone-error', data.message || 'Error al iniciar sesión');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('phone-error', 'Error de conexión. Intenta nuevamente.');
        } finally {
            this.setLoading(btn, false);
        }
    }

    async handleSendCode(e) {
        e.preventDefault();
        
        this.countryCode = document.getElementById('country-code').value;
        const phoneNumber = document.getElementById('phone-number').value;
        
        if (!this.countryCode) {
            this.showError('phone-error', 'Por favor selecciona un código de país');
            return;
        }
        
        // Clean phone number
        this.phone = this.countryCode + phoneNumber.replace(/\s/g, '');
        
        const btn = e.target.querySelector('button[type="submit"]');
        this.setLoading(btn, true);
        
        try {
            const response = await fetch('/api/auth/send-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: this.phone })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.verificationId = data.verificationId;
                document.getElementById('phone-display').textContent = this.phone;
                
                // Show dev code in console
                if (data.devCode) {
                    console.log('📱 Código de verificación (desarrollo):', data.devCode);
                    this.showSuccess('phone-success', `Código de desarrollo: ${data.devCode}`);
                }
                
                this.goToStep(3);
                this.startResendTimer();
            } else {
                this.showError('phone-error', data.message || 'Error al enviar código');
            }
        } catch (error) {
            console.error('Send code error:', error);
            this.showError('phone-error', 'Error de conexión. Intenta nuevamente.');
        } finally {
            this.setLoading(btn, false);
        }
    }

    async handleVerifyCode() {
        const codeInputs = document.querySelectorAll('.code-input');
        const code = Array.from(codeInputs).map(input => input.value).join('');
        
        if (code.length !== 6) {
            this.showError('verify-error', 'Por favor ingresa el código completo de 6 dígitos');
            return;
        }
        
        const btn = document.getElementById('btn-verify');
        this.setLoading(btn, true);
        
        try {
            const response = await fetch('/api/auth/verify-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    verificationId: this.verificationId,
                    code: code
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Search for existing client data
                await this.searchClientData();
                this.goToStep(4);
            } else {
                this.showError('verify-error', data.message || 'Código incorrecto');
                codeInputs.forEach(input => {
                    input.value = '';
                    input.classList.add('error');
                });
                setTimeout(() => codeInputs.forEach(input => input.classList.remove('error')), 500);
            }
        } catch (error) {
            console.error('Verify error:', error);
            this.showError('verify-error', 'Error de conexión. Intenta nuevamente.');
        } finally {
            this.setLoading(btn, false);
        }
    }

    async searchClientData() {
        try {
            // Extract local number (without country code)
            const localPhone = this.phone.replace(/^\+\d{1,3}/, '');
            
            const response = await fetch('/api/clients/by-phone', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ celcte: localPhone })
            });
            
            const data = await response.json();
            
            if (data.success && data.client) {
                // Autofill form with client data
                const nameInput = document.getElementById('user-name');
                const addressInput = document.getElementById('user-address');
                
                if (nameInput && data.client.NOMCTE) {
                    nameInput.value = data.client.NOMCTE;
                }
                if (addressInput && data.client.DIRCTE) {
                    addressInput.value = data.client.DIRCTE;
                }
                
                // Pre-fill email if available
                const emailInput = document.getElementById('user-email');
                if (emailInput && data.client.EMAILCTE) {
                    emailInput.value = data.client.EMAILCTE;
                }
            }
        } catch (error) {
            console.error('Search client error:', error);
        }
    }

    async handleResendCode() {
        const btn = document.getElementById('btn-resend');
        btn.disabled = true;
        
        try {
            const response = await fetch('/api/auth/send-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: this.phone })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.verificationId = data.verificationId;
                
                if (data.devCode) {
                    console.log('📱 Nuevo código de verificación (desarrollo):', data.devCode);
                }
                
                this.startResendTimer();
                this.showSuccess('verify-success', 'Código reenviado exitosamente');
            } else {
                this.showError('verify-error', data.message || 'Error al reenviar código');
            }
        } catch (error) {
            console.error('Resend error:', error);
            this.showError('verify-error', 'Error de conexión. Intenta nuevamente.');
            btn.disabled = false;
        }
    }

    startResendTimer() {
        const btn = document.getElementById('btn-resend');
        const timer = document.getElementById('resend-timer');
        
        let seconds = this.resendTimeout;
        btn.disabled = true;
        timer.textContent = `(${seconds}s)`;
        
        this.resendTimer = setInterval(() => {
            seconds--;
            timer.textContent = `(${seconds}s)`;
            
            if (seconds <= 0) {
                clearInterval(this.resendTimer);
                btn.disabled = false;
                timer.textContent = '';
            }
        }, 1000);
    }

    checkCodeComplete() {
        const codeInputs = document.querySelectorAll('.code-input');
        const code = Array.from(codeInputs).map(input => input.value).join('');
        const btn = document.getElementById('btn-verify');
        
        if (btn) {
            btn.disabled = code.length !== 6;
        }
    }

    async handleCompleteRegistration(e) {
        e.preventDefault();
        
        const name = document.getElementById('user-name').value;
        const email = document.getElementById('user-email').value;
        const address = document.getElementById('user-address').value;
        const password = document.getElementById('user-password').value;
        const terms = document.getElementById('accept-terms').checked;
        
        if (!terms) {
            this.showError('data-error', 'Debes aceptar los términos y condiciones');
            return;
        }
        
        const btn = e.target.querySelector('button[type="submit"]');
        this.setLoading(btn, true);
        
        try {
            const response = await fetch('/api/auth/complete-registration', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: this.phone,
                    name,
                    email,
                    address
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Save user session
                localStorage.setItem('lavadisimo_user', JSON.stringify(data.user));
                this.goToStep(5);
            } else {
                this.showError('data-error', data.message || 'Error al completar registro');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showError('data-error', 'Error de conexión. Intenta nuevamente.');
        } finally {
            this.setLoading(btn, false);
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.authSystem = new AuthSystem();
});
