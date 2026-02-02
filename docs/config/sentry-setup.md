# 🔍 Configuración de Sentry - Monitoreo de Errores

Esta guía te ayudará a configurar Sentry para monitorear errores y performance en tu aplicación NestJS.

## 📋 Índice

1. [¿Qué es Sentry?](#-qué-es-sentry)
2. [Configuración Inicial](#-configuración-inicial)
3. [Variables de Entorno](#-variables-de-entorno)
4. [Uso en Controladores](#-uso-en-controladores)
5. [Uso en Servicios](#-uso-en-servicios)
6. [Decoradores Disponibles](#-decoradores-disponibles)
7. [Mejores Prácticas](#-mejores-prácticas)
8. [Dashboard y Alertas](#-dashboard-y-alertas)

---

## 🤔 ¿Qué es Sentry?

Sentry es una plataforma de monitoreo de errores que te permite:

- **🐛 Capturar errores** automáticamente en producción
- **📊 Monitorear performance** de tu aplicación
- **🔍 Debugging avanzado** con contexto completo
- **📧 Alertas en tiempo real** cuando ocurren errores
- **📈 Analytics** de errores y tendencias

## 🚀 Configuración Inicial

### 1. Crear Cuenta en Sentry

1. Ve a [sentry.io](https://sentry.io) y crea una cuenta
2. Crea un nuevo proyecto para **Node.js**
3. Copia el **DSN** que te proporciona Sentry

### 2. Configurar Variables de Entorno

Agrega tu DSN de Sentry al archivo `.env`:

```bash
# Sentry DSN para monitoreo de errores
SENTRY_DSN="https://abc123@o123456.ingest.sentry.io/123456"
```

### 3. La aplicación ya está configurada

La configuración de Sentry ya está integrada en la aplicación:

- ✅ **Inicialización automática** en `main.ts`
- ✅ **Interceptor global** para capturar errores HTTP
- ✅ **Filtro de excepciones** mejorado
- ✅ **Servicios helper** para uso manual

---

## 🔧 Variables de Entorno

```bash
# Obligatorio para habilitar Sentry
SENTRY_DSN="https://your-dsn@sentry.io/project-id"

# Opcional: Configuración adicional
NODE_ENV=production  # Afecta el sampling rate
```

---

## 🎮 Uso en Controladores

### Inyección Manual

```typescript
import { Controller, Post, Body, Inject } from '@nestjs/common';
import { SentryService } from '@/application/common/services/sentry.service';

@Controller('users')
export class UsersController {
  constructor(private readonly sentryService: SentryService) {}

  @Post()
  async createUser(@Body() userData: CreateUserDto) {
    // Agregar contexto
    this.sentryService.addBreadcrumb('Creating user', 'user', {
      email: userData.email,
    });

    try {
      const user = await this.userService.create(userData);

      // Evento de negocio
      this.sentryService.captureBusinessEvent('user.created', {
        userId: user.id,
        email: user.email,
      });

      return user;
    } catch (error) {
      // Error capturado automáticamente por el interceptor
      throw error;
    }
  }
}
```

### Usando Decoradores

```typescript
import { MeasurePerformance } from '@/application/common/decorators/sentry.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly sentryService: SentryService) {}

  @Post()
  @MeasurePerformance('user.create') // Mide automáticamente el tiempo
  async createUser(@Body() userData: CreateUserDto) {
    return this.userService.create(userData);
  }
}
```

---

## 🛠️ Uso en Servicios

### Operaciones de Base de Datos

```typescript
@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sentryService: SentryService,
  ) {}

  async createUser(userData: CreateUserDto) {
    return this.sentryService.wrapDatabaseOperation('create', 'users', async () => {
      return this.prisma.user.create({
        data: userData,
      });
    });
  }

  async findUserById(id: string) {
    return this.sentryService.wrapDatabaseOperation('findUnique', 'users', async () => {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      return user;
    });
  }
}
```

### APIs Externas

```typescript
@Injectable()
export class PaymentService {
  constructor(private readonly sentryService: SentryService) {}

  async processPayment(paymentData: PaymentDto) {
    return this.sentryService.wrapExternalAPI('mercadopago', '/payments', async () => {
      const response = await fetch('https://api.mercadopago.com/payments', {
        method: 'POST',
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        throw new Error(`Payment failed: ${response.statusText}`);
      }

      return response.json();
    });
  }
}
```

### Contexto de Usuario

```typescript
@Injectable()
export class AuthService {
  constructor(private readonly sentryService: SentryService) {}

  async login(credentials: LoginDto) {
    const user = await this.validateCredentials(credentials);

    // Configurar contexto de usuario en Sentry
    this.sentryService.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
    });

    return this.generateTokens(user);
  }

  async logout() {
    // Limpiar contexto de usuario
    this.sentryService.clearUser();
  }
}
```

---

## 🎨 Decoradores Disponibles

### @MeasurePerformance

Mide automáticamente el tiempo de ejecución de un método:

```typescript
@MeasurePerformance('user.complex-operation')
async complexOperation() {
  // Operación compleja
  // El tiempo se reporta automáticamente a Sentry
}
```

### @SentryContext

Configura contexto automático para una clase:

```typescript
@SentryContext({
  service: 'user-service',
  version: '1.0.0',
})
@Injectable()
export class UserService {
  // Todos los errores incluirán el contexto automáticamente
}
```

---

## ✅ Mejores Prácticas

### 1. **Filtrar Información Sensible**

```typescript
// ❌ MAL - Expone información sensible
this.sentryService.captureException(error, {
  user: {
    password: '123456', // ¡Nunca!
    creditCard: '1234-5678-9012-3456', // ¡Nunca!
  },
});

// ✅ BIEN - Solo información útil para debugging
this.sentryService.captureException(error, {
  user: {
    id: user.id,
    email: user.email,
    role: user.role,
  },
  operation: 'user.create',
});
```

### 2. **Usar Breadcrumbs Estratégicamente**

```typescript
// ✅ BIEN - Breadcrumbs útiles para tracing
async processOrder(orderId: string) {
  this.sentryService.addBreadcrumb('Processing order', 'business', { orderId });

  const order = await this.getOrder(orderId);
  this.sentryService.addBreadcrumb('Order retrieved', 'database', {
    orderId,
    status: order.status
  });

  await this.validatePayment(order);
  this.sentryService.addBreadcrumb('Payment validated', 'payment');

  // ... resto de la lógica
}
```

### 3. **Capturar Eventos de Negocio**

```typescript
// ✅ BIEN - Eventos importantes del negocio
this.sentryService.captureBusinessEvent('user.registered', {
  userId: user.id,
  plan: user.plan,
  source: 'web',
});

this.sentryService.captureBusinessEvent('payment.completed', {
  amount: payment.amount,
  currency: payment.currency,
  method: payment.method,
});
```

### 4. **No Capturar Errores de Cliente**

```typescript
// ❌ MAL - Ruido innecesario
if (status === 400) {
  this.sentryService.captureException(error); // No hacer esto
}

// ✅ BIEN - Solo errores del servidor
if (status >= 500) {
  this.sentryService.captureException(error);
}
```

---

## 📊 Dashboard y Alertas

### Configurar Alertas

1. Ve a tu proyecto en Sentry
2. **Settings** → **Alerts**
3. Crea reglas para:
   - Errores nuevos
   - Picos de errores
   - Errores críticos (5xx)
   - Performance degradation

### Métricas Importantes

- **Error Rate**: Porcentaje de requests con errores
- **APDEX**: Índice de satisfacción de performance
- **P95 Response Time**: Tiempo de respuesta del 95% de requests
- **Throughput**: Requests por minuto

### Dashboard Personalizado

Crea dashboards para:

- **Errores por endpoint**
- **Performance por operación**
- **Eventos de negocio**
- **Usuarios afectados**

---

## 🚨 Alertas Recomendadas

### Alertas Críticas

```
- Error rate > 5% en 5 minutos
- Errores 5xx > 10 en 1 minuto
- P95 response time > 2 segundos
```

### Alertas de Negocio

```
- Fallos en pagos > 3 en 10 minutos
- Registros fallidos > 5 en 15 minutos
- API externa down
```

---

## 🔧 Configuración Avanzada

### Sampling en Producción

```typescript
// En sentry.config.ts
tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
profilesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
```

### Filtros Personalizados

```typescript
beforeSend(event, hint) {
  // No reportar errores de bots
  if (event.request?.headers?.['user-agent']?.includes('bot')) {
    return null;
  }

  // No reportar timeouts de conexión
  if (event.exception?.values?.[0]?.type === 'ECONNRESET') {
    return null;
  }

  return event;
}
```

---

## 🆘 Solución de Problemas

### Sentry no captura errores

1. Verificar que `SENTRY_DSN` está configurado
2. Verificar que no hay filtros bloqueando
3. Revisar logs: "Sentry inicializado para entorno: X"

### Demasiados errores reportados

1. Ajustar `beforeSend` filters
2. Reducir sampling rate
3. Configurar rate limiting en Sentry

### Performance impact

1. Usar sampling apropiado en producción
2. Deshabilitar profiling si no es necesario
3. Revisar breadcrumbs excesivos

---

## 📚 Recursos

- [Documentación oficial de Sentry](https://docs.sentry.io/)
- [Sentry para Node.js](https://docs.sentry.io/platforms/node/)
- [Performance Monitoring](https://docs.sentry.io/performance/)
- [Error Tracking Best Practices](https://blog.sentry.io/error-monitoring-best-practices/)

---

¡Tu aplicación ahora tiene monitoreo profesional de errores! 🎉
