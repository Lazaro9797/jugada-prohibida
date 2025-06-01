// Script principal de La Jugada Prohibida - Versión Moderna

// Funciones auxiliares
function convertTo12HourFormat(time24) {
    if (!time24) return '';
    try {
        const [hours, minutes] = time24.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    } catch (error) {
        console.error('Error convirtiendo hora:', error);
        return time24;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initializeApp().catch(error => console.error('Error iniciando aplicación:', error));
});

async function initializeApp() {
    
    // Verificar que dataManager esté disponible
    if (typeof dataManager === 'undefined') {
        console.error('DataManager no está disponible');
        return;
    }
    
    // Esperar a que dataManager termine de inicializarse
    await dataManager.init();
    
    // Inicializar filtros vacíos
    window.currentFilters = {
        league: '',
        time: '',
        team: '',
        minOdds: 0
    };
    
    // Cargar componentes en orden
    await populateFilters();
    updatePageFromData();
    await loadDataToTable();
    setupEventListeners();
}

// Cargar datos a la tabla
async function loadDataToTable() {
    const container = document.getElementById('matchesByLeague');
    
    if (!container) {
        console.error('No se encontró el elemento #matchesByLeague');
        return;
    }
    
    if (typeof dataManager === 'undefined') {
        console.error('dataManager no está disponible');
        container.innerHTML = `
            <div class="league-section">
                <div class="table-wrapper">
                    <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                        <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                        <h3>Error: DataManager no está disponible</h3>
                    </div>
                </div>
            </div>
        `;
        return;
    }
      // Cargar partidos usando dataManager
    const partidos = await dataManager.getPartidos();
      if (!partidos) {
        console.error('Error cargando partidos');
        container.innerHTML = `
            <div class="league-section">
                <div class="table-wrapper">
                    <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                        <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                        <h3>Error: No se pudieron cargar los partidos</h3>
                    </div>
                </div>
            </div>
        `;
        return;
    }
    
    if (partidos && partidos.length > 0) {
        updateTableFromData(partidos);
    } else {
        container.innerHTML = `
            <div class="league-section">
                <div class="table-wrapper">
                    <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                        <i class="fas fa-exclamation-circle" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                        <h3>No hay partidos disponibles</h3>
                        <p>Contacta al administrador para cargar datos.</p>
                    </div>
                </div>
            </div>
        `;
    }
}

// Mostrar spinner de carga
function showLoadingSpinner() {
    const tableBody = document.querySelector('#matchesBody');
    tableBody.innerHTML = `
        <tr>
            <td colspan="11" class="loading">
                <div class="spinner"></div>
            </td>
        </tr>
    `;
}

// Actualizar tabla desde los datos guardados
async function updateTableFromData(partidos) {
    const ligas = await dataManager.getLigas();
    
    const container = document.getElementById('matchesByLeague');
    let partidosFiltrados = partidos;
    
    // Aplicar filtros si existen
    if (window.currentFilters) {
        partidosFiltrados = await applyFiltersToData(partidos, window.currentFilters, ligas);
    }
    
    if (partidosFiltrados.length === 0) {
        container.innerHTML = `
            <div class="league-section">
                <div class="table-wrapper">
                    <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                        <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                        <h3>No se encontraron partidos</h3>
                        <p>No hay partidos que coincidan con los filtros aplicados</p>
                    </div>
                </div>
            </div>
        `;
        updateMatchesCount(0);
        return;
    }
    
    // Agrupar partidos por liga
    const partidosPorLiga = {};
    
    partidosFiltrados.forEach(partido => {
        const liga = partido.ligas || { id: 'sin-liga', nombre: 'Sin Liga', icono: '⚽', tipos_apuesta: null };
        const ligaKey = liga.id;
        
        if (!partidosPorLiga[ligaKey]) {
            partidosPorLiga[ligaKey] = {
                liga: liga,
                partidos: []
            };
        }
        partidosPorLiga[ligaKey].partidos.push(partido);
    });
    
    // Generar HTML para cada liga
    let html = '';
    
    Object.keys(partidosPorLiga).forEach(ligaKey => {
        const ligaData = partidosPorLiga[ligaKey];
        const liga = ligaData.liga;
        const partidosLiga = ligaData.partidos;
        
        // Obtener las columnas dinámicas basadas en los tipos de apuesta de la liga
        const columnasPersonalizadas = getColumnasPersonalizadas(liga);
        
        html += `
            <section class="league-section" data-liga-id="${liga.id}">
                <div class="league-header">
                    <div class="league-title">
                        <span class="league-icon">${liga.icono}</span>
                        ${liga.nombre}
                    </div>
                    <div class="league-count">
                        ${partidosLiga.length} partido${partidosLiga.length !== 1 ? 's' : ''}
                    </div>
                </div>
                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Partido</th>
                                <th>Hora</th>
                                ${columnasPersonalizadas.headers}
                                <th class="admin-column" style="display: none;">Admin</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${generateTableRows(partidosLiga, liga, columnasPersonalizadas)}
                        </tbody>
                    </table>
                </div>
            </section>
        `;
    });
    
    container.innerHTML = html;
    updateMatchesCount(partidosFiltrados.length);
    updateTotalMatches(partidos.length);
    
    // Configurar event listeners para las celdas de apuesta
    setupBettingCells();
}

// Configurar event listeners para las celdas de apuesta
function setupBettingCells() {
    const betCells = document.querySelectorAll('.bet-cell');
    
    betCells.forEach(cell => {
        // Verificar si tiene un valor válido en el span bet-value
        const betValueSpan = cell.querySelector('.bet-value');
        const hasValidValue = betValueSpan && betValueSpan.textContent !== '-' && betValueSpan.textContent !== '';
        
        if (hasValidValue) {
            cell.style.cursor = 'pointer';
            
            // Remover event listeners previos
            cell.removeEventListener('click', handleBetClick);
            
            // Agregar nuevo event listener
            cell.addEventListener('click', handleBetClick);
        }
    });
}

// Obtener columnas personalizadas basadas en los tipos de apuesta de la liga
function getColumnasPersonalizadas(liga) {
    // Solo usar los tipos de apuesta configurados para la liga
    let columnas = [];
    
    if (liga && liga.tipos_apuesta) {
        try {
            // Si tipos_apuesta es un string (JSON), parsearlo
            const tiposApuesta = typeof liga.tipos_apuesta === 'string' 
                ? JSON.parse(liga.tipos_apuesta) 
                : liga.tipos_apuesta;
            
            if (Array.isArray(tiposApuesta)) {
                columnas = tiposApuesta.map(tipo => ({
                    id: tipo.id || tipo.tipo,
                    label: tipo.label || tipo.tipo
                }));
            }
        } catch (error) {
            console.error('Error parseando tipos de apuesta:', error);
        }
    }
    
    // Si no hay tipos configurados, mostrar mensaje en consola
    if (columnas.length === 0) {
        console.warn(`La liga ${liga.nombre} no tiene tipos de apuesta configurados`);
    }
    
    const headers = columnas.map(col => `<th>${col.label}</th>`).join('');
    
    return {
        columnas,
        headers
    };
}

// Generar filas de la tabla para una liga específica
function generateTableRows(partidos, liga, columnasPersonalizadas) {
    return partidos.map(partido => {
        const ligaDisplay = `${liga.icono} ${liga.nombre}`;
          // Generar celdas de cuotas dinámicamente
        const celdasCuotas = columnasPersonalizadas.columnas.map(col => {
            // Obtener el valor de la cuota, verificando que exista
            let valor = '-';
            if (partido.cuotas && (col.id in partido.cuotas)) {
                valor = partido.cuotas[col.id];
            }
            
            return `
                <td class="odds-cell bet-cell" data-tipo="${col.id}" data-partido-id="${partido.id}">
                    <span class="bet-label">${col.label}</span><br>
                    <span class="bet-value">${valor}</span>
                </td>
            `;
        }).join('');
          return `
            <tr data-partido-id="${partido.id}">
                <td class="match-info">
                    <div class="match-teams">${partido.local} vs ${partido.visitante}</div>
                    <div class="match-league">${ligaDisplay}</div>
                </td>
                <td class="match-time">${convertTo12HourFormat(partido.hora)}</td>
                ${celdasCuotas}
                <td class="admin-actions" style="display: none;">
                    <button class="btn-admin" onclick="adminPanel.editPartido(${partido.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-admin btn-delete" onclick="adminPanel.deletePartido(${partido.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Aplicar filtros a los datos
async function applyFiltersToData(partidos, filters, ligas) {
    
    const filteredPartidos = [];
    
    for (const partido of partidos) {
        let includePartido = true;
        
        // Filtro por liga
        if (filters.league && filters.league.trim() !== '') {
            const liga = partido.ligas;
            if (!liga || liga.id !== filters.league) {
                includePartido = false;
            }
        }
        
        // Filtro por hora
        if (includePartido && filters.time && filters.time.trim() !== '' && partido.hora !== filters.time) {
            includePartido = false;
        }
        
        // Filtro por equipo
        if (includePartido && filters.team && filters.team.trim() !== '') {
            const teamMatch = partido.local.toLowerCase().includes(filters.team.toLowerCase()) || 
                            partido.visitante.toLowerCase().includes(filters.team.toLowerCase());
            if (!teamMatch) includePartido = false;
        }
        
        // Filtro por cuota mínima
        if (includePartido && filters.minOdds > 0) {
            const hasValidOdds = Object.values(partido.cuotas).some(cuota => 
                cuota && cuota !== '-' && parseFloat(cuota) >= filters.minOdds
            );
            if (!hasValidOdds) includePartido = false;
        }
        
        if (includePartido) {
            filteredPartidos.push(partido);
        }
    }
    return filteredPartidos;
}

// Actualizar contadores
function updateMatchesCount(count) {
    const visibleMatches = document.getElementById('visibleMatches');
    if (visibleMatches) {
        visibleMatches.textContent = count;
    }
}

function updateTotalMatches(count) {
    const totalMatches = document.getElementById('totalMatches');
    if (totalMatches) {
        totalMatches.textContent = count;
    }
}

// Poblar filtros dinámicamente
async function populateFilters() {
    
    try {
        const ligas = await dataManager.getLigas();
        
        const leagueFilter = document.getElementById('leagueFilter');
        if (leagueFilter) {              if (!ligas || !Array.isArray(ligas) || ligas.length === 0) {
                console.warn('⚠️ No se obtuvieron ligas para poblar el filtro:', ligas);
                leagueFilter.innerHTML = '<option value="">No hay ligas disponibles</option>';
                return;
            }

            const ligasOptions = ligas.map(liga => {
                const id = liga.id?.toString() || '';
                const icono = liga.icono || '⚽';
                const nombre = liga.nombre || 'Liga sin nombre';
                return `<option value="${id}">${icono} ${nombre}</option>`;
            }).join('');
            
            leagueFilter.innerHTML = '<option value="">Todas las ligas</option>' + ligasOptions;
        } else {
            console.warn('❌ No se encontró el elemento leagueFilter');
        }
    } catch (error) {
        console.error('❌ Error poblando filtros:', error);
    }
    
    // Poblar filtro de horas
    const partidos = await dataManager.getPartidos();
    if (partidos && partidos.length > 0) {
        const horas = [...new Set(partidos.map(p => p.hora))].sort();
        const timeFilter = document.getElementById('timeFilter');
        if (timeFilter) {
            timeFilter.innerHTML = '<option value="">Todos los horarios</option>' +
                horas.map(hora => `<option value="${hora}">${convertTo12HourFormat(hora)}</option>`).join('');
        }
    } else {
        console.log('⚠️ No hay partidos para poblar filtro de horas');
    }
}

// Actualizar página desde los datos guardados
async function updatePageFromData() {
    try {
        // Cargar configuración del evento y general
        const config = await dataManager.getConfiguration();
        
        if (config) {
            // Actualizar información del evento principal
            const eventTitleElement = document.querySelector('.event-title h2');
            if (eventTitleElement) {
                eventTitleElement.textContent = config.evento_titulo || 'Evento Principal - Mayo 2025';
            }
            
            const eventDescElement = document.querySelector('.event-title p');
            if (eventDescElement) {
                eventDescElement.textContent = config.evento_descripcion || 'Las mejores cuotas para los partidos más emocionantes';
            }
            
            // Actualizar fecha en las estadísticas del evento
            const eventDateElement = document.querySelector('.stat-card p');
            if (eventDateElement) {
                eventDateElement.innerHTML = `${config.evento_fecha || '24 de Mayo de 2025'}<br>Todos los horarios`;
            }
            
            // Actualizar enlace de WhatsApp si existe
            const whatsappLink = document.querySelector('.whatsapp-btn');
            if (whatsappLink && config.whatsapp) {
                whatsappLink.href = `https://wa.me/${config.whatsapp}`;
            }
        }
    } catch (error) {
        console.error('Error cargando configuración del evento:', error);
        // Continuar con valores por defecto si hay error
    }
}

// Agregar event listeners para las celdas de apuestas
function addBetEventListeners() {
    const betCells = document.querySelectorAll('.bet-cell');
    
    betCells.forEach(cell => {
        // Verificar si tiene un valor válido en el span bet-value
        const betValueSpan = cell.querySelector('.bet-value');
        const hasValidValue = betValueSpan && betValueSpan.textContent !== '-' && betValueSpan.textContent !== '';
        
        if (hasValidValue) {
            cell.style.cursor = 'pointer';
            
            // Remover event listeners previos
            cell.removeEventListener('click', handleBetClick);
            
            // Agregar nuevo event listener
            cell.addEventListener('click', handleBetClick);
        }
    });
}

// Manejar click en celda de apuesta
async function handleBetClick() {
    
    // Verificar que cartManager esté disponible
    if (typeof cartManager === 'undefined') {
        console.error('❌ cartManager no está disponible');
        return;
    }
      const partidoId = this.dataset.partidoId;
    const tipo = this.dataset.tipo;
    
    // Validar que partidoId existe (puede ser UUID o número)
    if (!partidoId || partidoId.trim() === '') {
        console.error('❌ partidoId no es válido:', partidoId);
        return;
    }
    
    // Obtener el valor de la cuota desde el span bet-value
    const betValueSpan = this.querySelector('.bet-value');
    const cuota = betValueSpan ? betValueSpan.textContent.trim() : this.textContent;
    
    if (cuota === '-' || cuota === '' || isNaN(parseFloat(cuota))) {
        console.log('❌ Cuota no disponible o inválida:', cuota);
        return;
    }
    
    // Obtener información del partido
    const partidos = await dataManager.getPartidos();
      const partido = partidos.find(p => {
        return p.id === partidoId;
    });
    
    if (!partido) {
        console.error('❌ Partido no encontrado con ID:', partidoId);
        return;
    }
    
    try {
        // Obtener el texto de la apuesta
        const tipoLabel = this.querySelector('.bet-label').textContent;
        const apuestaText = `${partido.local} vs ${partido.visitante} - ${tipoLabel} @ ${cuota}`;
        
        const itemCarrito = {
            partidoId,
            tipo,
            cuota: parseFloat(cuota),
            local: partido.local,
            visitante: partido.visitante,
            tipoLabel,
            liga: partido.ligas?.nombre || 'Liga sin nombre',
            hora: convertTo12HourFormat(partido.hora),
            texto: apuestaText
        };
        
        // Agregar al carrito con texto descriptivo
        cartManager.addToCart(itemCarrito);
        
        // Efecto visual de selección
        this.style.transform = 'scale(0.95)';
        this.style.background = 'rgba(0, 212, 170, 0.3)';
        
        setTimeout(() => {
            this.style.transform = '';
            this.style.background = '';
        }, 200);
        
    } catch (error) {
        console.error('❌ Error al agregar al carrito:', error);
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Event listeners para filtros
    const leagueFilter = document.getElementById('leagueFilter');
    const timeFilter = document.getElementById('timeFilter');
    
    if (leagueFilter) {
        leagueFilter.addEventListener('change', function() {
            if (typeof applyFilters === 'function') {
                applyFilters();
            }
        });
    }
    
    if (timeFilter) {
        timeFilter.addEventListener('change', function() {
            if (typeof applyFilters === 'function') {
                applyFilters();
            }
        });
    }
}

// Función para mostrar/ocultar columnas de admin
window.toggleAdminMode = function(isAdmin) {
    const adminColumn = document.getElementById('adminColumn');
    const adminActions = document.querySelectorAll('.admin-actions');
    
    if (isAdmin) {
        adminColumn.style.display = '';
        adminActions.forEach(action => action.style.display = '');
    } else {
        adminColumn.style.display = 'none';
        adminActions.forEach(action => action.style.display = 'none');
    }
};
