


--2) Obtener todos los gastos con detalles del usuario
SELECT 
    g.id_gasto,
    u.nombre AS usuario,
    tg.clase,
    tg.detalle AS categoria,
    g.precio,
    g.estado,
    g.fecha_vencimiento
FROM gasto g
INNER JOIN tipo_gasto tg ON g.id_tipo = tg.id_tipo
INNER JOIN usuarios u ON tg.id_usuario = u.id_usuario
ORDER BY g.fecha_vencimiento DESC;



--3) Filtrar gastos de un usuario específico
SELECT 
    g.id_gasto,
    tg.detalle AS categoria,
    g.precio,
    g.estado,
    g.fecha_vencimiento
FROM gasto g
INNER JOIN tipo_gasto tg ON g.id_tipo = tg.id_tipo
WHERE tg.id_usuario = 1
ORDER BY g.fecha_vencimiento ASC;



--4) Crear un nuevo gasto — el trigger creará el recordatorio y la trazabilidad
INSERT INTO gasto (id_tipo, fecha_vencimiento, precio, estado)
VALUES (1, '2026-09-01 18:00:00', 50000.00, 'pendiente')
RETURNING id_gasto, id_tipo, fecha_vencimiento, precio, estado;


-- 5) Actualizar el estado de un gasto (Ejemplo: id_gasto = 1 a 'pagado')
UPDATE gasto
SET estado = 'pagado'
WHERE id_gasto = 1
RETURNING id_gasto, estado;


-- 6) Eliminar un gasto específico (Ejemplo: id_gasto = 12)
DELETE FROM gasto
WHERE id_gasto = 12;


-- 7) Obtener alertas de usuarios con hora exacta de disparo
SELECT 
    u.nombre AS usuario,
    tg.detalle AS gasto,
    g.fecha_vencimiento,
    r.tiempo_antelacion AS minutos_antes,
    (g.fecha_vencimiento - (r.tiempo_antelacion || ' minutes')::INTERVAL) AS fecha_notificacion
FROM recordatorio r
INNER JOIN gasto g ON r.id_gasto = g.id_gasto
INNER JOIN tipo_gasto tg ON g.id_tipo = tg.id_tipo
INNER JOIN usuarios u ON tg.id_usuario = u.id_usuario
WHERE g.estado = 'pendiente'
ORDER BY fecha_notificacion ASC;


-- 8) Consultar el presupuesto disponible por mes para un usuario (Ejemplo: id_usuario = 1)
SELECT 
    f.fecha AS mes,
    f.entrada_dinero,
    f.presupuesto_gastos,
    COALESCE(SUM(g.precio), 0) AS total_gastado,
    (f.presupuesto_gastos - COALESCE(SUM(g.precio), 0)) AS presupuesto_disponible
FROM finanzas f
LEFT JOIN tipo_gasto tg ON f.id_usuario = tg.id_usuario
LEFT JOIN gasto g ON tg.id_tipo = g.id_tipo 
    AND DATE_TRUNC('month', g.fecha_vencimiento) = DATE_TRUNC('month', f.fecha)
WHERE f.id_usuario = 1
GROUP BY f.id_finanza, f.fecha, f.entrada_dinero, f.presupuesto_gastos
ORDER BY f.fecha DESC;


-- 9) Obtener el historial de cambios de un gasto (Ejemplo: id_gasto = 1)
SELECT 
    t.estado AS estado_registrado,
    TO_CHAR(t.fecha_registro, 'YYYY-MM-DD HH24:MI:SS') AS fecha_cambio
FROM trazabilidad t
WHERE t.id_gasto = 1
ORDER BY t.fecha_registro DESC;