#!/bin/bash

echo "🚀 Verificando endpoints en Railway..."
echo "URL Base: https://clinera-backend-develop.up.railway.app"
echo ""

# Función para verificar endpoint
check_endpoint() {
    local endpoint=$1
    local description=$2
    local expected_status=$3
    
    echo "🔍 Verificando: $description"
    echo "   URL: $endpoint"
    
    response=$(curl -s -w "%{http_code}" "$endpoint")
    http_code="${response: -3}"
    body="${response%???}"
    
    if [ "$http_code" = "$expected_status" ]; then
        echo "   ✅ Status: $http_code (Esperado: $expected_status)"
    else
        echo "   ❌ Status: $http_code (Esperado: $expected_status)"
    fi
    
    echo "   📄 Respuesta: $body"
    echo ""
}

# Endpoints públicos
check_endpoint "https://clinera-backend-develop.up.railway.app/api/health" "Health Check" "200"
check_endpoint "https://clinera-backend-develop.up.railway.app/" "Root Endpoint" "200"
check_endpoint "https://clinera-backend-develop.up.railway.app/plans" "Planes" "200"
check_endpoint "https://clinera-backend-develop.up.railway.app/clinicas" "Clínicas" "200"

# Endpoints con autenticación (deberían devolver 401)
check_endpoint "https://clinera-backend-develop.up.railway.app/clinicas/owner" "Clínicas Owner (sin auth)" "401"
check_endpoint "https://clinera-backend-develop.up.railway.app/turnos" "Turnos (sin auth)" "401"
check_endpoint "https://clinera-backend-develop.up.railway.app/pacientes" "Pacientes (sin auth)" "401"
check_endpoint "https://clinera-backend-develop.up.railway.app/profesionales" "Profesionales (sin auth)" "401"
check_endpoint "https://clinera-backend-develop.up.railway.app/notifications" "Notificaciones (sin auth)" "401"

echo "✅ Verificación completada!"
echo ""
echo "📋 Resumen:"
echo "   - Endpoints públicos: Deben devolver 200"
echo "   - Endpoints protegidos: Deben devolver 401 sin token"
echo "   - Todos los endpoints deben estar disponibles" 