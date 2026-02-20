# 🚀 Sprint 4 - Frontend Implementation Guide

## Documentación para Claude Opus 4.5

Este documento contiene toda la información necesaria para implementar el frontend del Sprint 4 de JFalcon. El backend ya está completamente implementado y listo para ser consumido.

---

## 📋 Resumen de Tareas

| Ticket  | Título                                              | Estado Backend |
| ------- | --------------------------------------------------- | -------------- |
| JFAL-26 | Job Board: Listado, Filtros y Acción de Aplicar     | ✅ Completado  |
| JFAL-27 | My Applications: Tablero Kanban y Gestión de Estado | ✅ Completado  |
| JFAL-28 | Perfil: Visualización de Stats y Estado de Strikes  | ✅ Completado  |
| JFAL-29 | Perfil: Formulario de Edición de Datos              | ✅ Completado  |

---

## 🔌 API Endpoints Disponibles

### 1. Jobs (JFAL-26)

#### GET `/api/jobs`

Obtiene el listado de ofertas de trabajo activas con estadísticas.

**Headers requeridos:**

```
Authorization: Bearer <token>
```

**Query Parameters (opcionales):**
| Parámetro | Tipo | Descripción | Ejemplo |
|-----------|------|-------------|---------|
| `search` | string | Buscar por título o empresa | `Frontend` |
| `type` | string | Filtrar por tipo de trabajo | `Full-time` o `Part-time` |

**Ejemplo de llamada:**

```typescript
// Sin filtros
const response = await api.get('/api/jobs');

// Con filtros
const response = await api.get('/api/jobs', {
  params: { search: 'Frontend', type: 'Full-time' },
});
```

**Response (200 OK):**

```typescript
interface JobListResponse {
  stats: {
    availableOffers: number; // Total de ofertas activas
    activeApplications: number; // Aplicaciones del usuario (no rechazadas)
    newThisWeek: number; // Ofertas nuevas esta semana
  };
  jobs: Array<{
    id: number;
    title: string; // Ej: "$15k/Mo Closers for Info Coaching Offer"
    company: string; // Ej: "Adam Stifel Coaching"
    location: string; // Ej: "Remote - US Hours"
    salaryRange: string; // Ej: "$5,000 - $15,000/month OTE"
    type: string; // "Full-time" | "Part-time"
    description: string; // Descripción completa del trabajo
    requirements: string[]; // Array de requisitos
    hasApplied: boolean; // Si el usuario ya aplicó
    createdAt: string; // ISO DateTime
  }>;
}
```

#### POST `/api/jobs/:id/apply`

Aplica a una oferta de trabajo.

**Headers requeridos:**

```
Authorization: Bearer <token>
```

**URL Params:**

- `id`: ID de la oferta (number)

**Response (200 OK):**

```typescript
interface ApplyResponse {
  success: boolean;
  message: string; // "Has aplicado exitosamente a esta oferta"
}
```

**Posibles errores:**
| Status | Código | Descripción |
|--------|--------|-------------|
| 404 | - | Oferta no encontrada |
| 409 | - | Ya aplicó a esta oferta |
| 409 | - | La oferta ya no está disponible |

---

### 2. Applications / My Applications (JFAL-27)

#### GET `/api/applications/my`

Obtiene todas las aplicaciones del usuario agrupadas por estado (para el Kanban).

**Headers requeridos:**

```
Authorization: Bearer <token>
```

**Response (200 OK):**

```typescript
interface MyApplicationsResponse {
  stats: {
    applied: number;
    interview: number;
    offer: number;
    rejected: number;
  };
  applications: {
    applied: Application[];
    interview: Application[];
    offer: Application[];
    rejected: Application[];
  };
}

interface Application {
  id: string; // ID de la aplicación (para PATCH)
  job: {
    id: number;
    title: string;
    company: string;
  };
  appliedDate: string; // Formato: "Jan 28, 2026"
  notes: string | null; // Notas personales del usuario
}
```

#### PATCH `/api/applications/:id/status`

Actualiza el estado de una aplicación (cuando el usuario mueve una tarjeta en el Kanban).

**Headers requeridos:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**URL Params:**

- `id`: ID de la aplicación (string)

**Body:**

```typescript
interface UpdateStatusRequest {
  status: 'APPLIED' | 'INTERVIEW' | 'OFFER' | 'REJECTED';
}
```

**Response (200 OK):**

```typescript
interface UpdateStatusResponse {
  success: boolean;
  message: string;
  newStatus: 'APPLIED' | 'INTERVIEW' | 'OFFER' | 'REJECTED';
}
```

#### PATCH `/api/applications/:id/notes`

Actualiza las notas personales de una aplicación.

**Body:**

```typescript
interface UpdateNotesRequest {
  notes: string; // Máximo 500 caracteres
}
```

**Response (200 OK):**

```typescript
interface UpdateNotesResponse {
  success: boolean;
  message: string;
}
```

---

### 3. Profile (JFAL-28 & JFAL-29)

#### GET `/api/profile/me`

Obtiene el perfil completo del usuario con stats y estado de strikes.

**Headers requeridos:**

```
Authorization: Bearer <token>
```

**Response (200 OK):**

```typescript
interface ProfileResponse {
  user: {
    id: string;
    email: string; // NO editable
    firstName: string;
    lastName: string;
    phone: string | null;
    city: string | null;
    country: string | null;
    reference: string | null; // NO editable (cómo nos conociste)
    avatar: string | null;
    role: string; // NO editable
    status: string; // NO editable
    createdAt: string; // ISO DateTime
  };
  subscription: {
    plan: string; // "High Ticket" | "Low Ticket" | "Staff"
    memberSince: string; // "January 2026"
  };
  stats: {
    completedClasses: number; // Clases pasadas con inscripción confirmada
    completedLessons: number; // Lecciones marcadas como completadas
    completedChallenges: number; // Challenges completados
  };
  strikes: {
    strikesCount: number; // 0-3
    maxStrikes: number; // Siempre 3
    resetDate: string | null; // ISO DateTime, null si no hay strikes
  };
}
```

**Lógica importante de Strikes:**

- Los strikes se resetean **14 días después del último strike**
- Si `strikesCount` es 0, `resetDate` será `null`
- Si el usuario alcanza 3 strikes, será **suspendido automáticamente**
- La sección de "Penalty Status" solo se muestra si `strikesCount > 0`
- Si `strikesCount === 0`, mostrar estado "Clean/Good Standing" en verde

#### PUT `/api/profile/me`

Actualiza el perfil del usuario.

**Headers requeridos:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body (todos los campos opcionales):**

```typescript
interface UpdateProfileRequest {
  firstName?: string; // Min 2, Max 50 caracteres
  lastName?: string; // Min 2, Max 50 caracteres
  phone?: string; // Max 20 caracteres
  city?: string; // Max 100 caracteres
  country?: string; // Max 100 caracteres
}
```

**Campos NO permitidos (el backend los ignora):**

- `email` - Requeriría re-validación
- `reference` - Solo se define al registrarse
- `role` - Solo admin puede cambiar
- `status` - Solo admin puede cambiar

**Response (200 OK):**

```typescript
interface UpdateProfileResponse {
  success: boolean;
  message: string;
  user: UserProfile; // Mismo formato que en GET /api/profile/me
}
```

---

## 🎨 Implementación Frontend

### JFAL-26: Job Board

**Archivos a modificar:**

- `frontend/src/app/(dashboard)/jobs/page.tsx`
- Crear: `frontend/src/store/jobs.ts`
- Crear: `frontend/src/types/jobs.ts`

**Requisitos de UI:**

1. **Header Stats:** 3 widgets mostrando:

   - Available Offers (total activas)
   - Active Applications (del usuario)
   - New This Week

2. **Barra de búsqueda y filtros:**

   - Input de búsqueda por título/empresa
   - Botón/dropdown de filtro por tipo (Full-time/Part-time)
   - Link a "My Applications"

3. **Listado (panel izquierdo):**

   - Tarjetas seleccionables
   - Mostrar: título, empresa, ubicación, salario, tipo
   - Indicador ✓ si ya aplicó (`hasApplied: true`)

4. **Detalle (panel derecho):**
   - Mostrar toda la información de la oferta seleccionada
   - Lista de requirements
   - Botón "Apply Now":
     - Si `hasApplied: false` → Botón activo, llama a POST `/api/jobs/:id/apply`
     - Si `hasApplied: true` → Botón deshabilitado, muestra "Applied" en gris

**Criterios de aceptación:**

- ✅ Si ya aplicó, el botón debe decir "Applied" y estar deshabilitado
- ✅ El buscador debe filtrar por título o empresa
- ✅ Debe mostrar feedback visual al aplicar exitosamente

---

### JFAL-27: My Applications (Kanban)

**Archivos a modificar:**

- `frontend/src/app/(dashboard)/jobs/my-applications/page.tsx`
- Actualizar: `frontend/src/store/jobs.ts`

**Librería de Drag & Drop:**
Usar `@dnd-kit/core` (recomendado por mejor mantenimiento):

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**Requisitos de UI:**

1. **Stats superiores:** 4 widgets con contadores por estado

   - Applied (azul)
   - Interview (púrpura)
   - Offer (verde)
   - Rejected (rojo)

2. **Tablero Kanban:** 4 columnas

   - Cada columna representa un estado
   - Las tarjetas muestran: título, empresa, fecha de aplicación, notas (si existen)
   - Indicador de drag (GripVertical icon)

3. **Drag & Drop:**

   - Al soltar una tarjeta en otra columna → PATCH `/api/applications/:id/status`
   - Feedback visual inmediato (optimistic update)
   - Si falla el API, revertir al estado anterior

4. **(Opcional V1) Notas personales:**
   - Al hacer clic en una tarjeta, abrir modal para editar notas
   - Guardar con PATCH `/api/applications/:id/notes`

**Criterios de aceptación:**

- ✅ El cambio de columna debe persistir en la base de datos
- ✅ Si recargo la página, la tarjeta sigue en la columna donde la dejé
- ✅ Feedback visual inmediato al soltar la tarjeta

**Ejemplo de implementación con @dnd-kit:**

```tsx
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

const handleDragEnd = async (event: DragEndEvent) => {
  const { active, over } = event;

  if (!over) return;

  const applicationId = active.id as string;
  const newStatus = over.id as ApplicationStatus;

  // Optimistic update
  updateLocalState(applicationId, newStatus);

  try {
    await api.patch(`/api/applications/${applicationId}/status`, {
      status: newStatus,
    });
  } catch (error) {
    // Revert on error
    revertLocalState(applicationId);
    toast.error('Error al actualizar el estado');
  }
};
```

---

### JFAL-28: Perfil - Stats y Strikes

**Archivos a modificar:**

- `frontend/src/app/(dashboard)/profile/page.tsx`
- Crear: `frontend/src/store/profile.ts`
- Crear: `frontend/src/types/profile.ts`

**Requisitos de UI:**

1. **Tarjeta de Suscripción:**

   - Mostrar plan (High Ticket/Low Ticket)
   - Mostrar "Member since [fecha]"
   - Diseño destacado (gradiente de marca)

2. **Widgets de Métricas:** 3 tarjetas

   - Classes Completed
   - Lessons Viewed
   - Challenges Completed

3. **Sección "Penalty Status":**

   - **Si `strikesCount === 0`:**
     - Mostrar badge verde "Good Standing" ✓
     - O simplemente ocultar la sección de alerta
   - **Si `strikesCount > 0`:**
     - Alerta amarilla/ámbar
     - Barra de progreso: `strikesCount / maxStrikes`
     - Texto: "Accumulated Strikes: X / 3"
     - Mostrar fecha de reseteo formateada: "Strikes reset on: Feb 15, 2026"
     - Texto explicativo sobre la regla de 24h

**Formato de fecha de reseteo:**

```typescript
const formatResetDate = (isoDate: string | null): string => {
  if (!isoDate) return '';
  return new Date(isoDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  // Resultado: "Feb 15, 2026"
};
```

---

### JFAL-29: Perfil - Formulario de Edición

**Archivos a modificar:**

- `frontend/src/app/(dashboard)/profile/page.tsx` (mismo archivo)

**Requisitos de UI:**

1. **Formulario con campos:**

   - First Name ✏️ (editable)
   - Last Name ✏️ (editable)
   - Email 🔒 (solo lectura, siempre deshabilitado)
   - Phone ✏️ (editable)
   - City ✏️ (editable)
   - Country ✏️ (editable)

2. **Estados del formulario:**

   - **Modo lectura (default):** Todos los inputs deshabilitados
   - **Modo edición:** Inputs editables habilitados (excepto email)

3. **Botones:**

   - "Edit" → Activa modo edición
   - "Save Changes" → Envía PUT y vuelve a modo lectura
   - (Opcional) "Cancel" → Descarta cambios y vuelve a modo lectura

4. **Validaciones frontend:**

   - firstName: mínimo 2 caracteres
   - lastName: mínimo 2 caracteres
   - Mostrar errores de validación inline

5. **Feedback:**
   - Toast de éxito: "Perfil actualizado correctamente"
   - Toast de error si falla

**Criterios de aceptación:**

- ✅ Validación de campos requeridos antes de enviar
- ✅ Los inputs deben estar deshabilitados por defecto
- ✅ El email NUNCA debe ser editable (incluso en modo edición)

---

## 📁 Tipos TypeScript Sugeridos

Crear archivo `frontend/src/types/jobs.ts`:

```typescript
export type ApplicationStatus = 'APPLIED' | 'INTERVIEW' | 'OFFER' | 'REJECTED';

export interface JobOffer {
  id: number;
  title: string;
  company: string;
  location: string;
  salaryRange: string;
  type: string;
  description: string;
  requirements: string[];
  hasApplied: boolean;
  createdAt: string;
}

export interface JobStats {
  availableOffers: number;
  activeApplications: number;
  newThisWeek: number;
}

export interface JobListResponse {
  stats: JobStats;
  jobs: JobOffer[];
}

export interface Application {
  id: string;
  job: {
    id: number;
    title: string;
    company: string;
  };
  appliedDate: string;
  notes: string | null;
}

export interface ApplicationsByStatus {
  applied: Application[];
  interview: Application[];
  offer: Application[];
  rejected: Application[];
}

export interface ApplicationStats {
  applied: number;
  interview: number;
  offer: number;
  rejected: number;
}

export interface MyApplicationsResponse {
  stats: ApplicationStats;
  applications: ApplicationsByStatus;
}
```

Crear archivo `frontend/src/types/profile.ts`:

```typescript
export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  city: string | null;
  country: string | null;
  reference: string | null;
  avatar: string | null;
  role: string;
  status: string;
  createdAt: string;
}

export interface SubscriptionInfo {
  plan: string;
  memberSince: string;
}

export interface ProfileStats {
  completedClasses: number;
  completedLessons: number;
  completedChallenges: number;
}

export interface StrikeInfo {
  strikesCount: number;
  maxStrikes: number;
  resetDate: string | null;
}

export interface ProfileResponse {
  user: UserProfile;
  subscription: SubscriptionInfo;
  stats: ProfileStats;
  strikes: StrikeInfo;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  city?: string;
  country?: string;
}
```

---

## 🧪 Datos de Prueba

El seed ya incluye datos para probar:

**Usuario de prueba:**

- Email: `eugenia@test.com`
- Password: `password123`

**Job Offers creadas:** 6 ofertas activas

- $15k/Mo Closers for Info Coaching
- $8k/Mo Setters for AI SaaS
- $6k/Mo CSMs for Yoga Biz-Opp
- Senior Frontend Developer
- English Teacher (Online)
- Marketing Coordinator

**Applications del usuario de prueba:**

- 1 en estado APPLIED (CSMs for Yoga)
- 1 en estado INTERVIEW (English Teacher)
- 1 en estado OFFER (Marketing Coordinator)

---

## ⚠️ Consideraciones Importantes

1. **Manejo de errores:** Todas las respuestas de error del backend vienen con el formato:

   ```typescript
   {
     statusCode: number;
     message: string | string[];
     error?: string;
   }
   ```

2. **Autenticación:** Todos los endpoints requieren el header `Authorization: Bearer <token>`

3. **Optimistic Updates:** Para mejor UX en el Kanban, actualizar el estado local antes de esperar la respuesta del servidor

4. **Responsive:** Las páginas actuales ya tienen diseño responsive, mantener el patrón

5. **Toast notifications:** Usar el sistema de toasts existente para feedback

---

## 🔄 Pasos para Ejecutar

1. Asegurarse de que el backend esté corriendo
2. Ejecutar la migración: `npx prisma migrate dev`
3. Ejecutar el seed: `npx prisma db seed`
4. El backend estará listo para recibir peticiones

---

## ✅ Checklist de Implementación

### JFAL-26: Job Board

- [ ] Crear store de jobs con Zustand
- [ ] Crear tipos en `types/jobs.ts`
- [ ] Reemplazar mock data con llamadas a API
- [ ] Implementar búsqueda y filtros
- [ ] Implementar acción de aplicar
- [ ] Manejar estado `hasApplied` en botón

### JFAL-27: My Applications

- [ ] Instalar @dnd-kit/core
- [ ] Implementar drag & drop entre columnas
- [ ] Conectar con PATCH de status
- [ ] Implementar optimistic updates
- [ ] (Opcional) Implementar edición de notas

### JFAL-28: Profile Stats & Strikes

- [ ] Crear store de profile
- [ ] Crear tipos en `types/profile.ts`
- [ ] Reemplazar mock data con llamada a GET /api/profile/me
- [ ] Implementar lógica condicional de strikes
- [ ] Formatear fecha de reseteo correctamente

### JFAL-29: Profile Edit Form

- [ ] Implementar toggle de modo edición
- [ ] Deshabilitar campo email siempre
- [ ] Implementar validaciones
- [ ] Conectar con PUT /api/profile/me
- [ ] Mostrar toasts de feedback

---

**¡El backend está listo! Adelante con la implementación del frontend.** 🚀
