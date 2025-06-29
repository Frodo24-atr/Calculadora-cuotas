# 🔧 Solución de Problemas - Recordatorios por Email

## ❌ Error: "Access to XMLHttpRequest... blocked by CORS policy"

Este error ocurre cuando intentas usar la función de **recordatorios por email** abriendo el archivo `index.html` directamente desde el explorador (protocolo `file://`).

### 🚀 Solución Rápida

1. **Haz doble clic en `start-server.bat`** (en la carpeta raíz del proyecto)
2. **Abre tu navegador** y ve a: `http://localhost:8000/src/`
3. **Ya puedes usar todos los recordatorios** (WhatsApp, Email, Calendar)

### 💡 ¿Por qué pasa esto?

- **EmailJS** requiere que la aplicación se ejecute desde un servidor web (no desde archivo local)
- El navegador bloquea las peticiones a APIs externas desde archivos locales por seguridad
- **WhatsApp** funciona perfectamente desde archivo local

### 🛠️ Métodos alternativos para crear servidor:

#### Con Python (más común):
```bash
# Python 3
python -m http.server 8000

# Python 2  
python -m SimpleHTTPServer 8000
```

#### Con Node.js:
```bash
npx http-server -p 8000
```

#### Con VS Code:
- Instala la extensión "Live Server"
- Clic derecho en `index.html` → "Open with Live Server"

### ✅ Funcionalidades sin servidor:

Estas funcionan perfectamente abriendo el archivo directamente:
- ✅ **WhatsApp**: Funciona 100%
- ✅ **Calculadora de cuotas**: Funciona 100%
- ✅ **PDF export**: Funciona 100%
- ✅ **Gráficos y estadísticas**: Funciona 100%

### ❌ Funcionalidades que requieren servidor:

- ❌ **Email recordatorios**: Requiere servidor web
- ❌ **Google Calendar**: Requiere servidor web

### 🔄 Recomendación:

**Para la mejor experiencia, siempre usa `start-server.bat` y abre `http://localhost:8000/src/`**

---

## 📧 Configuración de EmailJS

Si tienes problemas con la configuración de EmailJS:

1. Ve a [emailjs.com](https://www.emailjs.com/)
2. Crea una cuenta gratuita
3. Crea un servicio de email
4. Crea una plantilla (template)
5. Copia las claves en `src/config/services.js`

### Template ejemplo para EmailJS:

```
Subject: 🔔 Recordatorio de Pago - {{product_name}}

Hola,

Este es un recordatorio de que tienes un pago pendiente:

📦 Producto: {{product_name}}
💰 Monto: ${{payment_amount}}
📅 Fecha de pago: {{payment_date}}
📊 Cuota: {{installment_current}}/{{installment_total}}

¡No olvides hacer tu pago!

Saludos,
Calculadora de Cuotas
```
