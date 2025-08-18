#!/bin/bash

echo "🚀 Verificación Completa de Endpoints en Railway..."
echo "URL Base: https://clinera-backend-develop.up.railway.app"
echo ""

# Función para verificar endpoint
check_endpoint() {
    local endpoint=$1
    local description=$2
    local expected_status=$3
    local method=${4:-GET}
    local data=${5:-""}
    local headers=${6:-""}
    
    echo "🔍 Verificando: $description"
    echo "   URL: $endpoint"
    echo "   Method: $method"
    
    if [ "$method" = "POST" ] && [ ! -z "$data" ]; then
        response=$(curl -s -w "%{http_code}" -X $method "$endpoint" -H "Content-Type: application/json" -d "$data" $headers)
    else
        response=$(curl -s -w "%{http_code}" -X $method "$endpoint" $headers)
    fi
    
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
check_endpoint "https://clinera-backend-develop.up.railway.app/plans" "Planes (Global)" "200"
check_endpoint "https://clinera-backend-develop.up.railway.app/api/plans" "Planes (API)" "200"
check_endpoint "https://clinera-backend-develop.up.railway.app/clinicas" "Clínicas" "200"

# Endpoints con autenticación (deberían devolver 401)
check_endpoint "https://clinera-backend-develop.up.railway.app/clinicas/owner" "Clínicas Owner (sin auth)" "401"
check_endpoint "https://clinera-backend-develop.up.railway.app/turnos" "Turnos (sin auth)" "401"
check_endpoint "https://clinera-backend-develop.up.railway.app/pacientes" "Pacientes (sin auth)" "401"
check_endpoint "https://clinera-backend-develop.up.railway.app/profesionales" "Profesionales (sin auth)" "401"
check_endpoint "https://clinera-backend-develop.up.railway.app/notifications" "Notificaciones (sin auth)" "401"

# Endpoints con token de prueba (deberían devolver 200)
check_endpoint "https://clinera-backend-develop.up.railway.app/clinicas/owner" "Clínicas Owner (con test token)" "200" "GET" "" "-H \"Authorization: Bearer test_token\""

# Endpoints POST con token de prueba
check_endpoint "https://clinera-backend-develop.up.railway.app/clinicas" "Crear Clínica (con test token)" "201" "POST" '{"name":"Clínica Test Railway","url":"clinica-test-railway","email":"test@railway.com","colorPrimario":"#3B82F6","colorSecundario":"#1E40AF"}' "-H \"Authorization: Bearer test_token\""

# Endpoints POST públicos
check_endpoint "https://clinera-backend-develop.up.railway.app/turnos/public" "Crear Turno Público" "201" "POST" '{"clinicaUrl":"clinica-test","nombre":"Juan Pérez","email":"juan@test.com","fecha":"2025-08-20","hora":"10:00","motivo":"Consulta general"}'

echo "✅ Verificación completada!"
echo ""
echo "📋 Resumen:"
echo "   - Endpoints públicos: Deben devolver 200"
echo "   - Endpoints protegidos: Deben devolver 401 sin token"
echo "   - Endpoints con test token: Deben devolver 200"
echo "   - Endpoints POST: Deben devolver 201"
echo "   - Todos los endpoints deben estar disponibles" 