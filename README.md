# 📊 Calculadora de Cuotas

> **Aplicación web moderna para gestión inteligente de pagos mensuales con exportación PDF y recordatorios automáticos**

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/Frodo24-atr/calculadora-cuotas)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](tsconfig.json)
[![Vite](https://img.shields.io/badge/Vite-Powered-646CFF.svg)](vite.config.ts)

## 🚀 **Características Principales**

### ✨ **Gestión de Productos**
- ➕ Agregar productos con cuotas personalizadas
- ✏️ Editar información de productos existentes
- 🗑️ Eliminar productos con confirmación
- 💾 Persistencia automática en localStorage

### 📊 **Visualización de Datos**
- 📈 Gráficos interactivos con Chart.js
- 📋 Estadísticas en tiempo real
- 🎨 Diseño moderno y responsive
- 🌈 Paleta de colores elegante

### 📄 **Exportación PDF**
- 🎨 Diseño minimalista y profesional
- 📊 Reportes financieros detallados
- 🗓️ Cronogramas de pagos mensuales
- 💡 Consejos financieros inteligentes

### 📧 **Sistema de Recordatorios**
- 📅 Recordatorios automáticos por email
- ⚙️ Configuración personalizada de fechas
- 📬 Integración con EmailJS
- 🔔 Notificaciones inteligentes

## 🛠️ **Tecnologías Utilizadas**

### **Frontend**
- **JavaScript/TypeScript** - Lógica de aplicación
- **HTML5 + CSS3** - Estructura y estilos
- **Vite** - Build tool y desarrollo
- **Chart.js** - Gráficos interactivos

### **Funcionalidades**
- **jsPDF** - Generación de documentos PDF
- **EmailJS** - Envío de emails sin backend
- **PWA Ready** - Instalable como aplicación

### **Desarrollo**
- **ESLint + Prettier** - Calidad de código
- **SASS/SCSS** - Preprocesador CSS
- **Express** - Servidor de desarrollo

## 📦 **Instalación y Uso**

### **Prerrequisitos**
- Node.js 16+ 
- npm o yarn

### **Instalación**
```bash
# Clonar el repositorio
git clone https://github.com/Frodo24-atr/calculadora-cuotas.git

# Navegar al directorio
cd calculadora-cuotas

# Instalar dependencias
npm install

# Configurar EmailJS (opcional)
# Editar src/scripts/app.js con tus credenciales
```

### **Desarrollo**
```bash
# Servidor de desarrollo
npm run dev
# Acceder a http://localhost:3000

# Build para producción
npm run build

# Preview del build
npm run preview
```

### **Uso Directo**
Simplemente abre `index.html` en tu navegador para usar la aplicación sin servidor.

## 🎯 **Cómo Usar**

### 1. **Agregar Productos**
```
📱 Completa el formulario:
   • Nombre del producto
   • Valor total
   • Número de cuotas
   • Fecha de inicio
```

### 2. **Visualizar Datos**
```
📊 Dashboard automático:
   • Estadísticas en tiempo real
   • Gráficos interactivos
   • Lista de productos activos
```

### 3. **Exportar PDF**
```
📄 Reporte completo:
   • Portada con estadísticas
   • Análisis de gráficos
   • Cronograma mensual
   • Consejos financieros
```

### 4. **Configurar Recordatorios**
```
📧 Email automático:
   • Seleccionar productos
   • Configurar frecuencia
   • Personalizar mensaje
```

## 📁 **Estructura del Proyecto**

```
calculadora-cuotas/
├── 📄 index.html                 # Página principal
├── 📄 package.json              # Configuración npm
├── 📄 vite.config.ts            # Configuración Vite
├── 📄 tsconfig.json             # Configuración TypeScript
├── 📁 src/                      # Código fuente
│   ├── 📄 index.html            # HTML principal
│   ├── 📁 scripts/              # JavaScript/TypeScript
│   │   └── 📄 app.js           # Lógica principal
│   ├── 📁 styles/              # Estilos SCSS
│   └── 📁 assets/              # Recursos estáticos
├── 📁 docs/                    # Documentación
├── 📁 tests/                   # Archivos de prueba
└── 📁 backup/                  # Copias de seguridad
```

## 🎨 **Capturas de Pantalla**

### Dashboard Principal
![Dashboard](docs/screenshots/dashboard.png)

### Exportación PDF
![PDF Export](docs/screenshots/pdf-export.png)

### Configuración de Recordatorios
![Email Setup](docs/screenshots/email-setup.png)

## ⚙️ **Configuración**

### **EmailJS** (Para recordatorios)
```javascript
// En src/scripts/app.js
const emailConfig = {
  serviceId: 'TU_SERVICE_ID',
  templateId: 'TU_TEMPLATE_ID', 
  publicKey: 'TU_PUBLIC_KEY'
};
```

### **Personalización**
- Colores en `src/styles/variables.scss`
- Plantillas PDF en `generatePDF()` 
- Templates de email en EmailJS dashboard

## 🔧 **Scripts Disponibles**

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build para producción
npm run preview  # Preview del build
npm run lint     # Verificar código
npm run format   # Formatear código
npm start        # Servidor Express
```

## 🤝 **Contribuir**

1. Fork el proyecto
2. Crea tu rama (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 **Changelog**

### v1.0.0 (2025-07-01)
- ✅ Versión inicial estable
- ✅ Gestión completa de productos
- ✅ Exportación PDF minimalista
- ✅ Sistema de recordatorios por email
- ✅ Gráficos interactivos
- ✅ Diseño responsive moderno

## 📄 **Licencia**

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 👤 **Autor**

**Frodo24-atr**
- GitHub: [@Frodo24-atr](https://github.com/Frodo24-atr)

## 🙏 **Agradecimientos**

- Chart.js por los gráficos increíbles
- jsPDF por la generación de documentos
- EmailJS por el sistema de emails
- Vite por la experiencia de desarrollo

---

⭐ **¡Dale una estrella si este proyecto te fue útil!**

📧 **¿Tienes preguntas?** Abre un [issue](https://github.com/Frodo24-atr/calculadora-cuotas/issues)
