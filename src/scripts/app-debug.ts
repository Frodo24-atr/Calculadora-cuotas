// Versión simplificada para debugging
console.log('🟢 App debug script cargado!');

// Función simple para ocultar el loading
function hideLoadingDebug() {
  console.log('🟢 Ocultando loading...');
  const loading = document.getElementById('loadingIndicator');
  if (loading) {
    loading.style.display = 'none';
    console.log('🟢 Loading ocultado correctamente');
  } else {
    console.error('🔴 No se encontró el elemento loadingIndicator');
  }
}

// Función simple para mostrar contenido
function showMainContent() {
  console.log('🟢 Mostrando contenido principal...');
  const mainContent = document.getElementById('mainContent');
  if (mainContent) {
    mainContent.style.display = 'block';
    console.log('🟢 Contenido principal mostrado');
  } else {
    console.error('🔴 No se encontró el elemento mainContent');
  }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  console.log('🟡 Esperando DOMContentLoaded...');
  document.addEventListener('DOMContentLoaded', () => {
    console.log('🟢 DOM cargado, inicializando...');
    setTimeout(() => {
      hideLoadingDebug();
      showMainContent();
    }, 1000);
  });
} else {
  console.log('🟢 DOM ya está cargado, inicializando inmediatamente...');
  setTimeout(() => {
    hideLoadingDebug();
    showMainContent();
  }, 1000);
}
