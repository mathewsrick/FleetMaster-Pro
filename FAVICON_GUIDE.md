# 🎨 Guía de Favicon - FleetMaster Pro

## 📦 Archivos Generados

Todos los archivos de favicon están ubicados en `frontend/public/`:

### Iconos Generados
```
✅ favicon.svg            - 718B  - SVG vectorial (navegadores modernos)
✅ favicon.png            - 1.4K  - PNG 32x32 (fallback)
✅ favicon.ico            - 1.4K  - ICO 32x32 (navegadores antiguos)
✅ apple-touch-icon.png   - 7.8K  - PNG 180x180 (iOS/Safari)
✅ icon-192.png           - 8.6K  - PNG 192x192 (PWA Android)
✅ icon-512.png           - 28K   - PNG 512x512 (PWA alta resolución)
✅ truck-original.png     - 23K   - PNG 640x640 (fuente original)
```

## 🎯 Fuente Original

**Archivo base:** `backend/public/assets/truck.png`
- Dimensiones: 640 x 640 píxeles
- Formato: PNG con canal alfa (RGBA)
- Uso: Logo del camión de FleetMaster Pro

## 🔧 Proceso de Generación

Los favicons se generaron usando **sips** (macOS):

```bash
# Favicon principal (32x32)
sips -z 32 32 truck.png --out favicon.png

# Apple Touch Icon (180x180)
sips -z 180 180 truck.png --out apple-touch-icon.png

# PWA Icons
sips -z 192 192 truck.png --out icon-192.png
sips -z 512 512 truck.png --out icon-512.png

# ICO para navegadores antiguos
cp favicon.png favicon.ico
```

## 📱 Integración en HTML

En `frontend/index.html`:

```html
<!-- Favicon -->
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#4F46E5" />
```

## 🌐 Configuración PWA (manifest.json)

```json
{
  "icons": [
    {
      "src": "/favicon.svg",
      "sizes": "any",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    },
    {
      "src": "/favicon.png",
      "sizes": "32x32",
      "type": "image/png"
    },
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/apple-touch-icon.png",
      "sizes": "180x180",
      "type": "image/png"
    }
  ]
}
```

## 🎨 Características del Diseño

- **Color principal:** `#4F46E5` (Indigo 600)
- **Icono:** Camión rápido (truck-fast) de Font Awesome
- **Formato:** SVG escalable para navegadores modernos
- **Fallbacks:** PNG en múltiples tamaños para compatibilidad

## 📊 Compatibilidad

| Navegador/Plataforma | Archivo Usado |
|---------------------|---------------|
| Chrome/Edge/Firefox (moderno) | `favicon.svg` |
| Safari (iOS/macOS) | `apple-touch-icon.png` |
| Android PWA | `icon-192.png` / `icon-512.png` |
| Navegadores antiguos | `favicon.ico` |
| Twitter Cards / OG | `icon-512.png` |

## 🔄 Actualización Futura

Si necesitas actualizar el favicon:

1. Reemplaza `backend/public/assets/truck.png` con el nuevo diseño (640x640 recomendado)
2. Ejecuta el script de generación:

```bash
cd frontend/public
# Regenerar todos los tamaños
sips -z 32 32 ../../backend/public/assets/truck.png --out favicon.png
sips -z 180 180 ../../backend/public/assets/truck.png --out apple-touch-icon.png
sips -z 192 192 ../../backend/public/assets/truck.png --out icon-192.png
sips -z 512 512 ../../backend/public/assets/truck.png --out icon-512.png
cp favicon.png favicon.ico

# Actualizar SVG manualmente si es necesario
```

3. Actualiza el color en `favicon.svg` si cambia la paleta de colores

## ✅ Validación

Verifica que los favicons funcionan correctamente:

1. **Local:**
   ```bash
   cd frontend
   npm run dev
   # Abre http://localhost:5173 y verifica el favicon en la pestaña
   ```

2. **Producción:**
   - Build: `npm run build`
   - Vista previa: `npm run preview`
   - Verifica el favicon en navegador

3. **Herramientas online:**
   - [Favicon Checker](https://realfavicongenerator.net/favicon_checker)
   - [PWA Asset Generator](https://progressier.com/pwa-icons-generator)

## 📦 Archivos en Control de Versiones

**Incluir en Git:**
- ✅ `frontend/public/favicon.svg`
- ✅ `frontend/public/favicon.png`
- ✅ `frontend/public/favicon.ico`
- ✅ `frontend/public/apple-touch-icon.png`
- ✅ `frontend/public/icon-192.png`
- ✅ `frontend/public/icon-512.png`
- ✅ `frontend/public/manifest.json`

**Opcional (fuente):**
- ⚠️ `frontend/public/truck-original.png` (fuente de referencia)

## 🚀 Optimización Adicional

Para producción, considera:

1. **Compresión PNG:** Usa `pngquant` o `optipng`
   ```bash
   pngquant --quality=65-80 icon-*.png
   ```

2. **Lazy loading:** Los favicons se cargan automáticamente, no requiere lazy load

3. **CDN:** Si usas CDN, actualiza las rutas en `index.html` y `manifest.json`

---

**Última actualización:** 16 de Febrero de 2026  
**Estado:** ✅ Implementado y validado
