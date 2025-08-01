# 🩺 Proyecto: Clinera Backend

## 📄 Descripción

Plataforma para gestión de turnos y agendas médicas, donde interactúan:

- Clínicas  
- Profesionales  
- Pacientes  
- Recepcionistas  
- Admins  

Cada uno tiene su propio rol y acceso.

---

## 🔧 Tecnologías utilizadas

- **NestJS**: Framework backend principal.  
- **Prisma**: ORM para interactuar con PostgreSQL.  
- **PostgreSQL**: Base de datos relacional.  
- **JWT**: Autenticación con tokens.  
- **Bcrypt**: Encriptación de contraseñas.  
- **Class-validator**: Validación de DTOs.  
- **CORS**: Configurado para permitir frontend desde otro origen.  
- **ts-node**: Ejecutar seeds y scripts en TypeScript.  

---

## 📁 Estructura de carpetas (`/src`)

```bash
src/
├── auth/
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.module.ts
│   ├── dto/
│   ├── jwt-auth.guard.ts
│   └── strategies/jwt.strategy.ts
├── patients/
│   ├── patients.controller.ts
│   ├── patients.service.ts
│   ├── patients.module.ts
│   └── dto/
├── professionals/
│   ├── professionals.controller.ts
│   ├── professionals.service.ts
│   ├── professionals.module.ts
│   └── dto/
├── users/
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── users.module.ts
├── prisma/
│   ├── prisma.module.ts
│   ├── prisma.service.ts
│   └── seed.ts
└── app.module.ts

## 🧠 Modelos Prisma (schema.prisma)

model User {
  id             String   @id @default(cuid())
  email          String   @unique
  password       String
  role           Role
  patient        Patient?
  professional   Professional?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

model Patient {
  id       String @id @default(cuid())
  name     String
  user     User   @relation(fields: [userId], references: [id])
  userId   String @unique
}

model Professional {
  id                String   @id @default(cuid())
  name              String
  user              User     @relation(fields: [userId], references: [id])
  userId            String   @unique
  specialties       String[]
  defaultDurationMin Int
  bufferMin          Int
}

enum Role {
  ADMIN
  RECEPCIONIST
  PROFESSIONAL
  PATIENT
}

## 🔑 Autenticación
Rutas protegidas con JwtAuthGuard.
Usar en controladores: @UseGuards(JwtAuthGuard)
Token se pasa en el header como: Authorization: Bearer <token>

## 🧪 Seed de datos
Archivo prisma/seed.ts usado para poblar la base con usuarios como:
Admin
Patient
Professional

Comando para ejecutar:
npx prisma db seed


Frontend: Next.js (http://localhost:3000)
Backend: Nest.js (http://localhost:3001)
