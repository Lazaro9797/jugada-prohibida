# 🎰 La Jugada Prohibida - Casa de Apuestas

Una aplicación web moderna para gestionar apuestas deportivas con interfaz profesional y funcionalidades completas.

## 🌐 Demo en Vivo
**[Ver Demo en GitHub Pages](https://tu-usuario.github.io/la-jugada-prohibida/)**

## 🚀 Características Principales

### 🎯 Para Usuarios
- **🏆 Interfaz Moderna**: Diseño profesional con gradientes y efectos visuales
- **🛒 Carrito de Apuestas**: Sistema completo de gestión de apuestas
- **📱 Integración WhatsApp**: Envío automático de boletos con formato profesional
- **📊 Cuotas en Tiempo Real**: Sistema de cuotas dinámico y validado
- **🎨 Diseño Responsive**: Perfectamente adaptado para móviles y escritorio
- **⏰ Formato 12 Horas**: Hora en formato AM/PM más amigable
- **🔍 Vista Previa**: Previsualización de mensajes antes de enviar

### ⚙️ Para Administradores
- **🔐 Panel Seguro**: Autenticación con contraseña (`admin123`)
- **⚽ Gestión Completa**: Agregar, editar y eliminar partidos
- **🌍 Configuración Global**: Fecha, zona horaria, número de WhatsApp
- **💾 Persistencia de Datos**: Almacenamiento local automático
- **📤 Backup/Restore**: Exportar e importar datos en JSON
- **🎯 Validación de Cuotas**: Verificación automática de coherencia

## 🛠️ Tecnologías

- **Frontend**: HTML5, CSS3 (Variables CSS, Flexbox, Grid)
- **JavaScript**: ES6+, LocalStorage API, Responsive Design
- **Icons**: Font Awesome 6.5.0
- **Deployment**: GitHub Pages
- **Mobile**: Progressive Web App features

## 🛠️ Instalación y Desarrollo

### Prerrequisitos
- Node.js (para servidor de desarrollo local)
- Git
- Navegador web moderno

### Instalación Local
```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/la-jugada-prohibida.git
cd la-jugada-prohibida

# Instalar dependencias
npm install

# Ejecutar servidor de desarrollo
npm start
```

La aplicación estará disponible en `http://localhost:3000`

## 🌐 Despliegue en GitHub Pages

### Configuración Automática
```bash
# Configurar GitHub Pages con gh-pages
npm run deploy
```

### Configuración Manual
1. Ve a tu repositorio en GitHub
2. Settings → Pages
3. Source: Deploy from a branch
4. Branch: `main` / `(root)`
5. Save

La aplicación estará disponible en: `https://tu-usuario.github.io/la-jugada-prohibida/`

## 📱 Uso de la Aplicación

### Para Usuarios
1. **Navegar cuotas**: Haz clic en cualquier cuota para agregarla al carrito
2. **Gestionar carrito**: Usa el botón 🛒 en la esquina superior derecha
3. **Ajustar montos**: Modifica los montos de apuesta en el carrito
4. **Enviar apuesta**: Presiona "📱 Enviar por WhatsApp" para generar mensaje automático

### Para Administradores
1. **Acceder**: Haz clic en el botón "⚙️ Admin" (esquina inferior izquierda)
2. **Login**: Ingresa la contraseña `admin123`
3. **Gestionar**: Usa el panel para agregar/editar partidos y configuración

## 🗂️ Estructura del Proyecto

```
la-jugada-prohibida/
├── index.html              # Página principal
├── package.json            # Configuración npm
├── README.md               # Este archivo
├── data.json               # Datos iniciales
├── reglamento.html         # Página de reglamento (opcional)
└── js/
    ├── dataManager.js      # Gestión de datos y localStorage
    ├── cartManager.js      # Sistema de carrito de apuestas
    ├── adminPanel.js       # Panel de administración
    └── main.js             # Lógica principal de la aplicación
```

## 🔧 Configuración

### Configuración de WhatsApp
```javascript
// En el panel de administración, configurar:
{
  "whatsapp": "5219999999999", // Número sin + y sin espacios
  "fecha": "24 de Mayo 2025",
  "zona_horaria": "Cuba (-04:00 UTC)"
}
```

### Contraseña de Administrador
Por defecto: `admin123`

Para cambiar la contraseña, modifica en `js/dataManager.js`:
```javascript
adminLogin(password) {
    if (password === 'TU_NUEVA_CONTRASEÑA') {
        // ...
    }
}
```

## 📊 Funcionalidades Avanzadas

### Sistema de Carrito
- Selección múltiple de apuestas
- Cálculo automático de cuotas combinadas
- Persistencia entre sesiones
- Validación de montos

### Panel de Administración
- Interfaz drag-and-drop para cuotas
- Validación automática de datos
- Backup automático en localStorage
- Previsualización en tiempo real

### Integración WhatsApp
- Mensajes formateados automáticamente
- Cálculo de ganancias estimadas
- Enlaces directos a chat
- Soporte para apuestas combinadas

## 🔒 Seguridad

- **Autenticación local**: No envía contraseñas por internet
- **Datos locales**: Todo se almacena en el navegador del usuario
- **Sin base de datos externa**: Compatible con hosting estático
- **HTTPS requerido**: Para funcionalidad completa en producción

## 🚀 Ideas de Mejoras Futuras

1. **Notificaciones push** para resultados
2. **Historial de apuestas** con estadísticas
3. **Sistema de usuarios** con perfiles
4. **API de cuotas en vivo** (requeriría backend)
5. **Tema oscuro/claro** personalizable
6. **Exportación a PDF** de tickets de apuesta
7. **Sistema de favoritos** para equipos
8. **Calculadora de apuestas** avanzada

## 🐛 Troubleshooting

### Problemas Comunes

**Error: No se guardan los datos**
- Verifica que localStorage esté habilitado
- Comprueba que no estés en modo incógnito

**Error: No aparece el carrito**
- Verifica que JavaScript esté habilitado
- Revisa la consola del navegador para errores

**Error: WhatsApp no abre**
- Verifica que el número esté configurado correctamente
- Comprueba que la aplicación esté en HTTPS

### Debug Mode
Abre la consola del navegador y usa:
```javascript
// Acceder a todas las funciones de debug
window.laJugadaProhibida

// Exportar datos
window.laJugadaProhibida.exportData()

// Validar cuotas
window.laJugadaProhibida.validateBetOdds()
```

## 📄 Licencia

MIT License - Libre para uso personal y comercial.

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! 

1. Fork el proyecto
2. Crea tu feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Soporte

Para soporte técnico o preguntas:
- Crear un Issue en GitHub
- Contactar por WhatsApp (configurado en la app)

---

**⚽ ¡Hecho con pasión para los amantes de las apuestas deportivas! 🚀**
