/* ==========================================================
   SCRIPT 4 - BLOQUES ANÓNIMOS DE PRUEBA DE PAQUETES
   Proyecto: Sistema de reservas Club Los Robles
   Paquetes:
     - PKG_USUARIOS
     - PKG_RESERVAS
     - PKG_CLUB_APP
   ========================================================== */

SET SERVEROUTPUT ON;

/* ==========================================================
   BLOQUE 1: PRUEBA PAQUETE PKG_USUARIOS
   - AGREGAR_USUARIO
   - CONTAR_ACTIVOS
   - Cursor C_USUARIOS_INACTIVOS
   ========================================================== */

BEGIN
   DBMS_OUTPUT.PUT_LINE('=== PRUEBA PKG_USUARIOS ===');

   -- Intento de inserción de usuario de prueba
   PKG_USUARIOS.AGREGAR_USUARIO(
      p_primer_nombre   => 'Prueba',
      p_primer_apellido => 'Usuario',
      p_correo          => 'user.prueba@demo.com',
      p_estado          => 'ACTIVO'
   );

   DBMS_OUTPUT.PUT_LINE('Usuario de prueba insertado correctamente.');

   -- Conteo de usuarios activos
   DECLARE
      v_total_activos NUMBER;
   BEGIN
      v_total_activos := PKG_USUARIOS.CONTAR_ACTIVOS;
      DBMS_OUTPUT.PUT_LINE('Total de usuarios activos: ' || v_total_activos);
   END;

   -- Listar usuarios inactivos (si existen)
   DBMS_OUTPUT.PUT_LINE('Usuarios inactivos:');
   FOR r IN PKG_USUARIOS.C_USUARIOS_INACTIVOS LOOP
      DBMS_OUTPUT.PUT_LINE('  ID: ' || r.ID_USUARIO ||
                           ' - Correo: ' || r.CORREO);
   END LOOP;

EXCEPTION
   WHEN PKG_USUARIOS.e_usuario_duplicado THEN
      DBMS_OUTPUT.PUT_LINE('Error PKG_USUARIOS: Usuario duplicado.');
   WHEN PKG_USUARIOS.e_error_insert_usuario THEN
      DBMS_OUTPUT.PUT_LINE('Error PKG_USUARIOS: problema insertando usuario.');
   WHEN PKG_USUARIOS.e_error_contar_activos THEN
      DBMS_OUTPUT.PUT_LINE('Error PKG_USUARIOS: problema contando activos.');
   WHEN OTHERS THEN
      DBMS_OUTPUT.PUT_LINE('Error inesperado PKG_USUARIOS: ' || SQLERRM);
END;
/
-- Fin Bloque 1
--------------------------------------------------------------


/* ==========================================================
   BLOQUE 2: PRUEBA PAQUETE PKG_RESERVAS
   - CREAR_RESERVA
   - TOTAL_RESERVAS
   - Cursor C_RESERVAS_ACTIVAS
   ========================================================== */

DECLARE
   v_id_usuario   TBL_RESERVA.ID_USUARIO%TYPE;
   v_id_cancha    TBL_RESERVA.ID_CANCHA%TYPE;
   v_total        NUMBER;
BEGIN
   DBMS_OUTPUT.PUT_LINE('=== PRUEBA PKG_RESERVAS ===');

   -- Obtener ID_USUARIO de Laura (cliente)
   SELECT c.ID_USUARIO
     INTO v_id_usuario
     FROM TBL_CLIENTE c
     JOIN TBL_USUARIO u ON u.ID_USUARIO = c.ID_USUARIO
    WHERE u.CORREO = 'laura.gt@gmail.com'
      AND ROWNUM = 1;

   -- Obtener ID_CANCHA de "Cancha Fútbol 1"
   SELECT ID_CANCHA
     INTO v_id_cancha
     FROM TBL_CANCHA
    WHERE NOMBRE_CANCHA = 'Cancha Fútbol 1'
      AND ROWNUM = 1;

   -- Crear reserva mediante el paquete
   PKG_RESERVAS.CREAR_RESERVA(
      p_id_usuario  => v_id_usuario,
      p_id_cancha   => v_id_cancha,
      p_fecha       => TO_DATE('2024-12-01', 'YYYY-MM-DD'),
      p_hora_inicio => '18:00',
      p_hora_fin    => '19:00',
      p_estado      => 'CONFIRMADA'
   );

   DBMS_OUTPUT.PUT_LINE('Reserva creada correctamente para Laura.');

   -- Total de reservas de ese usuario
   v_total := PKG_RESERVAS.TOTAL_RESERVAS(v_id_usuario);
   DBMS_OUTPUT.PUT_LINE('Total reservas de Laura: ' || v_total);

   -- Mostrar reservas confirmadas usando el cursor del paquete
   DBMS_OUTPUT.PUT_LINE('Reservas CONFIRMADAS:');
   FOR r IN PKG_RESERVAS.C_RESERVAS_ACTIVAS LOOP
      DBMS_OUTPUT.PUT_LINE(
         '  ID_RESERVA=' || r.ID_RESERVA ||
         ' | USUARIO='   || r.ID_USUARIO ||
         ' | CANCHA='    || r.ID_CANCHA ||
         ' | FECHA='     || TO_CHAR(r.FECHA_RESERVA, 'YYYY-MM-DD') ||
         ' | ' || r.HORA_INICIO || '-' || r.HORA_FIN
      );
   END LOOP;

EXCEPTION
   WHEN PKG_RESERVAS.e_reserva_duplicada THEN
      DBMS_OUTPUT.PUT_LINE('Error PKG_RESERVAS: Reserva duplicada.');
   WHEN PKG_RESERVAS.e_error_crear_reserva THEN
      DBMS_OUTPUT.PUT_LINE('Error PKG_RESERVAS: problema creando reserva.');
   WHEN PKG_RESERVAS.e_error_total_reservas THEN
      DBMS_OUTPUT.PUT_LINE('Error PKG_RESERVAS: problema obteniendo total reservas.');
   WHEN OTHERS THEN
      DBMS_OUTPUT.PUT_LINE('Error inesperado PKG_RESERVAS: ' || SQLERRM);
END;
/
-- Fin Bloque 2
--------------------------------------------------------------


/* ==========================================================
   BLOQUE 3: PRUEBA PAQUETE PKG_CLUB_APP
   - f_existe_usuario
   - f_contar_reservas_usuario
   - p_insertar_usuario, p_modificar_usuario, p_eliminar_usuario
   - p_resumen_reserva
   - p_listar_reservas_usuario
   - p_crear_reserva_tercero
   - p_crear_reserva_y_alquiler (transacciones explícitas)
   ========================================================== */

DECLARE
   v_id_usuario_laura   TBL_USUARIO.ID_USUARIO%TYPE;
   v_id_admin_camilo    TBL_ADMINISTRADOR.ID_USUARIO%TYPE;
   v_id_cancha_futbol   TBL_CANCHA.ID_CANCHA%TYPE;
   v_id_implemento_bal  TBL_IMPLEMENTO.ID_IMPLEMENTO%TYPE;
   v_existe             NUMBER;
   v_total_reservas     NUMBER;
   v_nuevo_usuario      TBL_USUARIO.ID_USUARIO%TYPE;
   v_resumen            PKG_CLUB_APP.t_resumen_reserva;
   v_resumenes          PKG_CLUB_APP.t_tabla_resumen;
   v_id_reserva_exist   TBL_RESERVA.ID_RESERVA%TYPE;
BEGIN
   DBMS_OUTPUT.PUT_LINE('=== PRUEBA PKG_CLUB_APP ===');

   ----------------------------------------------------------------
   -- 1. Obtener datos base (Laura, Camilo, cancha, implemento)
   ----------------------------------------------------------------
   SELECT c.ID_USUARIO
     INTO v_id_usuario_laura
     FROM TBL_CLIENTE c
     JOIN TBL_USUARIO u ON u.ID_USUARIO = c.ID_USUARIO
    WHERE u.CORREO = 'laura.gt@gmail.com'
      AND ROWNUM = 1;

   SELECT a.ID_USUARIO
     INTO v_id_admin_camilo
     FROM TBL_ADMINISTRADOR a
     JOIN TBL_USUARIO u ON u.ID_USUARIO = a.ID_USUARIO
    WHERE u.CORREO = 'camilo@losrobles.com'
      AND ROWNUM = 1;

   SELECT ID_CANCHA
     INTO v_id_cancha_futbol
     FROM TBL_CANCHA
    WHERE NOMBRE_CANCHA = 'Cancha Fútbol 1'
      AND ROWNUM = 1;

   SELECT ID_IMPLEMENTO
     INTO v_id_implemento_bal
     FROM TBL_IMPLEMENTO
    WHERE TIPO_IMPLEMENTO = 'Balón fútbol N°5'
      AND ROWNUM = 1;

   DBMS_OUTPUT.PUT_LINE('Datos base cargados correctamente.');

   ----------------------------------------------------------------
   -- 2. Probar f_existe_usuario y f_contar_reservas_usuario
   ----------------------------------------------------------------
   v_existe := PKG_CLUB_APP.f_existe_usuario(v_id_usuario_laura);
   DBMS_OUTPUT.PUT_LINE('f_existe_usuario(Laura) = ' || v_existe);

   v_total_reservas := PKG_CLUB_APP.f_contar_reservas_usuario(v_id_usuario_laura);
   DBMS_OUTPUT.PUT_LINE('f_contar_reservas_usuario(Laura) = ' || v_total_reservas);

   ----------------------------------------------------------------
   -- 3. Probar p_insertar_usuario y p_modificar_usuario
   ----------------------------------------------------------------
   PKG_CLUB_APP.p_insertar_usuario(
      p_primer_nombre    => 'Carlos',
      p_primer_apellido  => 'Demo',
      p_correo           => 'carlos.demo@pruebas.com',
      p_estado           => 'ACTIVO'
   );

   -- Obtener el ID del usuario recién creado
   SELECT ID_USUARIO
     INTO v_nuevo_usuario
     FROM TBL_USUARIO
    WHERE CORREO = 'carlos.demo@pruebas.com'
      AND ROWNUM = 1;

   DBMS_OUTPUT.PUT_LINE('Nuevo usuario creado con ID=' || v_nuevo_usuario);

   -- Modificar usuario recién creado
   PKG_CLUB_APP.p_modificar_usuario(
      p_id_usuario      => v_nuevo_usuario,
      p_primer_nombre   => 'CarlosMod',
      p_primer_apellido => 'DemoMod',
      p_correo          => 'carlos.mod@pruebas.com',
      p_estado          => 'INACTIVO'
   );
   DBMS_OUTPUT.PUT_LINE('Usuario modificado correctamente (Carlos → CarlosMod).');

   ----------------------------------------------------------------
   -- 4. Probar p_crear_reserva_tercero
   ----------------------------------------------------------------
   PKG_CLUB_APP.p_crear_reserva_tercero(
      p_id_admin    => v_id_admin_camilo,
      p_contacto    => '3001234567',
      p_nombre      => 'Empresa DEMO',
      p_id_cancha   => v_id_cancha_futbol,
      p_fecha       => TO_DATE('2024-12-02', 'YYYY-MM-DD'),
      p_hora_inicio => '10:00',
      p_hora_fin    => '11:00'
   );
   DBMS_OUTPUT.PUT_LINE('Reserva para terceros creada correctamente por Camilo.');

   ----------------------------------------------------------------
   -- 5. Probar p_crear_reserva_y_alquiler (transacción explícita)
   ----------------------------------------------------------------
   PKG_CLUB_APP.p_crear_reserva_y_alquiler(
      p_id_usuario      => v_id_usuario_laura,
      p_id_cancha       => v_id_cancha_futbol,
      p_fecha           => TO_DATE('2024-12-03', 'YYYY-MM-DD'),
      p_hora_inicio     => '16:00',
      p_hora_fin        => '17:00',
      p_estado_reserva  => 'PENDIENTE',
      p_id_implemento   => v_id_implemento_bal,
      p_cantidad        => 1
   );
   DBMS_OUTPUT.PUT_LINE('Reserva + alquiler creados correctamente (transacción exitosa).');

   ----------------------------------------------------------------
   -- 6. Probar p_resumen_reserva y p_listar_reservas_usuario
   ----------------------------------------------------------------
   -- Tomar la última reserva (la más reciente por ID)
   SELECT MAX(ID_RESERVA)
     INTO v_id_reserva_exist
     FROM TBL_RESERVA;

   PKG_CLUB_APP.p_resumen_reserva(
      p_id_reserva => v_id_reserva_exist,
      p_resultado  => v_resumen
   );

   DBMS_OUTPUT.PUT_LINE('Resumen de reserva ID=' || v_resumen.id_reserva ||
                        ' | Cancha=' || v_resumen.id_cancha ||
                        ' | Fecha=' || TO_CHAR(v_resumen.fecha, 'YYYY-MM-DD') ||
                        ' | Estado=' || v_resumen.estado);

   -- Listar reservas de Laura en la colección
   PKG_CLUB_APP.p_listar_reservas_usuario(
      p_id_usuario => v_id_usuario_laura,
      p_resultado  => v_resumenes
   );

   DBMS_OUTPUT.PUT_LINE('Listado de reservas de Laura (desde colección):');
   IF v_resumenes.COUNT = 0 THEN
      DBMS_OUTPUT.PUT_LINE('  (Sin reservas registradas)');
   ELSE
      FOR i IN 1 .. v_resumenes.COUNT LOOP
         DBMS_OUTPUT.PUT_LINE(
            '  [' || i || '] ID_RESERVA=' || v_resumenes(i).id_reserva ||
            ', CANCHA=' || v_resumenes(i).id_cancha ||
            ', FECHA='  || TO_CHAR(v_resumenes(i).fecha, 'YYYY-MM-DD') ||
            ', ESTADO=' || v_resumenes(i).estado
         );
      END LOOP;
   END IF;

   ----------------------------------------------------------------
   -- 7. Probar p_eliminar_usuario (el usuario de prueba CarlosMod)
   ----------------------------------------------------------------
   PKG_CLUB_APP.p_eliminar_usuario(v_nuevo_usuario);
   DBMS_OUTPUT.PUT_LINE('Usuario de prueba eliminado (ID=' || v_nuevo_usuario || ').');

EXCEPTION
   WHEN OTHERS THEN
      DBMS_OUTPUT.PUT_LINE('Error en PKG_CLUB_APP: ' || SQLERRM);
END;
/
-- Fin Bloque 3
--------------------------------------------------------------

/* FIN SCRIPT 4 */
