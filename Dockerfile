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

# Exponer puerto
EXPOSE 3000

# Comando para ejecutar la aplicación usando la ruta correcta
CMD ["node", "dist/src/main.js"]
