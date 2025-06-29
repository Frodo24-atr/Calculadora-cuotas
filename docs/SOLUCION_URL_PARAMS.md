# Solución: Manejo de Parámetros en URL

## Problema
VS Code agrega parámetros de query string a las URLs cuando abre archivos HTML en el navegador, como:
```
http://localhost:8000/index.html?id=cd13ead9-9cf4-468e-9976-124620176191&vscodeBrowserReqId=1751206325267
```

Esto causaba errores 404 porque el servidor intentaba buscar un archivo con esos parámetros incluidos en el nombre.

## Solución Implementada

### 1. Modificación del Servidor (server.js)
- **Antes:** El servidor usaba `req.url` directamente para construir la ruta del archivo.
- **Después:** Se extrae solo la parte de la URL antes del `?` para ignorar los parámetros:

```javascript
// Remover parámetros de query string (como los que agrega VS Code)
const urlWithoutParams = req.url.split('?')[0];

let filePath = '.' + urlWithoutParams;
```

### 2. Mejora en el Manejo de Errores
- El mensaje de error 404 ahora muestra la URL limpia sin parámetros.

## Resultado
- ✅ Las URLs con parámetros de VS Code ahora funcionan correctamente
- ✅ El servidor maneja automáticamente cualquier parámetro de query string
- ✅ No se requiere acción manual del usuario para limpiar la URL

## Ejemplo
- **URL con parámetros:** `http://localhost:8000/index.html?id=123&param=value`
- **Archivo servido:** `index.html` (parámetros ignorados automáticamente)

## Fecha de Implementación
Enero 2025 - Versión 1.1 del servidor
