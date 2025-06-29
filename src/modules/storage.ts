import type { Product, StorageManager } from '../types/index';

/**
 * Gestor de almacenamiento local para productos
 */
export class LocalStorageManager implements StorageManager {
  private readonly STORAGE_KEY = 'calculadora-cuotas-productos';

  /**
   * Guarda los productos en localStorage
   */
  save(products: Product[]): void {
    try {
      const data = JSON.stringify(products);
      localStorage.setItem(this.STORAGE_KEY, data);
      console.log('✅ Productos guardados:', products.length);
    } catch (error) {
      console.error('❌ Error guardando productos:', error);
      throw new Error('No se pudieron guardar los productos');
    }
  }

  /**
   * Carga los productos desde localStorage
   */
  load(): Product[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) {
        console.log('📦 No hay productos guardados');
        return [];
      }

      const products = JSON.parse(data) as Product[];
      console.log('✅ Productos cargados:', products.length);
      return products;
    } catch (error) {
      console.error('❌ Error cargando productos:', error);
      return [];
    }
  }

  /**
   * Limpia todos los productos del localStorage
   */
  clear(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('✅ Productos eliminados del almacenamiento');
    } catch (error) {
      console.error('❌ Error limpiando productos:', error);
    }
  }

  /**
   * Verifica si hay productos guardados
   */
  hasData(): boolean {
    return localStorage.getItem(this.STORAGE_KEY) !== null;
  }

  /**
   * Obtiene el tamaño de los datos almacenados
   */
  getStorageSize(): number {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? data.length : 0;
  }
}

// Singleton instance
export const storageManager = new LocalStorageManager();
