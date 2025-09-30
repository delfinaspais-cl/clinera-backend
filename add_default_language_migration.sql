-- Migración para agregar campo defaultLanguage a la tabla Clinica
-- Ejecutar este script en la base de datos PostgreSQL

-- Agregar la columna defaultLanguage a la tabla Clinica
ALTER TABLE "Clinica" 
ADD COLUMN "defaultLanguage" TEXT DEFAULT 'es';

-- Crear un índice para mejorar el rendimiento de consultas por idioma
CREATE INDEX "Clinica_defaultLanguage_idx" ON "Clinica"("defaultLanguage");

-- Actualizar registros existentes para que tengan el idioma por defecto
UPDATE "Clinica" 
SET "defaultLanguage" = 'es' 
WHERE "defaultLanguage" IS NULL;

-- Comentario: Los valores permitidos son:
-- 'es' para Español
-- 'pt-BR' para Portugués (Brasil)
-- 'en' para Inglés
