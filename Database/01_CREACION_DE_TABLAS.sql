- ============================================================
-- 1. CREACIÓN DE TABLAS
-- ============================================================

-- Tabla 1: usuarios
CREATE TABLE usuarios (
    id_usuario     BIGSERIAL PRIMARY KEY,
    telefono       VARCHAR(20),
    nombre         VARCHAR(100) NOT NULL,
    correo         VARCHAR(100) NOT NULL UNIQUE,
    contrasena     VARCHAR(255) NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla 2: tipo_gasto
CREATE TABLE tipo_gasto (
    id_tipo    BIGSERIAL PRIMARY KEY,
    id_usuario BIGINT NOT NULL,
    clase      VARCHAR(50) CHECK (clase IN ('vital', 'entretenimiento', 'varios')),
    detalle    VARCHAR(150) NOT NULL,

    CONSTRAINT fk_tipo_gasto_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

-- Tabla 3: gasto (CORREGIDO: TIMESTAMP para hora exacta)
CREATE TABLE gasto (
    id_gasto          BIGSERIAL PRIMARY KEY,
    id_tipo           BIGINT NOT NULL,
    fecha_vencimiento TIMESTAMP NOT NULL,
    precio            NUMERIC(12,2) NOT NULL CHECK (precio >= 0),
    estado            VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagado', 'vencido', 'cancelado')),
    fecha_registro    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_gasto_tipo
        FOREIGN KEY (id_tipo)
        REFERENCES tipo_gasto(id_tipo)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

-- Tabla 4: recordatorio
CREATE TABLE recordatorio (
    id_recordatorio   BIGSERIAL PRIMARY KEY,
    id_gasto          BIGINT NOT NULL,
    tiempo_antelacion INT NOT NULL DEFAULT 120 CHECK (tiempo_antelacion > 0),

    CONSTRAINT fk_recordatorio_gasto
        FOREIGN KEY (id_gasto)
        REFERENCES gasto(id_gasto)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

-- Tabla 5: trazabilidad
CREATE TABLE trazabilidad (
    id_trazabilidad BIGSERIAL PRIMARY KEY,
    id_gasto        BIGINT NOT NULL,
    estado          VARCHAR(20) NOT NULL,
    fecha_registro  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_trazabilidad_gasto
        FOREIGN KEY (id_gasto)
        REFERENCES gasto(id_gasto)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT ck_trazabilidad_estado
        CHECK (estado IN ('pendiente', 'pagado', 'vencido', 'cancelado'))
);

-- Tabla 6: finanzas
CREATE TABLE finanzas (
    id_finanza         BIGSERIAL PRIMARY KEY,
    id_usuario         BIGINT NOT NULL,
    fecha              DATE NOT NULL DEFAULT CURRENT_DATE,
    entrada_dinero     NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (entrada_dinero >= 0),
    presupuesto_gastos NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (presupuesto_gastos >= 0),

    CONSTRAINT fk_finanzas_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);
