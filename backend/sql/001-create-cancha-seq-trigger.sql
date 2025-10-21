-- Script: 001-create-cancha-seq-trigger.sql
-- Crea secuencia y trigger para asignar ID automático a la tabla CANCHAS
-- Ejecutar como usuario propietario de la tabla CANCHAS

-- 1) Crear secuencia
CREATE SEQUENCE CANCHAS_SEQ
  START WITH 1
  INCREMENT BY 1
  NOCACHE
  NOCYCLE;

-- 2) Crear trigger BEFORE INSERT que asigna el siguiente valor de la secuencia
CREATE OR REPLACE TRIGGER CANCHAS_BI_TR
BEFORE INSERT ON CANCHAS
FOR EACH ROW
BEGIN
  IF :NEW.ID_CANCHA IS NULL THEN
    SELECT CANCHAS_SEQ.NEXTVAL INTO :NEW.ID_CANCHA FROM DUAL;
  END IF;
END;
/

-- Nota:
-- - Si la tabla CANCHAS ya tiene datos, ajusta START WITH en la secuencia
--   para que sea mayor que el máximo actual: SELECT MAX(ID) FROM CANCHAS;
-- - Ejecuta este script con SQL*Plus, SQLcl o desde tu herramienta de BD con un usuario
--   que tenga permisos para crear secuencias y triggers.
