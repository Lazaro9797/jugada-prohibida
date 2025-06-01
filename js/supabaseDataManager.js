// Supabase Data Manager para La Jugada Prohibida
class SupabaseDataManager {
    constructor() {
        // Configuración de Supabase - CAMBIAR POR TUS VALORES
        this.SUPABASE_URL = 'https://faqiotknhlrdsmwwcbar.supabase.co'; // Ej: https://xxxxx.supabase.co
        this.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhcWlvdGtuaGxyZHNtd3djYmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1MzUwMDYsImV4cCI6MjA2NDExMTAwNn0._BQOSpjX64dW7vayaqLHXjH9ld_pAFXFBHyi8AVumiU';
        
        this.supabase = null;
        this.isAuthenticated = false;
        this.adminPassword = null;
        
        // Fallback a localStorage para desarrollo
        this.localStorageKey = 'la-jugada-prohibida-data';
        this.cartKey = 'la-jugada-prohibida-carrito';
        
        this.init();
    }    async init() {
        try {
            // Importar Supabase desde CDN
            if (typeof window !== 'undefined') {
                await this.loadSupabaseClient();
                await this.initializeSupabase();
                await this.setupAuthStateListener();
                
                // Verificar si hay una sesión existente
                await this.getCurrentSession();
            }
        } catch (error) {
            console.error('Error inicializando Supabase:', error);
            throw error;
        }
    }

    async loadSupabaseClient() {
        return new Promise((resolve, reject) => {
            if (window.supabase) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            script.onload = () => {
                if (window.supabase) {
                    resolve();
                } else {
                    reject(new Error('Supabase no se cargó correctamente'));
                }
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async initializeSupabase() {
        if (this.SUPABASE_URL === 'YOUR_SUPABASE_URL') {
            throw new Error('Configuración de Supabase pendiente');
        }

        this.supabase = window.supabase.createClient(this.SUPABASE_URL, this.SUPABASE_ANON_KEY);
        
        // Verificar conexión
        const { data, error } = await this.supabase.from('configuracion').select('count').limit(1);
        if (error) {
            throw error;
        }
    }    // =================== AUTENTICACIÓN ===================
    async adminLogin(email, password) {
        try {
            if (!this.supabase) {
                throw new Error('Supabase no está disponible');
            }

            // Intento de login con Supabase Auth
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                console.error('Error de autenticación:', error.message);
                return false;
            }

            if (data.user) {
                
                    this.isAuthenticated = true;
                    this.currentUser = data.user;
                    this.session = data.session;
                    return true;
            }

            return false;
        } catch (error) {
            console.error('Error en login:', error);
            return false;
        }
    }

    async checkAdminRole(userId) {
        try {
            const { data, error } = await this.supabase
                .from('admin_users')
                .select('*')
                .eq('user_id', userId)
                .eq('is_active', true)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
                console.error('Error verificando rol admin:', error);
                return false;
            }

            return data !== null;
        } catch (error) {
            console.error('Error verificando rol admin:', error);
            return false;
        }
    }

    async adminLogout() {
        try {
            if (this.supabase) {
                const { error } = await this.supabase.auth.signOut();
                if (error) {
                    console.error('Error al cerrar sesión:', error);
                }
            }
            this.isAuthenticated = false;
            this.currentUser = null;
            this.session = null;
        } catch (error) {
            console.error('Error en logout:', error);
        }
    }

    async getCurrentSession() {
        try {
            if (!this.supabase) {
                return null;
            }

            const { data: { session }, error } = await this.supabase.auth.getSession();
            
            if (error) {
                console.error('Error obteniendo sesión:', error);
                return null;
            }

            if (session && session.user) {
                
                    this.isAuthenticated = true;
                    this.currentUser = session.user;
                    this.session = session;
                    return session;
                 
            }

            return null;
        } catch (error) {
            console.error('Error obteniendo sesión:', error);
            return null;
        }
    }

    async createAdminUser(email, password, metadata = {}) {
        try {
            if (!this.supabase) {
                throw new Error('Supabase no está disponible');
            }

            // Solo permitir crear usuarios admin si ya estamos autenticados como admin
            if (!this.isAuthenticated) {
                throw new Error('Se requiere autenticación de administrador');
            }

            // Crear usuario en Supabase Auth
            const { data, error } = await this.supabase.auth.admin.createUser({
                email: email,
                password: password,
                email_confirm: true,
                user_metadata: {
                    role: 'admin',
                    ...metadata
                }
            });

            if (error) {
                throw error;
            }

            // Agregar a la tabla admin_users
            const { error: insertError } = await this.supabase
                .from('admin_users')
                .insert({
                    user_id: data.user.id,
                    email: email,
                    is_active: true,
                    created_at: new Date().toISOString(),
                    created_by: this.currentUser.id
                });

            if (insertError) {
                console.error('Error agregando a admin_users:', insertError);
                // Opcional: eliminar usuario creado si falla la inserción
            }
            return data.user;
        } catch (error) {
            console.error('Error creando usuario admin:', error);
            throw error;
        }
    }

    async setupAuthStateListener() {
        if (!this.supabase) {
            return;
        }

        // Escuchar cambios en el estado de autenticación
        this.supabase.auth.onAuthStateChange(async (event, session) => {
            
            if (event === 'SIGNED_IN' && session) {
                    this.isAuthenticated = true;
                    this.currentUser = session.user;
                    this.session = session;
              
            } else if (event === 'SIGNED_OUT') {
                this.isAuthenticated = false;
                this.currentUser = null;
                this.session = null;
            }
        });
    }

    // Método de compatibilidad para login simple con password
    async adminLoginPassword(password) {
        try {
            if (this.supabase) {
                const { data, error } = await this.supabase
                    .from('configuracion')
                    .select('valor')
                    .eq('clave', 'admin_password')
                    .single();

                if (error) throw error;
                if (data.valor === password) {
                    this.isAuthenticated = true;
                    this.adminPassword = password;
                    return true;
                }
                return false;
            } else {
                throw new Error('Supabase no está disponible');
            }
        } catch (error) {
            console.error('Error en login:', error);
            return false;
        }
    }// =================== LIGAS ===================
    async getLigas() {
        try {
            if (this.supabase) {
                const { data, error } = await this.supabase
                    .from('ligas')
                    .select('*')
                    .eq('activa', true)
                    .order('nombre');

                if (error) throw error;
                
                // Convertir todas las ligas de snake_case a camelCase
                return (data || []).map(liga => this.convertLigaFromDB(liga));
            } else {
                throw new Error('Supabase no está disponible');
            }
        } catch (error) {
            console.error('Error obteniendo ligas:', error);
            return [];
        }
    }    async getLigaById(id) {
        try {
            if (this.supabase) {
                const { data, error } = await this.supabase
                    .from('ligas')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;
                
                // Convertir de snake_case a camelCase
                return this.convertLigaFromDB(data);
            } else {
                throw new Error('Supabase no está disponible');
            }
        } catch (error) {
            console.error('Error obteniendo liga:', error);
            return null;
        }
    }

    async addLiga(liga) {
        if (!this.isAuthenticated) {
            throw new Error('No autorizado');
        }

        try {
            if (this.supabase) {
                const { data, error } = await this.supabase
                    .from('ligas')
                    .insert([{
                        nombre: liga.nombre,
                        codigo: liga.codigo,
                        icono: liga.icono,                        tipos_apuesta: liga.tiposApuesta || [],
                        plantilla_cuotas: liga.plantillaCuotas || {}
                    }])
                    .select()
                    .single();                if (error) throw error;
                
                // Convertir de snake_case a camelCase antes de devolver
                return this.convertLigaFromDB(data);
            } else {
                throw new Error('Supabase no está disponible');
            }
        } catch (error) {
            console.error('Error agregando liga:', error);
            throw error;
        }
    }async updateLiga(id, updates) {
        if (!this.isAuthenticated) {
            throw new Error('No autorizado');
        }

        try {
            if (this.supabase) {
                // Convertir camelCase a snake_case para Supabase
                const supabaseUpdates = {};
                Object.keys(updates).forEach(key => {
                    if (key === 'plantillaCuotas') {
                        supabaseUpdates['plantilla_cuotas'] = updates[key];
                    } else if (key === 'tiposApuesta') {
                        supabaseUpdates['tipos_apuesta'] = updates[key];
                    } else {
                        supabaseUpdates[key] = updates[key];
                    }
                });

                const { data, error } = await this.supabase
                    .from('ligas')
                    .update(supabaseUpdates)
                    .eq('id', id)
                    .select()
                    .single();                if (error) throw error;
                
                // Convertir respuesta de snake_case a camelCase
                return this.convertLigaFromDB(data);
            } else {
                throw new Error('Supabase no está disponible');
            }
        } catch (error) {
            console.error('Error actualizando liga:', error);
            throw error;
        }
    }

    // Función auxiliar para convertir ligas de snake_case (DB) a camelCase (JS)
    convertLigaFromDB(ligaDB) {
        if (!ligaDB) return null;
        
        return {
            ...ligaDB,
            tiposApuesta: ligaDB.tipos_apuesta,
            plantillaCuotas: ligaDB.plantilla_cuotas,
            // Remover las versiones snake_case
            tipos_apuesta: undefined,
            plantilla_cuotas: undefined
        };
    }

    async deleteLiga(id) {
        if (!this.isAuthenticated) {
            throw new Error('No autorizado');
        }

        try {
            if (this.supabase) {
                const { error } = await this.supabase
                    .from('ligas')
                    .delete()
                    .eq('id', id);                if (error) throw error;
                return true;
            } else {
                throw new Error('Supabase no está disponible');
            }
        } catch (error) {
            console.error('Error eliminando liga:', error);
            throw error;
        }
    }

    // =================== PARTIDOS ===================
    // Método auxiliar para normalizar formato de partidos
    normalizePartido(partido) {
        try {
            const normalizedPartido = {
                ...partido,
                id: partido.id,
                ligaId: partido.liga_id,
                liga_id: partido.liga_id,
                local: partido.local,
                visitante: partido.visitante,
                hora: partido.hora,
                cuotas: partido.cuotas || {},
                activo: partido.activo !== false
            };

            // Only include active league info
            if (partido.ligas && partido.ligas.activa !== false) {
                normalizedPartido.liga = {
                    id: partido.ligas.id,
                    nombre: partido.ligas.nombre,
                    codigo: partido.ligas.codigo,
                    icono: partido.ligas.icono,
                    tiposApuesta: partido.ligas.tipos_apuesta || [],
                    activa: partido.ligas.activa !== false
                };
            }

            return normalizedPartido;
        } catch (error) {
            console.error('❌ Error normalizing match:', error);
            throw error;
        }
    }    async getPartidos() {
        try {
            if (this.supabase) {
                // Obtener partidos con su información de liga
                const { data, error } = await this.supabase
                    .from('partidos')
                    .select(`
                        *,
                        ligas (
                            id,
                            nombre,
                            codigo,
                            icono,
                            tipos_apuesta
                        )
                    `)
                    .eq('activo', true)
                    .order('hora');

                if (error) throw error;                
                // No remapear los campos ya que ligas es el estándar
                return data || [];
            } else {
                throw new Error('Supabase no está disponible');
            }
        } catch (error) {
            console.error('❌ Error fetching matches:', error);
            return [];
        }
    }

    async getPartidosByLiga(ligaId) {
        try {
            if (this.supabase) {
                const { data, error } = await this.supabase
                    .from('partidos')
                    .select('*')
                    .eq('liga_id', ligaId)
                    .eq('activo', true)
                    .order('hora');                if (error) throw error;
                return data || [];
            } else {
                throw new Error('Supabase no está disponible');
            }
        } catch (error) {
            console.error('Error obteniendo partidos por liga:', error);
            return [];
        }
    }

    async addPartido(partido) {
        if (!this.isAuthenticated) {
            throw new Error('No autorizado');
        }

        try {
            if (this.supabase) {
                // Convertir a formato de base de datos
                const partidoDB = {
                    liga_id: partido.liga,
                    local: partido.local,
                    visitante: partido.visitante,
                    hora: partido.hora,
                    created_at: partido.fechaCreacion || new Date().toISOString(),
                    cuotas: partido.cuotas || {},
                    activo: true
                };

                const { data, error } = await this.supabase
                    .from('partidos')
                    .insert([partidoDB])
                    .select()
                    .single();

                if (error) throw error;
                return data;
            } else {
                throw new Error('Supabase no está disponible');
            }
        } catch (error) {
            console.error('Error agregando partido:', error);
            throw error;
        }
    }

    async updatePartido(id, updates) {
        if (!this.isAuthenticated) {
            throw new Error('No autorizado');
        }

        try {
            if (this.supabase) {
                // Convertir camelCase a snake_case para Supabase
                const supabaseUpdates = {};
                Object.keys(updates).forEach(key => {
                    if (key === 'ligaId') {
                        supabaseUpdates['liga_id'] = updates[key];
                    } else {
                        supabaseUpdates[key] = updates[key];
                    }
                });

                const { data, error } = await this.supabase
                    .from('partidos')
                    .update(supabaseUpdates)
                    .eq('id', id)
                    .select()
                    .single();
                
                if (error) throw error;
                return data;
            } else {
                throw new Error('Supabase no está disponible');
            }
        } catch (error) {
            console.error('Error actualizando partido:', error);
            throw error;
        }
    }

    async deletePartido(id) {
        if (!this.isAuthenticated) {
            throw new Error('No autorizado');
        }

        try {
            if (this.supabase) {
                // En lugar de eliminar, marcamos como inactivo
                const { error } = await this.supabase
                    .from('partidos')
                    .update({ activo: false })
                    .eq('id', id);

                if (error) throw error;
                return true;
            } else {
                throw new Error('Supabase no está disponible');
            }
        } catch (error) {
            console.error('Error eliminando partido:', error);
            throw error;
        }
    }

    // =================== CONFIGURACIÓN ===================
    async getConfiguracion() {
        try {
            if (this.supabase) {
                const { data, error } = await this.supabase
                    .from('configuracion')
                    .select('*');

                if (error) throw error;

                // Convertir array de registros a objeto clave-valor
                const config = {};
                (data || []).forEach(item => {
                    config[item.clave] = item.valor;
                });
                
                return config;
            } else {
                throw new Error('Supabase no está disponible');
            }
        } catch (error) {
            console.error('Error obteniendo configuración:', error);
            return {};
        }
    }

    async updateConfiguracion(config) {
        if (!this.isAuthenticated) {
            throw new Error('No autorizado');
        }

        try {
            if (this.supabase) {
                // Convertir objeto a array de registros
                const updates = Object.entries(config).map(([clave, valor]) => ({
                    clave,
                    valor
                }));

                // Usar upsert para insertar o actualizar
                const { error } = await this.supabase
                    .from('configuracion')
                    .upsert(updates, {
                        onConflict: 'clave'
                    });

                if (error) throw error;
                return true;
            } else {
                throw new Error('Supabase no está disponible');
            }
        } catch (error) {
            console.error('Error actualizando configuración:', error);
            throw error;
        }
    }

    // =================== APUESTAS (CARRITO) ===================
    async addApuesta(apuesta) {
        try {
            if (this.supabase) {
                const apuestaDB = {
                    partido_id: apuesta.partidoId,
                    tipo_apuesta: apuesta.tipoApuesta,
                    cuota: apuesta.cuota,
                    monto: apuesta.monto,
                    fecha: new Date().toISOString(),
                    ip_usuario: this.getUserIP(),
                    estado: 'pendiente'
                };

                const { data, error } = await this.supabase
                    .from('apuestas')
                    .insert([apuestaDB])
                    .select()
                    .single();

                if (error) throw error;
                return data;
            } else {
                throw new Error('Supabase no está disponible');
            }
        } catch (error) {
            console.error('Error agregando apuesta:', error);
            throw error;
        }
    }

    // =================== CARRITO ===================
    getCart() {
        try {
            // El carrito se mantiene en localStorage por ahora
            const cartData = localStorage.getItem(this.cartKey);
            return cartData ? JSON.parse(cartData) : [];
        } catch (error) {
            console.error('Error obteniendo carrito:', error);
            return [];
        }
    }

    addToCart(item) {
        try {
            const cart = this.getCart();
            cart.push({
                ...item,
                id: Date.now() // ID temporal
            });
            localStorage.setItem(this.cartKey, JSON.stringify(cart));
            return true;
        } catch (error) {
            console.error('Error agregando al carrito:', error);
            return false;
        }
    }

    clearCart() {
        try {
            localStorage.removeItem(this.cartKey);
            return true;
        } catch (error) {
            console.error('Error limpiando carrito:', error);
            return false;
        }
    }

    removeFromCart(id) {
        try {
            const cart = this.getCart();
            const updatedCart = cart.filter(item => item.id !== id);
            localStorage.setItem(this.cartKey, JSON.stringify(updatedCart));
            return true;
        } catch (error) {
            console.error('Error removiendo del carrito:', error);
            return false;
        }
    }

    getUserIP() {
        // Simplificado - en producción usar un servicio real
        return 'unknown';
    }

    // =================== MÉTODOS DE COMPATIBILIDAD ===================
    getData() {
        // Método para compatibilidad con el código existente
        return {
            ligas: [],
            partidos: [],
            configuracion: {}
        };
    }

    saveData(data) {
        // Método para compatibilidad - no usado en Supabase
        console.warn('saveData() no disponible con Supabase');
    }

    // =================== MIGRACIÓN ===================
    async migrateFromLocalStorage() {
        if (!this.isAuthenticated) {
            throw new Error('No autorizado para migrar datos');
        }

        try {
            const localData = JSON.parse(localStorage.getItem(this.localStorageKey) || '{}');
            
            if (localData.ligas) {
                for (const liga of localData.ligas) {
                    await this.addLiga(liga);
                }
            }

            if (localData.partidos) {
                for (const partido of localData.partidos) {
                    await this.addPartido(partido);
                }
            }

            if (localData.configuracion) {
                await this.updateConfiguracion(localData.configuracion);
            }
            return true;
        } catch (error) {
            console.error('❌ Error en migración:', error);
            throw error;
        }
    }

    // =================== OPERACIONES DE DATOS ===================
    async clearAllData() {
        if (!this.isAuthenticated) {
            throw new Error('No autorizado');
        }

        try {
            if (this.supabase) {
                // Desactivar todos los partidos en lugar de eliminarlos
                const { error: partidosError } = await this.supabase
                    .from('partidos')
                    .update({ activo: false })
                    .neq('activo', false);
                
                if (partidosError) throw partidosError;

                // Desactivar todas las ligas en lugar de eliminarlas
                const { error: ligasError } = await this.supabase
                    .from('ligas')
                    .update({ activa: false })
                    .neq('activa', false);
                
                if (ligasError) throw ligasError;

                // Limpiar configuración
                const { error: configError } = await this.supabase
                    .from('configuracion')
                    .delete()
                    .neq('clave', '');
                
                if (configError) throw configError;

                return true;
            } else {
                throw new Error('Supabase no está disponible');
            }
        } catch (error) {
            console.error('Error limpiando datos:', error);
            throw error;
        }
    }

    async resetToDefault() {
        if (!this.isAuthenticated) {
            throw new Error('No autorizado');
        }

        try {
            if (!this.supabase) {
                throw new Error('Supabase no está disponible');
            }

            // Primero limpiar todos los datos existentes
            await this.clearAllData();

            // Datos por defecto
            const defaultLigas = [
                {
                    nombre: 'Premier League',
                    codigo: 'PL',
                    icono: '🏴',
                    tipos_apuesta: [
                        { id: '1', label: 'Local', custom: false },
                        { id: 'X', label: 'Empate', custom: false },
                        { id: '2', label: 'Visitante', custom: false }
                    ],
                    plantilla_cuotas: {
                        '1': 2.00,
                        'X': 3.20,
                        '2': 3.50
                    },
                    activa: true
                },
                {
                    nombre: 'LaLiga',
                    codigo: 'ESP',
                    icono: '🇪🇸',
                    tipos_apuesta: [
                        { id: '1', label: 'Local', custom: false },
                        { id: 'X', label: 'Empate', custom: false },
                        { id: '2', label: 'Visitante', custom: false }
                    ],
                    plantilla_cuotas: {
                        '1': 2.10,
                        'X': 3.00,
                        '2': 3.30
                    },
                    activa: true
                }
            ];

            // Insertar ligas por defecto
            const { error: ligasError } = await this.supabase
                .from('ligas')
                .insert(defaultLigas);

            if (ligasError) throw ligasError;            // Configuración por defecto
            const defaultConfig = [
                { clave: 'evento_titulo', valor: 'Evento Principal - Mayo 2025', descripcion: 'Título principal del evento' },
                { clave: 'evento_descripcion', valor: 'Las mejores cuotas para los partidos más emocionantes', descripcion: 'Descripción del evento' },
                { clave: 'evento_fecha_iso', valor: '2025-05-24', descripcion: 'Fecha del evento en formato ISO' },
                { clave: 'evento_fecha', valor: '24 de Mayo de 2025', descripcion: 'Fecha del evento en texto personalizado' },
                { clave: 'zona_horaria', valor: 'UTC-5', descripcion: 'Zona horaria del evento' },
                { clave: 'whatsapp', valor: '+1234567890', descripcion: 'Número de WhatsApp para contacto' }
            ];

            const { error: configError } = await this.supabase
                .from('configuracion')
                .insert(defaultConfig);

            if (configError) throw configError;

            return true;
        } catch (error) {
            console.error('Error reseteando datos:', error);
            throw error;
        }
    }

    // Métodos para gestionar configuración
    async getConfiguration() {
        try {
            if (this.supabase) {
                const { data, error } = await this.supabase
                    .from('configuracion')
                    .select('*')
                    .order('clave');

                if (error) throw error;

                // Convertir array a objeto para fácil acceso
                const config = {};
                data.forEach(item => {
                    config[item.clave] = item.valor;
                });

                return config;
            } else {
                // Fallback local
                const stored = localStorage.getItem(this.localStorageKey + '-config');
                return stored ? JSON.parse(stored) : {
                    evento_titulo: 'Evento Principal - Mayo 2025',
                    evento_descripcion: 'Las mejores cuotas para los partidos más emocionantes',
                    evento_fecha: '24 de Mayo de 2025',
                    evento_fecha_iso: '2025-05-24',
                    zona_horaria: 'UTC-5',
                    whatsapp: '+1234567890'
                };
            }
        } catch (error) {
            console.error('Error obteniendo configuración:', error);
            throw error;
        }
    }

    async updateConfiguration(clave, valor, descripcion = null) {
        try {
            if (this.supabase) {
                const { error } = await this.supabase
                    .from('configuracion')
                    .upsert({ 
                        clave, 
                        valor, 
                        descripcion,
                        updated_at: new Date().toISOString()
                    });

                if (error) throw error;
                return true;
            } else {
                // Fallback local
                const stored = localStorage.getItem(this.localStorageKey + '-config');
                const config = stored ? JSON.parse(stored) : {};
                config[clave] = valor;
                localStorage.setItem(this.localStorageKey + '-config', JSON.stringify(config));
                return true;
            }
        } catch (error) {
            console.error('Error actualizando configuración:', error);
            throw error;
        }
    }

    async updateMultipleConfiguration(configs) {
        try {
            if (this.supabase) {
                const updates = configs.map(config => ({
                    clave: config.clave,
                    valor: config.valor,
                    descripcion: config.descripcion || null,
                    updated_at: new Date().toISOString()
                }));

                const { error } = await this.supabase
                    .from('configuracion')
                    .upsert(updates);

                if (error) throw error;
                return true;
            } else {
                // Fallback local
                const stored = localStorage.getItem(this.localStorageKey + '-config');
                const config = stored ? JSON.parse(stored) : {};
                
                configs.forEach(item => {
                    config[item.clave] = item.valor;
                });
                
                localStorage.setItem(this.localStorageKey + '-config', JSON.stringify(config));
                return true;
            }
        } catch (error) {
            console.error('Error actualizando múltiples configuraciones:', error);
            throw error;
        }
    }

    async deleteConfiguration(clave) {
        try {
            if (this.supabase) {
                const { error } = await this.supabase
                    .from('configuracion')
                    .delete()
                    .eq('clave', clave);

                if (error) throw error;
                return true;
            } else {
                // Fallback local
                const stored = localStorage.getItem(this.localStorageKey + '-config');
                const config = stored ? JSON.parse(stored) : {};
                delete config[clave];
                localStorage.setItem(this.localStorageKey + '-config', JSON.stringify(config));
                return true;
            }
        } catch (error) {
            console.error('Error eliminando configuración:', error);
            throw error;
        }
    }
}
