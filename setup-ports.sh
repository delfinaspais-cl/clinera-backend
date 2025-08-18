#!/bin/bash

echo "🔧 Configurando puertos para desarrollo..."

# Función para matar proceso en puerto específico
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port)
    if [ ! -z "$pid" ]; then
        echo "🔄 Matando proceso en puerto $port (PID: $pid)"
        kill -9 $pid
        sleep 2
    else
        echo "✅ Puerto $port está libre"
    fi
}

# Matar procesos en puertos de desarrollo
echo "📋 Verificando puertos..."

# Puerto 3001 (Backend)
echo "🔍 Verificando puerto 3001 (Backend)..."
kill_port 3001

# Puerto 3000 (Frontend)
echo "🔍 Verificando puerto 3000 (Frontend)..."
kill_port 3000

# Puerto 3002 (Alternativo para Frontend)
echo "🔍 Verificando puerto 3002 (Alternativo)..."
kill_port 3002

echo ""
echo "✅ Puertos configurados:"
echo "   🖥️  Backend:  http://localhost:3001"
echo "   🌐 Frontend: http://localhost:3000"
echo "   🔄 Alternativo: http://localhost:3002"
echo ""
echo "🚀 ¡Listo para desarrollo!" 