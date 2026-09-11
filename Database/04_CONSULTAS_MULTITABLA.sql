-- ============================================================
-- CONSULTAS AVANZADAS / REPORTES MULTITABLA
-- ============================================================

-- ------------------------------------------------------------
-- 1. Detalle completo de Gastos con Usuario y Categoria
-- ------------------------------------------------------------
SELECT 
    u.id_usuario,                            
    u.nombre AS usuario,                      
    tg.clase,                                
    tg.detalle AS categoria,                  
    g.id_gasto,                               
    g.precio,                                     
    g.estado,                                 
    g.fecha_vencimiento                       
FROM gasto g                                  -- Define la tabla 'gasto' como origen principal asignándole el alias 'g'
INNER JOIN tipo_gasto tg ON g.id_tipo = tg.id_tipo -- Une los gastos con sus tipos mediante la llave foránea 'id_tipo'
INNER JOIN usuarios u ON tg.id_usuario = u.id_usuario -- Une los tipos de gasto con la tabla de usuarios por su 'id_usuario'
ORDER BY u.nombre, g.fecha_vencimiento;       -- Ordena el resultado alfabéticamente por usuario y luego por fecha de vencimiento


-- ------------------------------------------------------------
-- 2. Alertas de Recordatorios con hora calculada de disparo
-- ------------------------------------------------------------
SELECT 
    u.nombre AS usuario,                      -- Selecciona el nombre del usuario a notificar
    tg.detalle AS gasto,                      -- Selecciona la descripción del gasto pendiente
    g.fecha_vencimiento,                      -- Muestra la fecha exacta en que vence la obligación
    r.tiempo_antelacion AS minutos_antes,     -- Muestra los minutos configurados para emitir la alerta previa
    -- Concatena los minutos con texto, los convierte a INTERVAL y los resta a la fecha límite para hallar la hora del envío
    (g.fecha_vencimiento - (r.tiempo_antelacion || ' minutes')::INTERVAL) AS fecha_hora_notificacion
FROM recordatorio r                           -- Define la tabla 'recordatorio' como la fuente principal asignándole el alias 'r'
INNER JOIN gasto g ON r.id_gasto = g.id_gasto -- Une cada recordatorio con su gasto correspondiente
INNER JOIN tipo_gasto tg ON g.id_tipo = tg.id_tipo -- Relaciona el gasto con la categoría a la que pertenece
INNER JOIN usuarios u ON tg.id_usuario = u.id_usuario -- Relaciona la categoría con los datos del usuario responsable
WHERE g.estado = 'pendiente'                  -- Filtra los resultados para procesar únicamente gastos sin pagar
ORDER BY fecha_hora_notificacion ASC;         -- Ordena las alertas cronológicamente desde la más próxima a la más lejana


-- ------------------------------------------------------------
-- 3. Balance Financiero: Presupuesto vs Gastos acumulados por mes y usuario
-- ------------------------------------------------------------
SELECT 
    u.nombre AS usuario,                      -- Nombre del usuario evaluado
    f.fecha AS mes_evaluado,                  -- Fecha que representa el periodo/mes registrado en finanzas
    f.entrada_dinero,                         -- Total de ingresos declarados en el periodo
    f.presupuesto_gastos,                     -- Límite total de dinero destinado a gastos para ese mes
    COALESCE(SUM(g.precio), 0) AS total_gastado, -- Suma los precios de los gastos del mes; si no hay gastos devuelve 0
    -- Resta el total consumido al presupuesto configurado para obtener el remanente disponible
    (f.presupuesto_gastos - COALESCE(SUM(g.precio), 0)) AS disponible_presupuesto
FROM finanzas f                               -- Parte de la tabla 'finanzas' (alias 'f') como origen de los presupuestos
INNER JOIN usuarios u ON f.id_usuario = u.id_usuario -- Vincula las finanzas con el dueño de la cuenta
LEFT JOIN tipo_gasto tg ON u.id_usuario = tg.id_usuario -- Incluye las categorías asociadas al usuario (incluso si no hay gastos)
LEFT JOIN gasto g ON tg.id_tipo = g.id_tipo   -- Une las categorías con sus gastos, filtrando solo aquellos cuya...
    AND DATE_TRUNC('month', g.fecha_vencimiento) = DATE_TRUNC('month', f.fecha) -- ...fecha coincida en año y mes con el registro financiero
GROUP BY u.nombre, f.id_finanza, f.fecha, f.entrada_dinero, f.presupuesto_gastos -- Agrupa por usuario y balance mensual para calcular las sumas
ORDER BY f.fecha DESC, u.nombre;              -- Muestra primero los meses más recientes y luego los nombres en orden alfabético


-- ------------------------------------------------------------
-- 4. Historial de Trazabilidad por Gasto y Usuario
-- ------------------------------------------------------------
SELECT 
    u.nombre AS usuario,                      -- Muestra el nombre del usuario asociado a la auditoría
    tg.detalle AS gasto,                      -- Muestra la descripción del gasto al que se le registró el cambio
    t.estado AS estado_registrado,            -- Captura el estado en que quedó el gasto en ese instante ('pendiente', 'pagado', etc.)
    t.fecha_registro AS fecha_cambio          -- Muestra el sello de tiempo (timestamp) en que el trigger creó este registro
FROM trazabilidad t                           -- Inicia desde la tabla 'trazabilidad' (alias 't') como historial de cambios
INNER JOIN gasto g ON t.id_gasto = g.id_gasto -- Asocia la fila de trazabilidad con el gasto afectado
INNER JOIN tipo_gasto tg ON g.id_tipo = tg.id_tipo -- Obtiene el detalle o categoría correspondiente a dicho gasto
INNER JOIN usuarios u ON tg.id_usuario = u.id_usuario -- Conecta con la tabla de usuarios para saber a quién pertenece el evento
ORDER BY t.fecha_registro DESC;               -- Ordena la auditoría mostrando los eventos más recientes al principio


-- ------------------------------------------------------------
-- 5. Actualizar estado de gasto
-- ------------------------------------------------------------

UPDATE gasto 
SET estado = 'pendiente' 
WHERE id_gasto = 1;

-- 5.2. Consultar la trazabilidad para verificar que el trigger registró el cambio
SELECT 
    u.nombre AS usuario,
    tg.detalle AS gasto,
    t.estado AS estado_registrado,
    TO_CHAR(t.fecha_registro, 'YYYY-MM-DD HH24:MI:SS') AS fecha_cambio
FROM trazabilidad t
INNER JOIN gasto g ON t.id_gasto = g.id_gasto
INNER JOIN tipo_gasto tg ON g.id_tipo = tg.id_tipo
INNER JOIN usuarios u ON tg.id_usuario = u.id_usuario
WHERE g.id_gasto = 1
ORDER BY t.fecha_registro DESC;
