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

# Crear una nueva imagen más pequeña solo con producción
FROM node:20-alpine

WORKDIR /app

# Copiar solo los archivos necesarios para producción
COPY package*.json ./
RUN npm ci --only=production

# Copiar el build y Prisma
COPY --from=0 /app/dist ./dist
COPY --from=0 /app/node_modules/.prisma ./node_modules/.prisma

# Exponer puerto
EXPOSE 3000

# Comando para ejecutar la aplicación
CMD ["npm", "run", "start:prod"]
