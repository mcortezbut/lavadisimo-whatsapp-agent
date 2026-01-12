/**
 * LAVADÍSIMO - Sistema de Chat WhatsApp para Administradores
 */

class WhatsAppChat {
    constructor() {
        this.conversations = [];
        this.currentPhone = null;
        this.currentMessages = [];
        this.pollingInterval = null;
        
        this.init();
    }

    init() {
        // Verificar autenticación antes de inicializar
        if (sessionStorage.getItem('chat_auth') !== 'true') {
            window.location.href = '/admin/login.html';
            return;
        }
        
        this.bindEvents();
        this.loadConversations();
    }

    bindEvents() {
        // Search
        document.getElementById('searchPhone')?.addEventListener('input', (e) => {
            this.filterConversations(e.target.value);
        });

        // Message form
        document.getElementById('messageForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendMessage();
        });

        // Send button
        document.getElementById('messageInput')?.addEventListener('input', (e) => {
            const sendBtn = document.getElementById('sendBtn');
            if (sendBtn) {
                sendBtn.disabled = !e.target.value.trim() || !this.currentPhone;
            }
        });

        // Call button
        document.getElementById('btnCall')?.addEventListener('click', () => {
            if (this.currentPhone) {
                window.location.href = `tel:+56${this.currentPhone}`;
            }
        });

        // Orders button
        document.getElementById('btnOrders')?.addEventListener('click', () => {
            if (this.currentPhone) {
                // Buscar órdenes del cliente
                this.showClientOrders();
            }
        });

        // Logout button
        document.getElementById('btnLogout')?.addEventListener('click', () => {
            this.logout();
        });
    }

    logout() {
        sessionStorage.removeItem('chat_auth');
        sessionStorage.removeItem('chat_user');
        window.location.href = '/admin/login.html';
    }

    async loadConversations() {
        try {
            const response = await fetch('/api/whatsapp/conversations');
            const data = await response.json();
            
            if (data.success) {
                this.conversations = data.conversations;
                this.renderConversations();
                
                // Auto-refresh cada 10 segundos
                this.startPolling();
            } else {
                this.showError('Error cargando conversaciones');
            }
        } catch (error) {
            console.error('Error loading conversations:', error);
            this.showError('Error de conexión');
        }
    }

    renderConversations(filter = '') {
        const container = document.getElementById('conversationsList');
        if (!container) return;

        let filtered = this.conversations;
        if (filter) {
            const search = filter.toLowerCase();
            filtered = this.conversations.filter(c => 
                c.telefono.includes(search) || c.nombre.toLowerCase().includes(search)
            );
        }

        if (filtered.length === 0) {
            container.innerHTML = `
                <div style="padding: 40px; text-align: center; color: var(--text-light);">
                    <i class="fas fa-comments" style="font-size: 40px; margin-bottom: 10px;"></i>
                    <p>${filter ? 'No se encontraron conversaciones' : 'Sin conversaciones aún'}</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filtered.map(conv => `
            <div class="conversation-item ${this.currentPhone === conv.telefono ? 'active' : ''} ${conv.windowExpired ? 'expired' : ''}" 
                 data-phone="${conv.telefono}">
                <div class="conversation-avatar ${conv.windowExpired ? 'expired' : ''}">${(this.toTitleCase(conv.nombre) || 'C').charAt(0)}</div>
                <div class="conversation-info">
                    <div class="conversation-header">
                        <span class="conversation-phone">${this.toTitleCase(conv.nombre) || 'Cliente'}</span>
                        <span class="conversation-time">${this.formatTime(conv.fecha)}</span>
                    </div>
                    <div class="conversation-preview">
                        ${conv.mensaje ? conv.mensaje.substring(0, 50) + (conv.mensaje.length > 50 ? '...' : '') : ''}
                        ${conv.sin_leer > 0 ? `<span class="unread-badge">${conv.sin_leer}</span>` : ''}
                    </div>
                    <div style="font-size: 12px; color: var(--text-light); margin-top: 2px;">${conv.telefono}</div>
                </div>
            </div>
        `).join('');

        // Bind click events
        container.querySelectorAll('.conversation-item').forEach(item => {
            item.addEventListener('click', () => {
                this.selectConversation(item.dataset.phone);
            });
        });
    }

    filterConversations(search) {
        this.renderConversations(search);
    }

    async selectConversation(phone) {
        // Find conversation data
        const conv = this.conversations.find(c => c.telefono === phone);
        this.currentPhone = phone;
        
        // Update UI
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.classList.toggle('active', item.dataset.phone === phone);
        });

        document.getElementById('emptyChat').style.display = 'none';
        document.getElementById('chatContent').style.display = 'flex';

        // Update header with name
        document.getElementById('chatPhone').textContent = this.toTitleCase(conv?.nombre) || 'Cliente';
        document.getElementById('chatAvatar').textContent = (this.toTitleCase(conv?.nombre) || 'C').charAt(0);
        document.getElementById('chatStatus').textContent = phone;

        // Load messages
        await this.loadMessages(phone);
    }

    async loadMessages(phone) {
        try {
            const response = await fetch(`/api/whatsapp/messages/${phone}`);
            const data = await response.json();
            
            if (data.success) {
                this.currentMessages = data.messages;
                this.renderMessages();
                this.markAsRead(phone);
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }

    renderMessages() {
        const container = document.getElementById('messagesContainer');
        if (!container) return;

        if (this.currentMessages.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; color: var(--text-light); padding: 40px;">
                    <i class="fas fa-comment-dots" style="font-size: 40px; margin-bottom: 10px;"></i>
                    <p>Sin mensajes aún</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.currentMessages.map(msg => `
            <div class="message ${msg.tipo == 0 ? 'incoming' : 'outgoing'}">
                <div class="message-text">${this.escapeHtml(msg.mensaje)}</div>
                <div class="message-time">${this.formatDateTime(msg.fecha)}</div>
            </div>
        `).join('');

        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    }

    async sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();
        
        if (!message || !this.currentPhone) return;

        const sendBtn = document.getElementById('sendBtn');
        sendBtn.disabled = true;

        try {
            const response = await fetch('/api/whatsapp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: this.currentPhone,
                    message: message
                })
            });

            const data = await response.json();

            if (data.success) {
                input.value = '';
                await this.loadMessages(this.currentPhone);
                await this.loadConversations(); // Refresh list
            } else {
                alert('Error al enviar: ' + data.message);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Error de conexión');
        } finally {
            sendBtn.disabled = false;
            input.focus();
        }
    }

    async markAsRead(phone) {
        try {
            await fetch('/api/whatsapp/read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: phone })
            });
            
            // Refresh conversations to update unread count
            this.loadConversations();
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    }

    showClientOrders() {
        if (!this.currentPhone) return;
        
        // Abrir en nueva pestaña con filtro por teléfono
        window.open(`/seguimiento.html?phone=${this.currentPhone}`, '_blank');
    }

    startPolling() {
        if (this.pollingInterval) clearInterval(this.pollingInterval);
        
        this.pollingInterval = setInterval(() => {
            this.loadConversations();
            if (this.currentPhone) {
                this.loadMessages(this.currentPhone);
            }
        }, 10000); // 10 segundos
    }

    formatTime(dateStr) {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Ahora';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
        return date.toLocaleDateString('es-CL');
    }

    formatDateTime(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleString('es-CL', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Convertir texto a Title Case (primera letra de cada palabra en mayúscula)
    toTitleCase(text) {
        if (!text) return '';
        return text.toLowerCase().replace(/(?:^|\s)\S/g, function(a) { 
            return a.toUpperCase(); 
        });
    }

    showError(msg) {
        const container = document.getElementById('conversationsList');
        if (container) {
            container.innerHTML = `
                <div style="padding: 40px; text-align: center; color: var(--error);">
                    <i class="fas fa-exclamation-triangle" style="font-size: 40px; margin-bottom: 10px;"></i>
                    <p>${msg}</p>
                </div>
            `;
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.chatApp = new WhatsAppChat();
});
