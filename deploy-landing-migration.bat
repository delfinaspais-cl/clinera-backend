@echo off
echo ========================================
echo Aplicando migración de campos de landing
echo ========================================
echo.

echo IMPORTANTE: Necesitas tener configurada la variable DATABASE_URL
echo con la URL de tu base de datos de Railway
echo.

pause

npx prisma db push

echo.
echo ========================================
echo Migración completada
echo ========================================
pause

