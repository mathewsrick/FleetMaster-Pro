#!/bin/bash

# Script para validar la configuración SEO de FleetMaster Hub
# Uso: ./validate-seo.sh [URL]

URL="${1:-http://localhost:3001}"
echo "🔍 Validando SEO para: $URL"
echo "================================"

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para verificar
check() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} $1"
  else
    echo -e "${RED}✗${NC} $1"
  fi
}

# 1. Verificar robots.txt
echo ""
echo "📄 Verificando robots.txt..."
curl -s -o /dev/null -w "%{http_code}" "$URL/robots.txt" | grep -q "200"
check "robots.txt accesible"

# 2. Verificar sitemap.xml
echo ""
echo "🗺️  Verificando sitemap.xml..."
curl -s -o /dev/null -w "%{http_code}" "$URL/sitemap.xml" | grep -q "200"
check "sitemap.xml accesible"

# 3. Verificar headers de seguridad
echo ""
echo "🔒 Verificando headers de seguridad..."
HEADERS=$(curl -s -I "$URL")

echo "$HEADERS" | grep -q "X-Content-Type-Options"
check "X-Content-Type-Options presente"

echo "$HEADERS" | grep -q "X-Frame-Options"
check "X-Frame-Options presente"

echo "$HEADERS" | grep -q "Strict-Transport-Security"
check "HSTS (Strict-Transport-Security) presente"

# 4. Verificar meta tags
echo ""
echo "🏷️  Verificando meta tags..."
HTML=$(curl -s "$URL")

echo "$HTML" | grep -q "<title>"
check "Title tag presente"

echo "$HTML" | grep -q 'name="description"'
check "Meta description presente"

echo "$HTML" | grep -q 'property="og:title"'
check "Open Graph title presente"

echo "$HTML" | grep -q 'property="og:image"'
check "Open Graph image presente"

echo "$HTML" | grep -q 'name="twitter:card"'
check "Twitter card presente"

echo "$HTML" | grep -q 'rel="canonical"'
check "Canonical URL presente"

# 5. Verificar Structured Data
echo ""
echo "📊 Verificando Structured Data..."

echo "$HTML" | grep -q '"@type":"SoftwareApplication"'
check "Schema SoftwareApplication presente"

echo "$HTML" | grep -q '"@type":"Organization"'
check "Schema Organization presente"

echo "$HTML" | grep -q '"aggregateRating"'
check "AggregateRating presente"

# 6. Verificar favicon
echo ""
echo "🎨 Verificando favicon..."
curl -s -o /dev/null -w "%{http_code}" "$URL/favicon.png" | grep -q "200"
check "Favicon accesible"

# 7. Verificar manifest.json
echo ""
echo "📱 Verificando PWA manifest..."
curl -s -o /dev/null -w "%{http_code}" "$URL/manifest.json" | grep -q "200"
check "manifest.json accesible"

# 8. Verificar compresión
echo ""
echo "🗜️  Verificando compresión..."
curl -s -I -H "Accept-Encoding: gzip" "$URL" | grep -q "Content-Encoding: gzip"
check "Compresión Gzip habilitada"

# Resumen final
echo ""
echo "================================"
echo -e "${GREEN}✅ Validación completada${NC}"
echo ""
echo "📌 Próximos pasos:"
echo "1. Registrar en Google Search Console"
echo "2. Enviar sitemap.xml"
echo "3. Instalar Google Analytics"
echo "4. Verificar con PageSpeed Insights"
echo ""
echo "🔗 Herramientas útiles:"
echo "- Google Search Console: https://search.google.com/search-console"
echo "- PageSpeed Insights: https://pagespeed.web.dev/"
echo "- Rich Results Test: https://search.google.com/test/rich-results"
echo "- Schema Validator: https://validator.schema.org/"
