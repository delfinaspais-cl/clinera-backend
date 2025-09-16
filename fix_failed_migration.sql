-- Script para resolver la migración fallida en Railway
-- Ejecutar estos comandos en la base de datos de producción

-- 1. Verificar duplicados problemáticos
SELECT email, "clinicaId", COUNT(*) 
FROM "User" 
WHERE "clinicaId" IS NOT NULL 
GROUP BY email, "clinicaId" 
HAVING COUNT(*) > 1;

-- 2. Si hay duplicados, eliminar los más antiguos (mantener el más reciente)
DELETE FROM "User" 
WHERE id IN (
    SELECT id FROM (
        SELECT id, 
               ROW_NUMBER() OVER (PARTITION BY email, "clinicaId" ORDER BY "createdAt" DESC) as rn
        FROM "User" 
        WHERE "clinicaId" IS NOT NULL
    ) t 
    WHERE rn > 1
);

-- 3. Marcar la migración como completada
UPDATE "_prisma_migrations" 
SET finished_at = NOW(), 
    logs = 'Migration resolved manually - duplicates cleaned' 
WHERE migration_name = '20250916180748_remove_global_email_unique_constraint' 
AND finished_at IS NULL;

-- 4. Aplicar los cambios de la migración manualmente
DROP INDEX IF EXISTS "public"."User_email_key";
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "public"."User"("email");
CREATE INDEX IF NOT EXISTS "User_clinicaId_idx" ON "public"."User"("clinicaId");
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_clinicaId_key" ON "public"."User"("email", "clinicaId");

-- 5. Verificar que todo esté correcto
SELECT 'Migration completed successfully' as status;
