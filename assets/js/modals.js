/**
 * Módulo de Modales - Modals.js
 * Gestiona los modales de edición y confirmación
 */

/**
 * Inicializa los event listeners de los modales
 */
function inicializarModales() {
    inicializarModalEdicion();
    inicializarModalConfirmacion();
}

/**
 * Inicializa el modal de edición de productos
 */
function inicializarModalEdicion() {
    const modal = document.getElementById('editModal');
    if (!modal) return;
    
    // Cerrar modal al hacer clic fuera del contenido
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            cerrarModalEdicion();
        }
    });
    
    // Cerrar modal con tecla Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            cerrarModalEdicion();
        }
    });
    
    // Manejar Enter para guardar
    const inputs = modal.querySelectorAll('.modal-input');
    inputs.forEach(input => {
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                guardarEdicionModal();
            }
        });
    });

    console.log('✅ Modal de edición inicializado');
}

/**
 * Inicializa el modal de confirmación de eliminación
 */
function inicializarModalConfirmacion() {
    const modal = document.getElementById('confirmModal');
    if (!modal) return;
    
    // Cerrar modal al hacer clic fuera del contenido
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            cerrarConfirmacion();
        }
    });
    
    // Cerrar modal con tecla Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            cerrarConfirmacion();
        }
    });

    console.log('✅ Modal de confirmación inicializado');
}

/**
 * Cierra el modal de edición con animación
 */
function cerrarModalEdicion() {
    const modal = document.getElementById('editModal');
    if (!modal) return;

    // Agregar clase de cierre para animación
    modal.classList.add('closing');
    
    // Después de la animación, ocultar completamente
    setTimeout(() => {
        modal.classList.remove('active', 'closing');
        modal.style.display = 'none';
        setProductoEditandoId(null);
        limpiarCamposModalEdicion();
    }, 400);
}

/**
 * Abre el modal de edición con animación suave
 */
function abrirModalEdicion() {
    const modal = document.getElementById('editModal');
    if (!modal) return;

    // Mostrar modal inmediatamente pero sin opacidad
    modal.style.display = 'flex';
    modal.classList.remove('closing');
    
    // Trigger reflow para asegurar que el display se aplique
    modal.offsetHeight;
    
    // Agregar clase activa para animación
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
}

/**
 * Limpia los campos del modal de edición
 */
function limpiarCamposModalEdicion() {
    const campos = [
        'modal-nombre',
        'modal-valor', 
        'modal-cuotas',
        'modal-fecha'
    ];

    campos.forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.value = '';
        }
    });
}

/**
 * Cierra el modal de confirmación con animación
 */
function cerrarConfirmacion() {
    const modal = document.getElementById('confirmModal');
    if (!modal) return;

    // Agregar clase de cierre para animación
    modal.classList.add('closing');
    
    // Después de la animación, ocultar completamente
    setTimeout(() => {
        modal.classList.remove('active', 'closing');
        modal.style.display = 'none';
        setProductoEliminandoId(null);
    }, 400);
}

/**
 * Abre el modal de confirmación con animación suave
 */
function abrirModalConfirmacion() {
    console.log('🚀 Abriendo modal de confirmación...');
    
    const modal = document.getElementById('confirmModal');
    if (!modal) {
        console.error('❌ Modal de confirmación no encontrado');
        return;
    }

    console.log('✅ Modal encontrado, aplicando estilos...');

    // Limpiar estados previos
    modal.classList.remove('closing');
    
    // Mostrar modal inmediatamente
    modal.style.display = 'flex';
    modal.style.visibility = 'visible';
    
    // Trigger reflow para asegurar que el display se aplique
    modal.offsetHeight;
    
    // Agregar clase activa para animación
    setTimeout(() => {
        modal.classList.add('active');
        console.log('✅ Modal de confirmación activado');
    }, 10);
}

/**
 * Muestra un modal genérico con contenido personalizado
 * @param {string} titulo - Título del modal
 * @param {string} contenido - Contenido HTML del modal
 * @param {Function} onConfirm - Función a ejecutar al confirmar
 * @param {Function} onCancel - Función a ejecutar al cancelar
 */
function mostrarModalGenerico(titulo, contenido, onConfirm = null, onCancel = null) {
    // Crear modal dinámico si no existe
    let modal = document.getElementById('modalGenerico');
    if (!modal) {
        modal = crearModalGenerico();
        document.body.appendChild(modal);
    }

    // Configurar contenido
    const tituloEl = modal.querySelector('.modal-title');
    const contenidoEl = modal.querySelector('.modal-content-body');
    const btnConfirmar = modal.querySelector('.btn-confirmar');
    const btnCancelar = modal.querySelector('.btn-cancelar');

    if (tituloEl) tituloEl.textContent = titulo;
    if (contenidoEl) contenidoEl.innerHTML = contenido;

    // Configurar eventos
    if (btnConfirmar && onConfirm) {
        btnConfirmar.onclick = () => {
            onConfirm();
            cerrarModalGenerico();
        };
    }

    if (btnCancelar && onCancel) {
        btnCancelar.onclick = () => {
            onCancel();
            cerrarModalGenerico();
        };
    } else if (btnCancelar) {
        btnCancelar.onclick = cerrarModalGenerico;
    }

    // Mostrar modal
    modal.classList.add('active');
}

/**
 * Crea la estructura HTML de un modal genérico
 * @returns {HTMLElement} Elemento del modal
 */
function crearModalGenerico() {
    const modal = document.createElement('div');
    modal.id = 'modalGenerico';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title"></h2>
                <button class="modal-close" onclick="cerrarModalGenerico()">×</button>
            </div>
            <div class="modal-body">
                <div class="modal-content-body"></div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-cancelar">Cancelar</button>
                <button class="btn btn-confirmar">Confirmar</button>
            </div>
        </div>
    `;

    // Agregar eventos
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            cerrarModalGenerico();
        }
    });

    return modal;
}

/**
 * Cierra el modal genérico
 */
function cerrarModalGenerico() {
    const modal = document.getElementById('modalGenerico');
    if (modal) {
        modal.classList.remove('active');
    }
}

/**
 * Muestra un modal de alerta simple
 * @param {string} titulo - Título del modal
 * @param {string} mensaje - Mensaje a mostrar
 * @param {Function} callback - Función a ejecutar al cerrar
 */
function mostrarAlerta(titulo, mensaje, callback = null) {
    mostrarModalGenerico(
        titulo,
        `<p style="margin: 0; padding: 10px 0;">${mensaje}</p>`,
        callback,
        callback
    );
}

/**
 * Muestra un modal de confirmación simple
 * @param {string} titulo - Título del modal
 * @param {string} mensaje - Mensaje de confirmación
 * @param {Function} onConfirm - Función a ejecutar al confirmar
 * @param {Function} onCancel - Función a ejecutar al cancelar
 */
function mostrarConfirmacion(titulo, mensaje, onConfirm, onCancel = null) {
    mostrarModalGenerico(
        titulo,
        `<p style="margin: 0; padding: 10px 0;">${mensaje}</p>`,
        onConfirm,
        onCancel
    );
}

/**
 * Comprueba si hay algún modal activo
 * @returns {boolean} True si hay un modal activo
 */
function hayModalActivo() {
    const modales = [
        'editModal',
        'confirmModal',
        'modalGenerico'
    ];

    return modales.some(id => {
        const modal = document.getElementById(id);
        return modal && modal.classList.contains('active');
    });
}
