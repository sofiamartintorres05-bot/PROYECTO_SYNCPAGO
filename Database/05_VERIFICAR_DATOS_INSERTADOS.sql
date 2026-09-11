-- ============================================================
-- VERIFICACIÓN RÁPIDA DEL ESTADO DE TABLAS
-- ============================================================

SELECT 'usuarios' AS tabla, COUNT(*) AS total_registros FROM usuarios
UNION ALL
SELECT 'tipo_gasto', COUNT(*) FROM tipo_gasto
UNION ALL
SELECT 'gasto', COUNT(*) FROM gasto
UNION ALL
SELECT 'recordatorio', COUNT(*) FROM recordatorio
UNION ALL
SELECT 'trazabilidad', COUNT(*) FROM trazabilidad
UNION ALL
SELECT 'finanzas', COUNT(*) FROM finanzas;