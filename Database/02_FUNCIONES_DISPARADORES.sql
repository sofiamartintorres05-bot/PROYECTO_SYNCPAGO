-- ============================================================
-- TRIGGERS Y FUNCIONES AUTOMÁTICAS
-- ============================================================

-- ------------------------------------------------------------
-- 1. Trigger: Trazabilidad al crear un Gasto
-- ------------------------------------------------------------
-- Define o reemplaza la función que responderá al evento de inserción
CREATE OR REPLACE FUNCTION fn_trg_trazabilidad_insert()
RETURNS TRIGGER AS $$                         -- Indica que esta función será utilizada exclusivamente por un trigger
BEGIN
    -- Inserta un registro inicial en la tabla 'trazabilidad' usando los datos del nuevo gasto
    INSERT INTO trazabilidad (id_gasto, estado, fecha_registro)
    VALUES (NEW.id_gasto, NEW.estado, CURRENT_TIMESTAMP); -- 'NEW' representa la nueva fila que se está insertando en 'gasto'
    
    RETURN NEW;                               -- Retorna la nueva fila para permitir que la operación de INSERT finalice
END;
$$ LANGUAGE plpgsql;                          -- Especifica que la función está escrita en el lenguaje procedural PL/pgSQL

-- Elimina el trigger previo en la tabla 'gasto' si ya existe (evita errores de duplicidad)
DROP TRIGGER IF EXISTS trg_gasto_auto_trazabilidad_insert ON gasto;

-- Crea el disparador asignado a la tabla 'gasto'
CREATE TRIGGER trg_gasto_auto_trazabilidad_insert
AFTER INSERT ON gasto                         -- Se ejecuta INMEDIATAMENTE DESPUÉS de insertar una nueva fila en 'gasto'
FOR EACH ROW                                  -- Se evalúa y dispara individualmente por cada fila insertada
EXECUTE FUNCTION fn_trg_trazabilidad_insert(); -- Llama a la función que realiza la inserción en 'trazabilidad'


-- ------------------------------------------------------------
-- 2. Trigger: Trazabilidad al actualizar estado de un Gasto
-- ------------------------------------------------------------
-- Define o reemplaza la función que auditará cambios de estado al actualizar
CREATE OR REPLACE FUNCTION fn_trg_trazabilidad_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Evalúa si el valor anterior ('OLD.estado') es diferente del nuevo valor ingresado ('NEW.estado')
    -- 'IS DISTINCT FROM' maneja comparaciones de forma segura incluso si hay valores nulos (NULL)
    IF OLD.estado IS DISTINCT FROM NEW.estado THEN
        -- Si el estado cambió, registra el nuevo estado con la fecha/hora exacta del cambio
        INSERT INTO trazabilidad (id_gasto, estado, fecha_registro)
        VALUES (NEW.id_gasto, NEW.estado, CURRENT_TIMESTAMP);
    END IF;
    
    RETURN NEW;                               -- Retorna la fila modificada para concretar la actualización
END;
$$ LANGUAGE plpgsql;

-- Elimina el trigger previo de actualización si existe
DROP TRIGGER IF EXISTS trg_gasto_auto_trazabilidad_update ON gasto;

-- Crea el disparador de actualización en la tabla 'gasto'
CREATE TRIGGER trg_gasto_auto_trazabilidad_update
AFTER UPDATE ON gasto                         -- Se ejecuta INMEDIATAMENTE DESPUÉS de hacer un UPDATE en 'gasto'
FOR EACH ROW                                  -- Se evalúa por cada fila que haya sido actualizada
EXECUTE FUNCTION fn_trg_trazabilidad_update(); -- Ejecuta la función de auditoría


-- ------------------------------------------------------------
-- 3. Trigger: Recordatorio por defecto de 120 minutos al insertar Gasto
-- ------------------------------------------------------------
-- Define o reemplaza la función para automatizar la creación de alertas
CREATE OR REPLACE FUNCTION fn_trg_crear_recordatorio_defecto()
RETURNS TRIGGER AS $$
BEGIN
    -- Genera automáticamente un recordatorio asociado al ID del nuevo gasto con 120 min (2h) de antelación
    INSERT INTO recordatorio (id_gasto, tiempo_antelacion)
    VALUES (NEW.id_gasto, 120);              -- Utiliza 'NEW.id_gasto' generado por la inserción en 'gasto'
    
    RETURN NEW;                               -- Permite completar la inserción
END;
$$ LANGUAGE plpgsql;

-- Elimina el trigger previo de recordatorios si existe
DROP TRIGGER IF EXISTS trg_gasto_auto_recordatorio ON gasto;

-- Crea el disparador de recordatorio automático en la tabla 'gasto'
CREATE TRIGGER trg_gasto_auto_recordatorio
AFTER INSERT ON gasto                         -- Se ejecuta INMEDIATAMENTE DESPUÉS de insertar el gasto
FOR EACH ROW                                  -- Se dispara una vez por cada gasto registrado
EXECUTE FUNCTION fn_trg_crear_recordatorio_defecto(); -- Llama a la función que asigna los 120 minutos por defecto