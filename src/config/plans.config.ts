// src/config/plans.config.ts
import type { UserPlan } from '@prisma/client';

/**
 * Duración de cada plan en meses
 */
export const PLAN_DURATION_MONTHS: Record<UserPlan, number> = {
  PRO: 1, // 1 mes
  ELITE: 3, // 3 meses
  LEVEL_UP: 6, // 6 meses
  HIRING_HUB: 1, // 1 mes
  SKILL_BUILDER: 1, // 1 mes
};

/**
 * Niveles de acceso por plan
 * Nivel 1: Acceso completo (todas las áreas)
 * Nivel 2: Contenido + Job Board (sin clases en vivo)
 * Nivel 3: Solo contenido (módulos/desafíos habilitados por admin)
 */
export const PLAN_ACCESS_LEVEL: Record<UserPlan, 1 | 2 | 3> = {
  PRO: 1,
  ELITE: 1,
  LEVEL_UP: 1,
  HIRING_HUB: 2,
  SKILL_BUILDER: 3,
};

/**
 * Features habilitadas por nivel
 */
export interface PlanFeatures {
  academy: boolean;
  challenges: boolean;
  liveClasses: boolean;
  jobBoard: boolean;
}

export const PLAN_FEATURES: Record<1 | 2 | 3, PlanFeatures> = {
  1: {
    academy: true,
    challenges: true,
    liveClasses: true,
    jobBoard: true,
  },
  2: {
    academy: true,
    challenges: true,
    liveClasses: false, // Puede ver pero no clickear
    jobBoard: true,
  },
  3: {
    academy: true, // Solo módulos habilitados por admin
    challenges: true, // Solo desafíos habilitados por admin
    liveClasses: false, // Puede ver pero no clickear
    jobBoard: false, // Puede ver pero no clickear
  },
};

/**
 * Calcula la fecha de fin basada en el plan y fecha de inicio
 */
export function calculateEndDate(plan: UserPlan, startDate: Date = new Date()): Date {
  const months = PLAN_DURATION_MONTHS[plan];
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + months);
  return endDate;
}

/**
 * Obtener las features de un plan
 */
export function getPlanFeatures(plan: UserPlan): PlanFeatures {
  const level = PLAN_ACCESS_LEVEL[plan];
  return PLAN_FEATURES[level];
}
