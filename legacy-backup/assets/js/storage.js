/**
 * Módulo de Almacenamiento - Storage.js
 * Gestiona el almacenamiento temporal de productos (solo en memoria)
 * Los datos se borran al cerrar o actualizar la página
 */

// Almacenamiento temporal en memoria (se borra al cerrar/actualizar la página)
let productosEnMemoria = [];

/**
 * Obtiene todos los productos del almacenamiento temporal
 * @returns {Array} Array de productos
 */
function getProductos() {
    try {
        return [...productosEnMemoria]; // Copia del array para evitar mutaciones
    } catch (error) {
        console.error('❌ Error al obtener productos de la memoria:', error);
        return [];
    }
}

/**
 * Guarda los productos en el almacenamiento temporal
 * @param {Array} productos - Array de productos a guardar
 */
function saveProductos(productos) {
    try {
        productosEnMemoria = [...productos]; // Copia del array
        console.log('✅ Productos guardados en memoria temporal');
    } catch (error) {
        console.error('❌ Error al guardar productos en memoria:', error);
    }
}

/**
 * Obtiene un producto por ID
 * @param {number} id - ID del producto
 * @returns {Object|null} Producto encontrado o null
 */
function getProductoById(id) {
    const productos = getProductos();
    return productos.find(p => p.id === id) || null;
}

/**
 * Actualiza un producto específico
 * @param {number} id - ID del producto
 * @param {Object} datosActualizados - Nuevos datos del producto
 * @returns {boolean} True si se actualizó correctamente
 */
function updateProducto(id, datosActualizados) {
    try {
        const productos = getProductos();
        const index = productos.findIndex(p => p.id === id);
        
        if (index === -1) {
            console.error('❌ Producto no encontrado para actualizar');
            return false;
        }
        
        productos[index] = { ...productos[index], ...datosActualizados };
        saveProductos(productos);
        return true;
    } catch (error) {
        console.error('❌ Error al actualizar producto:', error);
        return false;
    }
}

/**
 * Elimina un producto por ID
 * @param {number} id - ID del producto a eliminar
 * @returns {boolean} True si se eliminó correctamente
 */
function deleteProducto(id) {
    try {
        const productos = getProductos().filter(p => p.id !== id);
        saveProductos(productos);
        return true;
    } catch (error) {
        console.error('❌ Error al eliminar producto:', error);
        return false;
    }
}

/**
 * Verifica si el almacenamiento temporal está disponible
 * @returns {boolean} Siempre true para almacenamiento en memoria
 */
function isStorageAvailable() {
    return true; // El almacenamiento en memoria siempre está disponible
}

/**
 * Limpia todos los productos del almacenamiento temporal
 */
function limpiarTodosLosProductos() {
    try {
        productosEnMemoria = [];
        console.log('✅ Todos los productos eliminados de la memoria');
    } catch (error) {
        console.error('❌ Error al limpiar productos:', error);
    }
}

/**
 * Obtiene la cantidad total de productos
 * @returns {number} Número total de productos
 */
function getTotalProductos() {
    return productosEnMemoria.length;
}

// ========================================
// EXPORTAR FUNCIONES AL ÁMBITO GLOBAL
// ========================================

// Funciones principales de almacenamiento
window.getProductos = getProductos;
window.saveProductos = saveProductos;
window.deleteProducto = deleteProducto;
window.updateProducto = updateProducto;
window.getProductoById = getProductoById;
window.limpiarTodosLosProductos = limpiarTodosLosProductos;
window.getTotalProductos = getTotalProductos;
window.isStorageAvailable = isStorageAvailable;

console.log('💾 Storage.js: Funciones exportadas al ámbito global');
