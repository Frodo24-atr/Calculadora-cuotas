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
 * @param {string} rango - Rango de tiempo ('all', '6', '12', etc.)
 */
function actualizarGraficoConFiltro(rango) {
    rangoActual = rango;
    
    // Actualizar botones activos
    document.querySelectorAll('.time-range-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const botonActivo = document.querySelector(`[data-range="${rango}"]`);
    if (botonActivo) {
        botonActivo.classList.add('active');
    }
    
    // Recrear el gráfico con el nuevo rango
    crearGrafico();
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
    if (productos.length === 0) {
        mostrarGraficoVacio();
        return;
    }

    const gastosData = calcularGastosMensuales(productos, rangoActual);
    
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
        console.log('✅ Gráfico creado exitosamente');
        
        // Verificar y corregir altura después de crear
        setTimeout(() => verificarAlturaGrafico(ctx), 100);
        
    } catch (error) {
        console.error('❌ Error al crear el gráfico:', error);
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
    return {
        type: 'bar',
        data: {
            labels: gastosData.meses,
            datasets: [{
                label: 'Valor a Pagar',
                data: gastosData.montos,
                backgroundColor: 'rgba(76, 175, 80, 0.8)',
                borderColor: 'rgba(76, 175, 80, 1)',
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
            }]
        },
        options: crearOpcionesGrafico()
    };
}

/**
 * Crea las opciones de configuración del gráfico
 * @returns {Object} Opciones del gráfico
 */
function crearOpcionesGrafico() {
    return {
        responsive: true,
        maintainAspectRatio: false,
        aspectRatio: 2, // Relación ancho:alto fija
        layout: {
            padding: {
                top: 10,
                bottom: 10,
                left: 10,
                right: 10
            }
        },
        plugins: {
            legend: {
                display: true,
                position: 'top',
                labels: {
                    color: '#333',
                    font: {
                        size: 14,
                        weight: 'bold'
                    },
                    usePointStyle: true,
                    padding: 15
                }
            },
            tooltip: crearConfiguracionTooltip()
        },
        scales: crearConfiguracionEscalas(),
        // Opciones adicionales para controlar el tamaño
        onResize: function(chart, size) {
            // Limitar la altura máxima
            if (size.height > 300) {
                chart.canvas.style.height = '300px';
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
 * Crea la configuración de las escalas
 * @returns {Object} Configuración de escalas
 */
function crearConfiguracionEscalas() {
    return {
        y: {
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
                    size: 12,
                    weight: '500'
                },
                padding: 8,
                callback: function(value) {
                    return '$' + value.toLocaleString();
                }
            }
        },
        x: {
            grid: {
                display: false
            },
            border: {
                display: false
            },
            ticks: {
                color: '#666',
                font: {
                    size: 11,
                    weight: '500'
                },
                padding: 8
            }
        }
    };
}

/**
 * Calcula los gastos mensuales con filtro de rango y detalles
 * @param {Array} productos - Array de productos
 * @param {string} mesesRango - Rango de meses ('all' o número)
 * @returns {Object} Datos de gastos mensuales
 */
function calcularGastosMensuales(productos, mesesRango = 'all') {
    const gastosPorMes = {};
    const detallesPorMes = {};
    const ahora = new Date();
    
    // Calcular gastos para cada producto
    productos.forEach(producto => {
        const fechaInicio = new Date(producto.fechaInicio);
        
        for (let i = 0; i < producto.cuotas; i++) {
            const fecha = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth() + i, 1);
            const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
            
            if (!gastosPorMes[mesKey]) {
                gastosPorMes[mesKey] = 0;
                detallesPorMes[mesKey] = [];
            }
            
            gastosPorMes[mesKey] += producto.valorCuota;
            detallesPorMes[mesKey].push({
                nombre: producto.nombre,
                valorCuota: producto.valorCuota,
                cuotaActual: i + 1,
                totalCuotas: producto.cuotas,
                valorTotal: producto.valor
            });
        }
    });

    let mesesOrdenados = Object.keys(gastosPorMes).sort();
    
    // Aplicar filtro de rango
    if (mesesRango !== 'all') {
        mesesOrdenados = aplicarFiltroRango(mesesOrdenados, mesesRango, ahora);
    }
    
    return formatearDatosGrafico(mesesOrdenados, gastosPorMes, detallesPorMes);
}

/**
 * Aplica el filtro de rango a los meses
 * @param {Array} mesesOrdenados - Meses ordenados
 * @param {string} mesesRango - Rango en meses
 * @param {Date} ahora - Fecha actual
 * @returns {Array} Meses filtrados
 */
function aplicarFiltroRango(mesesOrdenados, mesesRango, ahora) {
    const mesesLimite = parseInt(mesesRango);
    const fechaLimite = new Date(ahora.getFullYear(), ahora.getMonth() - mesesLimite + 1, 1);
    const fechaLimiteKey = `${fechaLimite.getFullYear()}-${String(fechaLimite.getMonth() + 1).padStart(2, '0')}`;
    
    return mesesOrdenados.filter(mes => mes >= fechaLimiteKey);
}

/**
 * Formatea los datos para el gráfico
 * @param {Array} mesesOrdenados - Meses ordenados
 * @param {Object} gastosPorMes - Gastos por mes
 * @param {Object} detallesPorMes - Detalles por mes
 * @returns {Object} Datos formateados
 */
function formatearDatosGrafico(mesesOrdenados, gastosPorMes, detallesPorMes) {
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
    const ctx = document.getElementById('gastosChart');
    if (!ctx) return;

    const parentElement = ctx.parentElement;
    if (parentElement) {
        parentElement.innerHTML = `
            <div style="
                display: flex; 
                align-items: center; 
                justify-content: center; 
                height: 300px;
                background: #f8f9fa;
                border-radius: 8px;
                border: 2px dashed #dee2e6;
                color: #6c757d;
                text-align: center;
                flex-direction: column;
            ">
                <div style="font-size: 48px; margin-bottom: 10px;">📊</div>
                <div style="font-size: 18px; font-weight: 500;">No hay datos para mostrar</div>
                <div style="font-size: 14px; margin-top: 5px;">Agrega algunos productos para ver el gráfico</div>
            </div>
        `;
    }
}

/**
 * Muestra un mensaje de error en el gráfico
 * @param {string} mensaje - Mensaje de error
 */
function mostrarErrorGrafico(mensaje) {
    const ctx = document.getElementById('gastosChart');
    if (!ctx) return;

    const parentElement = ctx.parentElement;
    if (parentElement) {
        parentElement.innerHTML = `
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
    }
}

/**
 * Obtiene el rango actual del gráfico
 * @returns {string} Rango actual
 */
function getRangoActual() {
    return rangoActual;
}

/**
 * Exporta los datos del gráfico actual
 * @returns {Object|null} Datos del gráfico o null si no hay datos
 */
function exportarDatosGrafico() {
    return datosGraficoCompletos;
}
