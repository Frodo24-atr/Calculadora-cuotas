console.log('🔍 Script app.ts cargado');

import type { Product, ProductFormData, TimeRange, AppState } from '../types/index';
import { productManager } from '../modules/products';
import { chartManager } from '../modules/charts';
import { statisticsCalculator } from '../modules/statistics';
import { logger, formatCurrency, isMobile } from '../modules/utils';
import { downloadPDF, checkPDFAvailability } from '../modules/pdf';

console.log('🔍 Imports completados');

/**
 * Aplicación principal - Calculadora de Cuotas
 */
export class CalculadoraCuotas {
  private state: AppState = {
    products: [],
    currentTimeRange: 'all',
    isLoading: true,
    modal: { isOpen: false },
  };

  private currentEditingId: string | null = null;
  private currentDeletingId: string | null = null;

  constructor() {
    this.initialize();
  }

  /**
   * Inicializa la aplicación
   */
  private async initialize(): Promise<void> {
    try {
      console.log('🚀 Inicializando Calculadora de Cuotas...');

      // Mostrar loading
      this.showLoading();

      // Inicializar módulos
      console.log('🔧 Inicializando módulos...');
      await this.initializeModules();

      // Configurar eventos
      console.log('⚡ Configurando eventos...');
      this.setupEventListeners();

      // Cargar datos iniciales
      console.log('📊 Cargando datos iniciales...');
      this.loadInitialData();

      // Ocultar loading
      console.log('✅ Ocultando loading...');
      this.hideLoading();

      console.log('✅ Aplicación inicializada correctamente');
    } catch (error) {
      console.error('❌ Error inicializando aplicación:', error);
      this.showError('Error al inicializar la aplicación');
    }
  }

  /**
   * Inicializa los módulos necesarios
   */
  private async initializeModules(): Promise<void> {
    // Inicializar gestor de gráficos
    chartManager.initialize('gastosChart');

    // Inicializar sistema de recordatorios
    if (typeof (window as any).RemindersManager !== 'undefined') {
      (window as any).remindersManager = new (window as any).RemindersManager();
      console.log('✅ Sistema de recordatorios inicializado');
    } else {
      console.warn('⚠️ Sistema de recordatorios no disponible');
    }

    // Configurar listener para cambios en productos
    productManager.addListener((products) => {
      this.onProductsChanged(products);
    });
  }

  /**
   * Configura los event listeners
   */
  private setupEventListeners(): void {
    // Formulario de productos - usar ID correcto del botón
    const btnAgregar = document.getElementById('btnAgregarProducto');
    if (btnAgregar) {
      btnAgregar.addEventListener('click', () => {
        this.handleFormSubmit();
      });
    }

    // Botón de descarga PDF
    const btnPDF = document.getElementById('btnDescargarPDF');
    if (btnPDF) {
      btnPDF.addEventListener('click', () => {
        downloadPDF();
      });
    }

    // Botones de rango de tiempo
    document.querySelectorAll('.time-range-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLButtonElement;
        const range = target.getAttribute('data-range') as TimeRange;
        this.updateTimeRange(range);
      });
    });

    // Botón de borrar todo
    const btnBorrarTodo = document.getElementById('btnBorrarTodo');
    if (btnBorrarTodo) {
      btnBorrarTodo.addEventListener('click', () => {
        this.handleClearAll();
      });
    }

    // Modal de edición
    this.setupModalListeners();

    // Eventos de teclado
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeModals();
      }
    });

    // Eventos de ventana
    window.addEventListener('resize', () => {
      this.handleResize();
    });
  }

  /**
   * Configura los listeners del modal
   */
  private setupModalListeners(): void {
    // Modal de edición
    const editModal = document.getElementById('editModal');
    const closeBtn = editModal?.querySelector('.close');
    const cancelBtn = editModal?.querySelector('.btn-secondary');
    const saveBtn = editModal?.querySelector('.btn-primary');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeEditModal());
    }
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.closeEditModal());
    }
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveEdit());
    }

    // Modal de confirmación
    const confirmModal = document.getElementById('confirmModal');
    const confirmCancelBtn = confirmModal?.querySelector('.confirm-btn-cancel');
    const confirmDeleteBtn = confirmModal?.querySelector('.confirm-btn-delete');

    if (confirmCancelBtn) {
      confirmCancelBtn.addEventListener('click', () => this.closeConfirmModal());
    }
    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener('click', () => this.confirmDelete());
    }

    // Cerrar modal al hacer click fuera
    [editModal, confirmModal].forEach(modal => {
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            this.closeModals();
          }
        });
      }
    });
  }

  /**
   * Carga los datos iniciales
   */
  private loadInitialData(): void {
    this.state.products = productManager.getProducts();
    this.updateUI();
  }

  /**
   * Maneja cambios en productos
   */
  private onProductsChanged(products: Product[]): void {
    this.state.products = products;
    this.updateUI();
    
    // Actualizar recordatorios si el sistema está disponible
    if ((window as any).remindersManager) {
      (window as any).remindersManager.generateReminders(products);
      console.log('📅 Recordatorios actualizados con los nuevos productos');
    }
  }

  /**
   * Actualiza toda la interfaz de usuario
   */
  private updateUI(): void {
    this.updateStatistics();
    this.updateChart();
    this.updateProductsList();
    this.updateBorrarTodoButton();
  }

  /**
   * Actualiza las estadísticas
   */
  private updateStatistics(): void {
    const stats = statisticsCalculator.calculate(this.state.products);

    this.updateElement('totalProductos', stats.totalProductos.toString());
    this.updateElement('valorTotal', formatCurrency(stats.valorTotal));
    this.updateElement('promedioMensual', formatCurrency(Math.round(stats.promedioMensual)));
    this.updateElement('proximoMes', formatCurrency(Math.round(stats.proximoMes)));
  }

  /**
   * Actualiza el gráfico
   */
  private updateChart(): void {
    chartManager.updateChart(this.state.products, this.state.currentTimeRange);
  }

  /**
   * Actualiza la lista de productos
   */
  private updateProductsList(): void {
    const container = document.getElementById('listaProductos');
    if (!container) return;

    if (this.state.products.length === 0) {
      container.innerHTML = '<p class="no-products">No hay productos registrados. ¡Agrega tu primer producto arriba! 🚀</p>';
      return;
    }

    const productsHTML = this.state.products.map(product => this.createProductHTML(product)).join('');
    container.innerHTML = productsHTML;

    // Configurar eventos de los botones de productos
    this.setupProductButtons();
  }

  /**
   * Crea el HTML para un producto
   */
  private createProductHTML(product: Product): string {
    const endDate = statisticsCalculator.getEndDate(product);
    const progress = statisticsCalculator.calculatePaymentProgress(product);

    return `
      <div class="producto-item" data-id="${product.id}">
        <div class="producto-header">
          <h3 class="producto-nombre">${product.nombre}</h3>
          <div class="producto-acciones">
            <button class="btn btn-edit" onclick="app.editProduct('${product.id}')">✏️ Editar</button>
            <button class="btn btn-delete" onclick="app.deleteProduct('${product.id}')">🗑️ Eliminar</button>
          </div>
        </div>
        <div class="producto-info">
          <div class="producto-detalle">
            <strong>Valor Total:</strong>
            <span>${formatCurrency(product.valor)}</span>
          </div>
          <div class="producto-detalle">
            <strong>Cuotas:</strong>
            <span>${product.cuotas}</span>
          </div>
          <div class="producto-detalle">
            <strong>Valor por Cuota:</strong>
            <span>${formatCurrency(product.valorCuota)}</span>
          </div>
          <div class="producto-detalle">
            <strong>Fecha de Inicio:</strong>
            <span>${new Date(product.fechaInicio).toLocaleDateString('es-ES')}</span>
          </div>
          <div class="producto-detalle">
            <strong>Fecha de Fin:</strong>
            <span>${endDate.toLocaleDateString('es-ES')}</span>
          </div>
          <div class="producto-detalle">
            <strong>Progreso:</strong>
            <span>${(product.cuotasPagadas || 0)}/${product.cuotas} (${progress.toFixed(1)}%)</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Configura eventos de botones de productos
   */
  private setupProductButtons(): void {
    // Los botones usan onclick en el HTML para simplificar
    // pero aquí podríamos añadir eventos adicionales si fuera necesario
  }

  /**
   * Maneja el envío del formulario
   */
  private handleFormSubmit(): void {
    try {
      const formData = this.getFormData();
      
      if (this.currentEditingId) {
        productManager.updateProduct(this.currentEditingId, formData);
        this.showSuccess('Producto actualizado correctamente');
        this.currentEditingId = null;
      } else {
        productManager.addProduct(formData);
        this.showSuccess('Producto agregado correctamente');
      }

      this.clearForm();
    } catch (error) {
      logger.error('Error en formulario:', error);
      this.showError(error instanceof Error ? error.message : 'Error desconocido');
    }
  }

  /**
   * Obtiene los datos del formulario
   */
  private getFormData(): ProductFormData {
    const getName = () => {
      const input = document.getElementById('nombreProducto') as HTMLInputElement;
      return input?.value || '';
    };

    const getValue = () => {
      const input = document.getElementById('valorTotalProducto') as HTMLInputElement;
      return parseFloat(input?.value || '0');
    };

    const getCuotas = () => {
      const input = document.getElementById('numeroCuotas') as HTMLInputElement;
      return parseInt(input?.value || '0');
    };

    const getFecha = () => {
      const input = document.getElementById('fechaInicio') as HTMLInputElement;
      return input?.value || '';
    };

    return {
      nombre: getName(),
      valor: getValue(),
      cuotas: getCuotas(),
      fechaInicio: getFecha(),
    };
  }

  /**
   * Limpia el formulario
   */
  private clearForm(): void {
    const form = document.querySelector('.form-section form') as HTMLFormElement;
    if (form) {
      form.reset();
    }

    // Establecer fecha por defecto
    const fechaInput = document.getElementById('fechaInicio') as HTMLInputElement;
    if (fechaInput) {
      fechaInput.value = new Date().toISOString().split('T')[0];
    }
  }

  /**
   * Actualiza el rango de tiempo
   */
  private updateTimeRange(range: TimeRange): void {
    this.state.currentTimeRange = range;

    // Actualizar botones activos
    document.querySelectorAll('.time-range-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    const activeBtn = document.querySelector(`[data-range="${range}"]`);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }

    // Actualizar gráfico
    this.updateChart();

    logger.info(`Rango de tiempo actualizado: ${range}`);
  }

  /**
   * Edita un producto
   */
  public editProduct(id: string): void {
    const product = productManager.getProductById(id);
    if (!product) {
      this.showError('Producto no encontrado');
      return;
    }

    this.currentEditingId = id;
    this.fillEditModal(product);
    this.openEditModal();
  }

  /**
   * Elimina un producto
   */
  public deleteProduct(id: string): void {
    const product = productManager.getProductById(id);
    if (!product) {
      this.showError('Producto no encontrado');
      return;
    }

    this.currentDeletingId = id;
    this.openConfirmModal(product.nombre);
  }

  /**
   * Rellena el modal de edición
   */
  private fillEditModal(product: Product): void {
    const setInput = (id: string, value: string | number) => {
      const input = document.getElementById(id) as HTMLInputElement;
      if (input) input.value = value.toString();
    };

    setInput('modal-nombre', product.nombre);
    setInput('modal-valor', product.valor);
    setInput('modal-cuotas', product.cuotas);
    setInput('modal-fecha', product.fechaInicio);
  }

  /**
   * Guarda la edición
   */
  private saveEdit(): void {
    if (!this.currentEditingId) return;

    try {
      const formData = this.getEditFormData();
      productManager.updateProduct(this.currentEditingId, formData);
      this.closeEditModal();
      this.showSuccess('Producto actualizado correctamente');
      this.currentEditingId = null;
    } catch (error) {
      logger.error('Error guardando edición:', error);
      this.showError(error instanceof Error ? error.message : 'Error desconocido');
    }
  }

  /**
   * Obtiene datos del formulario de edición
   */
  private getEditFormData(): ProductFormData {
    const getValue = (id: string): string => {
      const input = document.getElementById(id) as HTMLInputElement;
      return input?.value || '';
    };

    return {
      nombre: getValue('modal-nombre'),
      valor: parseFloat(getValue('modal-valor')),
      cuotas: parseInt(getValue('modal-cuotas')),
      fechaInicio: getValue('modal-fecha'),
    };
  }

  /**
   * Confirma la eliminación
   */
  private confirmDelete(): void {
    if (!this.currentDeletingId) return;

    const success = productManager.deleteProduct(this.currentDeletingId);
    if (success) {
      this.showSuccess('Producto eliminado correctamente');
    } else {
      this.showError('Error al eliminar el producto');
    }

    this.closeConfirmModal();
    this.currentDeletingId = null;
  }

  /**
   * Maneja la eliminación de todos los productos
   */
  private handleClearAll(): void {
    if (this.state.products.length === 0) return;

    const confirmed = confirm('¿Estás seguro de que deseas eliminar todos los productos? Esta acción no se puede deshacer.');
    if (confirmed) {
      productManager.clearAllProducts();
      this.showSuccess('Todos los productos eliminados');
    }
  }

  /**
   * Abre el modal de edición
   */
  private openEditModal(): void {
    const modal = document.getElementById('editModal');
    if (modal) {
      modal.style.display = 'block';
      this.state.modal.isOpen = true;
    }
  }

  /**
   * Cierra el modal de edición
   */
  private closeEditModal(): void {
    const modal = document.getElementById('editModal');
    if (modal) {
      modal.style.display = 'none';
      this.state.modal.isOpen = false;
      this.currentEditingId = null;
    }
  }

  /**
   * Abre el modal de confirmación
   */
  private openConfirmModal(productName: string): void {
    const modal = document.getElementById('confirmModal');
    const nameElement = document.getElementById('confirm-product-name');
    
    if (modal && nameElement) {
      nameElement.textContent = productName;
      modal.style.display = 'block';
      this.state.modal.isOpen = true;
    }
  }

  /**
   * Cierra el modal de confirmación
   */
  private closeConfirmModal(): void {
    const modal = document.getElementById('confirmModal');
    if (modal) {
      modal.style.display = 'none';
      this.state.modal.isOpen = false;
      this.currentDeletingId = null;
    }
  }

  /**
   * Cierra todos los modales
   */
  private closeModals(): void {
    this.closeEditModal();
    this.closeConfirmModal();
  }

  /**
   * Actualiza el botón "Borrar Todo"
   */
  private updateBorrarTodoButton(): void {
    const btn = document.getElementById('btnBorrarTodo');
    if (btn) {
      btn.style.display = this.state.products.length > 0 ? 'inline-block' : 'none';
    }
  }

  /**
   * Maneja el redimensionamiento de ventana
   */
  private handleResize(): void {
    // Actualizar gráfico en caso de cambio de orientación o tamaño
    setTimeout(() => {
      this.updateChart();
    }, 100);
  }

  /**
   * Muestra el loading
   */
  private showLoading(): void {
    const loading = document.getElementById('loadingIndicator');
    if (loading) {
      loading.style.display = 'flex';
    }
  }

  /**
   * Oculta el loading
   */
  private hideLoading(): void {
    const loading = document.getElementById('loadingIndicator');
    if (loading) {
      loading.style.display = 'none';
    }
    
    // Verificar disponibilidad de PDF después de cargar
    setTimeout(() => {
      checkPDFAvailability();
    }, 1000);
  }

  /**
   * Muestra un mensaje de éxito
   */
  private showSuccess(message: string): void {
    this.showMessage(message, 'success');
  }

  /**
   * Muestra un mensaje de error
   */
  private showError(message: string): void {
    this.showMessage(message, 'error');
  }

  /**
   * Muestra un mensaje
   */
  private showMessage(message: string, type: 'success' | 'error'): void {
    const resultado = document.getElementById('resultado');
    if (resultado) {
      resultado.textContent = message;
      resultado.className = type;
      resultado.style.display = 'block';

      setTimeout(() => {
        resultado.style.display = 'none';
      }, 5000);
    }
  }

  /**
   * Actualiza un elemento del DOM
   */
  private updateElement(id: string, value: string): void {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  }

  /**
   * Obtiene el estado actual de la aplicación
   */
  public getState(): AppState {
    return { ...this.state };
  }
}

// Inicializar aplicación cuando el DOM esté listo
console.log('🔍 DOM Estado:', document.readyState);

if (document.readyState === 'loading') {
  console.log('🔍 Esperando DOMContentLoaded...');
  document.addEventListener('DOMContentLoaded', () => {
    console.log('🔍 DOMContentLoaded disparado, creando aplicación...');
    window.app = new CalculadoraCuotas();
  });
} else {
  console.log('🔍 DOM ya está cargado, creando aplicación...');
  // DOM ya está cargado
  window.app = new CalculadoraCuotas();
}

// Declarar el tipo global para window
declare global {
  interface Window {
    app: CalculadoraCuotas;
  }
}
