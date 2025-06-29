/**
 * Módulo de Estadísticas - Statistics.js
 * Gestiona el cálculo y visualización de estadísticas
 */

/**
 * Actualiza todas las estadísticas de la aplicación
 */
function actualizarEstadisticas() {
    const productos = getProductos();
    const estadisticas = calcularEstadisticas(productos);
    
    mostrarEstadisticas(estadisticas);
}

/**
 * Calcula las estadísticas principales
 * @param {Array} productos - Array de productos
 * @returns {Object} Objeto con las estadísticas calculadas
 */
function calcularEstadisticas(productos) {
    const totalProductos = productos.length;
    const valorTotal = productos.reduce((sum, p) => sum + p.valor, 0);
    const promedioMensual = productos.reduce((sum, p) => sum + p.valorCuota, 0);
    const proximoMes = calcularGastosProximoMes(productos);

    return {
        totalProductos,
        valorTotal,
        promedioMensual,
        proximoMes,
        // Estadísticas adicionales
        valorPromedioPorProducto: totalProductos > 0 ? valorTotal / totalProductos : 0,
        cuotasPromedio: totalProductos > 0 ? productos.reduce((sum, p) => sum + p.cuotas, 0) / totalProductos : 0,
        productosActivosHoy: calcularProductosActivosHoy(productos),
        totalPagadoHastaHoy: calcularTotalPagadoHastaHoy(productos),
        totalPendiente: calcularTotalPendiente(productos)
    };
}

/**
 * Calcula los gastos del próximo mes
 * @param {Array} productos - Array de productos
 * @returns {number} Total de gastos del próximo mes
 */
function calcularGastosProximoMes(productos) {
    const ahora = new Date();
    const proximoMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 1);
    
    return productos
        .filter(producto => {
            const fechaInicio = new Date(producto.fechaInicio);
            // Verificar si el producto tiene cuotas en el próximo mes
            for (let i = 0; i < producto.cuotas; i++) {
                const fechaCuota = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth() + i, 1);
                if (fechaCuota.getMonth() === proximoMes.getMonth() && 
                    fechaCuota.getFullYear() === proximoMes.getFullYear()) {
                    return true;
                }
            }
            return false;
        })
        .reduce((sum, p) => sum + p.valorCuota, 0);
}

/**
 * Calcula cuántos productos tienen cuotas activas hoy
 * @param {Array} productos - Array de productos
 * @returns {number} Número de productos activos
 */
function calcularProductosActivosHoy(productos) {
    const hoy = new Date();
    const mesActual = hoy.getMonth();
    const añoActual = hoy.getFullYear();
    
    return productos.filter(producto => {
        const fechaInicio = new Date(producto.fechaInicio);
        const fechaFin = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth() + producto.cuotas, 1);
        
        const fechaActual = new Date(añoActual, mesActual, 1);
        return fechaActual >= fechaInicio && fechaActual < fechaFin;
    }).length;
}

/**
 * Calcula el total pagado hasta la fecha actual
 * @param {Array} productos - Array de productos
 * @returns {number} Total pagado hasta hoy
 */
function calcularTotalPagadoHastaHoy(productos) {
    const hoy = new Date();
    let totalPagado = 0;
    
    productos.forEach(producto => {
        const fechaInicio = new Date(producto.fechaInicio);
        const mesesTranscurridos = calcularMesesTranscurridos(fechaInicio, hoy);
        const cuotasPagadas = Math.min(mesesTranscurridos, producto.cuotas);
        
        if (cuotasPagadas > 0) {
            totalPagado += cuotasPagadas * producto.valorCuota;
        }
    });
    
    return totalPagado;
}

/**
 * Calcula el total pendiente de pago
 * @param {Array} productos - Array de productos
 * @returns {number} Total pendiente
 */
function calcularTotalPendiente(productos) {
    const totalGeneral = productos.reduce((sum, p) => sum + p.valor, 0);
    const totalPagado = calcularTotalPagadoHastaHoy(productos);
    return Math.max(0, totalGeneral - totalPagado);
}

/**
 * Calcula los meses transcurridos entre dos fechas
 * @param {Date} fechaInicio - Fecha de inicio
 * @param {Date} fechaFin - Fecha de fin
 * @returns {number} Número de meses transcurridos
 */
function calcularMesesTranscurridos(fechaInicio, fechaFin) {
    const inicioMes = fechaInicio.getMonth();
    const inicioAño = fechaInicio.getFullYear();
    const finMes = fechaFin.getMonth();
    const finAño = fechaFin.getFullYear();
    
    return (finAño - inicioAño) * 12 + (finMes - inicioMes) + 1;
}

/**
 * Muestra las estadísticas en la interfaz
 * @param {Object} estadisticas - Objeto con las estadísticas
 */
function mostrarEstadisticas(estadisticas) {
    // Estadísticas principales
    actualizarElemento('totalProductos', estadisticas.totalProductos);
    actualizarElemento('valorTotal', `$${estadisticas.valorTotal.toLocaleString()}`);
    actualizarElemento('promedioMensual', `$${Math.round(estadisticas.promedioMensual).toLocaleString()}`);
    actualizarElemento('proximoMes', `$${Math.round(estadisticas.proximoMes).toLocaleString()}`);

    // Estadísticas adicionales (si existen elementos para mostrarlas)
    actualizarElemento('valorPromedioPorProducto', `$${Math.round(estadisticas.valorPromedioPorProducto).toLocaleString()}`);
    actualizarElemento('cuotasPromedio', `${Math.round(estadisticas.cuotasPromedio)} cuotas`);
    actualizarElemento('productosActivosHoy', estadisticas.productosActivosHoy);
    actualizarElemento('totalPagadoHastaHoy', `$${Math.round(estadisticas.totalPagadoHastaHoy).toLocaleString()}`);
    actualizarElemento('totalPendiente', `$${Math.round(estadisticas.totalPendiente).toLocaleString()}`);
}

/**
 * Actualiza un elemento del DOM con un valor
 * @param {string} id - ID del elemento
 * @param {string|number} valor - Valor a mostrar
 */
function actualizarElemento(id, valor) {
    const elemento = document.getElementById(id);
    if (elemento) {
        elemento.textContent = valor;
    }
}

/**
 * Obtiene estadísticas para un rango de fechas específico
 * @param {Array} productos - Array de productos
 * @param {Date} fechaInicio - Fecha de inicio del rango
 * @param {Date} fechaFin - Fecha de fin del rango
 * @returns {Object} Estadísticas para el rango
 */
function obtenerEstadisticasRango(productos, fechaInicio, fechaFin) {
    const productosEnRango = productos.filter(producto => {
        const fechaInicioProducto = new Date(producto.fechaInicio);
        const fechaFinProducto = new Date(fechaInicioProducto.getFullYear(), fechaInicioProducto.getMonth() + producto.cuotas, 1);
        
        return (fechaInicioProducto <= fechaFin && fechaFinProducto >= fechaInicio);
    });

    return calcularEstadisticas(productosEnRango);
}

/**
 * Genera un resumen textual de las estadísticas
 * @param {Object} estadisticas - Objeto con las estadísticas
 * @returns {string} Resumen textual
 */
function generarResumenEstadisticas(estadisticas) {
    const resumen = [];
    
    if (estadisticas.totalProductos === 0) {
        return "No hay productos registrados actualmente.";
    }
    
    resumen.push(`📊 **Resumen de ${estadisticas.totalProductos} producto(s):**`);
    resumen.push(`💰 Valor total: $${estadisticas.valorTotal.toLocaleString()}`);
    resumen.push(`📅 Pago mensual promedio: $${Math.round(estadisticas.promedioMensual).toLocaleString()}`);
    resumen.push(`⏭️ Próximo mes: $${Math.round(estadisticas.proximoMes).toLocaleString()}`);
    
    if (estadisticas.productosActivosHoy > 0) {
        resumen.push(`🔄 Productos activos: ${estadisticas.productosActivosHoy}`);
    }
    
    if (estadisticas.totalPendiente > 0) {
        resumen.push(`⏳ Pendiente de pago: $${Math.round(estadisticas.totalPendiente).toLocaleString()}`);
    }
    
    return resumen.join('\n');
}
