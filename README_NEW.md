# 💰 Calculadora de Cuotas - v2025.06.29

Una aplicación web moderna para gestionar productos y calcular cuotas de forma inteligente.

![Version](https://img.shields.io/badge/version-2025.06.29-blue)
![Status](https://img.shields.io/badge/status-✅%20Completamente%20Funcional-green)
![Tech](https://img.shields.io/badge/tech-JavaScript%20+%20Vite%20+%20SCSS-orange)

## 🎯 **Estado Actual del Proyecto**

✅ **PROYECTO COMPLETAMENTE MODERNIZADO Y FUNCIONAL**

### 🚀 **Características Principales**

- **📝 Gestión de Productos**: Agregar, editar y eliminar productos con cuotas
- **📊 Estadísticas en Tiempo Real**: Visualización de datos financieros
- **📈 Gráficos Interactivos**: Charts dinámicos con Chart.js
- **📄 Exportación PDF**: Reportes completos con jsPDF
- **💾 Persistencia de Datos**: Almacenamiento local automático
- **📱 Diseño Responsivo**: Optimizado para todos los dispositivos
- **🎨 UI Moderna**: Interfaz hermosa con gradientes y animaciones

### 🛠️ **Tecnologías Utilizadas**

- **JavaScript ES6+** - Lógica principal de la aplicación
- **Vite** - Build tool moderno y servidor de desarrollo
- **SCSS/CSS** - Estilos modernos con variables y mixins
- **Chart.js** - Gráficos interactivos
- **jsPDF** - Generación de reportes PDF
- **ESLint + Prettier** - Calidad y formato de código

### 📁 **Estructura del Proyecto**

```
src/
├── index.html              # Archivo principal HTML
├── scripts/
│   ├── app.js              # Aplicación principal (JavaScript)
│   ├── app-simplified.ts   # Versión TypeScript simplificada
│   └── app.ts              # Versión TypeScript modular completa
├── styles/
│   ├── fallback.css        # Estilos CSS de producción
│   ├── main.scss           # Estilos SCSS principales
│   ├── _variables.scss     # Variables de diseño
│   └── _mixins.scss        # Mixins reutilizables
├── modules/                # Módulos TypeScript (legacy)
└── types/                  # Definiciones de tipos TypeScript

legacy-backup/              # Código legacy migrado
docs/                       # Documentación del proyecto
```

## 🎨 **Características de UI/UX**

### ✅ **Fixes Implementados**
- **Sin border-radius** en la sección PDF (según requerimientos específicos)
- **Modales con z-index alto** (9999/10000) para aparecer siempre arriba
- **Sin solapamiento** del layout principal
- **Carga instantánea** sin problemas de loading infinito

### 🎯 **Diseño Visual**
- Gradientes modernos en header y botones
- Cards con sombras elegantes y bordes redondeados
- Efectos hover y transiciones suaves
- Paleta de colores profesional
- Tipografía optimizada para legibilidad

## 🚀 **Instalación y Uso**

### 1. **Clonar el Repositorio**
```bash
git clone https://github.com/Frodo24-atr/Calculadora-cuotas.git
cd Calculadora-cuotas
```

### 2. **Instalar Dependencias**
```bash
npm install
```

### 3. **Ejecutar en Desarrollo**
```bash
npm run dev
```

### 4. **Construir para Producción**
```bash
npm run build
```

### 5. **Preview de Producción**
```bash
npm run preview
```

## 🌐 **Acceso a la Aplicación**

Una vez ejecutado `npm run dev`, la aplicación estará disponible en:
- **URL Local**: `http://localhost:3000` (o el puerto que asigne Vite)
- **URL de Red**: Disponible en la IP local para acceso desde otros dispositivos

## 📊 **Funcionalidades Detalladas**

### 🏷️ **Gestión de Productos**
- Agregar productos con nombre, valor, número de cuotas y fecha de inicio
- Editar productos existentes mediante modales intuitivos
- Eliminar productos con confirmación de seguridad
- Validación de formularios en tiempo real

### 📈 **Estadísticas y Análisis**
- **Productos Activos**: Contador en tiempo real
- **Valor Total**: Suma de todos los productos
- **Promedio Mensual**: Cálculo automático de pagos mensuales
- **Próximo Mes**: Proyección de pagos futuros

### 📊 **Visualización de Datos**
- Gráfico de barras interactivo para pagos por período
- Filtros de tiempo: Todo, 6 meses, 1 año, 2 años
- Actualización automática al agregar/editar productos
- Responsive design para móviles

### 📄 **Reportes PDF**
- Generación automática de reportes completos
- Incluye resumen ejecutivo y detalle de productos
- Descarga instantánea con nombre personalizado
- Formato profesional con datos estructurados

## 🔧 **Comandos Disponibles**

```bash
npm run dev         # Servidor de desarrollo
npm run build       # Build de producción
npm run preview     # Preview del build
npm run lint        # Ejecutar ESLint
npm run format      # Formatear código con Prettier
```

## 📝 **Historial de Cambios**

### v2025.06.29 - Modernización Completa ✅
- **Migración completa** de JavaScript vanilla a arquitectura moderna
- **Solución definitiva** del problema de MIME type con archivos TypeScript
- **Implementación de gráficos** interactivos con Chart.js
- **Funcionalidad PDF** completa con jsPDF
- **UI/UX mejorada** con estilos modernos y responsivos
- **Persistencia de datos** con localStorage
- **Modales funcionales** para edición y confirmación
- **Validación robusta** de formularios
- **Arquitectura escalable** con módulos separados

### Commits Recientes:
- `fix: Solucionar definitivamente el error MIME type`
- `fix: Restaurar estilos CSS de la aplicación`
- `fix: Solucionar problema de carga y mejorar UI`
- `feat: Completar modernización del proyecto`
- `feat: Implementar arquitectura TypeScript modular`

## 🎯 **Estado de Desarrollo**

| Característica | Estado | Notas |
|---|---|---|
| ✅ Gestión de Productos | Completo | Agregar, editar, eliminar |
| ✅ Estadísticas | Completo | Tiempo real con gráficos |
| ✅ Exportación PDF | Completo | Reportes profesionales |
| ✅ UI/UX Moderna | Completo | Sin border-radius en PDF, modales arriba |
| ✅ Responsivo | Completo | Optimizado para todos los dispositivos |
| ✅ Persistencia | Completo | LocalStorage automático |
| ✅ Validaciones | Completo | Formularios robustos |

## 🤝 **Contribución**

El proyecto está abierto a contribuciones. Para contribuir:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 **Licencia**

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 👨‍💻 **Autor**

**Frodo24-atr** - [GitHub Profile](https://github.com/Frodo24-atr)

---

**🚀 ¡La aplicación está completamente funcional y lista para usar!** 

Para cualquier pregunta o sugerencia, no dudes en abrir un issue en GitHub.
