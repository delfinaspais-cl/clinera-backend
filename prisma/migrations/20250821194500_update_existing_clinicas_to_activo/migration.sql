-- Update existing clinics to be active by default
UPDATE "Clinica" 
SET 
  "estado" = 'activo',
  "pendienteAprobacion" = false,
  "fuente" = 'owner_dashboard'
WHERE "estado" IS NULL OR "estado" = 'activa';

-- Update clinics with 'activa' status to 'activo' for consistency
UPDATE "Clinica" 
SET "estado" = 'activo'
WHERE "estado" = 'activa';
