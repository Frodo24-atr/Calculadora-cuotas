import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type ChartConfiguration,
} from 'chart.js';
import type { Product, ChartData, TimeRange, ColorScheme } from '../types/index';

// Registrar componentes de Chart.js
Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

/**
 * Gestor de gráficos para la aplicación
 */
export class ChartManager {
  private chart: Chart | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private currentTimeRange: TimeRange = 'all';

  // Colores para los datasets
  private readonly colorSchemes: ColorScheme[] = [
    { bg: 'rgba(76, 175, 80, 0.8)', border: 'rgba(76, 175, 80, 1)', name: 'Verde Principal' },
    { bg: 'rgba(33, 150, 243, 0.8)', border: 'rgba(33, 150, 243, 1)', name: 'Azul Info' },
    { bg: 'rgba(255, 152, 0, 0.8)', border: 'rgba(255, 152, 0, 1)', name: 'Naranja Advertencia' },
    { bg: 'rgba(156, 39, 176, 0.8)', border: 'rgba(156, 39, 176, 1)', name: 'Púrpura' },
    { bg: 'rgba(244, 67, 54, 0.8)', border: 'rgba(244, 67, 54, 1)', name: 'Rojo Peligro' },
    { bg: 'rgba(96, 125, 139, 0.8)', border: 'rgba(96, 125, 139, 1)', name: 'Gris Azulado' },
    { bg: 'rgba(255, 193, 7, 0.8)', border: 'rgba(255, 193, 7, 1)', name: 'Amarillo' },
    { bg: 'rgba(0, 188, 212, 0.8)', border: 'rgba(0, 188, 212, 1)', name: 'Cian' },
    { bg: 'rgba(139, 195, 74, 0.8)', border: 'rgba(139, 195, 74, 1)', name: 'Verde Claro' },
    { bg: 'rgba(121, 85, 72, 0.8)', border: 'rgba(121, 85, 72, 1)', name: 'Marrón' },
  ];

  /**
   * Inicializa el gestor de gráficos
   */
  initialize(canvasId: string): void {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error(`Canvas con ID '${canvasId}' no encontrado`);
    }

    this.setupCanvas();
    console.log('✅ ChartManager inicializado');
  }

  /**
   * Configura el canvas para evitar problemas de tamaño
   */
  private setupCanvas(): void {
    if (!this.canvas) return;

    // Configurar estilos CSS
    this.canvas.style.width = '100%';
    this.canvas.style.height = '300px';
    this.canvas.style.maxHeight = '300px';
    this.canvas.style.maxWidth = '100%';
  }

  /**
   * Actualiza el gráfico con nuevos datos
   */
  updateChart(products: Product[], timeRange: TimeRange = 'all'): void {
    if (!this.canvas) {
      console.error('❌ Canvas no inicializado');
      return;
    }

    this.currentTimeRange = timeRange;

    try {
      // Destruir gráfico anterior
      this.destroyChart();

      // Calcular datos para el gráfico
      const chartData = this.calculateChartData(products, timeRange);

      if (chartData.datasets.length === 0) {
        this.showEmptyChart();
        return;
      }

      // Crear configuración del gráfico
      const config = this.createChartConfig(chartData);

      // Crear nuevo gráfico
      const ctx = this.canvas.getContext('2d');
      if (ctx) {
        this.chart = new Chart(ctx, config);
        this.showChart();
        console.log(`✅ Gráfico actualizado (${timeRange}): ${chartData.datasets.length} productos`);
      }
    } catch (error) {
      console.error('❌ Error actualizando gráfico:', error);
      this.showErrorChart();
    }
  }

  /**
   * Calcula los datos para el gráfico apilado
   */
  private calculateChartData(products: Product[], timeRange: TimeRange): ChartData {
    if (products.length === 0) {
      return { meses: [], datasets: [] };
    }

    const gastosPorProductoPorMes: { [productId: string]: { [mes: string]: number } } = {};
    const productosInfo: { [productId: string]: { nombre: string; color: ColorScheme } } = {};
    const todosLosMeses = new Set<string>();

    // Inicializar estructura para cada producto
    products.forEach((product, index) => {
      gastosPorProductoPorMes[product.id] = {};
      productosInfo[product.id] = {
        nombre: product.nombre,
        color: this.colorSchemes[index % this.colorSchemes.length],
      };
    });

    // Calcular gastos por mes para cada producto
    products.forEach(product => {
      const fechaInicio = new Date(product.fechaInicio);

      for (let i = 0; i < product.cuotas; i++) {
        const fecha = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth() + i, 1);
        const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;

        todosLosMeses.add(mesKey);
        gastosPorProductoPorMes[product.id][mesKey] = 
          (gastosPorProductoPorMes[product.id][mesKey] || 0) + product.valorCuota;
      }
    });

    // Filtrar meses según el rango
    let mesesFiltrados = Array.from(todosLosMeses).sort();
    if (timeRange !== 'all') {
      mesesFiltrados = this.filterMonthsByRange(mesesFiltrados, timeRange);
    }

    // Crear datasets para cada producto
    const datasets = products.map(product => {
      const productInfo = productosInfo[product.id];
      const data = mesesFiltrados.map(mes => 
        gastosPorProductoPorMes[product.id][mes] || 0
      );

      return {
        label: productInfo.nombre,
        data,
        backgroundColor: productInfo.color.bg,
        borderColor: productInfo.color.border,
        borderWidth: 1,
      };
    });

    // Formatear etiquetas de meses
    const mesesFormateados = mesesFiltrados.map(mes => {
      const [año, mesNum] = mes.split('-');
      const fecha = new Date(parseInt(año), parseInt(mesNum) - 1);
      return fecha.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
    });

    return {
      meses: mesesFormateados,
      datasets,
    };
  }

  /**
   * Filtra meses según el rango de tiempo
   */
  private filterMonthsByRange(meses: string[], range: TimeRange): string[] {
    if (range === 'all') return meses;

    const rangeMonths = parseInt(range);
    const ahora = new Date();
    const fechaLimite = new Date(ahora.getFullYear(), ahora.getMonth() + rangeMonths, 0);

    return meses.filter(mes => {
      const [año, mesNum] = mes.split('-');
      const fechaMes = new Date(parseInt(año), parseInt(mesNum) - 1);
      return fechaMes <= fechaLimite;
    });
  }

  /**
   * Crea la configuración del gráfico
   */
  private createChartConfig(data: ChartData): ChartConfiguration {
    const isMobile = window.innerWidth <= 768;

    return {
      type: 'bar',
      data: {
        labels: data.meses,
        datasets: data.datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            border: { display: false },
            ticks: {
              color: '#666',
              font: { size: isMobile ? 8 : 10, weight: 500 },
              maxRotation: isMobile ? 45 : 0,
              minRotation: isMobile ? 45 : 0,
            },
            title: {
              display: !isMobile,
              text: 'Período',
              color: '#666',
              font: { size: isMobile ? 10 : 12, weight: 'bold' },
            },
          },
          y: {
            stacked: true,
            beginAtZero: true,
            grid: { color: 'rgba(0, 0, 0, 0.08)' },
            border: { display: false },
            ticks: {
              color: '#666',
              font: { size: isMobile ? 9 : 11, weight: 500 },
              callback: (value) => {
                const numValue = Number(value);
                if (numValue >= 1000000) {
                  return `$${(numValue / 1000000).toFixed(1)}M`;
                } else if (numValue >= 1000) {
                  return `$${(numValue / 1000).toFixed(0)}K`;
                }
                return `$${numValue.toLocaleString('es-ES')}`;
              },
            },
            title: {
              display: !isMobile,
              text: 'Valor de Cuotas ($)',
              color: '#666',
              font: { size: isMobile ? 10 : 12, weight: 'bold' },
            },
          },
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: '#333',
              font: { size: isMobile ? 11 : 13, weight: 'bold' },
              usePointStyle: true,
              pointStyle: 'rect',
              padding: isMobile ? 8 : 12,
            },
          },
          tooltip: {
            backgroundColor: 'rgba(33, 150, 243, 0.95)',
            titleColor: '#fff',
            bodyColor: '#fff',
            titleFont: { size: isMobile ? 12 : 14, weight: 'bold' },
            bodyFont: { size: isMobile ? 11 : 13, weight: 'normal' },
            padding: isMobile ? 8 : 12,
            cornerRadius: 8,
            displayColors: true,
            borderColor: 'rgba(33, 150, 243, 1)',
            borderWidth: 1,
            callbacks: {
              title: (context) => `📅 ${context[0].label}`,
              label: (context) => {
                const productName = context.dataset.label;
                const value = context.parsed.y;
                return `🔸 ${productName}: $${value.toLocaleString('es-ES')}`;
              },
              footer: (tooltipItems) => {
                const total = tooltipItems.reduce((sum, item) => sum + item.parsed.y, 0);
                return `💰 Total del mes: $${total.toLocaleString('es-ES')}`;
              },
            },
          },
        },
        interaction: {
          mode: 'index',
          intersect: false,
        },
        onResize: (chart, size) => {
          const maxHeight = window.innerWidth <= 768 ? 320 : 300;
          if (size.height > maxHeight) {
            chart.canvas.style.height = `${maxHeight}px`;
          }
        },
      },
    };
  }

  /**
   * Muestra el gráfico
   */
  private showChart(): void {
    const container = document.querySelector('.chart-wrapper') as HTMLElement;
    const message = document.getElementById('chartMessage');
    
    if (container) container.style.display = 'block';
    if (message) message.style.display = 'none';
  }

  /**
   * Muestra mensaje de gráfico vacío
   */
  private showEmptyChart(): void {
    this.hideChart();
    const message = document.getElementById('chartMessage');
    if (message) {
      message.innerHTML = '<p>📊 No hay productos registrados para mostrar estadísticas</p>';
      message.style.display = 'block';
    }
  }

  /**
   * Muestra mensaje de error
   */
  private showErrorChart(): void {
    this.hideChart();
    const message = document.getElementById('chartMessage');
    if (message) {
      message.innerHTML = '<p>❌ Error al generar el gráfico</p>';
      message.style.display = 'block';
    }
  }

  /**
   * Oculta el gráfico
   */
  private hideChart(): void {
    const container = document.querySelector('.chart-wrapper') as HTMLElement;
    if (container) container.style.display = 'none';
  }

  /**
   * Destruye el gráfico actual
   */
  private destroyChart(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  /**
   * Limpia recursos
   */
  destroy(): void {
    this.destroyChart();
    this.canvas = null;
    console.log('✅ ChartManager destruido');
  }

  /**
   * Obtiene el rango de tiempo actual
   */
  getCurrentTimeRange(): TimeRange {
    return this.currentTimeRange;
  }

  /**
   * Exporta el gráfico como imagen
   */
  exportAsImage(): string | null {
    if (!this.chart) return null;
    return this.chart.toBase64Image();
  }
}

// Singleton instance
export const chartManager = new ChartManager();
