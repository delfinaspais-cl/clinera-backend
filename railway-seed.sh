#!/bin/bash

echo "🌱 Ejecutando seed de datos de prueba en Railway..."
echo ""

# Verificar si Railway CLI está instalado
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI no está instalado"
    echo "Instalando Railway CLI..."
    npm install -g @railway/cli
fi

echo "🔧 Ejecutando seed en Railway..."
railway run npm run seed:test

echo ""
echo "✅ Seed completado!"
echo ""
echo "🧪 Probando endpoints..."

# Probar endpoints después del seed
echo "1. Probando GET /clinicas..."
curl -s "https://clinera-backend-develop.up.railway.app/clinicas" | jq '.data[] | select(.url == "clinica-test") | .name' 2>/dev/null || echo "Clínica no encontrada"

echo ""
echo "2. Probando POST /turnos/public..."
response=$(curl -s -w "%{http_code}" -X POST "https://clinera-backend-develop.up.railway.app/turnos/public" \
  -H "Content-Type: application/json" \
  -d '{
    "clinicaUrl": "clinica-test",
    "nombre": "Juan Pérez",
    "email": "juan@test.com",
    "fecha": "2025-08-20",
    "hora": "10:00",
    "motivo": "Consulta general"
  }')

http_code="${response: -3}"
body="${response%???}"

echo "Status: $http_code"
if [ "$http_code" = "201" ]; then
    echo "✅ Turno público creado exitosamente!"
else
    echo "❌ Error: $body"
fi

echo ""
echo "🎉 Proceso completado!" 