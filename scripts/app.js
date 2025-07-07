// Aplicación principal - Calculadora de Cuotas - Versión JavaScript
console.log('� INICIO: app.js se está ejecutando...');
console.log('�🚀 Iniciando Calculadora de Cuotas v2025.06.29 (JS)');

/**
 * Calculadora de Cuotas - Versión JavaScript pura
 */
class CalculadoraCuotas {
  constructor() {
    console.log('🚀 Iniciando constructor CalculadoraCuotas...');
    
    this.state = {
      products: [],
      currentTimeRange: 'all',
      currentChartType: 'bar', // Nuevo estado para tipo de gráfico
      isLoading: true,
      modal: { isOpen: false },
    };
    
    this.chartInstance = null;
    this.remindersManager = null;
    
    console.log('📊 Estado inicial creado, llamando initialize...');
    this.initialize();
  }

  async initialize() {
    try {
      console.log('🔧 Inicializando aplicación...');
      
      // Mostrar loading
      console.log('📱 Mostrando indicador de carga...');
      this.showLoading();
      
      // Timeout de emergencia para evitar que se cuelgue
      const emergencyTimeout = setTimeout(() => {
        console.warn('⚠️ Timeout de emergencia - Forzando inicialización');
        this.hideLoading();
        this.renderProducts();
        this.updateStats();
        this.state.isLoading = false;
      }, 5000);
      
      // Esperar que las librerías externas se carguen
      console.log('📚 Esperando librerías...');
      await this.waitForLibraries();
      
      // Configurar eventos básicos
      console.log('🎯 Configurando eventos básicos...');
      this.setupBasicEventListeners();
      
      // Inicializar valores por defecto del formulario
      console.log('📋 Configurando valores por defecto...');
      this.initializeFormDefaults();
      
      // Inicializar sistema de recordatorios
      console.log('🔔 Inicializando recordatorios...');
      await this.initializeReminders();
      
      // Cargar datos del localStorage
      console.log('💾 Cargando datos guardados...');
      this.loadStoredProducts();
      
      // Simular carga y luego ocultar loading
      console.log('⏳ Finalizando inicialización...');
      setTimeout(() => {
        console.log('🎨 Ocultando carga y renderizando...');
        clearTimeout(emergencyTimeout); // Cancelar timeout de emergencia
        this.hideLoading();
        
        // Renderizar productos DESPUÉS de ocultar loading
        this.renderProducts();
        this.updateStats();
        this.updateChart(); // Asegurar que el gráfico esté sincronizado
        console.log('✅ Aplicación inicializada correctamente');
        this.state.isLoading = false;
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error inicializando aplicación:', error);
      this.hideLoading(); // Asegurar que se oculte el loading en caso de error
      this.showError('Error al inicializar la aplicación: ' + error.message);
      this.state.isLoading = false;
    }
  }

  // Función para verificar que las librerías externas estén cargadas
  async waitForLibraries() {
    console.log('⏳ Esperando librerías externas...');
    
    // Timeout máximo de 5 segundos
    const maxWaitTime = 5000;
    const startTime = Date.now();
    
    // Esperar Chart.js
    let chartRetries = 0;
    while (!window.Chart && chartRetries < 50 && (Date.now() - startTime) < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, 100));
      chartRetries++;
    }
    
    // Esperar jsPDF (puede estar en diferentes lugares)
    let pdfRetries = 0;
    while (!window.jsPDF && !window.jspdf && pdfRetries < 50 && (Date.now() - startTime) < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, 100));
      pdfRetries++;
    }
    
    // Verificar que tengamos las librerías básicas
    const hasChart = !!window.Chart;
    const hasPDF = !!(window.jsPDF || window.jspdf);
    const hasEmailJS = !!window.emailjs;
    
    console.log('📊 Estado de librerías:', {
      'Chart.js': hasChart ? '✅' : '❌',
      'jsPDF': hasPDF ? '✅' : '❌',
      'EmailJS': hasEmailJS ? '✅' : '❌',
      'Tiempo de espera': `${Date.now() - startTime}ms`
    });
    
    // Inicializar EmailJS si está disponible
    if (hasEmailJS && window.SERVICES_CONFIG && window.SERVICES_CONFIG.emailJS) {
      try {
        console.log('🔧 Inicializando EmailJS...');
        emailjs.init(window.SERVICES_CONFIG.emailJS.publicKey);
        console.log('✅ EmailJS inicializado correctamente');
      } catch (error) {
        console.warn('⚠️ Error inicializando EmailJS:', error);
      }
    } else {
      console.warn('⚠️ EmailJS o configuración no disponible - los recordatorios por email no funcionarán');
    }
    
    // Si no tenemos Chart.js, advertir pero continuar
    if (!hasChart) {
      console.warn('⚠️ Chart.js no se cargó - los gráficos no funcionarán');
    }
    
    // Si no tenemos jsPDF, advertir pero continuar
    if (!hasPDF) {
      console.warn('⚠️ jsPDF no se cargó - la exportación PDF no funcionará');
    }
  }

  setupBasicEventListeners() {
    console.log('🎯 Configurando event listeners básicos...');
    
    // Botón agregar producto
    const btnAgregar = document.getElementById('btnAgregarProducto');
    if (btnAgregar) {
      console.log('✅ Botón agregar producto encontrado, configurando event listener');
      btnAgregar.addEventListener('click', () => {
        console.log('🔥 Click en botón agregar producto detectado');
        this.handleAddProduct();
      });
    } else {
      console.error('❌ Botón agregar producto NO encontrado');
    }

    // Botón eliminar todos los productos
    const btnBorrarTodo = document.getElementById('btnBorrarTodo');
    if (btnBorrarTodo) {
      console.log('✅ Botón borrar todo encontrado, configurando event listener');
      btnBorrarTodo.addEventListener('click', () => {
        console.log('🔥 Click en botón borrar todo detectado');
        this.handleDeleteAllProducts();
      });
    } else {
      console.log('⚠️ Botón borrar todo no encontrado (normal si no hay productos)');
    }

    // Botón descargar PDF
    const btnPDF = document.getElementById('btnDescargarPDF');
    if (btnPDF) {
      btnPDF.addEventListener('click', () => {
        this.generatePDF();
      });
    }

    // Botones de rango de tiempo
    document.querySelectorAll('.time-range-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const range = e.target.getAttribute('data-range');
        this.updateTimeRange(range);
      });
    });

    // Botones de tipo de gráfico
    document.querySelectorAll('.chart-type-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const type = e.target.getAttribute('data-type') || e.target.closest('[data-type]')?.getAttribute('data-type');
        if (type) {
          this.updateChartType(type);
        }
      });
    });

    // Modal eventos
    this.setupModalEvents();
    
    // Validación en tiempo real para inputs numéricos
    this.setupNumberInputValidation();
  }

  initializeFormDefaults() {
    console.log('📋 Inicializando valores por defecto del formulario...');
    
    // Establecer fecha de hoy por defecto
    const fechaInput = document.getElementById('fechaInicio');
    if (fechaInput && !fechaInput.value) {
      const today = new Date();
      const dateString = today.toISOString().split('T')[0];
      fechaInput.value = dateString;
      console.log('📅 Fecha por defecto establecida:', dateString);
    }
    
    // Establecer número de cuotas por defecto
    const cuotasInput = document.getElementById('numeroCuotas');
    if (cuotasInput && !cuotasInput.value) {
      cuotasInput.value = '12';
      console.log('🔢 Número de cuotas por defecto: 12');
    }
  }

  setupModalEvents() {
    // Modal de edición
    const editModal = document.getElementById('editModal');
    const closeEditModal = document.getElementById('closeEditModal');
    const btnCancelEdit = document.getElementById('btnCancelEdit');
    const btnSaveEdit = document.getElementById('btnSaveEdit');

    if (closeEditModal) {
      closeEditModal.addEventListener('click', () => {
        this.closeModal('editModal');
      });
    }

    if (btnCancelEdit) {
      btnCancelEdit.addEventListener('click', () => {
        this.closeModal('editModal');
      });
    }

    if (btnSaveEdit) {
      btnSaveEdit.addEventListener('click', () => {
        this.saveEditedProduct();
      });
    }

    // Modal de confirmación
    const confirmModal = document.getElementById('confirmModal');
    const btnCancelDelete = document.getElementById('btnCancelDelete');
    const btnConfirmDelete = document.getElementById('btnConfirmDelete');

    if (btnCancelDelete) {
      btnCancelDelete.addEventListener('click', () => {
        this.closeModal('confirmModal');
      });
    }

    if (btnConfirmDelete) {
      btnConfirmDelete.addEventListener('click', () => {
        this.confirmDelete();
      });
    }

    // Cerrar modal al hacer click fuera
    window.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        this.closeModal(e.target.id);
      }
    });
  }

  handleAddProduct() {
    console.log('🔥 handleAddProduct llamado');
    const nombre = document.getElementById('nombreProducto')?.value;
    const valorStr = document.getElementById('valorTotalProducto')?.value || '0';
    const cuotas = parseInt(document.getElementById('numeroCuotas')?.value || '0');
    const fecha = document.getElementById('fechaInicio')?.value;

    // Usar la nueva función de parseo latinoamericano
    const valor = this.parseLatinNumber(valorStr);

    if (!nombre || !this.isValidNumber(valorStr) || !cuotas || !fecha) {
      this.showNotification('error', 'Error de validación', 'Por favor completa todos los campos con valores válidos');
      return;
    }

    if (valor <= 0) {
      this.showNotification('error', 'Valor inválido', 'El valor del producto debe ser mayor a 0');
      return;
    }

    if (cuotas <= 0) {
      this.showNotification('error', 'Cuotas inválidas', 'El número de cuotas debe ser mayor a 0');
      return;
    }

    const startDate = new Date(fecha);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + cuotas);

    const product = {
      id: Date.now().toString(),
      name: nombre,
      totalValue: valor,
      installments: cuotas,
      startDate: startDate,
      endDate: endDate,
      monthlyPayment: valor / cuotas
    };

    this.state.products.push(product);
    this.saveProducts();
    this.renderProducts();
    this.clearForm();
    this.updateStats();
    
    // Mostrar notificación de éxito con valor formateado
    try {
      this.showNotification('success', '¡Producto agregado!', 
        `"${nombre}" por $${this.formatLatinNumber(valor)} se ha agregado correctamente`);
    } catch (error) {
      console.error('❌ Error en showNotification:', error);
      // Fallback
      alert(`✅ Producto agregado: "${nombre}" por $${this.formatLatinNumber(valor)}`);
    }
    
    // Generar recordatorios automáticamente
    this.generateReminders();
  }

  loadStoredProducts() {
    try {
      const stored = localStorage.getItem('calculadora-productos');
      if (stored) {
        const products = JSON.parse(stored);
        this.state.products = products.map(p => ({
          ...p,
          startDate: new Date(p.startDate),
          endDate: new Date(p.endDate)
        }));
        console.log(`📦 Productos cargados desde localStorage: ${this.state.products.length}`);
        
        // Generar recordatorios para productos existentes
        setTimeout(() => {
          this.generateReminders();
        }, 2000); // Esperar a que el sistema de recordatorios esté listo
      } else {
        console.log('📦 No hay productos guardados en localStorage');
        this.state.products = [];
      }
    } catch (error) {
      console.error('❌ Error cargando productos:', error);
      this.state.products = [];
    }
  }

  saveProducts() {
    try {
      localStorage.setItem('calculadora-productos', JSON.stringify(this.state.products));
      
      // También guardar en el formato que espera el sistema de recordatorios
      localStorage.setItem('products', JSON.stringify(this.state.products));
      
      // Generar recordatorios si hay productos
      this.generateReminders();
    } catch (error) {
      console.error('Error guardando productos:', error);
    }
  }

  // Generar recordatorios para todos los productos
  generateReminders() {
    if (this.state.products.length > 0) {
      console.log('📅 Generando recordatorios para', this.state.products.length, 'productos');
      // Llamar a la función global si existe
      if (typeof window.generateReminders === 'function') {
        try {
          window.generateReminders(this.state.products);
        } catch (error) {
          console.error('❌ Error generando recordatorios:', error);
        }
      }
    }
  }

  renderProducts() {
    console.log('🎨 Renderizando productos...', this.state.products);
    const container = document.getElementById('listaProductos');
    const btnBorrarTodo = document.getElementById('btnBorrarTodo');
    
    if (!container) {
      console.error('❌ Contenedor listaProductos no encontrado');
      return;
    }

    if (this.state.products.length === 0) {
      console.log('📭 No hay productos para mostrar');
      container.innerHTML = '<p class="no-products">No hay productos registrados. ¡Agrega tu primer producto arriba! 🚀</p>';
      
      // Ocultar botón eliminar todos
      if (btnBorrarTodo) {
        btnBorrarTodo.style.display = 'none';
      }
      
      // No hay productos, ocultar botón de eliminar todo
      return;
    }

    console.log(`📦 Renderizando ${this.state.products.length} productos`);
    container.innerHTML = this.state.products.map(product => `
      <div class="product-card" data-id="${product.id}">
        <div class="product-header">
          <h4>${product.name}</h4>
          <div class="product-actions">
            <button class="btn-edit" onclick="window.app.editProduct('${product.id}')">✏️ Editar</button>
            <button class="btn-delete" onclick="window.app.deleteProduct('${product.id}')">🗑️ Eliminar</button>
          </div>
        </div>
        <div class="product-details">
          <p><strong>Valor Total:</strong> $${this.formatLatinNumber(product.totalValue)}</p>
          <p><strong>Cuotas:</strong> ${product.installments}</p>
          <p><strong>Cuota Mensual:</strong> $${this.formatLatinNumber(product.monthlyPayment)}</p>
          <p><strong>Inicio:</strong> ${product.startDate.toLocaleDateString()}</p>
          <p><strong>Fin:</strong> ${product.endDate.toLocaleDateString()}</p>
        </div>
      </div>
    `).join('');
    
    // Mostrar botón eliminar todos si hay productos
    if (btnBorrarTodo) {
      btnBorrarTodo.style.display = 'block';
    }
    
    console.log('✅ Productos renderizados correctamente');
    
    // Generar recordatorios si hay productos
    this.generateReminders();
  }

  clearForm() {
    document.getElementById('nombreProducto').value = '';
    document.getElementById('valorTotalProducto').value = '';
    document.getElementById('numeroCuotas').value = '';
    document.getElementById('fechaInicio').value = '';
  }

  updateStats() {
    console.log('📊 Actualizando estadísticas...', this.state.products);
    const totalProducts = this.state.products.length;
    const totalValue = this.state.products.reduce((sum, p) => sum + p.totalValue, 0);
    const monthlyAverage = this.state.products.reduce((sum, p) => sum + p.monthlyPayment, 0);

    console.log(`📊 Stats: ${totalProducts} productos, $${totalValue} total, $${monthlyAverage} mensual`);

    document.getElementById('totalProductos').textContent = totalProducts.toString();
    document.getElementById('valorTotal').textContent = `$${this.formatLatinNumber(totalValue)}`;
    document.getElementById('promedioMensual').textContent = `$${this.formatLatinNumber(monthlyAverage)}`;
    document.getElementById('proximoMes').textContent = `$${this.formatLatinNumber(monthlyAverage)}`;

    // Actualizar gráfico
    this.updateChart();
  }

  updateChart() {
    const canvas = document.getElementById('gastosChart');
    const chartMessage = document.getElementById('chartMessage');
    
    if (!canvas) return;

    // Si no hay productos, mostrar mensaje vacío
    if (this.state.products.length === 0) {
      if (chartMessage) chartMessage.style.display = 'flex';
      canvas.style.display = 'none';
      return;
    }

    // Ocultar mensaje y mostrar canvas
    if (chartMessage) chartMessage.style.display = 'none';
    canvas.style.display = 'block';

    // Calcular número de meses según el rango seleccionado
    const monthsToShow = this.getMonthsToShow();
    
    // Preparar datos del gráfico
    const { months, payments } = this.generateChartData(monthsToShow);

    // Destruir gráfico anterior si existe
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    // Crear configuración según el tipo de gráfico
    const chartConfig = this.getChartConfig(months, payments);

    // Crear nuevo gráfico
    const ctx = canvas.getContext('2d');
    if (ctx && window.Chart) {
      this.chartInstance = new window.Chart(ctx, chartConfig);
      console.log(`✅ Gráfico actualizado: tipo ${this.state.currentChartType}, rango ${this.state.currentTimeRange}`);
    }
  }

  getMonthsToShow() {
    switch (this.state.currentTimeRange) {
      case '3m': return 3;
      case '6m': return 6;
      case 'all':
      default: return 12;
    }
  }

  generateChartData(monthsToShow) {
    const months = [];
    const payments = [];
    const currentDate = new Date();
    
    for (let i = 0; i < monthsToShow; i++) {
      const month = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      months.push(month.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }));
      
      // Calcular pagos para este mes
      const monthPayments = this.state.products
        .filter(product => {
          const productStart = new Date(product.startDate);
          const productEnd = new Date(product.endDate);
          return month >= productStart && month <= productEnd;
        })
        .reduce((sum, product) => sum + product.monthlyPayment, 0);
      
      payments.push(Math.round(monthPayments));
    }

    return { months, payments };
  }

  getChartConfig(months, payments) {
    const baseConfig = {
      data: {
        labels: months,
        datasets: [this.getDatasetConfig(payments)]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: '#667eea',
            borderWidth: 1,
            cornerRadius: 8,
            callbacks: {
              label: function(context) {
                return `Cuotas: $${context.parsed.y.toLocaleString('es-ES')}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return '$' + value.toLocaleString('es-ES');
              },
              color: '#666'
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.1)',
              drawBorder: false
            }
          },
          x: {
            ticks: {
              color: '#666'
            },
            grid: {
              display: false
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    };

    // Agregar tipo específico
    baseConfig.type = this.getChartJSType();
    
    return baseConfig;
  }

  getChartJSType() {
    // Mapear nuestros tipos a tipos de Chart.js
    switch (this.state.currentChartType) {
      case 'line': return 'line';
      case 'area': return 'line'; // Área es una línea con fill
      case 'bar':
      default: return 'bar';
    }
  }

  getDatasetConfig(payments) {
    const baseDataset = {
      data: payments,
      tension: 0.4,
      borderWidth: 3,
      pointRadius: 6,
      pointHoverRadius: 8,
      pointBackgroundColor: '#fff',
      pointBorderWidth: 3
    };

    switch (this.state.currentChartType) {
      case 'line':
        return {
          ...baseDataset,
          label: 'Pagos Mensuales',
          borderColor: '#667eea',
          backgroundColor: 'transparent',
          pointBorderColor: '#667eea',
          fill: false
        };
        
      case 'area':
        return {
          ...baseDataset,
          label: 'Pagos Mensuales',
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          pointBorderColor: '#667eea',
          fill: true
        };
        
      case 'bar':
      default:
        return {
          label: 'Pagos Mensuales',
          data: payments,
          backgroundColor: 'rgba(102, 126, 234, 0.8)',
          borderColor: '#667eea',
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false,
          hoverBackgroundColor: 'rgba(102, 126, 234, 0.9)',
          hoverBorderColor: '#5a6fd8'
        };
    }
  }

  updateTimeRange(range) {
    this.state.currentTimeRange = range;
    
    // Actualizar botones activos
    document.querySelectorAll('.time-range-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-range="${range}"]`)?.classList.add('active');
    
    // Actualizar gráfico con nuevo rango
    this.updateChart();
    console.log(`Rango de tiempo actualizado: ${range}`);
  }

  updateChartType(type) {
    this.state.currentChartType = type;
    
    // Actualizar botones activos
    document.querySelectorAll('.chart-type-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-type="${type}"]`)?.classList.add('active');
    
    // Actualizar gráfico con nuevo tipo
    this.updateChart();
    console.log(`Tipo de gráfico actualizado: ${type}`);
    
    // Mostrar notificación del cambio
    const typeNames = {
      'bar': 'Gráfico de Barras',
      'line': 'Gráfico de Líneas', 
      'area': 'Gráfico de Área'
    };
    this.showNotification('info', 'Vista actualizada', `Cambiado a ${typeNames[type]}`, 3000);
  }

  async generatePDF() {
    try {
      // Verificar si jsPDF está disponible (diferentes formas de acceso)
      let jsPDFConstructor = null;
      
      // Método 1: jsPDF como constructor directo (más moderno)
      if (typeof window.jsPDF === 'function') {
        jsPDFConstructor = window.jsPDF;
        console.log('✅ jsPDF encontrado como constructor directo');
      }
      // Método 2: jsPDF.jsPDF (versión UMD)
      else if (window.jsPDF && typeof window.jsPDF.jsPDF === 'function') {
        jsPDFConstructor = window.jsPDF.jsPDF;
        console.log('✅ jsPDF encontrado como window.jsPDF.jsPDF');
      }
      // Método 3: jspdf namespace (alternativo)
      else if (window.jspdf && typeof window.jspdf.jsPDF === 'function') {
        jsPDFConstructor = window.jspdf.jsPDF;
        console.log('✅ jsPDF encontrado como window.jspdf.jsPDF');
      }
      
      if (!jsPDFConstructor) {
        console.error('❌ jsPDF no encontrado. Objetos disponibles:', {
          'window.jsPDF': typeof window.jsPDF,
          'window.jspdf': typeof window.jspdf,
          'window.jsPDF.jsPDF': window.jsPDF ? typeof window.jsPDF.jsPDF : 'N/A'
        });
        alert('Error: jsPDF no está disponible. Verifica que la librería se haya cargado correctamente.');
        return;
      }

      console.log('📄 Creando documento PDF avanzado...');
      const doc = new jsPDFConstructor();
      
      // === PÁGINA 1: PORTADA Y RESUMEN ===
      await this.generatePDFCoverPage(doc);
      
      // === PÁGINA 2: GRÁFICO ===
      if (this.state.products.length > 0) {
        doc.addPage();
        await this.generatePDFChartPage(doc);
        
        // === PÁGINAS 3+: CARDS MENSUALES ===
        await this.generatePDFMonthlyCards(doc);
      }
      
      // Guardar
      doc.save(`calculadora-cuotas-reporte-${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`);
      console.log('✅ PDF generado exitosamente');
      
    } catch (error) {
      console.error('❌ Error generando PDF:', error);
      alert('Error al generar el PDF: ' + error.message);
    }
  }

  generatePDFCoverPage(doc) {
    // Paleta de colores moderna y minimalista
    const navy = [33, 47, 61]; // Azul marino elegante
    const teal = [26, 188, 156]; // Verde azulado vibrante
    const emerald = [46, 204, 113]; // Verde esmeralda
    const amber = [243, 156, 18]; // Ámbar dorado
    const coral = [231, 76, 60]; // Coral vibrante
    const violet = [155, 89, 182]; // Violeta suave
    const slate = [52, 73, 94]; // Pizarra elegante
    const silver = [189, 195, 199]; // Plata clara
    const cream = [253, 254, 254]; // Crema sutil
    const charcoal = [44, 62, 80]; // Carbón oscuro
    
    // === PORTADA MODERNA CON GRADIENTE SIMULADO ===
    // Fondo principal en azul marino
    doc.setFillColor(...navy);
    doc.rect(0, 0, 210, 65, 'F');
    
    // Banda decorativa superior en teal
    doc.setFillColor(...teal);
    doc.rect(0, 0, 210, 8, 'F');
    
    // === TÍTULO PRINCIPAL CON ESTILO ===
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'light');
    doc.text('CALCULADORA DE CUOTAS', 20, 32);
    
    // Subtítulo elegante
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Reporte Financiero Inteligente', 20, 48);
    
    // Fecha estilizada
    doc.setFontSize(10);
    const currentDate = new Date();
    const dateStr = currentDate.toLocaleDateString('es-CO', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    doc.text(`Generado el ${dateStr}`, 20, 58);
    
    // === VERIFICACIÓN DE PRODUCTOS ===
    if (this.state.products.length === 0) {
      doc.setFillColor(...cream);
      doc.rect(15, 80, 180, 40, 'F');
      
      doc.setTextColor(...slate);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      doc.text('No hay productos registrados', 25, 95);
      
      doc.setFontSize(11);
      doc.setTextColor(...silver);
      doc.text('Agrega productos para generar un reporte completo con análisis detallado', 25, 110);
      return;
    }
    
    // === MENSAJE DE BIENVENIDA PERSONALIZADO ===
    doc.setFillColor(...cream);
    doc.rect(15, 75, 180, 20, 'F');
    
    doc.setTextColor(...charcoal);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('¡Hola! Tu resumen financiero está listo con insights personalizados', 20, 82);
    doc.text('Información organizada para decisiones financieras inteligentes', 20, 90);
    
    // === ESTADÍSTICAS EN TARJETAS PREMIUM ===
    const totalValue = this.state.products.reduce((sum, p) => sum + p.totalValue, 0);
    const monthlyTotal = this.state.products.reduce((sum, p) => sum + p.monthlyPayment, 0);
    const avgValue = Math.round(totalValue / this.state.products.length);
    const totalDuration = Math.max(...this.state.products.map(p => p.installments));
    
    // Título de sección
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...navy);
    doc.text('Panorama Financiero', 20, 110);
    
    // Línea decorativa
    doc.setDrawColor(...teal);
    doc.setLineWidth(1.5);
    doc.line(20, 115, 190, 115);
    doc.setLineWidth(0.2);
    
    // Tarjetas de estadísticas modernas
    const stats = [
      { 
        icon: 'PRODUCTOS',
        label: 'Productos activos', 
        value: this.state.products.length.toString(), 
        color: teal,
        unit: 'items'
      },
      { 
        icon: 'INVERSIÓN',
        label: 'Inversión total', 
        value: `$${totalValue.toLocaleString('es-CO')}`, 
        color: emerald,
        unit: 'COP'
      },
      { 
        icon: 'MENSUAL',
        label: 'Compromiso mensual', 
        value: `$${Math.round(monthlyTotal).toLocaleString('es-CO')}`, 
        color: amber,
        unit: 'COP/mes'
      },
      { 
        icon: 'PROMEDIO',
        label: 'Valor promedio', 
        value: `$${avgValue.toLocaleString('es-CO')}`, 
        color: violet,
        unit: 'COP'
      }
    ];
    
    let yPos = 125;
    stats.forEach((stat, index) => {
      const x = 20 + (index % 2) * 90;
      const y = yPos + Math.floor(index / 2) * 38;
      
      // Fondo de tarjeta elegante
      doc.setFillColor(255, 255, 255);
      doc.rect(x, y, 85, 32, 'F');
      
      // Borde colorido premium
      doc.setDrawColor(...stat.color);
      doc.setLineWidth(1.2);
      doc.rect(x, y, 85, 32, 'S');
      doc.setLineWidth(0.2);
      
      // Acento de color superior
      doc.setFillColor(...stat.color);
      doc.rect(x, y, 85, 4, 'F');
      
      // Emoji grande
      doc.setTextColor(...charcoal);
      doc.setFontSize(16);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(stat.icon, x + 6, y + 15);
      
      // Etiqueta descriptiva
      doc.setFontSize(7);
      doc.setTextColor(...silver);
      doc.setFont('helvetica', 'normal');
      doc.text(stat.label.toUpperCase(), x + 22, y + 10);
      
      // Valor principal
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...stat.color);
      doc.text(stat.value, x + 22, y + 20);
      
      // Unidad opcional
      doc.setFontSize(6);
      doc.setTextColor(...silver);
      doc.setFont('helvetica', 'normal');
      doc.text(stat.unit, x + 22, y + 26);
    });
    
    // === GALERÍA DE PRODUCTOS PREMIUM ===
    yPos = 205;
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...navy);
    doc.text('Cartera de Productos', 20, yPos);
    
    // Línea decorativa
    doc.setDrawColor(...emerald);
    doc.setLineWidth(1);
    doc.line(20, yPos + 3, 140, yPos + 3);
    doc.setLineWidth(0.2);
    
    yPos += 15;
    
    this.state.products.forEach((product, index) => {
      if (yPos > 270) return;
      
      // Determinar emoji según el tipo de producto
      let productType = this.getProductType(product.name);
      
      // Paleta de colores rotativos para productos
      const productColors = [teal, emerald, amber, coral, violet];
      const productColor = productColors[index % productColors.length];
      
      // Tarjeta mini para cada producto
      doc.setFillColor(255, 255, 255);
      doc.rect(20, yPos - 2, 170, 14, 'F');
      
      // Borde lateral colorido
      doc.setFillColor(...productColor);
      doc.rect(20, yPos - 2, 3, 14, 'F');
      
      // Información del producto
      doc.setTextColor(...charcoal);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(product.name, 28, yPos + 6);
      
      // Detalles financieros con colores específicos
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      
      // Valor total
      doc.setTextColor(...emerald);
      doc.text(`${product.totalValue.toLocaleString('es-CO')}`, 28, yPos + 10);
      
      // Cuotas
      doc.setTextColor(...amber);
      doc.text(`${product.installments} pagos`, 85, yPos + 10);
      
      // Pago mensual
      doc.setTextColor(...coral);
      doc.text(`� $${Math.round(product.monthlyPayment).toLocaleString('es-CO')}/mes`, 135, yPos + 10);
      
      yPos += 16;
    });
    
    // === CONSEJO FINANCIERO DESTACADO ===
    if (yPos < 275) {
      yPos = Math.max(yPos + 5, 275);
      
      // Fondo destacado
      doc.setFillColor(...teal);
      doc.rect(15, yPos, 180, 15, 'F');
      
      // Texto del consejo
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Consejo Inteligente:', 20, yPos + 6);
      
      doc.setFont('helvetica', 'normal');
      doc.text(`Reserva $${Math.round(monthlyTotal * 0.15).toLocaleString('es-CO')} mensuales para emergencias (15% de tus compromisos)`, 20, yPos + 11);
    }
  }
  
  // Función auxiliar para determinar emoji de producto
  getProductType(productName) {
    const name = productName.toLowerCase();
    
    // Tecnología
    if (name.includes('laptop') || name.includes('computador') || name.includes('pc') || name.includes('macbook')) return 'TECH';
    if (name.includes('celular') || name.includes('phone') || name.includes('móvil') || name.includes('iphone') || name.includes('samsung')) return 'PHONE';
    if (name.includes('tablet') || name.includes('ipad')) return 'PHONE';
    if (name.includes('tv') || name.includes('televisor') || name.includes('smart tv') || name.includes('pantalla')) return 'TV';
    if (name.includes('playstation') || name.includes('xbox') || name.includes('gaming') || name.includes('nintendo')) return 'GAME';
    if (name.includes('auriculares') || name.includes('headphones') || name.includes('audífonos')) return 'AUDIO';
    if (name.includes('cámara') || name.includes('camera') || name.includes('gopro')) return 'CAMERA';
    
    // Vehículos
    if (name.includes('carro') || name.includes('auto') || name.includes('vehículo') || name.includes('toyota') || name.includes('chevrolet') || name.includes('ford')) return 'AUTO';
    if (name.includes('moto') || name.includes('motocicleta') || name.includes('yamaha') || name.includes('honda')) return 'MOTO';
    if (name.includes('bicicleta') || name.includes('bike')) return 'BIKE';
    
    // Hogar
    if (name.includes('casa') || name.includes('apartamento') || name.includes('vivienda') || name.includes('inmueble')) return 'HOME';
    if (name.includes('refrigerador') || name.includes('nevera') || name.includes('heladera')) return 'FRIDGE';
    if (name.includes('lavadora') || name.includes('secadora')) return 'WASH';
    if (name.includes('horno') || name.includes('microondas') || name.includes('estufa')) return 'COOK';
    if (name.includes('sofá') || name.includes('mueble') || name.includes('cama')) return 'FURNITURE';
    
    // Educación y trabajo
    if (name.includes('curso') || name.includes('educación') || name.includes('capacitación') || name.includes('universidad')) return 'EDU';
    if (name.includes('libro') || name.includes('manual')) return 'BOOK';
    
    // Salud y deporte
    if (name.includes('bicicleta') || name.includes('gimnasio') || name.includes('deporte')) return 'SPORT';
    if (name.includes('médico') || name.includes('salud') || name.includes('dental')) return 'HEALTH';
    
    // Viajes
    if (name.includes('viaje') || name.includes('vacaciones') || name.includes('vuelo')) return 'TRAVEL';
    if (name.includes('hotel') || name.includes('hospedaje')) return 'HOTEL';
    
    // Servicios
    if (name.includes('seguro') || name.includes('póliza')) return 'INSUR';
    if (name.includes('internet') || name.includes('wifi') || name.includes('plan')) return 'NET';
    
    // Default
    return 'ITEM';
  }

  async generatePDFChartPage(doc) {
    // Paleta moderna y vibrante
    const navy = [33, 47, 61]; 
    const teal = [26, 188, 156];
    const emerald = [46, 204, 113];
    const amber = [243, 156, 18];
    const coral = [231, 76, 60];
    const violet = [155, 89, 182];
    const slate = [52, 73, 94];
    const silver = [189, 195, 199];
    const cream = [253, 254, 254];
    const charcoal = [44, 62, 80];
    
    // === HEADER MODERNO ===
    // Fondo principal con esquinas redondeadas
    doc.setFillColor(...navy);
    doc.rect(0, 0, 210, 50, 'F');
    
    // Acento decorativo superior
    doc.setFillColor(...teal);
    doc.rect(0, 0, 210, 6, 'F');
    
    // Título principal
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'light');
    doc.text('Analisis Visual de Pagos', 20, 25);
    
    // Subtítulo
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Distribucion mensual de compromisos financieros', 20, 38);
    
    doc.setTextColor(...charcoal);
    
    // === SECCIÓN DEL GRÁFICO ===
    const canvas = document.getElementById('gastosChart');
    if (canvas && this.chartInstance) {
      try {
        // Generar imagen del gráfico con alta calidad
        const chartImage = canvas.toDataURL('image/png', 1.0);
        
        // Marco elegante para el gráfico con esquinas redondeadas
        doc.setFillColor(...cream);
        doc.rect(10, 60, 190, 125, 'F');
        
        // Borde decorativo con degradado simulado
        doc.setDrawColor(...teal);
        doc.setLineWidth(2);
        doc.rect(10, 60, 190, 125, 'S');
        
        // Borde interno más sutil
        doc.setDrawColor(...silver);
        doc.setLineWidth(0.5);
        doc.rect(15, 65, 180, 115, 'S');
        doc.setLineWidth(0.2);
        
        // Añadir imagen del gráfico
        doc.addImage(chartImage, 'PNG', 20, 70, 170, 105);
        
        // === INFORMACIÓN CONTEXTUAL ===
        doc.setFillColor(...teal);
        doc.rect(15, 190, 180, 8, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Grafico generado en tiempo real desde la aplicacion', 20, 196);
        
      } catch (error) {
        console.error('Error capturando gráfico:', error);
        
        // Diseño de error elegante con esquinas redondeadas
        doc.setFillColor(...cream);
        doc.rect(15, 70, 180, 80, 'F');
        
        doc.setDrawColor(...coral);
        doc.setLineWidth(1.5);
        doc.rect(15, 70, 180, 80, 'S');
        doc.setLineWidth(0.2);
        
        doc.setTextColor(...coral);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Grafico no disponible', 25, 100);
        
        doc.setTextColor(...charcoal);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text('El grafico no pudo ser capturado en este momento.', 25, 115);
        doc.text('Asegurate de que el grafico este visible antes de generar el PDF.', 25, 125);
        
        // Consejo útil con esquinas redondeadas
        doc.setFillColor(...amber);
        doc.rect(25, 135, 150, 10, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('Tip: Navega a la seccion de estadisticas antes de exportar', 30, 142);
      }
    } else {
      // Diseño cuando no hay gráfico con esquinas redondeadas
      doc.setFillColor(...cream);
      doc.rect(15, 70, 180, 80, 'F');
      
      doc.setDrawColor(...silver);
      doc.setLineWidth(1);
      doc.rect(15, 70, 180, 80, 'S');
      doc.setLineWidth(0.2);
      
      doc.setTextColor(...slate);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      doc.text('Grafico no inicializado', 25, 105);
      
      doc.setTextColor(...charcoal);
      doc.setFontSize(10);
      doc.text('No hay datos suficientes para generar el grafico estadistico.', 25, 120);
      doc.text('Agrega productos y navega a la seccion de estadisticas.', 25, 130);
    }
    
    // === PANEL DE INSIGHTS ===
    let yPos = 210;
    
    // Título de insights con esquinas redondeadas
    doc.setFillColor(...violet);
    doc.rect(15, yPos, 180, 12, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Insights del Grafico', 20, yPos + 8);
    
    yPos += 20;
    
    // Puntos de análisis modernos
    const insights = [
      {
        title: 'Distribucion Temporal',
        description: 'Cada barra muestra el total de compromisos mensuales programados'
      },
      {
        title: 'Codificacion Visual',
        description: 'Los colores ayudan a distinguir periodos y facilitan la lectura'
      },
      {
        title: 'Balance Financiero',
        description: 'Observa la distribucion de carga para planificar mejor tu presupuesto'
      },
      {
        title: 'Tendencias',
        description: 'Identifica patrones en tus compromisos para optimizar futuras decisiones'
      }
    ];
    
    insights.forEach((insight, index) => {
      const x = 20 + (index % 2) * 90;
      const y = yPos + Math.floor(index / 2) * 16;
      
      // Punto de color para cada insight (círculo con esquinas redondeadas)
      doc.setFillColor(...[teal, emerald, amber, coral][index]);
      doc.circle(x + 3, y + 3, 2, 'F');
      
      doc.setTextColor(...charcoal);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`[${index + 1}] ${insight.title}`, x + 8, y + 5);
      
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...slate);
      doc.text(insight.description, x + 8, y + 9);
    });
    
    // === NOTA DE NAVEGACIÓN ===
    yPos += 40;
    doc.setFillColor(...cream);
    doc.rect(15, yPos, 180, 15, 'F');
    
    doc.setDrawColor(...teal);
    doc.setLineWidth(0.8);
    doc.rect(15, yPos, 180, 15, 'S');
    doc.setLineWidth(0.2);
    
    doc.setTextColor(...teal);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Proxima seccion:', 20, yPos + 6);
    
    doc.setTextColor(...charcoal);
    doc.setFont('helvetica', 'normal');
    doc.text('Cronograma detallado con tarjetas mensuales organizadas', 20, yPos + 11);
  }

  async generatePDFMonthlyCards(doc) {
    // Paleta moderna y vibrante
    const navy = [33, 47, 61]; 
    const teal = [26, 188, 156];
    const emerald = [46, 204, 113];
    const amber = [243, 156, 18];
    const coral = [231, 76, 60];
    const violet = [155, 89, 182];
    const slate = [52, 73, 94];
    const silver = [189, 195, 199];
    const cream = [253, 254, 254];
    const charcoal = [44, 62, 80];
    
    const monthlyData = this.generateMonthlyBreakdown();
    
    doc.addPage();
    
    // === HEADER PREMIUM ===
    doc.setFillColor(...navy);
    doc.rect(0, 0, 210, 50, 'F');
    
    // Acento superior decorativo
    doc.setFillColor(...emerald);
    doc.rect(0, 0, 210, 6, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'light');
    doc.text('Cronograma Financiero', 20, 25);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Planificación mensual detallada de tus compromisos', 20, 38);
    
    doc.setTextColor(...charcoal);
    
    let yPos = 60;
    let currentPage = 1;
    
    // === RESUMEN ESTADÍSTICO INICIAL ===
    if (monthlyData.length > 0) {
      // Calcular estadísticas
      const totalMonths = monthlyData.length;
      const avgMonthly = monthlyData.reduce((sum, month) => sum + month.total, 0) / totalMonths;
      const maxMonth = Math.max(...monthlyData.map(month => month.total));
      const minMonth = Math.min(...monthlyData.map(month => month.total));
      
      // Panel de estadísticas
      doc.setFillColor(...cream);
      doc.rect(15, yPos, 180, 25, 'F');
      
      doc.setDrawColor(...emerald);
      doc.setLineWidth(1);
      doc.rect(15, yPos, 180, 25, 'S');
      doc.setLineWidth(0.2);
      
      // Línea superior decorativa
      doc.setFillColor(...emerald);
      doc.rect(15, yPos, 180, 3, 'F');
      
      doc.setTextColor(...charcoal);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Resumen del Cronograma', 20, yPos + 10);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...slate);
      
      // Estadísticas en línea
      doc.text(`${totalMonths} meses programados`, 20, yPos + 16);
      doc.text(`Promedio: ${Math.round(avgMonthly).toLocaleString('es-CO')}`, 65, yPos + 16);
      doc.text(`Máximo: ${Math.round(maxMonth).toLocaleString('es-CO')}`, 120, yPos + 16);
      doc.text(`Mínimo: ${Math.round(minMonth).toLocaleString('es-CO')}`, 170, yPos + 16);
      
      doc.setTextColor(...emerald);
      doc.text(`Organización inteligente para ${totalMonths} meses de compromisos`, 20, yPos + 21);
      
      yPos += 35;
    }
    
    // === TARJETAS MENSUALES PREMIUM ===
    monthlyData.forEach((monthData, index) => {
      // Nueva página si es necesario
      if (yPos > 220) {
        doc.addPage();
        currentPage++;
        yPos = 30;
        
        // Header mini en páginas adicionales
        doc.setFillColor(...navy);
        doc.rect(0, 0, 210, 25, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.text(`Cronograma - Página ${currentPage}`, 20, 16);
        
        doc.setTextColor(...charcoal);
        yPos = 35;
      }
      
      // Dibujar tarjeta moderna
      this.drawModernMonthlyCard(doc, monthData, 15, yPos, index);
      yPos += 42; // Altura optimizada
    });
    
    // === MENSAJE CUANDO NO HAY DATOS ===
    if (monthlyData.length === 0) {
      doc.setFillColor(...cream);
      doc.rect(15, yPos, 180, 50, 'F');
      
      doc.setDrawColor(...silver);
      doc.setLineWidth(1);
      doc.rect(15, yPos, 180, 50, 'S');
      doc.setLineWidth(0.2);
      
      doc.setTextColor(...slate);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'light');
      doc.text('📭 Cronograma vacío', 25, yPos + 20);
      
      doc.setTextColor(...charcoal);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('No hay compromisos financieros programados en el tiempo.', 25, yPos + 32);
      
      doc.setTextColor(...teal);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text('💡 Agrega productos con fechas para ver la planificación detallada', 25, yPos + 42);
    }
    
    // === PÁGINA DE CONSEJOS FINANCIEROS ===
    if (monthlyData.length > 0) {
      doc.addPage();
      this.generateFinancialTipsPage(doc, monthlyData);
    }
  }

  drawModernMonthlyCard(doc, monthData, x, y, cardIndex) {
    const cardWidth = 180;
    const cardHeight = 38;
    
    // Paleta moderna para las tarjetas
    const navy = [33, 47, 61]; 
    const teal = [26, 188, 156];
    const emerald = [46, 204, 113];
    const amber = [243, 156, 18];
    const coral = [231, 76, 60];
    const violet = [155, 89, 182];
    const slate = [52, 73, 94];
    const silver = [189, 195, 199];
    const cream = [253, 254, 254];
    const charcoal = [44, 62, 80];
    
    // Colores rotativos para cada tarjeta
    const cardColors = [teal, emerald, amber, coral, violet, navy];
    const cardColor = cardColors[cardIndex % cardColors.length];
    
    // === FONDO PRINCIPAL ===
    doc.setFillColor(...cream);
    doc.rect(x, y, cardWidth, cardHeight, 'F');
    
    // === BORDE MODERNO ===
    doc.setDrawColor(...cardColor);
    doc.setLineWidth(0.8);
    doc.rect(x, y, cardWidth, cardHeight, 'S');
    doc.setLineWidth(0.2);
    
    // === BANDA LATERAL COLORIDA ===
    doc.setFillColor(...cardColor);
    doc.rect(x, y, 4, cardHeight, 'F');
    
    // === INFORMACIÓN DEL MES ===
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const monthName = `${monthNames[monthData.date.getMonth()]} ${monthData.date.getFullYear()}`;
    
    // Header del mes con fondo sutil
    doc.setFillColor(255, 255, 255);
    doc.rect(x + 8, y + 4, cardWidth - 12, 12, 'F');
    
    // Emoji y nombre del mes
    doc.setTextColor(...charcoal);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('FECHA', x + 8, y + 11);
    doc.text(monthName, x + 20, y + 11);
    
    // Total del mes con estilo destacado
    doc.setTextColor(...cardColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    const totalText = `$${Math.round(monthData.total).toLocaleString('es-CO')}`;
    const totalWidth = doc.getTextWidth(totalText);
    doc.text(totalText, x + cardWidth - totalWidth - 12, y + 11);
    
    // === PRODUCTOS DEL MES ===
    doc.setTextColor(...charcoal);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
    let productY = y + 20;
    const maxProducts = Math.min(2, monthData.products.length);
    
    for (let i = 0; i < maxProducts; i++) {
      const product = monthData.products[i];
      
      // Tipo del producto usando la función auxiliar
      const productType = this.getProductType(product.name);
      
      // Nombre del producto (optimizado)
      const maxLength = 28;
      const productName = product.name.length > maxLength ? 
        product.name.substring(0, maxLength) + '...' : product.name;
      
      // Información del producto
      doc.setTextColor(...charcoal);
      doc.text(productName, x + 12, productY);
      
      // Detalles financieros con colores
      doc.setTextColor(...silver);
      doc.setFontSize(7);
      const paymentInfo = `$${Math.round(product.payment).toLocaleString('es-CO')} • Cuota ${product.installmentNumber}/${product.totalInstallments}`;
      doc.text(paymentInfo, x + 110, productY);
      
      productY += 8;
    }
    
    // === PRODUCTOS ADICIONALES ===
    if (monthData.products.length > 2) {
      doc.setTextColor(...silver);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.text(`+ ${monthData.products.length - 2} productos más`, x + 12, productY);
    }
    
    // === INDICADOR DE CARGA ===
    // Calcular intensidad del mes para mostrar indicador visual
    const allTotals = this.generateMonthlyBreakdown().map(m => m.total);
    const maxTotal = Math.max(...allTotals);
    const intensity = monthData.total / maxTotal;
    
    // Barra de intensidad
    const barWidth = 30;
    const filledWidth = barWidth * intensity;
    
    doc.setFillColor(...silver);
    doc.rect(x + cardWidth - 40, y + cardHeight - 6, barWidth, 2, 'F');
    
    doc.setFillColor(...cardColor);
    doc.rect(x + cardWidth - 40, y + cardHeight - 6, filledWidth, 2, 'F');
  }

  generateFinancialTipsPage(doc, monthlyData) {
    // Paleta moderna
    const navy = [33, 47, 61]; 
    const teal = [26, 188, 156];
    const emerald = [46, 204, 113];
    const amber = [243, 156, 18];
    const coral = [231, 76, 60];
    const violet = [155, 89, 182];
    const slate = [52, 73, 94];
    const silver = [189, 195, 199];
    const cream = [253, 254, 254];
    const charcoal = [44, 62, 80];
    
    // === HEADER PREMIUM ===
    doc.setFillColor(...violet);
    doc.rect(0, 0, 210, 50, 'F');
    
    // Acento superior
    doc.setFillColor(...amber);
    doc.rect(0, 0, 210, 6, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'light');
    doc.text('💡 Consejos Financieros', 20, 25);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Recomendaciones personalizadas para tu perfil económico', 20, 38);
    
    // === ANÁLISIS PERSONALIZADO ===
    let yPos = 65;
    const totalMonthly = monthlyData.reduce((sum, month) => sum + month.total, 0) / monthlyData.length;
    const totalProducts = this.state.products.length;
    const totalInvestment = this.state.products.reduce((sum, p) => sum + p.totalValue, 0);
    
    // Panel de perfil
    doc.setFillColor(...cream);
    doc.rect(15, yPos, 180, 30, 'F');
    
    doc.setDrawColor(...violet);
    doc.setLineWidth(1);
    doc.rect(15, yPos, 180, 30, 'S');
    doc.setLineWidth(0.2);
    
    // Línea superior decorativa
    doc.setFillColor(...violet);
    doc.rect(15, yPos, 180, 4, 'F');
    
    doc.setTextColor(...charcoal);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('🎯 Tu Perfil Financiero', 20, yPos + 12);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...slate);
    
    // Estadísticas del perfil
    doc.text(`💰 Compromiso mensual promedio: $${Math.round(totalMonthly).toLocaleString('es-CO')}`, 20, yPos + 19);
    doc.text(`📦 ${totalProducts} productos en tu portafolio`, 20, yPos + 25);
    doc.text(`💎 Inversión total: $${totalInvestment.toLocaleString('es-CO')}`, 110, yPos + 19);
    doc.text(`${monthlyData.length} meses de planificación`, 110, yPos + 25);
    
    yPos += 40;
    
    // === CONSEJOS PERSONALIZADOS ===
    const tips = [
      {
        emoji: '🚨',
        title: 'Fondo de Emergencia',
        description: `Ahorra $${Math.round(totalMonthly * 0.2).toLocaleString('es-CO')} mensuales`,
        detail: 'Equivale al 20% de tus compromisos mensuales',
        color: coral,
        priority: 'ALTA'
      },
      {
        emoji: '⏰',
        title: 'Alertas Inteligentes',
        description: 'Configura recordatorios 3-5 días antes de cada pago',
        detail: 'Evita cargos por mora y mantén tu historial crediticio',
        color: amber,
        priority: 'MEDIA'
      },
      {
        emoji: '📊',
        title: 'Revisión Mensual',
        description: 'Analiza tu progreso cada 30 días',
        detail: 'Ajusta tu presupuesto según cambios en ingresos',
        color: teal,
        priority: 'MEDIA'
      },
      {
        emoji: '⚡',
        title: 'Pagos Anticipados',
        description: 'Considera abonos extra cuando sea posible',
        detail: 'Reduce el tiempo total de financiamiento',
        color: emerald,
        priority: 'BAJA'
      },
      {
        emoji: '🎯',
        title: 'Planificación Estratégica',
        description: 'Evita nuevos compromisos en meses pesados',
        detail: 'Distribuye la carga financiera de manera inteligente',
        color: violet,
        priority: 'ALTA'
      },
      {
        emoji: '📈',
        title: 'Diversificación',
        description: 'No concentres todos los pagos en las mismas fechas',
        detail: 'Distribuye los vencimientos a lo largo del mes',
        color: navy,
        priority: 'MEDIA'
      }
    ];
    
    tips.forEach((tip, index) => {
      const x = 15 + (index % 2) * 90;
      const y = yPos + Math.floor(index / 2) * 32;
      
      // Tarjeta del consejo
      doc.setFillColor(255, 255, 255);
      doc.rect(x, y, 85, 28, 'F');
      
      // Borde colorido
      doc.setDrawColor(...tip.color);
      doc.setLineWidth(1);
      doc.rect(x, y, 85, 28, 'S');
      doc.setLineWidth(0.2);
      
      // Acento lateral
      doc.setFillColor(...tip.color);
      doc.rect(x, y, 3, 28, 'F');
      
      // Prioridad
      doc.setFillColor(...tip.color);
      doc.rect(x + 65, y + 2, 18, 6, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(5);
      doc.setFont('helvetica', 'bold');
      doc.text(tip.priority, x + 66, y + 6);
      
      // Emoji y título
      doc.setTextColor(...charcoal);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`${tip.emoji} ${tip.title}`, x + 6, y + 10);
      
      // Descripción
      doc.setTextColor(...slate);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(tip.description, x + 6, y + 16);
      
      // Detalle
      doc.setTextColor(...tip.color);
      doc.setFontSize(6);
      doc.setFont('helvetica', 'italic');
      doc.text(tip.detail, x + 6, y + 22);
    });
    
    // === MENSAJE MOTIVACIONAL FINAL ===
    yPos += 105;
    
    doc.setFillColor(...emerald);
    doc.rect(15, yPos, 180, 25, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('🌟 ¡Excelente Planificación!', 20, yPos + 10);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Has dado un paso importante hacia la estabilidad financiera.', 20, yPos + 17);
    doc.text('Continúa monitoreando y ajustando tu estrategia según tus objetivos.', 20, yPos + 22);
    
    // === PIE DE PÁGINA ELEGANTE ===
    yPos += 35;
    
    doc.setFillColor(...cream);
    doc.rect(15, yPos, 180, 20, 'F');
    
    doc.setDrawColor(...teal);
    doc.setLineWidth(0.5);
    doc.rect(15, yPos, 180, 20, 'S');
    doc.setLineWidth(0.2);
    
    doc.setTextColor(...teal);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('🙏 Gracias por usar la Calculadora de Cuotas', 20, yPos + 8);
    
    doc.setTextColor(...charcoal);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Herramienta desarrollada para optimizar tu gestión financiera personal', 20, yPos + 14);
    
    // Marca de tiempo del reporte
    const now = new Date();
    const timestamp = now.toLocaleString('es-CO');
    doc.setTextColor(...silver);
    doc.setFontSize(7);
    doc.text(`Reporte generado: ${timestamp}`, 140, yPos + 17);
  }

  generateElegantSummaryPage(doc, monthlyData) {
    // Paleta minimalista
    const primary = [52, 73, 94];
    const accent = [74, 144, 226];
    const success = [46, 204, 113];
    const warning = [241, 196, 15];
    const lightGray = [248, 249, 250];
    const mediumGray = [149, 165, 166];
    const darkText = [44, 62, 80];
    
    // === HEADER ===
    doc.setFillColor(...success);
    doc.rect(0, 0, 210, 45, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'light');
    doc.text('💡 CONSEJOS FINANCIEROS', 20, 22);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Recomendaciones personalizadas para tu perfil', 20, 35);
    
    // === ANÁLISIS PERSONAL ===
    let yPos = 65;
    const totalMonthly = monthlyData.reduce((sum, month) => sum + month.total, 0) / monthlyData.length;
    
    doc.setFillColor(...lightGray);
    doc.rect(15, yPos, 180, 25, 'F');
    
    doc.setTextColor(...accent);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('📊 TU PERFIL FINANCIERO', 20, yPos + 10);
    
    doc.setTextColor(...darkText);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`💰 Pago mensual promedio: $${Math.round(totalMonthly).toLocaleString('es-CO')}`, 20, yPos + 18);
    doc.text(`Meses con pagos: ${monthlyData.length}`, 110, yPos + 18);
    
    yPos += 35;
    
    // === CONSEJOS MINIMALISTAS ===
    const tips = [
      {
        emoji: '🚨',
        title: 'Fondo de Emergencia',
        description: `Ahorra $${Math.round(totalMonthly * 0.2).toLocaleString('es-CO')} mensuales (20% de tus pagos)`,
        color: warning
      },
      {
        emoji: '⏰',
        title: 'Recordatorios Inteligentes',
        description: 'Configura alertas 3 días antes de cada fecha de pago',
        color: accent
      },
      {
        emoji: '📈',
        title: 'Revisión Mensual',
        description: 'Analiza tu progreso y ajusta tu presupuesto regularmente',
        color: primary
      },
      {
        emoji: '⚡',
        title: 'Pagos Adelantados',
        description: 'Considera pagos extra cuando tengas ingresos adicionales',
        color: success
      }
    ];
    
    tips.forEach((tip, index) => {
      // Borde sutil colorido
      doc.setDrawColor(...tip.color);
      doc.setLineWidth(0.8);
      doc.rect(15, yPos, 180, 20, 'S');
      doc.setLineWidth(0.2);
      
      // Emoji y título
      doc.setTextColor(...darkText);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`${tip.emoji} ${tip.title}`, 20, yPos + 8);
      
      // Descripción
      doc.setTextColor(...mediumGray);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(tip.description, 20, yPos + 15);
      
      // Línea de color
      doc.setDrawColor(...tip.color);
      doc.setLineWidth(2);
      doc.line(20, yPos + 17, 185, yPos + 17);
      
      yPos += 30;
    });
    
    // === MENSAJE FINAL ELEGANTE ===
    yPos += 10;
    doc.setFillColor(...lightGray);
    doc.rect(15, yPos, 180, 20, 'F');
    
    doc.setTextColor(...primary);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('🙏 Gracias por usar la Calculadora de Cuotas', 20, yPos + 8);
    
    doc.setTextColor(...darkText);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Gestiona tus finanzas de manera inteligente. ¡Que tengas un excelente día!', 20, yPos + 15);
  }

  drawEnhancedMonthlyCard(doc, monthData, x, y, cardIndex) {
    const cardWidth = 180;
    const cardHeight = 55;
    
    // Colores vibrantes
    const gradientBlue = [102, 126, 234];
    const gradientPurple = [118, 75, 162];
    const vibrantGreen = [76, 175, 80];
    const vibrantOrange = [255, 152, 0];
    const vibrantRed = [244, 67, 54];
    const vibrantCyan = [0, 188, 212];
    const darkText = [51, 51, 51];
    
    // Seleccionar color de tema para la tarjeta (rotativo)
    const themeColors = [gradientBlue, gradientPurple, vibrantCyan, vibrantGreen, vibrantOrange];
    const themeColor = themeColors[cardIndex % themeColors.length];
    const lightThemeColor = this.lightenColor(themeColor, 0.9);
    
    // === SOMBRA DE LA TARJETA ===
    doc.setFillColor(200, 200, 200);
    doc.roundedRect(x + 2, y + 2, cardWidth, cardHeight, 4, 4, 'F');
    
    // === FONDO PRINCIPAL DE LA TARJETA ===
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, y, cardWidth, cardHeight, 4, 4, 'F');
    
    // === BORDE COLORIDO HERMOSO ===
    doc.setDrawColor(...themeColor);
    doc.setLineWidth(2);
    doc.roundedRect(x, y, cardWidth, cardHeight, 4, 4, 'S');
    doc.setLineWidth(0.2);
    
    // === HEADER DE LA TARJETA CON GRADIENTE SIMULADO ===
    doc.setFillColor(...themeColor);
    doc.roundedRect(x, y, cardWidth, 18, 4, 4, 'F');
    
    // Rectángulo blanco para cortar las esquinas inferiores del header
    doc.setFillColor(255, 255, 255);
    doc.rect(x, y + 14, cardWidth, 4, 'F');
    
    // === INFORMACIÓN DEL MES EN EL HEADER ===
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const monthName = `${monthNames[monthData.date.getMonth()]} ${monthData.date.getFullYear()}`;
    
    // Emoji del calendario simulado
    doc.setFillColor(255, 255, 255);
    doc.circle(x + 8, y + 9, 3, 'F');
    doc.setTextColor(...themeColor);
    doc.setFontSize(8);
    doc.text('CAL', x + 6, y + 10);
    
    // Nombre del mes
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text(monthName, x + 18, y + 11);
    
    // Total del mes destacado
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    const totalText = `$${Math.round(monthData.total).toLocaleString('es-CO')}`;
    const totalWidth = doc.getTextWidth(totalText);
    doc.text(totalText, x + cardWidth - totalWidth - 10, y + 11);
    
    // === CONTENIDO DE LA TARJETA ===
    doc.setTextColor(...darkText);
    let contentY = y + 25;
    
    // Mostrar productos con íconos coloridos
    const maxProducts = Math.min(3, monthData.products.length);
    
    for (let i = 0; i < maxProducts; i++) {
      const product = monthData.products[i];
      
      // Color único para cada producto
      const productColors = [vibrantGreen, vibrantCyan, vibrantOrange, vibrantRed, gradientPurple];
      const productColor = productColors[i % productColors.length];
      
      // Círculo colorido para el producto (emoji simulado)
      doc.setFillColor(...productColor);
      doc.circle(x + 8, contentY + 3, 2.5, 'F');
      
      // Nombre del producto
      doc.setTextColor(...darkText);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      const productName = product.name.length > 25 ? product.name.substring(0, 25) + '...' : product.name;
      doc.text(productName, x + 15, contentY + 4);
      
      // Información de la cuota con fondo colorido
      doc.setFillColor(...this.lightenColor(productColor, 0.8));
      doc.roundedRect(x + 95, contentY, 35, 8, 1, 1, 'F');
      doc.setTextColor(...productColor);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(`$${Math.round(product.payment).toLocaleString('es-CO')}`, x + 97, contentY + 5);
      
      // Número de cuota
      doc.setFillColor(...this.lightenColor(themeColor, 0.8));
      doc.roundedRect(x + 135, contentY, 40, 8, 1, 1, 'F');
      doc.setTextColor(...themeColor);
      doc.text(`Cuota ${product.installmentNumber}/${product.totalInstallments}`, x + 137, contentY + 5);
      
      contentY += 10;
    }
    
    // === PRODUCTOS ADICIONALES ===
    if (monthData.products.length > 3) {
      doc.setFillColor(...this.lightenColor(themeColor, 0.9));
      doc.roundedRect(x + 8, contentY, 165, 8, 1, 1, 'F');
      doc.setTextColor(...themeColor);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.text(`... y ${monthData.products.length - 3} productos mas`, x + 12, contentY + 5);
    }
    
    // === BARRA DE PROGRESO VISUAL ===
    const progressY = y + cardHeight - 8;
    const progressWidth = (cardWidth - 20) * Math.min(1, cardIndex / 12); // Simular progreso temporal
    
    // Fondo de la barra
    doc.setFillColor(240, 240, 240);
    doc.roundedRect(x + 10, progressY, cardWidth - 20, 4, 2, 2, 'F');
    
    // Progreso coloreado
    if (progressWidth > 0) {
      doc.setFillColor(...themeColor);
      doc.roundedRect(x + 10, progressY, progressWidth, 4, 2, 2, 'F');
    }
  }

  // Función auxiliar para aclarar colores
  lightenColor(color, factor) {
    return color.map(c => Math.min(255, Math.round(c + (255 - c) * factor)));
  }

  // Nueva página de consejos financieros
  generateFinancialTipsPage(doc, monthlyData) {
    const gradientBlue = [102, 126, 234];
    const gradientPurple = [118, 75, 162];
    const vibrantGreen = [76, 175, 80];
    const vibrantOrange = [255, 152, 0];
    const darkText = [51, 51, 51];
    
    // === HEADER DE CONSEJOS ===
    doc.setFillColor(...vibrantGreen);
    doc.rect(0, 0, 210, 50, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('CONSEJOS FINANCIEROS PERSONALIZADOS', 20, 25);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Recomendaciones basadas en tu perfil financiero', 20, 40);
    
    // === ANÁLISIS PERSONALIZADO ===
    let yPos = 70;
    const totalMonthly = monthlyData.reduce((sum, month) => sum + month.total, 0) / monthlyData.length;
    
    // Tarjeta de análisis
    doc.setFillColor(232, 245, 233); // verde claro
    doc.roundedRect(15, yPos, 180, 30, 3, 3, 'F');
    
    doc.setTextColor(...vibrantGreen);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('TU PERFIL FINANCIERO:', 20, yPos + 10);
    
    doc.setTextColor(...darkText);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Promedio mensual: $${Math.round(totalMonthly).toLocaleString('es-CO')}`, 20, yPos + 20);
    doc.text(`Meses con pagos: ${monthlyData.length}`, 20, yPos + 27);
    
    yPos += 45;
    
    // === CONSEJOS ESPECÍFICOS ===
    const tips = [
      {
        icon: 'emergency',
        title: 'Fondo de Emergencia',
        description: 'Mantén ahorrado el 20% de tu pago mensual total para imprevistos.',
        amount: Math.round(totalMonthly * 0.2),
        color: vibrantOrange
      },
      {
        icon: 'reminder',
        title: 'Recordatorios Inteligentes',
        description: 'Programa alertas 3 días antes de cada pago para estar preparado.',
        color: gradientBlue
      },
      {
        icon: 'review',
        title: 'Revisión Mensual',
        description: 'Analiza tu progreso cada mes y ajusta tu presupuesto según sea necesario.',
        color: gradientPurple
      },
      {
        icon: 'optimization',
        title: 'Optimización de Pagos',
        description: 'Considera pagos adelantados cuando tengas ingresos extra disponibles.',
        color: vibrantGreen
      }
    ];
    
    tips.forEach((tip, index) => {
      // Tarjeta de consejo
      doc.setFillColor(...this.lightenColor(tip.color, 0.9));
      doc.roundedRect(15, yPos, 180, 25, 2, 2, 'F');
      
      // Ícono circular
      doc.setFillColor(...tip.color);
      doc.circle(25, yPos + 12, 5, 'F');
      
      // Título
      doc.setTextColor(...tip.color);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(tip.title, 35, yPos + 10);
      
      // Descripción
      doc.setTextColor(...darkText);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(tip.description, 35, yPos + 17);
      
      // Monto específico si aplica
      if (tip.amount) {
        doc.setTextColor(...tip.color);
        doc.setFont('helvetica', 'bold');
        doc.text(`Sugerencia: $${tip.amount.toLocaleString('es-CO')}`, 35, yPos + 22);
      }
      
      yPos += 35;
    });
    
    // === MENSAJE DE DESPEDIDA ===
    yPos += 10;
    doc.setFillColor(224, 247, 250); // cyan claro
    doc.roundedRect(15, yPos, 180, 25, 3, 3, 'F');
    
    doc.setTextColor(...gradientBlue);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Gracias por usar la Calculadora de Cuotas!', 20, yPos + 10);
    
    doc.setTextColor(...darkText);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Esperamos que este reporte te ayude a mantener un mejor control', 20, yPos + 18);
    doc.text('de tus finanzas. Que tengas un excelente día!', 20, yPos + 24);
  }

  generateMonthlyBreakdown() {
    const monthlyMap = new Map();
    
    this.state.products.forEach(product => {
      const startDate = new Date(product.startDate);
      const monthlyPayment = product.monthlyPayment;
      
      for (let i = 0; i < product.installments; i++) {
        const paymentDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
        const monthKey = `${paymentDate.getFullYear()}-${(paymentDate.getMonth() + 1).toString().padStart(2, '0')}`;
        
        if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, {
            date: paymentDate,
            monthKey,
            products: [],
            total: 0
          });
        }
        
        const monthData = monthlyMap.get(monthKey);
        monthData.products.push({
          name: product.name,
          payment: monthlyPayment,
          installmentNumber: i + 1,
          totalInstallments: product.installments,
          remaining: product.installments - (i + 1)
        });
        monthData.total += monthlyPayment;
      }
    });
    
    // Convertir a array y ordenar por fecha (sin símbolos especiales)
    return Array.from(monthlyMap.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map(item => ({
        ...item,
        // Asegurar que los números estén redondeados correctamente
        total: Math.round(item.total * 100) / 100,
        products: item.products.map(product => ({
          ...product,
          payment: Math.round(product.payment * 100) / 100
        }))
      }));
  }

  editProduct(id) {
    const product = this.state.products.find(p => p.id === id);
    if (!product) return;

    // Cargar datos en el modal con formato latinoamericano
    document.getElementById('modal-nombre').value = product.name;
    document.getElementById('modal-valor').value = this.formatLatinNumber(product.totalValue);
    document.getElementById('modal-cuotas').value = product.installments;
    document.getElementById('modal-fecha').value = product.startDate.toISOString().split('T')[0];

    // Guardar ID para edición
    this.currentEditingId = id;

    // Mostrar modal
    this.openModal('editModal');
  }

  saveEditedProduct() {
    if (!this.currentEditingId) return;

    const nombre = document.getElementById('modal-nombre').value;
    const valorStr = document.getElementById('modal-valor').value;
    const cuotas = parseInt(document.getElementById('modal-cuotas').value);
    const fecha = document.getElementById('modal-fecha').value;

    // Usar la nueva función de parseo latinoamericano
    const valor = this.parseLatinNumber(valorStr);

    if (!nombre || !this.isValidNumber(valorStr) || !cuotas || !fecha) {
      this.showNotification('error', 'Error de validación', 'Por favor completa todos los campos con valores válidos');
      return;
    }

    if (valor <= 0) {
      this.showNotification('error', 'Valor inválido', 'El valor del producto debe ser mayor a 0');
      return;
    }

    if (cuotas <= 0) {
      this.showNotification('error', 'Cuotas inválidas', 'El número de cuotas debe ser mayor a 0');
      return;
    }

    const productIndex = this.state.products.findIndex(p => p.id === this.currentEditingId);
    if (productIndex === -1) return;

    const startDate = new Date(fecha);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + cuotas);

    this.state.products[productIndex] = {
      ...this.state.products[productIndex],
      name: nombre,
      totalValue: valor,
      installments: cuotas,
      startDate: startDate,
      endDate: endDate,
      monthlyPayment: valor / cuotas
    };

    this.saveProducts();
    this.renderProducts();
    this.updateStats();
    this.closeModal('editModal');
    this.currentEditingId = null;
    
    // Mostrar notificación de éxito con valor formateado
    try {
      this.showNotification('success', '¡Producto actualizado!', 
        `"${nombre}" por $${this.formatLatinNumber(valor)} se ha modificado correctamente`);
    } catch (error) {
      console.error('❌ Error en showNotification:', error);
      // Fallback
      alert(`✅ Producto actualizado: "${nombre}" por $${this.formatLatinNumber(valor)}`);
    }
  }

  deleteProduct(id) {
    const product = this.state.products.find(p => p.id === id);
    if (!product) return;

    // Mostrar nombre del producto en el modal de confirmación
    document.getElementById('confirm-product-name').textContent = product.name;
    
    // Guardar ID para eliminación
    this.currentDeletingId = id;

    // Mostrar modal de confirmación normal
    this.openModal('confirmModal');
  }

  confirmDelete() {
    if (!this.currentDeletingId) return;

    const product = this.state.products.find(p => p.id === this.currentDeletingId);
    const productName = product ? product.name : 'Producto';

    this.state.products = this.state.products.filter(p => p.id !== this.currentDeletingId);
    this.saveProducts();
    this.renderProducts();
    this.updateStats();
    this.closeModal('confirmModal');
    this.currentDeletingId = null;
    
    // Mostrar notificación de eliminación
    try {
      this.showNotification('warning', 'Producto eliminado', `"${productName}" se ha eliminado correctamente`);
    } catch (error) {
      console.error('❌ Error en showNotification:', error);
      // Fallback
      alert(`⚠️ Producto eliminado: "${productName}"`);
    }
  }

  handleDeleteAllProducts() {
    if (this.state.products.length === 0) {
      try {
        this.showNotification('info', 'Sin productos', 'No hay productos para eliminar');
      } catch (error) {
        console.error('❌ Error en showNotification:', error);
        alert('ℹ️ No hay productos para eliminar');
      }
      return;
    }

    const productCount = this.state.products.length;
    
    // Crear modal de confirmación personalizado para eliminar todos
    if (confirm(`¿Estás seguro de que deseas eliminar TODOS los ${productCount} productos?\n\nEsta acción no se puede deshacer.`)) {
      this.state.products = [];
      this.saveProducts();
      this.renderProducts();
      this.updateStats();
      
      // Mostrar notificación de eliminación masiva
      try {
        this.showNotification('warning', 'Productos eliminados', `Se eliminaron ${productCount} productos correctamente`);
      } catch (error) {
        console.error('❌ Error en showNotification:', error);
        // Fallback
        alert(`⚠️ Se eliminaron ${productCount} productos correctamente`);
      }
    }
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      // Mostrar el modal sin animación primero
      modal.style.display = 'flex';
      
      // Remover clases anteriores de animación
      modal.classList.remove('closing');
      
      // Usar requestAnimationFrame para asegurar que el display se aplique antes de la animación
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          modal.classList.add('show');
        });
      });
      
      // Agregar clase al body para prevenir scroll
      document.body.style.overflow = 'hidden';
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      // Añadir clase de cierre para animación de salida
      modal.classList.add('closing');
      modal.classList.remove('show');
      
      // Esperar a que termine la animación antes de ocultar
      setTimeout(() => {
        modal.style.display = 'none';
        modal.classList.remove('closing');
        
        // Restaurar scroll del body
        document.body.style.overflow = '';
      }, 400); // 400ms coincide con la nueva duración de la transición CSS
    }
  }

  showLoading() {
    const loading = document.getElementById('loadingIndicator');
    if (loading) {
      loading.style.display = 'flex';
    }
  }

  hideLoading() {
    const loading = document.getElementById('loadingIndicator');
    if (loading) {
      loading.style.display = 'none';
    }
  }

  showError(message) {
    this.showNotification('error', 'Error', message);
  }

  // Sistema de notificaciones flotantes
  showNotification(type = 'info', title = '', message = '', duration = 5000) {
    console.log(`🔔 NOTIFICACIÓN: ${type} - ${title} - ${message}`);
    
    const container = document.getElementById('notificationContainer');
    if (!container) {
      console.error('❌ CRÍTICO: Contenedor de notificaciones no encontrado');
      console.log('📍 Buscando contenedor...');
      console.log('- document.getElementById:', document.getElementById('notificationContainer'));
      console.log('- querySelector:', document.querySelector('#notificationContainer'));
      
      // Fallback: usar alert si no hay contenedor
      alert(`${title}: ${message}`);
      return;
    }

    console.log('✅ Contenedor encontrado, creando notificación...');

    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Definir iconos según el tipo
    const icons = {
      success: 'fas fa-check-circle',
      error: 'fas fa-exclamation-circle',
      warning: 'fas fa-exclamation-triangle',
      info: 'fas fa-info-circle'
    };

    notification.innerHTML = `
      <div class="notification-icon">
        <i class="${icons[type] || icons.info}"></i>
      </div>
      <div class="notification-content">
        ${title ? `<div class="notification-title">${title}</div>` : ''}
        <div class="notification-message">${message}</div>
      </div>
      <button class="notification-close">
        <i class="fas fa-times"></i>
      </button>
      <div class="notification-progress"></div>
    `;

    try {
      // Agregar al contenedor
      container.appendChild(notification);
      console.log('✅ Notificación agregada al DOM');

      // Configurar cierre manual
      const closeBtn = notification.querySelector('.notification-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          this.removeNotification(notification);
        });
      }

      // Mostrar con animación
      setTimeout(() => {
        notification.classList.add('show');
        console.log('✅ Animación de mostrar aplicada');
      }, 50);

      // Barra de progreso
      const progressBar = notification.querySelector('.notification-progress');
      if (progressBar && duration > 0) {
        progressBar.style.width = '100%';
        progressBar.style.transitionDuration = `${duration}ms`;
        
        setTimeout(() => {
          progressBar.style.width = '0%';
        }, 100);

        // Auto-remover después del tiempo especificado
        setTimeout(() => {
          this.removeNotification(notification);
        }, duration);
      }
    } catch (error) {
      console.error('❌ Error creando notificación:', error);
      alert(`${title}: ${message}`);
    }
  }

  removeNotification(notification) {
    if (!notification || !notification.parentNode) return;
    
    notification.classList.remove('show');
    notification.classList.add('hide');
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 400);
  }

  // Función para mostrar múltiples notificaciones
  showMultipleNotifications(notifications) {
    notifications.forEach((notif, index) => {
      setTimeout(() => {
        this.showNotification(notif.type, notif.title, notif.message, notif.duration);
      }, index * 200); // Delay progresivo para mejor UX
    });
  }

  // Inicializar sistema de recordatorios
  async initializeReminders() {
    try {
      console.log('🔔 Inicializando sistema de recordatorios...');
      
      // Verificar que el módulo esté disponible
      if (typeof RemindersManager === 'undefined') {
        console.warn('⚠️ RemindersManager no encontrado - continuando sin recordatorios');
        return;
      }
      
      console.log('📋 Creando instancia de RemindersManager...');
      this.remindersManager = new RemindersManager();
      
      // Hacer disponible globalmente
      window.remindersManager = this.remindersManager;
      
      console.log('✅ Sistema de recordatorios inicializado correctamente');
    } catch (error) {
      console.error('❌ Error inicializando recordatorios:', error);
      console.warn('⚠️ Continuando sin sistema de recordatorios');
      // No lanzar el error para que la app continúe funcionando
    }
  }

  // ===================================================
  // UTILIDADES PARA NÚMEROS EN FORMATO LATINOAMERICANO
  // ===================================================

  /**
   * Parsea un número en formato latinoamericano
   * Acepta: 1.500,75 / 1,500.75 / 1500.75 / 1500,75 / 1500
   */
  parseLatinNumber(value) {
    if (!value || typeof value !== 'string') return 0;
    
    // Limpiar espacios y validar que contiene solo números, puntos y comas
    const cleanValue = value.trim().replace(/\s+/g, '');
    if (!/^[\d.,]+$/.test(cleanValue)) return 0;
    
    // Contar puntos y comas
    const dotCount = (cleanValue.match(/\./g) || []).length;
    const commaCount = (cleanValue.match(/,/g) || []).length;
    
    let result;
    
    if (dotCount === 0 && commaCount === 0) {
      // Solo números: 1500
      result = parseFloat(cleanValue);
    } else if (dotCount === 1 && commaCount === 0) {
      // Solo punto: 1500.75 (formato US) o 1.500 (separador de miles EU)
      const parts = cleanValue.split('.');
      if (parts[1] && parts[1].length <= 2) {
        // Decimal: 1500.75
        result = parseFloat(cleanValue);
      } else {
        // Miles: 1.500 -> 1500
        result = parseFloat(cleanValue.replace('.', ''));
      }
    } else if (dotCount === 0 && commaCount === 1) {
      // Solo coma: 1500,75 (decimal EU) o 1,500 (separador de miles US poco común)
      const parts = cleanValue.split(',');
      if (parts[1] && parts[1].length <= 2) {
        // Decimal: 1500,75 -> 1500.75
        result = parseFloat(cleanValue.replace(',', '.'));
      } else {
        // Miles: 1,500 -> 1500
        result = parseFloat(cleanValue.replace(',', ''));
      }
    } else if (dotCount > 0 && commaCount === 1) {
      // Formato mixto: 1.500,75 (EU) o 1,500.75 (US)
      const lastDotIndex = cleanValue.lastIndexOf('.');
      const lastCommaIndex = cleanValue.lastIndexOf(',');
      
      if (lastCommaIndex > lastDotIndex) {
        // Formato EU: 1.500,75
        result = parseFloat(cleanValue.replace(/\./g, '').replace(',', '.'));
      } else {
        // Formato US: 1,500.75
        result = parseFloat(cleanValue.replace(/,/g, ''));
      }
    } else {
      // Casos complejos: múltiples separadores
      // Asumir que el último es decimal
      if (cleanValue.endsWith('.') || cleanValue.endsWith(',')) {
        // Termina en separador, remover
        result = parseFloat(cleanValue.slice(0, -1).replace(/[.,]/g, ''));
      } else {
        // Tomar los últimos 1-2 dígitos como decimales
        const lastSeparatorIndex = Math.max(
          cleanValue.lastIndexOf('.'),
          cleanValue.lastIndexOf(',')
        );
        const beforeDecimal = cleanValue.substring(0, lastSeparatorIndex).replace(/[.,]/g, '');
        const afterDecimal = cleanValue.substring(lastSeparatorIndex + 1);
        
        if (afterDecimal.length <= 2) {
          result = parseFloat(`${beforeDecimal}.${afterDecimal}`);
        } else {
          result = parseFloat(beforeDecimal + afterDecimal);
        }
      }
    }
    
    return isNaN(result) ? 0 : result;
  }

  /**
   * Formatea un número al formato latinoamericano preferido
   * Usa punto para miles y coma para decimales: 1.500,75
   */
  formatLatinNumber(number, decimals = 2) {
    if (!number || isNaN(number)) return '0,00';
    
    const parts = number.toFixed(decimals).split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const decimalPart = parts[1];
    
    return decimals > 0 ? `${integerPart},${decimalPart}` : integerPart;
  }

  /**
   * Valida si un string puede ser parseado como número
   */
  isValidNumber(value) {
    if (!value || typeof value !== 'string') return false;
    const cleanValue = value.trim().replace(/\s+/g, '');
    return /^[\d.,]+$/.test(cleanValue) && this.parseLatinNumber(cleanValue) >= 0;
  }

  /**
   * Configura validación en tiempo real para inputs numéricos
   */
  setupNumberInputValidation() {
    const numberInputs = [
      document.getElementById('valorTotalProducto'),
      document.getElementById('modal-valor')
    ];

    numberInputs.forEach(input => {
      if (!input) return;

      // Validación en tiempo real mientras el usuario escribe
      input.addEventListener('input', (e) => {
        this.validateNumberInput(e.target);
      });

      // Validación al perder el foco
      input.addEventListener('blur', (e) => {
        this.validateNumberInput(e.target, true);
      });

      // Formatear valor al perder el foco
      input.addEventListener('blur', (e) => {
        const value = this.parseLatinNumber(e.target.value);
        if (value > 0) {
          e.target.value = this.formatLatinNumber(value);
        }
      });
    });
  }

  /**
   * Valida un input numérico y aplica clases CSS
   */
  validateNumberInput(input, strict = false) {
    const value = input.value.trim();
    const helpText = input.nextElementSibling;
    
    // Limpiar clases anteriores
    input.classList.remove('error', 'valid');
    
    if (!value) {
      if (strict) {
        input.classList.add('error');
        if (helpText && helpText.classList.contains('input-help')) {
          helpText.textContent = 'Este campo es obligatorio';
          helpText.style.color = '#dc3545';
        }
      }
      return false;
    }

    const isValid = this.isValidNumber(value);
    const numericValue = this.parseLatinNumber(value);
    
    if (!isValid || numericValue <= 0) {
      input.classList.add('error');
      if (helpText && helpText.classList.contains('input-help')) {
        helpText.textContent = 'Formato inválido. Ej: 1.500,75 o 1,500.75';
        helpText.style.color = '#dc3545';
      }
      return false;
    } else {
      input.classList.add('valid');
      if (helpText && helpText.classList.contains('input-help')) {
        helpText.textContent = `Valor: $${this.formatLatinNumber(numericValue)}`;
        helpText.style.color = '#28a745';
      }
      return true;
    }
  }

  // Función de prueba para notificaciones
  testNotification() {
    console.log('🧪 Probando sistema de notificaciones...');
    this.showNotification('success', 'Prueba exitosa', 'El sistema de notificaciones está funcionando correctamente');
  }

  // Función auxiliar para rectángulos con esquinas redondeadas
  drawRoundedRect(doc, x, y, width, height, radius, style = 'S') {
    try {
      // Verificar si jsPDF tiene la función roundedRect
      if (typeof doc.roundedRect === 'function') {
        doc.roundedRect(x, y, width, height, radius, radius, style);
      } else {
        // Fallback: dibujar rectángulo normal
        this.drawRoundedRect(doc, x, y, width, height, style, 4, 'S');
      }
    } catch (error) {
      // Si hay error, usar rectángulo normal
      this.drawRoundedRect(doc, x, y, width, height, style, 4, 'S');
    }
  }
  
  // Función auxiliar para determinar icono de producto (texto)
  getProductIcon(productName) {
    const name = productName.toLowerCase();
    
    // Tecnología
    if (name.includes('laptop') || name.includes('computador') || name.includes('pc') || name.includes('macbook')) return '[LAPTOP]';
    if (name.includes('celular') || name.includes('phone') || name.includes('movil') || name.includes('iphone') || name.includes('samsung')) return '[PHONE]';
    if (name.includes('tablet') || name.includes('ipad')) return '[TABLET]';
    if (name.includes('tv') || name.includes('televisor') || name.includes('smart tv') || name.includes('pantalla')) return '[TV]';
    if (name.includes('playstation') || name.includes('xbox') || name.includes('gaming') || name.includes('nintendo')) return '[GAME]';
    if (name.includes('auriculares') || name.includes('headphones') || name.includes('audifonos')) return '[AUDIO]';
    if (name.includes('camara') || name.includes('camera') || name.includes('gopro')) return '[CAM]';
    
    // Vehículos
    if (name.includes('carro') || name.includes('auto') || name.includes('vehiculo') || name.includes('toyota') || name.includes('chevrolet') || name.includes('ford')) return '[CAR]';
    if (name.includes('moto') || name.includes('motocicleta') || name.includes('yamaha') || name.includes('honda')) return '[MOTO]';
    if (name.includes('bicicleta') || name.includes('bike')) return '[BIKE]';
    
    // Hogar
    if (name.includes('casa') || name.includes('apartamento') || name.includes('vivienda') || name.includes('inmueble')) return '[HOME]';
    if (name.includes('refrigerador') || name.includes('nevera') || name.includes('heladera')) return '[FRIDGE]';
    if (name.includes('lavadora') || name.includes('secadora')) return '[WASH]';
    if (name.includes('horno') || name.includes('microondas') || name.includes('estufa')) return '[OVEN]';
    if (name.includes('sofa') || name.includes('mueble') || name.includes('cama')) return '[FURN]';
    
    // Educación y trabajo
    if (name.includes('curso') || name.includes('educacion') || name.includes('capacitacion') || name.includes('universidad')) return '[EDU]';
    if (name.includes('libro') || name.includes('manual')) return '[BOOK]';
    
    // Salud y deporte
    if (name.includes('bicicleta') || name.includes('gimnasio') || name.includes('deporte')) return '[GYM]';
    if (name.includes('medico') || name.includes('salud') || name.includes('dental')) return '[HEALTH]';
    
    // Viajes
    if (name.includes('viaje') || name.includes('vacaciones') || name.includes('vuelo')) return '[TRAVEL]';
    if (name.includes('hotel') || name.includes('hospedaje')) return '[HOTEL]';
    
    // Servicios
    if (name.includes('seguro') || name.includes('poliza')) return '[SHIELD]';
    if (name.includes('internet') || name.includes('wifi') || name.includes('plan')) return '[WIFI]';
    
    // Default
    return '[ITEM]';
  }

  // Funciones mejoradas para manejar productos
}

// Inicializar aplicación cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('🟢 DOM cargado, creando aplicación JS...');
    setTimeout(() => {
      try {
        window.app = new CalculadoraCuotas();
      } catch (error) {
        console.error('❌ Error crítico inicializando aplicación:', error);
        // Mostrar mensaje de error al usuario
        const loading = document.getElementById('loadingIndicator');
        if (loading) {
          loading.innerHTML = `
            <div style="text-align: center; color: #dc3545;">
              <h3>❌ Error de Inicialización</h3>
              <p>No se pudo cargar la aplicación correctamente.</p>
              <p style="font-size: 14px; opacity: 0.8;">Error: ${error.message}</p>
              <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
                🔄 Recargar Página
              </button>
            </div>
          `;
        }
      }
    }, 100);
  });
} else {
  console.log('🟢 DOM ya está cargado, creando aplicación JS...');
  setTimeout(() => {
    try {
      window.app = new CalculadoraCuotas();
    } catch (error) {
      console.error('❌ Error crítico inicializando aplicación:', error);
      // Mostrar mensaje de error al usuario
      const loading = document.getElementById('loadingIndicator');
      if (loading) {
        loading.innerHTML = `
          <div style="text-align: center; color: #dc3545;">
            <h3>❌ Error de Inicialización</h3>
            <p>No se pudo cargar la aplicación correctamente.</p>
            <p style="font-size: 14px; opacity: 0.8;">Error: ${error.message}</p>
            <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
              🔄 Recargar Página
            </button>
          </div>
        `;
      }
    }
  }, 100);
}

// Timeout de emergencia global - Fuerza ocultar loading después de 3 segundos
setTimeout(() => {
  console.log('🚨 TIMEOUT DE EMERGENCIA - Forzando ocultado de loading');
  const loading = document.getElementById('loadingIndicator');
  if (loading && loading.style.display !== 'none') {
    loading.style.display = 'none';
    console.log('✅ Loading forzadamente ocultado por timeout de emergencia');
  }
}, 3000);

// Funciones globales de prueba
window.testNotifications = function() {
  console.log('🧪 Iniciando prueba de notificaciones...');
  if (window.app && typeof window.app.testNotification === 'function') {
    window.app.testNotification();
  } else {
    console.error('❌ Aplicación no disponible o función testNotification no existe');
  }
};

window.forceNotification = function(type = 'info', title = 'Prueba', message = 'Mensaje de prueba') {
  console.log('🔥 FORZANDO NOTIFICACIÓN:', { type, title, message });
  console.log('🔍 Estado de window.app:', !!window.app);
  
  if (window.app && typeof window.app.showNotification === 'function') {
    console.log('✅ Llamando a app.showNotification...');
    window.app.showNotification(type, title, message);
  } else {
    console.error('❌ window.app no disponible o showNotification no existe');
    console.log('🔍 window.app:', window.app);
    
    // Test directo sin la clase
    console.log('🧪 Intentando test directo...');
    const container = document.getElementById('notificationContainer');
    if (container) {
      console.log('✅ Contenedor encontrado, creando notificación manual...');
      const notif = document.createElement('div');
      notif.className = `notification ${type}`;
      notif.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
          <i class="fas fa-check-circle"></i>
          <div>
            <div style="font-weight: 600;">${title}</div>
            <div>${message}</div>
          </div>
        </div>
      `;
      container.appendChild(notif);
      
      setTimeout(() => {
        notif.classList.add('show');
      }, 100);
      
      setTimeout(() => {
        if (notif.parentNode) {
          notif.parentNode.removeChild(notif);
        }
      }, 3000);
    } else {
      console.error('❌ Ni siquiera el contenedor existe');
      alert(`${title}: ${message}`);
    }
  }
};

// Función para probar EmailJS específicamente
window.testEmailJS = function() {
  console.log('🧪 Probando configuración de EmailJS...');
  
  // Esperar un poco para asegurar que todo esté cargado
  setTimeout(() => {
    console.log('📧 EmailJS disponible:', !!window.emailjs);
    console.log('⚙️ Configuración disponible:', !!window.SERVICES_CONFIG);
    
    if (window.SERVICES_CONFIG) {
      console.log('🔧 Configuración EmailJS:', window.SERVICES_CONFIG.emailJS);
    } else {
      console.log('❌ SERVICES_CONFIG no encontrado');
      
      // Intentar acceder a la variable global directamente
      if (typeof SERVICES_CONFIG !== 'undefined') {
        window.SERVICES_CONFIG = SERVICES_CONFIG;
        console.log('✅ Configuración recuperada desde variable global');
      } else {
        console.log('❌ Tampoco existe la variable global SERVICES_CONFIG');
      }
    }
    
    if (window.emailjs && window.SERVICES_CONFIG) {
      try {
        // Intentar inicializar
        emailjs.init(window.SERVICES_CONFIG.emailJS.publicKey);
        console.log('✅ EmailJS inicializado manualmente');
        
        if (window.app) {
          window.app.showNotification('success', 'EmailJS Test', 'Configuración básica correcta');
        }
        
      } catch (error) {
        console.error('❌ Error configurando EmailJS:', error);
        if (window.app) {
          window.app.showNotification('error', 'EmailJS Config Error', error.message);
        }
      }
    } else {
      const missing = [];
      if (!window.emailjs) missing.push('emailjs');
      if (!window.SERVICES_CONFIG) missing.push('SERVICES_CONFIG');
      
      console.error('❌ Faltan dependencias:', missing);
      if (window.app) {
        window.app.showNotification('error', 'EmailJS Test', `Faltan: ${missing.join(', ')}`);
      }
    }
  }, 200); // Esperar 200ms para que se carguen los scripts
};

// Función simple para probar solo notificaciones
window.testBasicNotification = function() {
  console.log('🧪 Probando notificaciones básicas...');
  
  if (window.app && typeof window.app.showNotification === 'function') {
    window.app.showNotification('success', 'Test Básico', 'Las notificaciones básicas funcionan correctamente');
    console.log('✅ Notificaciones básicas funcionando');
  } else {
    console.error('❌ Sistema de notificaciones no disponible');
    alert('❌ Sistema de notificaciones no disponible');
  }
};
