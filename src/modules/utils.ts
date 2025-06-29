/**
 * Utilidades generales para la aplicación
 */

/**
 * Formatea un número como moneda en formato español
 */
export function formatCurrency(value: number): string {
  return `$${value.toLocaleString('es-ES')}`;
}

/**
 * Formatea una fecha en formato español
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES');
}

/**
 * Valida si una cadena es un email válido
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida si un número está en un rango específico
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Sanitiza una cadena removiendo caracteres especiales
 */
export function sanitizeString(str: string): string {
  return str.trim().replace(/[<>\"'&]/g, '');
}

/**
 * Genera un ID único
 */
export function generateUniqueId(prefix = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Debounce function para optimizar eventos
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function para limitar la frecuencia de ejecución
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Copia texto al portapapeles
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Error copiando al portapapeles:', error);
    return false;
  }
}

/**
 * Descarga un archivo con contenido
 */
export function downloadFile(content: string, filename: string, type = 'text/plain'): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Verifica si es un dispositivo móvil
 */
export function isMobile(): boolean {
  return window.innerWidth <= 768;
}

/**
 * Verifica si es un dispositivo táctil
 */
export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Obtiene el valor de un parámetro de URL
 */
export function getUrlParameter(name: string): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

/**
 * Actualiza un parámetro de URL sin recargar la página
 */
export function updateUrlParameter(name: string, value: string): void {
  const url = new URL(window.location.href);
  url.searchParams.set(name, value);
  window.history.replaceState({}, '', url.toString());
}

/**
 * Calcula la diferencia en días entre dos fechas
 */
export function daysBetween(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Verifica si una fecha está en el futuro
 */
export function isFutureDate(date: Date | string): boolean {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  return targetDate > new Date();
}

/**
 * Verifica si una fecha está en el pasado
 */
export function isPastDate(date: Date | string): boolean {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  return targetDate < new Date();
}

/**
 * Convierte bytes a formato legible
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Capitaliza la primera letra de una cadena
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Trunca una cadena a un número específico de caracteres
 */
export function truncate(str: string, length: number, suffix = '...'): string {
  if (str.length <= length) return str;
  return str.substring(0, length) + suffix;
}

/**
 * Verifica si el navegador soporta una característica
 */
export function supportsFeature(feature: string): boolean {
  switch (feature) {
    case 'localStorage':
      try {
        return typeof Storage !== 'undefined';
      } catch {
        return false;
      }
    case 'clipboard':
      return navigator.clipboard !== undefined;
    case 'serviceWorker':
      return 'serviceWorker' in navigator;
    default:
      return false;
  }
}

/**
 * Manejo de errores global
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public context?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Logger simple para la aplicación
 */
export const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`ℹ️ [INFO] ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`⚠️ [WARN] ${message}`, ...args);
  },
  error: (message: string, error?: any) => {
    console.error(`❌ [ERROR] ${message}`, error);
  },
  success: (message: string, ...args: any[]) => {
    console.log(`✅ [SUCCESS] ${message}`, ...args);
  },
};
