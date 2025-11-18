/* ==========================================================
   SCRIPT 2 - PAQUETES Y FUNCIONALIDAD PL/SQL
   Proyecto: Sistema de reservas Club Los Robles
   Contiene:
     - PKG_USUARIOS
     - PKG_RESERVAS
     - PKG_CLUB_APP (paquete “grande”)
   Aquí se usan:
     * Cursores simples y parametrizados
     * Funciones (con y sin parámetros)
     * Procedimientos (con y sin parámetros)
     * Tipos compuestos (registros y colecciones)
     * Estructuras de control (IF, bucles)
     * Manejo de excepciones
     * Manejo de transacciones explícitas (SAVEPOINT / COMMIT / ROLLBACK)
   ========================================================== */


--------------------------------------------------------------
-- PAQUETE PKG_USUARIOS
-- Gestión básica de usuarios:
--  - Procedimiento AGREGAR_USUARIO: inserta un usuario nuevo.
--  - Función CONTAR_ACTIVOS: retorna número de usuarios activos.
--  - Cursor C_USUARIOS_INACTIVOS: usuarios con ESTADO = 'INACTIVO'.
--------------------------------------------------------------

CREATE OR REPLACE PACKAGE PKG_USUARIOS AS
   -----------------------------------------------------------------
   -- Excepciones propias del paquete
   -----------------------------------------------------------------
   e_usuario_duplicado      EXCEPTION;
   e_error_insert_usuario   EXCEPTION;
   e_error_contar_activos   EXCEPTION;

   -----------------------------------------------------------------
   -- Procedimiento AGREGAR_USUARIO
   -- Inserta un usuario con datos básicos y contraseña por defecto.
   -- Parámetros:
   --   p_primer_nombre   : nombre del usuario
   --   p_primer_apellido : apellido del usuario
   --   p_correo          : correo electrónico
   --   p_estado          : estado del usuario (ACTIVO / INACTIVO)
   -----------------------------------------------------------------
   PROCEDURE AGREGAR_USUARIO (
      p_primer_nombre    IN TBL_USUARIO.PRIMER_NOMBRE%TYPE,
      p_primer_apellido  IN TBL_USUARIO.PRIMER_APELLIDO%TYPE,
      p_correo           IN TBL_USUARIO.CORREO%TYPE,
      p_estado           IN TBL_USUARIO.ESTADO%TYPE DEFAULT 'ACTIVO'
   );

   -----------------------------------------------------------------
   -- Función CONTAR_ACTIVOS
   -- Retorna el número total de usuarios con ESTADO = 'ACTIVO'.
   -----------------------------------------------------------------
   FUNCTION CONTAR_ACTIVOS
      RETURN NUMBER;

   -----------------------------------------------------------------
   -- Cursor C_USUARIOS_INACTIVOS (simple)
   -- Retorna todos los usuarios que estén en estado 'INACTIVO'.
   -----------------------------------------------------------------
   CURSOR C_USUARIOS_INACTIVOS IS
      SELECT *
        FROM TBL_USUARIO
       WHERE ESTADO = 'INACTIVO';
END PKG_USUARIOS;
/

CREATE OR REPLACE PACKAGE BODY PKG_USUARIOS AS

   PROCEDURE AGREGAR_USUARIO (
      p_primer_nombre    IN TBL_USUARIO.PRIMER_NOMBRE%TYPE,
      p_primer_apellido  IN TBL_USUARIO.PRIMER_APELLIDO%TYPE,
      p_correo           IN TBL_USUARIO.CORREO%TYPE,
      p_estado           IN TBL_USUARIO.ESTADO%TYPE
   ) IS
   BEGIN
      INSERT INTO TBL_USUARIO(
         ID_USUARIO,
         PRIMER_NOMBRE,
         PRIMER_APELLIDO,
         CORREO,
         CONTRASENA,
         ESTADO
      ) VALUES (
         NULL,                     -- lo rellena TRG_USUARIO_PK (SEQ_USUARIO)
         p_primer_nombre,
         p_primer_apellido,
         p_correo,
         'default123',
         p_estado
      );
   EXCEPTION
      WHEN DUP_VAL_ON_INDEX THEN
         -- Violación de clave única (correo o PK)
         RAISE e_usuario_duplicado;
      WHEN OTHERS THEN
         -- Cualquier otro error se re-lanza con excepción propia
         RAISE e_error_insert_usuario;
   END AGREGAR_USUARIO;


   FUNCTION CONTAR_ACTIVOS
      RETURN NUMBER
   IS
      v_total NUMBER;
   BEGIN
      SELECT COUNT(*)
        INTO v_total
        FROM TBL_USUARIO
       WHERE ESTADO = 'ACTIVO';

      RETURN v_total;
   EXCEPTION
      WHEN OTHERS THEN
         RAISE e_error_contar_activos;
   END CONTAR_ACTIVOS;

END PKG_USUARIOS;
/

--------------------------------------------------------------
-- PAQUETE PKG_RESERVAS
-- Gestión básica de reservas:
--  - Procedimiento CREAR_RESERVA: inserta una nueva reserva.
--  - Función TOTAL_RESERVAS: total de reservas por usuario.
--  - Cursor C_RESERVAS_ACTIVAS: reservas con ESTADO = 'CONFIRMADA'.
--------------------------------------------------------------

CREATE OR REPLACE PACKAGE PKG_RESERVAS AS
   -----------------------------------------------------------------
   -- Excepciones propias del paquete
   -----------------------------------------------------------------
   e_reserva_duplicada    EXCEPTION;
   e_error_crear_reserva  EXCEPTION;
   e_error_total_reservas EXCEPTION;

   -----------------------------------------------------------------
   -- Procedimiento CREAR_RESERVA
   -- Crea una nueva reserva para un usuario y una cancha.
   -- Parámetros:
   --   p_id_usuario  : identificador del usuario (cliente)
   --   p_id_cancha   : identificador de la cancha
   --   p_fecha       : fecha de la reserva
   --   p_hora_inicio : hora de inicio (VARCHAR2(5) 'HH24:MI')
   --   p_hora_fin    : hora de fin (VARCHAR2(5) 'HH24:MI')
   --   p_estado      : estado inicial de la reserva
   -----------------------------------------------------------------
   PROCEDURE CREAR_RESERVA(
      p_id_usuario    IN TBL_RESERVA.ID_USUARIO%TYPE,
      p_id_cancha     IN TBL_RESERVA.ID_CANCHA%TYPE,
      p_fecha         IN TBL_RESERVA.FECHA_RESERVA%TYPE,
      p_hora_inicio   IN TBL_RESERVA.HORA_INICIO%TYPE,
      p_hora_fin      IN TBL_RESERVA.HORA_FIN%TYPE,
      p_estado        IN TBL_RESERVA.ESTADO%TYPE DEFAULT 'PENDIENTE'
   );

   -----------------------------------------------------------------
   -- Función TOTAL_RESERVAS (función parametrizada)
   -- Retorna el número total de reservas hechas por un usuario.
   -- Parámetros:
   --   p_id_usuario : identificador del usuario
   -----------------------------------------------------------------
   FUNCTION TOTAL_RESERVAS(
      p_id_usuario IN TBL_RESERVA.ID_USUARIO%TYPE
   ) RETURN NUMBER;

   -----------------------------------------------------------------
   -- Cursor C_RESERVAS_ACTIVAS (simple)
   -- Lista todas las reservas con ESTADO = 'CONFIRMADA'.
   -----------------------------------------------------------------
   CURSOR C_RESERVAS_ACTIVAS IS
      SELECT *
        FROM TBL_RESERVA
       WHERE ESTADO = 'CONFIRMADA';
END PKG_RESERVAS;
/

CREATE OR REPLACE PACKAGE BODY PKG_RESERVAS AS

   PROCEDURE CREAR_RESERVA(
      p_id_usuario    IN TBL_RESERVA.ID_USUARIO%TYPE,
      p_id_cancha     IN TBL_RESERVA.ID_CANCHA%TYPE,
      p_fecha         IN TBL_RESERVA.FECHA_RESERVA%TYPE,
      p_hora_inicio   IN TBL_RESERVA.HORA_INICIO%TYPE,
      p_hora_fin      IN TBL_RESERVA.HORA_FIN%TYPE,
      p_estado        IN TBL_RESERVA.ESTADO%TYPE
   ) IS
   BEGIN
      INSERT INTO TBL_RESERVA(
         ID_RESERVA,
         ID_USUARIO,
         ID_CANCHA,
         FECHA_RESERVA,
         HORA_INICIO,
         HORA_FIN,
         ESTADO
      ) VALUES (
         NULL,      -- TRG_RESERVA_PK pone el ID (SEQ_RESERVA)
         p_id_usuario,
         p_id_cancha,
         p_fecha,
         p_hora_inicio,
         p_hora_fin,
         p_estado
      );
   EXCEPTION
      WHEN DUP_VAL_ON_INDEX THEN
         RAISE e_reserva_duplicada;
      WHEN OTHERS THEN
         RAISE e_error_crear_reserva;
   END CREAR_RESERVA;


   FUNCTION TOTAL_RESERVAS(
      p_id_usuario IN TBL_RESERVA.ID_USUARIO%TYPE
   ) RETURN NUMBER
   IS
      v_total NUMBER;
   BEGIN
      SELECT COUNT(*)
        INTO v_total
        FROM TBL_RESERVA
       WHERE ID_USUARIO = p_id_usuario;

      RETURN v_total;
   EXCEPTION
      WHEN OTHERS THEN
         RAISE e_error_total_reservas;
   END TOTAL_RESERVAS;

END PKG_RESERVAS;
/

--------------------------------------------------------------
-- PAQUETE PKG_CLUB_APP
-- Paquete “grande” que integra:
--  - Cursores simples y parametrizados.
--  - Tipos compuestos (registros y tablas anidadas).
--  - Funciones de utilidad (contar reservas, validar usuario).
--  - Procedimientos para CRUD de usuarios y reservas.
--  - Manejo de excepciones.
--  - Manejo de transacciones explícitas.
--------------------------------------------------------------

CREATE OR REPLACE PACKAGE PKG_CLUB_APP AS

   -----------------------------------------------------------------
   -- Cursor C_USUARIOS_INACTIVOS (simple)
   -- Lista usuarios en estado 'INACTIVO'.
   -----------------------------------------------------------------
   CURSOR C_USUARIOS_INACTIVOS IS
      SELECT *
        FROM TBL_USUARIO
       WHERE ESTADO = 'INACTIVO';

   -----------------------------------------------------------------
   -- Cursor parametrizado C_RESERVAS_USUARIO
   -- Retorna las reservas realizadas por un usuario.
   -- Parámetros:
   --   p_user : identificador del usuario
   -----------------------------------------------------------------
   CURSOR C_RESERVAS_USUARIO(p_user NUMBER) IS
      SELECT *
        FROM TBL_RESERVA
       WHERE ID_USUARIO = p_user;

   -----------------------------------------------------------------
   -- Tipo registro t_resumen_reserva
   -- Contiene datos básicos de una reserva.
   -----------------------------------------------------------------
   TYPE t_resumen_reserva IS RECORD(
      id_reserva   TBL_RESERVA.ID_RESERVA%TYPE,
      id_cancha    TBL_RESERVA.ID_CANCHA%TYPE,
      fecha        TBL_RESERVA.FECHA_RESERVA%TYPE,
      estado       TBL_RESERVA.ESTADO%TYPE
   );

   -----------------------------------------------------------------
   -- Colección (tabla anidada) de resúmenes de reservas.
   -----------------------------------------------------------------
   TYPE t_tabla_resumen IS TABLE OF t_resumen_reserva;

   -----------------------------------------------------------------
   -- Función f_contar_reservas_usuario (parametrizada)
   -- Retorna cuántas reservas tiene un usuario.
   -----------------------------------------------------------------
   FUNCTION f_contar_reservas_usuario(p_id_usuario NUMBER) RETURN NUMBER;

   -----------------------------------------------------------------
   -- Función f_existe_usuario
   -- Retorna:
   --   1 si el usuario existe
   --   0 si no existe.
   -----------------------------------------------------------------
   FUNCTION f_existe_usuario(p_id_usuario NUMBER) RETURN NUMBER;

   -----------------------------------------------------------------
   -- Procedimiento p_insertar_usuario
   -- Inserta un usuario básico con contraseña por defecto.
   -----------------------------------------------------------------
   PROCEDURE p_insertar_usuario(
      p_primer_nombre    IN TBL_USUARIO.PRIMER_NOMBRE%TYPE,
      p_primer_apellido  IN TBL_USUARIO.PRIMER_APELLIDO%TYPE,
      p_correo           IN TBL_USUARIO.CORREO%TYPE,
      p_estado           IN TBL_USUARIO.ESTADO%TYPE
   );

   -----------------------------------------------------------------
   -- Procedimiento p_eliminar_usuario
   -- Elimina un usuario por ID.
   -----------------------------------------------------------------
   PROCEDURE p_eliminar_usuario(
      p_id_usuario IN TBL_USUARIO.ID_USUARIO%TYPE
   );

   -----------------------------------------------------------------
   -- Procedimiento p_modificar_usuario
   -- Modifica datos básicos de un usuario.
   -----------------------------------------------------------------
   PROCEDURE p_modificar_usuario(
      p_id_usuario      IN TBL_USUARIO.ID_USUARIO%TYPE,
      p_primer_nombre   IN TBL_USUARIO.PRIMER_NOMBRE%TYPE,
      p_primer_apellido IN TBL_USUARIO.PRIMER_APELLIDO%TYPE,
      p_correo          IN TBL_USUARIO.CORREO%TYPE,
      p_estado          IN TBL_USUARIO.ESTADO%TYPE
   );

   -----------------------------------------------------------------
   -- Procedimiento p_resumen_reserva
   -- Retorna en un registro los datos de una reserva específica.
   -----------------------------------------------------------------
   PROCEDURE p_resumen_reserva(
      p_id_reserva IN  TBL_RESERVA.ID_RESERVA%TYPE,
      p_resultado  OUT t_resumen_reserva
   );

   -----------------------------------------------------------------
   -- Procedimiento p_listar_reservas_usuario
   -- Llena una colección (tabla anidada) con las reservas de un usuario.
   -----------------------------------------------------------------
   PROCEDURE p_listar_reservas_usuario(
      p_id_usuario IN  TBL_RESERVA.ID_USUARIO%TYPE,
      p_resultado  OUT t_tabla_resumen
   );

   -----------------------------------------------------------------
   -- Procedimiento p_crear_reserva_tercero
   -- Crea una reserva a nombre de un tercero, validando que
   -- quien la crea sea un administrador.
   -----------------------------------------------------------------
   PROCEDURE p_crear_reserva_tercero(
      p_id_admin      IN TBL_ADMINISTRADOR.ID_USUARIO%TYPE,
      p_contacto      IN TBL_RESERVA_TERCEROS.CONTACTO_TERCERO%TYPE,
      p_nombre        IN TBL_RESERVA_TERCEROS.NOMBRE_TERCERO%TYPE,
      p_id_cancha     IN TBL_RESERVA_TERCEROS.ID_CANCHA%TYPE,
      p_fecha         IN TBL_RESERVA_TERCEROS.FECHA_RESERVA%TYPE,
      p_hora_inicio   IN TBL_RESERVA_TERCEROS.HORA_INICIO%TYPE,
      p_hora_fin      IN TBL_RESERVA_TERCEROS.HORA_FIN%TYPE
   );

   -----------------------------------------------------------------
   -- Procedimiento p_crear_reserva_y_alquiler
   -- Crea una reserva y un préstamo de implementos en una
   -- misma transacción (ejemplo de manejo explícito de
   -- transacciones con SAVEPOINT y ROLLBACK).
   -----------------------------------------------------------------
   PROCEDURE p_crear_reserva_y_alquiler(
      p_id_usuario      IN TBL_RESERVA.ID_USUARIO%TYPE,
      p_id_cancha       IN TBL_RESERVA.ID_CANCHA%TYPE,
      p_fecha           IN TBL_RESERVA.FECHA_RESERVA%TYPE,
      p_hora_inicio     IN TBL_RESERVA.HORA_INICIO%TYPE,
      p_hora_fin        IN TBL_RESERVA.HORA_FIN%TYPE,
      p_estado_reserva  IN TBL_RESERVA.ESTADO%TYPE,
      p_id_implemento   IN TBL_ALQUILA.ID_IMPLEMENTO%TYPE,
      p_cantidad        IN TBL_ALQUILA.CANTIDAD_PRESTADA%TYPE
   );

END PKG_CLUB_APP;
/

CREATE OR REPLACE PACKAGE BODY PKG_CLUB_APP AS

   FUNCTION f_contar_reservas_usuario(p_id_usuario NUMBER)
      RETURN NUMBER
   IS
      v_total NUMBER;
   BEGIN
      SELECT COUNT(*)
        INTO v_total
        FROM TBL_RESERVA
       WHERE ID_USUARIO = p_id_usuario;

      RETURN v_total;
   EXCEPTION
      WHEN OTHERS THEN
         -- En caso de error, retornamos -1 como código de error
         RETURN -1;
   END f_contar_reservas_usuario;


   FUNCTION f_existe_usuario(p_id_usuario NUMBER)
      RETURN NUMBER
   IS
      v_count NUMBER;
   BEGIN
      SELECT COUNT(*)
        INTO v_count
        FROM TBL_USUARIO
       WHERE ID_USUARIO = p_id_usuario;

      RETURN CASE WHEN v_count > 0 THEN 1 ELSE 0 END;
   END f_existe_usuario;


   PROCEDURE p_insertar_usuario(
      p_primer_nombre    IN TBL_USUARIO.PRIMER_NOMBRE%TYPE,
      p_primer_apellido  IN TBL_USUARIO.PRIMER_APELLIDO%TYPE,
      p_correo           IN TBL_USUARIO.CORREO%TYPE,
      p_estado           IN TBL_USUARIO.ESTADO%TYPE
   ) IS
   BEGIN
      INSERT INTO TBL_USUARIO(
         ID_USUARIO,
         PRIMER_NOMBRE,
         PRIMER_APELLIDO,
         CORREO,
         CONTRASENA,
         ESTADO
      ) VALUES (
         NULL,
         p_primer_nombre,
         p_primer_apellido,
         p_correo,
         'default123',
         p_estado
      );
   END p_insertar_usuario;


   PROCEDURE p_eliminar_usuario(
      p_id_usuario IN TBL_USUARIO.ID_USUARIO%TYPE
   ) IS
   BEGIN
      DELETE FROM TBL_USUARIO
       WHERE ID_USUARIO = p_id_usuario;

      DBMS_OUTPUT.PUT_LINE('Usuario eliminado: ' || p_id_usuario);
   END p_eliminar_usuario;


   PROCEDURE p_modificar_usuario(
      p_id_usuario      IN TBL_USUARIO.ID_USUARIO%TYPE,
      p_primer_nombre   IN TBL_USUARIO.PRIMER_NOMBRE%TYPE,
      p_primer_apellido IN TBL_USUARIO.PRIMER_APELLIDO%TYPE,
      p_correo          IN TBL_USUARIO.CORREO%TYPE,
      p_estado          IN TBL_USUARIO.ESTADO%TYPE
   ) IS
   BEGIN
      UPDATE TBL_USUARIO
         SET PRIMER_NOMBRE   = p_primer_nombre,
             PRIMER_APELLIDO = p_primer_apellido,
             CORREO          = p_correo,
             ESTADO          = p_estado
       WHERE ID_USUARIO      = p_id_usuario;
   END p_modificar_usuario;


   PROCEDURE p_resumen_reserva(
      p_id_reserva IN  TBL_RESERVA.ID_RESERVA%TYPE,
      p_resultado  OUT t_resumen_reserva
   ) IS
   BEGIN
      SELECT ID_RESERVA,
             ID_CANCHA,
             FECHA_RESERVA,
             ESTADO
        INTO p_resultado.id_reserva,
             p_resultado.id_cancha,
             p_resultado.fecha,
             p_resultado.estado
        FROM TBL_RESERVA
       WHERE ID_RESERVA = p_id_reserva;
   EXCEPTION
      WHEN NO_DATA_FOUND THEN
         RAISE_APPLICATION_ERROR(-20010, 'Reserva no encontrada.');
   END p_resumen_reserva;


   PROCEDURE p_listar_reservas_usuario(
      p_id_usuario IN  TBL_RESERVA.ID_USUARIO%TYPE,
      p_resultado  OUT t_tabla_resumen
   ) IS
      v_idx PLS_INTEGER := 1;
   BEGIN
      -- Inicializar la colección
      p_resultado := t_tabla_resumen();

      -- Recorrer el cursor parametrizado y llenar la tabla anidada
      FOR r IN C_RESERVAS_USUARIO(p_id_usuario) LOOP
         p_resultado.EXTEND;
         p_resultado(v_idx).id_reserva := r.ID_RESERVA;
         p_resultado(v_idx).id_cancha  := r.ID_CANCHA;
         p_resultado(v_idx).fecha      := r.FECHA_RESERVA;
         p_resultado(v_idx).estado     := r.ESTADO;
         v_idx := v_idx + 1;
      END LOOP;
   END p_listar_reservas_usuario;


   PROCEDURE p_crear_reserva_tercero(
      p_id_admin      IN TBL_ADMINISTRADOR.ID_USUARIO%TYPE,
      p_contacto      IN TBL_RESERVA_TERCEROS.CONTACTO_TERCERO%TYPE,
      p_nombre        IN TBL_RESERVA_TERCEROS.NOMBRE_TERCERO%TYPE,
      p_id_cancha     IN TBL_RESERVA_TERCEROS.ID_CANCHA%TYPE,
      p_fecha         IN TBL_RESERVA_TERCEROS.FECHA_RESERVA%TYPE,
      p_hora_inicio   IN TBL_RESERVA_TERCEROS.HORA_INICIO%TYPE,
      p_hora_fin      IN TBL_RESERVA_TERCEROS.HORA_FIN%TYPE
   ) IS
      v_es_admin NUMBER;
   BEGIN
      -- Validar que el usuario sea admin
      SELECT COUNT(*)
        INTO v_es_admin
        FROM TBL_ADMINISTRADOR
       WHERE ID_USUARIO = p_id_admin;

      IF v_es_admin = 0 THEN
         RAISE_APPLICATION_ERROR(-20020, 'Solo un administrador puede crear reservas para terceros.');
      END IF;

      -- Crear la reserva de tercero
      INSERT INTO TBL_RESERVA_TERCEROS(
         ID_RESERVA_TERCERO,
         ID_USUARIO,
         CONTACTO_TERCERO,
         NOMBRE_TERCERO,
         ID_CANCHA,
         FECHA_RESERVA,
         HORA_INICIO,
         HORA_FIN,
         ESTADO
      ) VALUES (
         NULL,               -- lo rellena TRG_RESERVA_TERCEROS_PK
         p_id_admin,
         p_contacto,
         p_nombre,
         p_id_cancha,
         p_fecha,
         p_hora_inicio,
         p_hora_fin,
         'PENDIENTE'
      );
   END p_crear_reserva_tercero;


      PROCEDURE p_crear_reserva_y_alquiler(
      p_id_usuario      IN TBL_RESERVA.ID_USUARIO%TYPE,
      p_id_cancha       IN TBL_RESERVA.ID_CANCHA%TYPE,
      p_fecha           IN TBL_RESERVA.FECHA_RESERVA%TYPE,
      p_hora_inicio     IN TBL_RESERVA.HORA_INICIO%TYPE,
      p_hora_fin        IN TBL_RESERVA.HORA_FIN%TYPE,
      p_estado_reserva  IN TBL_RESERVA.ESTADO%TYPE,
      p_id_implemento   IN TBL_ALQUILA.ID_IMPLEMENTO%TYPE,
      p_cantidad        IN TBL_ALQUILA.CANTIDAD_PRESTADA%TYPE
   ) IS
      v_id_reserva  NUMBER;
      v_solape      NUMBER;  -- <<< NUEVA VARIABLE
   BEGIN
      -- Transacción explícita con SAVEPOINT
      SAVEPOINT sp_inicio;

      ----------------------------------------------------------------
      -- Validación simple de solape de reservas por cancha/fecha/hora
      -- (usando COUNT(*) en vez de IF EXISTS)
      ----------------------------------------------------------------
      SELECT COUNT(*)
        INTO v_solape
        FROM TBL_RESERVA r
       WHERE r.ID_CANCHA     = p_id_cancha
         AND r.FECHA_RESERVA = p_fecha
         AND (
               (p_hora_inicio BETWEEN r.HORA_INICIO AND r.HORA_FIN) OR
               (p_hora_fin    BETWEEN r.HORA_INICIO AND r.HORA_FIN)
             );

      IF v_solape > 0 THEN
         RAISE_APPLICATION_ERROR(-20030, 'Existe solapamiento de reservas.');
      END IF;

      ----------------------------------------------------------------
      -- Crear la reserva
      ----------------------------------------------------------------
      INSERT INTO TBL_RESERVA(
         ID_RESERVA,
         ID_USUARIO,
         ID_CANCHA,
         FECHA_RESERVA,
         HORA_INICIO,
         HORA_FIN,
         ESTADO
      ) VALUES (
         NULL,
         p_id_usuario,
         p_id_cancha,
         p_fecha,
         p_hora_inicio,
         p_hora_fin,
         p_estado_reserva
      )
      RETURNING ID_RESERVA INTO v_id_reserva;

      ----------------------------------------------------------------
      -- Crear el alquiler de implemento asociado (TBL_ALQUILA)
      -- HORA_PRESTAMO es VARCHAR2(5), se usa la hora actual 'HH24:MI'
      ----------------------------------------------------------------
      INSERT INTO TBL_ALQUILA(
         ID_PRESTAMO,
         ID_USUARIO,
         ID_IMPLEMENTO,
         CANTIDAD_PRESTADA,
         FECHA_PRESTAMO,
         HORA_PRESTAMO,
         FECHA_DEVOLUCION
      ) VALUES (
         NULL,                 -- lo rellena TRG_ALQUILA_PK
         p_id_usuario,
         p_id_implemento,
         p_cantidad,
         p_fecha,
         TO_CHAR(SYSDATE, 'HH24:MI'),  -- VARCHAR2(5)
         NULL                  -- devolución aún no realizada
      );

      ----------------------------------------------------------------
      -- Si todo va bien, se confirma la transacción
      ----------------------------------------------------------------
      COMMIT;
   EXCEPTION
      WHEN OTHERS THEN
         -- Si ocurre cualquier error, volvemos al SAVEPOINT
         ROLLBACK TO sp_inicio;
         RAISE;
   END p_crear_reserva_y_alquiler;


END PKG_CLUB_APP;
/
