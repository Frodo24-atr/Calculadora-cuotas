// Script de verificación de carga
console.log('🔍 === VERIFICACIÓN DE CARGA DE SCRIPTS ===');

// Función para verificar el estado de carga después de un momento
setTimeout(() => {
  console.log('📋 Estado de carga después de 2 segundos:');
  console.log('- SERVICES_CONFIG:', typeof window.SERVICES_CONFIG !== 'undefined' ? '✅ CARGADO' : '❌ NO CARGADO');
  console.log('- RemindersManager:', typeof window.RemindersManager !== 'undefined' ? '✅ CARGADO' : '❌ NO CARGADO');
  console.log('- Chart.js:', typeof Chart !== 'undefined' ? '✅ CARGADO' : '❌ NO CARGADO');
  console.log('- EmailJS:', typeof emailjs !== 'undefined' ? '✅ CARGADO' : '❌ NO CARGADO');
  console.log('- jsPDF:', typeof window.jsPDF !== 'undefined' ? '✅ CARGADO' : '❌ NO CARGADO');
  
  if (typeof window.SERVICES_CONFIG !== 'undefined') {
    console.log('📧 Configuración EmailJS:', {
      enabled: window.SERVICES_CONFIG.emailJS.enabled,
      publicKey: window.SERVICES_CONFIG.emailJS.publicKey ? 'CONFIGURADO' : 'NO CONFIGURADO',
      serviceId: window.SERVICES_CONFIG.emailJS.serviceId || 'NO CONFIGURADO',
      templateId: window.SERVICES_CONFIG.emailJS.templateId || 'NO CONFIGURADO'
    });
  }
  
  console.log('🔍 === FIN DE VERIFICACIÓN ===');
}, 2000);
