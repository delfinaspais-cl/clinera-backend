-- Migration for subscription system
-- This migration adds the updated Plan and Suscripcion models

-- Update Plan table to include new fields
ALTER TABLE "Plan" 
ADD COLUMN IF NOT EXISTS "tagline" TEXT,
ADD COLUMN IF NOT EXISTS "popular" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "icono" TEXT;

-- Create index for popular field
CREATE INDEX IF NOT EXISTS "Plan_popular_idx" ON "Plan"("popular");

-- Update Suscripcion table to include new fields
ALTER TABLE "Suscripcion" 
ADD COLUMN IF NOT EXISTS "trialDias" INTEGER NOT NULL DEFAULT 7,
ADD COLUMN IF NOT EXISTS "autoRenovar" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "canceladoEn" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "motivoCancelacion" TEXT,
ADD COLUMN IF NOT EXISTS "metadata" JSONB;

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS "Suscripcion_autoRenovar_idx" ON "Suscripcion"("autoRenovar");

-- Update existing records to have proper default values
UPDATE "Plan" SET "popular" = false WHERE "popular" IS NULL;
UPDATE "Suscripcion" SET "trialDias" = 7 WHERE "trialDias" IS NULL;
UPDATE "Suscripcion" SET "autoRenovar" = true WHERE "autoRenovar" IS NULL;

-- Insert the three default plans if they don't exist
INSERT INTO "Plan" (
  "id", "nombre", "tagline", "descripcion", "precio", "moneda", 
  "intervalo", "activo", "popular", "orden", "caracteristicas", "limitaciones", 
  "createdAt", "updatedAt"
) VALUES 
(
  'core-plan-default',
  'CORE',
  'Agenda + Ventas',
  'Plan básico con funcionalidades esenciales de agenda y ventas',
  70.00,
  'USD',
  'monthly',
  true,
  false,
  1,
  ARRAY[
    'Agenda 24/7',
    'Vista calendario y agenda',
    'Panel de ventas básico',
    'Gestión de clientes',
    'Gestión de citas'
  ],
  '{"profesionales": 3, "uam": 1000, "extraProfesional": 10, "extraUam": 0.25, "almacenamiento": "1GB"}'::jsonb,
  NOW(),
  NOW()
),
(
  'flow-plan-default',
  'FLOW',
  'Agenda + Ventas + Mensajería',
  'Plan intermedio que incluye mensajería omnicanal y plantillas WhatsApp',
  120.00,
  'USD',
  'monthly',
  true,
  true,
  2,
  ARRAY[
    'Todo CORE',
    'Mensajería omnicanal',
    'Plantillas WhatsApp HSM',
    'Embudo de contactos y etapas',
    'Webhook de WhatsApp',
    'Gestión de citas desde el chat'
  ],
  '{"profesionales": 3, "uam": 2000, "extraProfesional": 15, "extraUam": 0.25, "almacenamiento": "2GB"}'::jsonb,
  NOW(),
  NOW()
),
(
  'nexus-plan-default',
  'NEXUS',
  'FLOW + IA + API + Builder',
  'Plan avanzado con IA, APIs y herramientas de construcción avanzadas',
  180.00,
  'USD',
  'monthly',
  true,
  false,
  3,
  ARRAY[
    'Todo FLOW',
    'Asistente IA en chat',
    'API y webhooks para integraciones',
    'Creador de embudos avanzado',
    'Reportes y paneles avanzados'
  ],
  '{"profesionales": 3, "uam": 3000, "extraProfesional": 20, "extraUam": 0.25, "almacenamiento": "5GB"}'::jsonb,
  NOW(),
  NOW()
)
ON CONFLICT ("nombre") DO NOTHING;

-- Update existing Clinica records to have proper estadoPago
UPDATE "Clinica" SET "estadoPago" = 'trial' WHERE "estadoPago" IS NULL;

-- Create default trial subscriptions for existing clinics that don't have one
INSERT INTO "Suscripcion" (
  "id", "clinicaId", "planId", "estado", "fechaInicio", "fechaTrialFin", 
  "trialDias", "autoRenovar", "metadata", "createdAt", "updatedAt"
)
SELECT 
  gen_random_uuid()::text as "id",
  c."id" as "clinicaId",
  p."id" as "planId",
  'trial' as "estado",
  NOW() as "fechaInicio",
  NOW() + INTERVAL '7 days' as "fechaTrialFin",
  7 as "trialDias",
  true as "autoRenovar",
  '{"limiteProfesionales": 3, "limiteUam": 1000, "profesionalesUsados": 0, "uamUsadas": 0}'::jsonb as "metadata",
  NOW() as "createdAt",
  NOW() as "updatedAt"
FROM "Clinica" c
CROSS JOIN "Plan" p
WHERE p."nombre" = 'CORE'
  AND c."id" NOT IN (SELECT "clinicaId" FROM "Suscripcion")
  AND c."estadoPago" = 'trial';

-- Update existing subscriptions to have proper metadata if missing
UPDATE "Suscripcion" 
SET "metadata" = '{"limiteProfesionales": 3, "limiteUam": 1000, "profesionalesUsados": 0, "uamUsadas": 0}'::jsonb
WHERE "metadata" IS NULL;
