// Panel de administración
class AdminPanel {
    constructor() {
        this.isVisible = false;
        this.init();
    }

    // Funciones de utilidad para formato de hora
    convertTo12HourFormat(time24) {
        if (!time24) return '';
        const [hours, minutes] = time24.split(':');
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    }

    init() {
        this.createLoginModal();
        this.createAdminPanel();
    }    createLoginModal() {
        const modal = document.createElement('div');
        modal.id = 'admin-login-modal';
        modal.className = 'admin-modal';
        modal.style.display = 'none'; // Oculto por defecto
        modal.innerHTML = `
            <div class="admin-modal-content">
            <div class="admin-modal-header">
                <h3>🔐 Acceso de Administrador</h3>
            </div>
            <div class="admin-modal-body">
                <div style="display: flex; flex-direction: column; gap: 15px;">
                <input type="email" id="admin-email" placeholder="Email de administrador" class="admin-input">
                <input type="password" id="admin-password" placeholder="Contraseña" class="admin-input">
                </div>
                <div class="admin-actions">
                <button onclick="adminPanel.login()" class="admin-btn admin-btn-primary">Ingresar</button>
                <button onclick="adminPanel.closeLoginModal()" class="admin-btn admin-btn-secondary">Cancelar</button>
                </div>
                <div id="login-error" class="admin-error" style="display: none;">Error de autenticación</div>
            </div>
            </div>        `;

        document.body.appendChild(modal);
    }    createAdminPanel() {
        const panel = document.createElement('div');
        panel.id = 'admin-panel';
        panel.className = 'admin-panel';
        panel.innerHTML = `
            <div class="admin-panel-header">
                <h3>⚙️ Panel de Administración</h3>
                <div class="admin-panel-actions">
                    <button onclick="adminPanel.toggle()" class="admin-btn admin-btn-secondary">
                        <span id="admin-toggle-text">Minimizar</span>
                    </button>
                    <button onclick="adminPanel.logout()" class="admin-btn admin-btn-danger">Cerrar Sesión</button>
                </div>
            </div>            <div class="admin-panel-content">
                <div class="admin-section">
                    <h4>🏆 Gestión de Ligas</h4>
                    <div class="admin-form">
                        <div class="form-row">
                            <input type="text" id="new-liga-nombre" placeholder="Nombre de la Liga" class="admin-input">
                            <input type="text" id="new-liga-codigo" placeholder="Código (ej: ESP, NBA)" class="admin-input">
                            <input type="text" id="new-liga-icono" placeholder="Icono (emoji)" class="admin-input">
                        </div>
                        <button onclick="adminPanel.showCuotasTemplate()" class="admin-btn admin-btn-secondary" id="template-btn">
                            <i class="fas fa-cogs"></i> Crear Plantilla de Tipos
                        </button>                        
                        <button onclick="adminPanel.addLiga()" class="admin-btn admin-btn-success">Agregar Liga</button>
                        
                    </div>
                    <div id="admin-ligas-list" class="admin-ligas-list"></div>
                </div>                <div class="admin-section">
                    <h4>➕ Agregar Nuevo Partido</h4>
                    <div class="admin-form">
                        <div class="form-section">
                            <h5><i class="fas fa-info-circle"></i> Información Básica</h5>
                            <div class="form-row">
                                <div class="input-group">
                                    <label for="new-hora">⏰ Hora del partido</label>
                                    <input type="time" id="new-hora" class="admin-input" required>
                                </div>
                                <div class="input-group">
                                    <label for="new-liga-select">🏆 Liga</label>
                                    <select id="new-liga-select" class="admin-input" onchange="adminPanel.onNewLigaChange().catch(console.error)" required>
                                        <option value="">Seleccionar Liga</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="input-group">
                                    <label for="new-local">🏠 Equipo Local</label>
                                    <input type="text" id="new-local" placeholder="Nombre del equipo local" class="admin-input" required>
                                </div>
                                <div class="input-group">
                                    <label for="new-visitante">✈️ Equipo Visitante</label>
                                    <input type="text" id="new-visitante" placeholder="Nombre del equipo visitante" class="admin-input" required>
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-section" id="cuotas-section" style="display: none;">
                            <h5><i class="fas fa-money-bill-wave"></i> Cuotas de Apuesta</h5>
                            <div class="cuotas-help">
                                <i class="fas fa-lightbulb"></i>
                                Puedes usar la plantilla de la liga o ingresar cuotas manualmente
                            </div>                            <div class="form-row">
                                <button type="button" onclick="adminPanel.usarPlantillaCuotas().catch(console.error)" class="admin-btn admin-btn-primary">
                                    <i class="fas fa-clipboard-list"></i> Usar Plantilla de Liga
                                </button>
                                <button type="button" onclick="adminPanel.fillRandomOddsNew()" class="admin-btn admin-btn-warning" title="⚠️ Esto sobrescribirá la plantilla de liga">
                                    <i class="fas fa-dice"></i> Generar Aleatorias
                                </button>
                                <button type="button" onclick="adminPanel.clearNewOdds()" class="admin-btn admin-btn-secondary">
                                    <i class="fas fa-eraser"></i> Limpiar Todo
                                </button>
                            </div>
                            <div id="new-cuotas-grid" class="dynamic-cuotas-grid">
                                <!-- Las cuotas se generarán dinámicamente aquí -->
                            </div>
                        </div>
                        
                        <div class="form-actions">
                            <button onclick="adminPanel.addPartido()" class="admin-btn admin-btn-success">
                                <i class="fas fa-plus"></i> Agregar Partido
                            </button>
                            <button type="button" onclick="adminPanel.clearNewForm()" class="admin-btn admin-btn-secondary">
                                <i class="fas fa-times"></i> Limpiar Formulario
                            </button>
                        </div>
                    </div>
                </div>

                <div class="admin-section">
                    <h4>📊 Partidos Existentes</h4>
                    <div class="admin-form">
                        <select id="filter-liga" class="admin-input" onchange="adminPanel.filterPartidosByLiga()">
                            <option value="">Todas las Ligas</option>
                        </select>
                    </div>
                    <div id="admin-partidos-list" class="admin-partidos-list"></div>
                </div>                <div class="admin-section">
                    <h4>🎯 Gestión de Evento Principal</h4>
                    <div class="admin-form">
                        <div class="form-section">
                            <h5><i class="fas fa-edit"></i> Información del Evento</h5>
                            <div class="form-row">
                                <div class="input-group">
                                    <label for="event-titulo">📋 Título del Evento</label>
                                    <input type="text" id="event-titulo" placeholder="Ej: Evento Principal - Mayo 2025" class="admin-input">
                                </div>
                                <div class="input-group">
                                    <label for="event-descripcion">📝 Descripción</label>
                                    <input type="text" id="event-descripcion" placeholder="Ej: Las mejores cuotas para los partidos más emocionantes" class="admin-input">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="input-group">
                                    <label for="event-fecha">📅 Fecha del Evento</label>
                                    <input type="date" id="event-fecha-iso" class="admin-input">
                                </div>
                                <div class="input-group">
                                    <label for="event-fecha-texto">📅 Fecha (Texto Personalizado)</label>
                                    <input type="text" id="event-fecha-texto" placeholder="Ej: 24 de Mayo de 2025" class="admin-input">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="input-group">
                                    <label for="event-zona">⏰ Zona Horaria</label>
                                    <input type="text" id="event-zona" placeholder="Ej: UTC-5" class="admin-input">
                                </div>
                                <div class="input-group">
                                    <label for="event-whatsapp">📱 WhatsApp</label>
                                    <input type="text" id="event-whatsapp" placeholder="Ej: +1234567890" class="admin-input">
                                </div>
                            </div>
                            <div class="form-actions">
                                <button onclick="adminPanel.loadEventConfig().catch(console.error)" class="admin-btn admin-btn-secondary">
                                    <i class="fas fa-sync"></i> Cargar Configuración Actual
                                </button>
                                <button onclick="adminPanel.updateEventConfig().catch(console.error)" class="admin-btn admin-btn-primary">
                                    <i class="fas fa-save"></i> Guardar Configuración del Evento
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="admin-section">
                    <h4>💾 Gestión de Datos</h4>
                    <div class="admin-form">
                        <div class="form-row">
                            <button onclick="adminPanel.exportData()" class="admin-btn admin-btn-secondary">📤 Exportar Datos</button>
                            <input type="file" id="import-file" accept=".json" style="display: none;" onchange="adminPanel.importData(this.files[0])">
                            <button onclick="document.getElementById('import-file').click()" class="admin-btn admin-btn-secondary">📥 Importar Datos</button>
                        </div>
                        <div class="form-row">
                            <button onclick="adminPanel.clearAllData()" class="admin-btn admin-btn-danger">🗑️ Limpiar Todos los Datos</button>
                            <button onclick="adminPanel.resetToDefault()" class="admin-btn admin-btn-warning">🔄 Restaurar Datos por Defecto</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Agregar estilos del panel de administración
        const styles = document.createElement('style');
        styles.textContent = `
            .admin-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.8);
                z-index: 2000;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .admin-modal-content {
                background: #1e1e1e;
                border-radius: 8px;
                min-width: 400px;
                max-width: 90vw;
            }

            .admin-modal-header {
                background: #ff6b00;
                color: white;
                padding: 20px;
                border-radius: 8px 8px 0 0;
                text-align: center;
            }

            .admin-modal-header h3 {
                margin: 0;
            }

            .admin-modal-body {
                padding: 30px;
            }

            .admin-panel {
                position: fixed;
                top: 100px;
                left: 20px;
                width: calc(100% - 40px);
                max-width: 800px;
                background: #1e1e1e;
                border: 2px solid #ff6b00;
                border-radius: 8px;
                z-index: 1500;
                display: none;
                max-height: 80vh;
                overflow-y: auto;
            }

            .admin-panel.visible {
                display: block;
            }

            .admin-panel.minimized .admin-panel-content {
                display: none;
            }

            .admin-panel-header {
                background: #ff6b00;
                color: white;
                padding: 15px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .admin-panel-header h3 {
                margin: 0;
            }

            .admin-panel-actions {
                display: flex;
                gap: 10px;
            }

            .admin-panel-content {
                padding: 20px;
            }

            .admin-section {
                margin-bottom: 30px;
                padding: 20px;
                background: #2a2a2a;
                border-radius: 6px;
            }

            .admin-section h4 {
                margin: 0 0 15px 0;
                color: #ff6b00;
            }

            .admin-form {
                display: flex;
                flex-direction: column;
                gap: 15px;
            }

            .form-row {
                display: flex;
                gap: 15px;
            }

            .cuotas-grid {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                gap: 10px;
            }

            .admin-input {
                background: #333;
                border: 1px solid #555;
                color: white;
                padding: 10px;
                border-radius: 4px;
                font-size: 14px;
            }

            .admin-input:focus {
                border-color: #ff6b00;
                outline: none;
            }

            .cuota-input {
                text-align: center;
                font-size: 12px;
                padding: 8px 4px;
            }

            .admin-btn {
                padding: 10px 20px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-weight: bold;
                font-size: 14px;
            }

            .admin-btn-primary {
                background: #ff6b00;
                color: white;
            }

            .admin-btn-secondary {
                background: #666;
                color: white;
            }

            .admin-btn-success {
                background: #28a745;
                color: white;
            }            .admin-btn-danger {
                background: #dc3545;
                color: white;
            }

            .admin-btn-warning {
                background: #ffc107;
                color: #212529;
            }

            .admin-btn:hover {
                opacity: 0.9;
                transform: translateY(-1px);
            }

            .admin-actions {
                display: flex;
                gap: 15px;
                margin-top: 20px;
            }

            .admin-error {
                color: #dc3545;
                margin-top: 10px;
                text-align: center;
            }            .admin-partidos-list {
                max-height: 300px;
                overflow-y: auto;
            }

            .admin-ligas-list {
                max-height: 200px;
                overflow-y: auto;
                margin-top: 15px;
            }

            .admin-liga-item {
                background: #333;
                padding: 12px;
                margin-bottom: 8px;
                border-radius: 6px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-left: 4px solid #ff6b00;
            }

            .admin-liga-info {
                color: white;
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .admin-liga-icon {
                font-size: 20px;
            }

            .admin-liga-details {
                display: flex;
                flex-direction: column;
            }

            .admin-liga-nombre {
                font-weight: bold;
                margin-bottom: 2px;
            }

            .admin-liga-codigo {
                font-size: 12px;
                color: #ccc;
            }

            .admin-partido-item {
                background: #333;
                padding: 15px;
                margin-bottom: 10px;
                border-radius: 6px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .admin-partido-info {
                color: white;
            }

            .admin-partido-actions {
                display: flex;
                gap: 10px;
            }            .admin-btn-small {
                padding: 5px 10px;
                font-size: 12px;
            }

            .edit-modal {
                min-width: 600px;
                max-width: 90vw;
                max-height: 80vh;
                overflow-y: auto;
            }

            .admin-close-btn {
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
                border-radius: 50%;
            }

            .admin-close-btn:hover {
                background: rgba(255,255,255,0.1);
            }            /* Estilos para las nuevas secciones del formulario */
            .form-section {
                background: #383838;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 20px;
                border-left: 4px solid #ff6b00;
            }

            .form-section h5 {
                margin: 0 0 15px 0;
                color: #ff6b00;
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 16px;
            }

            .input-group {
                display: flex;
                flex-direction: column;
                gap: 5px;
                flex: 1;
            }

            .input-group label {
                color: #ccc;
                font-size: 14px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 5px;
            }

            .form-actions {
                display: flex;
                gap: 15px;
                justify-content: flex-end;
                padding: 20px 0;
                border-top: 1px solid #444;
                margin-top: 20px;
            }

            .cuotas-help {
                background: rgba(255, 107, 0, 0.1);
                border: 1px solid rgba(255, 107, 0, 0.3);
                border-radius: 6px;
                padding: 12px;
                margin-bottom: 20px;
                color: #ff6b00;
                font-size: 14px;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .dynamic-cuotas-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin-top: 15px;
            }

            .cuota-input-group {
                background: #2a2a2a;
                padding: 15px;
                border-radius: 6px;
                border: 1px solid #444;
                transition: all 0.3s ease;
            }

            .cuota-input-group:hover {
                border-color: #ff6b00;
                background: #323232;
            }

            .cuota-label {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 8px;
                color: #ccc;
                font-size: 14px;
                font-weight: 600;
            }

            .cuota-tipo {
                color: #ff6b00;
                font-weight: bold;
            }

            .custom-badge {
                background: #28a745;
                color: white;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 10px;
                font-weight: bold;
                text-transform: uppercase;
            }

            .cuota-input {
                width: 100%;
                background: #333;
                border: 1px solid #555;
                color: white;
                padding: 10px;
                border-radius: 4px;
                font-size: 16px;
                text-align: center;
                font-weight: bold;
            }

            .cuota-input:focus {
                border-color: #ff6b00;
                outline: none;
                box-shadow: 0 0 0 2px rgba(255, 107, 0, 0.2);
            }

            .no-cuotas {
                text-align: center;
                color: #888;
                font-style: italic;
                padding: 20px;
            }

            .success-message, .warning-message, .info-message {
                padding: 10px 15px;
                border-radius: 6px;
                margin: 10px 0;
                display: flex;
                align-items: center;
                gap: 8px;
                font-weight: 600;
                animation: fadeInOut 3s ease-in-out;
            }

            .success-message {
                background: rgba(40, 167, 69, 0.2);
                border: 1px solid #28a745;
                color: #28a745;
            }

            .warning-message {
                background: rgba(255, 193, 7, 0.2);
                border: 1px solid #ffc107;
                color: #ffc107;
            }

            .info-message {
                background: rgba(0, 123, 255, 0.2);
                border: 1px solid #007bff;
                color: #007bff;
            }

            @keyframes fadeInOut {
                0% { opacity: 0; transform: translateY(-10px); }
                20% { opacity: 1; transform: translateY(0); }
                80% { opacity: 1; transform: translateY(0); }
                100% { opacity: 0; transform: translateY(-10px); }
            }

            @media (max-width: 768px) {
                .admin-panel {
                    top: 10px;
                    left: 10px;
                    width: calc(100% - 20px);
                    max-height: 90vh;
                }

                .cuotas-grid {
                    grid-template-columns: repeat(3, 1fr);
                }

                .form-row {
                    flex-direction: column;
                }

                .dynamic-cuotas-grid {
                    grid-template-columns: 1fr;
                }

                .form-actions {
                    flex-direction: column;
                    gap: 10px;
                }
            }
        `;        document.head.appendChild(styles);
        document.body.appendChild(panel);
    }

    showLoginModal() {
        document.getElementById('admin-login-modal').style.display = 'flex';
    }    closeLoginModal() {
        document.getElementById('admin-login-modal').style.display = 'none';
        document.getElementById('admin-email').value = '';
        document.getElementById('admin-password').value = '';
        document.getElementById('login-error').style.display = 'none';
    }async login() {
        try {
            // Desactivar el botón de login mientras se procesa
            const loginButton = document.querySelector('.admin-btn-primary');
            if (loginButton) loginButton.disabled = true;

            const email = document.getElementById('admin-email').value;
            const password = document.getElementById('admin-password').value;
            
            if (!email || !password) {
                this.showError('Por favor ingresa email y contraseña');
                return;
            }

            // Intentar hacer login
            const success = await dataManager.adminLogin(email, password);
            
            if (success) {
                // Cerrar el modal primero
                this.closeLoginModal();
                document.getElementById('admin-email').value = '';
                document.getElementById('admin-password').value = '';
                
                // Mostrar el panel de administración
                await this.showAdminPanel();
            } else {
                this.showError('Credenciales incorrectas o usuario sin permisos de administrador');
            }
        } catch (error) {
            console.error('Error en login:', error);
            this.showError('Error de autenticación: ' + error.message);
        } finally {
            // Re-habilitar el botón de login
            const loginButton = document.querySelector('.admin-btn-primary');
            if (loginButton) loginButton.disabled = false;
        }
    }

    showError(message) {
        const errorElement = document.getElementById('login-error');
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    logout() {
        dataManager.adminLogout();
        this.hideAdminPanel();
    }    async showAdminPanel() {
        try {
            // Asegurarse de que el usuario está autenticado
            if (!dataManager.isAuthenticated) {
                console.error('Intento de mostrar panel sin autenticación');
                return;
            }

            // Mostrar el panel
            const panel = document.getElementById('admin-panel');
            panel.classList.add('visible');
            panel.classList.remove('minimized');
            this.isVisible = true;
            
            // Actualizar texto del botón de minimizar
            const toggleText = document.getElementById('admin-toggle-text');
            if (toggleText) toggleText.textContent = 'Minimizar';            // Cargar los datos
            await this.loadCurrentData();
            await this.loadEventConfig(true); // Cargar configuración del evento automáticamente sin alerta
            await this.updatePartidosList();
        } catch (error) {
            console.error('Error mostrando el panel de administración:', error);
            this.hideAdminPanel();
        }
    }

    hideAdminPanel() {
        document.getElementById('admin-panel').classList.remove('visible');
        this.isVisible = false;
    }

    toggle() {
        const panel = document.getElementById('admin-panel');
        const toggleText = document.getElementById('admin-toggle-text');
        
        panel.classList.toggle('minimized');
        toggleText.textContent = panel.classList.contains('minimized') ? 'Expandir' : 'Minimizar';
    }    async loadCurrentData() {
        try {
            // Cargar datos de ligas y partidos
            await this.updateLigasSelect();
            await this.updateLigasList();
            await this.updateFilterSelect();
        } catch (error) {
            console.error('Error cargando datos:', error);
        }
    }
    async addPartido() {
        const hora = document.getElementById('new-hora').value;
        const ligaId = document.getElementById('new-liga-select').value;
        const local = document.getElementById('new-local').value.trim();
        const visitante = document.getElementById('new-visitante').value.trim();

        // Validaciones básicas
        if (!hora) {
            alert('❌ Error: Debes seleccionar una hora para el partido');
            return;
        }

        if (!ligaId) {
            alert('❌ Error: Debes seleccionar una liga');
            return;
        }

        if (!local) {
            alert('❌ Error: Debes ingresar el nombre del equipo local');
            return;
        }

        if (!visitante) {
            alert('❌ Error: Debes ingresar el nombre del equipo visitante');
            return;
        }

        // Validar que los equipos no sean iguales
        if (local.toLowerCase() === visitante.toLowerCase()) {
            alert('❌ Error: El equipo local y visitante no pueden ser iguales');
            return;
        }

        try {
            const liga = await dataManager.getLigaById(ligaId);
            if (!liga) {
                alert('❌ Error: Liga no encontrada');
                return;
            }

            // Recopilar cuotas dinámicas
            const cuotas = {};
            let hasValidOdds = false;            if (liga.tiposApuesta && liga.tiposApuesta.length > 0) {
                for (const tipo of liga.tiposApuesta) {
                    const input = document.getElementById(`new-cuota-${tipo.id}`);
                    if (input && input.value) {
                        const cuotaValue = parseFloat(input.value);
                        if (cuotaValue >= 1.01) {
                            // Aplicar descuento del 5% automáticamente
                            const cuotaConDescuento = cuotaValue * 0.95; // 5% de descuento
                            cuotas[tipo.id] = Math.round(cuotaConDescuento * 100) / 100; // Redondear a 2 decimales
                            hasValidOdds = true;
                        }
                    }
                }
            }

            if (!hasValidOdds) {
                alert('❌ Error: Debes ingresar al menos una cuota válida (mayor a 1.01)');
                return;
            }

            // Crear el objeto partido
            const partido = {
                hora: hora,
                liga: ligaId,
                local: local,
                visitante: visitante,
                cuotas: cuotas,
                fechaCreacion: new Date().toISOString()
            };

            // Agregar el partido
            await dataManager.addPartido(partido);
              
            // Limpiar formulario
            this.clearNewForm();
            
            // Actualizar la lista de partidos
            await this.updatePartidosList();
              // Actualizar la tabla principal si existe
            if (typeof updateTableFromData === 'function') {
                const partidos = await dataManager.getPartidos();
                updateTableFromData(partidos);
            }
            
            alert(`✅ Partido agregado exitosamente!\n${local} vs ${visitante}\nLiga: ${liga.nombre}\nHora: ${hora}`);
            
        } catch (error) {
            console.error('Error al agregar partido:', error);
            alert('❌ Error al agregar el partido: ' + error.message);
        }
    }    // Manejar cambio de liga en formulario de creación
    async onNewLigaChange() {
        const ligaId = document.getElementById('new-liga-select').value;
        const cuotasSection = document.getElementById('cuotas-section');
        
        if (ligaId) {
            cuotasSection.style.display = 'block';
            await this.generateNewCuotasInputs(ligaId);
        } else {
            cuotasSection.style.display = 'none';
        }
    }// Generar inputs dinámicos de cuotas para nuevo partido
    async generateNewCuotasInputs(ligaId) {
        try {
            const liga = await dataManager.getLigaById(ligaId);
            const container = document.getElementById('new-cuotas-grid');
            
            if (!liga || !liga.tiposApuesta) {
                container.innerHTML = '<p class="no-cuotas">No hay tipos de apuesta definidos para esta liga</p>';
                return;
            }

            let html = '';
            
            liga.tiposApuesta.forEach(tipo => {
                html += `
                    <div class="cuota-input-group">
                        <label for="new-cuota-${tipo.id}" class="cuota-label">
                            <span class="cuota-tipo">${tipo.label}</span>
                            ${tipo.custom ? '<span class="custom-badge">Custom</span>' : ''}
                        </label>
                        <input 
                            type="number" 
                            id="new-cuota-${tipo.id}" 
                            class="cuota-input" 
                            placeholder="0.00" 
                            step="0.01" 
                            min="1.01"
                            data-tipo-id="${tipo.id}"
                        >
                    </div>
                `;
            });

            container.innerHTML = html;
        } catch (error) {
            console.error('Error generando inputs de cuotas:', error);
        }
    }    // Llenar cuotas aleatorias realistas para nuevo partido
    async fillRandomOddsNew() {
        const ligaId = document.getElementById('new-liga-select').value;
        if (!ligaId) {
            alert('❌ Primero selecciona una liga');
            return;
        }

        // Verificar si ya hay valores en los inputs
        const container = document.getElementById('new-cuotas-grid');
        const inputs = container.querySelectorAll('input[type="number"]');
        let hasValues = false;
        inputs.forEach(input => {
            if (input.value && input.value.trim() !== '') {
                hasValues = true;
            }
        });

        // Confirmar si hay valores existentes
        if (hasValues) {
            const confirmed = confirm(
                '⚠️ YA HAY CUOTAS INGRESADAS\n\n' +
                'Esto sobrescribirá todas las cuotas actuales (incluyendo la plantilla de liga).\n\n' +
                '¿Estás seguro de que quieres generar cuotas aleatorias?'
            );
            if (!confirmed) {
                return;
            }
        }

        try {
            const liga = await dataManager.getLigaById(ligaId);
            if (!liga || !liga.tiposApuesta) {
                alert('❌ Liga no tiene tipos de apuesta definidos');
                return;
            }

            liga.tiposApuesta.forEach(tipo => {
                const input = document.getElementById(`new-cuota-${tipo.id}`);
                if (input) {
                    let randomOdd;
                    
                    // Generar cuotas realistas según el tipo
                    switch(tipo.id) {
                        case '1':
                        case '2':
                            randomOdd = (Math.random() * 4 + 1.5).toFixed(2); // 1.50 - 5.50
                            break;
                        case 'X':
                            randomOdd = (Math.random() * 2 + 2.8).toFixed(2); // 2.80 - 4.80
                            break;
                        case 'O2.5':
                        case 'U2.5':
                            randomOdd = (Math.random() * 1.5 + 1.6).toFixed(2); // 1.60 - 3.10
                            break;
                        case 'G':
                        case 'NG':
                            randomOdd = (Math.random() * 1.8 + 1.4).toFixed(2); // 1.40 - 3.20
                            break;
                        default:
                            randomOdd = (Math.random() * 3 + 1.5).toFixed(2); // 1.50 - 4.50
                    }
                    
                    input.value = randomOdd;
                }
            });

            // Mostrar mensaje de advertencia
            const message = document.createElement('div');
            message.className = 'warning-message';
            message.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Cuotas aleatorias generadas (plantilla sobrescrita)';
            container.appendChild(message);
            
            setTimeout(() => {
                if (message.parentNode) {
                    message.parentNode.removeChild(message);
                }
            }, 4000);
        } catch (error) {
            console.error('Error generando cuotas aleatorias:', error);
            alert('❌ Error al generar cuotas aleatorias: ' + error.message);
        }
    }// Limpiar todas las cuotas del formulario nuevo
    async clearNewOdds() {
        const ligaId = document.getElementById('new-liga-select').value;
        if (!ligaId) {
            return;
        }

        try {
            const liga = await dataManager.getLigaById(ligaId);
            if (!liga || !liga.tiposApuesta) {
                return;
            }

            liga.tiposApuesta.forEach(tipo => {
                const input = document.getElementById(`new-cuota-${tipo.id}`);
                if (input) {
                    input.value = '';
                }
            });

            // Mostrar mensaje
            const container = document.getElementById('new-cuotas-grid');
            const message = document.createElement('div');
            message.className = 'warning-message';
            message.innerHTML = '<i class="fas fa-eraser"></i> Cuotas limpiadas';
            container.appendChild(message);
            
            setTimeout(() => {
                if (message.parentNode) {
                    message.parentNode.removeChild(message);
                }
            }, 2000);
        } catch (error) {
            console.error('Error limpiando cuotas:', error);
        }
    }

    // Limpiar completamente el formulario de nuevo partido
    clearNewForm() {
        document.getElementById('new-hora').value = '';
        document.getElementById('new-liga-select').value = '';
        document.getElementById('new-local').value = '';
        document.getElementById('new-visitante').value = '';
        
        // Ocultar sección de cuotas
        document.getElementById('cuotas-section').style.display = 'none';
        
        // Limpiar container de cuotas
        document.getElementById('new-cuotas-grid').innerHTML = '';

        // Mostrar mensaje de confirmación
        const form = document.querySelector('.admin-form');
        const message = document.createElement('div');
        message.className = 'info-message';
        message.innerHTML = '<i class="fas fa-broom"></i> Formulario limpiado';
        message.style.textAlign = 'center';
        message.style.margin = '10px 0';
        form.appendChild(message);
        
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 2000);
    }    // Usar plantilla de cuotas de la liga seleccionada
    async usarPlantillaCuotas() {
        try {
            const ligaId = document.getElementById('new-liga-select').value;
            if (!ligaId) {
                alert('❌ Primero selecciona una liga');
                return;
            }

            const liga = await dataManager.getLigaById(ligaId);
            if (!liga || !liga.plantillaCuotas) {
                alert('❌ La liga no tiene plantilla de cuotas');
                return;
            }

            liga.tiposApuesta.forEach(tipo => {
                const input = document.getElementById(`new-cuota-${tipo.id}`);
                const valor = parseFloat(liga.plantillaCuotas[tipo.id]);
                if (input && !isNaN(valor) && valor >= 1.01) {
                    input.value = valor.toFixed(2);
                }
            });

            const message = document.createElement('div');
            message.className = 'success-message';
            message.innerHTML = '<i class="fas fa-check-circle"></i> Plantilla aplicada';
            document.getElementById('new-cuotas-grid').appendChild(message);
            setTimeout(() => message.remove(), 3000);

        } catch (error) {
            console.error('Error al aplicar plantilla:', error);
            alert('❌ Error: ' + error.message);
        }
    }    async updatePartidosList(ligaId = null) {
        try {
            const partidos = ligaId ? await dataManager.getPartidosByLiga(ligaId) : await dataManager.getPartidos();
            const container = document.getElementById('admin-partidos-list');
            
            if (partidos.length === 0) {
                container.innerHTML = '<p style="color: #ccc; text-align: center;">No hay partidos para mostrar</p>';
                return;
            }

            container.innerHTML = partidos.map(partido => {
                const ligaDisplay = partido.ligas ? `${partido.ligas.icono} ${partido.ligas.nombre}` : (partido.liga || 'Sin Liga');
                
                return `
                    <div class="admin-partido-item">                        <div class="admin-partido-info">
                            <strong>${this.convertTo12HourFormat(partido.hora)} - ${ligaDisplay}</strong><br>
                            ${partido.local} vs ${partido.visitante}
                        </div>
                        <div class="admin-partido-actions">
                            <button onclick="adminPanel.editPartido('${partido.id}')" class="admin-btn admin-btn-primary admin-btn-small">Editar</button>
                            <button onclick="adminPanel.duplicatePartido('${partido.id}').catch(console.error)" class="admin-btn admin-btn-secondary admin-btn-small">Duplicar</button>
                            <button onclick="adminPanel.deletePartido('${partido.id}')" class="admin-btn admin-btn-danger admin-btn-small">Eliminar</button>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Error actualizando lista de partidos:', error);
        }
    }    async deletePartido(id) {
        if (confirm('¿Estás seguro de que quieres eliminar este partido?')) {
            try {
                await dataManager.deletePartido(id);
                await this.updatePartidosList();
                this.updateMainTable();
                alert('Partido eliminado exitosamente');
            } catch (error) {
                console.error('Error eliminando partido:', error);
                alert('Error al eliminar el partido: ' + error.message);
            }
        }
    }    async editPartido(id) {
        try {
            const partidos = await dataManager.getPartidos();
            const partido = partidos.find(p => p.id === id);
            
            if (!partido) {
                alert('Partido no encontrado');
                return;
            }

            // Crear modal de edición
            await this.createEditModal(partido);
        } catch (error) {
            console.error('Error editando partido:', error);
            alert('Error al cargar el partido: ' + error.message);
        }
    }    async createEditModal(partido) {
        try {
            // Remover modal existente si existe
            const existingModal = document.getElementById('edit-partido-modal');
            if (existingModal) {
                existingModal.remove();
            }

            // Obtener la liga del partido para mostrar solo sus tipos de apuesta
            const ligas = await dataManager.getLigas();
            const ligaData = ligas.find(l => l.id === partido.liga);
            
            const modal = document.createElement('div');
            modal.id = 'edit-partido-modal';
            modal.className = 'admin-modal';
            modal.innerHTML = `
                <div class="admin-modal-content edit-modal">
                    <div class="admin-modal-header">
                        <h3>✏️ Editar Partido - ${ligaData ? ligaData.nombre : 'Liga Desconocida'}</h3>
                        <button class="admin-close-btn" onclick="adminPanel.closeEditModal()">×</button>
                    </div>
                    <div class="admin-modal-body">
                        <div class="admin-form">
                            <!-- Información básica del partido -->
                            <div class="edit-section">
                                <h4><i class="fas fa-info-circle"></i> Información del Partido</h4>
                                <div class="form-row">
                                    <div class="input-group">
                                        <label for="edit-hora">⏰ Hora del partido</label>
                                        <input type="time" id="edit-hora" value="${partido.hora}" class="admin-input" required>
                                    </div>
                                    <div class="input-group">
                                        <label for="edit-liga-select">🏆 Liga</label>
                                        <select id="edit-liga-select" class="admin-input" onchange="adminPanel.onEditLigaChange().catch(console.error)">>
                                            ${await this.generateLigaOptions(partido.liga)}
                                        </select>
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="input-group">
                                        <label for="edit-local">🏠 Equipo Local</label>
                                        <input type="text" id="edit-local" value="${partido.local}" class="admin-input" placeholder="Nombre del equipo local" required>
                                    </div>
                                    <div class="input-group">
                                        <label for="edit-visitante">✈️ Equipo Visitante</label>
                                        <input type="text" id="edit-visitante" value="${partido.visitante}" class="admin-input" placeholder="Nombre del equipo visitante" required>
                                    </div>
                                </div>
                            </div>

                            <!-- Cuotas dinámicas según la liga -->
                            <div class="edit-section">
                                <h4><i class="fas fa-money-bill-wave"></i> Cuotas de Apuesta</h4>
                                <div class="cuotas-notice">
                                    <i class="fas fa-info-circle"></i>
                                    Las cuotas mostradas corresponden a los tipos de apuesta de <strong>${ligaData ? ligaData.nombre : 'esta liga'}</strong>
                                </div>
                                <div id="dynamic-cuotas-grid" class="dynamic-cuotas-grid">
                                    ${this.generateDynamicCuotasInputs(partido, ligaData)}
                                </div>
                                <div class="cuotas-actions">
                                    <button onclick="adminPanel.fillSampleOdds()" class="admin-btn admin-btn-secondary admin-btn-small">
                                        <i class="fas fa-magic"></i> Llenar con valores de ejemplo
                                    </button>
                                    <button onclick="adminPanel.clearAllOdds()" class="admin-btn admin-btn-warning admin-btn-small">
                                        <i class="fas fa-eraser"></i> Limpiar todas las cuotas
                                    </button>
                                </div>
                            </div>

                            <div class="admin-actions">
                                <button onclick="adminPanel.saveEditedPartido(${partido.id})" class="admin-btn admin-btn-success">
                                    <i class="fas fa-save"></i> Guardar Cambios
                                </button>
                                <button onclick="adminPanel.closeEditModal()" class="admin-btn admin-btn-secondary">
                                    <i class="fas fa-times"></i> Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            this.addEditModalStyles();
        } catch (error) {
            console.error('Error creando modal de edición:', error);
            alert('❌ Error al abrir editor de partido');
        }
    }async saveEditedPartido(id) {
        try {
            const ligaId = document.getElementById('edit-liga-select').value;
            const ligas = await dataManager.getLigas();
            const ligaData = ligas.find(l => l.id === ligaId);
            
            if (!ligaData) {
                alert('Liga no válida');
                return;
            }

            // Validar campos requeridos
            const hora = document.getElementById('edit-hora').value;
            const local = document.getElementById('edit-local').value;
            const visitante = document.getElementById('edit-visitante').value;

            if (!hora || !local || !visitante) {
                alert('Por favor completa todos los campos requeridos (hora, equipo local y visitante)');
                return;
            }

            if (local.trim() === visitante.trim()) {
                alert('El equipo local y visitante no pueden ser iguales');
                return;
            }

            // Recopilar cuotas dinámicamente según los tipos de apuesta de la liga
            const cuotas = {};
            let hasValidOdds = false;

            ligaData.tiposApuesta.forEach(tipo => {
                const input = document.getElementById(`edit-${tipo.id}`);
                if (input) {
                    const value = parseFloat(input.value);
                    if (!isNaN(value) && value > 0) {
                        cuotas[tipo.id] = value;
                        hasValidOdds = true;
                    } else {
                        cuotas[tipo.id] = 0;
                    }
                }
            });

            if (!hasValidOdds) {
                if (!confirm('No se han ingresado cuotas válidas. ¿Deseas continuar sin cuotas?')) {
                    return;
                }
            }

            const partidoActualizado = {
                hora: hora,
                liga: ligaId,
                local: local.trim(),
                visitante: visitante.trim(),
                cuotas: cuotas
            };

            await dataManager.updatePartido(id, partidoActualizado);
            this.closeEditModal();
            this.updatePartidosList();
            this.updateMainTable();
            
            alert('Partido actualizado exitosamente');
        } catch (error) {
            console.error('Error al guardar partido editado:', error);
            alert('❌ Error al guardar partido editado');
        }
    }    async generateLigaOptions(selectedLigaId) {
        try {
            const ligas = await dataManager.getLigas();
            return ligas.map(liga => 
                `<option value="${liga.id}" ${liga.id === selectedLigaId ? 'selected' : ''}>
                    ${liga.icono} ${liga.nombre}
                </option>` 
            ).join('');
        } catch (error) {
            console.error('Error generando opciones de liga:', error);
            return '<option value="">Error cargando ligas</option>';
        }
    }

    generateDynamicCuotasInputs(partido, ligaData) {
        if (!ligaData || !ligaData.tiposApuesta) {
            return '<p class="error-message">No se pudieron cargar los tipos de apuesta para esta liga</p>';
        }

        return ligaData.tiposApuesta.map(tipo => `
            <div class="cuota-input-group">
                <label for="edit-${tipo.id}" class="cuota-label">
                    <span class="cuota-type">${tipo.id}</span>
                    <span class="cuota-description">${tipo.label}</span>
                </label>
                <input type="number" 
                       id="edit-${tipo.id}" 
                       value="${partido.cuotas[tipo.id] || ''}" 
                       placeholder="1.00" 
                       step="0.01" 
                       min="1.01"
                       class="admin-input cuota-input">
            </div>
        `).join('');
    }    async onEditLigaChange() {
        try {
            const ligaId = document.getElementById('edit-liga-select').value;
            const ligas = await dataManager.getLigas();
            const ligaData = ligas.find(l => l.id === ligaId);
            
            if (!ligaData) return;

            // Actualizar las cuotas dinámicamente
            const cuotasGrid = document.getElementById('dynamic-cuotas-grid');
            const currentValues = {};
            
            // Guardar valores actuales antes de regenerar
            ligaData.tiposApuesta.forEach(tipo => {
                const input = document.getElementById(`edit-${tipo.id}`);
                if (input) {
                    currentValues[tipo.id] = input.value;
                }
            });

            // Crear objeto temporal con los valores actuales
            const tempPartido = { cuotas: currentValues };
            
            // Regenerar el grid con los nuevos tipos de apuesta
            cuotasGrid.innerHTML = this.generateDynamicCuotasInputs(tempPartido, ligaData);
            
            // Actualizar la descripción de la liga
            const cuotasNotice = document.querySelector('.cuotas-notice strong');
            if (cuotasNotice) {
                cuotasNotice.textContent = ligaData.nombre;
            }
        } catch (error) {
            console.error('Error al cambiar liga en edición:', error);
            alert('❌ Error al cambiar liga');
        }
    }    async fillSampleOdds() {
        try {
            const ligaId = document.getElementById('edit-liga-select').value;
            const ligas = await dataManager.getLigas();
            const ligaData = ligas.find(l => l.id === ligaId);
            
            if (!ligaData) return;

            ligaData.tiposApuesta.forEach(tipo => {
                const input = document.getElementById(`edit-${tipo.id}`);
                if (input) {
                    // Generar cuotas aleatorias realistas
                    let sampleValue;
                    if (tipo.id.includes('U') || tipo.id.includes('O')) {
                        sampleValue = (Math.random() * 1.5 + 1.6).toFixed(2); // 1.60 - 3.10
                    } else if (tipo.id === 'X') {
                        sampleValue = (Math.random() * 1.5 + 2.8).toFixed(2); // 2.80 - 4.30
                    } else {
                        sampleValue = (Math.random() * 3 + 1.5).toFixed(2); // 1.50 - 4.50
                    }
                    input.value = sampleValue;
                }
            });
        } catch (error) {
            console.error('Error al llenar cuotas de ejemplo:', error);
            alert('❌ Error al llenar cuotas de ejemplo');
        }
    }    async clearAllOdds() {
        try {
            const ligaId = document.getElementById('edit-liga-select').value;
            const ligas = await dataManager.getLigas();
            const ligaData = ligas.find(l => l.id === ligaId);
            
            if (!ligaData) return;

            if (confirm('¿Estás seguro de que quieres limpiar todas las cuotas?')) {
                ligaData.tiposApuesta.forEach(tipo => {
                    const input = document.getElementById(`edit-${tipo.id}`);
                    if (input) {
                        input.value = '';
                    }
                });
            }
        } catch (error) {
            console.error('Error al limpiar cuotas:', error);
            alert('❌ Error al limpiar cuotas');
        }
    }    addEditModalStyles() {
        if (document.getElementById('edit-modal-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'edit-modal-styles';
        styles.textContent = `
            .edit-modal {
                max-width: 800px;
                max-height: 90vh;
                overflow-y: auto;
            }

            .edit-section {
                background: rgba(255, 255, 255, 0.02);
                border-radius: 8px;
                padding: 1.5rem;
                margin-bottom: 1.5rem;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .edit-section h4 {
                color: var(--primary-color);
                margin-bottom: 1rem;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .form-row {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
                margin-bottom: 1rem;
            }

            .input-group {
                display: flex;
                flex-direction: column;
                gap: 5px;
            }

            .input-group label {
                color: var(--text-secondary);
                font-size: 0.9rem;
                font-weight: 600;
            }

            .dynamic-cuotas-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 1rem;
                margin-bottom: 1rem;
            }

            .cuota-input-group {
                background: rgba(255, 255, 255, 0.03);
                border-radius: 6px;
                padding: 1rem;
                border: 1px solid rgba(255, 255, 255, 0.1);
                transition: all 0.3s ease;
            }

            .cuota-input-group:hover {
                background: rgba(255, 255, 255, 0.05);
                border-color: var(--primary-color);
            }

            .cuota-label {
                display: block;
                margin-bottom: 8px;
                cursor: pointer;
            }

            .cuota-tipo {
                display: inline-block;
                background: var(--primary-color);
                color: white;
                padding: 2px 8px;
                border-radius: 4px;
                font-weight: bold;
                font-size: 0.8rem;
                margin-bottom: 4px;
            }

            .cuota-desc {
                display: block;
                color: var(--text-secondary);
                font-size: 0.85rem;
                font-weight: normal;
            }

            .cuota-input {
                margin-top: 5px;
            }

            .cuotas-notice {
                background: rgba(0, 212, 170, 0.1);
                border: 1px solid var(--secondary-color);
                border-radius: 6px;
                padding: 12px;
                margin-bottom: 1rem;
                color: var(--secondary-color);
                font-size: 0.9rem;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .cuotas-actions {
                display: flex;
                gap: 10px;
                margin-top: 1rem;
                flex-wrap: wrap;
            }

            .admin-btn-small {
                padding: 8px 12px;
                font-size: 0.85rem;
            }

            .success-message, .warning-message {
                background: var(--success-color);
                color: white;
                padding: 10px 15px;
                border-radius: 6px;
                margin: 10px 0;
                display: flex;
                align-items: center;
                gap: 8px;
                animation: slideIn 0.3s ease;
            }

            .warning-message {
                background: var(--warning-color);
                color: #333;
            }

            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            @media (max-width: 768px) {
                .edit-modal {
                    max-width: 95vw;
                    margin: 2% auto;
                }

                .dynamic-cuotas-grid {
                    grid-template-columns: 1fr;
                }

                .cuotas-actions {
                    flex-direction: column;
                }

                .form-row {
                    grid-template-columns: 1fr;
                }
            }
        `;

        document.head.appendChild(styles);
    }

    closeEditModal() {
        const modal = document.getElementById('edit-partido-modal');
        if (modal) {
            modal.remove();
        }
    }    async duplicatePartido(id) {
        try {
            const partidos = await dataManager.getPartidos();
            const partido = partidos.find(p => p.id === id);
            
            if (!partido) {
                alert('Partido no encontrado');
                return;
            }

            const partidoDuplicado = {
                hora: partido.hora,
                liga: partido.liga,
                local: partido.local + ' (Copia)',
                visitante: partido.visitante,
                cuotas: { ...partido.cuotas }
            };

            await dataManager.addPartido(partidoDuplicado);
            await this.updatePartidosList();
            this.updateMainTable();
            alert('Partido duplicado exitosamente');
        } catch (error) {
            console.error('Error duplicando partido:', error);
            alert('❌ Error al duplicar partido: ' + error.message);
        }
    }async updateConfig() {
        try {
            const data = await dataManager.getData();
            data.configuracion.fecha = document.getElementById('config-fecha').value;
            data.configuracion.zona_horaria = document.getElementById('config-zona').value;
            data.configuracion.whatsapp = document.getElementById('config-whatsapp').value;
            await dataManager.saveData(data);
            this.updateMainPage();
            alert('Configuración actualizada');
        } catch (error) {
            console.error('Error al actualizar configuración:', error);
            alert('❌ Error al actualizar configuración');
        }
    }    updateMainTable() {
        // Actualizar la tabla principal
        if (typeof updateTableFromData === 'function') {
            updateTableFromData().catch(error => console.error('Error actualizando tabla:', error));        
        }
    }

    updateMainPage() {
        // Actualizar elementos de la página principal
        if (typeof updatePageFromData === 'function') {
            updatePageFromData();        
        }
    }async exportData() {
        try {
            const data = await dataManager.getData();
            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `la-jugada-prohibida-backup-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            alert('Datos exportados exitosamente');
        } catch (error) {
            console.error('Error exportando datos:', error);
            alert('❌ Error al exportar datos: ' + error.message);
        }
    }async importData(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                await dataManager.saveData(data);
                await this.updatePartidosList();
                this.updateMainTable();
                await this.loadCurrentData();
                alert('Datos importados exitosamente');
            } catch (error) {
                console.error('Error importando datos:', error);
                alert('❌ Error al importar datos: ' + error.message);
            }
        };
        reader.readAsText(file);
    }    async clearAllData() {
        if (confirm('⚠️ ¿Estás seguro? Esto eliminará TODOS los partidos y configuraciones.')) {
            if (confirm('🚨 ÚLTIMA ADVERTENCIA: Esta acción no se puede deshacer.')) {
                try {
                    // Use dataManager to clear data (it will handle both Supabase and localStorage)
                    await dataManager.clearAllData();
                    await this.updatePartidosList();
                    this.updateMainTable();
                    await this.loadCurrentData();
                    alert('Todos los datos han sido eliminados');
                } catch (error) {
                    console.error('Error al limpiar datos:', error);
                    alert('❌ Error al limpiar datos: ' + error.message);
                }
            }
        }
    }

    async resetToDefault() {
        if (confirm('¿Restaurar los datos por defecto? Esto eliminará todos los partidos actuales.')) {
            try {
                await dataManager.resetToDefault();
                await this.updatePartidosList();
                this.updateMainTable();
                await this.loadCurrentData();
                alert('Datos restaurados por defecto');
            } catch (error) {
                console.error('Error al restaurar datos por defecto:', error);
                alert('❌ Error al restaurar datos por defecto: ' + error.message);
            }
        }
    }// Métodos para gestión de ligas
    async updateLigasSelect() {
        try {
            const select = document.getElementById('new-liga-select');
            const ligas = await dataManager.getLigas();
            
            // Limpiar opciones existentes (excepto la primera)
            select.innerHTML = '<option value="">Seleccionar Liga</option>';
            
            ligas.forEach(liga => {
                const option = document.createElement('option');
                option.value = liga.id;
                option.textContent = `${liga.icono} ${liga.nombre}`;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error actualizando select de ligas:', error);
        }
    }    async updateFilterSelect() {
        try {
            const select = document.getElementById('filter-liga');
            const ligas = await dataManager.getLigas();
            
            // Limpiar opciones existentes (excepto la primera)
            select.innerHTML = '<option value="">Todas las Ligas</option>';
            
            ligas.forEach(liga => {
                const option = document.createElement('option');
                option.value = liga.id;
                option.textContent = `${liga.icono} ${liga.nombre}`;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error actualizando filtro de ligas:', error);
        }
    }    async updateLigasList() {
        try {
            const container = document.getElementById('admin-ligas-list');
            const ligas = await dataManager.getLigas();
            
            if (ligas.length === 0) {
                container.innerHTML = '<p style="color: #ccc; text-align: center;">No hay ligas configuradas</p>';
                return;
            }

            container.innerHTML = ligas.map(liga => `
                <div class="admin-liga-item">
                    <div class="admin-liga-info">
                        <div class="admin-liga-icon">${liga.icono}</div>
                        <div class="admin-liga-details">
                            <div class="admin-liga-nombre">${liga.nombre}</div>
                            <div class="admin-liga-codigo">${liga.codigo}</div>
                        </div>
                    </div>
                    <div class="admin-partido-actions">
                        <button onclick="adminPanel.editLiga('${liga.id}').catch(console.error)" class="admin-btn admin-btn-secondary admin-btn-small">✏️ Editar</button>
                        <button onclick="adminPanel.deleteLiga('${liga.id}').catch(console.error)" class="admin-btn admin-btn-danger admin-btn-small">🗑️ Eliminar</button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error actualizando lista de ligas:', error);
        }
    }    async addLiga() {
        const nombre = document.getElementById('new-liga-nombre').value;
        const codigo = document.getElementById('new-liga-codigo').value;
        const icono = document.getElementById('new-liga-icono').value;

        if (!nombre || !codigo || !icono) {
            alert('Por favor completa todos los campos de la liga');
            return;
        }
        
        const liga = {
            nombre: nombre,
            codigo: codigo,
            icono: icono,
            tiposApuesta: this.currentTemplateTypes || null,
            plantillaCuotas: this.currentPlantillaCuotas || {
                "1": 2.00, "X": 3.20, "2": 3.50,
                "1X": 1.25, "X2": 1.75, "12": 1.20,
                "U1.5": 2.10, "O1.5": 1.70,
                "U2.5": 1.85, "O2.5": 1.90,
                "U3.5": 1.55, "O3.5": 2.40,
                "G": 1.80, "NG": 1.95
            }
        };
        
        try {
            const ligaCreada = await dataManager.addLiga(liga);
            
            // Verificar que se guardó correctamente
            const ligaGuardada = await dataManager.getLigaById(ligaCreada.id);
            
            this.clearLigaForm();
            await this.updateLigasList();
            await this.updateLigasSelect();
            await this.updateFilterSelect();
            alert('Liga agregada exitosamente');
        } catch (error) {
            console.error('Error agregando liga:', error);
            alert('Error al agregar la liga: ' + error.message);
        }
    }clearLigaForm() {
        document.getElementById('new-liga-nombre').value = '';
        document.getElementById('new-liga-codigo').value = '';        document.getElementById('new-liga-icono').value = '';
        this.currentPlantillaCuotas = null;
        this.currentTemplateTypes = null;
        this.updateTemplateButton();
    }    async editLiga(id) {
        try {
            const liga = await dataManager.getLigaById(id);
            if (!liga) return;

            await this.showEditLigaModal(liga);
        } catch (error) {
            console.error('Error editando liga:', error);
            alert('❌ Error al editar liga: ' + error.message);
        }
    }

    async showEditLigaModal(liga) {
        try {
            const modal = document.createElement('div');
            modal.id = 'edit-liga-modal';
            modal.className = 'admin-modal';
            modal.innerHTML = `
                <div class="admin-modal-content edit-modal">
                    <div class="admin-modal-header">
                        <h3>✏️ Editar Liga - ${liga.nombre}</h3>
                        <button class="admin-close-btn" onclick="adminPanel.closeEditLigaModal()">×</button>
                    </div>
                    <div class="admin-modal-body">
                        <div class="admin-form">
                            <!-- Información básica de la liga -->
                            <div class="edit-section">
                                <h4><i class="fas fa-info-circle"></i> Información de la Liga</h4>
                                <div class="form-row">
                                    <div class="input-group">
                                        <label for="edit-liga-nombre">🏆 Nombre de la Liga</label>
                                        <input type="text" id="edit-liga-nombre" value="${liga.nombre}" class="admin-input" placeholder="Nombre de la liga" required>
                                    </div>
                                    <div class="input-group">
                                        <label for="edit-liga-icono">🎯 Icono de la Liga</label>
                                        <input type="text" id="edit-liga-icono" value="${liga.icono || '⚽'}" class="admin-input" placeholder="⚽" maxlength="2">
                                    </div>
                                </div>
                            </div>

                            <!-- Plantilla de cuotas -->
                            <div class="edit-section">
                                <h4><i class="fas fa-money-bill-wave"></i> Plantilla de Cuotas</h4>
                                <div class="cuotas-notice">
                                    <i class="fas fa-info-circle"></i>
                                    Define los valores por defecto que se aplicarán cuando uses "Usar Plantilla de Liga" al crear nuevos partidos.
                                </div>
                                <div id="edit-liga-cuotas-grid" class="dynamic-cuotas-grid">
                                    ${this.generateLigaTemplateInputs(liga)}
                                </div>
                                <div class="cuotas-actions">
                                    <button onclick="adminPanel.fillLigaTemplateSample()" class="admin-btn admin-btn-secondary admin-btn-small">
                                        <i class="fas fa-magic"></i> Llenar con valores de ejemplo
                                    </button>
                                    <button onclick="adminPanel.clearLigaTemplate()" class="admin-btn admin-btn-warning admin-btn-small">
                                        <i class="fas fa-eraser"></i> Limpiar plantilla
                                    </button>
                                </div>
                            </div>

                            <div class="admin-actions">
                                <button onclick="adminPanel.saveEditedLiga('${liga.id}')" class="admin-btn admin-btn-success">
                                    <i class="fas fa-save"></i> Guardar Cambios
                                </button>
                                <button onclick="adminPanel.closeEditLigaModal()" class="admin-btn admin-btn-secondary">
                                    <i class="fas fa-times"></i> Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            this.addEditModalStyles();
        } catch (error) {
            console.error('Error creando modal de edición de liga:', error);
            alert('❌ Error al abrir editor de liga');
        }
    }

    generateLigaTemplateInputs(liga) {
        const plantillaCuotas = liga.plantillaCuotas || {};
        
        // Tipos de apuesta estándar
        const tiposApuesta = [
            { id: '1', nombre: 'Local (1)', descripcion: 'Victoria del equipo local' },
            { id: 'X', nombre: 'Empate (X)', descripcion: 'Empate' },
            { id: '2', nombre: 'Visitante (2)', descripcion: 'Victoria del equipo visitante' },
            { id: '1X', nombre: 'Doble 1X', descripcion: 'Local o empate' },
            { id: 'X2', nombre: 'Doble X2', descripcion: 'Empate o visitante' },
            { id: '12', nombre: 'Doble 12', descripcion: 'Local o visitante' },
            { id: 'U1.5', nombre: 'Under 1.5', descripcion: 'Menos de 1.5 goles' },
            { id: 'O1.5', nombre: 'Over 1.5', descripcion: '1.5 goles o más' },
            { id: 'U2.5', nombre: 'Under 2.5', descripcion: 'Menos de 2.5 goles' },
            { id: 'O2.5', nombre: 'Over 2.5', descripcion: '2.5 goles o más' },
            { id: 'U3.5', nombre: 'Under 3.5', descripcion: 'Menos de 3.5 goles' },
            { id: 'O3.5', nombre: 'Over 3.5', descripcion: '3.5 goles o más' },
            { id: 'G', nombre: 'Ambos marcan', descripcion: 'Ambos equipos anotan' },
            { id: 'NG', nombre: 'No ambos marcan', descripcion: 'Al menos uno no anota' }
        ];

        return tiposApuesta.map(tipo => `
            <div class="cuota-input-group">
                <label for="template-${tipo.id}" class="cuota-label">
                    <span class="cuota-tipo">${tipo.nombre}</span>
                    <span class="cuota-desc">${tipo.descripcion}</span>
                </label>
                <input 
                    type="number" 
                    id="template-${tipo.id}" 
                    value="${plantillaCuotas[tipo.id] || ''}" 
                    class="admin-input cuota-input" 
                    placeholder="0.00" 
                    step="0.01" 
                    min="1.01"
                >
            </div>
        `).join('');
    }

    async saveEditedLiga(id) {
        try {
            const nombre = document.getElementById('edit-liga-nombre').value.trim();
            const icono = document.getElementById('edit-liga-icono').value.trim();

            if (!nombre) {
                alert('❌ El nombre de la liga es obligatorio');
                return;
            }

            // Recopilar plantilla de cuotas
            const plantillaCuotas = {};
            const tiposApuesta = ['1', 'X', '2', '1X', 'X2', '12', 'U1.5', 'O1.5', 'U2.5', 'O2.5', 'U3.5', 'O3.5', 'G', 'NG'];
            
            tiposApuesta.forEach(tipo => {
                const input = document.getElementById(`template-${tipo}`);
                if (input && input.value && parseFloat(input.value) >= 1.01) {
                    plantillaCuotas[tipo] = parseFloat(input.value);
                }
            });

            const ligaActualizada = {
                nombre,
                icono: icono || '⚽',
                plantillaCuotas
            };

            await dataManager.updateLiga(id, ligaActualizada);
            
            this.closeEditLigaModal();
            await this.updateLigasList();
            await this.updateLigasSelect();
            await this.updateFilterSelect();
            await this.updatePartidosList();
            this.updateMainTable();

            alert('✅ Liga actualizada exitosamente');

        } catch (error) {
            console.error('Error guardando liga editada:', error);
            alert('❌ Error al guardar la liga: ' + error.message);
        }
    }

    fillLigaTemplateSample() {
        const sampleOdds = {
            '1': 2.5, 'X': 3.2, '2': 2.8,
            '1X': 1.3, 'X2': 1.35, '12': 1.25,
            'U1.5': 2.1, 'O1.5': 1.7,
            'U2.5': 1.8, 'O2.5': 1.9,
            'U3.5': 1.4, 'O3.5': 2.6,
            'G': 1.8, 'NG': 1.9
        };

        Object.keys(sampleOdds).forEach(tipo => {
            const input = document.getElementById(`template-${tipo}`);
            if (input) {
                input.value = sampleOdds[tipo];
            }
        });

        // Mostrar mensaje de confirmación
        const container = document.getElementById('edit-liga-cuotas-grid');
        const message = document.createElement('div');
        message.className = 'success-message';
        message.innerHTML = '<i class="fas fa-magic"></i> ✅ Valores de ejemplo aplicados';
        container.appendChild(message);

        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 3000);
    }

    clearLigaTemplate() {
        const tiposApuesta = ['1', 'X', '2', '1X', 'X2', '12', 'U1.5', 'O1.5', 'U2.5', 'O2.5', 'U3.5', 'O3.5', 'G', 'NG'];
        
        tiposApuesta.forEach(tipo => {
            const input = document.getElementById(`template-${tipo}`);
            if (input) {
                input.value = '';
            }
        });

        // Mostrar mensaje de confirmación
        const container = document.getElementById('edit-liga-cuotas-grid');
        const message = document.createElement('div');
        message.className = 'warning-message';
        message.innerHTML = '<i class="fas fa-eraser"></i> ⚠️ Plantilla limpiada';
        container.appendChild(message);

        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 3000);
    }

    closeEditLigaModal() {
        const modal = document.getElementById('edit-liga-modal');
        if (modal) {
            modal.remove();
        }
    }async deleteLiga(id) {
        try {
            const liga = await dataManager.getLigaById(id);
            if (!liga) return;

            if (confirm(`¿Eliminar la liga "${liga.nombre}"? Esto también eliminará todos los partidos asociados.`)) {
                await dataManager.deleteLiga(id);
                await this.updateLigasList();
                await this.updateLigasSelect();
                await this.updateFilterSelect();
                await this.updatePartidosList();
                this.updateMainTable();
                alert('Liga eliminada exitosamente');
            }
        } catch (error) {
            console.error('Error eliminando liga:', error);
            alert('❌ Error al eliminar liga: ' + error.message);
        }
    }filterPartidosByLiga() {
        const ligaId = document.getElementById('filter-liga').value;
        this.updatePartidosList(ligaId);
    }

    showValueAssignmentModal(liga) {

        const modal = document.createElement('div');
        modal.className = 'admin-modal';
        modal.innerHTML = `
            <div class="admin-modal-content edit-modal" style="max-width: 800px;">
                <div class="admin-modal-header">
                    <h3>💰 Asignar Valores a la Plantilla</h3>
                    <button onclick="this.closest('.admin-modal').remove()" class="admin-close-btn">×</button>
                </div>
                <div class="admin-modal-body">
                    <div style="margin-bottom: 20px;">
                        <h4 style="color: var(--primary-color);">
                            <i class="fas fa-tag"></i> Liga: ${liga.nombre} ${liga.icono}
                        </h4>
                        <p style="color: #b3b3b3;">
                            Asigna valores numéricos a cada tipo de apuesta definido en la plantilla.
                        </p>
                    </div>
                    
                    <div class="template-assignment-grid" id="assignment-grid">
                        ${this.generateAssignmentInputs(liga.tiposApuesta)}
                    </div>                    <div class="admin-actions" style="margin-top: 30px;">
                        <button onclick="adminPanel.applyAssignedValues('${liga.id}')" class="admin-btn admin-btn-success">
                            <i class="fas fa-check"></i> Aplicar Valores
                        </button>
                        <button onclick="adminPanel.fillRandomValues()" class="admin-btn admin-btn-secondary">
                            <i class="fas fa-dice"></i> Valores Aleatorios
                        </button>
                        <button onclick="this.closest('.admin-modal').remove()" class="admin-btn admin-btn-secondary">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.addTemplateStyles();
    }

    generateAssignmentInputs(tiposApuesta) {
        return tiposApuesta.map(tipo => `
            <div class="assignment-item">
                <span class="assignment-label">${tipo.label}</span>
                <input type="number" 
                       id="assign-${tipo.id}" 
                       class="admin-input assignment-input" 
                       placeholder="0.00" 
                       step="0.01" 
                       min="1.01"
                       value="${this.getDefaultValue(tipo.id)}">
            </div>
        `).join('');
    }

    getDefaultValue(typeId) {
        const defaults = {
            '1': '2.20',
            'X': '3.40', 
            '2': '3.10',
            '1X': '1.35',
            'X2': '1.85',
            '12': '1.25',
            'O1.5': '1.70',
            'U1.5': '2.10',
            'O2.5': '1.90',
            'U2.5': '1.85',
            'O3.5': '2.40',
            'U3.5': '1.55',
            'G': '1.80',
            'NG': '1.95'
        };
        return defaults[typeId] || '2.00';
    }

    fillRandomValues() {
        const inputs = document.querySelectorAll('.assignment-input');
        inputs.forEach(input => {
            const randomValue = (Math.random() * (4.50 - 1.20) + 1.20).toFixed(2);
            input.value = randomValue;
        });
    }

    applyAssignedValues(ligaId) {
        const liga = dataManager.getLigaById(ligaId);
        const assignedValues = {};
        
        // Recoger valores asignados
        liga.tiposApuesta.forEach(tipo => {
            const input = document.getElementById(`assign-${tipo.id}`);
            if (input && input.value) {
                assignedValues[tipo.id] = parseFloat(input.value);
            }
        });

        // Mapear a los campos del formulario de partido
        const fieldMapping = {
            '1': 'new-1',
            'X': 'new-X', 
            '2': 'new-2',
            '1X': 'new-1X',
            'X2': 'new-X2',
            '12': 'new-12',
            'O1.5': 'new-O1.5',
            'U1.5': 'new-U1.5',
            'O2.5': 'new-O2.5',
            'U2.5': 'new-U2.5',
            'O3.5': 'new-O3.5',
            'U3.5': 'new-U3.5',
            'G': 'new-G',
            'NG': 'new-NG'
        };

        // Aplicar valores a los campos correspondientes
        Object.keys(assignedValues).forEach(typeId => {
            const fieldId = fieldMapping[typeId];
            if (fieldId) {
                const field = document.getElementById(fieldId);
                if (field) {
                    field.value = assignedValues[typeId];
                }
            }
        });

        // Cerrar modal
        document.querySelector('.admin-modal').remove();
        
        alert(`Valores aplicados para ${Object.keys(assignedValues).length} tipos de apuesta`);
    }

    applyLegacyTemplate(liga) {
        // Sistema anterior: aplicar valores directamente
        Object.keys(liga.plantillaCuotas).forEach(key => {
            const input = document.getElementById(`new-${key}`);
            if (input) {
                input.value = liga.plantillaCuotas[key];
            }
        });

        alert('Plantilla de cuotas aplicada (sistema heredado)');
    }showCuotasTemplate() {
        // Modal para configurar plantilla de cuotas - FASE 1: Definir tipos de apuesta
        const modal = document.createElement('div');
        modal.className = 'admin-modal';
        modal.innerHTML = `
            <div class="admin-modal-content edit-modal" style="max-width: 700px;">
                <div class="admin-modal-header">
                    <h3>📋 Crear Plantilla de Tipos de Apuesta</h3>
                    <button onclick="this.closest('.admin-modal').remove()" class="admin-close-btn">×</button>
                </div>
                <div class="admin-modal-body">
                    <p style="color: #b3b3b3; margin-bottom: 20px;">
                        <i class="fas fa-info-circle"></i> Define los tipos de apuesta disponibles para esta liga. Los valores numéricos se asignarán al usar la plantilla.
                    </p>
                    
                    <div class="template-section">
                        <h4 style="color: var(--primary-color); margin-bottom: 15px;">
                            <i class="fas fa-trophy"></i> Resultado Final
                        </h4>
                        <div class="template-types-grid">
                            <label class="template-type-item">
                                <input type="checkbox" checked id="type-1" value="1">
                                <span class="type-label">1 (Local)</span>
                            </label>
                            <label class="template-type-item">
                                <input type="checkbox" checked id="type-X" value="X">
                                <span class="type-label">X (Empate)</span>
                            </label>
                            <label class="template-type-item">
                                <input type="checkbox" checked id="type-2" value="2">
                                <span class="type-label">2 (Visitante)</span>
                            </label>
                        </div>
                    </div>

                    <div class="template-section">
                        <h4 style="color: var(--primary-color); margin-bottom: 15px;">
                            <i class="fas fa-handshake"></i> Doble Oportunidad
                        </h4>
                        <div class="template-types-grid">
                            <label class="template-type-item">
                                <input type="checkbox" id="type-1X" value="1X">
                                <span class="type-label">1X (Local o Empate)</span>
                            </label>
                            <label class="template-type-item">
                                <input type="checkbox" id="type-X2" value="X2">
                                <span class="type-label">X2 (Empate o Visitante)</span>
                            </label>
                            <label class="template-type-item">
                                <input type="checkbox" id="type-12" value="12">
                                <span class="type-label">12 (Local o Visitante)</span>
                            </label>
                        </div>
                    </div>

                    <div class="template-section">
                        <h4 style="color: var(--primary-color); margin-bottom: 15px;">
                            <i class="fas fa-futbol"></i> Goles Total
                        </h4>
                        <div class="template-types-grid">
                            <label class="template-type-item">
                                <input type="checkbox" id="type-O1.5" value="O1.5">
                                <span class="type-label">O1.5 (Más de 1.5)</span>
                            </label>
                            <label class="template-type-item">
                                <input type="checkbox" id="type-U1.5" value="U1.5">
                                <span class="type-label">U1.5 (Menos de 1.5)</span>
                            </label>
                            <label class="template-type-item">
                                <input type="checkbox" id="type-O2.5" value="O2.5">
                                <span class="type-label">O2.5 (Más de 2.5)</span>
                            </label>
                            <label class="template-type-item">
                                <input type="checkbox" id="type-U2.5" value="U2.5">
                                <span class="type-label">U2.5 (Menos de 2.5)</span>
                            </label>
                            <label class="template-type-item">
                                <input type="checkbox" id="type-O3.5" value="O3.5">
                                <span class="type-label">O3.5 (Más de 3.5)</span>
                            </label>
                            <label class="template-type-item">
                                <input type="checkbox" id="type-U3.5" value="U3.5">
                                <span class="type-label">U3.5 (Menos de 3.5)</span>
                            </label>
                        </div>
                    </div>

                    <div class="template-section">
                        <h4 style="color: var(--primary-color); margin-bottom: 15px;">
                            <i class="fas fa-users"></i> Ambos Equipos Marcan
                        </h4>
                        <div class="template-types-grid">
                            <label class="template-type-item">
                                <input type="checkbox" id="type-G" value="G">
                                <span class="type-label">G (Sí marcan)</span>
                            </label>
                            <label class="template-type-item">
                                <input type="checkbox" id="type-NG" value="NG">
                                <span class="type-label">NG (No marcan)</span>
                            </label>
                        </div>
                    </div>

                    <div class="template-section">
                        <h4 style="color: var(--primary-color); margin-bottom: 15px;">
                            <i class="fas fa-plus"></i> Tipos Personalizados
                        </h4>
                        <div id="custom-types-container">
                            <div class="custom-type-row">
                                <input type="text" placeholder="Ej: 1er Cuarto 1" class="admin-input custom-type-input">
                                <button onclick="adminPanel.addCustomType()" class="admin-btn admin-btn-secondary">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="admin-actions" style="margin-top: 30px;">
                        <button onclick="adminPanel.saveTemplateTypes()" class="admin-btn admin-btn-success">
                            <i class="fas fa-save"></i> Crear Plantilla
                        </button>
                        <button onclick="this.closest('.admin-modal').remove()" class="admin-btn admin-btn-secondary">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.addTemplateStyles();
    }    saveTemplate() {
        this.currentPlantillaCuotas = {
            "1": parseFloat(document.getElementById('template-1').value) || 2.00,
            "X": parseFloat(document.getElementById('template-X').value) || 3.20,
            "2": parseFloat(document.getElementById('template-2').value) || 3.50,
            "1X": parseFloat(document.getElementById('template-1X').value) || 1.25,
            "X2": parseFloat(document.getElementById('template-X2').value) || 1.75,
            "12": parseFloat(document.getElementById('template-12').value) || 1.20,
            "U1.5": parseFloat(document.getElementById('template-U1.5').value) || 2.10,
            "O1.5": parseFloat(document.getElementById('template-O1.5').value) || 1.70,
            "U2.5": parseFloat(document.getElementById('template-U2.5').value) || 1.85,
            "O2.5": parseFloat(document.getElementById('template-O2.5').value) || 1.90,
            "U3.5": parseFloat(document.getElementById('template-U3.5').value) || 1.55,
            "O3.5": parseFloat(document.getElementById('template-O3.5').value) || 2.40,
            "G": parseFloat(document.getElementById('template-G').value) || 1.80,
            "NG": parseFloat(document.getElementById('template-NG').value) || 1.95
        };

        document.querySelector('.admin-modal').remove();
        alert('Plantilla de cuotas guardada temporalmente. Se aplicará al crear la liga.');
    }

    addCustomType() {
        const container = document.getElementById('custom-types-container');
        const newRow = document.createElement('div');
        newRow.className = 'custom-type-row';
        newRow.innerHTML = `
            <input type="text" placeholder="Nombre del tipo de apuesta" class="admin-input custom-type-input">
            <button onclick="this.parentElement.remove()" class="admin-btn admin-btn-danger">
                <i class="fas fa-trash"></i>
            </button>
        `;
        container.appendChild(newRow);
    }    saveTemplateTypes() {
        const selectedTypes = [];
        
        // Recoger tipos estándar seleccionados
        const standardTypes = ['1', 'X', '2', '1X', 'X2', '12', 'O1.5', 'U1.5', 'O2.5', 'U2.5', 'O3.5', 'U3.5', 'G', 'NG'];
        standardTypes.forEach(type => {
            const checkbox = document.getElementById(`type-${type}`);
            if (checkbox && checkbox.checked) {
                selectedTypes.push({
                    id: type,
                    label: type,
                    custom: false
                });
            }
        });

        // Recoger tipos personalizados
        const customInputs = document.querySelectorAll('.custom-type-input');
        customInputs.forEach(input => {
            if (input.value.trim()) {
                const customId = input.value.trim().replace(/\s+/g, '_').toUpperCase();
                selectedTypes.push({
                    id: customId,
                    label: input.value.trim(),
                    custom: true
                });
            }
        });

        if (selectedTypes.length === 0) {
            alert('Debes seleccionar al menos un tipo de apuesta');
            return;
        }

        // Guardar plantilla de tipos
        this.currentTemplateTypes = selectedTypes;
        
        // Actualizar botón para mostrar estado
        this.updateTemplateButton();
        
        // Cerrar modal actual
        document.querySelector('.admin-modal').remove();
        
        alert(`Plantilla creada con ${selectedTypes.length} tipos de apuesta. Se aplicará al crear la liga.`);
    }

    updateTemplateButton() {
        const btn = document.getElementById('template-btn');
        if (this.currentTemplateTypes) {
            btn.innerHTML = `<i class="fas fa-check-circle"></i> Plantilla Lista (${this.currentTemplateTypes.length} tipos)`;
            btn.className = 'admin-btn admin-btn-success';
        } else {
            btn.innerHTML = `<i class="fas fa-cogs"></i> Crear Plantilla de Tipos`;
            btn.className = 'admin-btn admin-btn-secondary';
        }
    }

    addTemplateStyles() {
        if (document.getElementById('template-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'template-styles';
        styles.textContent = `
            .template-section {
                margin-bottom: 25px;
                padding: 15px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 8px;
                border-left: 3px solid var(--primary-color);
            }
            
            .template-types-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 10px;
                margin-top: 10px;
            }
            
            .template-type-item {
                display: flex;
                align-items: center;
                padding: 8px 12px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.3s ease;
                border: 1px solid transparent;
            }
            
            .template-type-item:hover {
                background: rgba(255, 107, 0, 0.1);
                border-color: var(--primary-color);
            }
            
            .template-type-item input[type="checkbox"] {
                margin-right: 10px;
                transform: scale(1.2);
            }
            
            .type-label {
                color: var(--text-primary);
                font-weight: 500;
            }
            
            .custom-type-row {
                display: flex;
                gap: 10px;
                margin-bottom: 10px;
                align-items: center;
            }
            
            .custom-type-input {
                flex: 1;
            }
            
            .template-assignment-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 15px;
                margin-top: 15px;
            }
            
            .assignment-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 12px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 6px;
                border-left: 3px solid var(--accent-color);
            }
            
            .assignment-label {
                font-weight: 600;
                color: var(--primary-color);
                min-width: 100px;
            }
            
            .assignment-input {
                width: 80px;
                text-align: center;
            }
        `;
        document.head.appendChild(styles);
    }

    // Función de debug para verificar ligas
    async debugLigas() {
        try {
            const ligas = await dataManager.getLigas();
            ligas.forEach((liga, index) => {
            });
        } catch (error) {
            console.error('Error en debug de ligas:', error);
        }    }

    // Función de prueba completa del sistema
    async testCompleteSystem() {
        try {
            // 1. Crear plantilla de tipos
            this.currentTemplateTypes = [
                { id: '1', label: '1', custom: false },
                { id: 'X', label: 'X', custom: false },
                { id: '2', label: '2', custom: false },
                { id: 'O2.5', label: 'O2.5', custom: false },
                { id: 'CUSTOM_TEST', label: 'Tipo Personalizado', custom: true }
            ];
            
            // 2. Crear liga con plantilla
            const liga = {
                nombre: 'Liga de Prueba',
                codigo: 'TEST',
                icono: '🧪',
                tiposApuesta: this.currentTemplateTypes,
                plantillaCuotas: {
                    "1": 2.00, "X": 3.20, "2": 3.50,
                    "O2.5": 1.90, "U2.5": 1.85
                }
            };
            
            const ligaCreada = await dataManager.addLiga(liga);
            
            // 3. Verificar que se guardó correctamente
            const ligaGuardada = await dataManager.getLigaById(ligaCreada.id);
            
            // 4. Probar usar plantilla
            if (ligaGuardada.tiposApuesta && ligaGuardada.tiposApuesta.length > 0) {
            } else {
                console.log('❌ Liga NO tiene tipos de apuesta');
                console.log('❌ Sistema fallando');
            }
              return ligaCreada.id;
        } catch (error) {
            console.error('Error en test del sistema:', error);
        }
    }    // Métodos para gestión de configuración del evento
    async loadEventConfig(silent = false) {
        try {
            const config = await dataManager.getConfiguration();
            
            // Cargar valores en los campos
            document.getElementById('event-titulo').value = config.evento_titulo || 'Evento Principal - Mayo 2025';
            document.getElementById('event-descripcion').value = config.evento_descripcion || 'Las mejores cuotas para los partidos más emocionantes';
            document.getElementById('event-fecha-iso').value = config.evento_fecha_iso || '2025-05-24';
            document.getElementById('event-fecha-texto').value = config.evento_fecha || '24 de Mayo de 2025';
            document.getElementById('event-zona').value = config.zona_horaria || 'UTC-5';
            document.getElementById('event-whatsapp').value = config.whatsapp || '+1234567890';
            
            if (!silent) {
                alert('✅ Configuración del evento cargada exitosamente');
            }
        } catch (error) {
            console.error('Error cargando configuración del evento:', error);
            if (!silent) {
                alert('❌ Error al cargar la configuración: ' + error.message);
            }
        }
    }

    async updateEventConfig() {
        try {
            const titulo = document.getElementById('event-titulo').value.trim();
            const descripcion = document.getElementById('event-descripcion').value.trim();
            const fechaIso = document.getElementById('event-fecha-iso').value;
            const fechaTexto = document.getElementById('event-fecha-texto').value.trim();
            const zona = document.getElementById('event-zona').value.trim();
            const whatsapp = document.getElementById('event-whatsapp').value.trim();

            if (!titulo || !descripcion || !fechaIso) {
                alert('❌ Por favor complete al menos el título, descripción y fecha del evento');
                return;
            }            const configs = [
                { clave: 'evento_titulo', valor: titulo, descripcion: 'Título principal del evento' },
                { clave: 'evento_descripcion', valor: descripcion, descripcion: 'Descripción del evento' },
                { clave: 'evento_fecha_iso', valor: fechaIso, descripcion: 'Fecha del evento en formato ISO' },
                { clave: 'evento_fecha', valor: fechaTexto || this.formatDateFromISO(fechaIso), descripcion: 'Fecha del evento en texto personalizado' },
                { clave: 'zona_horaria', valor: zona || 'UTC-5', descripcion: 'Zona horaria del evento' },
                { clave: 'whatsapp', valor: whatsapp || '+1234567890', descripcion: 'Número de WhatsApp para contacto' }
            ];

            await dataManager.updateMultipleConfiguration(configs);
            
            // Actualizar la página principal si está visible
            this.updateMainPageEventInfo();
            
            alert('✅ Configuración del evento actualizada exitosamente');
        } catch (error) {
            console.error('Error actualizando configuración del evento:', error);
            alert('❌ Error al actualizar la configuración: ' + error.message);
        }
    }

    formatDateFromISO(isoDate) {
        try {
            const date = new Date(isoDate);
            const months = [
                'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
            ];
            
            const day = date.getDate();
            const month = months[date.getMonth()];
            const year = date.getFullYear();
            
            return `${day} de ${month} de ${year}`;
        } catch (error) {
            return isoDate;
        }
    }

    async updateMainPageEventInfo() {
        try {
            const config = await dataManager.getConfiguration();
            
            // Actualizar título del evento
            const eventTitleElement = document.querySelector('.event-title h2');
            if (eventTitleElement) {
                eventTitleElement.textContent = config.evento_titulo || 'Evento Principal - Mayo 2025';
            }
            
            // Actualizar descripción del evento
            const eventDescElement = document.querySelector('.event-title p');
            if (eventDescElement) {
                eventDescElement.textContent = config.evento_descripcion || 'Las mejores cuotas para los partidos más emocionantes';
            }
            
            // Actualizar fecha en las estadísticas
            const eventStatElement = document.querySelector('.stat-card p');
            if (eventStatElement) {
                eventStatElement.innerHTML = `${config.evento_fecha || '24 de Mayo de 2025'}<br>Todos los horarios`;
            }
            
        } catch (error) {
            console.error('Error actualizando información del evento en la página principal:', error);
        }
    }
}

// Instancia global del panel de administración
const adminPanel = new AdminPanel();
