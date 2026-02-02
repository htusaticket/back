# Reglas de Cursor - Proyecto ZAZ Créditos

Este directorio contiene todas las reglas de Cursor establecidas para mantener la consistencia, calidad y robustez del proyecto.

## 📁 Archivos de Reglas

### Reglas Principales

1. **[borrado-logico.mdc](./borrado-logico.mdc)** - Borrado lógico obligatorio
2. **[paginacion-obligatoria.mdc](./paginacion-obligatoria.mdc)** - Paginación en todos los endpoints de listas
3. **[revision-proyecto.mdc](./revision-proyecto.mdc)** - Revisar proyecto antes de codificar
4. **[tipado-fuerte.mdc](./tipado-fuerte.mdc)** - Evitar `any` y mantener tipado fuerte
5. **[arquitectura-limpia.mdc](./arquitectura-limpia.mdc)** - Mantener Clean Architecture
6. **[validacion-dtos.mdc](./validacion-dtos.mdc)** - Validación obligatoria de DTOs
7. **[manejo-errores.mdc](./manejo-errores.mdc)** - Manejo consistente de errores
8. **[seguridad-autenticacion.mdc](./seguridad-autenticacion.mdc)** - Seguridad y autenticación
9. **[testing-documentacion.mdc](./testing-documentacion.mdc)** - Testing y documentación
10. **[logging-monitoreo.mdc](./logging-monitoreo.mdc)** - Logging y monitoreo

### Reglas Avanzadas

11. **[migraciones-bd.mdc](./migraciones-bd.mdc)** - Migraciones de base de datos
12. **[versionado-api.mdc](./versionado-api.mdc)** - Versionado de API
13. **[estrategias-cache.mdc](./estrategias-cache.mdc)** - Estrategias de cache
14. **[internacionalizacion.mdc](./internacionalizacion.mdc)** - Internacionalización
15. **[rate-limiting.mdc](./rate-limiting.mdc)** - Rate limiting y protección
16. **[api-documentacion.mdc](./api-documentacion.mdc)** - Documentación de API con Swagger
17. **[estilo-codigo.mdc](./estilo-codigo.mdc)** - ESLint/Prettier y convenciones
18. **[config-entornos-seguridad.mdc](./config-entornos-seguridad.mdc)** - Config/env y secretos
19. **[prisma-buenas-practicas.mdc](./prisma-buenas-practicas.mdc)** - Buenas prácticas Prisma
20. **[transacciones-idempotencia.mdc](./transacciones-idempotencia.mdc)** - Transacciones e idempotencia
21. **[salud-monitorizacion.mdc](./salud-monitorizacion.mdc)** - Healthchecks y métricas
22. **[respuestas-consistentes.mdc](./respuestas-consistentes.mdc)** - Formato de respuestas
23. **[uploads-archivos.mdc](./uploads-archivos.mdc)** - Subidas de archivos seguras

### Documentos de Referencia

- **[resumen-reglas.mdc](./resumen-reglas.mdc)** - Resumen completo de todas las reglas
- **[README.md](./README.md)** - Este archivo de documentación

## 🎯 Objetivo

Estas reglas están diseñadas para:

- ✅ **Mantener consistencia** en el código y arquitectura
- ✅ **Asegurar calidad** y robustez del proyecto
- ✅ **Facilitar mantenimiento** y escalabilidad
- ✅ **Prevenir errores comunes** y problemas de seguridad
- ✅ **Mejorar la experiencia** del desarrollador

## 🚀 Uso

Las reglas se aplican automáticamente cuando trabajas con archivos TypeScript, JavaScript y Prisma en el proyecto. Cursor utilizará estas reglas para:

- Sugerir código que siga los patrones establecidos
- Recordar las mejores prácticas del proyecto
- Mantener consistencia en nuevas implementaciones
- Prevenir errores comunes

## 📋 Checklist Rápido

Antes de implementar cualquier funcionalidad:

### Checklist Básico:

1. ✅ Revisar proyecto existente (`revision-proyecto.mdc`)
2. ✅ Verificar reglas de borrado lógico (`borrado-logico.mdc`)
3. ✅ Implementar paginación si es lista (`paginacion-obligatoria.mdc`)
4. ✅ Usar tipado fuerte (`tipado-fuerte.mdc`)
5. ✅ Seguir arquitectura limpia (`arquitectura-limpia.mdc`)
6. ✅ Validar DTOs (`validacion-dtos.mdc`)
7. ✅ Manejar errores apropiadamente (`manejo-errores.mdc`)
8. ✅ Implementar seguridad (`seguridad-autenticacion.mdc`)
9. ✅ Escribir tests (`testing-documentacion.mdc`)
10. ✅ Incluir logging (`logging-monitoreo.mdc`)

### Checklist Avanzado:

11. ✅ Planificar migraciones de BD (`migraciones-bd.mdc`)
12. ✅ Considerar versionado de API (`versionado-api.mdc`)
13. ✅ Implementar estrategias de cache (`estrategias-cache.mdc`)
14. ✅ Preparar internacionalización (`internacionalizacion.mdc`)
15. ✅ Configurar rate limiting (`rate-limiting.mdc`)
16. ✅ Exponer documentación de API (`api-documentacion.mdc`)
17. ✅ Alinear estilo con ESLint/Prettier (`estilo-codigo.mdc`)
18. ✅ Validar config/env y secretos (`config-entornos-seguridad.mdc`)
19. ✅ Seguir buenas prácticas Prisma (`prisma-buenas-practicas.mdc`)
20. ✅ Usar transacciones/idempotencia (`transacciones-idempotencia.mdc`)
21. ✅ Agregar health y métricas (`salud-monitorizacion.mdc`)
22. ✅ Estandarizar respuestas (`respuestas-consistentes.mdc`)
23. ✅ Definir política de uploads (`uploads-archivos.mdc`)

## 🔄 Actualización de Reglas

Las reglas pueden actualizarse según las necesidades del proyecto. Para modificar o agregar reglas:

1. Editar el archivo `.mdc` correspondiente
2. Actualizar este README si es necesario
3. Actualizar el resumen en `resumen-reglas.mdc`

## 📞 Soporte

Si tienes dudas sobre alguna regla o necesitas clarificaciones:

1. Revisa el archivo específico de la regla
2. Consulta el resumen en `resumen-reglas.mdc`
3. Verifica ejemplos en el código existente
4. Contacta al equipo de desarrollo

---

**Recuerda**: Estas reglas están aquí para ayudarte a escribir mejor código y mantener la calidad del proyecto. ¡Úsalas como guía y no como restricción!
