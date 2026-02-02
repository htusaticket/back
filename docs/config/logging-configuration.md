# 📝 Configuración de Logs - Reducir Ruido en Desarrollo

## 🔇 Problema: Demasiados Logs de Sentry

Si ves muchos logs de Sentry como estos:

```
Sentry Logger [log]: [Tracing] Starting sampled root span
Sentry Logger [log]: [Profiling] started profiling transaction
```

## ✅ **Soluciones:**

### **Opción 1: Deshabilitar Sentry en Desarrollo (Recomendado)**

En tu archivo `.env`, comenta o deja vacío el `SENTRY_DSN`:

```bash
# Sentry DSN - déjalo vacío para desarrollo silencioso
# SENTRY_DSN=""
```

**Resultado**: ✅ Sin logs de Sentry, aplicación más silenciosa

### **Opción 2: Configurar Nivel de Logs**

En tu archivo `.env`, cambia el nivel de logs:

```bash
# Logs más silenciosos
LOG_LEVEL=warn

# O aún más silenciosos
LOG_LEVEL=error
```

**Resultado**: ✅ Solo logs importantes, menos ruido

### **Opción 3: Sentry Solo para Errores**

Si quieres mantener Sentry pero con menos logs, en tu `.env`:

```bash
# Mantener Sentry pero con sampling bajo
SENTRY_DSN="tu-dsn-aqui"
```

Y la configuración ya está optimizada para:

- ✅ **Tracing**: Solo 10% de requests (menos logs)
- ✅ **Profiling**: Deshabilitado en desarrollo
- ✅ **Debug**: Deshabilitado para reducir ruido

## 🎯 **Configuración Recomendada por Entorno:**

### **🛠️ Desarrollo Local:**

```bash
NODE_ENV=development
LOG_LEVEL=info
# SENTRY_DSN=""  # Comentado = Sin Sentry = Sin logs extra
```

### **🧪 Testing/Staging:**

```bash
NODE_ENV=test
LOG_LEVEL=warn
SENTRY_DSN="https://tu-dsn@sentry.io/proyecto"  # Habilitado para probar
```

### **🚀 Producción:**

```bash
NODE_ENV=production
LOG_LEVEL=warn
SENTRY_DSN="https://tu-dsn@sentry.io/proyecto"  # Siempre habilitado
```

## 🔧 **Comandos Útiles:**

### Ver solo logs de tu aplicación:

```bash
npm run dev | grep -v "Sentry Logger"
```

### Ejecutar sin debug:

```bash
NODE_ENV=production npm run dev
```

### Logs completamente silenciosos:

```bash
LOG_LEVEL=error npm run dev
```

## 📊 **Niveles de Log Disponibles:**

- **`debug`**: TODO (muy verboso) 🔊🔊🔊
- **`info`**: Información general 🔊🔊
- **`warn`**: Solo warnings y errores 🔊
- **`error`**: Solo errores críticos 🔇

## 💡 **Recomendación:**

Para desarrollo diario, usa:

```bash
# En tu .env
LOG_LEVEL=warn
# SENTRY_DSN=""
```

Esto te dará:

- ✅ **Logs limpios** y fáciles de leer
- ✅ **Solo información importante** (warnings y errores)
- ✅ **Sin ruido** de Sentry/Prisma
- ✅ **Performance óptimo** en desarrollo

¿Te gustaría que aplique esta configuración más silenciosa?
