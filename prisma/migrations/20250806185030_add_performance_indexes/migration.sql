-- Add performance indexes for better query performance

-- Indexes for Turno table (most critical for appointments)
CREATE INDEX "Turno_clinicaId_idx" ON "public"."Turno"("clinicaId");
CREATE INDEX "Turno_fecha_idx" ON "public"."Turno"("fecha");
CREATE INDEX "Turno_estado_idx" ON "public"."Turno"("estado");
CREATE INDEX "Turno_especialidad_idx" ON "public"."Turno"("especialidad");
CREATE INDEX "Turno_doctor_idx" ON "public"."Turno"("doctor");
CREATE INDEX "Turno_email_idx" ON "public"."Turno"("email");

-- Composite indexes for common query patterns
CREATE INDEX "Turno_clinicaId_fecha_idx" ON "public"."Turno"("clinicaId", "fecha");
CREATE INDEX "Turno_clinicaId_estado_idx" ON "public"."Turno"("clinicaId", "estado");
CREATE INDEX "Turno_clinicaId_especialidad_idx" ON "public"."Turno"("clinicaId", "especialidad");

-- Indexes for User table
CREATE INDEX "User_clinicaId_idx" ON "public"."User"("clinicaId");
CREATE INDEX "User_role_idx" ON "public"."User"("role");
CREATE INDEX "User_estado_idx" ON "public"."User"("estado");

-- Indexes for Notificacion table
CREATE INDEX "Notificacion_clinicaId_idx" ON "public"."Notificacion"("clinicaId");
CREATE INDEX "Notificacion_destinatarioId_idx" ON "public"."Notificacion"("destinatarioId");
CREATE INDEX "Notificacion_leida_idx" ON "public"."Notificacion"("leida");
CREATE INDEX "Notificacion_createdAt_idx" ON "public"."Notificacion"("createdAt");

-- Indexes for Mensaje table
CREATE INDEX "Mensaje_clinicaId_idx" ON "public"."Mensaje"("clinicaId");
CREATE INDEX "Mensaje_leido_idx" ON "public"."Mensaje"("leido");
CREATE INDEX "Mensaje_createdAt_idx" ON "public"."Mensaje"("createdAt");
