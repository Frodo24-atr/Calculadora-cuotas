/**
 * Módulo de Utilidades - Utils.js
 * Funciones auxiliares y utilidades generales
 */

/**
 * Formatea un número como moneda
 * @param {number} cantidad - Cantidad a formatear
 * @param {string} moneda - Símbolo de moneda (por defecto '$')
 * @returns {string} Cantidad formateada
 */
function formatearMoneda(cantidad, moneda = '$') {
    if (isNaN(cantidad)) return `${moneda}0`;
    return `${moneda}${Math.round(cantidad).toLocaleString()}`;
}

/**
 * Formatea una fecha en formato legible
 * @param {string|Date} fecha - Fecha a formatear
 * @param {string} formato - Formato de salida ('corto', 'largo', 'completo')
 * @returns {string} Fecha formateada
 */
function formatearFecha(fecha, formato = 'corto') {
    const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
    
    if (isNaN(fechaObj.getTime())) {
        return 'Fecha inválida';
    }
    
    const opciones = {
        'corto': { day: '2-digit', month: '2-digit', year: 'numeric' },
        'largo': { day: 'numeric', month: 'long', year: 'numeric' },
        'completo': { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        }
    };
    
    return fechaObj.toLocaleDateString('es-ES', opciones[formato] || opciones.corto);
}

/**
 * Valida si una fecha es válida
 * @param {string} fechaString - Fecha en formato string
 * @returns {boolean} True si la fecha es válida
 */
function esFechaValida(fechaString) {
    const fecha = new Date(fechaString);
    return !isNaN(fecha.getTime()) && fechaString !== '';
}

/**
 * Valida si un número es válido y positivo
 * @param {string|number} numero - Número a validar
 * @returns {boolean} True si el número es válido y positivo
 */
function esNumeroValidoPositivo(numero) {
    const num = parseFloat(numero);
    return !isNaN(num) && num > 0;
}

/**
 * Debounce function para limitar la frecuencia de ejecución
 * @param {Function} func - Función a ejecutar
 * @param {number} delay - Delay en milisegundos
 * @returns {Function} Función con debounce aplicado
 */
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * Throttle function para limitar la frecuencia de ejecución
 * @param {Function} func - Función a ejecutar
 * @param {number} limit - Límite en milisegundos
 * @returns {Function} Función con throttle aplicado
 */
function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Genera un ID único basado en timestamp
 * @returns {number} ID único
 */
function generarId() {
    return Date.now() + Math.random();
}

/**
 * Copia texto al portapapeles
 * @param {string} texto - Texto a copiar
 * @returns {Promise<boolean>} Promise que indica si la copia fue exitosa
 */
async function copiarAlPortapapeles(texto) {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(texto);
            return true;
        } else {
            // Fallback para navegadores más antiguos
            const textArea = document.createElement('textarea');
            textArea.value = texto;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            const exitoso = document.execCommand('copy');
            textArea.remove();
            return exitoso;
        }
    } catch (error) {
        console.error('Error al copiar al portapapeles:', error);
        return false;
    }
}

/**
 * Muestra una notificación temporal
 * @param {string} mensaje - Mensaje a mostrar
 * @param {string} tipo - Tipo de notificación ('success', 'error', 'info', 'warning')
 * @param {number} duracion - Duración en milisegundos
 */
function mostrarNotificacion(mensaje, tipo = 'info', duracion = 3000) {
    // Eliminar notificaciones existentes
    const notificacionesExistentes = document.querySelectorAll('.notificacion-temporal');
    notificacionesExistentes.forEach(n => n.remove());
    
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion-temporal notificacion-${tipo}`;
    notificacion.textContent = mensaje;
    
    // Estilos inline para asegurar que se vea correctamente
    Object.assign(notificacion.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 20px',
        borderRadius: '6px',
        color: 'white',
        fontWeight: '500',
        zIndex: '10000',
        maxWidth: '300px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        transition: 'all 0.3s ease',
        transform: 'translateX(100%)',
        opacity: '0'
    });
    
    // Colores según el tipo
    const colores = {
        success: '#4CAF50',
        error: '#f44336',
        warning: '#FF9800',
        info: '#2196F3'
    };
    
    notificacion.style.backgroundColor = colores[tipo] || colores.info;
    
    document.body.appendChild(notificacion);
    
    // Animación de entrada
    setTimeout(() => {
        notificacion.style.transform = 'translateX(0)';
        notificacion.style.opacity = '1';
    }, 10);
    
    // Animación de salida y eliminación
    setTimeout(() => {
        notificacion.style.transform = 'translateX(100%)';
        notificacion.style.opacity = '0';
        setTimeout(() => {
            if (notificacion.parentNode) {
                notificacion.remove();
            }
        }, 300);
    }, duracion);
}

/**
 * Escapa caracteres HTML para prevenir XSS
 * @param {string} texto - Texto a escapar
 * @returns {string} Texto escapado
 */
function escaparHTML(texto) {
    const elemento = document.createElement('div');
    elemento.textContent = texto;
    return elemento.innerHTML;
}

/**
 * Convierte una cadena a formato título (primera letra mayúscula)
 * @param {string} texto - Texto a convertir
 * @returns {string} Texto en formato título
 */
function formatoTitulo(texto) {
    return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}

/**
 * Obtiene la fecha actual en formato ISO (YYYY-MM-DD)
 * @returns {string} Fecha actual en formato ISO
 */
function obtenerFechaHoy() {
    return new Date().toISOString().split('T')[0];
}

/**
 * Calcula la diferencia en días entre dos fechas
 * @param {string|Date} fecha1 - Primera fecha
 * @param {string|Date} fecha2 - Segunda fecha
 * @returns {number} Diferencia en días
 */
function diferenciaDias(fecha1, fecha2) {
    const f1 = typeof fecha1 === 'string' ? new Date(fecha1) : fecha1;
    const f2 = typeof fecha2 === 'string' ? new Date(fecha2) : fecha2;
    
    const diffTime = Math.abs(f2 - f1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Verifica si el dispositivo es móvil
 * @returns {boolean} True si es dispositivo móvil
 */
function esDispositivoMovil() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Obtiene parámetros de la URL
 * @param {string} nombre - Nombre del parámetro
 * @returns {string|null} Valor del parámetro o null
 */
function obtenerParametroURL(nombre) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(nombre);
}

/**
 * Registra eventos de manera segura
 * @param {Element} elemento - Elemento al que agregar el evento
 * @param {string} evento - Tipo de evento
 * @param {Function} callback - Función callback
 * @param {Object} opciones - Opciones del evento
 */
function agregarEvento(elemento, evento, callback, opciones = {}) {
    if (elemento && typeof elemento.addEventListener === 'function') {
        elemento.addEventListener(evento, callback, opciones);
    }
}

/**
 * Manejo seguro de errores con logging
 * @param {Function} fn - Función a ejecutar
 * @param {string} contexto - Contexto para el logging
 * @returns {Function} Función envuelta con manejo de errores
 */
function manejarErrores(fn, contexto = 'Función') {
    return function (...args) {
        try {
            return fn.apply(this, args);
        } catch (error) {
            console.error(`❌ Error en ${contexto}:`, error);
            mostrarNotificacion(`Error en ${contexto}: ${error.message}`, 'error');
            return null;
        }
    };
}
