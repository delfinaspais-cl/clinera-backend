-- Migración: Agregar campos de landing page a la tabla Clinica
-- Campos: titulo, subtitulo, comentariosHTML
-- Fecha: 2025-10-10

-- Agregar columna titulo
ALTER TABLE "Clinica" 
ADD COLUMN IF NOT EXISTS "titulo" TEXT;

-- Agregar columna subtitulo
ALTER TABLE "Clinica" 
ADD COLUMN IF NOT EXISTS "subtitulo" TEXT;

-- Agregar columna comentariosHTML para testimonios/comentarios de clientes
ALTER TABLE "Clinica" 
ADD COLUMN IF NOT EXISTS "comentariosHTML" TEXT;

-- Actualizar clínicas existentes con valores por defecto opcionales
-- (Opcional - solo si quieres valores iniciales)
-- UPDATE "Clinica" 
-- SET 
--   titulo = name,
--   subtitulo = descripcion
-- WHERE titulo IS NULL;

-- Verificar que las columnas se crearon
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'Clinica' 
AND column_name IN ('titulo', 'subtitulo', 'comentariosHTML')
ORDER BY column_name;

