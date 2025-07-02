// Prueba rápida de funcionalidad
console.log('🧪 Ejecutando pruebas básicas...');

// Verificar que las librerías estén cargadas
setTimeout(() => {
  console.log('📊 Chart.js disponible:', typeof Chart !== 'undefined');
  console.log('📧 EmailJS disponible:', typeof emailjs !== 'undefined');
  console.log('📄 jsPDF disponible:', typeof window.jsPDF !== 'undefined');
  console.log('⚙️ SERVICES_CONFIG disponible:', typeof window.SERVICES_CONFIG !== 'undefined');
  
  if (typeof window.SERVICES_CONFIG !== 'undefined') {
    console.log('📋 Configuración EmailJS:', {
      enabled: window.SERVICES_CONFIG.emailJS.enabled,
      hasPublicKey: !!window.SERVICES_CONFIG.emailJS.publicKey,
      hasServiceId: !!window.SERVICES_CONFIG.emailJS.serviceId,
      hasTemplateId: !!window.SERVICES_CONFIG.emailJS.templateId
    });
  }
  
  console.log('✅ Verificación básica completada');
}, 2000);
