/**
 * CALCULADORA DE CUOTAS - ARCHIVO PRINCIPAL
 * =========================================
 * 
 * Este archivo contiene la inicialización principal de la aplicación
 * y la coordinación entre todos los módulos.
 * 
 * @version 2025.06.29
 * @author Calculadora de Cuotas Team
 */

// Variables globales
let gastosChart = null;
let datosGraficoCompletos = null;
let productoEditandoId = null;
let productoEliminandoId = null;
let rangoActual = 'all';
let isInitialized = false;

// Funciones para acceder a las variables globales desde otros módulos
function setProductoEditandoId(id) {
    productoEditandoId = id;
}

function getProductoEditandoId() {
    return productoEditandoId;
}

function setProductoEliminandoId(id) {
    productoEliminandoId = id;
}

function getProductoEliminandoId() {
    return productoEliminandoId;
}

// Configuración de la aplicación
const CONFIG = {
    version: '2025.06.29',
    chartjsVersion: '3.9.1',
    storageKey: 'productos_demo',
    debug: true
};

/**
 * Inicialización principal de la aplicación
 */
document.addEventListener('DOMContentLoaded', function() {
    if (isInitialized) return;
    isInitialized = true;
    
    console.log('🚀 Inicializando Calculadora de Cuotas v' + CONFIG.version);
    
    // Backup inmediato para ocultar loading después de 2 segundos
    setTimeout(() => {
        console.log('🔄 Backup inmediato: Verificando loading...');
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator && window.getComputedStyle(loadingIndicator).display !== 'none') {
            console.log('🔄 Loading aún visible, ocultando...');
            ocultarIndicadorCarga();
        }
    }, 2000);
    
    // Inicialización en etapas con delays para asegurar carga completa
    setTimeout(() => initializeStep1(), 100);
});

/**
 * Paso 1: Verificaciones básicas
 */
function initializeStep1() {
    console.log('📱 Paso 1: Verificaciones básicas...');
    
    try {
        verificarCompatibilidad();
        configurarAlmacenamiento();
        verificarChartJS();
        
        // Continuar al paso 2
        setTimeout(() => initializeStep2(), 100);
        
    } catch (error) {
        console.error('❌ Error en paso 1:', error);
        mostrarErrorInicializacion(error);
    }
}

/**
 * Paso 2: Configuración inicial
 */
function initializeStep2() {
    console.log('📱 Paso 2: Configuración inicial...');
    
    try {
        configurarFechaInicial();
        
        // Continuar al paso 3
        setTimeout(() => initializeStep3(), 100);
        
    } catch (error) {
        console.error('❌ Error en paso 2:', error);
        mostrarErrorInicializacion(error);
    }
}

/**
 * Paso 3: Carga de datos
 */
function initializeStep3() {
    console.log('📱 Paso 3: Cargando datos...');
    
    try {
        // Cargar datos básicos
        if (typeof cargarProductos === 'function') {
            cargarProductos();
        } else {
            console.warn('⚠️ cargarProductos no disponible');
        }
        
        // Continuar al paso 4
        setTimeout(() => initializeStep4(), 100);
        
    } catch (error) {
        console.error('❌ Error en paso 3:', error);
        // Continuar de todas formas
        setTimeout(() => initializeStep4(), 100);
    }
}

/**
 * Paso 4: Estadísticas y gráficos
 */
function initializeStep4() {
    console.log('📱 Paso 4: Estadísticas y gráficos...');
    
    try {
        if (typeof actualizarEstadisticas === 'function') {
            actualizarEstadisticas();
        } else {
            console.warn('⚠️ actualizarEstadisticas no disponible');
        }
        
        if (typeof actualizarGrafico === 'function') {
            actualizarGrafico();
        } else {
            console.warn('⚠️ actualizarGrafico no disponible');
        }
        
        // Continuar al paso final
        setTimeout(() => finalizarInicializacion(), 200);
        
    } catch (error) {
        console.error('❌ Error en paso 4:', error);
        // Continuar de todas formas
        setTimeout(() => finalizarInicializacion(), 200);
    }
}

/**
 * Finalizar inicialización
 */
function finalizarInicializacion() {
    console.log('📱 Finalizando inicialización...');
    
    try {
        // Configurar event listeners globales
        configurarEventListeners();
        
        console.log('✅ Aplicación inicializada correctamente');
        updateStatus('appStatus', '✅ Listo');
        
    } catch (error) {
        console.error('❌ Error en finalización:', error);
        updateStatus('appStatus', '⚠️ Parcial');
    }
    
    // Siempre ocultar el loading al final
    setTimeout(() => {
        console.log('🎯 Ocultando indicador de carga...');
        ocultarIndicadorCarga();
    }, 300);
}

// Función legacy mantenida por compatibilidad
function initializeApp() {
    finalizarInicializacion();
}

/**
 * Verificar compatibilidad del navegador
 */
function verificarCompatibilidad() {
    const features = {
        localStorage: typeof(Storage) !== "undefined",
        fetch: typeof fetch !== "undefined",
        promises: typeof Promise !== "undefined",
        arrow: () => true // Test arrow functions
    };
    
    const incompatible = Object.keys(features).filter(key => !features[key]);
    
    if (incompatible.length > 0) {
        throw new Error(`Navegador incompatible. Características faltantes: ${incompatible.join(', ')}`);
    }
}

/**
 * Configurar almacenamiento temporal
 */
function configurarAlmacenamiento() {
    try {
        // Limpiar datos persistentes de versiones anteriores
        limpiarDatosPersistentes();
        
        // Verificar que el almacenamiento temporal funciona
        if (isStorageAvailable()) {
            updateStatus('storageStatus', '✅ Memoria temporal lista');
            console.log('✅ Almacenamiento temporal configurado');
        } else {
            throw new Error('Error configurando almacenamiento temporal');
        }
    } catch(e) {
        updateStatus('storageStatus', '❌ Error de configuración');
        throw new Error('Almacenamiento no disponible');
    }
}

/**
 * Verificar Chart.js
 */
function verificarChartJS() {
    if (typeof Chart !== 'undefined') {
        updateStatus('chartStatus', '✅ Cargado');
        console.log('✅ Chart.js disponible');
    } else {
        updateStatus('chartStatus', '❌ No disponible');
        throw new Error('Chart.js no disponible');
    }
}

/**
 * Configurar fecha inicial
 */
function configurarFechaInicial() {
    const today = new Date().toISOString().split('T')[0];
    const fechaInput = document.getElementById('fechaInicio');
    if (fechaInput) {
        fechaInput.value = today;
    }
}

/**
 * Verificar que las funciones necesarias estén disponibles
 */
function verificarFuncionesDisponibles() {
    const funcionesRequeridas = [
        'cargarProductos',
        'actualizarEstadisticas', 
        'actualizarGrafico',
        'inicializarControlesRango',
        'inicializarModalEdicion',
        'inicializarModalConfirmacion'
    ];
    
    const funcionesFaltantes = funcionesRequeridas.filter(nombreFuncion => {
        const disponible = typeof window[nombreFuncion] === 'function';
        console.log(`  - ${nombreFuncion}: ${disponible ? '✅' : '❌'}`);
        return !disponible;
    });
    
    if (funcionesFaltantes.length > 0) {
        throw new Error(`Funciones no disponibles: ${funcionesFaltantes.join(', ')}`);
    }
    
    console.log('✅ Todas las funciones requeridas están disponibles');
}

/**
 * Cargar interfaz inicial
 */
function cargarInterfaz() {
    try {
        console.log('  6.1 Cargando productos...');
        cargarProductos();
    } catch (error) {
        console.error('❌ Error cargando productos:', error);
    }
    
    try {
        console.log('  6.2 Actualizando estadísticas...');
        actualizarEstadisticas();
    } catch (error) {
        console.error('❌ Error actualizando estadísticas:', error);
    }
    
    try {
        console.log('  6.3 Actualizando gráfico...');
        actualizarGrafico();
    } catch (error) {
        console.error('❌ Error actualizando gráfico:', error);
    }
}

/**
 * Inicializar componentes interactivos
 */
function inicializarComponentes() {
    try {
        console.log('  7.1 Inicializando controles de rango...');
        inicializarControlesRango();
    } catch (error) {
        console.error('❌ Error inicializando controles de rango:', error);
    }
    
    try {
        console.log('  7.2 Inicializando modal de edición...');
        inicializarModalEdicion();
    } catch (error) {
        console.error('❌ Error inicializando modal de edición:', error);
    }
    
    try {
        console.log('  7.3 Inicializando modal de confirmación...');
        inicializarModalConfirmacion();
    } catch (error) {
        console.error('❌ Error inicializando modal de confirmación:', error);
    }
}

/**
 * Configurar event listeners globales
 */
function configurarEventListeners() {
    // Fallback para ocultar indicador de carga
    window.addEventListener('load', function() {
        setTimeout(() => {
            const loadingIndicator = document.getElementById('loadingIndicator');
            if (loadingIndicator && loadingIndicator.style.display !== 'none') {
                console.log('🔄 Backup 1: Ocultando indicador de carga');
                ocultarIndicadorCarga();
            }
        }, 1000);
    });
    
    // Backup adicional después de 3 segundos
    setTimeout(() => {
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator && loadingIndicator.style.display !== 'none') {
            console.log('🔄 Backup 2: Forzando ocultación del indicador');
            ocultarIndicadorCarga();
        }
    }, 3000);
    
    // Backup final después de 5 segundos
    setTimeout(() => {
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator && loadingIndicator.style.display !== 'none') {
            console.log('🔄 Backup 3: Ocultación forzada final');
            loadingIndicator.style.display = 'none';
        }
    }, 5000);
    
    // Manejo de errores globales
    window.addEventListener('error', function(e) {
        console.error('Error global capturado:', e.error);
        if (CONFIG.debug) {
            mostrarNotificacion('Error: ' + e.error.message, 'error');
        }
        
        // Ocultar loading en caso de error
        setTimeout(ocultarIndicadorCarga, 1000);
    });
}

/**
 * Ocultar indicador de carga
 */
function ocultarIndicadorCarga() {
    console.log('🔄 Intentando ocultar indicador de carga...');
    
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        console.log('✅ Elemento loading encontrado, ocultando...');
        loadingIndicator.style.opacity = '0';
        loadingIndicator.style.transition = 'opacity 0.3s ease';
        
        setTimeout(() => {
            loadingIndicator.style.display = 'none';
            console.log('✅ Indicador de carga ocultado completamente');
        }, 300);
    } else {
        console.warn('⚠️ Elemento loadingIndicator no encontrado');
        
        // Intentar con otros métodos
        const allLoadingElements = document.querySelectorAll('[id*="loading"], .loading, .loading-indicator');
        if (allLoadingElements.length > 0) {
            console.log('🔍 Encontrados elementos de carga alternativos:', allLoadingElements.length);
            allLoadingElements.forEach(el => {
                el.style.display = 'none';
            });
        }
    }
}

/**
 * Actualizar estado en la UI
 */
function updateStatus(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = text;
    }
}

/**
 * Mostrar error de inicialización
 */
function mostrarErrorInicializacion(error) {
    const container = document.querySelector('.container');
    if (container) {
        container.innerHTML = `
            <div style="padding: 40px; text-align: center; color: #f44336;">
                <h2>❌ Error de Inicialización</h2>
                <p>${error.message}</p>
                <button onclick="location.reload()" style="padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Reintentar
                </button>
            </div>
        `;
    }
}

/**
 * Mostrar notificación temporal
 */
function mostrarNotificacion(mensaje, tipo = 'info') {
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion notificacion-${tipo}`;
    notificacion.textContent = mensaje;
    notificacion.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${tipo === 'error' ? '#f44336' : '#4CAF50'};
        color: white;
        border-radius: 5px;
        z-index: 10002;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notificacion);
    
    setTimeout(() => {
        notificacion.remove();
    }, 3000);
}

/**
 * Limpia datos persistentes de versiones anteriores
 */
function limpiarDatosPersistentes() {
    try {
        // Limpiar localStorage de versiones anteriores
        const keysToRemove = ['productos_demo', 'productos', 'calculadora_productos'];
        keysToRemove.forEach(key => {
            if (localStorage.getItem(key)) {
                localStorage.removeItem(key);
                console.log(`🧹 Eliminado ${key} del localStorage`);
            }
        });
        console.log('✅ Datos persistentes limpiados');
    } catch (error) {
        console.error('❌ Error limpiando datos persistentes:', error);
    }
}

// Exportar funciones para uso en otros módulos
window.AppMain = {
    CONFIG,
    mostrarNotificacion,
    updateStatus
};

// ========================================
// EXPORTAR FUNCIONES AL ÁMBITO GLOBAL
// ========================================

// Funciones de gestión de IDs
window.setProductoEditandoId = setProductoEditandoId;
window.getProductoEditandoId = getProductoEditandoId;
window.setProductoEliminandoId = setProductoEliminandoId;
window.getProductoEliminandoId = getProductoEliminandoId;

console.log('🚀 App.js: Funciones principales exportadas al ámbito global');
