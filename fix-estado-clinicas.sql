-- ========================================
-- Migración: Actualizar estado de clínicas
-- De: 'activo' a 'activa' (femenino)
-- Fecha: 2025-10-10
-- ========================================

-- Mostrar clínicas que serán actualizadas
SELECT 
    id, 
    name, 
    estado as estado_actual,
    'activa' as nuevo_estado
FROM "Clinica" 
WHERE estado = 'activo';

-- Actualizar todas las clínicas de 'activo' a 'activa'
UPDATE "Clinica" 
SET estado = 'activa',
    "updatedAt" = NOW()
WHERE estado = 'activo';

-- Verificar resultados
SELECT 
    estado, 
    COUNT(*) as cantidad
FROM "Clinica" 
GROUP BY estado
ORDER BY cantidad DESC;

-- Mostrar resumen
SELECT 
    'Migración completada' as status,
    COUNT(*) as total_clinicas_activas
FROM "Clinica" 
WHERE estado = 'activa';

