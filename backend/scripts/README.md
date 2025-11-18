# Ejecutar scripts SQL (seguros)

Este runner permite ejecutar los scripts dentro de `backend/sql` de forma segura.

Principios generales:

- Por defecto corre en modo _dry-run_ (no hace commit); así nada se modifica en la BD.
- Para aplicar cambios se debe pasar `--apply` explícitamente.
- Se ejecutan los archivos `.sql` en orden alfabético. Puedes pasar `--files=file1.sql,file2.sql` para controlar el orden.

Requisitos de entorno:

- Variables de entorno: `ORACLE_USER`, `ORACLE_PASSWORD`, `ORACLE_CONNECT_STRING` (ya usadas por `backend/src/db.ts`).
- Cliente Oracle y dependencias deben estar instaladas (paquete `oracledb`).

Uso:

Modo seguro (por defecto, NO COMMIT):

```
cd backend
npx ts-node scripts/run-sql.ts
```

Aplicar cambios (COMMIT al final):

```
cd backend
npx ts-node scripts/run-sql.ts --apply
```

Ejecutar archivos específicos en orden dado:

```
npx ts-node scripts/run-sql.ts --files=Script1.sql,Script2.sql --apply
```

Notas importantes y precauciones:

- Los scripts fueron preparados originalmente para SQL\*Plus y contienen marcas como `/` para ejecutar bloques PL/SQL. El runner handlea eso automáticamente.
- En modo dry-run, las líneas `COMMIT;` son neutralizadas para evitar commits intermedios.
- Aun así, por seguridad, prueba primero en una base de datos de desarrollo o staging. No ejecutar en producción sin respaldo.
- Si un statement falla, el proceso se detiene y se hace rollback (o no se comiteó en dry-run).

Si quieres, puedo ejecutar una prueba dry-run ahora o adaptar el runner para generar un volcado de respaldo antes de aplicar cambios.
