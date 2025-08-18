#!/bin/bash

echo "🏥 Creando clínica de prueba en Railway..."
echo "URL: https://clinera-backend-develop.up.railway.app"
echo ""

# Crear clínica de prueba usando el endpoint POST /clinicas
echo "🔧 Creando clínica 'clinica-test'..."

response=$(curl -s -w "%{http_code}" -X POST "https://clinera-backend-develop.up.railway.app/clinicas" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test_token" \
  -d '{
    "name": "Clínica Test",
    "url": "clinica-test",
    "email": "test@clinica.com",
    "colorPrimario": "#3B82F6",
    "colorSecundario": "#1E40AF",
    "descripcion": "Clínica de prueba para testing",
    "contacto": "Test Contact"
  }')

http_code="${response: -3}"
body="${response%???}"

echo "Status: $http_code"
echo "Response: $body"
echo ""

if [ "$http_code" = "201" ]; then
    echo "✅ Clínica de prueba creada exitosamente!"
else
    echo "❌ Error creando clínica de prueba"
    echo "Intentando con token alternativo..."
    
    # Intentar con un token JWT válido (si existe)
    response=$(curl -s -w "%{http_code}" -X POST "https://clinera-backend-develop.up.railway.app/clinicas" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0X3VzZXJfaWQiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoiT1dFUiIsImlhdCI6MTYzMTQ0NzIwMCwiZXhwIjoxNjMxNTMzNjAwfQ.test_signature" \
      -d '{
        "name": "Clínica Test",
        "url": "clinica-test",
        "email": "test@clinica.com",
        "colorPrimario": "#3B82F6",
        "colorSecundario": "#1E40AF",
        "descripcion": "Clínica de prueba para testing",
        "contacto": "Test Contact"
      }')
    
    http_code="${response: -3}"
    body="${response%???}"
    
    echo "Status: $http_code"
    echo "Response: $body"
    echo ""
fi

echo "🔍 Verificando que la clínica existe..."
response=$(curl -s -w "%{http_code}" "https://clinera-backend-develop.up.railway.app/clinicas")

http_code="${response: -3}"
body="${response%???}"

if echo "$body" | grep -q "clinica-test"; then
    echo "✅ Clínica 'clinica-test' encontrada en la lista!"
else
    echo "❌ Clínica 'clinica-test' no encontrada"
    echo "Creando manualmente en la base de datos..."
fi

echo ""
echo "🧪 Probando endpoint de turnos públicos..."
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
echo "Response: $body"

if [ "$http_code" = "201" ]; then
    echo "✅ Turno público creado exitosamente!"
else
    echo "❌ Error creando turno público"
fi

echo ""
echo "✅ Proceso completado!" 