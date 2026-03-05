-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('USER_CREATED', 'USER_APPROVED', 'USER_REJECTED', 'USER_SUSPENDED', 'USER_ACTIVATED', 'USER_DELETED', 'USER_UPDATED', 'USER_STRIKE_ISSUED', 'ADMIN_CREATED', 'ADMIN_UPDATED', 'ADMIN_DELETED', 'SUBSCRIPTION_CREATED', 'SUBSCRIPTION_UPDATED', 'SUBSCRIPTION_CANCELLED', 'SUBSCRIPTION_DELETED', 'CLASS_CREATED', 'CLASS_UPDATED', 'CLASS_DELETED', 'CLASS_ATTENDANCE_MARKED', 'MODULE_CREATED', 'MODULE_UPDATED', 'MODULE_DELETED', 'LESSON_CREATED', 'LESSON_UPDATED', 'LESSON_DELETED', 'CHALLENGE_CREATED', 'CHALLENGE_UPDATED', 'CHALLENGE_DELETED', 'SUBMISSION_REVIEWED', 'JOB_CREATED', 'JOB_UPDATED', 'JOB_DELETED', 'SYSTEM_CONFIG_UPDATED', 'LOGIN_SUCCESS', 'LOGIN_FAILED');

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "admin_email" TEXT NOT NULL,
    "admin_name" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "target_type" TEXT,
    "target_id" TEXT,
    "target_name" TEXT,
    "details" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_admin_id_idx" ON "audit_logs"("admin_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_target_type_idx" ON "audit_logs"("target_type");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");
