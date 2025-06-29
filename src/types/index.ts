// Product related types
export interface Product {
  id: string;
  nombre: string;
  valor: number;
  cuotas: number;
  valorCuota: number;
  fechaInicio: string;
  cuotasPagadas?: number;
  fechaCreacion: string;
}

export interface ProductFormData {
  nombre: string;
  valor: number;
  cuotas: number;
  fechaInicio: string;
}

// Statistics types
export interface Statistics {
  totalProductos: number;
  valorTotal: number;
  promedioMensual: number;
  proximoMes: number;
}

// Chart related types
export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor: string;
  borderColor: string;
  borderWidth?: number;
}

export interface ChartData {
  meses: string[];
  datasets: ChartDataset[];
  detalles?: ProductDetail[];
}

export interface ProductDetail {
  nombre: string;
  cuotaActual: number;
  totalCuotas: number;
  valorCuota: number;
}

// Time range types
export type TimeRange = 'all' | '6' | '12' | '24';

// Modal types
export interface ModalState {
  isOpen: boolean;
  productId?: string;
}

// Storage types
export interface StorageManager {
  save(products: Product[]): void;
  load(): Product[];
  clear(): void;
}

// Event types
export interface ProductEvent {
  type: 'add' | 'edit' | 'delete' | 'clear';
  product?: Product;
  products?: Product[];
}

// PDF Export types
export interface PDFOptions {
  title: string;
  filename: string;
  includeChart?: boolean;
}

// Color scheme types
export interface ColorScheme {
  bg: string;
  border: string;
  name: string;
}

// Application state
export interface AppState {
  products: Product[];
  currentTimeRange: TimeRange;
  isLoading: boolean;
  modal: ModalState;
}
