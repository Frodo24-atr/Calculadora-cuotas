// Script temporal para probar carga de services.js
console.log('🧪 === SCRIPT DE PRUEBA DE SERVICES.JS ===');

try {
  // Simular entorno de navegador
  global.window = {};
  global.CustomEvent = function(type, options) {
    return { type, detail: options?.detail };
  };
  
  // Cargar services.js
  require('./config/services.js');
  
  console.log('📋 SERVICES_CONFIG disponible:', !!global.window.SERVICES_CONFIG);
  
  if (global.window.SERVICES_CONFIG) {
    console.log('✅ Configuración cargada exitosamente:');
    console.log('   EmailJS enabled:', global.window.SERVICES_CONFIG.emailJS.enabled);
    console.log('   EmailJS publicKey:', global.window.SERVICES_CONFIG.emailJS.publicKey?.substring(0, 8) + '...');
    console.log('   EmailJS serviceId:', global.window.SERVICES_CONFIG.emailJS.serviceId);
    console.log('   EmailJS templateId:', global.window.SERVICES_CONFIG.emailJS.templateId);
  } else {
    console.log('❌ Error: SERVICES_CONFIG no se cargó');
  }
  
} catch (error) {
  console.error('❌ Error ejecutando test:', error.message);
  console.error('🔧 Stack:', error.stack);
}

console.log('🧪 === FIN DEL SCRIPT DE PRUEBA ===');
