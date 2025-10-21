-- Script: 002-add-valor-column.sql
-- Añade la columna VALOR a la tabla CANCHAS si no existe
-- Ejecutar como propietario de la tabla CANCHAS

BEGIN
  EXECUTE IMMEDIATE 'ALTER TABLE CANCHAS ADD (VALOR NUMBER DEFAULT 0 NOT NULL)';
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE = -1430 OR SQLCODE = -01430 THEN
      -- columna ya existe (dependiendo de la versión/driver el código puede variar)
      NULL;
    ELSE
      RAISE;
    END IF;
END;
/

-- Nota:
-- - Si quieres permitir NULLs en VALOR o un tipo distinto (DECIMAL), edita la declaración.
-- - Tras ejecutar, verifica:
--     SELECT COLUMN_NAME, DATA_TYPE FROM USER_TAB_COLUMNS WHERE TABLE_NAME='CANCHAS' AND COLUMN_NAME='VALOR';
