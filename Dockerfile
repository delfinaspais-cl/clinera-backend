# Usar Node.js 20 como imagen base
FROM node:20-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar TODAS las dependencias (incluyendo devDependencies para el build)
RUN npm ci

# Copiar el resto del código
COPY . .

# Generar Prisma client
RUN npx prisma generate

# Construir la aplicación
RUN npm run build

# Verificar que el archivo existe (para debug)
RUN echo "=== Contenido del directorio actual ==="
RUN ls -la
RUN echo "=== Contenido del directorio dist ==="
RUN ls -la dist/ || echo "Directorio dist no existe"
RUN echo "=== Buscando archivos .js en dist ==="
RUN find dist/ -name "*.js" 2>/dev/null || echo "No se encontraron archivos .js"

# Exponer puerto
EXPOSE 3000

# Comando para ejecutar la aplicación usando nest start
CMD ["npm", "run", "start:prod"]
