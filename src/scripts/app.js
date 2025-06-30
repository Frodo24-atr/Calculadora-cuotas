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
    
    console.log('📊 Estado de librerías:', {
      'Chart.js': hasChart ? '✅' : '❌',
      'jsPDF': hasPDF ? '✅' : '❌',
      'EmailJS': !!window.emailjs ? '✅' : '❌',
      'Tiempo de espera': `${Date.now() - startTime}ms`
    });
    
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
    // Botón agregar producto
    const btnAgregar = document.getElementById('btnAgregarProducto');
    if (btnAgregar) {
      btnAgregar.addEventListener('click', () => {
        this.handleAddProduct();
      });
    }

    // Botón eliminar todos los productos
    const btnBorrarTodo = document.getElementById('btnBorrarTodo');
    if (btnBorrarTodo) {
      btnBorrarTodo.addEventListener('click', () => {
        this.handleDeleteAllProducts();
      });
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
    this.showNotification('success', '¡Producto agregado!', 
      `"${nombre}" por $${this.formatLatinNumber(valor)} se ha agregado correctamente`);
    
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
    if (this.remindersManager && this.state.products.length > 0) {
      try {
        this.remindersManager.generateReminders(this.state.products);
        console.log('📅 Recordatorios generados para todos los productos');
      } catch (error) {
        console.error('❌ Error generando recordatorios:', error);
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
      
      // Ocultar sección de recordatorios si no hay productos
      if (this.remindersManager) {
        this.remindersManager.toggleSection(false);
      }
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
    
    // Mostrar sección de recordatorios si hay productos y generar recordatorios
    if (this.remindersManager) {
      this.remindersManager.toggleSection(true);
      this.remindersManager.generateReminders(this.state.products);
    }
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
    // Colores de la paleta web (consistente con _variables.scss)
    const primaryBlue = [102, 126, 234]; // #667eea
    const primaryPurple = [118, 75, 162]; // #764ba2
    const lightGray = [248, 249, 250]; // #f8f9fa
    const darkGray = [51, 51, 51]; // #333
    const successGreen = [76, 175, 80]; // #4caf50
    const warningOrange = [255, 152, 0]; // #ff9800
    
    // Header principal con color de marca
    doc.setFillColor(...primaryBlue);
    doc.rect(0, 0, 210, 60, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('CALCULADORA DE CUOTAS', 20, 30);
    
    // Subtítulo
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text('Reporte Detallado de Productos y Pagos', 20, 45);
    
    // Resetear color de texto
    doc.setTextColor(...darkGray);
    
    // Fecha y hora (sin símbolos especiales)
    doc.setFontSize(12);
    const currentDate = new Date();
    const dateStr = `${currentDate.toLocaleDateString('es-ES')} ${currentDate.toLocaleTimeString('es-ES')}`;
    doc.text(`Generado el: ${dateStr}`, 20, 75);
    
    if (this.state.products.length === 0) {
      doc.setFontSize(14);
      doc.setTextColor(...primaryPurple);
      doc.text('No hay productos registrados para mostrar en este reporte.', 20, 100);
      return;
    }
    
    // Resumen ejecutivo
    const totalValue = this.state.products.reduce((sum, p) => sum + p.totalValue, 0);
    const monthlyTotal = this.state.products.reduce((sum, p) => sum + p.monthlyPayment, 0);
    const avgValue = Math.round(totalValue / this.state.products.length);
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryPurple);
    doc.text('RESUMEN EJECUTIVO', 20, 100);
    
    // Estadísticas en cajas coloreadas
    const stats = [
      { 
        label: 'Total de Productos', 
        value: this.state.products.length.toString(), 
        color: primaryBlue 
      },
      { 
        label: 'Valor Total Financiado', 
        value: `$${totalValue.toLocaleString('es-ES')}`, 
        color: successGreen 
      },
      { 
        label: 'Pago Mensual Total', 
        value: `$${Math.round(monthlyTotal).toLocaleString('es-ES')}`, 
        color: primaryPurple 
      },
      { 
        label: 'Promedio por Producto', 
        value: `$${avgValue.toLocaleString('es-ES')}`, 
        color: warningOrange 
      }
    ];
    
    let yPos = 120;
    stats.forEach((stat, index) => {
      const x = 20 + (index % 2) * 90;
      const y = yPos + Math.floor(index / 2) * 35;
      
      // Fondo de la caja
      doc.setFillColor(...lightGray);
      doc.rect(x, y, 85, 25, 'F');
      
      // Borde coloreado según el tipo de estadística
      doc.setDrawColor(...stat.color);
      doc.setLineWidth(2);
      doc.rect(x, y, 85, 25);
      doc.setLineWidth(0.2);
      
      // Etiqueta
      doc.setFontSize(9);
      doc.setTextColor(...darkGray);
      doc.setFont('helvetica', 'normal');
      doc.text(stat.label, x + 4, y + 8);
      
      // Valor
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...stat.color);
      doc.text(stat.value, x + 4, y + 18);
    });
    
    // Lista de productos
    yPos = 195;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryPurple);
    doc.text('PRODUCTOS INCLUIDOS EN EL REPORTE', 20, yPos);
    
    doc.setTextColor(...darkGray);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    yPos += 15;
    
    this.state.products.forEach((product, index) => {
      if (yPos > 275) return; // Límite de página
      
      // Número y nombre del producto
      doc.setTextColor(...darkGray);
      doc.text(`${index + 1}. ${product.name}`, 25, yPos);
      
      // Valor total en verde
      doc.setTextColor(...successGreen);
      doc.setFont('helvetica', 'bold');
      doc.text(`$${product.totalValue.toLocaleString('es-ES')}`, 115, yPos);
      
      // Número de cuotas en azul
      doc.setTextColor(...primaryBlue);
      doc.setFont('helvetica', 'normal');
      doc.text(`${product.installments} cuotas`, 155, yPos);
      
      // Pago mensual
      doc.setTextColor(...primaryPurple);
      doc.text(`$${Math.round(product.monthlyPayment).toLocaleString('es-ES')}/mes`, 25, yPos + 6);
      
      doc.setTextColor(...darkGray);
      doc.setFont('helvetica', 'normal');
      yPos += 14;
    });
  }

  async generatePDFChartPage(doc) {
    const primaryBlue = [102, 126, 234]; // #667eea
    const primaryPurple = [118, 75, 162]; // #764ba2
    const darkGray = [51, 51, 51]; // #333
    const lightGray = [248, 249, 250]; // #f8f9fa
    const dangerRed = [244, 67, 54]; // #f44336
    
    // Header con color de marca
    doc.setFillColor(...primaryBlue);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('GRAFICO DE DISTRIBUCION DE PAGOS', 20, 25);
    
    doc.setTextColor(...darkGray);
    
    // Capturar el gráfico como imagen
    const canvas = document.getElementById('gastosChart');
    if (canvas && this.chartInstance) {
      try {
        // Generar imagen del gráfico con alta calidad
        const chartImage = canvas.toDataURL('image/png', 1.0);
        
        // Marco decorativo alrededor del gráfico
        doc.setFillColor(...lightGray);
        doc.rect(15, 50, 180, 110, 'F');
        
        // Borde coloreado
        doc.setDrawColor(...primaryPurple);
        doc.setLineWidth(2);
        doc.rect(15, 50, 180, 110);
        doc.setLineWidth(0.2);
        
        // Añadir imagen al PDF
        doc.addImage(chartImage, 'PNG', 20, 55, 170, 100);
        
        // Descripción debajo del gráfico
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(...primaryPurple);
        doc.text('Grafico generado automaticamente desde la aplicacion web', 20, 170);
        
      } catch (error) {
        console.error('Error capturando gráfico:', error);
        doc.setFontSize(12);
        doc.setTextColor(...dangerRed);
        doc.text('Error al capturar el grafico. Verifique que este visible en pantalla.', 20, 80);
        doc.setFontSize(10);
        doc.setTextColor(...darkGray);
        doc.text('Consejo: Asegurese de que el grafico este cargado antes de generar el PDF.', 20, 95);
      }
    } else {
      doc.setFontSize(12);
      doc.setTextColor(...dangerRed);
      doc.text('Grafico no disponible', 20, 80);
      doc.setFontSize(10);
      doc.setTextColor(...darkGray);
      doc.text('El grafico no se ha inicializado o no hay datos para mostrar.', 20, 95);
    }
    
    // Sección de análisis
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryPurple);
    doc.text('ANALISIS DEL GRAFICO:', 20, 185);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkGray);
    
    const analysisPoints = [
      'Cada barra representa el total de pagos programados por mes',
      'La altura de las barras indica el monto total a pagar en ese periodo',
      'Los diferentes colores ayudan a distinguir los periodos temporales',
      'Se puede observar la distribucion de la carga financiera a lo largo del tiempo'
    ];
    
    let yPos = 195;
    analysisPoints.forEach(point => {
      doc.text(`• ${point}`, 25, yPos);
      yPos += 8;
    });
    
    // Nota adicional
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...primaryBlue);
    doc.text('Nota: A continuacion encontrara el detalle mensual completo de cada pago.', 20, 235);
  }

  async generatePDFMonthlyCards(doc) {
    const primaryBlue = [102, 126, 234]; // #667eea
    const primaryPurple = [118, 75, 162]; // #764ba2
    const darkGray = [51, 51, 51]; // #333
    
    // Generar datos mensuales
    const monthlyData = this.generateMonthlyBreakdown();
    
    doc.addPage();
    
    // Header con color de marca
    doc.setFillColor(...primaryBlue);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('DETALLE MENSUAL DE TODOS LOS PAGOS', 20, 25);
    
    doc.setTextColor(...darkGray);
    
    let yPos = 50;
    let currentPage = 1;
    
    monthlyData.forEach((monthData, index) => {
      // Verificar si necesitamos nueva página
      if (yPos > 235) {
        doc.addPage();
        currentPage++;
        yPos = 30;
        
        // Título en páginas adicionales
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primaryPurple);
        doc.text(`DETALLE MENSUAL - Pagina ${currentPage}`, 20, yPos);
        doc.setTextColor(...darkGray);
        yPos += 25;
      }
      
      // Dibujar tarjeta del mes
      this.drawMonthlyCard(doc, monthData, 20, yPos);
      yPos += 50; // Altura del card + espacio entre cards
    });
    
    // Si no hay datos
    if (monthlyData.length === 0) {
      doc.setFontSize(14);
      doc.setTextColor(...primaryPurple);
      doc.text('No hay datos mensuales para mostrar.', 20, 70);
      doc.setFontSize(12);
      doc.setTextColor(...darkGray);
      doc.text('Agregue productos con fechas de inicio para ver el detalle mensual.', 20, 90);
    }
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

  drawMonthlyCard(doc, monthData, x, y) {
    const cardWidth = 170;
    const cardHeight = 45;
    const primaryBlue = [102, 126, 234]; // #667eea
    const primaryPurple = [118, 75, 162]; // #764ba2
    const lightGray = [248, 249, 250]; // #f8f9fa
    const darkGray = [51, 51, 51]; // #333
    const successGreen = [76, 175, 80]; // #4caf50
    const infoBlue = [33, 150, 243]; // #2196f3
    
    // Fondo del card
    doc.setFillColor(...lightGray);
    doc.rect(x, y, cardWidth, cardHeight, 'F');
    
    // Borde del card con color principal
    doc.setDrawColor(...primaryBlue);
    doc.setLineWidth(1.5);
    doc.rect(x, y, cardWidth, cardHeight);
    doc.setLineWidth(0.2);
    
    // Header del card con color de acento
    doc.setFillColor(...primaryBlue);
    doc.rect(x, y, cardWidth, 12, 'F');
    
    // Fecha del mes en el header
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const monthName = `${monthNames[monthData.date.getMonth()]} ${monthData.date.getFullYear()}`;
    doc.text(monthName, x + 5, y + 8);
    
    // Total del mes en el header
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(`Total: $${Math.round(monthData.total).toLocaleString('es-ES')}`, x + 105, y + 8);
    
    // Resetear color de texto para el contenido
    doc.setTextColor(...darkGray);
    
    // Contenido: productos y detalles
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    let productY = y + 20;
    
    // Mostrar hasta 3 productos por card
    const maxProducts = Math.min(3, monthData.products.length);
    
    for (let i = 0; i < maxProducts; i++) {
      const product = monthData.products[i];
      
      // Información del producto
      const productText = `${i + 1}. ${product.name}`;
      const paymentText = `$${Math.round(product.payment).toLocaleString('es-ES')}`;
      const installmentText = `Cuota ${product.installmentNumber}/${product.totalInstallments}`;
      const remainingText = `(${product.remaining} restantes)`;
      
      // Nombre del producto
      doc.setTextColor(...darkGray);
      doc.setFont('helvetica', 'normal');
      doc.text(productText, x + 5, productY);
      
      // Monto del pago en verde
      doc.setTextColor(...successGreen);
      doc.setFont('helvetica', 'bold');
      doc.text(paymentText, x + 95, productY);
      
      // Información de cuotas en línea siguiente
      productY += 6;
      doc.setTextColor(...infoBlue);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.text(`${installmentText} ${remainingText}`, x + 8, productY);
      
      // Resetear formato
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      productY += 6;
    }
    
    // Si hay más productos, mostrar indicador
    if (monthData.products.length > 3) {
      doc.setTextColor(...primaryPurple);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.text(`... y ${monthData.products.length - 3} productos mas`, x + 5, productY);
    }
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
    this.showNotification('success', '¡Producto actualizado!', 
      `"${nombre}" por $${this.formatLatinNumber(valor)} se ha modificado correctamente`);
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
    this.showNotification('warning', 'Producto eliminado', `"${productName}" se ha eliminado correctamente`);
  }

  handleDeleteAllProducts() {
    if (this.state.products.length === 0) {
      this.showNotification('info', 'Sin productos', 'No hay productos para eliminar');
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
      this.showNotification('warning', 'Productos eliminados', `Se eliminaron ${productCount} productos correctamente`);
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
    const container = document.getElementById('notificationContainer');
    if (!container) return;

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

    // Agregar al contenedor
    container.appendChild(notification);

    // Configurar cierre manual
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
      this.removeNotification(notification);
    });

    // Mostrar con animación
    requestAnimationFrame(() => {
      notification.classList.add('show');
    });

    // Barra de progreso
    const progressBar = notification.querySelector('.notification-progress');
    if (duration > 0) {
      progressBar.style.width = '100%';
      progressBar.style.transitionDuration = `${duration}ms`;
      
      requestAnimationFrame(() => {
        progressBar.style.width = '0%';
      });

      // Auto-remover después del tiempo especificado
      setTimeout(() => {
        this.removeNotification(notification);
      }, duration);
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
