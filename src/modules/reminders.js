/**
 * Módulo de Recordatorios
 * Gestiona recordatorios por WhatsApp y Email
 */

class RemindersManager {
  constructor() {
    this.config = {
      email: {
        enabled: false,
        address: '',
        daysAhead: 3,
        serviceId: '', // EmailJS Service ID
        templateId: '', // EmailJS Template ID
        publicKey: '' // EmailJS Public Key
      }
    };
    
    this.reminders = [];
    this.sentReminders = new Set(); // Para evitar enviar duplicados
    this.checkInterval = null; // Intervalo de verificación
    this.loadConfig();
    this.loadSentReminders();
    this.initializeServices();
    this.startReminderScheduler();
    
    // Inicializar UI cuando el DOM esté listo
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.updateUI();
        this.loadExistingProducts();
      });
    } else {
      this.updateUI();
      this.loadExistingProducts();
    }
  }

  // Cargar configuración del localStorage
  loadConfig() {
    const saved = localStorage.getItem('remindersConfig');
    if (saved) {
      this.config = { ...this.config, ...JSON.parse(saved) };
    }
  }

  // Guardar configuración
  saveConfig() {
    localStorage.setItem('remindersConfig', JSON.stringify(this.config));
    this.updateUI();
  }

  // Cargar recordatorios ya enviados
  loadSentReminders() {
    const saved = localStorage.getItem('sentReminders');
    if (saved) {
      this.sentReminders = new Set(JSON.parse(saved));
    }
  }

  // Guardar recordatorios enviados
  saveSentReminders() {
    localStorage.setItem('sentReminders', JSON.stringify([...this.sentReminders]));
  }

  // Inicializar servicios externos
  async initializeServices() {
    // Verificar que la configuración esté disponible
    if (typeof window.SERVICES_CONFIG === 'undefined') {
      console.warn('⚠️ Configuración de servicios no encontrada');
      return;
    }

    const config = window.SERVICES_CONFIG;

    // Inicializar EmailJS
    if (typeof emailjs !== 'undefined') {
      try {
        // Verificar configuración completa
        if (!config.emailJS.publicKey || !config.emailJS.serviceId || !config.emailJS.templateId) {
          console.warn('⚠️ Configuración de EmailJS incompleta. Revisa src/config/services.js');
          return;
        }

        emailjs.init({
          publicKey: config.emailJS.publicKey,
          blockHeadless: true,
          limitRate: {
            id: 'app',
            throttle: 10000,
          },
        });
        console.log('✅ EmailJS inicializado correctamente');
      } catch (error) {
        console.warn('⚠️ Error inicializando EmailJS:', error.message);
      }
    } else {
      console.warn('⚠️ EmailJS no disponible - se usará solo WhatsApp');
    }
  }

  // Configurar recordatorio de Email
  async setupEmail(address, daysAhead) {
    if (!address || !this.validateEmail(address)) {
      throw new Error('Dirección de email inválida');
    }

    // Verificar configuración
    if (typeof window.SERVICES_CONFIG === 'undefined') {
      throw new Error('Configuración de servicios no encontrada. Revisa el archivo config/services.js');
    }

    const emailConfig = window.SERVICES_CONFIG.emailJS;
    
    // Verificar que todas las claves estén configuradas
    if (!emailConfig.publicKey || !emailConfig.serviceId || !emailConfig.templateId) {
      throw new Error('Configuración de EmailJS incompleta. Verifica que tengas configurado publicKey, serviceId y templateId en config/services.js');
    }

    // Verificar que EmailJS esté disponible
    if (typeof emailjs === 'undefined') {
      throw new Error('EmailJS no está disponible. Verifica que esté incluido en el HTML');
    }

    // Verificar si estamos ejecutando desde archivo local
    if (window.location.protocol === 'file:') {
      console.warn('⚠️ EmailJS puede no funcionar desde archivos locales debido a CORS. Se recomienda usar un servidor local.');
    }

    this.config.email = {
      enabled: true,
      address: address,
      daysAhead: parseInt(daysAhead) || 3,
      serviceId: emailConfig.serviceId,
      templateId: emailConfig.templateId,
      publicKey: emailConfig.publicKey
    };

    this.saveConfig();
    return true;
  }

  // Validar email
  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  // Generar recordatorios para todos los productos
  generateReminders(products) {
    this.reminders = [];
    
    products.forEach(product => {
      const startDate = new Date(product.startDate);
      
      for (let i = 0; i < product.installments; i++) {
        const paymentDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
        
        // Crear recordatorios solo para Email
        if (this.config.email.enabled) {
          const reminderDate = new Date(paymentDate);
          reminderDate.setDate(reminderDate.getDate() - this.config.email.daysAhead);
          
          this.reminders.push({
            type: 'email',
            product: product.name,
            paymentDate: paymentDate,
            reminderDate: reminderDate,
            amount: product.monthlyPayment,
            installment: i + 1,
            totalInstallments: product.installments
          });
        }
      }
    });

    // Ordenar por fecha de recordatorio
    this.reminders.sort((a, b) => a.reminderDate - b.reminderDate);
    
    // Verificar inmediatamente si hay recordatorios pendientes
    setTimeout(() => {
      this.checkPendingReminders();
    }, 1000);
    
    this.updateUI();
    
    console.log(`📅 Se generaron ${this.reminders.length} recordatorios`);
  }

  // Forzar verificación manual de recordatorios
  async forceCheckReminders() {
    console.log('🔄 Verificando recordatorios manualmente...');
    await this.checkPendingReminders();
  }

  // Enviar recordatorio por WhatsApp
  async sendWhatsAppReminder(reminder) {
    const message = encodeURIComponent(
      `🔔 *Recordatorio de Pago*\n\n` +
      `📦 Producto: ${reminder.product}\n` +
      `💰 Monto: $${Math.round(reminder.amount).toLocaleString('es-ES')}\n` +
      `📅 Fecha de pago: ${reminder.paymentDate.toLocaleDateString('es-ES')}\n` +
      `📊 Cuota: ${reminder.installment}/${reminder.totalInstallments}\n\n` +
      `¡No olvides hacer tu pago! 💪`
    );

    const whatsappUrl = `https://wa.me/${this.config.whatsapp.number.replace('+', '')}?text=${message}`;
    
    // Mostrar notificación al usuario
    this.showReminderNotification('WhatsApp', reminder);
    
    // Abrir WhatsApp (el usuario debe hacer clic para enviar)
    window.open(whatsappUrl, '_blank');
  }

  // Mostrar notificación de recordatorio
  showReminderNotification(type, reminder) {
    // Crear notificación visual
    const notification = document.createElement('div');
    notification.className = 'reminder-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-icon">🔔</div>
        <div class="notification-text">
          <strong>Recordatorio ${type}</strong><br>
          ${reminder.product} - $${Math.round(reminder.amount).toLocaleString('es-ES')}<br>
          <small>Fecha de pago: ${reminder.paymentDate.toLocaleDateString('es-ES')}</small>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" class="notification-close">×</button>
      </div>
    `;

    // Agregar estilos si no existen
    if (!document.getElementById('reminder-notification-styles')) {
      const styles = document.createElement('style');
      styles.id = 'reminder-notification-styles';
      styles.textContent = `
        .reminder-notification {
          position: fixed;
          top: 20px;
          right: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 15px;
          border-radius: 10px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.3);
          z-index: 10000;
          max-width: 350px;
          animation: slideIn 0.3s ease-out;
        }
        .notification-content {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .notification-icon {
          font-size: 24px;
        }
        .notification-text {
          flex: 1;
          font-size: 14px;
        }
        .notification-close {
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          width: 25px;
          height: 25px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 16px;
        }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(styles);
    }

    document.body.appendChild(notification);

    // Auto-remover después de 8 segundos
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 8000);
  }

  // Enviar recordatorio por email
  async sendEmailReminder(reminder) {
    if (typeof emailjs === 'undefined') {
      throw new Error('EmailJS no está disponible');
    }

    // Verificar configuración
    if (!this.config.email.serviceId || !this.config.email.templateId) {
      throw new Error('Configuración de email incompleta');
    }

    // Si estamos en archivo local, mostrar advertencia pero intentar enviar
    if (window.location.protocol === 'file:') {
      console.warn('⚠️ Intentando enviar email desde archivo local - puede fallar por CORS');
    }

    const templateParams = {
      to_email: this.config.email.address,
      product_name: reminder.product,
      payment_amount: Math.round(reminder.amount).toLocaleString('es-ES'),
      payment_date: reminder.paymentDate.toLocaleDateString('es-ES'),
      installment_current: reminder.installment,
      installment_total: reminder.totalInstallments,
      days_ahead: this.config.email.daysAhead
    };

    try {
      const response = await emailjs.send(
        this.config.email.serviceId,
        this.config.email.templateId,
        templateParams
      );
      
      console.log('✅ Email enviado correctamente:', response);
      
      // Mostrar notificación de éxito
      this.showReminderNotification('Email', reminder);
      
      return true;
    } catch (error) {
      console.error('❌ Error detallado enviando email:', error);
      
      // Si es error de CORS, sugerir alternativa
      if (error.message && error.message.includes('CORS')) {
        throw new Error('Error de CORS: Para usar email, ejecuta la aplicación desde un servidor web (no archivo local)');
      }
      
      throw new Error('Error enviando email: ' + (error.message || 'Error desconocido'));
    }
  }

  // Obtener próximos recordatorios
  getUpcomingReminders(limit = 5) {
    const now = new Date();
    return this.reminders
      .filter(r => r.reminderDate >= now)
      .slice(0, limit);
  }

  // Eliminar recordatorio individual
  deleteReminder(index) {
    const upcoming = this.getUpcomingReminders();
    if (index >= 0 && index < upcoming.length) {
      const reminderToDelete = upcoming[index];
      
      // Encontrar el índice en el array completo de recordatorios
      const fullIndex = this.reminders.findIndex(r => 
        r.product === reminderToDelete.product &&
        r.installment === reminderToDelete.installment &&
        r.type === reminderToDelete.type &&
        r.reminderDate.getTime() === reminderToDelete.reminderDate.getTime()
      );
      
      if (fullIndex !== -1) {
        this.reminders.splice(fullIndex, 1);
        this.updateUI();
        return true;
      }
    }
    return false;
  }

  // Eliminar todos los recordatorios
  deleteAllReminders() {
    this.reminders = [];
    this.sentReminders.clear();
    this.saveSentReminders();
    this.updateUI();
  }

  // Limpiar recordatorios de un producto específico
  clearProductReminders(productName) {
    this.reminders = this.reminders.filter(r => r.product !== productName);
    this.updateUI();
  }

  // Actualizar la interfaz de usuario con los recordatorios
  updateUI() {
    const nextRemindersDiv = document.getElementById('nextReminders');
    if (!nextRemindersDiv) return;

    const upcoming = this.getUpcomingReminders();
    
    if (upcoming.length === 0) {
      nextRemindersDiv.innerHTML = '<p>No hay recordatorios programados</p>';
      return;
    }

    const remindersHTML = upcoming.map((reminder, index) => {
      const typeIcon = '';
      const typeName = 'Email';
      
      return `
        <div class="reminder-item">
          <div class="reminder-info">
            <span class="reminder-type">${typeIcon} ${typeName}</span>
            <span class="reminder-product">${reminder.product}</span>
            <span class="reminder-amount">$${Math.round(reminder.amount).toLocaleString('es-ES')}</span>
            <span class="reminder-date">${reminder.reminderDate.toLocaleDateString('es-ES')}</span>
          </div>
          <button class="delete-reminder-btn" onclick="deleteIndividualReminder(${index})" title="Eliminar recordatorio">
            ✕
          </button>
        </div>
      `;
    }).join('');

    nextRemindersDiv.innerHTML = remindersHTML;

    // Mostrar/ocultar controles de eliminación según haya recordatorios
    const remindersControls = document.getElementById('remindersControls');
    if (remindersControls) {
      remindersControls.style.display = upcoming.length > 0 ? 'block' : 'none';
    }

    // Actualizar estados de configuración
    this.updateStatusIndicators();
  }

  // Actualizar indicadores de estado
  updateStatusIndicators() {
    const emailStatus = document.getElementById('emailStatus');

    if (emailStatus) {
      emailStatus.textContent = this.config.email.enabled ? 
        `Configurado (${this.config.email.address})` : 'No configurado';
    }
  }

  // Cargar productos existentes al inicializar
  loadExistingProducts() {
    try {
      const products = JSON.parse(localStorage.getItem('products') || '[]');
      if (products.length > 0) {
        this.generateReminders(products);
        console.log(`📅 Cargados ${products.length} productos existentes para recordatorios`);
      }
    } catch (error) {
      console.warn('⚠️ Error cargando productos existentes:', error);
    }
  }

  // ...existing code...
}

// Instancia global
let remindersManager;

// Funciones globales para los botones
window.setupEmailReminder = async function() {
  const email = document.getElementById('emailAddress').value;
  const days = document.getElementById('emailDays').value;

  try {
    // Intentar inicializar si no está disponible
    if (!window.remindersManager) {
      window.remindersManager = new RemindersManager();
      console.log('🔄 Sistema de recordatorios inicializado automáticamente');
    }
    
    await window.remindersManager.setupEmail(email, days);
    
    // Regenerar recordatorios si hay productos
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    if (products.length > 0) {
      window.remindersManager.generateReminders(products);
    }
    
    alert('✅ Recordatorios de email configurados correctamente');
  } catch (error) {
    alert('❌ Error: ' + error.message);
  }
};

// Función para eliminar recordatorio individual
window.deleteIndividualReminder = function(index) {
  // Intentar inicializar si no está disponible
  if (!window.remindersManager) {
    try {
      window.remindersManager = new RemindersManager();
      console.log('🔄 Sistema de recordatorios inicializado automáticamente');
    } catch (error) {
      alert('❌ Error: No se pudo inicializar el sistema de recordatorios');
      console.error('Error:', error);
      return;
    }
  }
  
  const upcoming = window.remindersManager.getUpcomingReminders();
  if (index >= 0 && index < upcoming.length) {
    const reminder = upcoming[index];
    
    if (confirm(`¿Eliminar recordatorio de "${reminder.product}"?\n\nFecha: ${reminder.reminderDate.toLocaleDateString('es-ES')}\nTipo: Email`)) {
      const deleted = window.remindersManager.deleteReminder(index);
      if (deleted) {
        alert('✅ Recordatorio eliminado correctamente');
      } else {
        alert('❌ Error eliminando el recordatorio');
      }
    }
  }
};

// Función para eliminar todos los recordatorios
window.deleteAllReminders = function() {
  // Intentar inicializar si no está disponible
  if (!window.remindersManager) {
    try {
      window.remindersManager = new RemindersManager();
      console.log('🔄 Sistema de recordatorios inicializado automáticamente');
    } catch (error) {
      alert('❌ Error: No se pudo inicializar el sistema de recordatorios');
      console.error('Error:', error);
      return;
    }
  }
  
  const upcoming = window.remindersManager.getUpcomingReminders();
  if (upcoming.length === 0) {
    alert('ℹ️ No hay recordatorios para eliminar');
    return;
  }
  
  if (confirm(`¿Eliminar TODOS los recordatorios pendientes?\n\nSe eliminarán ${upcoming.length} recordatorio(s).\nEsta acción no se puede deshacer.`)) {
    window.remindersManager.deleteAllReminders();
    alert('✅ Todos los recordatorios han sido eliminados');
  }
};

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RemindersManager;
}

// Hacer disponible globalmente
window.RemindersManager = RemindersManager;

// Mostrar advertencias según el entorno al cargar la página
document.addEventListener('DOMContentLoaded', function() {
  // Inicializar el sistema de recordatorios automáticamente
  if (!window.remindersManager) {
    try {
      window.remindersManager = new RemindersManager();
      console.log('✅ Sistema de recordatorios inicializado automáticamente');
    } catch (error) {
      console.error('❌ Error inicializando sistema de recordatorios:', error);
    }
  }

  // Mostrar advertencia de CORS para email
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const isFile = window.location.protocol === 'file:';
  
  if (isLocalhost || isFile) {
    // Advertencia para Google Calendar
    const calendarWarning = document.getElementById('calendarLocalWarning');
    if (calendarWarning) {
      calendarWarning.style.display = 'block';
    }
    
    // Advertencia para Email si existe
    const emailWarning = document.getElementById('emailWarning');
    if (emailWarning) {
      emailWarning.style.display = 'block';
    }
    
    console.log('📍 Detectado entorno de desarrollo local');
    console.log('✅ WhatsApp: Funciona perfectamente');
    console.log('⚠️ Email: Puede fallar por CORS');
    console.log('❌ Google Calendar: No funciona en localhost');
  }
});
