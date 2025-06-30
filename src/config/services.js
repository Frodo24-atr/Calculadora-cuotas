/**
 * Configuración de servicios externos para recordatorios
 * 
 * INSTRUCCIONES PARA CONFIGURAR:
 * 
 * 1. EmailJS (Para envío de emails):
 *    - Crear cuenta en https://www.emailjs.com/
 *    - Crear un servicio de email
 *    - Crear una plantilla de email
 *    - Copiar las claves y reemplazar los valores abajo
 */

const SERVICES_CONFIG = {
  // Configuración de EmailJS
  emailJS: {
    publicKey: '8c4l-rq7DsQF8ibja', // Tu Public Key de EmailJS ✅
    serviceId: 'service_srur1ha', // Tu Service ID ✅  
    templateId: 'template_z83t6tg' // Tu Template ID ✅ ACTUALIZADO
  },
  
  // Configuración de WhatsApp (no requiere claves)
  whatsapp: {
    baseUrl: 'https://wa.me/'
  }
};

// Hacer disponible globalmente
window.SERVICES_CONFIG = SERVICES_CONFIG;
