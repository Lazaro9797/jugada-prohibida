-- Schema CORREGIDO para La Jugada Prohibida
-- Ejecutar este SQL en Supabase SQL Editor

-- Crear tabla de ligas
CREATE TABLE IF NOT EXISTS ligas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    codigo VARCHAR(10) NOT NULL UNIQUE,
    icono VARCHAR(10) NOT NULL,
    tipos_apuesta JSONB NOT NULL DEFAULT '[]',
    plantilla_cuotas JSONB DEFAULT '{}',
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de partidos
CREATE TABLE IF NOT EXISTS partidos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    hora TIME NOT NULL,
    liga_id UUID REFERENCES ligas(id) ON DELETE CASCADE,
    local VARCHAR(100) NOT NULL,
    visitante VARCHAR(100) NOT NULL,
    cuotas JSONB NOT NULL DEFAULT '{}',
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de configuración
CREATE TABLE IF NOT EXISTS configuracion (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clave VARCHAR(50) NOT NULL UNIQUE,
    valor TEXT,
    descripcion TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de apuestas (para el carrito)
CREATE TABLE IF NOT EXISTS apuestas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    partido_id UUID REFERENCES partidos(id) ON DELETE CASCADE,
    tipo_apuesta VARCHAR(20) NOT NULL,
    cuota DECIMAL(5,2) NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    ganancia_potencial DECIMAL(10,2) NOT NULL,
    usuario_ip VARCHAR(45), -- Para identificar usuario sin login
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de sesiones de admin (para RLS personalizado)
CREATE TABLE IF NOT EXISTS admin_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour')
);

-- Insertar configuración inicial (solo si no existe)
INSERT INTO configuracion (clave, valor, descripcion) 
SELECT 'fecha_evento', '24 de Mayo de 2025', 'Fecha del evento principal'
WHERE NOT EXISTS (SELECT 1 FROM configuracion WHERE clave = 'fecha_evento');

INSERT INTO configuracion (clave, valor, descripcion) 
SELECT 'zona_horaria', 'GMT-3', 'Zona horaria del evento'
WHERE NOT EXISTS (SELECT 1 FROM configuracion WHERE clave = 'zona_horaria');

INSERT INTO configuracion (clave, valor, descripcion) 
SELECT 'whatsapp', '5356094855', 'Número de WhatsApp para consultas'
WHERE NOT EXISTS (SELECT 1 FROM configuracion WHERE clave = 'whatsapp');

INSERT INTO configuracion (clave, valor, descripcion) 
SELECT 'admin_password', 'admin123', 'Contraseña del administrador'
WHERE NOT EXISTS (SELECT 1 FROM configuracion WHERE clave = 'admin_password');

-- OPCIÓN 1: DESACTIVAR RLS COMPLETAMENTE (más simple para GitHub Pages)
-- Esto permite el funcionamiento sin autenticación de Supabase
ALTER TABLE ligas DISABLE ROW LEVEL SECURITY;
ALTER TABLE partidos DISABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion DISABLE ROW LEVEL SECURITY;
ALTER TABLE apuestas DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions DISABLE ROW LEVEL SECURITY;

-- OPCIÓN 2: RLS PERSONALIZADO (comentado por ahora)
-- Si quieres usar RLS más adelante, descomenta estas líneas y comenta las líneas DISABLE de arriba

/*
-- Función para verificar si existe una sesión de admin válida
CREATE OR REPLACE FUNCTION is_admin_authenticated() RETURNS BOOLEAN AS $$
BEGIN
    -- Por simplicidad, permitimos todas las operaciones admin por ahora
    -- En una implementación completa, verificarías el token de sesión
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Habilitar RLS
ALTER TABLE ligas ENABLE ROW LEVEL SECURITY;
ALTER TABLE partidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;
ALTER TABLE apuestas ENABLE ROW LEVEL SECURITY;

-- Políticas para ligas
DROP POLICY IF EXISTS "Todos pueden ver ligas" ON ligas;
DROP POLICY IF EXISTS "Solo admin puede insertar ligas" ON ligas;
DROP POLICY IF EXISTS "Solo admin puede actualizar ligas" ON ligas;
DROP POLICY IF EXISTS "Solo admin puede eliminar ligas" ON ligas;

CREATE POLICY "Todos pueden ver ligas" ON ligas FOR SELECT USING (true);
CREATE POLICY "Admin puede insertar ligas" ON ligas FOR INSERT WITH CHECK (is_admin_authenticated());
CREATE POLICY "Admin puede actualizar ligas" ON ligas FOR UPDATE USING (is_admin_authenticated());
CREATE POLICY "Admin puede eliminar ligas" ON ligas FOR DELETE USING (is_admin_authenticated());

-- Políticas para partidos
DROP POLICY IF EXISTS "Todos pueden ver partidos" ON partidos;
DROP POLICY IF EXISTS "Solo admin puede insertar partidos" ON partidos;
DROP POLICY IF EXISTS "Solo admin puede actualizar partidos" ON partidos;
DROP POLICY IF EXISTS "Solo admin puede eliminar partidos" ON partidos;

CREATE POLICY "Todos pueden ver partidos" ON partidos FOR SELECT USING (true);
CREATE POLICY "Admin puede insertar partidos" ON partidos FOR INSERT WITH CHECK (is_admin_authenticated());
CREATE POLICY "Admin puede actualizar partidos" ON partidos FOR UPDATE USING (is_admin_authenticated());
CREATE POLICY "Admin puede eliminar partidos" ON partidos FOR DELETE USING (is_admin_authenticated());

-- Políticas para configuración
DROP POLICY IF EXISTS "Todos pueden ver configuracion" ON configuracion;
DROP POLICY IF EXISTS "Solo admin puede modificar configuracion" ON configuracion;

CREATE POLICY "Todos pueden ver configuracion" ON configuracion FOR SELECT USING (true);
CREATE POLICY "Admin puede modificar configuracion" ON configuracion FOR ALL USING (is_admin_authenticated());

-- Políticas para apuestas
DROP POLICY IF EXISTS "Usuarios pueden crear apuestas" ON apuestas;
DROP POLICY IF EXISTS "Usuarios pueden ver sus apuestas" ON apuestas;

CREATE POLICY "Usuarios pueden crear apuestas" ON apuestas FOR INSERT WITH CHECK (true);
CREATE POLICY "Usuarios pueden ver sus apuestas" ON apuestas FOR SELECT USING (true);
*/

-- Crear función para limpiar sesiones expiradas
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM admin_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Crear función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear triggers para actualizar timestamps (solo si no existen)
DROP TRIGGER IF EXISTS update_ligas_updated_at ON ligas;
CREATE TRIGGER update_ligas_updated_at BEFORE UPDATE ON ligas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_partidos_updated_at ON partidos;
CREATE TRIGGER update_partidos_updated_at BEFORE UPDATE ON partidos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_configuracion_updated_at ON configuracion;
CREATE TRIGGER update_configuracion_updated_at BEFORE UPDATE ON configuracion
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Schema de La Jugada Prohibida creado exitosamente!';
    RAISE NOTICE 'RLS desactivado para compatibilidad con GitHub Pages';
    RAISE NOTICE 'Ejecuta las queries de prueba para verificar el funcionamiento';
END $$;

-- QUERIES DE PRUEBA (opcional - copiar y ejecutar por separado)
/*
-- Verificar tablas creadas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('ligas', 'partidos', 'configuracion', 'apuestas', 'admin_sessions');

-- Verificar configuración inicial
SELECT * FROM configuracion;

-- Insertar liga de prueba
INSERT INTO ligas (nombre, codigo, icono, tipos_apuesta) VALUES
('Liga de Prueba', 'TEST', '⚽', '[{"id":"1","label":"1 (Local)","custom":false}]');

-- Verificar liga insertada
SELECT * FROM ligas;

-- Limpiar datos de prueba
DELETE FROM ligas WHERE codigo = 'TEST';
*/
