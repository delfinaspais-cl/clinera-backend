#!/bin/bash

echo "🚀 Configurando sistema de suscripciones..."

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json. Ejecuta este script desde la raíz del proyecto."
    exit 1
fi

# Instalar dependencias si no están instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
fi

# Ejecutar migración de Prisma
echo "🔄 Ejecutando migración de Prisma..."
npx prisma migrate dev --name subscription-system

# Ejecutar seed de planes
echo "🌱 Poblando planes de suscripción..."
npx ts-node prisma/seed-plans.ts

# Generar cliente de Prisma
echo "🔧 Generando cliente de Prisma..."
npx prisma generate

echo "✅ Sistema de suscripciones configurado exitosamente!"
echo ""
echo "📋 Resumen de lo implementado:"
echo "   • 3 planes: CORE (70 USD), FLOW (120 USD), NEXUS (180 USD)"
echo "   • Período de prueba de 7 días automático"
echo "   • Gestión completa de suscripciones"
echo "   • Control de límites y uso"
echo "   • Endpoints para frontend"
echo ""
echo "🎯 Endpoints principales:"
echo "   GET /plans - Obtener todos los planes"
echo "   GET /plans/popular - Obtener plan popular"
echo "   POST /subscriptions/trial - Iniciar período de prueba"
echo "   PUT /subscriptions/upgrade - Actualizar plan"
echo "   GET /clinicas/:id/subscription - Ver suscripción de clínica"
echo "   GET /clinicas/:id/subscription/usage - Ver uso actual"
echo ""
echo "🔗 Para probar el sistema:"
echo "   1. Crea una clínica nueva"
echo "   2. Se creará automáticamente una suscripción de prueba"
echo "   3. Después de 7 días, la clínica deberá elegir un plan"
echo "   4. Usa los endpoints para gestionar suscripciones"
