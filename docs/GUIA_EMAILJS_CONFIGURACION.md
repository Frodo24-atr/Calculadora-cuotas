# 📧 Guía de Configuración EmailJS - Calculadora de Cuotas

## 🚨 **Error Actual Resuelto:**
```
Status: 422
Error: "The recipients address is empty"
```

## 🔧 **Solución Implementada:**

### **Problema:** 
El template de EmailJS no estaba configurado correctamente para recibir el email de destino.

### **Solución:**
Se agregaron múltiples variables de email para asegurar compatibilidad:
- `to_email`
- `to`
- `user_email` 
- `recipient_email`

## 📋 **Configuración del Template en EmailJS:**

### **Paso 1: Ir al Dashboard**
1. Ve a: https://dashboard.emailjs.com/admin/templates
2. Selecciona tu template o crea uno nuevo

### **Paso 2: Configurar el Template**

#### **Configuración básica:**
- **To Email:** `{{to_email}}`
- **From Name:** `Calculadora de Cuotas`
- **Subject:** `Recordatorio de Pago - {{product_name}}`

#### **Contenido del mensaje:**
```
Hola {{user_name}},

Te recordamos que tienes un pago pendiente:

📦 Producto: {{product_name}}
💰 Monto: ${{payment_amount}}
📅 Fecha de pago: {{payment_date}}
📊 Cuota: {{installment_current}} de {{installment_total}}

Detalle de cuotas:
{{installments_list}}

Total de cuotas: {{total_installments}}
Cuotas pagadas: {{paid_installments}}
Cuotas pendientes: {{pending_installments}}
Monto total: ${{total_amount}}
Monto pendiente: ${{pending_amount}}

Generado el: {{email_date}}

Saludos,
Calculadora de Cuotas
```

### **Paso 3: Variables Disponibles**
El sistema envía estas variables que puedes usar en tu template:

#### **Información del destinatario:**
- `{{to_email}}` - Email de destino
- `{{user_name}}` - Nombre del usuario
- `{{to_name}}` - Nombre del destinatario

#### **Información del producto:**
- `{{product_name}}` - Nombre del producto
- `{{payment_amount}}` - Monto de la cuota
- `{{payment_date}}` - Fecha de pago
- `{{installment_current}}` - Número de cuota actual
- `{{installment_total}}` - Total de cuotas

#### **Información detallada:**
- `{{installments_list}}` - Lista completa de cuotas
- `{{total_installments}}` - Total de cuotas
- `{{paid_installments}}` - Cuotas pagadas
- `{{pending_installments}}` - Cuotas pendientes
- `{{total_amount}}` - Monto total
- `{{pending_amount}}` - Monto pendiente

#### **Información del sistema:**
- `{{email_date}}` - Fecha de generación
- `{{days_ahead}}` - Días de anticipación

## 🧪 **Cómo Probar:**

### **Opción 1: Usar test_emailjs.html**
1. Abre `test_emailjs.html`
2. Ingresa tu email de prueba
3. Opcional: Usa campos de override para Service ID y Template ID
4. Click en "📧 Enviar Email de Prueba"
5. Click en "📋 Guía del Template" para ver instrucciones

### **Opción 2: Verificar en EmailJS Dashboard**
1. Ve a tu template en EmailJS
2. Usa "Test" para enviar un email de prueba
3. Verifica que `{{to_email}}` esté en el campo "To Email"

## ✅ **Checklist de Verificación:**
- [ ] Template tiene `{{to_email}}` en el campo "To Email"
- [ ] Subject y contenido usan las variables correctas
- [ ] Service ID y Template ID son correctos
- [ ] Public Key está configurada
- [ ] Test en `test_emailjs.html` es exitoso

## 🎯 **Estado Actual:**
- ✅ Service ID problema resuelto
- ✅ Template configurado con variables correctas
- ✅ Múltiples variables de email para compatibilidad
- ✅ Herramienta de testing disponible

---

**💡 Tip:** Si sigues teniendo problemas, usa el botón "📋 Guía del Template" en la página de test para ver exactamente cómo configurar tu template.
