// Aplicación principal - Calculadora de Cuotas - Versión JavaScript
console.log('🚀 Iniciando Calculadora de Cuotas v2025.06.29 (JS)');

/**
 * Calculadora de Cuotas - Versión JavaScript pura
 */
class CalculadoraCuotas {
  constructor() {
    this.state = {
      products: [],
      currentTimeRange: 'all',
      isLoading: true,
      modal: { isOpen: false },
    };
    
    this.chartInstance = null;
    this.initialize();
  }

  async initialize() {
    try {
      console.log('🔧 Inicializando aplicación...');
      
      // Mostrar loading
      this.showLoading();
      
      // Configurar eventos básicos
      this.setupBasicEventListeners();
      
      // Cargar datos del localStorage
      this.loadStoredProducts();
      
      // Simular carga y luego ocultar loading
      setTimeout(() => {
        this.hideLoading();
        this.updateStats();
        console.log('✅ Aplicación inicializada correctamente');
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error inicializando aplicación:', error);
      this.showError('Error al inicializar la aplicación');
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

    // Modal eventos
    this.setupModalEvents();
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
    const valor = parseFloat(document.getElementById('valorTotalProducto')?.value || '0');
    const cuotas = parseInt(document.getElementById('numeroCuotas')?.value || '0');
    const fecha = document.getElementById('fechaInicio')?.value;

    if (!nombre || !valor || !cuotas || !fecha) {
      alert('Por favor completa todos los campos');
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
      }
    } catch (error) {
      console.error('Error cargando productos:', error);
    }
  }

  saveProducts() {
    try {
      localStorage.setItem('calculadora-productos', JSON.stringify(this.state.products));
    } catch (error) {
      console.error('Error guardando productos:', error);
    }
  }

  renderProducts() {
    const container = document.getElementById('listaProductos');
    if (!container) return;

    if (this.state.products.length === 0) {
      container.innerHTML = '<p class="no-products">No hay productos registrados. ¡Agrega tu primer producto arriba! 🚀</p>';
      return;
    }

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
          <p><strong>Valor Total:</strong> $${product.totalValue.toLocaleString()}</p>
          <p><strong>Cuotas:</strong> ${product.installments}</p>
          <p><strong>Cuota Mensual:</strong> $${product.monthlyPayment.toLocaleString()}</p>
          <p><strong>Inicio:</strong> ${product.startDate.toLocaleDateString()}</p>
          <p><strong>Fin:</strong> ${product.endDate.toLocaleDateString()}</p>
        </div>
      </div>
    `).join('');
  }

  clearForm() {
    document.getElementById('nombreProducto').value = '';
    document.getElementById('valorTotalProducto').value = '';
    document.getElementById('numeroCuotas').value = '';
    document.getElementById('fechaInicio').value = '';
  }

  updateStats() {
    const totalProducts = this.state.products.length;
    const totalValue = this.state.products.reduce((sum, p) => sum + p.totalValue, 0);
    const monthlyAverage = this.state.products.reduce((sum, p) => sum + p.monthlyPayment, 0);

    document.getElementById('totalProductos').textContent = totalProducts.toString();
    document.getElementById('valorTotal').textContent = `$${totalValue.toLocaleString()}`;
    document.getElementById('promedioMensual').textContent = `$${monthlyAverage.toLocaleString()}`;
    document.getElementById('proximoMes').textContent = `$${monthlyAverage.toLocaleString()}`;

    // Actualizar gráfico
    this.updateChart();
  }

  updateChart() {
    const canvas = document.getElementById('gastosChart');
    const chartMessage = document.getElementById('chartMessage');
    
    if (!canvas) return;

    if (this.state.products.length === 0) {
      if (chartMessage) chartMessage.style.display = 'block';
      canvas.style.display = 'none';
      return;
    }

    if (chartMessage) chartMessage.style.display = 'none';
    canvas.style.display = 'block';

    // Preparar datos del gráfico
    const months = [];
    const payments = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
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
      
      payments.push(monthPayments);
    }

    // Destruir gráfico anterior si existe
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    // Crear nuevo gráfico
    const ctx = canvas.getContext('2d');
    if (ctx && window.Chart) {
      this.chartInstance = new window.Chart(ctx, {
        type: 'bar',
        data: {
          labels: months,
          datasets: [{
            label: 'Pagos Mensuales',
            data: payments,
            backgroundColor: 'rgba(76, 175, 80, 0.8)',
            borderColor: 'rgba(76, 175, 80, 1)',
            borderWidth: 2,
            borderRadius: 6,
            borderSkipped: false,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return '$' + value.toLocaleString();
                }
              }
            }
          }
        }
      });
    }
  }

  updateTimeRange(range) {
    this.state.currentTimeRange = range;
    
    // Actualizar botones activos
    document.querySelectorAll('.time-range-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-range="${range}"]`)?.classList.add('active');
    
    console.log(`Rango de tiempo actualizado: ${range}`);
  }

  generatePDF() {
    try {
      if (!window.jsPDF) {
        alert('Error: jsPDF no está disponible');
        return;
      }

      const doc = new window.jsPDF();
      
      // Título
      doc.setFontSize(20);
      doc.text('Calculadora de Cuotas - Reporte', 20, 30);
      
      // Fecha
      doc.setFontSize(12);
      doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 20, 45);
      
      if (this.state.products.length === 0) {
        doc.text('No hay productos registrados.', 20, 65);
      } else {
        // Resumen
        const totalValue = this.state.products.reduce((sum, p) => sum + p.totalValue, 0);
        const monthlyTotal = this.state.products.reduce((sum, p) => sum + p.monthlyPayment, 0);
        
        doc.text('=== RESUMEN ===', 20, 65);
        doc.text(`Total de productos: ${this.state.products.length}`, 20, 80);
        doc.text(`Valor total: $${totalValue.toLocaleString()}`, 20, 95);
        doc.text(`Total mensual: $${monthlyTotal.toLocaleString()}`, 20, 110);
        
        // Lista de productos
        doc.text('=== PRODUCTOS ===', 20, 130);
        let yPos = 145;
        
        this.state.products.forEach((product, index) => {
          if (yPos > 250) {
            doc.addPage();
            yPos = 30;
          }
          
          doc.text(`${index + 1}. ${product.name}`, 20, yPos);
          doc.text(`   Valor: $${product.totalValue.toLocaleString()}`, 20, yPos + 10);
          doc.text(`   Cuotas: ${product.installments} | Mensual: $${product.monthlyPayment.toLocaleString()}`, 20, yPos + 20);
          doc.text(`   Inicio: ${product.startDate.toLocaleDateString()} | Fin: ${product.endDate.toLocaleDateString()}`, 20, yPos + 30);
          
          yPos += 45;
        });
      }
      
      // Guardar
      doc.save('calculadora-cuotas-reporte.pdf');
      
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error al generar el PDF');
    }
  }

  editProduct(id) {
    const product = this.state.products.find(p => p.id === id);
    if (!product) return;

    // Cargar datos en el modal
    document.getElementById('modal-nombre').value = product.name;
    document.getElementById('modal-valor').value = product.totalValue;
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
    const valor = parseFloat(document.getElementById('modal-valor').value);
    const cuotas = parseInt(document.getElementById('modal-cuotas').value);
    const fecha = document.getElementById('modal-fecha').value;

    if (!nombre || !valor || !cuotas || !fecha) {
      alert('Por favor completa todos los campos');
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
  }

  deleteProduct(id) {
    const product = this.state.products.find(p => p.id === id);
    if (!product) return;

    // Mostrar nombre del producto en el modal de confirmación
    document.getElementById('confirm-product-name').textContent = product.name;
    
    // Guardar ID para eliminación
    this.currentDeletingId = id;

    // Mostrar modal de confirmación
    this.openModal('confirmModal');
  }

  confirmDelete() {
    if (!this.currentDeletingId) return;

    this.state.products = this.state.products.filter(p => p.id !== this.currentDeletingId);
    this.saveProducts();
    this.renderProducts();
    this.updateStats();
    this.closeModal('confirmModal');
    this.currentDeletingId = null;
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'flex';
      modal.classList.add('show');
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'none';
      modal.classList.remove('show');
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
    alert(`Error: ${message}`);
  }
}

// Inicializar aplicación cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('🟢 DOM cargado, creando aplicación JS...');
    window.app = new CalculadoraCuotas();
  });
} else {
  console.log('🟢 DOM ya está cargado, creando aplicación JS...');
  window.app = new CalculadoraCuotas();
}
