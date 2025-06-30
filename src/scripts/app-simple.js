// Versión simplificada para debugging
console.log('🚀 Iniciando Calculadora de Cuotas SIMPLE v2025.06.29');

class CalculadoraCuotasSimple {
  constructor() {
    console.log('📊 Constructor iniciado');
    this.state = {
      products: [],
      isLoading: true
    };
    
    // Inicializar inmediatamente sin async
    this.initializeSimple();
  }

  initializeSimple() {
    console.log('🔧 Inicialización simple...');
    
    // Ocultar loading inmediatamente
    setTimeout(() => {
      console.log('📱 Ocultando loading...');
      this.hideLoading();
      this.setupBasicEvents();
      console.log('✅ Inicialización simple completada');
    }, 500);
  }

  hideLoading() {
    const loading = document.getElementById('loadingIndicator');
    if (loading) {
      loading.style.display = 'none';
      console.log('✅ Loading ocultado');
    } else {
      console.warn('⚠️ Elemento loadingIndicator no encontrado');
    }
  }

  setupBasicEvents() {
    console.log('🎯 Configurando eventos básicos...');
    
    const btnAgregar = document.getElementById('btnAgregarProducto');
    if (btnAgregar) {
      btnAgregar.addEventListener('click', () => {
        alert('Botón funciona! 🎉');
      });
      console.log('✅ Botón agregar configurado');
    } else {
      console.warn('⚠️ Botón agregar no encontrado');
    }
  }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('🟢 DOM cargado, creando aplicación simple...');
    window.app = new CalculadoraCuotasSimple();
  });
} else {
  console.log('🟢 DOM ya está cargado, creando aplicación simple...');
  window.app = new CalculadoraCuotasSimple();
}
