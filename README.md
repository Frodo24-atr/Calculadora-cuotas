# 💰 Calculadora de Cuotas v2.0

Una aplicación web moderna para gestionar productos y calcular cuotas con sistema de recordatorios automáticos.

## 🚀 Funcionalidades Principales

### ✅ Gestión de Productos
- ➕ Agregar productos con valor total y número de cuotas
- ✏️ Editar productos existentes
- 🗑️ Eliminar productos con confirmación
- 📊 Estadísticas y gráficos en tiempo real

### 🔔 Sistema de Recordatorios
- **💬 WhatsApp**: Recordatorios automáticos por WhatsApp Web
- **📧 Email**: Envío de recordatorios por correo electrónico
- ⏰ Configuración personalizable (1, 3 o 7 días de anticipación)
- 🗑️ Eliminación individual de recordatorios
- 🗑️ Eliminación masiva de todos los recordatorios
- 🤖 Verificación automática cada hora

### 📄 Exportación PDF
- 📝 Resumen profesional con estadísticas
- 📊 Gráfico de cuotas incluido
- 🗂️ Desglose mensual detallado por tarjetas
- 🎨 Colores consistentes con la interfaz

## 🛠️ Tecnologías Utilizadas

- **Frontend**: JavaScript ES6+, HTML5, CSS3
- **Herramientas**: Vite, TypeScript, ESLint, Prettier
- **Librerías**: Chart.js, jsPDF, EmailJS
- **Estilos**: SCSS con variables y mixins

## 📁 Estructura del Proyecto

```
📦 calculadora-cuotas/
├── 📂 src/                    # Código fuente principal
│   ├── 📄 index.html         # Aplicación principal
│   ├── 📂 config/            # Configuraciones
│   ├── 📂 modules/           # Módulos JavaScript
│   ├── 📂 scripts/           # Scripts principales
│   └── 📂 styles/            # Estilos SCSS/CSS
├── 📂 docs/                   # Documentación del proyecto
├── 📂 tests/                  # Tests y archivos de desarrollo
├── 📂 archive/                # Versiones anteriores
├── 📂 legacy-backup/          # Respaldos legacy
├── 📄 package.json           # Dependencias npm
├── 📄 vite.config.ts         # Configuración Vite
└── 📄 start-server.bat       # Servidor local para CORS
```

## 🚀 Inicio Rápido

### Opción 1: Archivo Local (Recomendado para WhatsApp)
```bash
# Abrir directamente
./src/index.html
```

### Opción 2: Servidor Local (Necesario para Email)
```bash
# Windows
./start-server.bat

# O manualmente
python -m http.server 8000
# Luego abrir: http://localhost:8000/src/
```

### Opción 3: Desarrollo con Vite
```bash
npm install
npm run dev
```

## ⚙️ Configuración de Recordatorios

### 📧 Para usar Email (EmailJS):
1. Crear cuenta en [emailjs.com](https://www.emailjs.com/)
2. Configurar servicio y plantilla
3. Completar `src/config/services.js`

### 💬 Para WhatsApp:
- ✅ Funciona inmediatamente
- Solo requiere número con código de país

## 🤝 Contribuir

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver [LICENSE](LICENSE) para detalles.

## 🏆 Características Destacadas

- 🎨 **Interfaz Moderna**: Diseño responsivo y profesional
- ⚡ **Alto Rendimiento**: Carga rápida y operaciones optimizadas  
- 🔒 **Datos Locales**: Toda la información se guarda en el navegador
- 📱 **Móvil Friendly**: Funciona perfectamente en dispositivos móviles
- 🌐 **Sin Servidor**: No requiere backend, funciona completamente en frontend

---

**Desarrollado con ❤️ para simplificar la gestión de cuotas y pagos**
