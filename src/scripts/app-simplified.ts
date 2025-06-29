// Aplicación principal - Calculadora de Cuotas
console.log('🚀 Iniciando Calculadora de Cuotas v2025.06.29');

// Tipos básicos sin imports complejos
interface Product {
  id: string;
  name: string;
  totalValue: number;
  installments: number;
  startDate: Date;
  endDate: Date;
  monthlyPayment: number;
}

interface AppState {
  products: Product[];
  currentTimeRange: 'all' | '6' | '12' | '24';
  isLoading: boolean;
  modal: { isOpen: boolean };
}

/**
 * Calculadora de Cuotas - Versión simplificada
 */
class CalculadoraCuotas {
  private state: AppState = {
    products: [],
    currentTimeRange: 'all',
    isLoading: true,
    modal: { isOpen: false },
  };

  private chartInstance: any = null;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      console.log('🔧 Inicializando aplicación...');
      
      // Mostrar loading
      this.showLoading();
      
      // Configurar eventos básicos
      this.setupBasicEventListeners();
      
      // Cargar datos del localStorage
      this.loadStoredProducts();
      
      // Simular carga
      setTimeout(() => {
        this.hideLoading();
        console.log('✅ Aplicación inicializada correctamente');
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error inicializando aplicación:', error);
      this.showError('Error al inicializar la aplicación');
    }
  }

  private setupBasicEventListeners(): void {
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
        const target = e.target as HTMLButtonElement;
        const range = target.getAttribute('data-range') as any;
        this.updateTimeRange(range);
      });
    });
  }

  private handleAddProduct(): void {
    const nombre = (document.getElementById('nombreProducto') as HTMLInputElement)?.value;
    const valor = parseFloat((document.getElementById('valorTotalProducto') as HTMLInputElement)?.value || '0');
    const cuotas = parseInt((document.getElementById('numeroCuotas') as HTMLInputElement)?.value || '0');
    const fecha = (document.getElementById('fechaInicio') as HTMLInputElement)?.value;

    if (!nombre || !valor || !cuotas || !fecha) {
      alert('Por favor completa todos los campos');
      return;
    }

    const product: Product = {
      id: Date.now().toString(),
      name: nombre,
      totalValue: valor,
      installments: cuotas,
      startDate: new Date(fecha),
      endDate: new Date(new Date(fecha).setMonth(new Date(fecha).getMonth() + cuotas)),
      monthlyPayment: valor / cuotas
    };

    this.state.products.push(product);
    this.saveProducts();
    this.renderProducts();
    this.clearForm();
    this.updateStats();
  }

  private loadStoredProducts(): void {
    try {
      const stored = localStorage.getItem('calculadora-productos');
      if (stored) {
        const products = JSON.parse(stored);
        this.state.products = products.map((p: any) => ({
          ...p,
          startDate: new Date(p.startDate),
          endDate: new Date(p.endDate)
        }));
      }
    } catch (error) {
      console.error('Error cargando productos:', error);
    }
  }

  private saveProducts(): void {
    try {
      localStorage.setItem('calculadora-productos', JSON.stringify(this.state.products));
    } catch (error) {
      console.error('Error guardando productos:', error);
    }
  }

  private renderProducts(): void {
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
            <button class="btn-edit" onclick="editProduct('${product.id}')">✏️ Editar</button>
            <button class="btn-delete" onclick="deleteProduct('${product.id}')">🗑️ Eliminar</button>
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

  private clearForm(): void {
    (document.getElementById('nombreProducto') as HTMLInputElement).value = '';
    (document.getElementById('valorTotalProducto') as HTMLInputElement).value = '';
    (document.getElementById('numeroCuotas') as HTMLInputElement).value = '';
    (document.getElementById('fechaInicio') as HTMLInputElement).value = '';
  }

  private updateStats(): void {
    const totalProducts = this.state.products.length;
    const totalValue = this.state.products.reduce((sum, p) => sum + p.totalValue, 0);
    const monthlyAverage = this.state.products.reduce((sum, p) => sum + p.monthlyPayment, 0);

    document.getElementById('totalProductos')!.textContent = totalProducts.toString();
    document.getElementById('valorTotal')!.textContent = `$${totalValue.toLocaleString()}`;
    document.getElementById('promedioMensual')!.textContent = `$${monthlyAverage.toLocaleString()}`;
    document.getElementById('proximoMes')!.textContent = `$${monthlyAverage.toLocaleString()}`;

    // Actualizar gráfico
    this.updateChart();
  }

  private updateChart(): void {
    const canvas = document.getElementById('gastosChart') as HTMLCanvasElement;
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
    if (ctx && (window as any).Chart) {
      this.chartInstance = new (window as any).Chart(ctx, {
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
                callback: function(value: any) {
                  return '$' + value.toLocaleString();
                }
              }
            }
          }
        }
      });
    }
  }

  private updateTimeRange(range: 'all' | '6' | '12' | '24'): void {
    this.state.currentTimeRange = range;
    
    // Actualizar botones activos
    document.querySelectorAll('.time-range-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-range="${range}"]`)?.classList.add('active');
    
    console.log(`Rango de tiempo actualizado: ${range}`);
  }

  private showLoading(): void {
    const loading = document.getElementById('loadingIndicator');
    if (loading) {
      loading.style.display = 'block';
    }
  }

  private hideLoading(): void {
    const loading = document.getElementById('loadingIndicator');
    if (loading) {
      loading.style.display = 'none';
    }
  }

  private showError(message: string): void {
    alert(`Error: ${message}`);
  }

  private generatePDF(): void {
    try {
      if (!(window as any).jsPDF) {
        alert('Error: jsPDF no está disponible');
        return;
      }

      const doc = new (window as any).jsPDF();
      
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

  // Métodos públicos para uso global
  public editProduct(id: string): void {
    const product = this.state.products.find(p => p.id === id);
    if (product) {
      alert(`Editar producto: ${product.name} (funcionalidad en desarrollo)`);
    }
  }

  public deleteProduct(id: string): void {
    if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      this.state.products = this.state.products.filter(p => p.id !== id);
      this.saveProducts();
      this.renderProducts();
      this.updateStats();
    }
  }
}

// Funciones globales para los botones
(window as any).editProduct = (id: string) => {
  (window as any).app?.editProduct(id);
};

(window as any).deleteProduct = (id: string) => {
  (window as any).app?.deleteProduct(id);
};

// Inicializar aplicación
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('🟢 DOM cargado, creando aplicación...');
    (window as any).app = new CalculadoraCuotas();
  });
} else {
  console.log('🟢 DOM ya está cargado, creando aplicación...');
  (window as any).app = new CalculadoraCuotas();
}
