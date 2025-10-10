-- Migración para actualizar el estado de las clínicas de 'activo' a 'activa'
-- Fecha: 2025-10-10

-- Actualizar todas las clínicas que tienen estado 'activo' a 'activa'
UPDATE "Clinica" 
SET estado = 'activa' 
WHERE estado = 'activo';

-- Verificar resultados
-- SELECT COUNT(*) as total_actualizadas FROM "Clinica" WHERE estado = 'activa';

