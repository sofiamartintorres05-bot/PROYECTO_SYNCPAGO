-- ============================================================
-- FUNCIÓN: ACTUALIZAR GASTOS VENCIDOS AUTOMÁTICAMENTE
-- ============================================================
-- No es un trigger (no hay evento de escritura que la dispare sola).
-- Es una función que el backend llama periódicamente (cada 12h o
-- en periodos más cortos, configurable). Al hacer el UPDATE, SÍ
-- dispara el trigger existente trg_gasto_auto_trazabilidad_update,
-- así que cada cambio queda auditado automáticamente.

CREATE OR REPLACE FUNCTION fn_actualizar_gastos_vencidos()
RETURNS void AS $$
BEGIN
    UPDATE gasto
    SET estado = 'vencido'
    WHERE estado = 'pendiente'
      AND fecha_vencimiento < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Prueba manual (opcional, para verificar que funciona antes de integrarla):
-- SELECT fn_actualizar_gastos_vencidos();
-- SELECT * FROM gasto WHERE estado = 'vencido';
-- SELECT * FROM trazabilidad ORDER BY fecha_registro DESC LIMIT 5;