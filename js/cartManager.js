// Sistema de carrito de apuestas
class CartManager {
    constructor() {
        this.cartContainer = null;
        this.cartButton = null;
        this.items = [];
        this.init();
    }    init() {
        this.loadCart();
        this.createCartInterface();
        this.updateCartDisplay();
    }

    toggleCart() {
        if (this.cartContainer) {
            const isOpen = this.cartContainer.classList.contains('open');
            this.cartContainer.classList.toggle('open');
            
            // Si el carrito se está cerrando, guardar su estado
            if (!isOpen) {
                this.saveCart();
            }
        }
    }    showCart() {
        if (this.cartContainer && !this.cartContainer.classList.contains('open')) {
            this.cartContainer.classList.add('open');
        }
    }addToCart(item) {
        
        if (!item) {
            console.error('❌ Item es null o undefined');
            return;
        }
        
        // Asegurar que la cuota sea un número
        item.cuota = parseFloat(item.cuota) || 0;
        item.betAmount = 0; // Inicializar monto en 0
        
        // Verificar si ya existe una apuesta idéntica
        const existingIndex = this.items.findIndex(existing => 
            existing.partidoId === item.partidoId && 
            existing.tipo === item.tipo
        );

        if (existingIndex !== -1) {
            // Si ya existe, mostrar notificación y no agregar
            this.showNotification('Esta apuesta ya está en el carrito', 'warning');
            return;
        }

        // Agregar timestamp para ordenar
        item.timestamp = Date.now();
        
        // Agregar al array de items
        this.items.push(item);
        
        // Guardar en localStorage y actualizar display
        this.saveCart();
        this.updateCartDisplay();
        this.showNotification('Apuesta agregada al carrito');
        
        // Actualizar badge del carrito
        this.updateCartBadge();
    }

    updateBetAmount(index, amount) {
        if (this.items[index]) {
            const newAmount = parseFloat(amount) || 0;
            if (newAmount < 0) {
                this.showNotification('El monto debe ser mayor a 0', 'error');
                return;
            }
            
            this.items[index].betAmount = newAmount;
            this.saveCart();
            this.updateCartDisplay();
        }
    }

    removeFromCart(index) {
        if (index >= 0 && index < this.items.length) {
            this.items.splice(index, 1);
            this.saveCart();
            this.updateCartDisplay();
            this.updateCartBadge();
            this.showNotification('Apuesta eliminada del carrito');
        }
    }

    clearCart() {
        this.items = [];
        this.saveCart();
        this.updateCartDisplay();
        this.updateCartBadge();
        this.showNotification('Carrito limpiado');
    }

    saveCart() {
        try {
            localStorage.setItem('betting-cart', JSON.stringify(this.items));
        } catch (error) {
            console.error('Error guardando carrito:', error);
            this.showNotification('Error al guardar el carrito', 'error');
        }
    }

    loadCart() {
        try {
            const savedCart = localStorage.getItem('betting-cart');
            if (savedCart) {
                this.items = JSON.parse(savedCart);
                this.updateCartBadge();
            }
        } catch (error) {
            console.error('Error cargando carrito:', error);
            this.items = [];
            this.showNotification('Error al cargar el carrito', 'error');
        }
    }

    updateCartBadge() {
        const cartCount = document.getElementById('cartCount');
        if (cartCount) {
            cartCount.textContent = this.items.length;
            // Mostrar/ocultar badge
            cartCount.style.display = this.items.length > 0 ? '' : 'none';
        }
    }

    createCartInterface() {
        // Usar el botón del carrito existente en HTML, no crear uno nuevo
        
        // Crear contenedor del carrito
        const cartContainer = document.createElement('div');
        cartContainer.className = 'cart-container';
        cartContainer.innerHTML = `
            <div class="cart-header">
                <h3>🛒 Mi Carrito de Apuestas</h3>
                <button class="cart-close" onclick="cartManager.toggleCart()">×</button>
            </div>
            <div class="cart-items"></div>
            <div class="cart-footer">
                <div class="cart-total">
                    <div>Total: $<span id="cart-total">0.00</span></div>
                    <div>Cuota: <span id="cart-odds">1.00</span></div>
                    <div>Ganancia: $<span id="cart-potential">0.00</span></div>
                </div>                <div class="cart-actions">
                    <button onclick="cartManager.clearCart()" class="clear-btn">🗑️ Limpiar</button>
                    <button onclick="cartManager.previewMessage()" class="preview-btn">👁️ Vista Previa</button>
                    <button onclick="cartManager.sendWhatsApp()" class="whatsapp-btn">📱 Enviar por WhatsApp</button>
                </div>
            </div>
        `;

        // Agregar estilos
        const styles = document.createElement('style');
        styles.textContent = `
            .cart-button {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #ff6b00;
                color: white;
                padding: 12px 16px;
                border-radius: 50px;
                cursor: pointer;
                z-index: 1001;
                box-shadow: 0 4px 12px rgba(255, 107, 0, 0.3);
                display: flex;
                align-items: center;
                gap: 8px;
                font-weight: bold;
            }

            .cart-button:hover {
                background: #e55a00;
                transform: translateY(-2px);
            }

            .cart-count {
                background: white;
                color: #ff6b00;
                border-radius: 50%;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: bold;
            }

            .cart-container {
                position: fixed;
                top: 0;
                right: -400px;
                width: 400px;
                height: 100vh;
                background: #1e1e1e;
                border-left: 3px solid #ff6b00;
                z-index: 1000;
                transition: right 0.3s ease;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }

            .cart-container.open {
                right: 0;
            }

            .cart-header {
                background: #2a2a2a;
                padding: 20px;
                border-bottom: 1px solid #333;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .cart-header h3 {
                margin: 0;
                color: #ff6b00;
            }

            .cart-close {
                background: none;
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .cart-items {
                flex: 1;
                overflow-y: auto;
                padding: 10px;
            }

            .cart-item {
                background: #2a2a2a;
                margin-bottom: 10px;
                padding: 15px;
                border-radius: 8px;
                border-left: 3px solid #ff6b00;
            }

            .cart-item-header {
                font-weight: bold;
                color: white;
                margin-bottom: 8px;
                font-size: 14px;
            }

            .cart-item-details {
                color: #ccc;
                font-size: 12px;
                margin-bottom: 10px;
            }

            .cart-item-amount {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 10px;
            }

            .cart-item-amount input {
                background: #333;
                border: 1px solid #555;
                color: white;
                padding: 5px 8px;
                border-radius: 4px;
                width: 80px;
            }

            .cart-item-remove {
                background: #dc3545;
                color: white;
                border: none;
                padding: 4px 8px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
            }

            .cart-footer {
                background: #2a2a2a;
                padding: 20px;
                border-top: 1px solid #333;
            }

            .cart-total {
                background: #333;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 15px;
                text-align: center;
                color: white;
            }

            .cart-total div {
                margin-bottom: 5px;
                font-weight: bold;
            }

            .cart-actions {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
            }

            .cart-actions button {
                flex: 1;
                padding: 12px;
                border: none;
                border-radius: 6px;
                font-weight: bold;
                cursor: pointer;
                transition: background-color 0.3s ease;
                min-width: 120px;
            }            .clear-btn {
                background: #dc3545;
                color: white;
            }

            .clear-btn:hover {
                background: #c82333;
            }

            .preview-btn {
                background: #6c757d;
                color: white;
            }

            .preview-btn:hover {
                background: #5a6268;
            }

            .whatsapp-btn {
                background: #25d366;
                color: white;
            }

            .whatsapp-btn:hover {
                background: #20c05a;
            }

            .bet-button {
                background: #ff6b00;
                color: white;
                border: none;
                padding: 4px 8px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 11px;
                margin: 1px;
            }

            .bet-button:hover {
                background: #e55a00;
            }

            .bet-button.selected {
                background: #28a745;
            }

            @media (max-width: 600px) {
                .cart-container {
                    width: 100vw;
                    right: -100vw;
                }
            }

            .preview-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1100;
            }

            .preview-content {
                background: #2a2a2a;
                width: 90%;
                max-width: 500px;
                max-height: 90vh;
                border-radius: 8px;
                overflow: hidden;
            }

            .preview-header {
                background: #333;
                padding: 15px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .preview-header h3 {
                margin: 0;
                color: #ff6b00;
            }

            .preview-close {
                background: none;
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
                padding: 0;
            }

            .preview-body {
                padding: 20px;
                overflow-y: auto;
                max-height: calc(90vh - 60px);
                color: white;
                line-height: 1.5;
                white-space: pre-wrap;
            }

            /* Notification styles */
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 20px;
                border-radius: 8px;
                color: white;
                font-weight: bold;
                z-index: 1200;
                animation: slideInRight 0.3s ease;
                max-width: 300px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            }

            .notification.success {
                background: #28a745;
            }

            .notification.error {
                background: #dc3545;
            }

            .notification.warning {
                background: #ffc107;
                color: #212529;
            }

            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            .empty-cart {
                text-align: center;
                padding: 40px 20px;
                color: #999;
                font-style: italic;
            }

            .item-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
            }

            .item-league {
                font-size: 12px;
                color: #ff6b00;
                font-weight: bold;
            }

            .remove-item {
                background: #dc3545;
                color: white;
                border: none;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                font-size: 12px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .item-match {
                font-weight: bold;
                color: white;
                margin-bottom: 5px;
            }

            .item-bet {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
                font-size: 14px;
            }

            .bet-type {
                color: #ccc;
            }

            .bet-odds {
                color: #ff6b00;
                font-weight: bold;
            }

            .item-amount {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .item-amount label {
                color: #ccc;
                font-size: 12px;
            }

            .item-amount input {
                flex: 1;
                background: #333;
                border: 1px solid #555;
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
            }
        `;        document.head.appendChild(styles);
        // No agregar cartButton duplicado - usar el del HTML
        document.body.appendChild(cartContainer);

        this.cartContainer = cartContainer;
        // Usar el botón existente del HTML
        this.cartButton = document.querySelector('.btn-cart');
    }

    getItemCount() {
        return this.items.length;
    }

    getTotalAmount() {
        return this.items.reduce((total, item) => total + (item.betAmount || 0), 0);
    }

    getTotalOdds() {
        return this.items.reduce((total, item) => total * item.cuota, 1);
    }

    getPotentialWinnings() {
        return this.getTotalAmount() * this.getTotalOdds();
    }

    updateCartDisplay() {
        const cartItems = document.querySelector('.cart-items');
        if (!cartItems) return;

        // Actualizar contenido del carrito
        cartItems.innerHTML = this.items.length === 0 
            ? '<div class="empty-cart">No hay apuestas en el carrito</div>'
            : this.items.map((item, index) => `
                <div class="cart-item">
                    <div class="item-header">
                        <div class="item-league">${item.liga} - ${item.hora}</div>
                        <button onclick="cartManager.removeFromCart(${index})" class="remove-item">×</button>
                    </div>
                    <div class="item-match">${item.local} vs ${item.visitante}</div>
                    <div class="item-bet">
                        <span class="bet-type">${item.tipoLabel}</span>
                        <span class="bet-odds">@ ${item.cuota}</span>
                    </div>
                    <div class="item-amount">
                        <label>Monto: $</label>
                        <input type="number" 
                            value="${item.betAmount || ''}" 
                            min="0" 
                            step="0.01" 
                            placeholder="0.00"
                            onchange="cartManager.updateBetAmount(${index}, this.value)"
                        >
                    </div>
                </div>
            `).join('');

        // Actualizar totales
        document.getElementById('cart-total').textContent = this.getTotalAmount().toFixed(2);
        document.getElementById('cart-odds').textContent = this.getTotalOdds().toFixed(2);
        document.getElementById('cart-potential').textContent = this.getPotentialWinnings().toFixed(2);

        // Actualizar contador del ícono
        const cartCount = document.getElementById('cartCount');
        if (cartCount) {
            cartCount.textContent = this.getItemCount();
        }
    }

    generateWhatsAppMessage(encode = true) {
        if (this.items.length === 0) return '';

        // Verificar que todas las apuestas tengan monto
        const invalidBets = this.items.filter(item => !item.betAmount || item.betAmount <= 0);
        if (invalidBets.length > 0) {
            this.showNotification('Todas las apuestas deben tener un monto válido', 'error');
            return '';
        }

        const message = [
            '🎮 *NUEVA APUESTA - La Jugada Prohibida* 🎮\n',
            '📝 *Detalle de las apuestas:*\n'
        ];

        // Agrupar apuestas por liga
        const betsByLeague = {};
        this.items.forEach(item => {
            if (!betsByLeague[item.liga]) {
                betsByLeague[item.liga] = [];
            }
            betsByLeague[item.liga].push(item);
        });

        // Generar mensaje organizado por ligas
        Object.entries(betsByLeague).forEach(([liga, apuestas]) => {
            message.push(`🏆 *${liga}*`);
            apuestas.forEach(item => {
                message.push(
                    `   ⚽ ${item.local} vs ${item.visitante} (${item.hora})`,
                    `   📍 ${item.tipoLabel} @ ${item.cuota}`,
                    `   💰 Monto: $${item.betAmount?.toFixed(2) || '0.00'}\n`
                );
            });
        });        message.push(
            `\n📊 *Resumen:*`,
            `• Total apostado: $${this.getTotalAmount().toFixed(2)}`
        );

        return encode ? encodeURIComponent(message.join('\n')) : message.join('\n');
    }

    previewMessage() {
        const message = this.generateWhatsAppMessage(false);
        if (!message) {
            this.showNotification('Agrega apuestas al carrito primero', 'error');
            return;
        }

        // Crear modal de vista previa
        const modal = document.createElement('div');
        modal.className = 'preview-modal';
        modal.innerHTML = `
            <div class="preview-content">
                <div class="preview-header">
                    <h3>Vista Previa del Mensaje</h3>
                    <button class="preview-close" onclick="this.closest('.preview-modal').remove()">×</button>
                </div>
                <div class="preview-body">
                    ${decodeURIComponent(message).replace(/\n/g, '<br>')}
                </div>
            </div>
        `;

        // Agregar estilos si no existen
        if (!document.querySelector('#preview-styles')) {
            const styles = document.createElement('style');
            styles.id = 'preview-styles';
            styles.textContent = `
                .preview-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1100;
                }

                .preview-content {
                    background: #2a2a2a;
                    width: 90%;
                    max-width: 500px;
                    max-height: 90vh;
                    border-radius: 8px;
                    overflow: hidden;
                }

                .preview-header {
                    background: #333;
                    padding: 15px 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .preview-header h3 {
                    margin: 0;
                    color: #ff6b00;
                }

                .preview-close {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 24px;
                    cursor: pointer;
                    padding: 0;
                }

                .preview-body {
                    padding: 20px;
                    overflow-y: auto;
                    max-height: calc(90vh - 60px);
                    color: white;
                    line-height: 1.5;
                    white-space: pre-wrap;
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(modal);
    }

    async sendWhatsApp() {
        const message = this.generateWhatsAppMessage(true);
        if (!message) {
            return; // El mensaje de error ya se muestra en generateWhatsAppMessage
        }

        try {
            // Obtener número de WhatsApp de la configuración
            const config = await dataManager.getConfiguracion();
            const whatsappNumber = config?.whatsapp;

            if (!whatsappNumber) {
                throw new Error('Número de WhatsApp no configurado');
            }

            // Abrir WhatsApp
            window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
            
            // Limpiar carrito después de enviar
            this.clearCart();
            this.showNotification('Mensaje enviado correctamente');
        } catch (error) {
            console.error('Error enviando mensaje:', error);
            this.showNotification('Error al enviar mensaje: ' + error.message, 'error');
        }
    }

    showNotification(message, type = 'success') {
        // Crear notificación
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Agregar al documento
        document.body.appendChild(notification);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Instancia global del gestor del carrito
const cartManager = new CartManager();
