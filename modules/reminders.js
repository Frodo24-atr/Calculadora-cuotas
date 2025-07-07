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
    console.log('🔧 Iniciando initializeServices...');
    
    // Verificar múltiples métodos de acceso a la configuración
    let configFound = false;
    let attempts = 0;
    const maxAttempts = 30; // 1.5 segundos máximo
    
    // Función para verificar configuración disponible
    const checkConfig = () => {
      // Método 1: window.SERVICES_CONFIG
      if (typeof window !== 'undefined' && window.SERVICES_CONFIG) {
        console.log('✅ Configuración encontrada en window.SERVICES_CONFIG');
        return true;
      }
      
      // Método 2: Variable global SERVICES_CONFIG
      if (typeof SERVICES_CONFIG !== 'undefined') {
        console.log('✅ Configuración encontrada en SERVICES_CONFIG global');
        if (typeof window !== 'undefined') {
          window.SERVICES_CONFIG = SERVICES_CONFIG;
        }
        return true;
      }
      
      // Método 3: Verificar si hay un marcador de carga
      if (typeof window !== 'undefined' && window.SERVICES_CONFIG_LOADED) {
        console.log('✅ Configuración marcada como cargada');
        return true;
      }
      
      return false;
    };
    
    // Verificar si ya está disponible
    if (checkConfig()) {
      configFound = true;
      console.log('✅ Configuración ya disponible');
    } else {
      console.log('⏳ Configuración no disponible, estableciendo listeners y esperando...');
      
      // Escuchar el evento personalizado de carga de services.js
      const configListener = (event) => {
        console.log('🎯 Evento servicesConfigLoaded recibido');
        if (event.detail && event.detail.config) {
          window.SERVICES_CONFIG = event.detail.config;
          configFound = true;
          console.log('✅ Configuración establecida desde evento');
        }
      };
      
      if (typeof window !== 'undefined') {
        window.addEventListener('servicesConfigLoaded', configListener);
      }
      
      // Esperar hasta que SERVICES_CONFIG esté disponible
      while (!configFound && attempts < maxAttempts) {
        console.log(`⏳ Esperando SERVICES_CONFIG... Intento ${attempts + 1}/${maxAttempts}`);
        await new Promise(resolve => setTimeout(resolve, 50));
        attempts++;
        
        if (checkConfig()) {
          configFound = true;
          break;
        }
      }

      // Limpiar listener
      if (typeof window !== 'undefined') {
        window.removeEventListener('servicesConfigLoaded', configListener);
      }
    }

    // Verificar que la configuración esté disponible
    if (!configFound || typeof window.SERVICES_CONFIG === 'undefined') {
      console.error('❌ Configuración de servicios no encontrada después de esperar');
      console.error('🔧 Asegúrate de que src/config/services.js se esté cargando correctamente');
      console.error('ℹ️ La aplicación funcionará pero sin recordatorios por email');
      
      // Crear configuración básica de emergencia
      window.SERVICES_CONFIG = {
        emailJS: {
          publicKey: '8c4l-rq7DsQF8ibja',
          serviceId: 'service_srur1ha',
          templateId: 'template_EJEMPLO',
          enabled: false
        },
        whatsapp: {
          baseUrl: 'https://wa.me/'
        }
      };
      
      console.log('🚨 Configuración de emergencia creada');
    }

    console.log('✅ SERVICES_CONFIG encontrado:', window.SERVICES_CONFIG);
    const config = window.SERVICES_CONFIG;

    // Inicializar EmailJS
    if (typeof emailjs !== 'undefined') {
      try {
        console.log('🔧 Verificando configuración de EmailJS...');
        
        // Verificar configuración completa
        if (!config.emailJS.publicKey || !config.emailJS.serviceId || !config.emailJS.templateId) {
          console.warn('⚠️ Configuración de EmailJS incompleta. Revisa src/config/services.js');
          console.warn('📋 Estado actual:', {
            publicKey: !!config.emailJS.publicKey,
            serviceId: !!config.emailJS.serviceId,
            templateId: !!config.emailJS.templateId,
            enabled: config.emailJS.enabled
          });
          return;
        }

        // Inicializar EmailJS con la Public Key
        emailjs.init(config.emailJS.publicKey);
        
        console.log('✅ EmailJS inicializado correctamente');
        console.log('🔧 Configuración:', {
          publicKey: config.emailJS.publicKey.substring(0, 8) + '...',
          serviceId: config.emailJS.serviceId,
          templateId: config.emailJS.templateId,
          enabled: config.emailJS.enabled
        });
      } catch (error) {
        console.error('❌ Error inicializando EmailJS:', error.message);
        console.error('🔧 Error completo:', error);
      }
    } else {
      console.warn('⚠️ EmailJS no disponible - librería no cargada');
    }
  }

  // Configurar recordatorio de Email
  async setupEmail(address, daysAhead) {
    console.log('📧 Configurando email para:', address);
    
    if (!address || !this.validateEmail(address)) {
      throw new Error('Dirección de email inválida');
    }

    // Esperar hasta que SERVICES_CONFIG esté disponible
    let attempts = 0;
    const maxAttempts = 20; // 2 segundos máximo
    
    while (typeof window.SERVICES_CONFIG === 'undefined' && attempts < maxAttempts) {
      console.log(`⏳ Esperando SERVICES_CONFIG en setupEmail... Intento ${attempts + 1}/${maxAttempts}`);
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
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

      // Verificar configuración básica
      if (!this.config.email.serviceId || !this.config.email.templateId) {
        throw new Error('Configuración de email incompleta. Verifica serviceId y templateId en services.js');
      }

      // Verificar que EmailJS esté inicializado
      if (!window.SERVICES_CONFIG || !window.SERVICES_CONFIG.emailJS) {
        throw new Error('Configuración de servicios no disponible');
      }

      // Verificar si EmailJS está habilitado en la configuración
      if (window.SERVICES_CONFIG.emailJS.enabled === false) {
        throw new Error('EmailJS está deshabilitado en la configuración. Configura tu Template ID y habilítalo en services.js');
      }

      // Verificar Template ID específicamente
      if (this.config.email.templateId.includes('EJEMPLO') || this.config.email.templateId === 'template_EJEMPLO') {
        throw new Error('Debes configurar un Template ID real en services.js. Visita https://dashboard.emailjs.com/admin/templates para crear uno.');
      }

      // Inicializar EmailJS si no está hecho
      if (!emailjs.publicKey) {
        console.log('🔧 Inicializando EmailJS...');
        emailjs.init(window.SERVICES_CONFIG.emailJS.publicKey);
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
      console.error('❌ Stack trace:', error.stack);
      
      // Mejorar mensajes de error específicos
      let errorMessage = 'Error desconocido';
      
      if (error.text) {
        errorMessage = error.text;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Errores específicos de EmailJS
      if (error.status) {
        switch(error.status) {
          case 400:
            if (error.text && error.text.includes('template ID not found')) {
              errorMessage = 'Template ID no encontrado en EmailJS. Debes configurar un Template ID real en services.js';
            } else if (error.text && error.text.includes('service ID not found')) {
              errorMessage = 'Service ID no encontrado en EmailJS. Verifica tu Service ID en services.js';
            } else {
              errorMessage = 'Error 400: Datos inválidos. Verifica tu configuración de EmailJS en services.js';
            }
            break;
          case 402:
            errorMessage = 'Error 402: Límite de emails alcanzado en tu cuenta EmailJS';
            break;
          case 403:
            errorMessage = 'Error 403: Acceso denegado. Verifica tu Public Key en services.js';
            break;
          case 404:
            errorMessage = 'Error 404: Servicio o plantilla no encontrados. Verifica los IDs en services.js';
            break;
          case 422:
            errorMessage = 'Error 422: Plantilla mal configurada. Revisa las variables en tu plantilla de EmailJS';
            break;
          default:
            errorMessage = `Error ${error.status}: ${error.text || 'Error del servidor EmailJS'}`;
        }
      }
      
      // Agregar instrucciones específicas para configurar EmailJS
      if (errorMessage.includes('template ID not found') || errorMessage.includes('Template ID')) {
        errorMessage += '\n\n📋 PASOS PARA SOLUCIONARLO:\n';
        errorMessage += '1. Ve a https://dashboard.emailjs.com/admin/templates\n';
        errorMessage += '2. Crea una nueva plantilla de email\n';
        errorMessage += '3. Copia el Template ID (ej: template_abc123)\n';
        errorMessage += '4. Edita src/config/services.js\n';
        errorMessage += '5. Reemplaza "template_EJEMPLO" por tu Template ID real\n';
        errorMessage += '6. Cambia enabled: true en services.js\n';
        errorMessage += '7. Guarda y recarga la página';
      }
      
      // Si es error de CORS, sugerir alternativa
      if (errorMessage.includes('CORS') || errorMessage.includes('cors')) {
        errorMessage = 'Error de CORS: Para usar email, ejecuta la aplicación desde un servidor web (no archivo local)';
      }
      
      throw new Error(errorMessage);
    }
  }

  // Método para probar el envío de email con datos de muestra
  async testEmailSending() {
    // Esperar un poco para que se cargue la configuración si es necesario
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verificar configuración antes de intentar enviar
    if (!window.SERVICES_CONFIG) {
      console.error('❌ SERVICES_CONFIG no disponible, intentando cargar...');
      
      // Intentar cargar la configuración manualmente
      try {
        // Verificar si existe globalmente
        if (typeof SERVICES_CONFIG !== 'undefined') {
          window.SERVICES_CONFIG = SERVICES_CONFIG;
          console.log('✅ Configuración cargada desde variable global');
        } else {
          throw new Error('Configuración de EmailJS no encontrada. Verifica que services.js esté cargado correctamente.');
        }
      } catch (error) {
        throw new Error('Configuración de EmailJS no encontrada. Verifica que services.js esté cargado correctamente.');
      }
    }

    if (!window.SERVICES_CONFIG.emailJS) {
      throw new Error('Configuración de EmailJS no encontrada en services.js');
    }

    if (window.SERVICES_CONFIG.emailJS.enabled === false) {
      throw new Error('EmailJS está deshabilitado. Para habilitar:\n1. Configura tu Template ID en services.js\n2. Cambia enabled: true');
    }

    if (window.SERVICES_CONFIG.emailJS.templateId.includes('EJEMPLO')) {
      throw new Error('Debes configurar un Template ID real:\n1. Ve a https://dashboard.emailjs.com/admin/templates\n2. Crea una plantilla\n3. Actualiza templateId en services.js\n4. Cambia enabled: true');
    }

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

    // Mostrar/ocultar controles según haya recordatorios o productos
    const remindersControls = document.getElementById('remindersControls');
    if (remindersControls) {
      // Verificar si hay productos registrados para mostrar el botón de reporte
      const products = JSON.parse(localStorage.getItem('calculadora-productos') || '[]');
      const hasProducts = products.length > 0;
      const hasReminders = upcoming.length > 0;
      
      // Mostrar controles si hay productos (para reporte) o recordatorios (para gestión)
      remindersControls.style.display = (hasProducts || hasReminders) ? 'block' : 'none';
      
      // Mostrar/ocultar botón de eliminar según haya recordatorios
      const deleteBtn = remindersControls.querySelector('.delete-all-btn');
      if (deleteBtn) {
        deleteBtn.style.display = hasReminders ? 'inline-block' : 'none';
      }
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
    
    // Generar estadísticas generales mejoradas
    const totalProducts = products.length;
    const totalValue = products.reduce((sum, p) => sum + p.totalValue, 0);
    const totalMonthlyPayments = products.reduce((sum, p) => sum + p.monthlyPayment, 0);
    const averageProductValue = totalValue / totalProducts;
    
    // Determinar email del usuario antes de todo
    let userEmail = null;
    let clienteNombre = 'Usuario';
    
    if (this.config.email.enabled && this.config.email.address) {
      userEmail = this.config.email.address;
      clienteNombre = userEmail.split('@')[0];
      console.log('✅ Email configurado en recordatorios:', userEmail);
    } else {
      // Solicitar email al usuario si no está configurado
      userEmail = prompt('📧 Ingresa tu email para recibir el reporte:');
      if (!userEmail) {
        throw new Error('Email requerido para enviar el reporte.');
      }
      clienteNombre = userEmail.split('@')[0];
      console.log('✅ Email ingresado por el usuario:', userEmail);
    }
    
    // Generar reporte detallado mejorado por producto
    const resumenDetallado = products.map((product, index) => {
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
      
      // Generar emoji basado en el tipo de producto
      let emoji = '📦';
      const name = product.name.toLowerCase();
      if (name.includes('laptop') || name.includes('computador') || name.includes('pc')) emoji = '💻';
      else if (name.includes('celular') || name.includes('phone') || name.includes('móvil')) emoji = '📱';
      else if (name.includes('carro') || name.includes('auto') || name.includes('vehículo')) emoji = '🚗';
      else if (name.includes('casa') || name.includes('apartamento') || name.includes('vivienda')) emoji = '🏠';
      else if (name.includes('moto') || name.includes('bicicleta')) emoji = '🏍️';
      
      return `${emoji} ${product.name}
   💰 Valor Total: $${product.totalValue.toLocaleString('es-CO')}
   📅 ${product.installments} cuotas de $${product.monthlyPayment.toLocaleString('es-CO')} c/u
   📊 Progreso: ${Math.round(progress)}% completado
   ✅ Cuotas pagadas: ${installmentsPaid}/${product.installments}
   ⏳ Cuotas pendientes: ${installmentsPending}
   🗓️ Inicio: ${startDate.toLocaleDateString('es-CO')}
   🏁 Finalización: ${endDate.toLocaleDateString('es-CO')}
   ────────────────────────────────`;
    }).join('\n');
    
    // Calcular próximos pagos
    const nextPayments = this.getNextThreePayments(products);
    const proximosPagos = nextPayments.length > 0 ? 
      nextPayments.map(payment => 
        `🔔 ${payment.date.toLocaleDateString('es-CO')} - ${payment.product} - $${payment.amount.toLocaleString('es-CO')}`
      ).join('\n') : 
      'No hay pagos próximos programados';
    
    // Preparar datos para el email con formato mejorado
    const templateParams = {
      to_email: userEmail,
      cliente_nombre: clienteNombre,
      subject: '💰 Tu Reporte Financiero Personalizado - Calculadora de Cuotas',
      mensaje_principal: `¡Hola ${clienteNombre}! 👋

Aquí tienes tu reporte financiero completo con todos los detalles de tus productos y cuotas. Mantén el control de tus finanzas de manera inteligente.`,
      
      productos_detalle: resumenDetallado,
      
      estadisticas_resumen: `📊 RESUMEN FINANCIERO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💼 Total de productos: ${totalProducts}
💎 Valor total invertido: $${totalValue.toLocaleString('es-CO')}
💳 Pago mensual total: $${totalMonthlyPayments.toLocaleString('es-CO')}
📈 Promedio por producto: $${Math.round(averageProductValue).toLocaleString('es-CO')}
🔔 Próximos pagos:
${proximosPagos}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      
      consejos_financieros: `💡 CONSEJOS FINANCIEROS PERSONALIZADOS:
• Programa recordatorios 3 días antes de cada pago para estar preparado
• Mantén un fondo de emergencia del 20% del pago mensual total
• Revisa tu progreso mensualmente para ajustar tu presupuesto
• Considera pagos adelantados cuando tengas ingresos extra
• Aprovecha los descuentos por pronto pago si están disponibles
• Mantén un registro de todos tus gastos para mejor control financiero`,
      
      mensaje_despedida: `¡Gracias por confiar en nuestra Calculadora de Cuotas! 🙏

Esperamos que esta información te ayude a mantener un mejor control de tus finanzas personales. Recuerda que la planificación financiera es clave para alcanzar tus metas.

Si tienes alguna pregunta o sugerencia, no dudes en contactarnos. Estamos aquí para ayudarte en tu camino hacia la estabilidad financiera.

¡Que tengas un excelente día y que logres todas tus metas! ✨`,
      
      from_name: '💰 Calculadora de Cuotas - Tu Asistente Financiero Personal',
      fecha_reporte: new Date().toLocaleDateString('es-CO', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      
      // Variables adicionales para personalización
      total_productos: totalProducts,
      valor_total: totalValue.toLocaleString('es-CO'),
      pago_mensual_total: totalMonthlyPayments.toLocaleString('es-CO')
    };
    
    try {
      // Verificar que EmailJS esté disponible y configurado
      if (typeof emailjs === 'undefined') {
        throw new Error('EmailJS no está disponible. Verifica que la librería esté cargada.');
      }

      // Verificar configuración de servicios
      if (!window.SERVICES_CONFIG || !window.SERVICES_CONFIG.emailJS) {
        throw new Error('Configuración de servicios no disponible. Verifica que services.js esté cargado.');
      }

      const emailConfig = window.SERVICES_CONFIG.emailJS;

      // Verificar que la configuración esté completa
      if (!emailConfig.publicKey || !emailConfig.serviceId || !emailConfig.templateId) {
        throw new Error('Configuración de EmailJS incompleta. Verifica publicKey, serviceId y templateId en services.js');
      }

      // Verificar si EmailJS está habilitado
      if (emailConfig.enabled === false) {
        throw new Error('EmailJS está deshabilitado en la configuración. Configura tu Template ID y habilítalo en services.js');
      }

      // Verificar Template ID específicamente - usar el template correcto
      console.log('🔍 Usando Template ID:', emailConfig.templateId);

      // Inicializar EmailJS si no está inicializado
      console.log('🔧 Verificando inicialización de EmailJS...');
      try {
        emailjs.init(emailConfig.publicKey);
        console.log('✅ EmailJS inicializado con Public Key:', emailConfig.publicKey.substring(0, 8) + '...');
      } catch (initError) {
        console.error('❌ Error inicializando EmailJS:', initError);
        throw new Error('Error inicializando EmailJS: ' + initError.message);
      }

      console.log('📧 Enviando reporte mejorado con configuración:', {
        serviceId: emailConfig.serviceId,
        templateId: emailConfig.templateId,
        to_email: userEmail
      });

      const response = await emailjs.send(
        emailConfig.serviceId,
        emailConfig.templateId,
        templateParams
      );
      
      console.log('✅ Reporte mejorado enviado correctamente:', response);
      console.log('📧 Contenido del reporte mejorado:', templateParams);
      
      return true;
    } catch (error) {
      console.error('❌ Error enviando reporte completo:', error);
      
      // Mejorar mensajes de error específicos
      let errorMessage = 'Error desconocido';
      
      if (error.text) {
        errorMessage = error.text;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Errores específicos de EmailJS
      if (error.status) {
        switch(error.status) {
          case 400:
            if (error.text && error.text.includes('template ID not found')) {
              errorMessage = 'Template ID no encontrado en EmailJS. Debes configurar un Template ID real en services.js';
            } else if (error.text && error.text.includes('service ID not found')) {
              errorMessage = 'Service ID no encontrado en EmailJS. Verifica tu Service ID en services.js';
            } else {
              errorMessage = 'Error 400: Datos inválidos. Verifica tu configuración de EmailJS en services.js';
            }
            break;
          case 402:
            errorMessage = 'Error 402: Límite de emails alcanzado en tu cuenta EmailJS';
            break;
          case 403:
            errorMessage = 'Error 403: Acceso denegado. Verifica tu Public Key en services.js';
            break;
          case 404:
            errorMessage = 'Error 404: Servicio o plantilla no encontrados. Verifica los IDs en services.js';
            break;
          case 422:
            errorMessage = 'Error 422: Plantilla mal configurada. Revisa las variables en tu plantilla de EmailJS';
            break;
          default:
            errorMessage = `Error ${error.status}: ${error.text || 'Error del servidor EmailJS'}`;
        }
      }
      
      // Agregar instrucciones específicas para configurar EmailJS
      if (errorMessage.includes('template ID not found') || errorMessage.includes('Template ID')) {
        errorMessage += '\n\n📋 PASOS PARA SOLUCIONARLO:\n';
        errorMessage += '1. Ve a https://dashboard.emailjs.com/admin/templates\n';
        errorMessage += '2. Crea una nueva plantilla de email\n';
        errorMessage += '3. Copia el Template ID (ej: template_abc123)\n';
        errorMessage += '4. Edita src/config/services.js\n';
        errorMessage += '5. Reemplaza "template_EJEMPLO" por tu Template ID real\n';
        errorMessage += '6. Cambia enabled: true en services.js\n';
        errorMessage += '7. Guarda y recarga la página';
      }
      
      throw new Error(errorMessage);
    }
  }

  // Obtener próximos tres pagos (función auxiliar para reporte por email)
  getNextThreePayments(products) {
    const today = new Date();
    const upcomingPayments = [];
    
    products.forEach(product => {
      const startDate = new Date(product.startDate);
      
      for (let i = 0; i < product.installments; i++) {
        const paymentDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, startDate.getDate());
        
        if (paymentDate >= today) {
          upcomingPayments.push({
            date: paymentDate,
            product: product.name,
            amount: product.monthlyPayment,
            installmentNumber: i + 1,
            totalInstallments: product.installments
          });
        }
      }
    });
    
    // Ordenar por fecha y tomar los primeros 3
    upcomingPayments.sort((a, b) => a.date.getTime() - b.date.getTime());
    return upcomingPayments.slice(0, 3);
  }
}

// === EXPORTACIÓN Y DISPONIBILIDAD GLOBAL ===

// Hacer disponible globalmente
window.RemindersManager = RemindersManager;

// === FUNCIONES DE DIAGNÓSTICO Y PRUEBA ===

// Función para diagnosticar el estado de la configuración
window.diagnosticarConfiguracion = function() {
  console.log('🔍 === DIAGNÓSTICO DE CONFIGURACIÓN ===');
  
  // Verificar SERVICES_CONFIG
  console.log('📋 SERVICES_CONFIG disponible:', typeof window.SERVICES_CONFIG !== 'undefined');
  if (typeof window.SERVICES_CONFIG !== 'undefined') {
    console.log('📧 EmailJS config:', {
      enabled: window.SERVICES_CONFIG.emailJS.enabled,
      hasPublicKey: !!window.SERVICES_CONFIG.emailJS.publicKey,
      hasServiceId: !!window.SERVICES_CONFIG.emailJS.serviceId,
      hasTemplateId: !!window.SERVICES_CONFIG.emailJS.templateId,
      publicKey: window.SERVICES_CONFIG.emailJS.publicKey.substring(0, 8) + '...',
      serviceId: window.SERVICES_CONFIG.emailJS.serviceId,
      templateId: window.SERVICES_CONFIG.emailJS.templateId
    });
  }
  
  // Verificar EmailJS
  console.log('📧 EmailJS disponible:', typeof emailjs !== 'undefined');
  
  // Verificar RemindersManager
  console.log('🔔 RemindersManager disponible:', typeof window.remindersManager !== 'undefined');
  
  // Verificar funciones globales
  console.log('🧪 Funciones de prueba disponibles:', {
    testEmailJS: typeof window.testEmailJS !== 'undefined',
    testReminderEmail: typeof window.testReminderEmail !== 'undefined',
    sendCompleteReport: typeof window.sendCompleteReport !== 'undefined'
  });
  
  console.log('🔍 === FIN DEL DIAGNÓSTICO ===');
};

// Función mejorada para probar EmailJS
window.testEmailJSMejorado = async function() {
  console.log('🧪 === PRUEBA MEJORADA DE EMAILJS ===');
  
  try {
    // Diagnosticar primero
    window.diagnosticarConfiguracion();
    
    // Verificar configuración
    if (typeof window.SERVICES_CONFIG === 'undefined') {
      throw new Error('SERVICES_CONFIG no está disponible. Verifica que services.js esté cargado.');
    }
    
    const config = window.SERVICES_CONFIG.emailJS;
    
    if (!config.enabled) {
      throw new Error('EmailJS está deshabilitado en la configuración (enabled: false). Cambia a enabled: true en services.js');
    }
    
    if (!config.publicKey || !config.serviceId || !config.templateId) {
      throw new Error('Configuración de EmailJS incompleta. Verifica publicKey, serviceId y templateId en services.js');
    }
    
    if (config.templateId.includes('EJEMPLO')) {
      throw new Error('Template ID es de ejemplo. Debes configurar un Template ID real desde https://dashboard.emailjs.com/admin/templates');
    }
    
    if (typeof emailjs === 'undefined') {
      throw new Error('EmailJS no está disponible. Verifica que la librería esté cargada.');
    }
    
    // Solicitar email al usuario
    const email = prompt('🧪 Ingresa tu email para la prueba:');
    if (!email) {
      console.log('❌ Prueba cancelada - no se proporcionó email');
      return;
    }
    
    // Inicializar EmailJS
    console.log('� Inicializando EmailJS...');
    emailjs.init(config.publicKey);
    console.log('✅ EmailJS inicializado con Public Key:', config.publicKey.substring(0, 8) + '...');
    
    console.log('�📧 Enviando email de prueba a:', email);
    console.log('🔧 Configuración utilizada:', {
      serviceId: config.serviceId,
      templateId: config.templateId,
      publicKey: config.publicKey.substring(0, 8) + '...'
    });
    
    // Enviar email de prueba
    const result = await emailjs.send(
      config.serviceId,
      config.templateId,
      {
        to_email: email,
        user_name: email.split('@')[0],
        product_name: 'PRUEBA - Producto de Ejemplo',
        payment_date: new Date().toLocaleDateString('es-ES'),
        payment_amount: '1,000',
        installment_current: 1,
        installment_total: 12,
        days_ahead: 3,
        from_name: 'Calculadora de Cuotas - Prueba'
      }
    );
    
    console.log('✅ Email de prueba enviado exitosamente!');
    console.log('📋 Resultado:', result);
    
    if (window.app && typeof window.app.showNotification === 'function') {
      window.app.showNotification('success', 'Prueba exitosa', 'Email de prueba enviado correctamente a ' + email);
    } else {
      alert('✅ Email de prueba enviado exitosamente a ' + email);
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba de EmailJS:', error);
    
    let errorMessage = error.message || 'Error desconocido';
    
    // Mejorar mensajes de error específicos
    if (error.status) {
      switch(error.status) {
        case 400:
          if (error.text && error.text.includes('template ID not found')) {
            errorMessage = 'Template ID no encontrado. Visita https://dashboard.emailjs.com/admin/templates para crear uno.';
          } else if (error.text && error.text.includes('public key')) {
            errorMessage = 'Public Key inválida. Verifica tu Public Key en https://dashboard.emailjs.com/admin/account';
          }
          break;
        case 403:
          errorMessage = 'Acceso denegado. Verifica tu Public Key en services.js';
          break;
        case 404:
          errorMessage = 'Servicio o plantilla no encontrados. Verifica los IDs en services.js';
          break;
      }
    }
    
    if (window.app && typeof window.app.showNotification === 'function') {
      window.app.showNotification('error', 'Error en la prueba', errorMessage);
    } else {
      alert('❌ Error en la prueba: ' + errorMessage);
    }
  }
  
  console.log('🧪 === FIN DE LA PRUEBA ===');
};

// === FUNCIONES GLOBALES PARA LA INTERFAZ ===

// Función global para enviar reporte completo por email
window.sendFullReportEmail = async function() {
  console.log('📊 Enviando reporte completo...');
  
  try {
    if (!window.remindersManager) {
      throw new Error('Sistema de recordatorios no inicializado');
    }
    
    if (window.app && typeof window.app.showNotification === 'function') {
      window.app.showNotification('info', 'Enviando reporte', 'Generando y enviando reporte completo...');
    }
    
    await window.remindersManager.sendFullReportEmail();
    
    if (window.app && typeof window.app.showNotification === 'function') {
      window.app.showNotification('success', 'Reporte enviado', 'El reporte completo ha sido enviado por email correctamente');
    } else {
      alert('✅ Reporte completo enviado por email correctamente');
    }
    
  } catch (error) {
    console.error('❌ Error enviando reporte completo:', error);
    
    if (window.app && typeof window.app.showNotification === 'function') {
      window.app.showNotification('error', 'Error enviando reporte', error.message);
    } else {
      alert('❌ Error enviando reporte: ' + error.message);
    }
  }
};

// Función global para probar email de recordatorio
window.testEmailReminder = async function() {
  console.log('🧪 Probando email de recordatorio...');
  
  try {
    if (!window.remindersManager) {
      throw new Error('Sistema de recordatorios no inicializado');
    }
    
    if (window.app && typeof window.app.showNotification === 'function') {
      window.app.showNotification('info', 'Enviando prueba', 'Enviando email de prueba...');
    }
    
    await window.remindersManager.testEmailSending();
    
    console.log('✅ Email de prueba enviado correctamente');
    
  } catch (error) {
    console.error('❌ Error en email de prueba:', error);
    
    if (window.app && typeof window.app.showNotification === 'function') {
      window.app.showNotification('error', 'Error en prueba de email', error.message);
    } else {
      alert('❌ Error en prueba de email: ' + error.message);
    }
  }
};

// Función global para eliminar todos los recordatorios
window.deleteAllReminders = function() {
  if (!window.remindersManager) {
    if (window.app && typeof window.app.showNotification === 'function') {
      window.app.showNotification('error', 'Error', 'Sistema de recordatorios no inicializado');
    } else {
      alert('❌ Sistema de recordatorios no inicializado');
    }
    return;
  }
  
  const confirm = window.confirm('¿Estás seguro de que quieres eliminar todos los recordatorios?');
  if (confirm) {
    window.remindersManager.deleteAllReminders();
  }
};

// Función global para eliminar recordatorio individual
window.deleteIndividualReminder = function(index) {
  if (!window.remindersManager) {
    if (window.app && typeof window.app.showNotification === 'function') {
      window.app.showNotification('error', 'Error', 'Sistema de recordatorios no inicializado');
    } else {
      alert('❌ Sistema de recordatorios no inicializado');
    }
    return;
  }
  
  const confirm = window.confirm('¿Estás seguro de que quieres eliminar este recordatorio?');
  if (confirm) {
    window.remindersManager.deleteReminder(index);
  }
};

// Función global para configurar email
window.setupEmailReminder = async function() {
  const email = document.getElementById('emailAddress').value;
  const daysAhead = document.getElementById('emailDays').value;
  
  if (!email) {
    if (window.app && typeof window.app.showNotification === 'function') {
      window.app.showNotification('warning', 'Email requerido', 'Por favor ingresa tu email');
    } else {
      alert('⚠️ Por favor ingresa tu email');
    }
    return;
  }
  
  try {
    if (!window.remindersManager) {
      throw new Error('Sistema de recordatorios no inicializado');
    }
    
    await window.remindersManager.setupEmail(email, daysAhead);
    
    if (window.app && typeof window.app.showNotification === 'function') {
      window.app.showNotification('success', 'Email configurado', 'Recordatorios por email configurados correctamente');
    } else {
      alert('✅ Recordatorios por email configurados correctamente');
    }
    
    // Regenerar recordatorios con la nueva configuración
    if (window.app && window.app.state && window.app.state.products) {
      window.remindersManager.generateReminders(window.app.state.products);
    }
    
  } catch (error) {
    console.error('❌ Error configurando email:', error);
    
    if (window.app && typeof window.app.showNotification === 'function') {
      window.app.showNotification('error', 'Error configurando email', error.message);
    } else {
      alert('❌ Error configurando email: ' + error.message);
    }
  }
};

// Función global para test básico de notificaciones
window.testBasicNotification = function() {
  if (window.app && typeof window.app.showNotification === 'function') {
    window.app.showNotification('success', 'Prueba de notificación', 'El sistema de notificaciones está funcionando correctamente');
  } else {
    alert('✅ Notificación de prueba - El sistema está funcionando');
  }
};

console.log('✅ Funciones globales de interfaz registradas correctamente');

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

// Función global para verificar configuración de EmailJS
window.verificarConfiguracionEmailJS = function() {
  console.log('🔍 === VERIFICACIÓN DE CONFIGURACIÓN EMAILJS ===');
  
  // Verificar múltiples formas de acceso a la configuración
  let config = null;
  
  if (typeof window.SERVICES_CONFIG !== 'undefined') {
    config = window.SERVICES_CONFIG.emailJS;
    console.log('✅ SERVICES_CONFIG encontrado en window');
  } else if (typeof SERVICES_CONFIG !== 'undefined') {
    config = SERVICES_CONFIG.emailJS;
    console.log('✅ SERVICES_CONFIG encontrado globalmente');
    // Asignar a window para uso futuro
    window.SERVICES_CONFIG = SERVICES_CONFIG;
  } else {
    console.error('❌ SERVICES_CONFIG no disponible en ninguna forma');
    
    // Intentar crear configuración básica
    const basicConfig = {
      emailJS: {
        publicKey: '8c4l-rq7DsQF8ibja',
        serviceId: 'service_srur1ha',
        templateId: 'template_EJEMPLO',
        enabled: false
      }
    };
    
    window.SERVICES_CONFIG = basicConfig;
    config = basicConfig.emailJS;
    console.log('⚠️ Configuración básica creada');
  }
  
  if (!config) {
    alert('❌ No se pudo cargar la configuración. Verifica que services.js esté funcionando correctamente.');
    return;
  }
  
  console.log('📋 Estado de configuración:', {
    enabled: config.enabled,
    publicKey: config.publicKey ? config.publicKey.substring(0, 8) + '...' : 'NO CONFIGURADO',
    serviceId: config.serviceId || 'NO CONFIGURADO',
    templateId: config.templateId || 'NO CONFIGURADO'
  });
  
  let mensaje = '📊 ESTADO DE CONFIGURACIÓN EMAILJS:\n\n' +
                `Public Key: ${config.publicKey ? config.publicKey.substring(0, 8) + '...' : 'NO CONFIGURADO'}\n` +
                `Service ID: ${config.serviceId || 'NO CONFIGURADO'}\n` +
                `Template ID: ${config.templateId || 'NO CONFIGURADO'}\n` +
                `Habilitado: ${config.enabled ? 'SÍ' : 'NO'}\n`;
  
  if (config.templateId === 'template_EJEMPLO') {
    mensaje += '⚠️ ADVERTENCIA: Template ID es de ejemplo!\n';
  }
  
  alert(mensaje);
  console.log('🔍 === FIN DE VERIFICACIÓN ===');
};

// Función global para diagnosticar la carga de servicios
window.diagnosticarCarga = function() {
  console.log('🩺 === DIAGNÓSTICO DE CARGA DE SERVICIOS ===');
  
  let reporte = '🩺 DIAGNÓSTICO DE CARGA DE SERVICIOS:\n\n';
  
  // 1. Verificar variables globales
  reporte += '📋 VARIABLES GLOBALES:\n';
  
  if (typeof window.SERVICES_CONFIG !== 'undefined') {
    reporte += '✅ window.SERVICES_CONFIG: DISPONIBLE\n';
  } else {
    reporte += '❌ window.SERVICES_CONFIG: NO DISPONIBLE\n';
  }
  
  if (typeof SERVICES_CONFIG !== 'undefined') {
    reporte += '✅ SERVICES_CONFIG (global): DISPONIBLE\n';
  } else {
    reporte += '❌ SERVICES_CONFIG (global): NO DISPONIBLE\n';
  }
  
  if (typeof window.SERVICES_CONFIG_LOADED !== 'undefined') {
    reporte += '✅ SERVICES_CONFIG_LOADED: ' + window.SERVICES_CONFIG_LOADED + '\n';
  } else {
    reporte += '❌ SERVICES_CONFIG_LOADED: NO DEFINIDO\n';
  }
  
  // 2. Verificar librerías
  reporte += '\n📚 LIBRERÍAS:\n';
  
  if (typeof emailjs !== 'undefined') {
    reporte += '✅ EmailJS: CARGADO\n';
  } else {
    reporte += '❌ EmailJS: NO CARGADO\n';
  }
  
  // 3. Verificar RemindersManager
  reporte += '\n🔧 SISTEMA DE RECORDATORIOS:\n';
  
  if (typeof window.remindersManager !== 'undefined') {
    reporte += '✅ RemindersManager: INICIALIZADO\n';
  } else {
    reporte += '❌ RemindersManager: NO INICIALIZADO\n';
  }
  
  if (typeof window.RemindersManager !== 'undefined') {
    reporte += '✅ Clase RemindersManager: DISPONIBLE\n';
  } else {
    reporte += '❌ Clase RemindersManager: NO DISPONIBLE\n';
  }
  
  // 4. Verificar configuración específica
  if (typeof window.SERVICES_CONFIG !== 'undefined') {
    reporte += '\n⚙️ CONFIGURACIÓN EMAILJS:\n';
    const config = window.SERVICES_CONFIG.emailJS;
    
    reporte += `Public Key: ${config.publicKey ? config.publicKey.substring(0, 8) + '...' : 'NO CONFIGURADO'}\n`;
    reporte += `Service ID: ${config.serviceId || 'NO CONFIGURADO'}\n`;
    reporte += `Template ID: ${config.templateId || 'NO CONFIGURADO'}\n`;
    reporte += `Habilitado: ${config.enabled ? 'SÍ' : 'NO'}\n`;
    
    if (config.templateId === 'template_EJEMPLO') {
      reporte += '⚠️ ADVERTENCIA: Template ID es de ejemplo!\n';
    }
  }
  
  // 5. Sugerencias
  reporte += '\n🔧 SUGERENCIAS:\n';
  
  if (typeof window.SERVICES_CONFIG === 'undefined') {
    reporte += '- Verificar que services.js se esté cargando correctamente\n';
    reporte += '- Revisar la consola del navegador para errores\n';
    reporte += '- Asegurar que el archivo está en src/config/services.js\n';
  }
  
  if (typeof emailjs === 'undefined') {
    reporte += '- EmailJS no está cargado, verificar el script en index.html\n';
  }
  
  if (typeof window.remindersManager === 'undefined') {
    reporte += '- El sistema de recordatorios no se inicializó correctamente\n';
  }
  
  alert(reporte);
  console.log(reporte);
  console.log('🩺 === FIN DEL DIAGNÓSTICO ===');
};

// Función para prueba rápida de configuración
window.pruebaRapidaConfig = function() {
  console.log('⚡ === PRUEBA RÁPIDA DE CONFIGURACIÓN ===');
  
  const resultados = [];
  
  // Test 1: Variable global
  if (typeof window.SERVICES_CONFIG !== 'undefined') {
    resultados.push('✅ window.SERVICES_CONFIG disponible');
    console.log('✅ SERVICES_CONFIG encontrado');
  } else {
    resultados.push('❌ window.SERVICES_CONFIG NO disponible');
    console.log('❌ SERVICES_CONFIG NO encontrado');
  }
  
  // Test 2: Configuración EmailJS
  if (window.SERVICES_CONFIG && window.SERVICES_CONFIG.emailJS) {
    resultados.push('✅ Configuración EmailJS accesible');
    console.log('✅ EmailJS config OK');
  } else {
    resultados.push('❌ Configuración EmailJS NO accesible');
    console.log('❌ EmailJS config FALLO');
  }
  
  // Test 3: Librería EmailJS
  if (typeof emailjs !== 'undefined') {
    resultados.push('✅ Librería EmailJS cargada');
    console.log('✅ EmailJS library OK');
  } else {
    resultados.push('❌ Librería EmailJS NO cargada');
    console.log('❌ EmailJS library FALLO');
  }
  
  // Test 4: RemindersManager
  if (typeof window.remindersManager !== 'undefined') {
    resultados.push('✅ RemindersManager inicializado');
    console.log('✅ RemindersManager OK');
  } else {
    resultados.push('❌ RemindersManager NO inicializado');
    console.log('❌ RemindersManager FALLO');
  }
  
  // Mostrar resultados
  const mensaje = '⚡ PRUEBA RÁPIDA DE CONFIGURACIÓN:\n\n' + resultados.join('\n');
  alert(mensaje);
  console.log(mensaje);
  console.log('⚡ === FIN DE PRUEBA RÁPIDA ===');
  
  return resultados;
};

// Función de depuración para verificar configuración en tiempo real
window.depurarConfigEmailJS = function() {
  console.log('🔍 === DEPURACIÓN DE CONFIGURACIÓN EMAILJS ===');
  
  // 1. Verificar que SERVICES_CONFIG esté disponible
  if (typeof window.SERVICES_CONFIG === 'undefined') {
    console.error('❌ window.SERVICES_CONFIG no está definido');
    alert('❌ ERROR: window.SERVICES_CONFIG no está definido\n\nEsto significa que services.js no se cargó correctamente.');
    return;
  }
  
  // 2. Verificar la configuración específica
  const config = window.SERVICES_CONFIG.emailJS;
  console.log('📋 Configuración actual:', config);
  
  // 3. Verificar cada campo específicamente
  const verificaciones = {
    'SERVICES_CONFIG existe': !!window.SERVICES_CONFIG,
    'emailJS config existe': !!config,
    'publicKey': config?.publicKey || 'NO CONFIGURADO',
    'serviceId': config?.serviceId || 'NO CONFIGURADO', 
    'templateId': config?.templateId || 'NO CONFIGURADO',
    'enabled': config?.enabled || false,
    'templateId es ejemplo': config?.templateId?.includes('EJEMPLO') || false
  };
  
  console.table(verificaciones);
  
  // 4. Mostrar resultado
  let mensaje = '🔍 DEPURACIÓN DE CONFIGURACIÓN EMAILJS:\n\n';
  
  Object.entries(verificaciones).forEach(([key, value]) => {
    const status = value === true || (typeof value === 'string' && value !== 'NO CONFIGURADO') ? '✅' : '❌';
    mensaje += `${status} ${key}: ${value}\n`;
  });
  
  // 5. Verificar el problema específico
  if (config?.templateId?.includes('EJEMPLO')) {
    mensaje += '\n🚨 PROBLEMA ENCONTRADO:\n';
    mensaje += `Template ID actual: "${config.templateId}"\n`;
    mensaje += 'Este Template ID contiene "EJEMPLO" y será rechazado.\n';
    mensaje += 'Debes configurar un Template ID real en services.js';
  } else if (config?.templateId === 'template_f0c0va1') {
    mensaje += '\n✅ CONFIGURACIÓN CORRECTA:\n';
    mensaje += `Template ID: ${config.templateId}\n`;
    mensaje += 'La configuración parece correcta.';
  }
  
  alert(mensaje);
  console.log('🔍 === FIN DE DEPURACIÓN ===');
  
  return verificaciones;
};

console.log('✅ RemindersManager cargado correctamente');
