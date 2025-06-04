// Sistema de carrito de apuestas
class CartManager {    constructor() {
        this.cartContainer = null;
        this.cartButton = null;
        this.items = [];
        this.combinations = []; // Array para manejar combinaciones
        this.combinationMode = false; // Modo combinación activado/desactivado
        this.activeTab = 'individual'; // Pestaña activa por defecto
        this.init();
    }init() {
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
    }    addToCart(item) {
        
        if (!item) {
            console.error('❌ Item es null o undefined');
            return;
        }
        
        // Asegurar que la cuota sea un número
        item.cuota = parseFloat(item.cuota) || 0;
        item.betAmount = 0; // Inicializar monto en 0
        item.isSelected = false; // Para seleccionar en combinaciones
        item.combinationId = null; // ID de combinación si pertenece a una
        
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
    }    clearCart() {
        this.items = [];
        this.combinations = [];
        this.combinationMode = false;
        this.saveCart();
        this.updateCartDisplay();
        this.updateCartBadge();
        this.showNotification('Carrito limpiado');
    }

    saveCart() {
        try {
            const cartData = {
                items: this.items,
                combinations: this.combinations
            };
            localStorage.setItem('betting-cart', JSON.stringify(cartData));
        } catch (error) {
            console.error('Error guardando carrito:', error);
            this.showNotification('Error al guardar el carrito', 'error');
        }
    }    loadCart() {
        try {
            const savedCart = localStorage.getItem('betting-cart');
            if (savedCart) {
                const cartData = JSON.parse(savedCart);
                
                // Compatibilidad con versiones anteriores
                if (Array.isArray(cartData)) {
                    this.items = cartData;
                    this.combinations = [];
                } else {
                    this.items = cartData.items || [];
                    this.combinations = cartData.combinations || [];
                }
                
                this.updateCartBadge();
            }
        } catch (error) {
            console.error('Error cargando carrito:', error);
            this.items = [];
            this.combinations = [];
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
        cartContainer.className = 'cart-container';        cartContainer.innerHTML = `
            <div class="cart-header">
                <h3>🛒 Mi Carrito de Apuestas</h3>
                <button class="cart-close" onclick="cartManager.toggleCart()">×</button>
            </div>            <div class="cart-controls">
                <button id="combination-mode-btn" onclick="cartManager.toggleCombinationMode()" class="combination-btn">
                    🎲 Hacer Combo
                </button>
                <button id="create-combination-btn" onclick="cartManager.createCombination()" class="create-combination-btn" style="display: none;">
                    ⚡ Combinar (<span id="selected-count">0</span>)
                </button>
                <div id="combination-help" style="display: none; color: #28a745; font-size: 12px; margin-top: 8px; padding: 8px; background: rgba(40, 167, 69, 0.1); border-radius: 4px;">
                    ✨ Selecciona varias apuestas y multiplica las ganancias
                </div>
            </div>
            
            <!-- Pestañas del carrito -->
            <div class="cart-tabs" id="cart-tabs" style="display: none;">
                <button class="tab-btn active" onclick="cartManager.switchTab('individual')" id="tab-individual">
                    💰 Apuestas (<span id="individual-count">0</span>)
                </button>
                <button class="tab-btn" onclick="cartManager.switchTab('combinations')" id="tab-combinations">
                    🎲 Combos (<span id="combo-count">0</span>)
                </button>
            </div>
            
            <div class="cart-content">
                <div class="cart-items" id="cart-items-container"></div>
                <div class="cart-combinations" id="cart-combinations-container" style="display: none;"></div>
            </div><div class="cart-footer">                <div class="cart-total">
                    <div>💰 Apuestas Simples: $<span id="cart-total">0.00</span></div>
                    <div>🎲 Combos: $<span id="cart-combination-total">0.00</span></div>
                    <div class="total-line">🏆 Total Apostado: $<span id="cart-final-total">0.00</span></div>
                </div>                <div class="cart-actions">
                    <button onclick="cartManager.clearCart()" class="clear-btn">🗑️ Limpiar</button>
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
            }            .cart-items {
                flex: 1;
                overflow-y: auto;
                padding: 10px;
            }

            /* Estilos para pestañas */
            .cart-tabs {
                display: flex;
                background: #333;
                border-bottom: 1px solid #555;
            }

            .tab-btn {
                flex: 1;
                background: #2a2a2a;
                color: #ccc;
                border: none;
                padding: 12px 16px;
                cursor: pointer;
                font-size: 13px;
                font-weight: bold;
                transition: all 0.3s ease;
                border-bottom: 3px solid transparent;
            }

            .tab-btn:hover {
                background: #333;
                color: white;
            }

            .tab-btn.active {
                background: #1e1e1e;
                color: #ff6b00;
                border-bottom-color: #ff6b00;
            }

            .cart-content {
                flex: 1;
                overflow: hidden;
                display: flex;
                flex-direction: column;
            }

            .cart-items, .cart-combinations {
                flex: 1;
                overflow-y: auto;
                padding: 10px;
                background: #1e1e1e;
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
            }            .cart-footer {
                background: #2a2a2a;
                padding: 8px;
                border-top: 1px solid #333;
            }

            .cart-total {
                background: #333;
                padding: 6px;
                border-radius: 6px;
                margin-bottom: 6px;
                text-align: center;
                color: white;
                font-size: 12px;
            }

            .cart-total div {
                margin-bottom: 1px;
                font-weight: bold;
            }            .cart-actions {
                display: flex;
                gap: 3px;
                flex-wrap: nowrap;
            }

            .cart-actions button {
                flex: 1;
                padding: 4px 6px;
                border: none;
                border-radius: 3px;
                font-weight: bold;
                cursor: pointer;
                transition: background-color 0.3s ease;
                min-width: 60px;
                font-size: 10px;
                white-space: nowrap;
            }.clear-btn {
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
            }            /* Mejoras responsive para móviles */
            @media (max-width: 768px) {
                .cart-container {
                    width: 100vw;
                    right: -100vw;
                }
                
                .cart-header {
                    padding: 12px 15px;
                }
                
                .cart-header h3 {
                    font-size: 1rem;
                }
                
                .cart-close {
                    width: 30px;
                    height: 30px;
                    font-size: 18px;
                }
                
                .tab-btn {
                    padding: 12px 10px;
                    font-size: 12px;
                }
                  .cart-footer {
                    padding: 8px;
                }
                
                .cart-total {
                    padding: 6px;
                    margin-bottom: 6px;
                    font-size: 12px;
                }
                
                .cart-total div {
                    margin-bottom: 1px;
                }
                  .cart-actions button {
                    padding: 6px 4px;
                    font-size: 10px;
                    min-width: 50px;
                }
                    font-size: 14px;
                    min-height: 50px;
                }
                
                .cart-item {
                    padding: 12px;
                    margin-bottom: 8px;
                }
                
                .item-amount {
                    flex-direction: column;
                    align-items: stretch;
                    gap: 8px;
                }
                
                .item-amount label {
                    font-size: 14px;
                }
                
                .item-amount input {
                    padding: 12px;
                    font-size: 16px; /* Evita zoom en iOS */
                    width: 100%;
                    min-height: 44px; /* Touch target mínimo */
                }
                
                .cart-footer {
                    padding: 15px;
                }
                  .cart-actions {
                    flex-direction: row;
                    gap: 8px;
                }
                
                .cart-actions button {
                    min-width: auto;
                    padding: 8px;
                    font-size: 12px;
                    min-height: 36px;
                }.cart-controls {
                    padding: 6px;
                }
                
                .combination-btn, .create-combination-btn {
                    padding: 8px 10px;
                    font-size: 11px;
                    min-height: 36px;
                }
                
                .combination-amount {
                    flex-direction: column;
                    align-items: stretch;
                    gap: 10px;
                }
                
                .combination-amount input {
                    width: 100%;
                    padding: 12px;
                    font-size: 16px;
                    min-height: 44px;
                }
                
                .notification {
                    top: 10px;
                    right: 10px;
                    left: 10px;
                    max-width: none;
                    padding: 15px;
                    font-size: 14px;
                }
            }
            
            @media (max-width: 480px) {
                .cart-header h3 {
                    font-size: 1rem;
                }
                
                .tab-btn {
                    padding: 12px 8px;
                    font-size: 13px;
                }
                
                .cart-item {
                    padding: 10px;
                }
                
                .item-league {
                    font-size: 11px;
                }
                
                .item-match {
                    font-size: 14px;
                    margin-bottom: 8px;
                }
                
                .item-bet {
                    font-size: 13px;
                }
                  .cart-total {
                    padding: 8px;
                    font-size: 12px;
                }
                  .cart-actions button {
                    padding: 8px;
                    font-size: 11px;
                }
                
                .combination-item {
                    padding: 8px;
                }
                
                .combination-title {
                    font-size: 12px;
                }
                
                .combination-bet {
                    font-size: 11px;
                }
                  .combination-odds {
                    font-size: 12px;
                    padding: 6px;
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
            }            .item-amount input {
                flex: 1;
                background: #333;
                border: 1px solid #555;
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
            }            /* Estilos para combinaciones */
            .cart-controls {
                padding: 6px;
                border-bottom: 1px solid #333;
                background: #2a2a2a;
            }            .combination-btn {
                background: linear-gradient(45deg, #007bff, #0056b3);
                color: white;
                border: none;
                padding: 6px 10px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 11px;
                font-weight: bold;
                margin-right: 6px;
                transition: all 0.3s ease;
                box-shadow: 0 2px 4px rgba(0, 123, 255, 0.3);
            }

            .combination-btn:hover {
                background: linear-gradient(45deg, #0056b3, #004085);
                transform: translateY(-1px);
                box-shadow: 0 4px 8px rgba(0, 123, 255, 0.4);
            }

            .combination-btn.active {
                background: linear-gradient(45deg, #dc3545, #c82333);
                animation: pulse 1.5s infinite;
            }

            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }            .create-combination-btn {
                background: linear-gradient(45deg, #28a745, #20c997);
                color: white;
                border: none;
                padding: 6px 10px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 11px;
                font-weight: bold;
                transition: all 0.3s ease;
                box-shadow: 0 2px 4px rgba(40, 167, 69, 0.3);
                animation: glow 2s ease-in-out infinite alternate;
            }

            .create-combination-btn:hover {
                background: linear-gradient(45deg, #20c997, #1e7e34);
                transform: translateY(-1px);
                box-shadow: 0 4px 8px rgba(40, 167, 69, 0.4);
            }

            @keyframes glow {
                from { box-shadow: 0 2px 4px rgba(40, 167, 69, 0.3); }
                to { box-shadow: 0 4px 12px rgba(40, 167, 69, 0.6); }
            }            .cart-item.selectable {
                cursor: pointer;
                transition: all 0.3s ease;
                border: 2px solid transparent;
                position: relative;
            }

            .cart-item.selectable:hover {
                background: #333;
                border-color: #007bff;
                transform: translateX(5px);
            }            .cart-item.selectable::before {
                content: "👆 Toca para elegir";
                position: absolute;
                top: -25px;
                right: 0;
                background: #007bff;
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 11px;
                opacity: 0;
                transition: opacity 0.3s ease;
                pointer-events: none;
            }

            .cart-item.selectable:hover::before {
                opacity: 1;
            }

            .cart-item.selected {
                background: linear-gradient(135deg, #004085, #0056b3);
                border-color: #007bff;
                box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
                transform: translateX(5px);
            }

            .cart-item.selected::before {
                content: "✅ Elegida";
                opacity: 1;
                background: #28a745;
            }

            .item-selector {
                margin-bottom: 8px;
            }

            .item-selector input[type="checkbox"] {
                margin-right: 8px;
            }            .cart-combinations {
                flex: 1;
                overflow-y: auto;
                padding: 10px;
                background: #1e1e1e;
            }.empty-combinations {
                text-align: center;
                padding: 20px;
                color: #666;
                font-style: italic;
                font-size: 14px;
            }            .combination-item {
                background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
                margin-bottom: 8px;
                padding: 10px;
                border-radius: 6px;
                border: 2px solid #007bff;
                box-shadow: 0 4px 12px rgba(0, 123, 255, 0.2);
            }            .combination-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 6px;
            }            .combination-title {
                color: #28a745;
                font-weight: bold;
                font-size: 13px;
            }

            .remove-combination {
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
            }            .combination-details {
                margin-bottom: 6px;
            }

            .combination-bet {
                color: #ccc;
                font-size: 12px;
                margin-bottom: 5px;
                padding-left: 10px;
            }            .combination-odds {
                color: #ffc107;
                font-weight: bold;
                margin-bottom: 6px;
                text-align: center;
                background: #333;
                padding: 6px;
                border-radius: 4px;
                font-size: 13px;
            }

            .combination-amount {
                display: flex;
                align-items: center;
                gap: 8px;
                flex-wrap: wrap;
            }

            .combination-amount label {
                color: #ccc;
                font-size: 12px;
            }

            .combination-amount input {
                background: #333;
                border: 1px solid #555;
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                width: 80px;
            }

            .potential-win {
                color: #28a745;
                font-weight: bold;
                font-size: 12px;
                margin-top: 5px;
                width: 100%;
            }            .total-line {
                border-top: 1px solid #555;
                padding-top: 3px;
                margin-top: 3px;
                font-size: 13px;
                color: #ff6b00;
            }
        `;document.head.appendChild(styles);
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
    }    // Métodos para manejar combinaciones
    toggleCombinationMode() {
        this.combinationMode = !this.combinationMode;
        
        if (this.combinationMode) {
            // Limpiar selecciones previas
            this.items.forEach(item => item.isSelected = false);
            this.showNotification('🎲 Modo combo activado. Toca las apuestas que quieras combinar', 'success');
        } else {
            // Limpiar selecciones
            this.items.forEach(item => item.isSelected = false);
            this.showNotification('Modo combo cancelado', 'warning');
        }
        
        this.updateCartDisplay();
    }

    toggleItemSelection(index) {
        if (!this.combinationMode) return;
        
        if (this.items[index] && !this.items[index].combinationId) {
            this.items[index].isSelected = !this.items[index].isSelected;
            this.updateCartDisplay();
        }
    }

    createCombination() {
        const selectedItems = this.items.filter(item => item.isSelected);
          if (selectedItems.length < 2) {
            this.showNotification('Necesitas elegir al menos 2 apuestas', 'warning');
            return;
        }        // Crear nueva combinación
        const combinationId = Date.now().toString();
        // Add logs to see what we're working with
        console.log('Creating combination with selected items:', selectedItems);
        console.log('Selected item cuotas:', selectedItems.map(item => item.cuota));
        
        const combination = {
            id: combinationId,
            items: selectedItems.map(item => ({...item})),
            combinedOdds: selectedItems.reduce((total, item) => total + item.cuota, 0),
            betAmount: 0,
            timestamp: Date.now()
        };
        
        console.log('Created combination with combined odds:', combination.combinedOdds);
        console.log(selectedItems);
        

        this.combinations.push(combination);

        // Marcar items como parte de esta combinación y deseleccionar
        selectedItems.forEach(item => {
            const originalIndex = this.items.findIndex(original => 
                original.partidoId === item.partidoId && original.tipo === item.tipo
            );
            if (originalIndex !== -1) {
                this.items[originalIndex].combinationId = combinationId;
                this.items[originalIndex].isSelected = false;
            }
        });

        this.combinationMode = false;
        this.saveCart();
        this.updateCartDisplay();        this.showNotification(`✅ Combo creado! ${selectedItems.length} apuestas con cuota ${combination.combinedOdds.toFixed(2)}`);
    }

    updateCombinationAmount(combinationId, amount) {
        const combination = this.combinations.find(c => c.id === combinationId);
        if (combination) {
            const newAmount = parseFloat(amount) || 0;
            if (newAmount < 0) {
                this.showNotification('El monto debe ser mayor a 0', 'error');
                return;
            }
            
            combination.betAmount = newAmount;
            this.saveCart();
            this.updateCartDisplay();
        }
    }

    removeCombination(combinationId) {
        const combinationIndex = this.combinations.findIndex(c => c.id === combinationId);
        if (combinationIndex !== -1) {
            // Liberar items de la combinación
            this.items.forEach(item => {
                if (item.combinationId === combinationId) {
                    item.combinationId = null;
                }
            });

            this.combinations.splice(combinationIndex, 1);
            this.saveCart();
            this.updateCartDisplay();            this.showNotification('Combo eliminado');
        }
    }

    getSelectedItemsCount() {
        return this.items.filter(item => item.isSelected).length;
    }

    getTotalCombinationAmount() {
        return this.combinations.reduce((total, combination) => total + (combination.betAmount || 0), 0);
    }    getTotalCombinationWinnings() {
        return this.combinations.reduce((total, combination) => {
            return total + ((combination.betAmount || 0) * combination.combinedOdds);
        }, 0);
    }

    // Método para cambiar entre pestañas
    switchTab(tab) {
        this.activeTab = tab;
        
        // Actualizar botones de pestañas
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`tab-${tab}`).classList.add('active');
        
        // Mostrar/ocultar contenido
        const itemsContainer = document.getElementById('cart-items-container');
        const combinationsContainer = document.getElementById('cart-combinations-container');
        
        if (tab === 'individual') {
            itemsContainer.style.display = 'block';
            combinationsContainer.style.display = 'none';
        } else {
            itemsContainer.style.display = 'none';
            combinationsContainer.style.display = 'block';
        }
    }updateCartDisplay() {
        const cartItems = document.querySelector('.cart-items');
        const cartCombinations = document.querySelector('.cart-combinations');
        if (!cartItems) return;

        // Filtrar items que no están en combinaciones
        const independentItems = this.items.filter(item => !item.combinationId);

        // Actualizar contenido de apuestas individuales
        cartItems.innerHTML = independentItems.length === 0 
            ? '<div class="empty-cart">No hay apuestas individuales</div>'
            : independentItems.map((item, index) => {
                const originalIndex = this.items.findIndex(original => 
                    original.partidoId === item.partidoId && original.tipo === item.tipo
                );
                
                return `
                <div class="cart-item ${item.isSelected ? 'selected' : ''} ${this.combinationMode ? 'selectable' : ''}">
                    ${this.combinationMode ? `
                        <div class="item-selector">
                            <input type="checkbox" 
                                ${item.isSelected ? 'checked' : ''} 
                                onchange="cartManager.toggleItemSelection(${originalIndex})"
                            >
                        </div>
                    ` : ''}
                    <div class="item-content">
                        <div class="item-header">
                            <div class="item-league">${item.liga} - ${item.hora}</div>
                            <button onclick="cartManager.removeFromCart(${originalIndex})" class="remove-item">×</button>
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
                                onchange="cartManager.updateBetAmount(${originalIndex}, this.value)"
                            >
                        </div>
                    </div>
                </div>
            `}).join('');        // Actualizar combinaciones
        if (cartCombinations) {
            cartCombinations.innerHTML = this.combinations.length === 0 
                ? ''  // No mostrar mensaje cuando no hay combinaciones
                : this.combinations.map(combination => `
                    <div class="combination-item">
                        <div class="combination-header">
                            <div class="combination-title">🔗 Combinación (${combination.items.length} apuestas)</div>
                            <button onclick="cartManager.removeCombination('${combination.id}')" class="remove-combination">×</button>
                        </div>
                        <div class="combination-details">
                            ${combination.items.map(item => `
                                <div class="combination-bet">
                                    ${item.local} vs ${item.visitante} - ${item.tipoLabel} @ ${item.cuota}
                                </div>
                            `).join('')}
                        </div>
                        <div class="combination-odds">
                            <strong>Cuota combinada: ${combination.combinedOdds.toFixed(2)}</strong>
                        </div>
                        <div class="combination-amount">
                            <label>Monto: $</label>
                            <input type="number" 
                                value="${combination.betAmount || ''}" 
                                min="0" 
                                step="0.01" 
                                placeholder="0.00"
                                onchange="cartManager.updateCombinationAmount('${combination.id}', this.value)"
                            >
                            <div class="potential-win">
                                Ganancia potencial: $${((combination.betAmount || 0) * combination.combinedOdds).toFixed(2)}
                            </div>
                        </div>
                    </div>
                `).join('');
        }

        // Gestionar pestañas: solo mostrar si hay combinaciones
        const cartTabs = document.getElementById('cart-tabs');
        const hasCombinations = this.combinations.length > 0;
        
        if (cartTabs) {
            if (hasCombinations) {
                cartTabs.style.display = 'flex';
                
                // Actualizar contadores de pestañas
                const individualCount = document.getElementById('individual-count');
                const comboCount = document.getElementById('combo-count');
                
                if (individualCount) {
                    individualCount.textContent = independentItems.length;
                }
                if (comboCount) {
                    comboCount.textContent = this.combinations.length;
                }
                
                // Cambiar a pestaña de combos automáticamente si no hay apuestas individuales
                if (independentItems.length === 0 && this.activeTab === 'individual') {
                    this.switchTab('combinations');
                }
                
                // Cambiar a pestaña individual automáticamente si no hay combos
                if (this.combinations.length === 0 && this.activeTab === 'combinations') {
                    this.switchTab('individual');
                }
                
                // Mostrar contenido según pestaña activa
                this.switchTab(this.activeTab);
            } else {
                // No hay combinaciones, ocultar pestañas y mostrar solo apuestas individuales
                cartTabs.style.display = 'none';
                this.activeTab = 'individual';
                
                const itemsContainer = document.getElementById('cart-items-container');
                const combinationsContainer = document.getElementById('cart-combinations-container');
                
                if (itemsContainer) itemsContainer.style.display = 'block';
                if (combinationsContainer) combinationsContainer.style.display = 'none';
            }
        }

        // Actualizar controles de combinación
        const combinationModeBtn = document.getElementById('combination-mode-btn');
        const createCombinationBtn = document.getElementById('create-combination-btn');
        const selectedCount = document.getElementById('selected-count');        if (combinationModeBtn) {
            combinationModeBtn.textContent = this.combinationMode ? '❌ Cancelar' : '🎲 Hacer Combo';
            combinationModeBtn.className = this.combinationMode ? 'combination-btn active' : 'combination-btn';
        }

        if (createCombinationBtn) {
            const selectedItemsCount = this.getSelectedItemsCount();
            createCombinationBtn.style.display = this.combinationMode && selectedItemsCount >= 2 ? 'block' : 'none';
        }

        if (selectedCount) {
            selectedCount.textContent = this.getSelectedItemsCount();
        }

        // Actualizar totales
        const individualTotal = this.getTotalAmount();
        const combinationTotal = this.getTotalCombinationAmount();
        const finalTotal = individualTotal + combinationTotal;

        document.getElementById('cart-total').textContent = individualTotal.toFixed(2);
        document.getElementById('cart-combination-total').textContent = combinationTotal.toFixed(2);
        document.getElementById('cart-final-total').textContent = finalTotal.toFixed(2);

        // Actualizar contador del ícono
        const cartCount = document.getElementById('cartCount');
        if (cartCount) {
            cartCount.textContent = this.getItemCount() + this.combinations.length;
        }
    }    generateWhatsAppMessage(encode = true) {
        const individualItems = this.items.filter(item => !item.combinationId);
        const hasCombinations = this.combinations.length > 0;
        
        if (individualItems.length === 0 && !hasCombinations) return '';

        // Verificar que todas las apuestas individuales tengan monto
        const invalidBets = individualItems.filter(item => !item.betAmount || item.betAmount <= 0);
        if (invalidBets.length > 0) {
            this.showNotification('Todas las apuestas individuales deben tener un monto válido', 'error');
            return '';
        }

        // Verificar que todas las combinaciones tengan monto
        const invalidCombinations = this.combinations.filter(combination => !combination.betAmount || combination.betAmount <= 0);
        if (invalidCombinations.length > 0) {
            this.showNotification('Todas las combinaciones deben tener un monto válido', 'error');
            return '';
        }

        const message = [
            '🎮 *NUEVA APUESTA - La Jugada Prohibida* 🎮\n'
        ];

        // Apuestas individuales
        if (individualItems.length > 0) {
            message.push('📝 *Apuestas Individuales:*\n');

            // Agrupar apuestas por liga
            const betsByLeague = {};
            individualItems.forEach(item => {
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
            });
        }

        // Combinaciones
        if (hasCombinations) {
            message.push('\n🔗 *Apuestas Combinadas:*\n');
            
            this.combinations.forEach((combination, index) => {
                message.push(`🎯 *Combinación ${index + 1} (${combination.items.length} apuestas):*`);
                
                combination.items.forEach(item => {
                    message.push(`   ⚽ ${item.local} vs ${item.visitante} - ${item.tipoLabel} @ ${item.cuota}`);
                });
                
                message.push(
                    `   🎲 Cuota combinada: ${combination.combinedOdds.toFixed(2)}`,
                    `   💰 Monto: $${combination.betAmount.toFixed(2)}`,
                    `   🏆 Ganancia potencial: $${(combination.betAmount * combination.combinedOdds).toFixed(2)}\n`
                );
            });
        }

        // Resumen
        const individualTotal = this.getTotalAmount();
        const combinationTotal = this.getTotalCombinationAmount();
        const finalTotal = individualTotal + combinationTotal;

        message.push(`\n📊 *Resumen:*`);
        
        if (individualItems.length > 0) {
            message.push(`• Apuestas individuales: $${individualTotal.toFixed(2)}`);
        }
        
        if (hasCombinations) {
            message.push(`• Apuestas combinadas: $${combinationTotal.toFixed(2)}`);
            message.push(`• Ganancia potencial combinaciones: $${this.getTotalCombinationWinnings().toFixed(2)}`);
        }
        
        message.push(`• *Total apostado: $${finalTotal.toFixed(2)}*`);

        return encode ? encodeURIComponent(message.join('\n')) : message.join('\n');
    }    previewMessage() {
        const message = this.generateWhatsAppMessage(false);
        if (!message) {
            this.showNotification('Agrega apuestas al carrito primero', 'error');
            return;
        }

        // Verificar que hay apuestas válidas
        const individualItems = this.items.filter(item => !item.combinationId);
        const totalItems = individualItems.length + this.combinations.length;
        
        if (totalItems === 0) {
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
                    ${message.replace(/\n/g, '<br>')}
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
                }                .preview-body {
                    padding: 20px;
                    overflow-y: auto;
                    max-height: calc(90vh - 60px);
                    color: white;
                    line-height: 1.5;
                    white-space: pre-wrap;
                }
                
                /* Responsive para modal de vista previa */
                @media (max-width: 768px) {
                    .preview-content {
                        width: 95%;
                        max-height: 95vh;
                        margin: 0 10px;
                    }
                    
                    .preview-header {
                        padding: 12px 15px;
                    }
                    
                    .preview-header h3 {
                        font-size: 1rem;
                    }
                    
                    .preview-close {
                        font-size: 20px;
                        padding: 5px;
                        min-width: 35px;
                        min-height: 35px;
                    }
                    
                    .preview-body {
                        padding: 15px;
                        font-size: 14px;
                        max-height: calc(95vh - 50px);
                    }
                }
                
                @media (max-width: 480px) {
                    .preview-content {
                        width: 100%;
                        height: 100%;
                        max-height: 100vh;
                        border-radius: 0;
                        margin: 0;
                    }
                    
                    .preview-header {
                        padding: 10px 15px;
                    }
                    
                    .preview-header h3 {
                        font-size: 0.9rem;
                    }
                    
                    .preview-body {
                        padding: 12px;
                        font-size: 13px;
                        max-height: calc(100vh - 45px);
                    }
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(modal);
    }async sendWhatsApp() {
        const message = this.generateWhatsAppMessage(true);
        if (!message) {
            return; // El mensaje de error ya se muestra en generateWhatsAppMessage
        }

        // Verificar que hay apuestas válidas
        const individualItems = this.items.filter(item => !item.combinationId);
        const totalItems = individualItems.length + this.combinations.length;
        
        if (totalItems === 0) {
            this.showNotification('Agrega apuestas al carrito primero', 'error');
            return;
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
