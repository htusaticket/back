# 📚 Documentación de Configuración - ZAZ Créditos Backend

Esta documentación describe todas las configuraciones implementadas en el proyecto para crear un entorno de desarrollo y producción robusto, seguro y escalable.

## 📋 Índice

1. [Configuraciones Básicas](#-configuraciones-básicas)
2. [Validación y Seguridad](#-validación-y-seguridad)
3. [Herramientas de Desarrollo](#-herramientas-de-desarrollo)
4. [Base de Datos y Prisma](#-base-de-datos-y-prisma)
5. [Docker y Deployment](#-docker-y-deployment)
6. [Observabilidad y Logging](#-observabilidad-y-logging)
7. [CI/CD y GitHub Actions](#-cicd-y-github-actions)
8. [Scripts y Comandos](#-scripts-y-comandos)
9. [Variables de Entorno](#-variables-de-entorno)
10. [Solución de Problemas](#-solución-de-problemas)

---

## 🎯 Configuraciones Básicas

### ESLint

- **Archivo**: `eslint.config.mjs`
- **Características**:
  - TypeScript estricto con reglas avanzadas
  - Detección de imports no utilizados
  - Validación de promesas y async/await
  - Reglas específicas para NestJS
  - Configuración diferenciada para tests

### TypeScript

- **Archivos**: `tsconfig.json`, `tsconfig.build.json`
- **Características**:
  - Configuración estricta para producción
  - Path mapping para imports limpios (`@/*`)
  - Validación exhaustiva de tipos
  - Soporte para decoradores de NestJS

### Prettier

- **Archivo**: `.prettierrc`
- **Configuración**: Formato consistente con 100 caracteres por línea

### EditorConfig

- **Archivo**: `.editorconfig`
- **Propósito**: Consistencia entre diferentes editores

---

## 🛡️ Validación y Seguridad

### Validación de Variables de Entorno

- **Archivo**: `src/config/env.config.ts`
- **Tecnología**: Zod para validación de schemas
- **Características**:
  - Validación al inicio de la aplicación
  - Tipos TypeScript generados automáticamente
  - Valores por defecto seguros
  - Mensajes de error descriptivos

### Seguridad HTTP

- **Implementación**: `src/main.ts`
- **Características**:
  - Helmet para headers de seguridad
  - CORS configurado por entorno
  - Rate limiting con @nestjs/throttler
  - Validación estricta de payloads

### Manejo de Errores

- **Archivo**: `src/application/common/filters/http-exception.filter.ts`
- **Características**:
  - Filtro global de excepciones
  - Logs estructurados con correlación
  - Ocultación de stack traces en producción
  - Respuestas consistentes

---

## 🛠️ Herramientas de Desarrollo

### Git Hooks (Husky)

- **Pre-commit**: Ejecuta lint-staged
- **Commit-msg**: Valida formato de commits con commitlint
- **Pre-push**: Ejecuta typecheck y tests

### Lint-staged

- **Configuración**: `package.json`
- **Acciones**:
  - ESLint fix automático
  - Prettier format automático
  - Solo en archivos modificados

### Commitlint

- **Archivo**: `commitlint.config.js`
- **Formato**: Conventional Commits
- **Tipos**: feat, fix, docs, style, refactor, perf, test, chore, ci, build, revert

---

## 🗄️ Base de Datos y Prisma

### Schema Mejorado

- **Archivo**: `prisma/schema.prisma`
- **Características**:
  - Convenciones de naming (snake_case en DB, camelCase en TS)
  - Índices optimizados para consultas frecuentes
  - Campos de auditoría (createdAt, updatedAt)
  - Soporte para connection pooling

### Seeds

- **Archivo**: `prisma/seed.ts`
- **Propósito**: Datos iniciales para desarrollo
- **Características**:
  - Idempotente (se puede ejecutar múltiples veces)
  - Usuario admin por defecto
  - Contraseñas hasheadas con bcrypt

---

## 🐳 Docker y Deployment

### Dockerfile de Producción

- **Archivo**: `Dockerfile.prod`
- **Características**:
  - Multi-stage build para optimización
  - Usuario no-root para seguridad
  - Health checks incorporados
  - Imagen Alpine para menor tamaño

### Docker Compose

- **Desarrollo**: `docker-compose.yml`
- **Producción**: `docker-compose.prod.yml`
- **Servicios**:
  - PostgreSQL con configuración optimizada
  - Redis para cache y sesiones
  - Adminer para gestión de BD (solo desarrollo)

---

## 📊 Observabilidad y Logging

### Logging Estructurado

- **Tecnología**: Pino con nestjs-pino
- **Archivo**: `src/config/logger.config.ts`
- **Características**:
  - Logs JSON en producción
  - Pretty printing en desarrollo
  - Redacción automática de información sensible
  - Correlación de requests

### Métricas

- **Servicio**: `src/application/common/services/metrics.service.ts`
- **Características**:
  - Métricas de negocio personalizadas
  - Timers para medir rendimiento
  - Contadores y gauges
  - Integración con logging

### Interceptores

- **Performance**: Detecta requests lentos
- **Correlation ID**: Tracking de requests
- **Transform**: Respuestas consistentes

---

## 🚀 CI/CD y GitHub Actions

### Pipeline Principal

- **Archivo**: `.github/workflows/ci.yml`
- **Etapas**:
  1. **Test & Lint**: Validación de código y tests
  2. **Security**: Auditoría de seguridad
  3. **Build**: Construcción de imagen Docker
  4. **Deploy**: Deployment a producción (solo main)

### Actualizaciones de Dependencias

- **Archivo**: `.github/workflows/dependency-update.yml`
- **Renovate**: `renovate.json`
- **Características**:
  - Updates automáticos semanales
  - Auto-merge para patches seguros
  - Revisión manual para major updates

### Templates

- **Pull Requests**: Checklist completo de revisión
- **Issues**: Templates para bugs y features
- **Configuración**: Labels y workflows automáticos

---

## 📜 Scripts y Comandos

### Comandos de Desarrollo

```bash
npm run dev          # Desarrollo con hot-reload
npm run build        # Build de producción
npm run start        # Ejecutar build
npm run lint         # Linter con fix automático
npm run format       # Formateo de código
npm run typecheck    # Validación de tipos
```

### Comandos de Base de Datos

```bash
npm run db:migrate      # Ejecutar migraciones
npm run db:seed         # Ejecutar seeds
npm run db:studio       # Abrir Prisma Studio
npm run db:generate     # Generar cliente Prisma
```

### Comandos de Docker

```bash
docker-compose up           # Desarrollo
docker-compose -f docker-compose.prod.yml up  # Producción
```

---

## 🔧 Variables de Entorno

### Archivo de Ejemplo

Ver `.env-example` para todas las variables requeridas.

### Variables Críticas

```bash
# Base de datos
DATABASE_URL=postgresql://user:pass@localhost:5432/db
DIRECT_URL=postgresql://user:pass@localhost:5432/db  # Para connection pooling

# Seguridad
JWT_SECRET=tu_secret_super_seguro_de_al_menos_32_caracteres
BCRYPT_SALT_ROUNDS=12

# Aplicación
NODE_ENV=development|test|production
PORT=5000
LOG_LEVEL=debug|info|warn|error

# CORS
HOSTS_WHITE_LIST=http://localhost:3000,http://localhost:3001

# Rate Limiting
RATE_LIMIT_TTL=60    # Segundos
RATE_LIMIT_MAX=10    # Requests por TTL
```

---

## 🔍 Solución de Problemas

### Problemas Comunes

#### Error de TypeScript estricto

**Problema**: Errores de tipos después de la configuración estricta
**Solución**:

1. Revisar los archivos con errores
2. Agregar tipos explícitos donde sea necesario
3. Usar `// @ts-expect-error` solo como último recurso

#### Error de ESLint

**Problema**: Reglas de ESLint muy estrictas
**Solución**:

1. Ejecutar `npm run lint` para ver todos los errores
2. Usar `npm run lint` para auto-fix
3. Ajustar reglas en `eslint.config.mjs` si es necesario

#### Error de Prisma

**Problema**: Cliente de Prisma desactualizado
**Solución**:

```bash
npm run db:generate
npx prisma migrate dev
```

#### Error de Docker

**Problema**: Contenedores no inician correctamente
**Solución**:

1. Verificar variables de entorno
2. Revisar logs: `docker-compose logs`
3. Limpiar volúmenes: `docker-compose down -v`

### Logs y Debugging

#### Ver logs estructurados

```bash
# En desarrollo (pretty)
npm run dev

# En Docker
docker-compose logs -f app
```

#### Debug con VSCode

Configuración incluida en `.vscode/launch.json` (crear si es necesario)

---

## 📈 Mejores Prácticas

### Desarrollo

1. **Siempre** ejecutar `npm run typecheck` antes de commit
2. **Usar** conventional commits para mensajes claros
3. **Escribir** tests para nueva funcionalidad
4. **Revisar** logs de seguridad regularmente

### Producción

1. **Nunca** hacer commits directos a main
2. **Siempre** usar Pull Requests con revisión
3. **Monitorear** métricas y logs de aplicación
4. **Mantener** dependencias actualizadas

### Seguridad

1. **Rotar** JWT secrets regularmente
2. **Revisar** auditorías de dependencias
3. **Validar** todos los inputs de usuario
4. **Usar** HTTPS en producción

---

## 🆘 Soporte

### Contactos

- **Desarrollador Principal**: [Tu nombre]
- **DevOps**: [Nombre del responsable]
- **Seguridad**: [Contacto de seguridad]

### Recursos

- [Documentación de NestJS](https://nestjs.com/)
- [Documentación de Prisma](https://prisma.io/docs)
- [Guía de TypeScript](https://typescript-eslint.io/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

_Documentación actualizada: Diciembre 2024_
