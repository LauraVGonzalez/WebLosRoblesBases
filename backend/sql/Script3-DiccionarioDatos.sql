/* ==========================================================
   SCRIPT 3 - MANEJO DEL DICCIONARIO DE DATOS
   Proyecto: Sistema de reservas Club Los Robles
   Objetivo:
     - Consultar la información de las tablas, columnas,
       restricciones, índices, triggers, vistas y secuencias
       usando el diccionario de datos de Oracle.
   ========================================================== */

--------------------------------------------------------------
-- 1. LISTAR TODAS LAS TABLAS DEL ESQUEMA
--    (incluye TBL_USUARIO, TBL_CLIENTE, etc.)
--------------------------------------------------------------
SELECT table_name
  FROM user_tables
 ORDER BY table_name;


--------------------------------------------------------------
-- 2. COLUMNAS DE LAS TABLAS PRINCIPALES DEL PROYECTO
--------------------------------------------------------------

-- 2.1 Columnas de TBL_USUARIO
SELECT column_name,
       data_type,
       data_length,
       nullable
  FROM user_tab_columns
 WHERE table_name = 'TBL_USUARIO'
 ORDER BY column_id;

-- 2.2 Columnas de TBL_CLIENTE
SELECT column_name,
       data_type,
       data_length,
       nullable
  FROM user_tab_columns
 WHERE table_name = 'TBL_CLIENTE'
 ORDER BY column_id;

-- 2.3 Columnas de TBL_ADMINISTRADOR
SELECT column_name,
       data_type,
       data_length,
       nullable
  FROM user_tab_columns
 WHERE table_name = 'TBL_ADMINISTRADOR'
 ORDER BY column_id;

-- 2.4 Columnas de TBL_TIPO_CANCHA
SELECT column_name,
       data_type,
       data_length,
       nullable
  FROM user_tab_columns
 WHERE table_name = 'TBL_TIPO_CANCHA'
 ORDER BY column_id;

-- 2.5 Columnas de TBL_CANCHA
SELECT column_name,
       data_type,
       data_length,
       nullable
  FROM user_tab_columns
 WHERE table_name = 'TBL_CANCHA'
 ORDER BY column_id;

-- 2.6 Columnas de TBL_RESERVA
SELECT column_name,
       data_type,
       data_length,
       nullable
  FROM user_tab_columns
 WHERE table_name = 'TBL_RESERVA'
 ORDER BY column_id;

-- 2.7 Columnas de TBL_RESERVA_TERCEROS
SELECT column_name,
       data_type,
       data_length,
       nullable
  FROM user_tab_columns
 WHERE table_name = 'TBL_RESERVA_TERCEROS'
 ORDER BY column_id;

-- 2.8 Columnas de TBL_IMPLEMENTO
SELECT column_name,
       data_type,
       data_length,
       nullable
  FROM user_tab_columns
 WHERE table_name = 'TBL_IMPLEMENTO'
 ORDER BY column_id;

-- 2.9 Columnas de TBL_ALQUILA
SELECT column_name,
       data_type,
       data_length,
       nullable
  FROM user_tab_columns
 WHERE table_name = 'TBL_ALQUILA'
 ORDER BY column_id;


--------------------------------------------------------------
-- 3. RESTRICCIONES (PK, FK, UNIQUE, CHECK) DE LAS TABLAS
--------------------------------------------------------------

-- Resumen de restricciones de las tablas principales
SELECT constraint_name,
       constraint_type,
       table_name,
       status
  FROM user_constraints
 WHERE table_name IN (
        'TBL_USUARIO',
        'TBL_CLIENTE',
        'TBL_ADMINISTRADOR',
        'TBL_TIPO_CANCHA',
        'TBL_CANCHA',
        'TBL_RESERVA',
        'TBL_RESERVA_TERCEROS',
        'TBL_IMPLEMENTO',
        'TBL_ALQUILA'
       )
 ORDER BY table_name, constraint_type, constraint_name;

-- Detalle de columnas por restricción (ejemplo: TBL_RESERVA)
SELECT c.constraint_name,
       c.constraint_type,
       col.column_name,
       c.table_name
  FROM user_constraints c
  JOIN user_cons_columns col
    ON c.constraint_name = col.constraint_name
 WHERE c.table_name = 'TBL_RESERVA'
 ORDER BY c.constraint_name, col.position;


--------------------------------------------------------------
-- 4. ÍNDICES DEFINIDOS EN EL ESQUEMA
--    (incluye índice basado en función IDX_USUARIO_CORREO_UPPER)
--------------------------------------------------------------
SELECT index_name,
       table_name,
       uniqueness
  FROM user_indexes
 ORDER BY table_name, index_name;

-- Columnas de cada índice (ejemplo para TBL_USUARIO)
SELECT index_name,
       column_name,
       column_position
  FROM user_ind_columns
 WHERE table_name = 'TBL_USUARIO'
 ORDER BY index_name, column_position;


--------------------------------------------------------------
-- 5. TRIGGERS DEL PROYECTO
--    (básicos, INSTEAD OF, compuestos, de negocio)
--------------------------------------------------------------
SELECT trigger_name,
       table_name,
       triggering_event,
       status
  FROM user_triggers
 WHERE table_name IN (
        'TBL_USUARIO',
        'TBL_CLIENTE',
        'TBL_ADMINISTRADOR',
        'TBL_TIPO_CANCHA',
        'TBL_CANCHA',
        'TBL_RESERVA',
        'TBL_RESERVA_TERCEROS',
        'TBL_IMPLEMENTO',
        'TBL_ALQUILA'
       )
 ORDER BY table_name, trigger_name;

-- Ver el tipo de trigger (BEFORE/AFTER/INSTEAD OF) y el body
-- NOTA: aquí solo se muestra la cabecera y el tipo; el cuerpo
-- se podría ver con USER_SOURCE.
SELECT trigger_name,
       description
  FROM user_triggers
 ORDER BY trigger_name;


--------------------------------------------------------------
-- 6. VISTAS DEL ESQUEMA (incluye VW_CLIENTE_DETALLE)
--------------------------------------------------------------
SELECT view_name
  FROM user_views
 ORDER BY view_name;

-- Definición de la vista VW_CLIENTE_DETALLE
SELECT text
  FROM user_views
 WHERE view_name = 'VW_CLIENTE_DETALLE';


--------------------------------------------------------------
-- 7. SECUENCIAS CREADAS PARA EL PROYECTO
--    (SEQ_USUARIO, SEQ_CANCHA, SEQ_RESERVA, etc.)
--------------------------------------------------------------
SELECT sequence_name,
       min_value,
       max_value,
       increment_by,
       last_number
  FROM user_sequences
 ORDER BY sequence_name;


--------------------------------------------------------------
-- 8. CÓDIGO FUENTE PL/SQL: PAQUETES DEL PROYECTO
--    (PKG_USUARIOS, PKG_RESERVAS, PKG_CLUB_APP)
--------------------------------------------------------------
SELECT name,
       type,
       line,
       text
  FROM user_source
 WHERE name IN ('PKG_USUARIOS', 'PKG_RESERVAS', 'PKG_CLUB_APP')
 ORDER BY name, type, line;
