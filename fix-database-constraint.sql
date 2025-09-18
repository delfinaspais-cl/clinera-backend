-- Script para corregir la restricción única en la base de datos
-- Eliminar la restricción única global en email
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_email_key";

-- Crear la restricción única compuesta (email, clinicaId)
ALTER TABLE "User" ADD CONSTRAINT "unique_email_per_clinica" UNIQUE ("email", "clinicaId");

-- Verificar que la restricción se aplicó correctamente
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'User'::regclass 
AND conname LIKE '%email%';
