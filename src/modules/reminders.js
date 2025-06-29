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
    this.loadConfig();
    this.initializeServices();
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
        emailjs.init({
          publicKey: config.emailJS.publicKey,
          blockHeadless: true,
          limitRate: {
            id: 'app',
            throttle: 10000,
          },
        });
        console.log('✅ EmailJS inicializado');
      } catch (error) {
        console.warn('⚠️ Error inicializando EmailJS:', error.message);
      }
    } else {
      console.warn('⚠️ EmailJS no disponible');
    }

    // Inicializar Google API
    await this.initGoogleAPI();
  }

  // Inicializar Google Calendar API
  async initGoogleAPI() {
    if (typeof gapi === 'undefined') {
      console.warn('⚠️ Google API no disponible');
      return;
    }

    if (typeof window.SERVICES_CONFIG === 'undefined') {
      console.warn('⚠️ Configuración de Google no encontrada');
      return;
    }

    const config = window.SERVICES_CONFIG.googleCalendar;

    try {
      await new Promise((resolve) => {
        gapi.load('client:auth2', resolve);
      });

      await gapi.client.init({
        apiKey: config.apiKey,
        clientId: config.clientId,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
        scope: config.scopes
      });

      console.log('✅ Google Calendar API inicializado');
    } catch (error) {
      console.warn('⚠️ Error inicializando Google API:', error.message);
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

    try {
      // Autenticar con Google
      const authInstance = gapi.auth2.getAuthInstance();
      if (!authInstance.isSignedIn.get()) {
        await authInstance.signIn();
      }

      this.config.calendar = {
        enabled: true,
        email: email,
        type: type || 'event'
      };

      this.saveConfig();
      return true;
    } catch (error) {
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
    this.updateUI();
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
    window.open(whatsappUrl, '_blank');
  }

  // Enviar recordatorio por email
  async sendEmailReminder(reminder) {
    if (typeof emailjs === 'undefined') {
      throw new Error('EmailJS no está disponible');
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
      await emailjs.send(
        this.config.email.serviceId,
        this.config.email.templateId,
        templateParams
      );
      return true;
    } catch (error) {
      throw new Error('Error enviando email: ' + error.message);
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
}

// Instancia global
let remindersManager;

// Funciones globales para los botones
async function setupWhatsAppReminder() {
  const number = document.getElementById('whatsappNumber').value;
  const days = document.getElementById('whatsappDays').value;

  try {
    await remindersManager.setupWhatsApp(number, days);
    alert('✅ Recordatorios de WhatsApp configurados correctamente');
  } catch (error) {
    alert('❌ Error: ' + error.message);
  }
}

async function setupEmailReminder() {
  const email = document.getElementById('emailAddress').value;
  const days = document.getElementById('emailDays').value;

  try {
    await remindersManager.setupEmail(email, days);
    alert('✅ Recordatorios de email configurados correctamente');
  } catch (error) {
    alert('❌ Error: ' + error.message);
  }
}

async function setupCalendarReminder() {
  const email = document.getElementById('googleEmail').value;
  const type = document.getElementById('calendarType').value;

  try {
    await remindersManager.setupGoogleCalendar(email, type);
    alert('✅ Google Calendar conectado correctamente');
    
    // Crear eventos automáticamente si hay productos
    if (remindersManager.reminders.length > 0) {
      const results = await remindersManager.createAllCalendarEvents();
      const successful = results.filter(r => r.success).length;
      alert(`📅 Se crearon ${successful} eventos en tu calendario`);
    }
  } catch (error) {
    alert('❌ Error: ' + error.message);
  }
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RemindersManager;
}
