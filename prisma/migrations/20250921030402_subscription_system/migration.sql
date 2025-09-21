-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('PATIENT', 'PROFESSIONAL', 'ADMIN', 'OWNER', 'SECRETARY');

-- CreateTable
CREATE TABLE "public"."Clinica" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "logo" TEXT,
    "colorPrimario" TEXT DEFAULT '#3B82F6',
    "colorSecundario" TEXT DEFAULT '#1E40AF',
    "estado" TEXT DEFAULT 'activo',
    "estadoPago" TEXT DEFAULT 'trial',
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimoPago" TIMESTAMP(3),
    "proximoPago" TIMESTAMP(3),
    "descripcion" TEXT,
    "contacto" TEXT,
    "rating" DOUBLE PRECISION DEFAULT 4.5,
    "stats" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "slug" TEXT NOT NULL,
    "fuente" TEXT DEFAULT 'owner_dashboard',
    "pendienteAprobacion" BOOLEAN NOT NULL DEFAULT false,
    "mensapiServiceEmail" TEXT,
    "mensapiServicePassword" TEXT,
    "administradorId" TEXT,

    CONSTRAINT "Clinica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Mensaje" (
    "id" TEXT NOT NULL,
    "asunto" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "leido" BOOLEAN NOT NULL DEFAULT false,
    "clinicaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mensaje_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Conversation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "avatar" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'prospectos',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "phone" TEXT,
    "email" TEXT,
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "clinicaId" TEXT NOT NULL,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChatMessage" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isFromUser" BOOLEAN NOT NULL DEFAULT false,
    "messageType" TEXT NOT NULL DEFAULT 'text',
    "status" TEXT NOT NULL DEFAULT 'sent',
    "conversationId" TEXT NOT NULL,
    "userId" TEXT,
    "whatsappMessageId" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notificacion" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'info',
    "prioridad" TEXT NOT NULL DEFAULT 'media',
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "clinicaId" TEXT NOT NULL,
    "destinatarioId" TEXT,
    "fechaVencimiento" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "location" TEXT,
    "bio" TEXT,
    "role" "public"."Role" NOT NULL,
    "clinicaId" TEXT,
    "estado" TEXT DEFAULT 'activo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "avatar_url" TEXT,
    "configuracion" TEXT,
    "facebook" TEXT,
    "instagram" TEXT,
    "website" TEXT,
    "whatsapp" TEXT,
    "username" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Turno" (
    "id" TEXT NOT NULL,
    "paciente" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT,
    "doctor" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "hora" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "motivo" TEXT,
    "clinicaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "conversationId" TEXT,
    "duracionMin" INTEGER NOT NULL DEFAULT 30,
    "notas" TEXT,
    "professionalId" TEXT,
    "servicio" TEXT,
    "ate" TEXT,
    "estadoPago" TEXT NOT NULL DEFAULT 'pendiente',
    "medioPago" TEXT,
    "montoTotal" TEXT,
    "origen" TEXT,
    "sucursal" TEXT,
    "montoAbonado" TEXT,
    "montoPendiente" TEXT,

    CONSTRAINT "Turno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Patient" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3),
    "phone" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Professional" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "defaultDurationMin" INTEGER NOT NULL DEFAULT 30,
    "bufferMin" INTEGER NOT NULL DEFAULT 10,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sucursalId" TEXT,

    CONSTRAINT "Professional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Agenda" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "dia" TEXT NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFin" TEXT NOT NULL,
    "duracionMin" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Agenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Horario" (
    "id" SERIAL NOT NULL,
    "day" TEXT NOT NULL,
    "openTime" TEXT NOT NULL,
    "closeTime" TEXT NOT NULL,
    "clinicaId" TEXT NOT NULL,

    CONSTRAINT "Horario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Especialidad" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "clinicaId" TEXT NOT NULL,

    CONSTRAINT "Especialidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Tratamiento" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "descripcion" TEXT,
    "duracionMin" INTEGER NOT NULL DEFAULT 30,
    "precio" DOUBLE PRECISION,
    "clinicaId" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'activo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tratamiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProfessionalEspecialidad" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "especialidadId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfessionalEspecialidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProfessionalTratamiento" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "tratamientoId" TEXT NOT NULL,
    "precio" DOUBLE PRECISION,
    "duracionMin" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfessionalTratamiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PasswordResetToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PushNotificationToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "deviceId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushNotificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WhatsAppMessage" (
    "id" TEXT NOT NULL,
    "phoneNumberId" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "messageType" TEXT NOT NULL,
    "messageText" TEXT,
    "templateName" TEXT,
    "templateParams" TEXT,
    "mediaUrl" TEXT,
    "mediaId" TEXT,
    "wamid" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "clinicaId" TEXT,
    "userId" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WhatsAppTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'es',
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "components" TEXT NOT NULL,
    "example" TEXT,
    "clinicaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Contacto" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT,
    "empresa" TEXT,
    "tipoConsulta" TEXT NOT NULL,
    "plan" TEXT,
    "mensaje" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'nuevo',
    "procesado" BOOLEAN NOT NULL DEFAULT false,
    "notas" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contacto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WhatsAppWebhook" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsAppWebhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Sucursal" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'activa',
    "clinicaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ciudad" TEXT,
    "pais" TEXT,
    "provincia" TEXT,

    CONSTRAINT "Sucursal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FichaMedica" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "clinicaId" TEXT NOT NULL,
    "grupoSanguineo" TEXT,
    "alergias" TEXT,
    "medicamentosActuales" TEXT,
    "antecedentesPatologicos" TEXT,
    "antecedentesQuirurgicos" TEXT,
    "antecedentesFamiliares" TEXT,
    "habitos" TEXT,
    "ocupacion" TEXT,
    "motivoConsulta" TEXT,
    "sintomas" TEXT,
    "diagnostico" TEXT,
    "tratamiento" TEXT,
    "evolucion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tratamientosEsteticosPrevios" TEXT,

    CONSTRAINT "FichaMedica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FichaMedicaHistorial" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "clinicaId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoPor" TEXT,
    "grupoSanguineo" TEXT,
    "ocupacion" TEXT,
    "alergias" TEXT,
    "medicamentosActuales" TEXT,
    "antecedentesPatologicos" TEXT,
    "antecedentesQuirurgicos" TEXT,
    "antecedentesFamiliares" TEXT,
    "habitos" TEXT,
    "motivoConsulta" TEXT,
    "sintomas" TEXT,
    "diagnostico" TEXT,
    "tratamiento" TEXT,
    "evolucion" TEXT,
    "notasCambio" TEXT,
    "esVersionActual" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tratamientosEsteticosPrevios" TEXT,

    CONSTRAINT "FichaMedicaHistorial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FichaMedicaArchivo" (
    "id" TEXT NOT NULL,
    "fichaHistorialId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "descripcion" TEXT,
    "fechaSubida" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FichaMedicaArchivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ArchivoMedico" (
    "id" TEXT NOT NULL,
    "fichaMedicaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nombreArchivo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tamañoBytes" BIGINT,
    "fechaSubida" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArchivoMedico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ImagenMedica" (
    "id" TEXT NOT NULL,
    "fichaMedicaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nombreArchivo" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "descripcion" TEXT,
    "tamañoBytes" BIGINT,
    "fechaSubida" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImagenMedica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MedioPago" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "clinicaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedioPago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Venta" (
    "id" TEXT NOT NULL,
    "ventaId" TEXT NOT NULL,
    "comprador" TEXT NOT NULL,
    "paciente" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "tratamiento" TEXT NOT NULL,
    "profesional" TEXT NOT NULL,
    "profesionalId" TEXT,
    "sucursal" TEXT NOT NULL,
    "montoTotal" TEXT NOT NULL,
    "montoAbonado" TEXT NOT NULL,
    "montoPendiente" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'activa',
    "estadoPago" TEXT NOT NULL DEFAULT 'pendiente',
    "medioPago" TEXT,
    "origen" TEXT,
    "ate" TEXT,
    "sesiones" INTEGER NOT NULL DEFAULT 1,
    "sesionesUsadas" INTEGER NOT NULL DEFAULT 0,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaVencimiento" TIMESTAMP(3),
    "notas" TEXT,
    "clinicaId" TEXT NOT NULL,
    "medioPagoId" TEXT,

    CONSTRAINT "Venta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Plan" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tagline" TEXT,
    "descripcion" TEXT NOT NULL,
    "precio" DOUBLE PRECISION NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'USD',
    "intervalo" TEXT NOT NULL DEFAULT 'monthly',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "popular" BOOLEAN NOT NULL DEFAULT false,
    "caracteristicas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "limitaciones" JSONB,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "icono" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Suscripcion" (
    "id" TEXT NOT NULL,
    "clinicaId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'trial',
    "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaFin" TIMESTAMP(3),
    "fechaTrialFin" TIMESTAMP(3),
    "ultimoPago" TIMESTAMP(3),
    "proximoPago" TIMESTAMP(3),
    "metodoPago" TEXT,
    "idPagoExterno" TEXT,
    "trialDias" INTEGER NOT NULL DEFAULT 7,
    "autoRenovar" BOOLEAN NOT NULL DEFAULT true,
    "canceladoEn" TIMESTAMP(3),
    "motivoCancelacion" TEXT,
    "notas" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Suscripcion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HistorialPago" (
    "id" TEXT NOT NULL,
    "suscripcionId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'USD',
    "estado" TEXT NOT NULL DEFAULT 'pending',
    "metodoPago" TEXT,
    "idPagoExterno" TEXT,
    "fechaPago" TIMESTAMP(3),
    "fechaVencimiento" TIMESTAMP(3),
    "notas" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HistorialPago_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Clinica_slug_key" ON "public"."Clinica"("slug");

-- CreateIndex
CREATE INDEX "Conversation_clinicaId_idx" ON "public"."Conversation"("clinicaId");

-- CreateIndex
CREATE INDEX "Conversation_stage_idx" ON "public"."Conversation"("stage");

-- CreateIndex
CREATE INDEX "Conversation_lastMessageAt_idx" ON "public"."Conversation"("lastMessageAt" DESC);

-- CreateIndex
CREATE INDEX "ChatMessage_conversationId_idx" ON "public"."ChatMessage"("conversationId");

-- CreateIndex
CREATE INDEX "ChatMessage_createdAt_idx" ON "public"."ChatMessage"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "ChatMessage_status_idx" ON "public"."ChatMessage"("status");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "public"."User"("username");

-- CreateIndex
CREATE INDEX "User_clinicaId_idx" ON "public"."User"("clinicaId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_clinicaId_key" ON "public"."User"("email", "clinicaId");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_userId_key" ON "public"."Patient"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Professional_userId_key" ON "public"."Professional"("userId");

-- CreateIndex
CREATE INDEX "Tratamiento_clinicaId_idx" ON "public"."Tratamiento"("clinicaId");

-- CreateIndex
CREATE INDEX "Tratamiento_estado_idx" ON "public"."Tratamiento"("estado");

-- CreateIndex
CREATE INDEX "ProfessionalEspecialidad_professionalId_idx" ON "public"."ProfessionalEspecialidad"("professionalId");

-- CreateIndex
CREATE INDEX "ProfessionalEspecialidad_especialidadId_idx" ON "public"."ProfessionalEspecialidad"("especialidadId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionalEspecialidad_professionalId_especialidadId_key" ON "public"."ProfessionalEspecialidad"("professionalId", "especialidadId");

-- CreateIndex
CREATE INDEX "ProfessionalTratamiento_professionalId_idx" ON "public"."ProfessionalTratamiento"("professionalId");

-- CreateIndex
CREATE INDEX "ProfessionalTratamiento_tratamientoId_idx" ON "public"."ProfessionalTratamiento"("tratamientoId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionalTratamiento_professionalId_tratamientoId_key" ON "public"."ProfessionalTratamiento"("professionalId", "tratamientoId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "public"."PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_email_idx" ON "public"."PasswordResetToken"("email");

-- CreateIndex
CREATE INDEX "PasswordResetToken_token_idx" ON "public"."PasswordResetToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "PushNotificationToken_token_key" ON "public"."PushNotificationToken"("token");

-- CreateIndex
CREATE INDEX "PushNotificationToken_userId_idx" ON "public"."PushNotificationToken"("userId");

-- CreateIndex
CREATE INDEX "PushNotificationToken_token_idx" ON "public"."PushNotificationToken"("token");

-- CreateIndex
CREATE INDEX "PushNotificationToken_platform_idx" ON "public"."PushNotificationToken"("platform");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_to_idx" ON "public"."WhatsAppMessage"("to");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_status_idx" ON "public"."WhatsAppMessage"("status");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_clinicaId_idx" ON "public"."WhatsAppMessage"("clinicaId");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_userId_idx" ON "public"."WhatsAppMessage"("userId");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_wamid_idx" ON "public"."WhatsAppMessage"("wamid");

-- CreateIndex
CREATE INDEX "WhatsAppTemplate_name_idx" ON "public"."WhatsAppTemplate"("name");

-- CreateIndex
CREATE INDEX "WhatsAppTemplate_status_idx" ON "public"."WhatsAppTemplate"("status");

-- CreateIndex
CREATE INDEX "WhatsAppTemplate_clinicaId_idx" ON "public"."WhatsAppTemplate"("clinicaId");

-- CreateIndex
CREATE INDEX "Contacto_estado_idx" ON "public"."Contacto"("estado");

-- CreateIndex
CREATE INDEX "Contacto_tipoConsulta_idx" ON "public"."Contacto"("tipoConsulta");

-- CreateIndex
CREATE INDEX "Contacto_createdAt_idx" ON "public"."Contacto"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "Contacto_email_idx" ON "public"."Contacto"("email");

-- CreateIndex
CREATE INDEX "WhatsAppWebhook_eventType_idx" ON "public"."WhatsAppWebhook"("eventType");

-- CreateIndex
CREATE INDEX "WhatsAppWebhook_processed_idx" ON "public"."WhatsAppWebhook"("processed");

-- CreateIndex
CREATE INDEX "Sucursal_clinicaId_idx" ON "public"."Sucursal"("clinicaId");

-- CreateIndex
CREATE INDEX "Sucursal_estado_idx" ON "public"."Sucursal"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "FichaMedica_pacienteId_key" ON "public"."FichaMedica"("pacienteId");

-- CreateIndex
CREATE INDEX "FichaMedica_pacienteId_idx" ON "public"."FichaMedica"("pacienteId");

-- CreateIndex
CREATE INDEX "FichaMedica_clinicaId_idx" ON "public"."FichaMedica"("clinicaId");

-- CreateIndex
CREATE INDEX "FichaMedicaHistorial_pacienteId_idx" ON "public"."FichaMedicaHistorial"("pacienteId");

-- CreateIndex
CREATE INDEX "FichaMedicaHistorial_clinicaId_idx" ON "public"."FichaMedicaHistorial"("clinicaId");

-- CreateIndex
CREATE INDEX "FichaMedicaHistorial_version_idx" ON "public"."FichaMedicaHistorial"("version");

-- CreateIndex
CREATE INDEX "FichaMedicaHistorial_esVersionActual_idx" ON "public"."FichaMedicaHistorial"("esVersionActual");

-- CreateIndex
CREATE INDEX "FichaMedicaHistorial_fechaCreacion_idx" ON "public"."FichaMedicaHistorial"("fechaCreacion");

-- CreateIndex
CREATE INDEX "FichaMedicaArchivo_fichaHistorialId_idx" ON "public"."FichaMedicaArchivo"("fichaHistorialId");

-- CreateIndex
CREATE INDEX "FichaMedicaArchivo_tipo_idx" ON "public"."FichaMedicaArchivo"("tipo");

-- CreateIndex
CREATE INDEX "ArchivoMedico_fichaMedicaId_idx" ON "public"."ArchivoMedico"("fichaMedicaId");

-- CreateIndex
CREATE INDEX "ImagenMedica_fichaMedicaId_idx" ON "public"."ImagenMedica"("fichaMedicaId");

-- CreateIndex
CREATE INDEX "MedioPago_clinicaId_idx" ON "public"."MedioPago"("clinicaId");

-- CreateIndex
CREATE INDEX "MedioPago_activo_idx" ON "public"."MedioPago"("activo");

-- CreateIndex
CREATE UNIQUE INDEX "MedioPago_nombre_clinicaId_key" ON "public"."MedioPago"("nombre", "clinicaId");

-- CreateIndex
CREATE UNIQUE INDEX "Venta_ventaId_key" ON "public"."Venta"("ventaId");

-- CreateIndex
CREATE INDEX "Venta_clinicaId_idx" ON "public"."Venta"("clinicaId");

-- CreateIndex
CREATE INDEX "Venta_estado_idx" ON "public"."Venta"("estado");

-- CreateIndex
CREATE INDEX "Venta_estadoPago_idx" ON "public"."Venta"("estadoPago");

-- CreateIndex
CREATE INDEX "Venta_fechaCreacion_idx" ON "public"."Venta"("fechaCreacion");

-- CreateIndex
CREATE INDEX "Venta_medioPagoId_idx" ON "public"."Venta"("medioPagoId");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_nombre_key" ON "public"."Plan"("nombre");

-- CreateIndex
CREATE INDEX "Plan_activo_idx" ON "public"."Plan"("activo");

-- CreateIndex
CREATE INDEX "Plan_orden_idx" ON "public"."Plan"("orden");

-- CreateIndex
CREATE INDEX "Plan_popular_idx" ON "public"."Plan"("popular");

-- CreateIndex
CREATE UNIQUE INDEX "Suscripcion_clinicaId_key" ON "public"."Suscripcion"("clinicaId");

-- CreateIndex
CREATE INDEX "Suscripcion_estado_idx" ON "public"."Suscripcion"("estado");

-- CreateIndex
CREATE INDEX "Suscripcion_fechaFin_idx" ON "public"."Suscripcion"("fechaFin");

-- CreateIndex
CREATE INDEX "Suscripcion_fechaTrialFin_idx" ON "public"."Suscripcion"("fechaTrialFin");

-- CreateIndex
CREATE INDEX "Suscripcion_autoRenovar_idx" ON "public"."Suscripcion"("autoRenovar");

-- CreateIndex
CREATE INDEX "HistorialPago_estado_idx" ON "public"."HistorialPago"("estado");

-- CreateIndex
CREATE INDEX "HistorialPago_fechaPago_idx" ON "public"."HistorialPago"("fechaPago");

-- CreateIndex
CREATE INDEX "HistorialPago_suscripcionId_idx" ON "public"."HistorialPago"("suscripcionId");

-- AddForeignKey
ALTER TABLE "public"."Clinica" ADD CONSTRAINT "Clinica_administradorId_fkey" FOREIGN KEY ("administradorId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Mensaje" ADD CONSTRAINT "Mensaje_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "public"."Clinica"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Conversation" ADD CONSTRAINT "Conversation_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "public"."Clinica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatMessage" ADD CONSTRAINT "ChatMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatMessage" ADD CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatMessage" ADD CONSTRAINT "ChatMessage_whatsappMessageId_fkey" FOREIGN KEY ("whatsappMessageId") REFERENCES "public"."WhatsAppMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notificacion" ADD CONSTRAINT "Notificacion_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "public"."Clinica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notificacion" ADD CONSTRAINT "Notificacion_destinatarioId_fkey" FOREIGN KEY ("destinatarioId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "public"."Clinica"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Turno" ADD CONSTRAINT "Turno_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "public"."Clinica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Turno" ADD CONSTRAINT "Turno_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Turno" ADD CONSTRAINT "Turno_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."Professional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Patient" ADD CONSTRAINT "Patient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Professional" ADD CONSTRAINT "Professional_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "public"."Sucursal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Professional" ADD CONSTRAINT "Professional_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Agenda" ADD CONSTRAINT "Agenda_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."Professional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Horario" ADD CONSTRAINT "Horario_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "public"."Clinica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Especialidad" ADD CONSTRAINT "Especialidad_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "public"."Clinica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Tratamiento" ADD CONSTRAINT "Tratamiento_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "public"."Clinica"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProfessionalEspecialidad" ADD CONSTRAINT "ProfessionalEspecialidad_especialidadId_fkey" FOREIGN KEY ("especialidadId") REFERENCES "public"."Especialidad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProfessionalEspecialidad" ADD CONSTRAINT "ProfessionalEspecialidad_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProfessionalTratamiento" ADD CONSTRAINT "ProfessionalTratamiento_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProfessionalTratamiento" ADD CONSTRAINT "ProfessionalTratamiento_tratamientoId_fkey" FOREIGN KEY ("tratamientoId") REFERENCES "public"."Tratamiento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PushNotificationToken" ADD CONSTRAINT "PushNotificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WhatsAppMessage" ADD CONSTRAINT "WhatsAppMessage_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "public"."Clinica"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WhatsAppMessage" ADD CONSTRAINT "WhatsAppMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WhatsAppTemplate" ADD CONSTRAINT "WhatsAppTemplate_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "public"."Clinica"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Sucursal" ADD CONSTRAINT "Sucursal_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "public"."Clinica"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FichaMedica" ADD CONSTRAINT "FichaMedica_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "public"."Clinica"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FichaMedica" ADD CONSTRAINT "FichaMedica_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "public"."Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FichaMedicaHistorial" ADD CONSTRAINT "FichaMedicaHistorial_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "public"."Clinica"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FichaMedicaHistorial" ADD CONSTRAINT "FichaMedicaHistorial_creadoPor_fkey" FOREIGN KEY ("creadoPor") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FichaMedicaHistorial" ADD CONSTRAINT "FichaMedicaHistorial_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "public"."Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FichaMedicaHistorial" ADD CONSTRAINT "FichaMedicaHistorial_fichaMedica_fkey" FOREIGN KEY ("pacienteId") REFERENCES "public"."FichaMedica"("pacienteId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FichaMedicaArchivo" ADD CONSTRAINT "FichaMedicaArchivo_fichaHistorialId_fkey" FOREIGN KEY ("fichaHistorialId") REFERENCES "public"."FichaMedicaHistorial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ArchivoMedico" ADD CONSTRAINT "ArchivoMedico_fichaMedicaId_fkey" FOREIGN KEY ("fichaMedicaId") REFERENCES "public"."FichaMedica"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ImagenMedica" ADD CONSTRAINT "ImagenMedica_fichaMedicaId_fkey" FOREIGN KEY ("fichaMedicaId") REFERENCES "public"."FichaMedica"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MedioPago" ADD CONSTRAINT "MedioPago_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "public"."Clinica"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Venta" ADD CONSTRAINT "Venta_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "public"."Clinica"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Venta" ADD CONSTRAINT "Venta_medioPagoId_fkey" FOREIGN KEY ("medioPagoId") REFERENCES "public"."MedioPago"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Suscripcion" ADD CONSTRAINT "Suscripcion_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "public"."Clinica"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Suscripcion" ADD CONSTRAINT "Suscripcion_planId_fkey" FOREIGN KEY ("planId") REFERENCES "public"."Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HistorialPago" ADD CONSTRAINT "HistorialPago_suscripcionId_fkey" FOREIGN KEY ("suscripcionId") REFERENCES "public"."Suscripcion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HistorialPago" ADD CONSTRAINT "HistorialPago_planId_fkey" FOREIGN KEY ("planId") REFERENCES "public"."Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
