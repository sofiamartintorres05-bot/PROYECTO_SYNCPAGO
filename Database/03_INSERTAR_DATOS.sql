-- ============================================================
-- SCRIPT DE INSERCIÓN DE DATOS: 03_INSERTAR_DATOS.sql
-- ============================================================

-- 1. Limpieza opcional de tablas (en orden inverso de claves foráneas)
DELETE FROM trazabilidad;
DELETE FROM recordatorio;
DELETE FROM gasto;
DELETE FROM tipo_gasto;
DELETE FROM finanzas;
DELETE FROM usuarios;

-- Reiniciar contadores de ID (opcional para mantener orden numérico)
ALTER SEQUENCE IF EXISTS usuarios_id_usuario_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS tipo_gasto_id_tipo_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS gasto_id_gasto_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS finanzas_id_finanzas_seq RESTART WITH 1;

-- 2. Insertar Usuarios
INSERT INTO usuarios (telefono, nombre, correo, contrasena) VALUES
    ('3001234567', 'Carlos Pérez', 'carlos@gmail.com', '123456'),
    ('3019876543', 'María Gómez', 'maria@gmail.com', '123456'),
    ('3154567890', 'Juan Rodríguez', 'juan@gmail.com', '123456'),
    ('3201112233', 'Laura Martínez', 'laura@gmail.com', '123456')
ON CONFLICT (correo) DO NOTHING;

-- 3. Insertar Tipos de Gasto
INSERT INTO tipo_gasto (id_usuario, clase, detalle) VALUES
    (1, 'entretenimiento', 'Cine y plataformas'),
    (1, 'vital', 'Alimentación'),
    (1, 'vital', 'Servicios públicos'),
    (1, 'varios', 'Compras personales'),
    (2, 'vital', 'Mercado'),
    (2, 'vital', 'Transporte'),
    (2, 'entretenimiento', 'Restaurantes'),
    (3, 'vital', 'Arriendo'),
    (3, 'vital', 'Servicios'),
    (3, 'varios', 'Educación'),
    (4, 'vital', 'Alimentación'),
    (4, 'entretenimiento', 'Viajes');

-- 4. Insertar Gastos
-- NOTA: Al insertar cada fila, los triggers disparan automáticamente 
-- las entradas correspondientes en 'trazabilidad' y 'recordatorio'.
INSERT INTO gasto (id_tipo, fecha_vencimiento, precio, estado) VALUES
    (1, '2026-08-10 23:59:00', 75000.00, 'pagado'),
    (2, '2026-08-15 18:00:00', 450000.00, 'pendiente'),
    (3, '2026-08-20 20:00:00', 180000.00, 'pendiente'),
    (4, '2026-08-25 17:30:00', 120000.00, 'pendiente'),
    (5, '2026-08-18 12:00:00', 380000.00, 'pendiente'),
    (6, '2026-08-16 19:00:00', 150000.00, 'pagado'),
    (7, '2026-08-22 21:00:00', 90000.00, 'pendiente'),
    (8, '2026-08-05 13:00:00', 850000.00, 'pagado'),
    (9, '2026-08-19 18:30:00', 220000.00, 'pendiente'),
    (10, '2026-08-30 23:59:00', 300000.00, 'pendiente'),
    (11, '2026-08-17 14:00:00', 420000.00, 'pendiente'),
    (12, '2026-09-05 16:00:00', 600000.00, 'pendiente');

-- 5. Insertar Finanzas
INSERT INTO finanzas (id_usuario, fecha, entrada_dinero, presupuesto_gastos) VALUES
    (1, '2026-08-01', 3500000.00, 1800000.00),
    (2, '2026-08-01', 2800000.00, 1500000.00),
    (3, '2026-08-01', 4200000.00, 2500000.00),
    (4, '2026-08-01', 3200000.00, 1800000.00);

