# 📧 Variables del Template de EmailJS - Calculadora de Cuotas

## 🔧 **Variables Básicas del Destinatario:**
- `{{to_email}}` - Email de destino (ej: usuario@gmail.com)
- `{{user_name}}` - Nombre del usuario (parte antes del @)
- `{{to_name}}` - Nombre del destinatario
- `{{from_name}}` - Nombre del remitente (Calculadora de Cuotas)
- `{{reply_to}}` - Email de respuesta

## 📦 **Información del Producto:**
- `{{product_name}}` - Nombre del producto (ej: "Smartphone Samsung")
- `{{payment_amount}}` - Monto de la cuota (ej: "50.000")
- `{{payment_date}}` - Fecha de pago (ej: "lunes, 1 de julio de 2025")
- `{{installment_current}}` - Número de cuota actual (ej: 3)
- `{{installment_total}}` - Total de cuotas (ej: 12)
- `{{days_ahead}}` - Días de anticipación (ej: 3)

## 📋 **Información Detallada:**
- `{{installments_list}}` - Lista completa de todas las cuotas con fechas y montos
- `{{total_installments}}` - Total de cuotas del producto
- `{{paid_installments}}` - Número de cuotas ya pagadas
- `{{pending_installments}}` - Número de cuotas pendientes
- `{{total_amount}}` - Valor total del producto (ej: "600.000")
- `{{pending_amount}}` - Monto total pendiente de pago

## 🕐 **Información del Sistema:**
- `{{email_date}}` - Fecha y hora de generación del email
- `{{email}}` - Email alternativo (backup)
- `{{user_email}}` - Email del usuario (backup)
- `{{recipient_email}}` - Email del destinatario (backup)

## 📝 **Ejemplos de Uso en el Template:**

### **Para el Asunto:**
```
Recordatorio de Pago - {{product_name}}
```

### **Para el Contenido:**
```html
Hola {{user_name}},

Te recordamos que tienes un pago pendiente:

📦 Producto: {{product_name}}
💰 Monto: ${{payment_amount}}
📅 Fecha: {{payment_date}}
📊 Cuota: {{installment_current}} de {{installment_total}}

{{installments_list}}

Saludos,
Calculadora de Cuotas
```

## 🎯 **Template Recomendado (Completo):**

### **Configuración del Template:**
- **To Email:** `{{to_email}}`
- **From Name:** `Calculadora de Cuotas`
- **Subject:** `Recordatorio de Pago - {{product_name}}`

### **IDs de Configuración Actuales:**
- **Public Key:** `8c4l-rq7DsQF8ibja`
- **Service ID:** `service_srur1ha`
- **Template ID:** `template_z83t6tg` ✅

### **Contenido (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }
        .highlight { background: #e8f4fd; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .installment-list { background: white; padding: 15px; border-radius: 5px; margin: 10px 0; font-family: monospace; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 5px; margin: 10px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💰 Recordatorio de Pago</h1>
            <p>Calculadora de Cuotas</p>
        </div>
        
        <div class="content">
            <h2>Hola {{user_name}},</h2>
            
            <p>Te recordamos que tienes un pago próximo a vencer:</p>
            
            <div class="highlight">
                <h3>📦 Información del Producto</h3>
                <p><strong>Producto:</strong> {{product_name}}</p>
                <p><strong>💰 Monto de la cuota:</strong> ${{payment_amount}}</p>
                <p><strong>📅 Fecha de pago:</strong> {{payment_date}}</p>
                <p><strong>📊 Cuota:</strong> {{installment_current}} de {{installment_total}}</p>
            </div>
            
            <div class="warning">
                <p><strong>⚠️ Recordatorio:</strong> Este pago vence en {{days_ahead}} días.</p>
            </div>
            
            <div class="installment-list">
                <h3>📋 Cronograma de Cuotas</h3>
                <pre>{{installments_list}}</pre>
            </div>
            
            <div class="highlight">
                <h3>📊 Resumen</h3>
                <p><strong>Cuotas pagadas:</strong> {{paid_installments}}/{{total_installments}}</p>
                <p><strong>Monto pendiente:</strong> ${{pending_amount}}</p>
            </div>
            
            <div class="footer">
                <p>Generado el {{email_date}}</p>
                <p>💻 Calculadora de Cuotas</p>
            </div>
        </div>
    </div>
</body>
</html>
```

## 📝 **Pasos para Aplicar:**

1. **Copia el template HTML completo**
2. **Ve a tu EmailJS Dashboard** → Templates
3. **Pega el contenido** en el campo de mensaje
4. **Guarda los cambios**
5. **Prueba con test_emailjs.html**

## 🎯 **Resultado:**
Los emails tendrán toda la información real de tus productos:
- Nombre del producto que agregaste
- Montos calculados automáticamente
- Fechas reales de los pagos
- Cronograma completo de cuotas
- Resumen de pagos pendientes
