@echo off
echo 🚀 Iniciando servidor local para Calculadora de Cuotas...
echo.
echo 📡 Servidor disponible en: http://localhost:8000/src/
echo 💬 Para usar EmailJS correctamente, abre: http://localhost:8000/src/index.html
echo.
echo Presiona Ctrl+C para detener el servidor
echo.

cd /d "%~dp0"

:: Intentar con Python 3 primero
python -m http.server 8000 2>nul
if %errorlevel% neq 0 (
    :: Si Python 3 no funciona, intentar con Python 2
    python -m SimpleHTTPServer 8000 2>nul
    if %errorlevel% neq 0 (
        :: Si Python no está disponible, intentar con Node.js
        echo ❌ Python no encontrado. Intentando con Node.js...
        npx http-server -p 8000 2>nul
        if %errorlevel% neq 0 (
            echo.
            echo ❌ No se pudo iniciar el servidor. Necesitas instalar:
            echo    - Python: https://python.org/downloads/
            echo    - O Node.js: https://nodejs.org/
            echo.
            pause
        )
    )
)
