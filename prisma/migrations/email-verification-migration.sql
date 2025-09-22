-- Migración para agregar tablas de verificación de email
-- Ejecutar este script en la base de datos

-- Crear tabla de verificaciones de email
CREATE TABLE "EmailVerification" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "EmailVerification_pkey" PRIMARY KEY ("id")
);

-- Crear tabla de límites de verificación
CREATE TABLE "EmailVerificationLimit" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "lastAttempt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blockedUntil" TIMESTAMP(3),

    CONSTRAINT "EmailVerificationLimit_pkey" PRIMARY KEY ("id")
);

-- Crear índices para optimización
CREATE INDEX "idx_email_verifications_email" ON "EmailVerification"("email");
CREATE INDEX "idx_email_verifications_code" ON "EmailVerification"("code");
CREATE INDEX "idx_email_verifications_expires" ON "EmailVerification"("expiresAt");

CREATE INDEX "idx_email_limits_email" ON "EmailVerificationLimit"("email");
CREATE INDEX "idx_email_limits_ip" ON "EmailVerificationLimit"("ipAddress");

-- Crear índice único compuesto
CREATE UNIQUE INDEX "EmailVerificationLimit_email_ipAddress_key" ON "EmailVerificationLimit"("email", "ipAddress");

-- Comentarios para documentación
COMMENT ON TABLE "EmailVerification" IS 'Tabla para almacenar códigos de verificación de email';
COMMENT ON TABLE "EmailVerificationLimit" IS 'Tabla para controlar límites de envío de códigos de verificación';
