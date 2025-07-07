/**
 * Configuración de servicios externos para recordatorios
 * 
 * INSTRUCCIONES PARA CONFIGURAR:
 * 
 * 1. EmailJS (Para envío de emails):
 *    - Crear cuenta en https://www.emailjs.com/
 *    - Ir a https://dashboard.emailjs.com/admin/services
 *    - Crear un servicio de email (Gmail, Outlook, etc.)
 *    - Ir a https://dashboard.emailjs.com/admin/templates
 *    - Crear una plantilla con las variables: {{to_email}}, {{product_name}}, {{payment_date}}, {{amount}}
 *    - Copiar las claves y reemplazar los valores abajo
 * 
 * IMPORTANTE: Si no tienes configurado EmailJS, las notificaciones funcionarán
 * pero los emails no se enviarán.
 */

console.log('🔧 === INICIANDO CARGA DE SERVICES.JS ===');

// Función para configurar SERVICES_CONFIG
function setupServicesConfig() {
  console.log('📋 Definiendo SERVICES_CONFIG...');

  const SERVICES_CONFIG = {
    // Configuración de EmailJS
    emailJS: {
      publicKey: '8c4l-rq7DsQF8ibja', // Tu Public Key de EmailJS
      serviceId: 'service_srur1ha', // Tu Service ID  
      templateId: 'template_vd109cb', // ✅ Template ID real actualizado
      
      // Configuración adicional
      enabled: true, // ✅ Habilitado para usar el template real
      
      // Plantilla de ejemplo para crear en EmailJS:
      exampleTemplate: {
        subject: "Recordatorio de Pago - ${product_name}",
        body: "Hola,\n\nTe recordamos que tienes un pago pendiente:\n\nProducto: ${product_name}\nMonto: $${amount}\nFecha de vencimiento: ${payment_date}\n\n¡No olvides realizar tu pago a tiempo!\n\nSaludos,\nTu Calculadora de Cuotas"
      }
    },
    
    // Configuración de WhatsApp (no requiere claves)
    whatsapp: {
      baseUrl: 'https://wa.me/'
    }
  };

  console.log('✅ SERVICES_CONFIG definido correctamente');

  // Verificar que window existe (navegador)
  if (typeof window !== 'undefined') {
    console.log('🌐 Ejecutándose en navegador - asignando a window');
    
    // Hacer disponible globalmente de múltiples maneras
    window.SERVICES_CONFIG = SERVICES_CONFIG;
    
    // También como variable global sin window
    if (typeof globalThis !== 'undefined') {
      globalThis.SERVICES_CONFIG = SERVICES_CONFIG;
    }
    
    // Verificar que se asignó correctamente
    if (window.SERVICES_CONFIG && window.SERVICES_CONFIG.emailJS) {
      console.log('✅ SERVICES_CONFIG asignado correctamente a window');
      console.log('📧 EmailJS config disponible:', !!window.SERVICES_CONFIG.emailJS);
    } else {
      console.error('❌ Error: SERVICES_CONFIG no se asignó correctamente a window');
    }
  } else {
    console.log('⚠️ window no disponible (entorno Node.js)');
  }

  // Confirmar que se cargó correctamente
  console.log('✅ services.js procesado exitosamente');
  console.log('📋 Configuración EmailJS:', {
    enabled: SERVICES_CONFIG.emailJS.enabled,
    hasPublicKey: !!SERVICES_CONFIG.emailJS.publicKey,
    hasServiceId: !!SERVICES_CONFIG.emailJS.serviceId,
    hasTemplateId: !!SERVICES_CONFIG.emailJS.templateId,
    templateId: SERVICES_CONFIG.emailJS.templateId
  });

  return SERVICES_CONFIG;
}

try {
  // Configurar servicios
  const config = setupServicesConfig();
  
  // Evento personalizado para notificar que se cargó
  if (typeof window !== 'undefined') {
    // Disparar evento inmediatamente
    const event = new CustomEvent('servicesConfigLoaded', { 
      detail: { config: config } 
    });
    window.dispatchEvent(event);
    console.log('🎯 Evento servicesConfigLoaded disparado inmediatamente');
    
    // También disparar después de un breve delay para asegurar listeners
    setTimeout(() => {
      const delayedEvent = new CustomEvent('servicesConfigLoaded', { 
        detail: { config: config } 
      });
      window.dispatchEvent(delayedEvent);
      console.log('🎯 Evento servicesConfigLoaded disparado con delay');
    }, 100);
    
    // Marcar como cargado
    window.SERVICES_CONFIG_LOADED = true;
  }

} catch (error) {
  console.error('❌ ERROR CRÍTICO en services.js:', error);
  console.error('📋 Stack trace:', error.stack);
  
  // Crear configuración de emergencia
  if (typeof window !== 'undefined') {
    console.log('🚨 Creando configuración de emergencia...');
    window.SERVICES_CONFIG = {
      emailJS: {
        publicKey: '8c4l-rq7DsQF8ibja',
        serviceId: 'service_srur1ha',
        templateId: 'template_EJEMPLO',
        enabled: false
      },
      whatsapp: {
        baseUrl: 'https://wa.me/'
      }
    };
    window.SERVICES_CONFIG_LOADED = true;
    console.log('⚠️ Configuración de emergencia creada');
  }
}

console.log('🔧 === FIN DE CARGA DE SERVICES.JS ===');
