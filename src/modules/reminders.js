/**
 * Módulo de Recordatorios
 * Gestiona recordatorios por WhatsApp y Email
 */

class RemindersManager {
  constructor() {
    try {
      console.log('🔔 Construyendo RemindersManager...');
      
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
      
      console.log('📋 Cargando configuración...');
      this.loadConfig();
      
      console.log('📋 Cargando recordatorios enviados...');
      this.loadSentReminders();
      
      console.log('🔧 Inicializando servicios...');
      this.initializeServices();
      
      console.log('⏰ Iniciando programador...');
      this.startReminderScheduler();
      
      // Inicializar UI cuando el DOM esté listo
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this.updateUI();
          this.loadExistingProducts();
        });
      } else {
        setTimeout(() => {
          this.updateUI();
          this.loadExistingProducts();
        }, 100);
      }
      
      console.log('✅ RemindersManager construido correctamente');
    } catch (error) {
      console.error('❌ Error en constructor de RemindersManager:', error);
      throw error;
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

        // Inicializar EmailJS con la Public Key
        emailjs.init(config.emailJS.publicKey);
        
        console.log('✅ EmailJS inicializado correctamente');
        console.log('🔧 Configuración:', {
          publicKey: config.emailJS.publicKey.substring(0, 8) + '...',
          serviceId: config.emailJS.serviceId,
          templateId: config.emailJS.templateId
        });
      } catch (error) {
        console.warn('⚠️ Error inicializando EmailJS:', error.message);
      }
    } else {
      console.warn('⚠️ EmailJS no disponible - librería no cargada');
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

  // Iniciar el programador de recordatorios
  startReminderScheduler() {
    try {
      console.log('🕐 Iniciando programador de recordatorios...');
      
      // Limpiar intervalo anterior si existe
      if (this.checkInterval) {
        clearInterval(this.checkInterval);
      }
      
      // Verificar recordatorios cada hora
      this.checkInterval = setInterval(() => {
        try {
          this.checkPendingReminders();
        } catch (error) {
          console.error('❌ Error en verificación automática:', error);
        }
      }, 60 * 60 * 1000); // 1 hora
      
      // Verificación inicial después de 5 segundos (dar tiempo a que cargue todo)
      setTimeout(() => {
        try {
          this.checkPendingReminders();
        } catch (error) {
          console.error('❌ Error en verificación inicial:', error);
        }
      }, 5000);
      
      console.log('✅ Programador de recordatorios iniciado');
    } catch (error) {
      console.error('❌ Error iniciando programador de recordatorios:', error);
    }
  }

  // Detener el programador de recordatorios
  stopReminderScheduler() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('🛑 Programador de recordatorios detenido');
    }
  }

  // Verificar recordatorios pendientes
  async checkPendingReminders() {
    if (this.reminders.length === 0) {
      console.log('📭 No hay recordatorios para verificar');
      return;
    }

    const today = new Date();
    const todayStr = today.toDateString();
    
    console.log(`🔍 Verificando ${this.reminders.length} recordatorios para ${todayStr}...`);
    
    let pendingReminders = 0;
    
    for (const reminder of this.reminders) {
      const reminderDate = new Date(reminder.reminderDate);
      const reminderStr = reminderDate.toDateString();
      
      // Si es hoy y no se ha enviado ya
      if (reminderStr === todayStr && !this.sentReminders.has(reminder.id)) {
        console.log(`📅 Recordatorio pendiente para: ${reminder.product}`);
        
        // Solo enviar email por ahora
        if (reminder.type === 'email' && this.config.email.enabled) {
          try {
            await this.sendEmailReminder(reminder);
            this.sentReminders.add(reminder.id);
            this.saveSentReminders();
            console.log(`✅ Email enviado para: ${reminder.product}`);
          } catch (error) {
            console.error(`❌ Error enviando email para ${reminder.product}:`, error);
          }
        }
        
        pendingReminders++;
      }
    }
    
    if (pendingReminders === 0) {
      console.log('✅ No hay recordatorios pendientes para hoy');
    } else {
      console.log(`📤 Se procesaron ${pendingReminders} recordatorios pendientes`);
    }
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

    // Obtener todas las cuotas del producto
    const productInstallments = this.getProductInstallments(reminder.product);
    
    // Generar lista detallada de cuotas
    const installmentsList = this.generateInstallmentsList(productInstallments, reminder);
    
    // Calcular totales
    const totalPending = productInstallments.filter(inst => inst.isPending).length;
    const totalPaid = productInstallments.length - totalPending;
    const totalAmount = productInstallments.reduce((sum, inst) => sum + inst.amount, 0);
    const pendingAmount = productInstallments.filter(inst => inst.isPending).reduce((sum, inst) => sum + inst.amount, 0);

    const templateParams = {
      to_email: this.config.email.address,
      to: this.config.email.address,
      user_email: this.config.email.address,
      recipient_email: this.config.email.address,
      user_name: this.config.email.address.split('@')[0], // Usar la parte antes del @ como nombre
      to_name: this.config.email.address.split('@')[0],
      from_name: 'Calculadora de Cuotas',
      reply_to: this.config.email.address,
      product_name: reminder.product,
      payment_amount: Math.round(reminder.amount).toLocaleString('es-ES'),
      payment_date: reminder.paymentDate.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      installment_current: reminder.installment,
      installment_total: reminder.totalInstallments,
      days_ahead: this.config.email.daysAhead,
      
      // Información detallada adicional
      installments_list: installmentsList,
      total_installments: productInstallments.length,
      paid_installments: totalPaid,
      pending_installments: totalPending,
      total_amount: Math.round(totalAmount).toLocaleString('es-ES'),
      pending_amount: Math.round(pendingAmount).toLocaleString('es-ES'),
      
      // Fecha de generación del correo
      email_date: new Date().toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    try {
      // Verificar que EmailJS esté disponible
      if (typeof emailjs === 'undefined') {
        throw new Error('EmailJS no está disponible. Verifica que la librería esté cargada.');
      }

      // Verificar configuración
      if (!this.config.email.serviceId || !this.config.email.templateId) {
        throw new Error('Configuración de email incompleta. Verifica serviceId y templateId.');
      }

      console.log('📧 Enviando email con configuración:', {
        serviceId: this.config.email.serviceId,
        templateId: this.config.email.templateId,
        to_email: templateParams.to_email
      });

      const response = await emailjs.send(
        this.config.email.serviceId,
        this.config.email.templateId,
        templateParams
      );
      
      console.log('✅ Email enviado correctamente:', response);
      console.log('📧 Contenido del email:', templateParams);
      
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

  // Método para probar el envío de email con datos de muestra
  async testEmailSending() {
    if (!this.config.email.enabled || !this.config.email.address) {
      throw new Error('Email no configurado. Primero configura tu email en la sección de recordatorios.');
    }
    
    console.log('🧪 Probando envío de email...');
    
    // Crear datos de prueba
    const testReminder = {
      product: 'Producto de Prueba',
      amount: 150000,
      paymentDate: new Date(),
      installment: 3,
      totalInstallments: 12,
      id: 'test-' + Date.now(),
      type: 'email'
    };
    
    try {
      const result = await this.sendEmailReminder(testReminder);
      console.log('✅ Email de prueba enviado exitosamente');
      
      if (window.app && typeof window.app.showNotification === 'function') {
        window.app.showNotification(
          'success', 
          'Email de prueba enviado', 
          `Se envió un email de prueba a ${this.config.email.address}`
        );
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error enviando email de prueba:', error);
      
      if (window.app && typeof window.app.showNotification === 'function') {
        window.app.showNotification(
          'error', 
          'Error en email de prueba', 
          error.message
        );
      }
      
      throw error;
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
        
        // Mostrar notificación usando el sistema de la app principal
        if (window.app && typeof window.app.showNotification === 'function') {
          window.app.showNotification(
            'warning', 
            'Recordatorio eliminado', 
            `Se eliminó el recordatorio de "${reminderToDelete.product}" para el ${reminderToDelete.reminderDate.toLocaleDateString('es-ES')}`
          );
        }
        
        return true;
      }
    }
    return false;
  }

  // Eliminar todos los recordatorios
  deleteAllReminders() {
    const count = this.reminders.length;
    this.reminders = [];
    this.sentReminders.clear();
    this.saveSentReminders();
    this.updateUI();
    
    // Mostrar notificación usando el sistema de la app principal
    if (window.app && typeof window.app.showNotification === 'function') {
      window.app.showNotification(
        'warning', 
        'Recordatorios eliminados', 
        `Se eliminaron ${count} recordatorios correctamente`
      );
    }
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

  // Obtener todas las cuotas de un producto específico
  getProductInstallments(productName) {
    // Buscar el producto en los datos almacenados
    const products = JSON.parse(localStorage.getItem('calculadora-productos') || '[]');
    const product = products.find(p => p.name === productName);
    
    if (!product) {
      return [];
    }
    
    const installments = [];
    const startDate = new Date(product.startDate);
    const today = new Date();
    
    for (let i = 0; i < product.installments; i++) {
      const paymentDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, startDate.getDate());
      const isPending = paymentDate >= today;
      const isToday = paymentDate.toDateString() === today.toDateString();
      const isOverdue = paymentDate < today && !isToday;
      
      installments.push({
        number: i + 1,
        amount: product.monthlyPayment,
        paymentDate: paymentDate,
        isPending: isPending,
        isToday: isToday,
        isOverdue: isOverdue,
        status: isOverdue ? 'vencida' : isPending ? 'pendiente' : 'pagada'
      });
    }
    
    return installments;
  }

  // Generar lista formateada de cuotas para el email
  generateInstallmentsList(installments, currentReminder) {
    if (installments.length === 0) {
      return 'No se encontraron cuotas para este producto.';
    }
    
    let list = '';
    
    // Agregar cuotas vencidas primero (si las hay)
    const overdueInstallments = installments.filter(inst => inst.isOverdue);
    if (overdueInstallments.length > 0) {
      list += '🚨 CUOTAS VENCIDAS:\n';
      overdueInstallments.forEach(inst => {
        list += `   • Cuota ${inst.number}: $${Math.round(inst.amount).toLocaleString('es-ES')} - Fecha: ${inst.paymentDate.toLocaleDateString('es-ES')} ⚠️\n`;
      });
      list += '\n';
    }
    
    // Agregar cuota actual (la del recordatorio)
    const todayInstallments = installments.filter(inst => inst.isToday);
    if (todayInstallments.length > 0) {
      list += '📅 CUOTA DE HOY:\n';
      todayInstallments.forEach(inst => {
        list += `   • Cuota ${inst.number}: $${Math.round(inst.amount).toLocaleString('es-ES')} - HOY ${inst.paymentDate.toLocaleDateString('es-ES')} 🔔\n`;
      });
      list += '\n';
    }
    
    // Agregar próximas cuotas pendientes
    const futureInstallments = installments.filter(inst => inst.isPending && !inst.isToday);
    if (futureInstallments.length > 0) {
      list += '📋 PRÓXIMAS CUOTAS:\n';
      futureInstallments.slice(0, 5).forEach(inst => { // Mostrar máximo 5 próximas
        list += `   • Cuota ${inst.number}: $${Math.round(inst.amount).toLocaleString('es-ES')} - ${inst.paymentDate.toLocaleDateString('es-ES')}\n`;
      });
      
      if (futureInstallments.length > 5) {
        list += `   ... y ${futureInstallments.length - 5} cuotas más\n`;
      }
      list += '\n';
    }
    
    // Agregar resumen
    const totalPending = installments.filter(inst => inst.isPending).length;
    const totalPaid = installments.length - totalPending;
    const pendingAmount = installments.filter(inst => inst.isPending).reduce((sum, inst) => sum + inst.amount, 0);
    
    list += '📊 RESUMEN:\n';
    list += `   • Cuotas pagadas: ${totalPaid}/${installments.length}\n`;
    list += `   • Cuotas pendientes: ${totalPending}/${installments.length}\n`;
    list += `   • Monto pendiente total: $${Math.round(pendingAmount).toLocaleString('es-ES')}\n`;
    
    return list;
  }

  // Enviar reporte completo por email
  async sendFullReportEmail() {
    if (!this.config.email.enabled || !this.config.email.address) {
      throw new Error('Email no configurado. Primero configura tu email en la sección de recordatorios.');
    }
    
    console.log('📊 Generando reporte completo por email...');
    
    // Obtener todos los productos
    const products = JSON.parse(localStorage.getItem('calculadora-productos') || '[]');
    
    if (products.length === 0) {
      throw new Error('No hay productos registrados para incluir en el reporte.');
    }
    
    // Generar estadísticas generales
    const totalProducts = products.length;
    const totalValue = products.reduce((sum, p) => sum + p.totalValue, 0);
    const totalMonthlyPayments = products.reduce((sum, p) => sum + p.monthlyPayment, 0);
    const averageProductValue = totalValue / totalProducts;
    
    // Generar reporte detallado por producto
    const productsReport = this.generateProductsDetailReport(products);
    
    // Generar cronograma completo de pagos
    const paymentsSchedule = this.generateFullPaymentsSchedule(products);
    
    // Generar resumen de próximos 6 meses
    const nextSixMonthsSummary = this.generateNextMonthsSummary(products, 6);
    
    // Preparar datos para el email
    const templateParams = {
      to_email: this.config.email.address,
      user_name: this.config.email.address.split('@')[0],
      report_type: 'Reporte Completo de Productos y Cuotas',
      
      // Estadísticas generales
      total_products: totalProducts,
      total_value: Math.round(totalValue).toLocaleString('es-ES'),
      total_monthly: Math.round(totalMonthlyPayments).toLocaleString('es-ES'),
      average_product_value: Math.round(averageProductValue).toLocaleString('es-ES'),
      
      // Reportes detallados
      products_report: productsReport,
      payments_schedule: paymentsSchedule,
      next_months_summary: nextSixMonthsSummary,
      
      // Fecha de generación
      report_date: new Date().toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      
      // Información adicional
      total_installments_pending: this.getTotalPendingInstallments(products),
      next_payment_date: this.getNextPaymentDate(products)
    };
    
    try {
      const response = await emailjs.send(
        this.config.email.serviceId,
        this.config.email.templateId,
        templateParams
      );
      
      console.log('✅ Reporte completo enviado correctamente:', response);
      console.log('📧 Contenido del reporte:', templateParams);
      
      return true;
    } catch (error) {
      console.error('❌ Error enviando reporte completo:', error);
      throw new Error('Error enviando reporte completo: ' + (error.message || 'Error desconocido'));
    }
  }

  // Generar reporte detallado de todos los productos
  generateProductsDetailReport(products) {
    let report = '📦 PRODUCTOS REGISTRADOS:\n\n';
    
    products.forEach((product, index) => {
      const startDate = new Date(product.startDate);
      const endDate = new Date(product.endDate);
      const today = new Date();
      
      // Calcular progreso
      const totalDuration = endDate.getTime() - startDate.getTime();
      const elapsed = today.getTime() - startDate.getTime();
      const progress = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
      
      // Calcular cuotas pagadas/pendientes
      const monthsElapsed = Math.max(0, Math.floor((today - startDate) / (30.44 * 24 * 60 * 60 * 1000)));
      const installmentsPaid = Math.min(monthsElapsed, product.installments);
      const installmentsPending = product.installments - installmentsPaid;
      
      report += `${index + 1}. ${product.name}\n`;
      report += `   💰 Valor Total: $${Math.round(product.totalValue).toLocaleString('es-ES')}\n`;
      report += `   📅 Periodo: ${startDate.toLocaleDateString('es-ES')} - ${endDate.toLocaleDateString('es-ES')}\n`;
      report += `   💳 Cuota Mensual: $${Math.round(product.monthlyPayment).toLocaleString('es-ES')}\n`;
      report += `   📊 Progreso: ${Math.round(progress)}% completado\n`;
      report += `   ✅ Cuotas pagadas: ${installmentsPaid}/${product.installments}\n`;
      report += `   ⏳ Cuotas pendientes: ${installmentsPending}\n`;
      report += `   💵 Monto pendiente: $${Math.round(installmentsPending * product.monthlyPayment).toLocaleString('es-ES')}\n\n`;
    });
    
    return report;
  }

  // Generar cronograma completo de pagos
  generateFullPaymentsSchedule(products) {
    const allPayments = [];
    
    // Recopilar todos los pagos de todos los productos
    products.forEach(product => {
      const startDate = new Date(product.startDate);
      
      for (let i = 0; i < product.installments; i++) {
        const paymentDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, startDate.getDate());
        allPayments.push({
          date: paymentDate,
          product: product.name,
          amount: product.monthlyPayment,
          installment: i + 1,
          totalInstallments: product.installments
        });
      }
    });
    
    // Ordenar por fecha
    allPayments.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Generar reporte
    let schedule = '📅 CRONOGRAMA COMPLETO DE PAGOS:\n\n';
    const today = new Date();
    
    // Mostrar solo los próximos 12 pagos
    const upcomingPayments = allPayments.filter(payment => payment.date >= today).slice(0, 12);
    
    if (upcomingPayments.length === 0) {
      schedule += 'No hay pagos pendientes.\n';
    } else {
      upcomingPayments.forEach((payment, index) => {
        const daysUntil = Math.ceil((payment.date.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
        const status = daysUntil <= 3 ? '🔴' : daysUntil <= 7 ? '🟡' : '🟢';
        
        schedule += `${status} ${payment.date.toLocaleDateString('es-ES')} - `;
        schedule += `${payment.product} - `;
        schedule += `$${Math.round(payment.amount).toLocaleString('es-ES')} `;
        schedule += `(Cuota ${payment.installment}/${payment.totalInstallments})`;
        
        if (daysUntil <= 3) {
          schedule += ` ⚠️ Próximo a vencer`;
        } else if (daysUntil <= 7) {
          schedule += ` ⏰ Esta semana`;
        }
        
        schedule += '\n';
      });
      
      if (allPayments.filter(p => p.date >= today).length > 12) {
        schedule += `\n... y ${allPayments.filter(p => p.date >= today).length - 12} pagos adicionales\n`;
      }
    }
    
    return schedule;
  }

  // Generar resumen de próximos meses
  generateNextMonthsSummary(products, months = 6) {
    let summary = `📊 RESUMEN PRÓXIMOS ${months} MESES:\n\n`;
    const today = new Date();
    
    for (let i = 0; i < months; i++) {
      const month = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const monthName = month.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
      
      // Calcular pagos para este mes
      let monthlyTotal = 0;
      let paymentsCount = 0;
      const monthPayments = [];
      
      products.forEach(product => {
        const startDate = new Date(product.startDate);
        const endDate = new Date(product.endDate);
        
        if (month >= startDate && month <= endDate) {
          monthlyTotal += product.monthlyPayment;
          paymentsCount++;
          monthPayments.push(`  • ${product.name}: $${Math.round(product.monthlyPayment).toLocaleString('es-ES')}`);
        }
      });
      
      summary += `📅 ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}:\n`;
      if (paymentsCount > 0) {
        summary += `   💰 Total a pagar: $${Math.round(monthlyTotal).toLocaleString('es-ES')}\n`;
        summary += `   📦 Productos activos: ${paymentsCount}\n`;
        if (monthPayments.length <= 5) {
          summary += monthPayments.join('\n') + '\n';
        } else {
          summary += monthPayments.slice(0, 3).join('\n') + '\n';
          summary += `   ... y ${monthPayments.length - 3} productos más\n`;
        }
      } else {
        summary += `   ✅ Sin pagos programados\n`;
      }
      summary += '\n';
    }
    
    return summary;
  }

  // Obtener total de cuotas pendientes
  getTotalPendingInstallments(products) {
    const today = new Date();
    let totalPending = 0;
    
    products.forEach(product => {
      const startDate = new Date(product.startDate);
      const monthsElapsed = Math.max(0, Math.floor((today - startDate) / (30.44 * 24 * 60 * 60 * 1000)));
      const installmentsPending = Math.max(0, product.installments - monthsElapsed);
      totalPending += installmentsPending;
    });
    
    return totalPending;
  }

  // Obtener próxima fecha de pago
  getNextPaymentDate(products) {
    const today = new Date();
    let nextDate = null;
    
    products.forEach(product => {
      const startDate = new Date(product.startDate);
      
      for (let i = 0; i < product.installments; i++) {
        const paymentDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, startDate.getDate());
        
        if (paymentDate >= today) {
          if (!nextDate || paymentDate < nextDate) {
            nextDate = paymentDate;
          }
          break;
        }
      }
    });
    
    return nextDate ? nextDate.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }) : 'No hay pagos pendientes';
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
      if (!deleted) {
        // Solo mostrar error si falló (el éxito ya se muestra en deleteReminder)
        if (window.app && typeof window.app.showNotification === 'function') {
          window.app.showNotification('error', 'Error', 'No se pudo eliminar el recordatorio');
        } else {
          alert('❌ Error eliminando el recordatorio');
        }
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
      if (window.app && typeof window.app.showNotification === 'function') {
        window.app.showNotification('error', 'Error', 'No se pudo inicializar el sistema de recordatorios');
      } else {
        alert('❌ Error: No se pudo inicializar el sistema de recordatorios');
      }
      console.error('Error:', error);
      return;
    }
  }
  
  const upcoming = window.remindersManager.getUpcomingReminders();
  if (upcoming.length === 0) {
    if (window.app && typeof window.app.showNotification === 'function') {
      window.app.showNotification('info', 'Sin recordatorios', 'No hay recordatorios para eliminar');
    } else {
      alert('ℹ️ No hay recordatorios para eliminar');
    }
    return;
  }
  
  if (confirm(`¿Eliminar TODOS los recordatorios pendientes?\n\nSe eliminarán ${upcoming.length} recordatorio(s).\nEsta acción no se puede deshacer.`)) {
    window.remindersManager.deleteAllReminders();
    // La notificación ya se muestra en deleteAllReminders()
  }
};

// Función global para probar envío de email
window.testEmailReminder = async function() {
  console.log('🧪 Iniciando prueba de email...');
  
  // Verificar que EmailJS esté disponible
  if (typeof emailjs === 'undefined') {
    const errorMsg = 'EmailJS no está disponible. Verifica que la librería esté cargada.';
    console.error('❌', errorMsg);
    alert('❌ ' + errorMsg);
    return;
  }
  
  // Verificar configuración
  if (typeof window.SERVICES_CONFIG === 'undefined') {
    const errorMsg = 'Configuración de servicios no encontrada. Verifica que services.js esté cargado.';
    console.error('❌', errorMsg);
    alert('❌ ' + errorMsg);
    return;
  }
  
  console.log('🔧 EmailJS disponible:', typeof emailjs);
  console.log('🔧 Configuración disponible:', window.SERVICES_CONFIG);
  
  if (!window.remindersManager) {
    try {
      window.remindersManager = new RemindersManager();
    } catch (error) {
      if (window.app && typeof window.app.showNotification === 'function') {
        window.app.showNotification('error', 'Error', 'No se pudo inicializar el sistema de recordatorios');
      } else {
        alert('❌ Error: No se pudo inicializar el sistema de recordatorios');
      }
      return;
    }
  }
  
  try {
    await window.remindersManager.testEmailSending();
  } catch (error) {
    console.error('Error probando email:', error);
  }
};

// Función global para enviar recordatorios manualmente
window.sendManualReminder = async function(productName) {
  if (!window.remindersManager) {
    try {
      window.remindersManager = new RemindersManager();
    } catch (error) {
      console.error('Error inicializando recordatorios:', error);
      return;
    }
  }
  
  if (!productName) {
    console.log('📋 Productos disponibles:');
    const products = JSON.parse(localStorage.getItem('calculadora-productos') || '[]');
    products.forEach((p, index) => {
      console.log(`${index + 1}. ${p.name}`);
    });
    console.log('💡 Uso: sendManualReminder("Nombre del Producto")');
    return;
  }
  
  const reminders = window.remindersManager.reminders.filter(r => r.product === productName);
  if (reminders.length === 0) {
    console.log(`❌ No se encontraron recordatorios para "${productName}"`);
    return;
  }
  
  console.log(`📤 Enviando recordatorio para "${productName}"...`);
  
  try {
    // Enviar el primer recordatorio pendiente del producto
    const pendingReminder = reminders.find(r => {
      const today = new Date();
      const reminderDate = new Date(r.reminderDate);
      return reminderDate <= today && !window.remindersManager.sentReminders.has(r.id);
    });
    
    if (pendingReminder) {
      await window.remindersManager.sendEmailReminder(pendingReminder);
      window.remindersManager.sentReminders.add(pendingReminder.id);
      window.remindersManager.saveSentReminders();
      console.log('✅ Recordatorio enviado exitosamente');
    } else {
      console.log('ℹ️ No hay recordatorios pendientes para enviar hoy');
    }
  } catch (error) {
    console.error('❌ Error enviando recordatorio:', error);
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
