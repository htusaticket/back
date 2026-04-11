import * as dotenv from 'dotenv';
dotenv.config();

import {
  PrismaClient,
  UserRole,
  UserStatus,
  UserPlan,
  SubscriptionStatus,
  ClassType,
  EnrollmentStatus,
  NotificationType,
  SubmissionStatus,
  ResourceType,
  ApplicationStatus,
  AuditAction,
} from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

// ============================================================
// HELPERS
// ============================================================
function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function todayAt(hours: number, minutes = 0): Date {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function dayAt(daysOffset: number, hours: number, minutes = 0): Date {
  const d = daysFromNow(daysOffset);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function pastDate(daysAgo: number): Date {
  return daysFromNow(-daysAgo);
}

async function main() {
  console.log('🌱 Starting comprehensive seed (Sprint 6)...');

  // ============================================================
  // CLEAN DATABASE
  // ============================================================
  console.log('🧹 Cleaning database...');
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.strike.deleteMany();
  await prisma.classEnrollment.deleteMany();
  await prisma.classSession.deleteMany();
  await prisma.userDailyChallengeProgress.deleteMany();
  await prisma.dailyChallenge.deleteMany();
  await prisma.userLessonProgress.deleteMany();
  await prisma.userModuleProgress.deleteMany();
  await prisma.lessonResource.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.module.deleteMany();
  await prisma.passwordReset.deleteMany();
  await prisma.userSession.deleteMany();
  await prisma.jobApplication.deleteMany();
  await prisma.jobOffer.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.user.deleteMany();
  await prisma.systemConfig.deleteMany();

  // ============================================================
  // SYSTEM CONFIG
  // ============================================================
  console.log('⚙️  Creating system config...');
  await prisma.systemConfig.create({
    data: {
      strikesEnabled: true,
      maxStrikesForPunishment: 3,
      punishmentDurationDays: 7,
      lateCancellationHours: 2,
      jobBoardEnabled: true,
      academyEnabled: true,
    },
  });

  // ============================================================
  // USERS (12 total — covers every role, status, plan)
  // ============================================================
  console.log('👥 Creating users...');
  const pw = await bcrypt.hash('password123', 10);

  // --- SUPERADMINS (2) ---
  const luby = await prisma.user.create({
    data: {
      email: 'luby.demidova@gmail.com',
      password: pw,
      firstName: 'Luby',
      lastName: 'Demidova',
      role: UserRole.SUPERADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  const john = await prisma.user.create({
    data: {
      email: 'johnfalcon.va@gmail.com',
      password: pw,
      firstName: 'John',
      lastName: 'Falcon',
      role: UserRole.SUPERADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  // --- ADMIN / Teacher (2) ---
  const adminSarah = await prisma.user.create({
    data: {
      email: 'sarah@jfalcon.com',
      password: pw,
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  const adminCarlos = await prisma.user.create({
    data: {
      email: 'carlos@jfalcon.com',
      password: pw,
      firstName: 'Carlos',
      lastName: 'Rivera',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  // --- ACTIVE USERS (one per plan) ---
  const userPro = await prisma.user.create({
    data: {
      email: 'eugenia@test.com',
      password: pw,
      firstName: 'Eugenia',
      lastName: 'Martinez',
      phone: '+1234567890',
      city: 'Buenos Aires',
      country: 'Argentina',
      reference: 'Google Search',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
    },
  });

  const userElite = await prisma.user.create({
    data: {
      email: 'diego@test.com',
      password: pw,
      firstName: 'Diego',
      lastName: 'Marzioni',
      phone: '+0987654321',
      city: 'Madrid',
      country: 'Spain',
      reference: 'Instagram Ad',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
    },
  });

  // Santiago — Alumno ELITE (SyroxTech)
  const santiago = await prisma.user.create({
    data: {
      email: 'santiago@syroxtech.com',
      password: pw,
      firstName: 'Santiago',
      lastName: 'Perez Baglivo',
      phone: '+5491155667788',
      city: 'Buenos Aires',
      country: 'Argentina',
      reference: 'SyroxTech Internal',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
    },
  });
  console.log(`   \u2713 User (ELITE): ${santiago.email}`);

  const userLevelUp = await prisma.user.create({
    data: {
      email: 'maria@test.com',
      password: pw,
      firstName: 'Maria',
      lastName: 'Gonzalez',
      phone: '+1122334455',
      city: 'Mexico City',
      country: 'Mexico',
      reference: 'Friend referral',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
    },
  });

  const userHiringHub = await prisma.user.create({
    data: {
      email: 'lucas@test.com',
      password: pw,
      firstName: 'Lucas',
      lastName: 'Fernandez',
      phone: '+5566778899',
      city: 'Bogota',
      country: 'Colombia',
      reference: 'LinkedIn',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
    },
  });

  const userSkillBuilder = await prisma.user.create({
    data: {
      email: 'ana@test.com',
      password: pw,
      firstName: 'Ana',
      lastName: 'Lopez',
      phone: '+9988776655',
      city: 'Lima',
      country: 'Peru',
      reference: 'YouTube',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
    },
  });

  // --- JOB_UPLOADER ---
  const jobUploader = await prisma.user.create({
    data: {
      email: 'recruiter@talent.com',
      password: pw,
      firstName: 'Rachel',
      lastName: 'Thompson',
      city: 'Miami',
      country: 'USA',
      role: UserRole.JOB_UPLOADER,
      status: UserStatus.ACTIVE,
    },
  });

  // --- PENDING USER ---
  const pendingUser = await prisma.user.create({
    data: {
      email: 'pending@test.com',
      password: pw,
      firstName: 'Pending',
      lastName: 'Applicant',
      phone: '+5555555555',
      city: 'Santiago',
      country: 'Chile',
      reference: 'TikTok',
      role: UserRole.USER,
      status: UserStatus.PENDING,
    },
  });

  // --- SUSPENDED USER ---
  const suspendedUser = await prisma.user.create({
    data: {
      email: 'suspended@test.com',
      password: pw,
      firstName: 'Suspended',
      lastName: 'Person',
      city: 'Test City',
      country: 'Test Country',
      role: UserRole.USER,
      status: UserStatus.SUSPENDED,
      adminNotes: JSON.stringify({ notes: 'Suspended for repeated no-shows.' }),
    },
  });

  // ============================================================
  // SUBSCRIPTIONS (mix of paid/unpaid, active/expired)
  // ============================================================
  console.log('💳 Creating subscriptions...');
  const monthFromNow = daysFromNow(30);

  // PRO — paid, active
  await prisma.subscription.create({
    data: {
      userId: userPro.id,
      plan: UserPlan.PRO,
      status: SubscriptionStatus.ACTIVE,
      startDate: pastDate(15),
      endDate: monthFromNow,
      hasPaid: true,
      paidAt: pastDate(15),
      paymentNote: 'PayPal - $197',
      assignedBy: luby.id,
    },
  });

  // ELITE — paid, active
  await prisma.subscription.create({
    data: {
      userId: userElite.id,
      plan: UserPlan.ELITE,
      status: SubscriptionStatus.ACTIVE,
      startDate: pastDate(10),
      endDate: monthFromNow,
      hasPaid: true,
      paidAt: pastDate(10),
      paymentNote: 'Stripe - $297',
      assignedBy: luby.id,
    },
  });

  // LEVEL_UP — NOT paid (free trial)
  await prisma.subscription.create({
    data: {
      userId: userLevelUp.id,
      plan: UserPlan.LEVEL_UP,
      status: SubscriptionStatus.ACTIVE,
      startDate: pastDate(5),
      endDate: daysFromNow(25),
      hasPaid: false,
      paymentNote: 'Free trial — 30 days',
      assignedBy: john.id,
    },
  });

  // HIRING_HUB — paid, active
  await prisma.subscription.create({
    data: {
      userId: userHiringHub.id,
      plan: UserPlan.HIRING_HUB,
      status: SubscriptionStatus.ACTIVE,
      startDate: pastDate(20),
      endDate: daysFromNow(10),
      hasPaid: true,
      paidAt: pastDate(20),
      paymentNote: 'Zelle - $147',
      assignedBy: john.id,
    },
  });

  // SKILL_BUILDER — NOT paid
  await prisma.subscription.create({
    data: {
      userId: userSkillBuilder.id,
      plan: UserPlan.SKILL_BUILDER,
      status: SubscriptionStatus.ACTIVE,
      startDate: pastDate(3),
      endDate: daysFromNow(27),
      hasPaid: false,
      paymentNote: 'Scholarship',
      assignedBy: luby.id,
    },
  });

  // Expired subscription for suspended user
  await prisma.subscription.create({
    data: {
      userId: suspendedUser.id,
      plan: UserPlan.PRO,
      status: SubscriptionStatus.EXPIRED,
      startDate: pastDate(60),
      endDate: pastDate(30),
      hasPaid: true,
      paidAt: pastDate(60),
      paymentNote: 'Expired and not renewed',
      assignedBy: luby.id,
    },
  });

  // ============================================================
  // MODULES & LESSONS (6 modules — 3 visibleForSkillBuilder, 3 not)
  // ============================================================
  console.log('📚 Creating modules and lessons...');

  // MODULE 1 — visibleForSkillBuilder: TRUE
  const mod1 = await prisma.module.create({
    data: {
      title: 'Foundations & Goals',
      description:
        'Start your journey by setting clear objectives and understanding core principles of effective language learning.',
      image:
        'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1000&auto=format&fit=crop',
      order: 1,
      visibleForSkillBuilder: true,
    },
  });

  const l1_1 = await prisma.lesson.create({
    data: {
      title: 'Introduction to the Course',
      description: 'Welcome! Learn about the course structure.',
      duration: '10 min',
      contentUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      order: 1,
      moduleId: mod1.id,
    },
  });
  const l1_2 = await prisma.lesson.create({
    data: {
      title: 'Setting SMART Goals',
      description: 'Specific, Measurable, Achievable, Relevant, Time-bound goals.',
      duration: '15 min',
      contentUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      order: 2,
      moduleId: mod1.id,
    },
  });
  const l1_3 = await prisma.lesson.create({
    data: {
      title: 'Essential Vocabulary Building',
      description: 'Spaced repetition and active recall methods.',
      duration: '20 min',
      contentUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      order: 3,
      moduleId: mod1.id,
    },
  });

  await prisma.lessonResource.createMany({
    data: [
      {
        title: 'Course Syllabus.pdf',
        fileUrl: 'https://example.com/resources/course-syllabus.pdf',
        type: ResourceType.PDF,
        size: '245 KB',
        lessonId: l1_1.id,
      },
      {
        title: 'Goal Setting Worksheet.pdf',
        fileUrl: 'https://example.com/resources/goal-worksheet.pdf',
        type: ResourceType.PDF,
        size: '180 KB',
        lessonId: l1_2.id,
      },
      {
        title: 'Vocabulary Flashcards.pdf',
        fileUrl: 'https://example.com/resources/flashcards.pdf',
        type: ResourceType.PDF,
        size: '320 KB',
        lessonId: l1_3.id,
      },
      {
        title: 'Anki App Guide',
        fileUrl: 'https://apps.ankiweb.net/',
        type: ResourceType.LINK,
        size: null,
        lessonId: l1_3.id,
      },
    ],
  });

  // MODULE 2 — visibleForSkillBuilder: TRUE
  const mod2 = await prisma.module.create({
    data: {
      title: 'Conversation Basics',
      description:
        'Master small talk and introductions. Learn to confidently start conversations in professional settings.',
      image:
        'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1000&auto=format&fit=crop',
      order: 2,
      visibleForSkillBuilder: true,
    },
  });

  const l2_1 = await prisma.lesson.create({
    data: {
      title: 'Greetings and Introductions',
      description: 'Formal and informal greetings for different contexts.',
      duration: '12 min',
      contentUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      order: 1,
      moduleId: mod2.id,
    },
  });
  const l2_2 = await prisma.lesson.create({
    data: {
      title: 'Small Talk Techniques',
      description: 'Common expressions and useful questions for casual conversations.',
      duration: '18 min',
      contentUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      order: 2,
      moduleId: mod2.id,
    },
  });
  const l2_3 = await prisma.lesson.create({
    data: {
      title: 'Active Listening Skills',
      description: 'Understand native speakers and engage more meaningfully.',
      duration: '22 min',
      contentUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      order: 3,
      moduleId: mod2.id,
    },
  });

  await prisma.lessonResource.createMany({
    data: [
      {
        title: 'Common Greetings Cheatsheet.pdf',
        fileUrl: 'https://example.com/resources/greetings-cheatsheet.pdf',
        type: ResourceType.PDF,
        size: '150 KB',
        lessonId: l2_1.id,
      },
      {
        title: 'Small Talk Topics.pdf',
        fileUrl: 'https://example.com/resources/smalltalk-topics.pdf',
        type: ResourceType.PDF,
        size: '180 KB',
        lessonId: l2_2.id,
      },
      {
        title: 'Practice Exercises.pdf',
        fileUrl: 'https://example.com/resources/exercises-2-3.pdf',
        type: ResourceType.PDF,
        size: '320 KB',
        lessonId: l2_3.id,
      },
    ],
  });

  // MODULE 3 — visibleForSkillBuilder: FALSE
  const mod3 = await prisma.module.create({
    data: {
      title: 'Business English',
      description:
        'Corporate communication: professional emails, impactful presentations, and meeting vocabulary.',
      image:
        'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=1000&auto=format&fit=crop',
      order: 3,
      visibleForSkillBuilder: false,
    },
  });

  const l3_1 = await prisma.lesson.create({
    data: {
      title: 'Professional Email Writing',
      description: 'Clear, professional emails with proper formatting and tone.',
      duration: '25 min',
      contentUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      order: 1,
      moduleId: mod3.id,
    },
  });
  const l3_2 = await prisma.lesson.create({
    data: {
      title: 'Meeting Vocabulary & Phrases',
      description: 'Essential vocabulary for participating in business meetings.',
      duration: '20 min',
      contentUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      order: 2,
      moduleId: mod3.id,
    },
  });
  const l3_3 = await prisma.lesson.create({
    data: {
      title: 'Delivering Presentations',
      description:
        'Build confidence presenting in English: structure, transitions, audience engagement.',
      duration: '30 min',
      contentUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      order: 3,
      moduleId: mod3.id,
    },
  });

  await prisma.lessonResource.createMany({
    data: [
      {
        title: 'Email Templates.pdf',
        fileUrl: 'https://example.com/resources/email-templates.pdf',
        type: ResourceType.PDF,
        size: '290 KB',
        lessonId: l3_1.id,
      },
      {
        title: 'Meeting Phrases Reference.pdf',
        fileUrl: 'https://example.com/resources/meeting-phrases.pdf',
        type: ResourceType.PDF,
        size: '200 KB',
        lessonId: l3_2.id,
      },
      {
        title: 'Presentation Slides Template',
        fileUrl: 'https://docs.google.com/presentation/d/example',
        type: ResourceType.LINK,
        size: null,
        lessonId: l3_3.id,
      },
    ],
  });

  // MODULE 4 — visibleForSkillBuilder: TRUE
  const mod4 = await prisma.module.create({
    data: {
      title: 'Advanced Idioms & Culture',
      description:
        'Complex idioms, cultural nuances, and advanced negotiation tactics for near-native fluency.',
      image:
        'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1000&auto=format&fit=crop',
      order: 4,
      visibleForSkillBuilder: true,
    },
  });

  const l4_1 = await prisma.lesson.create({
    data: {
      title: 'Common Idioms & Expressions',
      description: 'Most common English idioms in everyday and business contexts.',
      duration: '18 min',
      contentUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      order: 1,
      moduleId: mod4.id,
    },
  });
  const l4_2 = await prisma.lesson.create({
    data: {
      title: 'Cultural Nuances in Communication',
      description: 'Cultural context behind English communication styles.',
      duration: '25 min',
      contentUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      order: 2,
      moduleId: mod4.id,
    },
  });

  await prisma.lessonResource.createMany({
    data: [
      {
        title: 'Idioms Dictionary.pdf',
        fileUrl: 'https://example.com/resources/idioms-dictionary.pdf',
        type: ResourceType.PDF,
        size: '450 KB',
        lessonId: l4_1.id,
      },
    ],
  });

  // MODULE 5 — visibleForSkillBuilder: FALSE
  const mod5 = await prisma.module.create({
    data: {
      title: 'Interview Mastery',
      description:
        'Master job interviews in English. Multiple video perspectives for comprehensive preparation.',
      image:
        'https://images.unsplash.com/photo-1565688534245-05d6b5be184a?q=80&w=1000&auto=format&fit=crop',
      order: 5,
      visibleForSkillBuilder: false,
    },
  });

  const l5_1 = await prisma.lesson.create({
    data: {
      title: 'Tell Me About Yourself',
      description: 'Craft the perfect answer to the most common interview question.',
      duration: '28 min',
      contentUrl: 'https://www.youtube.com/embed/es7XtrloDIQ',
      order: 1,
      moduleId: mod5.id,
    },
  });
  const l5_2 = await prisma.lesson.create({
    data: {
      title: 'Handling Salary Negotiations',
      description: 'Key phrases and strategies for salary negotiation.',
      duration: '35 min',
      contentUrl: 'https://www.youtube.com/embed/XCtOXJwPkC0',
      order: 2,
      moduleId: mod5.id,
    },
  });
  const l5_3 = await prisma.lesson.create({
    data: {
      title: 'Behavioral Questions (STAR Method)',
      description: 'The STAR method for answering behavioral questions.',
      duration: '32 min',
      contentUrl: 'https://www.youtube.com/embed/qKBubKO-798',
      order: 3,
      moduleId: mod5.id,
    },
  });

  await prisma.lessonResource.createMany({
    data: [
      {
        title: 'Part 2: Real Interview Examples',
        fileUrl: 'https://www.youtube.com/embed/kayOhGRcNt4',
        type: ResourceType.VIDEO,
        size: '15 min',
        lessonId: l5_1.id,
      },
      {
        title: 'Personal Pitch Template.pdf',
        fileUrl: 'https://example.com/resources/personal-pitch-template.pdf',
        type: ResourceType.PDF,
        size: '180 KB',
        lessonId: l5_1.id,
      },
      {
        title: 'Part 2: Advanced Negotiation Tactics',
        fileUrl: 'https://www.youtube.com/embed/wFjlq0vEJBw',
        type: ResourceType.VIDEO,
        size: '18 min',
        lessonId: l5_2.id,
      },
      {
        title: 'Salary Research Worksheet.pdf',
        fileUrl: 'https://example.com/resources/salary-worksheet.pdf',
        type: ResourceType.PDF,
        size: '220 KB',
        lessonId: l5_2.id,
      },
      {
        title: 'Part 2: Practice STAR Answers',
        fileUrl: 'https://www.youtube.com/embed/GvJ9G2BKDGM',
        type: ResourceType.VIDEO,
        size: '20 min',
        lessonId: l5_3.id,
      },
      {
        title: 'STAR Method Cheatsheet.pdf',
        fileUrl: 'https://example.com/resources/star-method-cheatsheet.pdf',
        type: ResourceType.PDF,
        size: '150 KB',
        lessonId: l5_3.id,
      },
      {
        title: '50 Common Behavioral Questions.pdf',
        fileUrl: 'https://example.com/resources/behavioral-questions.pdf',
        type: ResourceType.PDF,
        size: '320 KB',
        lessonId: l5_3.id,
      },
    ],
  });

  // MODULE 6 — visibleForSkillBuilder: FALSE (DRAFT status)
  const mod6 = await prisma.module.create({
    data: {
      title: 'Sales English (Coming Soon)',
      description:
        'Master the language of sales: cold calling scripts, objection handling, and closing techniques.',
      image:
        'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1000&auto=format&fit=crop',
      order: 6,
      status: 'DRAFT',
      visibleForSkillBuilder: false,
    },
  });

  // ============================================================
  // USER PROGRESS (for PRO user — most progress)
  // ============================================================
  console.log('📝 Creating user progress...');

  // PRO user: Module 1 complete, Module 2 partial, Module 3 partial
  await prisma.userLessonProgress.createMany({
    data: [
      { userId: userPro.id, lessonId: l1_1.id, completed: true, lastAccessedAt: pastDate(7) },
      { userId: userPro.id, lessonId: l1_2.id, completed: true, lastAccessedAt: pastDate(6) },
      { userId: userPro.id, lessonId: l1_3.id, completed: true, lastAccessedAt: pastDate(5) },
      { userId: userPro.id, lessonId: l2_1.id, completed: true, lastAccessedAt: pastDate(3) },
      { userId: userPro.id, lessonId: l2_2.id, completed: true, lastAccessedAt: pastDate(2) },
      { userId: userPro.id, lessonId: l2_3.id, completed: false, lastAccessedAt: pastDate(1) },
      { userId: userPro.id, lessonId: l3_1.id, completed: true, lastAccessedAt: pastDate(4) },
      { userId: userPro.id, lessonId: l3_2.id, completed: true, lastAccessedAt: pastDate(3) },
    ],
  });
  await prisma.userModuleProgress.createMany({
    data: [
      { userId: userPro.id, moduleId: mod1.id, progress: 100 },
      { userId: userPro.id, moduleId: mod2.id, progress: 66 },
      { userId: userPro.id, moduleId: mod3.id, progress: 66 },
      { userId: userPro.id, moduleId: mod4.id, progress: 0 },
    ],
  });

  // ELITE user: Module 1 complete
  await prisma.userLessonProgress.createMany({
    data: [
      { userId: userElite.id, lessonId: l1_1.id, completed: true, lastAccessedAt: pastDate(4) },
      { userId: userElite.id, lessonId: l1_2.id, completed: true, lastAccessedAt: pastDate(3) },
      { userId: userElite.id, lessonId: l1_3.id, completed: true, lastAccessedAt: pastDate(2) },
      { userId: userElite.id, lessonId: l2_1.id, completed: true, lastAccessedAt: pastDate(1) },
    ],
  });
  await prisma.userModuleProgress.createMany({
    data: [
      { userId: userElite.id, moduleId: mod1.id, progress: 100 },
      { userId: userElite.id, moduleId: mod2.id, progress: 33 },
    ],
  });

  // SKILL_BUILDER user: some progress on visible modules only
  await prisma.userLessonProgress.createMany({
    data: [
      {
        userId: userSkillBuilder.id,
        lessonId: l1_1.id,
        completed: true,
        lastAccessedAt: pastDate(2),
      },
      {
        userId: userSkillBuilder.id,
        lessonId: l1_2.id,
        completed: false,
        lastAccessedAt: pastDate(1),
      },
    ],
  });
  await prisma.userModuleProgress.createMany({
    data: [{ userId: userSkillBuilder.id, moduleId: mod1.id, progress: 33 }],
  });

  // ============================================================
  // CLASS SESSIONS (8 — past, today, near future, next week)
  // ============================================================
  console.log('🏫 Creating class sessions...');

  // Past class (2 days ago) — for attendance/strike testing
  const classPast = await prisma.classSession.create({
    data: {
      title: 'Pronunciation Workshop',
      type: ClassType.WORKSHOP,
      startTime: dayAt(-2, 10, 0),
      endTime: dayAt(-2, 11, 30),
      capacityMax: null,
      meetLink: 'https://meet.google.com/past-class',
      description: 'Interactive session to master difficult phonemes.',
    },
  });

  // Past class (yesterday)
  const classYesterday = await prisma.classSession.create({
    data: {
      title: 'Debate Club: A.I. Ethics',
      type: ClassType.REGULAR,
      startTime: dayAt(-1, 14, 0),
      endTime: dayAt(-1, 15, 30),
      capacityMax: 8,
      meetLink: 'https://meet.google.com/yesterday-debate',
      description: 'Structured debate practice on AI Ethics.',
    },
  });

  // Today's class — 6pm
  const classToday = await prisma.classSession.create({
    data: {
      title: 'Conversational Advanced II',
      type: ClassType.REGULAR,
      startTime: todayAt(18, 0),
      endTime: todayAt(19, 0),
      capacityMax: 5,
      meetLink: 'https://meet.google.com/abc-defg-hij',
      materialsLink: 'https://drive.google.com/file/materials1',
      description: 'Advanced conversation practice focusing on current events.',
    },
  });

  // Tomorrow — 5pm (near full)
  const classTomorrow1 = await prisma.classSession.create({
    data: {
      title: 'Grammar Review Session',
      type: ClassType.REGULAR,
      startTime: dayAt(1, 17, 0),
      endTime: dayAt(1, 18, 0),
      capacityMax: 5,
      meetLink: 'https://meet.google.com/ghi-jklm-nop',
      description: 'Deep dive into complex grammar structures.',
    },
  });

  // Tomorrow — 7pm (unlimited workshop)
  const classTomorrow2 = await prisma.classSession.create({
    data: {
      title: 'Business English Masterclass',
      type: ClassType.WORKSHOP,
      startTime: dayAt(1, 19, 0),
      endTime: dayAt(1, 20, 30),
      capacityMax: null,
      meetLink: 'https://meet.google.com/qrs-tuvw-xyz',
      materialsLink: 'https://drive.google.com/file/materials3',
      description: 'Open workshop on professional communication skills.',
    },
  });

  // Day after tomorrow — QA session
  const classDA = await prisma.classSession.create({
    data: {
      title: 'Q&A: Job Interview Prep',
      type: ClassType.QA,
      startTime: dayAt(2, 15, 0),
      endTime: dayAt(2, 16, 0),
      capacityMax: 10,
      meetLink: 'https://meet.google.com/qa-session',
      description: 'Open Q&A about job interview preparation.',
    },
  });

  // Next week — Masterclass
  const classNextWeek = await prisma.classSession.create({
    data: {
      title: 'IELTS Prep: Writing Task 2',
      type: ClassType.MASTERCLASS,
      startTime: dayAt(7, 18, 0),
      endTime: dayAt(7, 19, 0),
      capacityMax: 6,
      meetLink: 'https://meet.google.com/ddd-eeee-fff',
      materialsLink: 'https://drive.google.com/file/materials6',
      description: 'Focused strategy session for the IELTS writing component.',
    },
  });

  // Next week + 1 — Webinar
  const classWebinar = await prisma.classSession.create({
    data: {
      title: 'Guest Speaker: Life as a Remote Closer',
      type: ClassType.WEBINAR,
      startTime: dayAt(8, 20, 0),
      endTime: dayAt(8, 21, 30),
      capacityMax: null,
      meetLink: 'https://meet.google.com/webinar-guest',
      description: 'Special guest shares experience working remotely as a closer.',
    },
  });

  // Today — Santiago's class with extra materials (10am)
  const classSantiago = await prisma.classSession.create({
    data: {
      title: 'Sales Vocabulary & Cold Calling Scripts',
      type: ClassType.MASTERCLASS,
      startTime: todayAt(10, 0),
      endTime: todayAt(11, 30),
      capacityMax: 10,
      meetLink: 'https://meet.google.com/santiago-masterclass',
      materialsLink: 'https://drive.google.com/file/santiago-materials',
      description:
        'Masterclass on sales vocabulary and cold calling scripts. Includes downloadable templates, role-play audio examples, and a comprehensive PDF guide.',
    },
  });

  // Today — Eugenia's live class with MULTIPLE materials (for testing materials modal)
  const classEugeniaMultiMaterials = await prisma.classSession.create({
    data: {
      title: 'Advanced Negotiation & Closing Techniques',
      type: ClassType.MASTERCLASS,
      startTime: todayAt(20, 0),
      endTime: todayAt(21, 30),
      capacityMax: 8,
      meetLink: 'https://meet.google.com/nego-masterclass',
      materialsLink: [
        'https://docs.google.com/document/d/negotiation-playbook',
        'https://drive.google.com/file/d/closing-techniques-pdf',
        'https://drive.google.com/file/d/roleplay-scripts-doc',
        'https://docs.google.com/spreadsheets/d/objection-handling-sheet',
        'https://www.loom.com/share/negotiation-demo-video',
      ].join(', '),
      description:
        'Master advanced negotiation tactics and closing techniques. Includes a negotiation playbook, closing techniques PDF, role-play scripts, objection handling spreadsheet, and a demo video.',
      visibleForSkillBuilderLive: true,
    },
  });

  // ============================================================
  // ENROLLMENTS (varied statuses and attendance)
  // ============================================================
  console.log('✅ Creating enrollments...');

  // Past class — PRO user was present
  await prisma.classEnrollment.create({
    data: {
      userId: userPro.id,
      classSessionId: classPast.id,
      status: EnrollmentStatus.CONFIRMED,
      attendanceStatus: 'PRESENT',
      attendanceMarkedAt: dayAt(-2, 11, 30),
    },
  });
  // Past class — ELITE user was late
  await prisma.classEnrollment.create({
    data: {
      userId: userElite.id,
      classSessionId: classPast.id,
      status: EnrollmentStatus.CONFIRMED,
      attendanceStatus: 'LATE',
      attendanceMarkedAt: dayAt(-2, 11, 30),
    },
  });
  // Yesterday — PRO absent (strike candidate)
  await prisma.classEnrollment.create({
    data: {
      userId: userPro.id,
      classSessionId: classYesterday.id,
      status: EnrollmentStatus.CONFIRMED,
      attendanceStatus: 'ABSENT',
      attendanceMarkedAt: dayAt(-1, 15, 30),
    },
  });
  // Yesterday — LEVEL_UP user cancelled
  await prisma.classEnrollment.create({
    data: {
      userId: userLevelUp.id,
      classSessionId: classYesterday.id,
      status: EnrollmentStatus.CANCELLED,
      cancelledAt: dayAt(-1, 12, 0),
    },
  });

  // Today — PRO enrolled
  await prisma.classEnrollment.create({
    data: { userId: userPro.id, classSessionId: classToday.id, status: EnrollmentStatus.CONFIRMED },
  });
  // Today — ELITE enrolled
  await prisma.classEnrollment.create({
    data: {
      userId: userElite.id,
      classSessionId: classToday.id,
      status: EnrollmentStatus.CONFIRMED,
    },
  });

  // Tomorrow grammar — fill to near capacity
  await prisma.classEnrollment.create({
    data: {
      userId: userPro.id,
      classSessionId: classTomorrow1.id,
      status: EnrollmentStatus.CONFIRMED,
    },
  });
  await prisma.classEnrollment.create({
    data: {
      userId: userElite.id,
      classSessionId: classTomorrow1.id,
      status: EnrollmentStatus.CONFIRMED,
    },
  });
  await prisma.classEnrollment.create({
    data: {
      userId: userLevelUp.id,
      classSessionId: classTomorrow1.id,
      status: EnrollmentStatus.CONFIRMED,
    },
  });

  // Tomorrow workshop — a few enrolled
  await prisma.classEnrollment.create({
    data: {
      userId: userElite.id,
      classSessionId: classTomorrow2.id,
      status: EnrollmentStatus.CONFIRMED,
    },
  });

  // Next week IELTS — PRO enrolled
  await prisma.classEnrollment.create({
    data: {
      userId: userPro.id,
      classSessionId: classNextWeek.id,
      status: EnrollmentStatus.CONFIRMED,
    },
  });

  // Santiago — enrolled in today's masterclass
  await prisma.classEnrollment.create({
    data: {
      userId: santiago.id,
      classSessionId: classSantiago.id,
      status: EnrollmentStatus.CONFIRMED,
    },
  });
  // Santiago — also enrolled in today's Conversational class
  await prisma.classEnrollment.create({
    data: {
      userId: santiago.id,
      classSessionId: classToday.id,
      status: EnrollmentStatus.CONFIRMED,
    },
  });

  // Eugenia (PRO) — enrolled in today's multi-materials class (for testing materials modal)
  await prisma.classEnrollment.create({
    data: {
      userId: userPro.id,
      classSessionId: classEugeniaMultiMaterials.id,
      status: EnrollmentStatus.CONFIRMED,
    },
  });

  // Santiago — ELITE subscription (paid, active, infinite)
  await prisma.subscription.create({
    data: {
      userId: santiago.id,
      plan: UserPlan.ELITE,
      status: SubscriptionStatus.ACTIVE,
      startDate: pastDate(30),
      endDate: new Date('2099-12-31'),
      hasPaid: true,
      paidAt: pastDate(30),
      paymentNote: 'SyroxTech — lifetime access',
      assignedBy: luby.id,
    },
  });

  // ============================================================
  // STRIKES (for testing strikes section)
  // ============================================================
  console.log('⚡ Creating strikes...');

  // PRO user — 1 auto strike from absence
  await prisma.strike.create({
    data: {
      userId: userPro.id,
      classSessionId: classYesterday.id,
      reason: 'NO_SHOW',
      isManual: false,
      createdAt: pastDate(1),
    },
  });

  // ELITE user — 1 manual strike
  await prisma.strike.create({
    data: {
      userId: userElite.id,
      classSessionId: null,
      reason: 'Disruptive behavior during class',
      isManual: true,
      createdAt: pastDate(5),
    },
  });

  // Suspended user — 3 strikes (punished)
  await prisma.strike.create({
    data: { userId: suspendedUser.id, reason: 'NO_SHOW', isManual: false, createdAt: pastDate(20) },
  });
  await prisma.strike.create({
    data: {
      userId: suspendedUser.id,
      reason: 'LATE_CANCELLATION',
      isManual: false,
      createdAt: pastDate(15),
    },
  });
  await prisma.strike.create({
    data: {
      userId: suspendedUser.id,
      reason: 'Repeated no-shows',
      isManual: true,
      createdAt: pastDate(10),
    },
  });

  // ============================================================
  // DAILY CHALLENGES — intentionally not seeded. Admins create them
  // from the dashboard. The deleteMany() call at the top of this file
  // still runs so re-seeding starts from a clean slate.
  // ============================================================

  // ============================================================
  // JOB OFFERS (8 — mix with/without social, website, email)
  // ============================================================
  console.log('💼 Creating job offers...');

  const job1 = await prisma.jobOffer.create({
    data: {
      title: '$15k/Mo Closers for Info Coaching Offer',
      company: 'Adam Stifel Coaching',
      location: 'Remote - US Hours',
      salaryRange: '$5,000 - $15,000/month OTE',
      oteMin: 5000,
      oteMax: 15000,
      revenue: 200000,
      type: 'Closer',
      description: 'Join our high-ticket sales team selling SaaS to B2C Info Coaching products.',
      requirements: [
        'Fluent English (C1+)',
        '2+ years closing',
        'High-ticket sales experience',
        'US hours',
      ],
      isActive: true,
      social: 'https://instagram.com/adamstifel',
      website: 'https://adamstifelcoaching.com',
      email: 'recruit@adamstifel.com',
    },
  });

  const job2 = await prisma.jobOffer.create({
    data: {
      title: '$8k/Mo Setters for AI SaaS Offer',
      company: 'Frontegg',
      location: 'Remote - US or CA Based',
      salaryRange: '$6,500 - $8,000/month OTE',
      oteMin: 6500,
      oteMax: 8000,
      revenue: 50000,
      type: 'Setter',
      description: 'B2B AI SaaS company looking for experienced setters.',
      requirements: [
        'Fluent English (C1+)',
        '3+ years cold calling',
        'B2B SaaS background',
        'US/CA timezone',
      ],
      isActive: true,
      social: 'https://linkedin.com/company/frontegg',
      website: 'https://frontegg.com',
      email: 'jobs@frontegg.com',
    },
  });

  const job3 = await prisma.jobOffer.create({
    data: {
      title: '$6k/Mo CSMs for Yoga Biz-Opp',
      company: 'Impact Academy',
      location: 'Remote',
      salaryRange: '$4,000 - $6,000/month ($2k base + commission)',
      oteMin: 4000,
      oteMax: 6000,
      revenue: 300000,
      type: 'Setter',
      description: 'Customer Success Manager for yoga online business. $5.9k ticket program.',
      requirements: [
        'Fluent English (B2+)',
        'Customer success experience',
        'Wellness industry interest',
      ],
      isActive: true,
      social: 'https://instagram.com/impactacademy',
      website: null,
      email: 'careers@impactacademy.com',
    },
  });

  const job4 = await prisma.jobOffer.create({
    data: {
      title: '$10k/Mo DM Setters for Real Estate Coaching',
      company: 'Wholesaling Empire',
      location: 'Remote - Any Timezone',
      salaryRange: '$7,000 - $10,000/month OTE',
      oteMin: 7000,
      oteMax: 10000,
      revenue: 150000,
      type: 'Setter',
      description: 'DM setting for high-ticket real estate wholesaling coaching program.',
      requirements: [
        'Fluent English (B2+)',
        'DM setting experience preferred',
        'Social media savvy',
        'Self-motivated',
      ],
      isActive: true,
      social: 'https://instagram.com/wholesalingempire',
      website: 'https://wholesalingempire.com',
      email: null,
    },
  });

  const job5 = await prisma.jobOffer.create({
    data: {
      title: '$12k/Mo Closers + Manager for Finance Coaching',
      company: 'Wealth Builders Co.',
      location: 'Remote - US Hours',
      salaryRange: '$8,000 - $12,000/month OTE',
      oteMin: 8000,
      oteMax: 12000,
      revenue: 500000,
      type: 'Closer',
      description: 'High-ticket finance coaching offer. Looking for closers and a sales manager.',
      requirements: [
        'Fluent English (C1+)',
        'Finance/investing knowledge preferred',
        '1+ year closing',
        'Leadership skills for manager',
      ],
      isActive: true,
      social: null,
      website: 'https://wealthbuilders.co',
      email: 'hiring@wealthbuilders.co',
    },
  });

  const job6 = await prisma.jobOffer.create({
    data: {
      title: 'English Teacher (Online)',
      company: 'Global Education',
      location: 'Remote - Worldwide',
      salaryRange: '$25 - $40/hour',
      oteMin: 2000,
      oteMax: 4000,
      revenue: 0,
      type: 'Setter',
      description: 'Teach English to students worldwide from home. Flexible schedule.',
      requirements: ['Native or near-native English', 'TEFL/TESOL preferred', 'Reliable internet'],
      isActive: true,
      social: null,
      website: null,
      email: 'apply@globaleducation.com',
    },
  });

  const job7 = await prisma.jobOffer.create({
    data: {
      title: '$20k/Mo Sales Director for E-Commerce Brand',
      company: 'Luxe Digital Agency',
      location: 'Remote - US/EU',
      salaryRange: '$15,000 - $20,000/month OTE',
      oteMin: 15000,
      oteMax: 20000,
      revenue: 800000,
      type: 'Closer',
      description: 'Lead the sales team for a 7-figure e-commerce brand. Director-level role.',
      requirements: [
        'Fluent English (C2)',
        '5+ years in sales management',
        'E-commerce experience',
        'Proven team leadership',
      ],
      isActive: true,
      social: 'https://instagram.com/luxedigital',
      website: 'https://luxedigitalagency.com',
      email: 'director@luxedigital.com',
    },
  });

  // Inactive job (for testing filtering)
  const job8 = await prisma.jobOffer.create({
    data: {
      title: 'Marketing Coordinator (CLOSED)',
      company: 'Digital Agency Plus',
      location: 'Hybrid - Buenos Aires',
      salaryRange: '$45,000 - $60,000/year',
      oteMin: 3750,
      oteMax: 5000,
      revenue: 25000,
      type: 'Setter',
      description: 'This position has been filled.',
      requirements: ['Fluent English and Spanish', '2+ years marketing'],
      isActive: false,
      social: null,
      website: null,
      email: null,
    },
  });

  // ============================================================
  // JOB APPLICATIONS (various statuses)
  // ============================================================
  console.log('📋 Creating job applications...');

  await prisma.jobApplication.createMany({
    data: [
      {
        userId: userPro.id,
        jobOfferId: job1.id,
        status: ApplicationStatus.INTERVIEW,
        notes: 'Interview scheduled for Thursday',
        appliedAt: pastDate(7),
      },
      {
        userId: userPro.id,
        jobOfferId: job3.id,
        status: ApplicationStatus.APPLIED,
        notes: null,
        appliedAt: pastDate(2),
      },
      {
        userId: userPro.id,
        jobOfferId: job6.id,
        status: ApplicationStatus.PENDING,
        notes: 'Waiting for response',
        appliedAt: pastDate(14),
      },
      {
        userId: userElite.id,
        jobOfferId: job2.id,
        status: ApplicationStatus.APPLIED,
        notes: null,
        appliedAt: pastDate(3),
      },
      {
        userId: userElite.id,
        jobOfferId: job7.id,
        status: ApplicationStatus.REJECTED,
        notes: 'Needed more experience',
        appliedAt: pastDate(20),
      },
      {
        userId: userHiringHub.id,
        jobOfferId: job4.id,
        status: ApplicationStatus.APPLIED,
        notes: null,
        appliedAt: pastDate(1),
      },
      {
        userId: userLevelUp.id,
        jobOfferId: job5.id,
        status: ApplicationStatus.INTERVIEW,
        notes: 'Second round next Monday',
        appliedAt: pastDate(10),
      },
    ],
  });

  // ============================================================
  // NOTIFICATIONS (variety for all user types)
  // ============================================================
  console.log('🔔 Creating notifications...');

  await prisma.notification.createMany({
    data: [
      // --- User notifications ---
      {
        userId: userPro.id,
        type: NotificationType.CLASS_CONFIRMED,
        title: 'Class Enrollment Confirmed',
        message: 'You are enrolled in "Conversational Advanced II" for today at 6:00 PM.',
        isRead: false,
        data: { classSessionId: classToday.id },
      },
      {
        userId: userPro.id,
        type: NotificationType.MATERIAL_AVAILABLE,
        title: 'New Materials Available',
        message: 'Study materials for "Business English Masterclass" are now available.',
        isRead: false,
        data: { classSessionId: classTomorrow2.id },
      },
      {
        userId: userPro.id,
        type: NotificationType.STRIKE_APPLIED,
        title: 'Strike Received',
        message: 'You received a strike for not attending "Debate Club: A.I. Ethics".',
        isRead: true,
        data: { classSessionId: classYesterday.id },
      },
      {
        userId: userSkillBuilder.id,
        type: NotificationType.GENERAL,
        title: 'Welcome to JFalcon!',
        message: 'Your Skill Builder plan is now active. Start learning today!',
        isRead: false,
      },
      {
        userId: userHiringHub.id,
        type: NotificationType.GENERAL,
        title: 'New Job Postings',
        message: '3 new job offers match your profile. Check the Job Board!',
        isRead: false,
      },

      // --- Superadmin notifications ---
      {
        userId: luby.id,
        type: NotificationType.NEW_REGISTRATION,
        title: 'New User Registration',
        message: 'Pending Applicant (pending@test.com) has registered and is awaiting approval.',
        isRead: false,
        data: { userId: pendingUser.id },
      },
      {
        userId: john.id,
        type: NotificationType.NEW_REGISTRATION,
        title: 'New User Registration',
        message: 'Pending Applicant (pending@test.com) has registered and is awaiting approval.',
        isRead: false,
        data: { userId: pendingUser.id },
      },
      {
        userId: john.id,
        type: NotificationType.UPGRADE_REQUEST,
        title: 'Upgrade Request',
        message: 'Ana Lopez (ana@test.com) has requested a plan upgrade from SKILL_BUILDER.',
        isRead: false,
        data: { userId: userSkillBuilder.id },
      },
    ],
  });

  // ============================================================
  // AUDIT LOGS (recent activity)
  // ============================================================
  console.log('📜 Creating audit logs...');

  const auditBase = {
    adminId: luby.id,
    adminEmail: luby.email,
    adminName: 'Luby Demidova',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 Chrome/120.0.0.0',
  };

  await prisma.auditLog.createMany({
    data: [
      {
        ...auditBase,
        action: AuditAction.USER_APPROVED,
        targetType: 'User',
        targetId: userPro.id,
        targetName: 'Eugenia Martinez',
        details: { previousStatus: 'PENDING', newStatus: 'ACTIVE' },
        createdAt: pastDate(15),
      },
      {
        ...auditBase,
        action: AuditAction.SUBSCRIPTION_CREATED,
        targetType: 'Subscription',
        targetId: 'sub_pro',
        targetName: 'PRO Plan - Eugenia',
        details: { plan: 'PRO', hasPaid: true },
        createdAt: pastDate(15),
      },
      {
        ...auditBase,
        action: AuditAction.MODULE_CREATED,
        targetType: 'Module',
        targetId: String(mod1.id),
        targetName: mod1.title,
        details: { order: 1 },
        createdAt: pastDate(12),
      },
      {
        ...auditBase,
        action: AuditAction.MODULE_CREATED,
        targetType: 'Module',
        targetId: String(mod2.id),
        targetName: mod2.title,
        details: { order: 2 },
        createdAt: pastDate(12),
      },
      {
        ...auditBase,
        action: AuditAction.CLASS_CREATED,
        targetType: 'ClassSession',
        targetId: String(classToday.id),
        targetName: classToday.title,
        details: { type: 'REGULAR', capacityMax: 5 },
        createdAt: pastDate(5),
      },
      {
        ...auditBase,
        action: AuditAction.JOB_CREATED,
        targetType: 'JobOffer',
        targetId: String(job1.id),
        targetName: job1.title,
        details: { company: job1.company, social: job1.social },
        createdAt: pastDate(3),
      },
      {
        ...auditBase,
        action: AuditAction.JOB_CREATED,
        targetType: 'JobOffer',
        targetId: String(job7.id),
        targetName: job7.title,
        details: { company: job7.company, website: job7.website },
        createdAt: pastDate(2),
      },
      {
        ...auditBase,
        action: AuditAction.USER_STRIKE_ISSUED,
        targetType: 'User',
        targetId: userPro.id,
        targetName: 'Eugenia Martinez',
        details: { reason: 'NO_SHOW', classTitle: 'Debate Club' },
        createdAt: pastDate(1),
      },
      {
        ...auditBase,
        action: AuditAction.SUBMISSION_REVIEWED,
        targetType: 'Submission',
        targetId: 'sub_review_1',
        targetName: 'Eugenia - Hometown Audio',
        details: { status: 'APPROVED' },
        createdAt: pastDate(1),
      },
      {
        ...auditBase,
        action: AuditAction.USER_SUSPENDED,
        targetType: 'User',
        targetId: suspendedUser.id,
        targetName: 'Suspended Person',
        details: { reason: 'Repeated no-shows' },
        createdAt: pastDate(10),
      },
      {
        ...auditBase,
        action: AuditAction.SYSTEM_CONFIG_UPDATED,
        targetType: 'System',
        targetId: 'system_settings',
        targetName: 'Platform Settings',
        details: { setting: 'strikesEnabled', newValue: true },
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      },
      {
        ...auditBase,
        action: AuditAction.LOGIN_SUCCESS,
        targetType: 'Admin',
        targetId: luby.id,
        targetName: luby.email,
        details: { loginMethod: 'password' },
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      // John Falcon audit entries
      {
        adminId: john.id,
        adminEmail: john.email,
        adminName: 'John Falcon',
        ipAddress: '10.0.0.1',
        userAgent: 'Mozilla/5.0 Chrome/120.0.0.0',
        action: AuditAction.USER_APPROVED,
        targetType: 'User',
        targetId: userElite.id,
        targetName: 'Diego Marzioni',
        details: { previousStatus: 'PENDING', newStatus: 'ACTIVE' },
        createdAt: pastDate(10),
      },
      {
        adminId: john.id,
        adminEmail: john.email,
        adminName: 'John Falcon',
        ipAddress: '10.0.0.1',
        userAgent: 'Mozilla/5.0 Chrome/120.0.0.0',
        action: AuditAction.SUBSCRIPTION_CREATED,
        targetType: 'Subscription',
        targetId: 'sub_sb',
        targetName: 'SKILL_BUILDER - Ana Lopez',
        details: { plan: 'SKILL_BUILDER', hasPaid: false },
        createdAt: pastDate(3),
      },
    ],
  });

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log('\n✅ Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`  Users:              ${await prisma.user.count()}`);
  console.log(`  Subscriptions:      ${await prisma.subscription.count()}`);
  console.log(`  Modules:            ${await prisma.module.count()}`);
  console.log(`  Lessons:            ${await prisma.lesson.count()}`);
  console.log(`  Lesson Resources:   ${await prisma.lessonResource.count()}`);
  console.log(`  Class Sessions:     ${await prisma.classSession.count()}`);
  console.log(`  Enrollments:        ${await prisma.classEnrollment.count()}`);
  console.log(`  Strikes:            ${await prisma.strike.count()}`);
  console.log(`  Daily Challenges:   ${await prisma.dailyChallenge.count()}`);
  console.log(`  Submissions:        ${await prisma.userDailyChallengeProgress.count()}`);
  console.log(`  Job Offers:         ${await prisma.jobOffer.count()}`);
  console.log(`  Job Applications:   ${await prisma.jobApplication.count()}`);
  console.log(`  Notifications:      ${await prisma.notification.count()}`);
  console.log(`  Audit Logs:         ${await prisma.auditLog.count()}`);

  console.log('\n🔐 Test Credentials (all use password: password123):');
  console.log('  SUPERADMIN:     luby.demidova@gmail.com');
  console.log('  SUPERADMIN:     johnfalcon.va@gmail.com');
  console.log('  ADMIN:          sarah@jfalcon.com');
  console.log('  ADMIN:          carlos@jfalcon.com');
  console.log('  USER (PRO):     eugenia@test.com');
  console.log('  USER (ELITE):   diego@test.com');
  console.log('  USER (ELITE):   santiago@syroxtech.com');
  console.log('  USER (LEVEL_UP):maria@test.com');
  console.log('  USER (HIRING):  lucas@test.com');
  console.log('  USER (SKILL_B): ana@test.com');
  console.log('  JOB_UPLOADER:   recruiter@talent.com');
  console.log('  PENDING:        pending@test.com');
  console.log('  SUSPENDED:      suspended@test.com');

  console.log('\n📚 Module Visibility for SKILL_BUILDER:');
  console.log('  ✅ Foundations & Goals (visible)');
  console.log('  ✅ Conversation Basics (visible)');
  console.log('  ❌ Business English (hidden)');
  console.log('  ✅ Advanced Idioms & Culture (visible)');
  console.log('  ❌ Interview Mastery (hidden)');
  console.log('  ❌ Sales English - DRAFT (hidden)');

  console.log('\n💳 Subscription Payment Status:');
  console.log('  PRO (Eugenia):        PAID');
  console.log('  ELITE (Diego):        PAID');
  console.log('  LEVEL_UP (Maria):     FREE TRIAL');
  console.log('  HIRING_HUB (Lucas):   PAID');
  console.log('  SKILL_BUILDER (Ana):  FREE');
  console.log('  PRO (Suspended):      EXPIRED');

  console.log('\n📝 Pending Corrections (4):');
  console.log('  Diego - Yesterday Audio (Hometown)');
  console.log('  Diego - Today Audio (Morning Routine)');
  console.log('  Maria - Today Audio (Morning Routine)');
  console.log('  Lucas - Writing (Professional Email)');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async e => {
    console.error('❌ Error during seeding:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
