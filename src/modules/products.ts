import type { Product, ProductFormData } from '@/types';
import { storageManager } from './storage';

/**
 * Gestor de productos - CRUD operations
 */
export class ProductManager {
  private products: Product[] = [];
  private listeners: ((products: Product[]) => void)[] = [];

  constructor() {
    this.loadProducts();
  }

  /**
   * Carga productos desde el almacenamiento
   */
  private loadProducts(): void {
    this.products = storageManager.load();
  }

  /**
   * Guarda productos en el almacenamiento
   */
  private saveProducts(): void {
    storageManager.save(this.products);
    this.notifyListeners();
  }

  /**
   * Añade un listener para cambios en productos
   */
  addListener(callback: (products: Product[]) => void): void {
    this.listeners.push(callback);
  }

  /**
   * Notifica a todos los listeners sobre cambios
   */
  private notifyListeners(): void {
    this.listeners.forEach(callback => callback([...this.products]));
  }

  /**
   * Obtiene todos los productos
   */
  getProducts(): Product[] {
    return [...this.products];
  }

  /**
   * Obtiene un producto por ID
   */
  getProductById(id: string): Product | undefined {
    return this.products.find(product => product.id === id);
  }

  /**
   * Añade un nuevo producto
   */
  addProduct(formData: ProductFormData): Product {
    // Validaciones
    this.validateProductData(formData);

    const product: Product = {
      id: this.generateId(),
      nombre: formData.nombre.trim(),
      valor: formData.valor,
      cuotas: formData.cuotas,
      valorCuota: formData.valor / formData.cuotas,
      fechaInicio: formData.fechaInicio,
      cuotasPagadas: 0,
      fechaCreacion: new Date().toISOString(),
    };

    this.products.push(product);
    this.saveProducts();

    console.log('✅ Producto agregado:', product.nombre);
    return product;
  }

  /**
   * Actualiza un producto existente
   */
  updateProduct(id: string, formData: ProductFormData): Product {
    const index = this.products.findIndex(product => product.id === id);
    if (index === -1) {
      throw new Error('Producto no encontrado');
    }

    // Validaciones
    this.validateProductData(formData);

    const updatedProduct: Product = {
      ...this.products[index],
      nombre: formData.nombre.trim(),
      valor: formData.valor,
      cuotas: formData.cuotas,
      valorCuota: formData.valor / formData.cuotas,
      fechaInicio: formData.fechaInicio,
    };

    this.products[index] = updatedProduct;
    this.saveProducts();

    console.log('✅ Producto actualizado:', updatedProduct.nombre);
    return updatedProduct;
  }

  /**
   * Elimina un producto
   */
  deleteProduct(id: string): boolean {
    const index = this.products.findIndex(product => product.id === id);
    if (index === -1) {
      return false;
    }

    const deletedProduct = this.products[index];
    this.products.splice(index, 1);
    this.saveProducts();

    console.log('✅ Producto eliminado:', deletedProduct.nombre);
    return true;
  }

  /**
   * Elimina todos los productos
   */
  clearAllProducts(): void {
    this.products = [];
    storageManager.clear();
    this.notifyListeners();
    console.log('✅ Todos los productos eliminados');
  }

  /**
   * Valida los datos del producto
   */
  private validateProductData(data: ProductFormData): void {
    if (!data.nombre || data.nombre.trim().length === 0) {
      throw new Error('El nombre del producto es requerido');
    }

    if (data.nombre.trim().length > 50) {
      throw new Error('El nombre del producto no puede exceder 50 caracteres');
    }

    if (!data.valor || data.valor <= 0) {
      throw new Error('El valor debe ser mayor a 0');
    }

    if (data.valor > 999999999) {
      throw new Error('El valor es demasiado alto');
    }

    if (!data.cuotas || data.cuotas < 1 || data.cuotas > 60) {
      throw new Error('Las cuotas deben estar entre 1 y 60');
    }

    if (!data.fechaInicio) {
      throw new Error('La fecha de inicio es requerida');
    }

    // Validar que la fecha no sea muy antigua
    const fechaInicio = new Date(data.fechaInicio);
    const fechaMinima = new Date();
    fechaMinima.setFullYear(fechaMinima.getFullYear() - 5);

    if (fechaInicio < fechaMinima) {
      throw new Error('La fecha de inicio no puede ser anterior a 5 años');
    }

    // Validar que no haya un producto con el mismo nombre
    const nombreExiste = this.products.some(
      product => product.nombre.toLowerCase() === data.nombre.trim().toLowerCase()
    );

    if (nombreExiste) {
      throw new Error('Ya existe un producto con ese nombre');
    }
  }

  /**
   * Genera un ID único para productos
   */
  private generateId(): string {
    return `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Actualiza las cuotas pagadas de un producto
   */
  updatePaidInstallments(id: string, cuotasPagadas: number): boolean {
    const product = this.products.find(p => p.id === id);
    if (!product) {
      return false;
    }

    if (cuotasPagadas < 0 || cuotasPagadas > product.cuotas) {
      throw new Error('Número de cuotas pagadas inválido');
    }

    product.cuotasPagadas = cuotasPagadas;
    this.saveProducts();

    console.log(`✅ Cuotas actualizadas para ${product.nombre}: ${cuotasPagadas}/${product.cuotas}`);
    return true;
  }

  /**
   * Exporta productos a JSON
   */
  exportToJSON(): string {
    return JSON.stringify(this.products, null, 2);
  }

  /**
   * Importa productos desde JSON
   */
  importFromJSON(jsonData: string): number {
    try {
      const importedProducts = JSON.parse(jsonData) as Product[];
      
      // Validar estructura de datos
      importedProducts.forEach((product, index) => {
        if (!this.isValidProduct(product)) {
          throw new Error(`Producto inválido en posición ${index}`);
        }
      });

      // Añadir productos (evitando duplicados por nombre)
      let addedCount = 0;
      importedProducts.forEach(product => {
        const exists = this.products.some(
          p => p.nombre.toLowerCase() === product.nombre.toLowerCase()
        );
        
        if (!exists) {
          product.id = this.generateId(); // Regenerar ID
          this.products.push(product);
          addedCount++;
        }
      });

      if (addedCount > 0) {
        this.saveProducts();
      }

      console.log(`✅ Productos importados: ${addedCount}`);
      return addedCount;
    } catch (error) {
      console.error('❌ Error importando productos:', error);
      throw new Error('Archivo JSON inválido');
    }
  }

  /**
   * Valida si un objeto es un producto válido
   */
  private isValidProduct(obj: any): obj is Product {
    return (
      obj &&
      typeof obj.nombre === 'string' &&
      typeof obj.valor === 'number' &&
      typeof obj.cuotas === 'number' &&
      typeof obj.valorCuota === 'number' &&
      typeof obj.fechaInicio === 'string' &&
      obj.valor > 0 &&
      obj.cuotas > 0
    );
  }
}

// Singleton instance
export const productManager = new ProductManager();
