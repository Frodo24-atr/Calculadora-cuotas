/**
 * Módulo de Recordatorios
 * Gestiona recordatorios por WhatsApp, Email y Google Calendar
 */

class RemindersManager {
  constructor() {
    this.config = {
      whatsapp: {
        enabled: false,
        number: '',
        daysAhead: 3
      },
      email: {
        enabled: false,
        address: '',
        daysAhead: 3,
        serviceId: '', // EmailJS Service ID
        templateId: '', // EmailJS Template ID
        publicKey: '' // EmailJS Public Key
      },
      calendar: {
        enabled: false,
        email: '',
        type: 'event'
      }
    };
    
    this.reminders = [];
    this.sentReminders = new Set(); // Para evitar enviar duplicados
    this.checkInterval = null; // Intervalo de verificación
    this.loadConfig();
    this.loadSentReminders();
    this.initializeServices();
    this.startReminderScheduler();
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

    // Inicializar Google API
    await this.initGoogleAPI();
  }

  // Inicializar Google Calendar API
  async initGoogleAPI() {
    if (typeof gapi === 'undefined') {
      console.warn('⚠️ Google API no disponible');
      return false;
    }

    if (typeof window.SERVICES_CONFIG === 'undefined') {
      console.warn('⚠️ Configuración de Google no encontrada');
      return false;
    }

    const config = window.SERVICES_CONFIG.googleCalendar;

    // Verificar que las claves estén configuradas
    if (!config.apiKey || !config.clientId) {
      console.warn('⚠️ API Key o Client ID de Google no configurados');
      return false;
    }

    // Verificar si estamos en localhost o archivo local
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isFile = window.location.protocol === 'file:';
    
    if (isLocalhost || isFile) {
      console.warn('⚠️ Google Calendar no funciona desde localhost o archivos locales por restricciones de seguridad');
      console.warn('📝 Para usar Google Calendar necesitas:');
      console.warn('   1. Un dominio público (ej: mi-app.github.io)');
      console.warn('   2. Registrar ese dominio en Google Cloud Console');
      console.warn('   3. Usar HTTPS');
      console.warn('💡 Recomendación: Usa WhatsApp o Email que funcionan perfectamente');
      return false;
    }

    try {
      console.log('🔄 Inicializando Google API...');
      
      await new Promise((resolve, reject) => {
        gapi.load('client:auth2', {
          callback: resolve,
          onerror: (error) => {
            console.error('Error cargando Google API:', error);
            reject(new Error('Error cargando Google API: ' + JSON.stringify(error)));
          }
        });
      });

      await gapi.client.init({
        apiKey: config.apiKey,
        clientId: config.clientId,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
        scope: config.scopes
      });

      console.log('✅ Google Calendar API inicializado correctamente');
      return true;
    } catch (error) {
      console.warn('⚠️ Error inicializando Google API:', error.message || error);
      
      // Mostrar mensaje específico basado en el error
      if (error.details && error.details.includes('Not a valid origin')) {
        console.warn('🚫 Origen no válido para Google Calendar. Esto es normal en desarrollo local.');
        console.warn('📝 Para solucionarlo necesitas:');
        console.warn('   1. Ir a Google Cloud Console');
        console.warn('   2. Configurar "Orígenes autorizados"');
        console.warn('   3. Agregar tu dominio público');
      }
      
      return false;
    }
  }

  // Configurar recordatorio de WhatsApp
  setupWhatsApp(number, daysAhead) {
    if (!number || !number.trim()) {
      throw new Error('Número de WhatsApp requerido');
    }

    // Validar formato del número
    const cleanNumber = number.replace(/\s+/g, '').replace(/[^\d+]/g, '');
    if (!cleanNumber.startsWith('+') || cleanNumber.length < 10) {
      throw new Error('Formato de número inválido. Use el formato: +57 300 123 4567');
    }

    this.config.whatsapp = {
      enabled: true,
      number: cleanNumber,
      daysAhead: parseInt(daysAhead) || 3
    };

    this.saveConfig();
    return true;
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

  // Configurar Google Calendar
  async setupGoogleCalendar(email, type) {
    if (!email || !this.validateEmail(email)) {
      throw new Error('Email de Google requerido');
    }

    // Verificar si estamos en un entorno compatible
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isFile = window.location.protocol === 'file:';
    
    if (isLocalhost || isFile) {
      throw new Error(
        'Google Calendar no funciona desde localhost o archivos locales.\n\n' +
        '📝 Para usar Google Calendar necesitas:\n' +
        '• Un dominio público (ej: mi-app.github.io)\n' +
        '• Registrar ese dominio en Google Cloud Console\n' +
        '• Usar HTTPS\n\n' +
        '💡 Usa WhatsApp o Email que funcionan perfectamente'
      );
    }

    try {
      // Verificar que Google API esté disponible
      if (typeof gapi === 'undefined') {
        throw new Error('Google API no está disponible. Verifica tu conexión a internet.');
      }

      // Verificar configuración
      if (typeof window.SERVICES_CONFIG === 'undefined') {
        throw new Error('Configuración de servicios no encontrada. Revisa el archivo config/services.js');
      }

      const config = window.SERVICES_CONFIG.googleCalendar;
      
      // Verificar que las claves estén configuradas
      if (!config.clientId || !config.apiKey) {
        throw new Error('Configuración de Google Calendar incompleta. Verifica clientId y apiKey en config/services.js');
      }

      // Reinicializar Google API si es necesario
      const initialized = await this.initGoogleAPI();
      if (!initialized) {
        throw new Error('No se pudo inicializar Google Calendar API');
      }

      // Verificar que auth2 esté disponible
      if (typeof gapi.auth2 === 'undefined' || !gapi.auth2.getAuthInstance()) {
        throw new Error('Google Auth no se pudo inicializar. Verifica tu configuración de API.');
      }

      // Autenticar con Google
      const authInstance = gapi.auth2.getAuthInstance();
      
      if (!authInstance.isSignedIn.get()) {
        console.log('🔐 Iniciando autenticación con Google...');
        await authInstance.signIn();
      }

      // Verificar que el usuario esté autenticado
      if (!authInstance.isSignedIn.get()) {
        throw new Error('No se pudo autenticar con Google. Por favor intenta de nuevo.');
      }

      this.config.calendar = {
        enabled: true,
        email: email,
        type: type || 'event'
      };

      this.saveConfig();
      console.log('✅ Google Calendar configurado correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error configurando Google Calendar:', error);
      throw new Error('Error al conectar con Google Calendar: ' + error.message);
    }
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
        
        // Crear recordatorios según la configuración
        if (this.config.whatsapp.enabled) {
          const reminderDate = new Date(paymentDate);
          reminderDate.setDate(reminderDate.getDate() - this.config.whatsapp.daysAhead);
          
          this.reminders.push({
            type: 'whatsapp',
            product: product.name,
            paymentDate: paymentDate,
            reminderDate: reminderDate,
            amount: product.monthlyPayment,
            installment: i + 1,
            totalInstallments: product.installments
          });
        }

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

        if (this.config.calendar.enabled) {
          this.reminders.push({
            type: 'calendar',
            product: product.name,
            paymentDate: paymentDate,
            reminderDate: paymentDate, // Los eventos van en la fecha exacta
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

  // Crear evento en Google Calendar
  async createCalendarEvent(reminder) {
    try {
      const event = {
        summary: `💰 Pago: ${reminder.product}`,
        description: `Cuota ${reminder.installment}/${reminder.totalInstallments}\nMonto: $${Math.round(reminder.amount).toLocaleString('es-ES')}`,
        start: {
          date: reminder.paymentDate.toISOString().split('T')[0]
        },
        end: {
          date: reminder.paymentDate.toISOString().split('T')[0]
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 día antes
            { method: 'popup', minutes: 60 } // 1 hora antes
          ]
        }
      };

      const response = await gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: event
      });

      return response.result;
    } catch (error) {
      throw new Error('Error creando evento en calendario: ' + error.message);
    }
  }

  // Crear todos los eventos de calendario
  async createAllCalendarEvents() {
    const calendarReminders = this.reminders.filter(r => r.type === 'calendar');
    const results = [];

    for (const reminder of calendarReminders) {
      try {
        const event = await this.createCalendarEvent(reminder);
        results.push({ success: true, reminder, event });
      } catch (error) {
        results.push({ success: false, reminder, error: error.message });
      }
    }

    return results;
  }

  // Obtener próximos recordatorios
  getUpcomingReminders(limit = 5) {
    const now = new Date();
    return this.reminders
      .filter(r => r.reminderDate >= now)
      .slice(0, limit);
  }

  // Actualizar UI
  updateUI() {
    // Actualizar estado de los servicios
    document.getElementById('whatsappStatus').textContent = 
      this.config.whatsapp.enabled ? `Activo (${this.config.whatsapp.number})` : 'No configurado';
    document.getElementById('whatsappStatus').className = 
      `status-text ${this.config.whatsapp.enabled ? 'active' : ''}`;

    document.getElementById('emailStatus').textContent = 
      this.config.email.enabled ? `Activo (${this.config.email.address})` : 'No configurado';
    document.getElementById('emailStatus').className = 
      `status-text ${this.config.email.enabled ? 'active' : ''}`;

    document.getElementById('calendarStatus').textContent = 
      this.config.calendar.enabled ? `Conectado (${this.config.calendar.email})` : 'No configurado';
    document.getElementById('calendarStatus').className = 
      `status-text ${this.config.calendar.enabled ? 'active' : ''}`;

    // Mostrar advertencia de CORS para email si es necesario
    const emailWarning = document.getElementById('emailWarning');
    if (emailWarning && window.location.protocol === 'file:') {
      emailWarning.style.display = 'block';
    }

    // Actualizar próximos recordatorios
    this.updateNextReminders();
  }

  // Actualizar lista de próximos recordatorios
  updateNextReminders() {
    const container = document.getElementById('nextReminders');
    const upcoming = this.getUpcomingReminders();

    if (upcoming.length === 0) {
      container.innerHTML = '<p>No hay recordatorios programados</p>';
      return;
    }

    const html = upcoming.map(reminder => `
      <div class="reminder-item">
        <div>
          <div class="reminder-product">${reminder.product}</div>
          <div class="reminder-date">
            ${reminder.reminderDate.toLocaleDateString('es-ES')} - 
            $${Math.round(reminder.amount).toLocaleString('es-ES')}
          </div>
        </div>
        <div class="reminder-methods">
          <div class="reminder-method ${reminder.type}">
            ${reminder.type === 'whatsapp' ? '💬' : reminder.type === 'email' ? '📧' : '📅'}
          </div>
        </div>
      </div>
    `).join('');

    container.innerHTML = html;
  }

  // Mostrar/ocultar sección de recordatorios
  toggleSection(show) {
    const section = document.getElementById('recordatoriosSection');
    section.style.display = show ? 'block' : 'none';
  }

  // Iniciar el programador de recordatorios
  startReminderScheduler() {
    // Verificar cada hora si hay recordatorios pendientes
    this.checkInterval = setInterval(() => {
      this.checkPendingReminders();
    }, 60 * 60 * 1000); // Cada hora

    // También verificar inmediatamente
    setTimeout(() => {
      this.checkPendingReminders();
    }, 5000); // 5 segundos después de cargar

    console.log('📅 Programador de recordatorios iniciado');
  }

  // Verificar recordatorios pendientes
  async checkPendingReminders() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    for (const reminder of this.reminders) {
      const reminderDate = new Date(
        reminder.reminderDate.getFullYear(),
        reminder.reminderDate.getMonth(),
        reminder.reminderDate.getDate()
      );

      // Crear ID único para el recordatorio
      const reminderId = `${reminder.type}_${reminder.product}_${reminder.installment}_${reminderDate.getTime()}`;

      // Si es hoy o ya pasó y no se ha enviado
      if (reminderDate <= today && !this.sentReminders.has(reminderId)) {
        try {
          await this.sendScheduledReminder(reminder, reminderId);
          console.log(`✅ Recordatorio enviado: ${reminder.product} - ${reminder.type}`);
        } catch (error) {
          console.error(`❌ Error enviando recordatorio: ${error.message}`);
        }
      }
    }
  }

  // Enviar recordatorio programado
  async sendScheduledReminder(reminder, reminderId) {
    try {
      switch (reminder.type) {
        case 'whatsapp':
          await this.sendWhatsAppReminder(reminder);
          break;
        case 'email':
          await this.sendEmailReminder(reminder);
          break;
        case 'calendar':
          // Los eventos de calendario se crean una sola vez
          break;
      }

      // Marcar como enviado solo si no hubo errores
      this.sentReminders.add(reminderId);
      this.saveSentReminders();
      
    } catch (error) {
      console.error(`❌ Error enviando recordatorio ${reminder.type}:`, error.message);
      
      // Si falla el email, intentar con WhatsApp como respaldo (si está configurado)
      if (reminder.type === 'email' && this.config.whatsapp.enabled) {
        console.log('📱 Intentando enviar por WhatsApp como respaldo...');
        try {
          await this.sendWhatsAppReminder(reminder);
          this.sentReminders.add(reminderId);
          this.saveSentReminders();
        } catch (whatsappError) {
          console.error('❌ También falló WhatsApp:', whatsappError.message);
          throw error; // Lanzar el error original del email
        }
      } else {
        throw error;
      }
    }
  }

  // Verificar y enviar recordatorios pendientes
  async checkAndSendReminders() {
    const now = new Date();
    const pendingReminders = this.reminders.filter(reminder => {
      return reminder.reminderDate <= now && !this.sentReminders.has(reminder.reminderDate.getTime());
    });

    for (const reminder of pendingReminders) {
      try {
        if (reminder.type === 'whatsapp') {
          await this.sendWhatsAppReminder(reminder);
        } else if (reminder.type === 'email') {
          await this.sendEmailReminder(reminder);
        } else if (reminder.type === 'calendar') {
          await this.createCalendarEvent(reminder);
        }

        // Marcar como enviado
        this.sentReminders.add(reminder.reminderDate.getTime());
      } catch (error) {
        console.error('Error enviando recordatorio:', error.message);
      }
    }
  }
}

// Instancia global
let remindersManager;

// Funciones globales para los botones
window.setupWhatsAppReminder = async function() {
  const number = document.getElementById('whatsappNumber').value;
  const days = document.getElementById('whatsappDays').value;

  try {
    if (!window.remindersManager) {
      throw new Error('Sistema de recordatorios no inicializado');
    }
    await window.remindersManager.setupWhatsApp(number, days);
    
    // Regenerar recordatorios si hay productos
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    if (products.length > 0) {
      window.remindersManager.generateReminders(products);
    }
    
    alert('✅ Recordatorios de WhatsApp configurados correctamente');
  } catch (error) {
    alert('❌ Error: ' + error.message);
  }
};

window.setupEmailReminder = async function() {
  const email = document.getElementById('emailAddress').value;
  const days = document.getElementById('emailDays').value;

  try {
    if (!window.remindersManager) {
      throw new Error('Sistema de recordatorios no inicializado');
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

window.setupCalendarReminder = async function() {
  const email = document.getElementById('googleEmail').value;
  const type = document.getElementById('calendarType').value;

  try {
    if (!window.remindersManager) {
      throw new Error('Sistema de recordatorios no inicializado');
    }
    
    // Verificar primero si Google API está disponible
    if (typeof gapi === 'undefined') {
      throw new Error('Google API no está disponible. Verifica tu conexión a internet y recarga la página.');
    }
    
    await window.remindersManager.setupGoogleCalendar(email, type);
    alert('✅ Google Calendar conectado correctamente');
    
    // Crear eventos automáticamente si hay productos
    if (window.remindersManager.reminders.length > 0) {
      const results = await window.remindersManager.createAllCalendarEvents();
      const successful = results.filter(r => r.success).length;
      alert(`📅 Se crearon ${successful} eventos en tu calendario`);
    }
  } catch (error) {
    console.error('❌ Error Google Calendar:', error);
    
    // Mensaje más informativo basado en el tipo de error
    let message = '❌ Error conectando con Google Calendar:\n\n';
    
    if (error.message.includes('API no está disponible')) {
      message += '• Google API no se pudo cargar\n• Verifica tu conexión a internet\n• Recarga la página e intenta de nuevo';
    } else if (error.message.includes('no se pudo inicializar')) {
      message += '• Las credenciales de Google pueden ser inválidas\n• Verifica tu API Key y Client ID en la configuración';
    } else if (error.message.includes('incompleta')) {
      message += '• Faltan credenciales de Google Calendar\n• Contacta al administrador para configurar las claves';
    } else {
      message += error.message;
    }
    
    message += '\n\n💡 Recomendación: Usa WhatsApp o Email como alternativa, funcionan perfectamente.';
    
    alert(message);
  }
};

// Función para probar recordatorios manualmente
window.testReminders = async function() {
  if (!window.remindersManager) {
    alert('❌ Sistema de recordatorios no inicializado');
    return;
  }
  
  console.log('🧪 Probando recordatorios...');
  await window.remindersManager.forceCheckReminders();
  alert('✅ Verificación de recordatorios completada. Revisa la consola para más detalles.');
};

// Función para probar Google Calendar específicamente
window.testGoogleCalendar = async function() {
  if (!window.remindersManager) {
    alert('❌ Sistema de recordatorios no inicializado');
    return;
  }
  
  try {
    console.log('🧪 Probando Google Calendar API...');
    
    // Verificar si estamos en un entorno compatible
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isFile = window.location.protocol === 'file:';
    
    if (isLocalhost || isFile) {
      alert(
        '⚠️ Google Calendar no funciona en desarrollo local\n\n' +
        '📝 Esto es normal. Google Calendar requiere:\n' +
        '• Un dominio público (no localhost)\n' +
        '• HTTPS\n' +
        '• Configuración en Google Cloud Console\n\n' +
        '✅ WhatsApp y Email funcionan perfectamente\n' +
        'Son la mejor opción para desarrollo y uso personal'
      );
      return;
    }
    
    // Verificar configuración
    if (typeof window.SERVICES_CONFIG === 'undefined') {
      throw new Error('Configuración de servicios no encontrada');
    }
    
    const config = window.SERVICES_CONFIG.googleCalendar;
    console.log('📋 Configuración Google:', {
      apiKey: config.apiKey ? '✅ Configurada' : '❌ Falta',
      clientId: config.clientId ? '✅ Configurada' : '❌ Falta',
      scopes: config.scopes
    });
    
    // Intentar inicializar
    const initialized = await window.remindersManager.initGoogleAPI();
    
    if (initialized) {
      alert('✅ Google Calendar API inicializada correctamente. Puedes intentar conectar.');
    } else {
      alert('❌ Error inicializando Google Calendar API. Revisa la consola para más detalles.');
    }
  } catch (error) {
    console.error('❌ Error probando Google Calendar:', error);
    alert('❌ Error: ' + error.message);
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
