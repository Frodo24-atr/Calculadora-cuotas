/**
 * Módulo de Productos - Products.js
 * Gestiona las operaciones CRUD de productos
 */

// Nota: Las variables productoEditandoId y productoEliminandoId están en app.js
// Se acceden mediante las funciones getProductoEditandoId(), setProductoEditandoId(), etc.

/**
 * Agrega un nuevo producto al sistema
 */
function agregarProducto() {
    console.log('🚀 Agregando producto...');
    
    try {
        // Obtener elementos del formulario
        const nombreEl = document.getElementById('nombreProducto');
        const valorEl = document.getElementById('valorTotalProducto');
        const cuotasEl = document.getElementById('numeroCuotas');
        const fechaEl = document.getElementById('fechaInicio');

        if (!nombreEl || !valorEl || !cuotasEl || !fechaEl) {
            throw new Error('No se pudieron encontrar todos los campos del formulario');
        }

        // Obtener valores
        const nombre = nombreEl.value.trim();
        const valorInput = valorEl.value.trim();
        const cuotasInput = cuotasEl.value.trim();
        const fechaInicio = fechaEl.value.trim();

        // Validar datos
        const validacion = validarDatosProducto(nombre, valorInput, cuotasInput, fechaInicio);
        if (!validacion.valido) {
            alert(validacion.mensaje);
            validacion.elemento?.focus();
            return;
        }

        // Crear producto
        const valor = parseFloat(valorInput);
        const cuotas = parseInt(cuotasInput);
        const producto = crearProducto(nombre, valor, cuotas, fechaInicio);

        console.log('✅ Producto creado:', producto);

        // Guardar producto
        const productos = getProductos();
        productos.push(producto);
        saveProductos(productos);

        // Actualizar interfaz
        limpiarFormulario();
        cargarProductos();
        actualizarEstadisticas();
        actualizarGrafico();
        
        // Mostrar mensaje de éxito
        mostrarMensajeExito(producto);
        
        console.log('🎉 Producto agregado completamente');
        
    } catch (error) {
        console.error('❌ Error al agregar producto:', error);
        alert('Error al agregar el producto: ' + error.message);
    }
}

/**
 * Valida los datos de un producto
 * @param {string} nombre - Nombre del producto
 * @param {string} valorInput - Valor como string
 * @param {string} cuotasInput - Cuotas como string
 * @param {string} fechaInicio - Fecha de inicio
 * @returns {Object} Objeto con validación
 */
function validarDatosProducto(nombre, valorInput, cuotasInput, fechaInicio) {
    if (!nombre) {
        return {
            valido: false,
            mensaje: 'Por favor, ingresa el nombre del producto',
            elemento: document.getElementById('nombreProducto')
        };
    }
    
    if (!valorInput || isNaN(valorInput) || parseFloat(valorInput) <= 0) {
        return {
            valido: false,
            mensaje: 'Por favor, ingresa un valor total válido (mayor a 0)',
            elemento: document.getElementById('valorTotalProducto')
        };
    }
    
    if (!cuotasInput || isNaN(cuotasInput) || parseInt(cuotasInput) <= 0) {
        return {
            valido: false,
            mensaje: 'Por favor, ingresa un número de cuotas válido (mayor a 0)',
            elemento: document.getElementById('numeroCuotas')
        };
    }
    
    if (!fechaInicio) {
        return {
            valido: false,
            mensaje: 'Por favor, selecciona una fecha de inicio',
            elemento: document.getElementById('fechaInicio')
        };
    }

    return { valido: true };
}

/**
 * Crea un objeto producto con los datos proporcionados
 * @param {string} nombre - Nombre del producto
 * @param {number} valor - Valor total
 * @param {number} cuotas - Número de cuotas
 * @param {string} fechaInicio - Fecha de inicio
 * @returns {Object} Objeto producto
 */
function crearProducto(nombre, valor, cuotas, fechaInicio) {
    return {
        id: Date.now(),
        nombre,
        valor,
        cuotas,
        fechaInicio,
        valorCuota: valor / cuotas,
        cuotasPagadas: 0
    };
}

/**
 * Limpia el formulario de productos
 */
function limpiarFormulario() {
    const nombreEl = document.getElementById('nombreProducto');
    const valorEl = document.getElementById('valorTotalProducto');
    const cuotasEl = document.getElementById('numeroCuotas');
    const fechaEl = document.getElementById('fechaInicio');

    if (nombreEl) nombreEl.value = '';
    if (valorEl) valorEl.value = '';
    if (cuotasEl) cuotasEl.value = '';
    if (fechaEl) {
        const today = new Date().toISOString().split('T')[0];
        fechaEl.value = today;
    }
}

/**
 * Carga y muestra la lista de productos con animaciones
 */
function cargarProductos() {
    const productos = getProductos();
    const lista = document.getElementById('listaProductos');
    
    if (productos.length === 0) {
        lista.innerHTML = '<p style="text-align: center; color: #666;">No tienes productos registrados aún.</p>';
        actualizarVisibilidadBotonBorrarTodo();
        return;
    }

    lista.innerHTML = productos.map(producto => generarHTMLProducto(producto)).join('');
    
    // Animar la entrada de los productos
    animarEntradaProductos();
    
    // Actualizar visibilidad del botón "Borrar Todo"
    actualizarVisibilidadBotonBorrarTodo();
}

/**
 * Anima la entrada de los productos con efecto escalonado
 */
function animarEntradaProductos() {
    const productos = document.querySelectorAll('.producto-item');
    productos.forEach((producto, index) => {
        setTimeout(() => {
            producto.classList.add('animate-in');
        }, index * 100); // Delay escalonado de 100ms entre productos
    });
}

/**
 * Genera el HTML para mostrar un producto
 * @param {Object} producto - Datos del producto
 * @returns {string} HTML del producto
 */
function generarHTMLProducto(producto) {
    return `
        <div class="producto-item" id="producto-${producto.id}">
            <div class="producto-header">
                <span class="producto-nombre">${producto.nombre}</span>
                <div class="producto-acciones">
                    <button onclick="editarProducto(${producto.id})" class="btn btn-edit" style="background: #FF9800; padding: 5px 10px; font-size: 12px; margin-right: 5px;">✏️ Editar</button>
                    <button onclick="eliminarProducto(${producto.id})" class="btn btn-delete" style="background: #f44336; padding: 5px 10px; font-size: 12px;" title="Eliminar producto">🗑️ Eliminar</button>
                    <button onclick="eliminarProductoDirecto(${producto.id})" class="btn btn-delete-direct" style="background: #d32f2f; padding: 5px 8px; font-size: 10px; margin-left: 5px;" title="Eliminar directamente (sin confirmación)">❌</button>
                </div>
            </div>
            <div class="producto-info">
                <div><strong>Valor Total:</strong> $${producto.valor.toLocaleString()}</div>
                <div><strong>Cuotas:</strong> ${producto.cuotas}</div>
                <div><strong>Valor por Cuota:</strong> $${producto.valorCuota.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</div>
                <div><strong>Fecha de Inicio:</strong> ${new Date(producto.fechaInicio).toLocaleDateString()}</div>
            </div>
        </div>
    `;
}

/**
 * Inicia el proceso de eliminación de un producto
 * @param {number} id - ID del producto a eliminar
 */
function eliminarProducto(id) {
    console.log('🗑️ Iniciando eliminación del producto:', id);
    
    const producto = getProductoById(id);
    if (!producto) {
        console.error('❌ Producto no encontrado:', id);
        alert('Error: Producto no encontrado');
        return;
    }

    console.log('✅ Producto encontrado:', producto.nombre);

    // Almacenar el ID del producto que se va a eliminar
    setProductoEliminandoId(id);
    console.log('✅ ID almacenado para eliminación');

    // Mostrar el nombre del producto en el modal
    const productNameElement = document.getElementById('confirm-product-name');
    if (productNameElement) {
        productNameElement.textContent = producto.nombre;
        console.log('✅ Nombre del producto establecido en el modal');
    } else {
        console.error('❌ Elemento confirm-product-name no encontrado');
    }

    // Mostrar el modal de confirmación con animación
    console.log('🚀 Llamando a abrirModalConfirmacion...');
    abrirModalConfirmacion();
}

/**
 * Confirma y ejecuta la eliminación del producto con animación
 */
function confirmarEliminacion() {
    console.log('✅ Confirmando eliminación...');
    
    const productoEliminandoId = getProductoEliminandoId();
    if (!productoEliminandoId) {
        console.error('❌ No hay producto seleccionado para eliminar');
        return;
    }

    console.log('🗑️ Eliminando producto ID:', productoEliminandoId);

    try {
        // Animar el elemento antes de eliminarlo
        const elementoProducto = document.getElementById(`producto-${productoEliminandoId}`);
        if (elementoProducto) {
            console.log('🎬 Aplicando animación de salida...');
            elementoProducto.classList.add('animate-out');
            
            // Esperar a que termine la animación antes de eliminar
            setTimeout(() => {
                if (deleteProducto(productoEliminandoId)) {
                    console.log('✅ Producto eliminado de la base de datos');
                    cargarProductos();
                    actualizarEstadisticas();
                    actualizarGrafico();
                    console.log('✅ Interfaz actualizada');
                } else {
                    console.error('❌ Error al eliminar producto de la base de datos');
                }
            }, 400);
        } else {
            console.log('⚠️ Elemento visual no encontrado, eliminando directamente...');
            // Si no hay elemento, eliminar directamente
            if (deleteProducto(productoEliminandoId)) {
                console.log('✅ Producto eliminado directamente');
                cargarProductos();
                actualizarEstadisticas();
                actualizarGrafico();
            } else {
                console.error('❌ Error al eliminar producto');
            }
        }

        // Cerrar modal inmediatamente
        console.log('🚪 Cerrando modal...');
        cerrarConfirmacion();
        
    } catch (error) {
        console.error('❌ Error al eliminar producto:', error);
        alert('Error al eliminar el producto: ' + error.message);
    }
}

/**
 * Inicia el proceso de edición de un producto
 * @param {number} id - ID del producto a editar
 */
function editarProducto(id) {
    const producto = getProductoById(id);
    if (!producto) return;

    // Almacenar el ID del producto que se está editando
    setProductoEditandoId(id);

    // Llenar los campos del modal con los datos actuales
    document.getElementById('modal-nombre').value = producto.nombre;
    document.getElementById('modal-valor').value = producto.valor;
    document.getElementById('modal-cuotas').value = producto.cuotas;
    
    const fechaFormateada = new Date(producto.fechaInicio).toISOString().split('T')[0];
    document.getElementById('modal-fecha').value = fechaFormateada;

    // Mostrar el modal con animación
    abrirModalEdicion();
    
    // Enfocar el primer campo
    setTimeout(() => {
        document.getElementById('modal-nombre').focus();
    }, 500);
}

/**
 * Guarda los cambios de edición desde el modal
 */
function guardarEdicionModal() {
    const productoEditandoId = getProductoEditandoId();
    if (!productoEditandoId) return;

    try {
        // Obtener valores del modal
        const nombre = document.getElementById('modal-nombre').value.trim();
        const valor = parseFloat(document.getElementById('modal-valor').value);
        const cuotas = parseInt(document.getElementById('modal-cuotas').value);
        const fechaInicio = document.getElementById('modal-fecha').value;

        // Validar datos
        const validacion = validarDatosProducto(nombre, valor.toString(), cuotas.toString(), fechaInicio);
        if (!validacion.valido) {
            alert(validacion.mensaje);
            // Adaptar el enfoque para el modal
            const fieldName = validacion.elemento?.id.replace('', 'modal-');
            document.getElementById(fieldName)?.focus();
            return;
        }

        // Actualizar producto
        const datosActualizados = {
            nombre,
            valor,
            cuotas,
            fechaInicio,
            valorCuota: valor / cuotas
        };

        if (updateProducto(productoEditandoId, datosActualizados)) {
            cargarProductos();
            actualizarEstadisticas();
            actualizarGrafico();
            cerrarModalEdicion();
            console.log('✅ Producto editado exitosamente');
        }
        
    } catch (error) {
        console.error('❌ Error al editar producto:', error);
        alert('Error al editar el producto: ' + error.message);
    }
}

/**
 * Muestra un mensaje de éxito y destaca el producto recién agregado
 * @param {Object} producto - Producto agregado
 */
function mostrarMensajeExito(producto) {
    console.log('🎯 Mostrando mensaje de éxito para:', producto.nombre);
    
    try {
        // Mostrar mensaje temporal
        const resultadoEl = document.getElementById('resultado');
        console.log('🔍 Elemento resultado encontrado:', !!resultadoEl);
        
        if (!resultadoEl) {
            console.error('❌ No se encontró el elemento con id="resultado"');
            // Buscar elementos alternativos
            const alternativas = ['resultado', 'resultados', 'messages', 'notifications'];
            for (const id of alternativas) {
                const el = document.getElementById(id);
                if (el) {
                    console.log(`✅ Encontrado elemento alternativo: ${id}`);
                    break;
                }
            }
            return;
        }
        
        if (!producto || !producto.nombre || !producto.cuotas || !producto.valorCuota) {
            console.error('❌ Datos del producto inválidos:', producto);
            return;
        }
        
        resultadoEl.innerHTML = `
            <div style="background: #d4edda; color: #155724; padding: 15px; border-radius: 8px; border: 1px solid #c3e6cb; margin-top: 15px; transform: translateY(-10px); opacity: 0; transition: all 0.3s ease;">
                <strong>✅ Producto agregado exitosamente!</strong><br>
                <em>${producto.nombre}</em> con ${producto.cuotas} cuotas de $${producto.valorCuota.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} cada una.
            </div>
        `;
        console.log('✅ Mensaje de éxito insertado en el DOM');
        
        // Animar la entrada del mensaje
        setTimeout(() => {
            const mensaje = resultadoEl.querySelector('div');
            if (mensaje) {
                mensaje.style.transform = 'translateY(0)';
                mensaje.style.opacity = '1';
                console.log('✅ Animación de entrada aplicada');
            }
        }, 100);
        
        // Ocultar después de 5 segundos
        setTimeout(() => {
            const mensaje = resultadoEl.querySelector('div');
            if (mensaje) {
                mensaje.style.transform = 'translateY(-10px)';
                mensaje.style.opacity = '0';
                setTimeout(() => {
                    if (resultadoEl) {
                        resultadoEl.innerHTML = '';
                        console.log('✅ Mensaje de éxito limpiado');
                    }
                }, 300);
            }
        }, 5000);
        
    } catch (error) {
        console.error('❌ Error en mostrarMensajeExito:', error);
    }
    
    // Destacar el producto recién agregado
    setTimeout(() => {
        try {
            destacarProductoRecienAgregado(producto.id);
        } catch (error) {
            console.error('❌ Error al destacar producto:', error);
        }
    }, 500);
}

/**
 * Destaca un producto recién agregado con animación de brillar
 * @param {number} productoId - ID del producto
 */
function destacarProductoRecienAgregado(productoId) {
    const elementoProducto = document.getElementById(`producto-${productoId}`);
    if (elementoProducto) {
        elementoProducto.classList.add('highlight');
        
        // Remover la clase después de la animación
        setTimeout(() => {
            elementoProducto.classList.remove('highlight');
        }, 1500);
    }
}

/**
 * Limpia todos los productos con confirmación
 */
function limpiarTodosProductos() {
    const productos = getProductos();
    if (productos.length === 0) {
        alert('No hay productos para eliminar.');
        return;
    }
    
    const confirmacion = confirm(`¿Estás seguro de que deseas eliminar todos los ${productos.length} productos?\n\nEsta acción no se puede deshacer.`);
    
    if (confirmacion) {
        // Animar todos los productos antes de eliminarlos
        const productElements = document.querySelectorAll('.producto-item');
        productElements.forEach((element, index) => {
            setTimeout(() => {
                element.classList.add('animate-out');
            }, index * 100); // Escalonar las animaciones
        });
        
        // Después de las animaciones, limpiar todo
        setTimeout(() => {
            limpiarTodosLosProductos();
            cargarProductos(); // Esto ya llama a actualizarVisibilidadBotonBorrarTodo()
            actualizarEstadisticas();
            actualizarGrafico();
            
            // Mostrar mensaje de confirmación
            try {
                const resultadoEl = document.getElementById('resultado');
                console.log('🔍 Elemento resultado encontrado para borrar todo:', !!resultadoEl);
                
                if (resultadoEl) {
                    resultadoEl.innerHTML = `
                        <div style="background: #d4edda; color: #155724; padding: 15px; border-radius: 8px; border: 1px solid #c3e6cb; margin-top: 15px;">
                            <strong>✅ Todos los productos han sido eliminados</strong><br>
                            <em>La página está lista para nuevos productos.</em>
                        </div>
                    `;
                    console.log('✅ Mensaje de confirmación insertado');
                    
                    // Ocultar mensaje después de 3 segundos
                    setTimeout(() => {
                        if (resultadoEl && resultadoEl.innerHTML.includes('productos han sido eliminados')) {
                            resultadoEl.innerHTML = '';
                            console.log('✅ Mensaje de confirmación limpiado');
                        }
                    }, 3000);
                } else {
                    console.error('❌ No se encontró el elemento resultado para mostrar confirmación');
                }
            } catch (error) {
                console.error('❌ Error al mostrar mensaje de confirmación:', error);
            }
            
            console.log('✅ Todos los productos eliminados');
        }, productElements.length * 100 + 400);
    }
}

/**
 * Actualiza la visibilidad del botón "Borrar Todo"
 */
function actualizarVisibilidadBotonBorrarTodo() {
    const productos = getProductos();
    const btnBorrarTodo = document.getElementById('btnBorrarTodo');
    
    if (!btnBorrarTodo) return;
    
    const debeEstarVisible = productos.length > 1;
    const estaVisible = window.getComputedStyle(btnBorrarTodo).display !== 'none';
    
    // Solo hacer cambios si el estado debe cambiar
    if (debeEstarVisible && !estaVisible) {
        // Mostrar botón
        btnBorrarTodo.style.display = 'inline-block';
        btnBorrarTodo.style.opacity = '0';
        btnBorrarTodo.style.transform = 'translateY(-10px)';
        
        // Animación de entrada
        setTimeout(() => {
            btnBorrarTodo.style.transition = 'all 0.3s ease';
            btnBorrarTodo.style.opacity = '1';
            btnBorrarTodo.style.transform = 'translateY(0)';
        }, 10);
        
    } else if (!debeEstarVisible && estaVisible) {
        // Ocultar botón
        btnBorrarTodo.style.transition = 'all 0.3s ease';
        btnBorrarTodo.style.opacity = '0';
        btnBorrarTodo.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
            btnBorrarTodo.style.display = 'none';
        }, 300);
    }
}

// Getter para variables globales (para uso en otros módulos)
function getProductoEditandoId() {
    return productoEditandoId;
}

function getProductoEliminandoId() {
    return productoEliminandoId;
}

function setProductoEditandoId(id) {
    productoEditandoId = id;
}

function setProductoEliminandoId(id) {
    productoEliminandoId = id;
}

/**
 * Elimina un producto directamente sin modal de confirmación
 * @param {number} id - ID del producto a eliminar
 */
function eliminarProductoDirecto(id) {
    console.log('⚡ Eliminación directa del producto:', id);
    
    const producto = getProductoById(id);
    if (!producto) {
        console.error('❌ Producto no encontrado:', id);
        return;
    }

    const confirmacion = confirm(`¿Eliminar "${producto.nombre}"?\n\nEsta acción no se puede deshacer.`);
    
    if (confirmacion) {
        try {
            // Animar el elemento antes de eliminarlo
            const elementoProducto = document.getElementById(`producto-${id}`);
            if (elementoProducto) {
                elementoProducto.classList.add('animate-out');
                
                setTimeout(() => {
                    if (deleteProducto(id)) {
                        cargarProductos();
                        actualizarEstadisticas();
                        actualizarGrafico();
                        console.log('✅ Producto eliminado directamente');
                    }
                }, 400);
            } else {
                if (deleteProducto(id)) {
                    cargarProductos();
                    actualizarEstadisticas();
                    actualizarGrafico();
                    console.log('✅ Producto eliminado directamente');
                }
            }
            
        } catch (error) {
            console.error('❌ Error en eliminación directa:', error);
            alert('Error al eliminar el producto: ' + error.message);
        }
    }
}
