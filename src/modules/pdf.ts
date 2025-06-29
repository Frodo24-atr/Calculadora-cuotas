/**
 * Módulo para la generación y descarga de reportes PDF
 * Maneja la exportación de datos de productos en formato PDF y texto alternativo
 */

import { Product, Statistics } from '../types/index';
import { storageManager } from './storage';
import { StatisticsCalculator } from './statistics';

// Declara jsPDF para TypeScript
declare global {
  interface Window {
    jsPDF: any;
    jspdf: any;
  }
}

/**
 * Genera y descarga un PDF con la información de productos
 */
export function downloadPDF(): void {
  try {
    const products = storageManager.load();
    
    if (products.length === 0) {
      alert('No hay productos para exportar. Agrega algunos productos primero.');
      return;
    }

    // Verificar que jsPDF esté disponible con múltiples formas de acceso
    let jsPDF = null;
    if (typeof window.jsPDF !== 'undefined') {
      jsPDF = window.jsPDF.jsPDF || window.jsPDF;
    } else if (typeof window.jspdf !== 'undefined') {
      jsPDF = window.jspdf.jsPDF || window.jspdf;
    }
    
    if (!jsPDF) {
      console.log('jsPDF no disponible, usando método alternativo...');
      downloadTextAlternative(products);
      return;
    }

    // Crear nuevo documento PDF
    const doc = new jsPDF();
    
    // Configuración
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    let yPosition = 30;
    
    // Título principal
    doc.setFontSize(24);
    doc.setTextColor(102, 126, 234);
    doc.text('Calculadora de Cuotas', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 10;
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text('Reporte de Productos y Cuotas', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 5;
    doc.setFontSize(10);
    doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES')}`, pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 20;
    
    // Estadísticas generales
    const statsCalculator = new StatisticsCalculator();
    const stats = statsCalculator.calculate(products);
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Resumen General', margin, yPosition);
    yPosition += 15;
    
    doc.setFontSize(12);
    const resumenLineas = [
      `Total de productos: ${stats.totalProductos}`,
      `Valor total: $${stats.valorTotal.toLocaleString('es-ES')}`,
      `Promedio mensual: $${Math.round(stats.promedioMensual).toLocaleString('es-ES')}`,
      `Próximo mes: $${Math.round(stats.proximoMes).toLocaleString('es-ES')}`
    ];
    
    resumenLineas.forEach(linea => {
      doc.text(linea, margin + 5, yPosition);
      yPosition += 8;
    });
    
    yPosition += 15;
    
    // Lista de productos
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Detalle de Productos', margin, yPosition);
    yPosition += 15;
    
    products.forEach((product, index) => {
      // Verificar si necesitamos nueva página
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 30;
      }
      
      // Encabezado del producto
      doc.setFontSize(14);
      doc.setTextColor(102, 126, 234);
      doc.text(`${index + 1}. ${product.nombre}`, margin, yPosition);
      yPosition += 12;
      
      // Detalles del producto
      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);
      
      const detalles = [
        `Valor total: $${product.valor.toLocaleString('es-ES')}`,
        `Número de cuotas: ${product.cuotas}`,
        `Valor por cuota: $${product.valorCuota.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`,
        `Fecha de inicio: ${new Date(product.fechaInicio).toLocaleDateString('es-ES')}`,
        `Cuotas pagadas: ${product.cuotasPagadas || 0} de ${product.cuotas}`
      ];
      
      detalles.forEach(detalle => {
        doc.text(`- ${detalle}`, margin + 5, yPosition);
        yPosition += 7;
      });
      
      yPosition += 10;
    });
    
    // Footer
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Página ${i} de ${totalPages} - Calculadora de Cuotas v2025.06.29`,
        pageWidth / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }
    
    // Descargar PDF
    const fecha = new Date().toISOString().split('T')[0];
    const nombreArchivo = `calculadora-cuotas-${fecha}.pdf`;
    doc.save(nombreArchivo);
    
    // Mostrar mensaje de éxito
    showSuccessMessage(nombreArchivo);
    
  } catch (error) {
    console.error('Error al generar PDF:', error);
    
    // Fallback al método alternativo
    const products = storageManager.load();
    if (products.length > 0) {
      downloadTextAlternative(products);
    } else {
      alert('Error al generar el PDF. Por favor, intenta nuevamente.');
    }
  }
}

/**
 * Método alternativo para descargar información como archivo de texto
 */
function downloadTextAlternative(products: Product[]): void {
  try {
    let contenido = '='.repeat(50) + '\n';
    contenido += '💰 CALCULADORA DE CUOTAS - REPORTE\n';
    contenido += '='.repeat(50) + '\n\n';
    contenido += `Fecha de generación: ${new Date().toLocaleDateString('es-ES')}\n\n`;
    
    // Estadísticas
    const statsCalculator = new StatisticsCalculator();
    const stats = statsCalculator.calculate(products);
    contenido += '📊 RESUMEN GENERAL\n';
    contenido += '-'.repeat(30) + '\n';
    contenido += `Total de productos: ${stats.totalProductos}\n`;
    contenido += `Valor total: $${stats.valorTotal.toLocaleString('es-ES')}\n`;
    contenido += `Promedio mensual: $${Math.round(stats.promedioMensual).toLocaleString('es-ES')}\n`;
    contenido += `Próximo mes: $${Math.round(stats.proximoMes).toLocaleString('es-ES')}\n\n`;
    
    // Productos
    contenido += '📦 DETALLE DE PRODUCTOS\n';
    contenido += '-'.repeat(30) + '\n\n';
    
    products.forEach((product, index) => {
      contenido += `${index + 1}. ${product.nombre}\n`;
      contenido += `   • Valor total: $${product.valor.toLocaleString('es-ES')}\n`;
      contenido += `   • Número de cuotas: ${product.cuotas}\n`;
      contenido += `   • Valor por cuota: $${product.valorCuota.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}\n`;
      contenido += `   • Fecha de inicio: ${new Date(product.fechaInicio).toLocaleDateString('es-ES')}\n`;
      contenido += `   • Cuotas pagadas: ${product.cuotasPagadas || 0} de ${product.cuotas}\n\n`;
    });
    
    contenido += '\n' + '='.repeat(50) + '\n';
    contenido += 'Generado por Calculadora de Cuotas v2025.06.29\n';
    contenido += '='.repeat(50);
    
    // Crear y descargar archivo
    const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    const fecha = new Date().toISOString().split('T')[0];
    
    a.href = url;
    a.download = `calculadora-cuotas-${fecha}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    // Mostrar mensaje de éxito
    showSuccessMessage(`calculadora-cuotas-${fecha}.txt`);
    
  } catch (error) {
    console.error('Error en método alternativo:', error);
    alert('Error al generar el archivo. Por favor, intenta nuevamente.');
  }
}

/**
 * Muestra mensaje de éxito después de descargar PDF
 */
function showSuccessMessage(fileName: string): void {
  const btnPDF = document.getElementById('btnDescargarPDF') as HTMLButtonElement;
  if (!btnPDF) return;
  
  const originalText = btnPDF.innerHTML;
  
  btnPDF.innerHTML = '<span style="font-size: 20px;">✅</span> Descargado';
  btnPDF.style.background = '#28a745';
  btnPDF.style.color = 'white';
  
  setTimeout(() => {
    btnPDF.innerHTML = originalText;
    btnPDF.style.background = 'white';
    btnPDF.style.color = '#667eea';
  }, 3000);
}

/**
 * Verifica la disponibilidad de jsPDF
 */
export function checkPDFAvailability(): void {
  const btnPDF = document.getElementById('btnDescargarPDF') as HTMLButtonElement;
  if (!btnPDF) return;
  
  let jsPDF = null;
  
  if (typeof window.jsPDF !== 'undefined') {
    jsPDF = window.jsPDF.jsPDF || window.jsPDF;
  } else if (typeof window.jspdf !== 'undefined') {
    jsPDF = window.jspdf.jsPDF || window.jspdf;
  }
  
  if (jsPDF) {
    console.log('✅ jsPDF cargado correctamente');
    btnPDF.title = 'Descargar reporte en formato PDF';
  } else {
    console.log('⚠️ jsPDF no disponible, se usará formato texto');
    btnPDF.title = 'Descargar reporte en formato texto (PDF no disponible)';
    const iconSpan = btnPDF.querySelector('.pdf-icon');
    if (iconSpan) {
      iconSpan.textContent = '📄';
    }
    btnPDF.innerHTML = btnPDF.innerHTML.replace('Descargar PDF', 'Descargar Reporte');
  }
}
