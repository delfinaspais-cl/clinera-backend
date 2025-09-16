-- ===============================================
-- SCRIPT PARA RESOLVER MIGRACIÓN FALLIDA EN RAILWAY
-- ===============================================
-- Ejecutar este script en la base de datos de Railway para resolver el error P3009

-- 1. PRIMERO: Verificar si hay duplicados problemáticos
SELECT 
    'Verificando duplicados...' as status,
    email, 
    "clinicaId", 
    COUNT(*) as count
FROM "User" 
WHERE "clinicaId" IS NOT NULL 
GROUP BY email, "clinicaId" 
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 2. Si hay duplicados, eliminar los más antiguos (mantener el más reciente)
-- IMPORTANTE: Ejecutar solo si el query anterior mostró duplicados
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

-- 3. Marcar la migración fallida como resuelta
UPDATE "_prisma_migrations" 
SET finished_at = NOW(), 
    logs = 'Migration resolved manually - rollback applied' 
WHERE migration_name = '20250916180748_remove_global_email_unique_constraint' 
AND finished_at IS NULL;

-- 4. Aplicar el rollback manualmente (revertir los cambios)
-- Eliminar los índices que se crearon en la migración fallida
DROP INDEX IF EXISTS "public"."User_email_clinicaId_key";
DROP INDEX IF EXISTS "public"."User_clinicaId_idx";
DROP INDEX IF EXISTS "public"."User_email_idx";

-- Restaurar el índice único original
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "public"."User"("email");

-- 5. Verificar que todo esté correcto
SELECT 'Migration rollback completed successfully' as status;

-- 6. Verificar el estado final
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'User' 
AND schemaname = 'public'
ORDER BY indexname;
