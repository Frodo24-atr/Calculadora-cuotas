import type { Product, Statistics } from '../types/index';

/**
 * Calculador de estadísticas para productos
 */
export class StatisticsCalculator {
  /**
   * Calcula estadísticas generales de productos
   */
  calculate(products: Product[]): Statistics {
    if (products.length === 0) {
      return {
        totalProductos: 0,
        valorTotal: 0,
        promedioMensual: 0,
        proximoMes: 0,
      };
    }

    const totalProductos = products.length;
    const valorTotal = products.reduce((sum, product) => sum + product.valor, 0);
    
    // Calcular gastos mensuales actuales
    const gastosActuales = this.calculateCurrentMonthlyExpenses(products);
    const promedioMensual = gastosActuales.length > 0 
      ? gastosActuales.reduce((sum, gasto) => sum + gasto, 0) / gastosActuales.length
      : 0;

    // Calcular gastos del próximo mes
    const proximoMes = this.calculateNextMonthExpenses(products);

    return {
      totalProductos,
      valorTotal,
      promedioMensual,
      proximoMes,
    };
  }

  /**
   * Calcula los gastos mensuales actuales
   */
  private calculateCurrentMonthlyExpenses(products: Product[]): number[] {
    const gastosPorMes: { [key: string]: number } = {};
    const ahora = new Date();

    products.forEach(product => {
      const fechaInicio = new Date(product.fechaInicio);
      
      for (let i = 0; i < product.cuotas; i++) {
        const fechaCuota = new Date(
          fechaInicio.getFullYear(),
          fechaInicio.getMonth() + i,
          1
        );
        
        if (fechaCuota <= ahora) {
          const mesKey = `${fechaCuota.getFullYear()}-${String(fechaCuota.getMonth() + 1).padStart(2, '0')}`;
          gastosPorMes[mesKey] = (gastosPorMes[mesKey] || 0) + product.valorCuota;
        }
      }
    });

    return Object.values(gastosPorMes);
  }

  /**
   * Calcula los gastos del próximo mes
   */
  private calculateNextMonthExpenses(products: Product[]): number {
    const proximoMes = new Date();
    proximoMes.setMonth(proximoMes.getMonth() + 1);
    proximoMes.setDate(1);

    let gastoProximoMes = 0;

    products.forEach(product => {
      const fechaInicio = new Date(product.fechaInicio);
      
      for (let i = 0; i < product.cuotas; i++) {
        const fechaCuota = new Date(
          fechaInicio.getFullYear(),
          fechaInicio.getMonth() + i,
          1
        );
        
        if (
          fechaCuota.getFullYear() === proximoMes.getFullYear() &&
          fechaCuota.getMonth() === proximoMes.getMonth()
        ) {
          gastoProximoMes += product.valorCuota;
        }
      }
    });

    return gastoProximoMes;
  }

  /**
   * Formatea un valor numérico para mostrar
   */
  formatCurrency(value: number): string {
    return `$${value.toLocaleString('es-ES')}`;
  }

  /**
   * Calcula el porcentaje de cuotas pagadas para un producto
   */
  calculatePaymentProgress(product: Product): number {
    const cuotasPagadas = product.cuotasPagadas || 0;
    return (cuotasPagadas / product.cuotas) * 100;
  }

  /**
   * Obtiene el mes y año de finalización de un producto
   */
  getEndDate(product: Product): Date {
    const fechaInicio = new Date(product.fechaInicio);
    return new Date(
      fechaInicio.getFullYear(),
      fechaInicio.getMonth() + product.cuotas,
      0 // Último día del mes
    );
  }
}

// Singleton instance
export const statisticsCalculator = new StatisticsCalculator();
