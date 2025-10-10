-- Agregar campos de landing page a la tabla Clinica
-- Ejecutar esto en la base de datos de Railway

ALTER TABLE "Clinica" ADD COLUMN IF NOT EXISTS "titulo" TEXT;
ALTER TABLE "Clinica" ADD COLUMN IF NOT EXISTS "subtitulo" TEXT;
ALTER TABLE "Clinica" ADD COLUMN IF NOT EXISTS "comentariosHTML" TEXT;

-- Verificar que se crearon
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Clinica' 
AND column_name IN ('titulo', 'subtitulo', 'comentariosHTML');

