#!/bin/bash

# Script para crear versión embebida con todos los assets inline
# Esto garantiza que funcione en Vercel independientemente de problemas de routing

echo "🔧 Creando versión embebida de la aplicación..."

# Crear el archivo HTML embebido
cat > index-embedded-full.html << 'EOF'
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>💰 Calculadora de Cuotas v2.0</title>
    
    <!-- Font Awesome para iconos -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- Chart.js -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    
    <!-- EmailJS -->
    <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"></script>
    
    <!-- jsPDF -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    
    <!-- CSS Principal embebido -->
    <style>
EOF

# Insertar CSS
echo "📄 Embebiendo CSS..."
cat styles/fallback.css >> index-embedded-full.html

cat >> index-embedded-full.html << 'EOF'
    </style>
</head>
<body>
EOF

# Insertar el cuerpo del HTML principal (sin head y scripts)
echo "🏗️ Insertando contenido principal..."
sed -n '/<body>/,/<\/body>/p' index.html | head -n -1 | tail -n +2 >> index-embedded-full.html

# Agregar scripts embebidos
cat >> index-embedded-full.html << 'EOF'

    <!-- Scripts JavaScript embebidos -->
    
    <!-- Configuración de servicios -->
    <script>
EOF

echo "⚙️ Embebiendo services.js..."
cat config/services.js >> index-embedded-full.html

cat >> index-embedded-full.html << 'EOF'
    </script>
    
    <!-- Módulo de recordatorios -->
    <script>
EOF

echo "🔔 Embebiendo reminders.js..."
cat modules/reminders.js >> index-embedded-full.html

cat >> index-embedded-full.html << 'EOF'
    </script>
    
    <!-- Aplicación principal -->
    <script>
EOF

echo "🚀 Embebiendo app.js..."
cat scripts/app.js >> index-embedded-full.html

cat >> index-embedded-full.html << 'EOF'
    </script>
    
    <!-- Script de navegación embebido -->
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const hamburger = document.querySelector('.hamburger');
            const navMenu = document.querySelector('.nav-menu');
            const navOverlay = document.querySelector('.nav-overlay');
            const navLinks = document.querySelectorAll('.nav-link');

            // Toggle menú móvil
            hamburger.addEventListener('click', function() {
                hamburger.classList.toggle('active');
                navMenu.classList.toggle('active');
                navOverlay.classList.toggle('active');
                document.body.classList.toggle('nav-open');
            });

            // Cerrar menú al hacer clic en overlay
            navOverlay.addEventListener('click', function() {
                closeMenu();
            });

            // Cerrar menú al hacer clic en un enlace
            navLinks.forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const targetId = this.getAttribute('href');
                    const targetSection = document.querySelector(targetId);
                    
                    if (targetSection) {
                        targetSection.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                    
                    closeMenu();
                    
                    // Actualizar enlace activo
                    navLinks.forEach(l => l.parentElement.classList.remove('active'));
                    this.parentElement.classList.add('active');
                });
            });

            // Función para cerrar menú
            function closeMenu() {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                navOverlay.classList.remove('active');
                document.body.classList.remove('nav-open');
            }

            // Cerrar menú al scroll en móvil
            let isScrolling = false;
            window.addEventListener('scroll', function() {
                if (!isScrolling && window.innerWidth <= 768) {
                    isScrolling = true;
                    closeMenu();
                    setTimeout(() => {
                        isScrolling = false;
                    }, 100);
                }
            });

            // Actualizar enlace activo al hacer scroll
            window.addEventListener('scroll', function() {
                const sections = document.querySelectorAll('.section');
                const scrollPos = window.scrollY + 100;

                sections.forEach(section => {
                    const sectionTop = section.offsetTop;
                    const sectionHeight = section.offsetHeight;
                    const sectionId = section.getAttribute('id');

                    if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                        navLinks.forEach(link => {
                            link.parentElement.classList.remove('active');
                            if (link.getAttribute('href') === '#' + sectionId) {
                                link.parentElement.classList.add('active');
                            }
                        });
                    }
                });
            });
        });
    </script>
    
    <!-- Timeout de emergencia para evitar cuelgues -->
    <script>
        // Timeout de emergencia - fuerza ocultar loading después de 2 segundos
        setTimeout(() => {
            const loading = document.getElementById('loadingIndicator');
            if (loading && loading.style.display !== 'none') {
                loading.style.display = 'none';
                console.log('✅ Loading ocultado por timeout de emergencia (versión embebida)');
            }
        }, 2000);
        
        // Inicialización inmediata del loading
        document.addEventListener('DOMContentLoaded', () => {
            const loading = document.getElementById('loadingIndicator');
            if (loading) {
                setTimeout(() => {
                    if (loading.style.display !== 'none') {
                        loading.style.display = 'none';
                        console.log('✅ Loading ocultado por timeout DOM (versión embebida)');
                    }
                }, 1000);
            }
        });
        
        console.log('🔥 Aplicación cargada con assets embebidos - Sin dependencias externas de archivos');
    </script>
</body>
</html>
EOF

echo "✅ Archivo index-embedded-full.html creado exitosamente!"
echo "📏 Tamaño del archivo:"
ls -lh index-embedded-full.html
echo ""
echo "🚀 Para usar esta versión, renombrala a index.html y haz deploy"
echo "💡 Esta versión no depende de archivos externos CSS/JS"
