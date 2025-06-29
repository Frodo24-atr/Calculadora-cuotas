/**
 * Módulo de Gráficos - Charts.js
 * Gestiona la creación y actualización de gráficos con Chart.js
 */

// Variables globales del módulo
let gastosChart = null;
let datosGraficoCompletos = null;
let rangoActual = 'all';

/**
 * Inicializa los controles de rango de tiempo
 */
function inicializarControlesRango() {
    document.querySelectorAll('.time-range-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const rango = this.getAttribute('data-range');
            actualizarGraficoConFiltro(rango);
        });
    });
    
    console.log('✅ Controles de rango inicializados');
}

/**
 * Actualiza el gráfico con un filtro de rango específico
 * @param {string} rango - Rango de tiempo ('all', '6', '12', '24')
 */
function actualizarGraficoConFiltro(rango) {
    console.log(`🔄 Actualizando gráfico con filtro: ${rango}`);
    rangoActual = rango;
    
    // Actualizar botones activos
    document.querySelectorAll('.time-range-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const botonActivo = document.querySelector(`[data-range="${rango}"]`);
    if (botonActivo) {
        botonActivo.classList.add('active');
        console.log(`✅ Botón activo: ${rango}`);
    }
    
    // Recrear el gráfico con el nuevo rango
    try {
        const productos = getProductos ? getProductos() : [];
        console.log(`📊 Productos encontrados: ${productos.length}`);
        
        if (productos.length === 0) {
            mostrarGraficoVacio();
            return;
        }
        
        // Calcular datos con el nuevo filtro
        const gastosData = calcularGastosMensuales(productos, rango);
        console.log(`📈 Datos calculados para ${rango}:`, gastosData);
        
        if (!gastosData.datasets || gastosData.datasets.length === 0) {
            mostrarGraficoVacio();
            return;
        }
        
        // Destruir gráfico anterior
        destruirGraficoAnterior();
        
        // Crear nuevo gráfico
        const canvas = document.getElementById('gastosChart');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            const config = crearConfiguracionGrafico(gastosData);
            
            gastosChart = new Chart(ctx, config);
            datosGraficoCompletos = gastosData;
            
            // Mostrar el gráfico
            mostrarGrafico();
            console.log(`✅ Gráfico actualizado con filtro ${rango}`);
        }
        
    } catch (error) {
        console.error(`❌ Error actualizando gráfico con filtro ${rango}:`, error);
        mostrarErrorGrafico(`Error al filtrar datos: ${error.message}`);
    }
}

/**
 * Función principal para actualizar el gráfico
 */
function actualizarGrafico() {
    crearGrafico();
}

/**
 * Crea o actualiza el gráfico principal
 */
function crearGrafico() {
    console.log('📊 Actualizando gráfico...');
    
    if (typeof Chart === 'undefined') {
        console.log('❌ Chart.js no disponible');
        mostrarErrorGrafico('Chart.js no está disponible');
        return;
    }

    const productos = getProductos();
    console.log(`📦 Productos encontrados: ${productos.length}`);
    
    if (productos.length === 0) {
        mostrarGraficoVacio();
        return;
    }

    // Ocultar mensaje y mostrar gráfico
    const chartMessage = document.getElementById('chartMessage');
    if (chartMessage) {
        chartMessage.style.display = 'none';
    }
    
    const chartWrapper = document.querySelector('.chart-wrapper');
    if (chartWrapper) {
        chartWrapper.style.display = 'block';
    }

    // Usar la nueva función de gráfico apilado
    const gastosData = calcularGastosMensuales(productos, rangoActual);
    console.log('📊 Datos del gráfico apilado calculados:', gastosData);
    
    // Verificar que tenemos datasets válidos
    if (!gastosData.datasets || gastosData.datasets.length === 0) {
        console.log('⚠️ No hay datasets para mostrar');
        mostrarGraficoVacio();
        return;
    }
    
    // Almacenar datos completos para tooltips
    datosGraficoCompletos = gastosData;
    
    const ctx = document.getElementById('gastosChart');
    if (!ctx) {
        console.log('❌ Canvas no encontrado');
        return;
    }

    // Configurar canvas correctamente
    configurarCanvas(ctx);

    // Destruir gráfico anterior si existe
    destruirGraficoAnterior();

    try {
        gastosChart = new Chart(ctx, crearConfiguracionGrafico(gastosData));
        console.log('✅ Gráfico apilado creado exitosamente');
        console.log(`   📊 Datasets: ${gastosData.datasets.length}`);
        console.log(`   📅 Períodos: ${gastosData.meses.length}`);
        
        // Verificar y corregir altura después de crear
        setTimeout(() => verificarAlturaGrafico(ctx), 100);
        
    } catch (error) {
        console.error('❌ Error al crear el gráfico apilado:', error);
        mostrarErrorGrafico('Error al crear el gráfico: ' + error.message);
    }
}

/**
 * Configura el canvas para evitar crecimiento infinito
 */
function configurarCanvas(canvas) {
    // Remover atributos de tamaño existentes
    canvas.removeAttribute('width');
    canvas.removeAttribute('height');
    
    // Establecer estilos CSS fijos
    canvas.style.width = '100%';
    canvas.style.height = '300px';
    canvas.style.maxHeight = '300px';
    canvas.style.maxWidth = '100%';
}

/**
 * Verifica y corrige la altura del gráfico
 */
function verificarAlturaGrafico(canvas) {
    const alturaActual = canvas.offsetHeight;
    if (alturaActual > 350) {
        console.log('⚠️ Altura excesiva detectada, corrigiendo...');
        canvas.style.height = '300px !important';
        if (gastosChart) {
            gastosChart.resize();
        }
    }
}

/**
 * Destruye el gráfico anterior si existe
 */
function destruirGraficoAnterior() {
    if (gastosChart) {
        gastosChart.destroy();
        gastosChart = null;
    }
}

/**
 * Crea la configuración del gráfico
 * @param {Object} gastosData - Datos de gastos mensuales
 * @returns {Object} Configuración del gráfico
 */
function crearConfiguracionGrafico(gastosData) {
    // Detectar si es dispositivo móvil
    const isMobile = window.innerWidth <= 768;
    
    return {
        type: 'bar',
        data: {
            labels: gastosData.meses,
            datasets: gastosData.datasets || [
                {
                    label: 'Valor a Pagar',
                    data: gastosData.montos,
                    backgroundColor: 'rgba(76, 175, 80, 0.8)',
                    borderColor: 'rgba(76, 175, 80, 1)',
                    borderWidth: 2,
                    borderRadius: isMobile ? 6 : 8,
                    borderSkipped: false,
                    // Configuraciones específicas para el grosor de las barras en móviles
                    barPercentage: isMobile ? 0.9 : 0.8, // Barras más anchas en móviles
                    categoryPercentage: isMobile ? 0.95 : 0.8, // Menos espacio entre categorías en móviles
                    maxBarThickness: isMobile ? 60 : 80, // Grosor máximo de barra
                    minBarLength: isMobile ? 3 : 2, // Altura mínima de barra
                }
            ]
        },
        options: crearOpcionesGrafico()
    };
}

/**
 * Crea las opciones de configuración del gráfico
 * @returns {Object} Opciones del gráfico
 */
function crearOpcionesGrafico() {
    // Detectar si es dispositivo móvil
    const isMobile = window.innerWidth <= 768;
    
    return {
        responsive: true,
        maintainAspectRatio: false,
        aspectRatio: isMobile ? 1.2 : 2, // Relación más cuadrada en móviles
        // Configuración para barras apiladas
        scales: crearConfiguracionEscalas(isMobile),
        layout: {
            padding: {
                top: isMobile ? 5 : 10,
                bottom: isMobile ? 5 : 10,
                left: isMobile ? 5 : 10,
                right: isMobile ? 5 : 10
            }
        },
        plugins: {
            legend: {
                display: true,
                position: 'top',
                labels: {
                    color: '#333',
                    font: {
                        size: isMobile ? 11 : 13,
                        weight: 'bold'
                    },
                    usePointStyle: true,
                    pointStyle: 'rect',
                    padding: isMobile ? 8 : 12,
                    generateLabels: function(chart) {
                        const datasets = chart.data.datasets;
                        return datasets.map((dataset, index) => ({
                            text: dataset.label,
                            fillStyle: dataset.backgroundColor,
                            strokeStyle: dataset.borderColor,
                            lineWidth: 0,
                            pointStyle: 'rect',
                            datasetIndex: index
                        }));
                    }
                }
            },
            tooltip: crearConfiguracionTooltipApilado(isMobile)
        },
        // Configuración específica para barras apiladas
        interaction: {
            mode: 'index',
            intersect: false
        },
        // Opciones adicionales para controlar el tamaño
        onResize: function(chart, size) {
            // Limitar la altura máxima según el dispositivo
            const maxHeight = window.innerWidth <= 768 ? 320 : 300;
            if (size.height > maxHeight) {
                chart.canvas.style.height = maxHeight + 'px';
            }
        }
    };
}

/**
 * Crea la configuración de tooltips
 * @returns {Object} Configuración de tooltips
 */
function crearConfiguracionTooltip() {
    return {
        backgroundColor: 'rgba(33, 150, 243, 0.95)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#2196F3',
        borderWidth: 2,
        cornerRadius: 10,
        displayColors: false,
        titleAlign: 'center',
        bodyAlign: 'left',
        padding: 15,
        titleFont: {
            size: 16,
            weight: 'bold'
        },
        bodyFont: {
            size: 13,
            weight: 'normal'
        },
        titleMarginBottom: 8,
        bodySpacing: 6,
        callbacks: {
            title: function(context) {
                return `📅 ${context[0].label}`;
            },
            label: function(context) {
                return crearContenidoTooltip(context);
            }
        }
    };
}

/**
 * Crea la configuración de tooltips para gráfico apilado
 * @param {boolean} isMobile - Si es dispositivo móvil
 * @returns {Object} Configuración de tooltips
 */
function crearConfiguracionTooltipApilado(isMobile = false) {
    return {
        backgroundColor: 'rgba(33, 150, 243, 0.95)',
        titleColor: '#fff',
        bodyColor: '#fff',
        titleFont: {
            size: isMobile ? 12 : 14,
            weight: 'bold'
        },
        bodyFont: {
            size: isMobile ? 11 : 13,
            weight: 'normal'
        },
        padding: isMobile ? 8 : 12,
        cornerRadius: 8,
        displayColors: true,
        borderColor: 'rgba(33, 150, 243, 1)',
        borderWidth: 1,
        callbacks: {
            title: function(context) {
                return `📅 ${context[0].label}`;
            },
            label: function(context) {
                const productName = context.dataset.label;
                const value = context.parsed.y;
                return `🔸 ${productName}: $${value.toLocaleString('es-ES')}`;
            },
            footer: function(tooltipItems) {
                // Calcular total del mes
                let total = 0;
                tooltipItems.forEach(function(tooltipItem) {
                    total += tooltipItem.parsed.y;
                });
                return `💰 Total del mes: $${total.toLocaleString('es-ES')}`;
            }
        }
    };
}

/**
 * Crea el contenido del tooltip
 * @param {Object} context - Contexto del tooltip
 * @returns {Array} Array de líneas para el tooltip
 */
function crearContenidoTooltip(context) {
    const index = context.dataIndex;
    const detalles = datosGraficoCompletos?.detalles?.[index] || [];
    const total = context.parsed.y;
    
    let resultado = [];
    
    if (detalles.length > 0) {
        detalles.forEach(detalle => {
            resultado.push(`🔸 ${detalle.nombre} - Cuota ${detalle.cuotaActual}/${detalle.totalCuotas}: $${Math.round(detalle.valorCuota).toLocaleString()}`);
        });
        resultado.push('');
    }
    
    resultado.push(`💰 Total: $${total.toLocaleString()}`);
    
    return resultado;
}

/**
 * Crea la configuración de las escalas para gráfico apilado
 * @param {boolean} isMobile - Si es dispositivo móvil
 * @returns {Object} Configuración de escalas
 */
function crearConfiguracionEscalas(isMobile = false) {
    return {
        y: {
            stacked: true, // Habilitar apilado
            beginAtZero: true,
            grid: {
                color: 'rgba(0, 0, 0, 0.08)',
                drawBorder: false
            },
            border: {
                display: false
            },
            ticks: {
                color: '#666',
                font: {
                    size: isMobile ? 9 : 11,
                    weight: '500'
                },
                padding: isMobile ? 4 : 6,
                callback: function(value) {
                    // Formatear valores grandes
                    if (value >= 1000000) {
                        return '$' + (value / 1000000).toFixed(1) + 'M';
                    } else if (value >= 1000) {
                        return '$' + (value / 1000).toFixed(0) + 'K';
                    }
                    return '$' + value.toLocaleString('es-ES');
                }
            },
            title: {
                display: isMobile ? false : true,
                text: 'Valor de Cuotas ($)',
                color: '#666',
                font: {
                    size: isMobile ? 10 : 12,
                    weight: 'bold'
                }
            }
        },
        x: {
            stacked: true, // Habilitar apilado
            grid: {
                display: false
            },
            border: {
                display: false
            },
            ticks: {
                color: '#666',
                font: {
                    size: isMobile ? 8 : 10,
                    weight: '500'
                },
                padding: isMobile ? 4 : 6,
                maxRotation: isMobile ? 45 : 0, // Rotar etiquetas en móviles para mejor legibilidad
                minRotation: isMobile ? 45 : 0
            },
            title: {
                display: isMobile ? false : true,
                text: 'Período',
                color: '#666',
                font: {
                    size: isMobile ? 10 : 12,
                    weight: 'bold'
                }
            }
        }
    };
}

/**
 * Calcula los gastos mensuales con filtro de rango y crea datasets por producto
 * @param {Array} productos - Array de productos
 * @param {string} mesesRango - Rango de meses ('all' o número)
 * @returns {Object} Datos de gastos mensuales con datasets por producto
 */
function calcularGastosMensuales(productos, mesesRango = 'all') {
    if (!productos || productos.length === 0) {
        return { meses: [], datasets: [], detalles: [] };
    }

    const gastosPorProductoPorMes = {};
    const ahora = new Date();
    const todosLosMeses = new Set();
    
    // Colores correlativos con la página web
    const coloresProductos = [
        { bg: 'rgba(76, 175, 80, 0.8)', border: 'rgba(76, 175, 80, 1)', name: 'Verde Principal' },      // --primary-color
        { bg: 'rgba(33, 150, 243, 0.8)', border: 'rgba(33, 150, 243, 1)', name: 'Azul Info' },        // --info-color
        { bg: 'rgba(255, 152, 0, 0.8)', border: 'rgba(255, 152, 0, 1)', name: 'Naranja Advertencia' }, // --warning-color
        { bg: 'rgba(156, 39, 176, 0.8)', border: 'rgba(156, 39, 176, 1)', name: 'Púrpura' },
        { bg: 'rgba(244, 67, 54, 0.8)', border: 'rgba(244, 67, 54, 1)', name: 'Rojo Peligro' },        // --danger-color
        { bg: 'rgba(96, 125, 139, 0.8)', border: 'rgba(96, 125, 139, 1)', name: 'Gris Azulado' },
        { bg: 'rgba(255, 193, 7, 0.8)', border: 'rgba(255, 193, 7, 1)', name: 'Amarillo' },
        { bg: 'rgba(0, 188, 212, 0.8)', border: 'rgba(0, 188, 212, 1)', name: 'Cian' },
        { bg: 'rgba(139, 195, 74, 0.8)', border: 'rgba(139, 195, 74, 1)', name: 'Verde Claro' },
        { bg: 'rgba(121, 85, 72, 0.8)', border: 'rgba(121, 85, 72, 1)', name: 'Marrón' }
    ];
    
    // Inicializar estructura para cada producto
    productos.forEach((producto, index) => {
        gastosPorProductoPorMes[producto.id] = {
            nombre: producto.nombre,
            gastosPorMes: {},
            color: coloresProductos[index % coloresProductos.length]
        };
    });
    
    // Calcular gastos para cada producto por mes
    productos.forEach(producto => {
        const fechaInicio = new Date(producto.fechaInicio);
        
        for (let i = 0; i < producto.cuotas; i++) {
            const fecha = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth() + i, 1);
            const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
            
            // Agregar mes al conjunto de todos los meses
            todosLosMeses.add(mesKey);
            
            // Inicializar gasto del producto para este mes si no existe
            if (!gastosPorProductoPorMes[producto.id].gastosPorMes[mesKey]) {
                gastosPorProductoPorMes[producto.id].gastosPorMes[mesKey] = 0;
            }
            
            // Sumar el valor de la cuota
            gastosPorProductoPorMes[producto.id].gastosPorMes[mesKey] += producto.valorCuota;
        }
    });

    let mesesOrdenados = Array.from(todosLosMeses).sort();
    
    // Aplicar filtro de rango con lógica corregida
    if (mesesRango !== 'all') {
        mesesOrdenados = aplicarFiltroRangoMejorado(mesesOrdenados, mesesRango, ahora);
    }
    
    return formatearDatosGraficoApilado(mesesOrdenados, gastosPorProductoPorMes);
}

/**
 * Aplica el filtro de rango mejorado a los meses
 * @param {Array} mesesOrdenados - Meses ordenados
 * @param {string} mesesRango - Rango en meses
 * @param {Date} ahora - Fecha actual
 * @returns {Array} Meses filtrados
 */
function aplicarFiltroRangoMejorado(mesesOrdenados, mesesRango, ahora) {
    const mesesLimite = parseInt(mesesRango);
    
    if (isNaN(mesesLimite) || mesesLimite <= 0) {
        return mesesOrdenados;
    }
    
    // Crear fecha límite desde el mes actual hacia atrás
    const fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth() - mesesLimite + 1, 1);
    const fechaFin = new Date(ahora.getFullYear(), ahora.getMonth() + 12, 1); // Incluir meses futuros
    
    return mesesOrdenados.filter(mes => {
        const [año, mesNum] = mes.split('-');
        const fechaMes = new Date(parseInt(año), parseInt(mesNum) - 1, 1);
        return fechaMes >= fechaInicio && fechaMes <= fechaFin;
    }).slice(0, mesesLimite * 2); // Limitar cantidad máxima de meses mostrados
}

/**
 * Formatea los datos para el gráfico apilado
 * @param {Array} mesesOrdenados - Meses ordenados
 * @param {Object} gastosPorProductoPorMes - Gastos por producto por mes
 * @returns {Object} Datos formateados para gráfico apilado
 */
function formatearDatosGraficoApilado(mesesOrdenados, gastosPorProductoPorMes) {
    const isMobile = window.innerWidth <= 768;
    
    // Formatear etiquetas de meses en español
    const meses = mesesOrdenados.map(mes => {
        const [año, mesNum] = mes.split('-');
        const fecha = new Date(año, mesNum - 1, 1);
        
        // Formato diferente según el dispositivo
        if (isMobile) {
            return fecha.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
        } else {
            return fecha.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
        }
    });
    
    // Crear datasets para cada producto
    const datasets = [];
    const productosIds = Object.keys(gastosPorProductoPorMes);
    
    productosIds.forEach((productoId, index) => {
        const productoData = gastosPorProductoPorMes[productoId];
        const datosProducto = mesesOrdenados.map(mes => {
            return Math.round(productoData.gastosPorMes[mes] || 0);
        });
        
        // Solo agregar dataset si el producto tiene datos
        if (datosProducto.some(valor => valor > 0)) {
            datasets.push({
                label: productoData.nombre,
                data: datosProducto,
                backgroundColor: productoData.color.bg,
                borderColor: productoData.color.border,
                borderWidth: isMobile ? 1 : 2,
                borderRadius: isMobile ? 4 : 6,
                borderSkipped: false,
                // Configuraciones específicas para barras apiladas
                barPercentage: isMobile ? 0.9 : 0.8,
                categoryPercentage: isMobile ? 0.95 : 0.85,
                maxBarThickness: isMobile ? 50 : 70,
                minBarLength: 2,
                // Configuración para el apilado
                stack: 'stack1'
            });
        }
    });
    
    // Crear datos de detalles para tooltips
    const detalles = mesesOrdenados.map(mes => {
        const detallesMes = [];
        productosIds.forEach(productoId => {
            const gasto = gastosPorProductoPorMes[productoId].gastosPorMes[mes];
            if (gasto && gasto > 0) {
                detallesMes.push({
                    nombre: gastosPorProductoPorMes[productoId].nombre,
                    valor: Math.round(gasto)
                });
            }
        });
        return detallesMes;
    });

    return { 
        meses, 
        datasets, 
        detalles, 
        mesesKeys: mesesOrdenados,
        totalProductos: productosIds.length
    };
}

/**
 * Formatea los datos para el gráfico (función legacy - mantener por compatibilidad)
 * @param {Array} mesesOrdenados - Meses ordenados
 * @param {Object} gastosPorMes - Gastos por mes
 * @param {Object} detallesPorMes - Detalles por mes
 * @returns {Object} Datos formateados
 */
function formatearDatosGrafico(mesesOrdenados, gastosPorMes, detallesPorMes) {
    // Redirigir a la nueva función de gráfico apilado
    console.log('⚠️ Usando función legacy formatearDatosGrafico, recomendado usar formatearDatosGraficoApilado');
    
    const meses = mesesOrdenados.map(mes => {
        const [año, mesNum] = mes.split('-');
        const fecha = new Date(año, mesNum - 1, 1);
        return fecha.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
    });
    
    const montos = mesesOrdenados.map(mes => Math.round(gastosPorMes[mes]));
    const detalles = mesesOrdenados.map(mes => detallesPorMes[mes]);

    return { meses, montos, detalles, mesesKeys: mesesOrdenados };
}

/**
 * Muestra un mensaje cuando no hay datos para el gráfico
 */
function mostrarGraficoVacio() {
    console.log('📊 Mostrando gráfico vacío...');
    
    // Destruir gráfico anterior si existe
    destruirGraficoAnterior();
    
    const chartMessage = document.getElementById('chartMessage');
    if (chartMessage) {
        chartMessage.style.display = 'block';
        console.log('✅ Mensaje de gráfico vacío mostrado');
    }
    
    // Ocultar el contenedor del gráfico
    const chartWrapper = document.querySelector('.chart-wrapper');
    if (chartWrapper) {
        chartWrapper.style.display = 'none';
    }
}

/**
 * Muestra un mensaje de error en el gráfico
 * @param {string} mensaje - Mensaje de error
 */
function mostrarErrorGrafico(mensaje) {
    console.log('❌ Mostrando error en gráfico:', mensaje);
    
    // Destruir gráfico anterior si existe
    destruirGraficoAnterior();
    
    const chartMessage = document.getElementById('chartMessage');
    if (chartMessage) {
        chartMessage.innerHTML = `
            <div style="
                display: flex; 
                align-items: center; 
                justify-content: center; 
                height: 300px;
                background: #fff5f5;
                border-radius: 8px;
                border: 2px dashed #feb2b2;
                color: #c53030;
                text-align: center;
                flex-direction: column;
            ">
                <div style="font-size: 48px; margin-bottom: 10px;">⚠️</div>
                <div style="font-size: 16px; font-weight: 500;">Error al cargar el gráfico</div>
                <div style="font-size: 12px; margin-top: 5px;">${mensaje}</div>
            </div>
        `;
        chartMessage.style.display = 'block';
    }
    
    // Ocultar el contenedor del gráfico
    const chartWrapper = document.querySelector('.chart-wrapper');
    if (chartWrapper) {
        chartWrapper.style.display = 'none';
    }
}

/**
 * Manejar redimensionamiento de ventana para adaptar gráficos
 */
function manejarRedimensionamientoVentana() {
    let timeout;
    
    function actualizarGraficoEnRedimension() {
        // Usar debounce para evitar múltiples actualizaciones
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            if (gastosChart) {
                // Destruir y recrear el gráfico para aplicar nuevas configuraciones móviles
                const productos = getProductos ? getProductos() : [];
                if (productos.length > 0) {
                    console.log('🔄 Actualizando gráfico por redimensionamiento');
                    crearGrafico();
                }
            }
        }, 300);
    }
    
    window.addEventListener('resize', actualizarGraficoEnRedimension);
    window.addEventListener('orientationchange', actualizarGraficoEnRedimension);
}

/**
 * Inicializar manejadores de eventos para gráficos responsivos
 */
function inicializarGraficosResponsivos() {
    manejarRedimensionamientoVentana();
    inicializarControlesRango();
    console.log('📱 Gráficos responsivos inicializados');
}

// ========================================
// EXPORTAR FUNCIONES AL ÁMBITO GLOBAL
// ========================================

window.actualizarGrafico = actualizarGrafico;
window.actualizarGraficoConFiltro = actualizarGraficoConFiltro;
window.cambiarRangoGrafico = cambiarRangoGrafico;
window.getRangoActual = getRangoActual;
window.exportarDatosGrafico = exportarDatosGrafico;
window.inicializarGraficosResponsivos = inicializarGraficosResponsivos;

console.log('📈 Charts.js: Funciones exportadas al ámbito global');
