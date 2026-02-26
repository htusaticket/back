// prisma/seed-sprint5.ts
// Seed específico para Sprint 5 - Admin Features
// Ejecutar con: npm run db:seed:sprint5

import * as dotenv from 'dotenv';
dotenv.config();

import {
  PrismaClient,
  UserRole,
  UserStatus,
  UserPlan,
  ClassType,
  AttendanceStatus,
  ChallengeType,
  SubmissionStatus,
} from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Iniciando seed de Sprint 5...');

  // ==================== USUARIOS ====================
  console.log('👥 Creando usuarios de prueba...');

  const hashedPassword = await bcrypt.hash('Test123!', 12);

  // SuperAdmin
  const superadmin = await prisma.user.upsert({
    where: { email: 'superadmin@jfalcon.com' },
    update: {},
    create: {
      email: 'superadmin@jfalcon.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      phone: '+1234567890',
      role: UserRole.SUPERADMIN,
      status: UserStatus.ACTIVE,
      plan: null,
    },
  });
  console.log(`   ✓ SuperAdmin: ${superadmin.email}`);

  // Admin/Teacher
  const admin = await prisma.user.upsert({
    where: { email: 'teacher@jfalcon.com' },
    update: {},
    create: {
      email: 'teacher@jfalcon.com',
      password: hashedPassword,
      firstName: 'Carlos',
      lastName: 'Profesor',
      phone: '+1234567891',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      plan: null,
    },
  });
  console.log(`   ✓ Admin/Teacher: ${admin.email}`);

  // Job Uploader
  const jobUploader = await prisma.user.upsert({
    where: { email: 'recruiter@jfalcon.com' },
    update: {},
    create: {
      email: 'recruiter@jfalcon.com',
      password: hashedPassword,
      firstName: 'Ana',
      lastName: 'Recruiter',
      phone: '+1234567892',
      role: UserRole.JOB_UPLOADER,
      status: UserStatus.ACTIVE,
      plan: null,
    },
  });
  console.log(`   ✓ Job Uploader: ${jobUploader.email}`);

  // Alumnos con diferentes planes
  const studentsData = [
    {
      email: 'alumno.pro@test.com',
      firstName: 'Juan',
      lastName: 'Pro User',
      plan: UserPlan.PRO,
      status: UserStatus.ACTIVE,
      city: 'Buenos Aires',
      country: 'Argentina',
    },
    {
      email: 'alumno.elite@test.com',
      firstName: 'María',
      lastName: 'Elite User',
      plan: UserPlan.ELITE,
      status: UserStatus.ACTIVE,
      city: 'Lima',
      country: 'Peru',
    },
    {
      email: 'alumno.levelup@test.com',
      firstName: 'Pedro',
      lastName: 'LevelUp User',
      plan: UserPlan.LEVEL_UP,
      status: UserStatus.ACTIVE,
      city: 'Santiago',
      country: 'Chile',
    },
    {
      email: 'alumno.hiringhub@test.com',
      firstName: 'Laura',
      lastName: 'HiringHub User',
      plan: UserPlan.HIRING_HUB,
      status: UserStatus.ACTIVE,
      city: 'Bogotá',
      country: 'Colombia',
    },
    {
      email: 'alumno.skillbuilder@test.com',
      firstName: 'Diego',
      lastName: 'SkillBuilder User',
      plan: UserPlan.SKILL_BUILDER,
      status: UserStatus.ACTIVE,
      city: 'Ciudad de México',
      country: 'Mexico',
    },
    {
      email: 'alumno.pending@test.com',
      firstName: 'Sofia',
      lastName: 'Pending User',
      plan: UserPlan.PRO,
      status: UserStatus.PENDING,
      city: 'Montevideo',
      country: 'Uruguay',
    },
    {
      email: 'alumno.suspended@test.com',
      firstName: 'Carlos',
      lastName: 'Suspended User',
      plan: UserPlan.ELITE,
      status: UserStatus.SUSPENDED,
      city: 'Quito',
      country: 'Ecuador',
    },
  ];

  interface CreatedUser {
    id: string;
    status: UserStatus;
    firstName: string;
  }

  const createdStudents: CreatedUser[] = [];

  for (const student of studentsData) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - Math.floor(Math.random() * 6));

    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 12);

    const created = await prisma.user.upsert({
      where: { email: student.email },
      update: {},
      create: {
        email: student.email,
        password: hashedPassword,
        firstName: student.firstName,
        lastName: student.lastName,
        phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        role: UserRole.USER,
        status: student.status,
        plan: student.plan,
        city: student.city,
        country: student.country,
        startDate,
        endDate,
        adminNotes:
          student.status === UserStatus.SUSPENDED ? 'Suspendido por acumular 3 strikes' : null,
      },
    });
    createdStudents.push(created);
    console.log(`   ✓ Alumno: ${created.email} (${student.plan})`);
  }

  // ==================== CLASES ====================
  console.log('\n📅 Creando clases de prueba...');

  const now = new Date();
  const classesData = [
    {
      title: 'Advanced English Conversation',
      type: ClassType.REGULAR,
      daysOffset: -7,
      duration: 60,
      description: 'Práctica de conversación avanzada',
    },
    {
      title: 'Business English Workshop',
      type: ClassType.WORKSHOP,
      daysOffset: -3,
      duration: 90,
      description: 'Taller de inglés para negocios',
    },
    {
      title: 'Grammar Intensive',
      type: ClassType.REGULAR,
      daysOffset: 0,
      duration: 60,
      description: 'Clase intensiva de gramática',
    },
    {
      title: 'Speaking Practice',
      type: ClassType.REGULAR,
      daysOffset: 3,
      duration: 60,
      description: 'Práctica de speaking',
    },
    {
      title: 'Mock Interview Session',
      type: ClassType.WORKSHOP,
      daysOffset: 7,
      duration: 120,
      description: 'Simulación de entrevistas en inglés',
    },
  ];

  interface CreatedClass {
    id: string;
    title: string;
  }

  const createdClasses: CreatedClass[] = [];

  for (const cls of classesData) {
    const startTime = new Date(now);
    startTime.setDate(startTime.getDate() + cls.daysOffset);
    startTime.setHours(14, 0, 0, 0);

    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + cls.duration);

    const created = await prisma.classSession.create({
      data: {
        title: cls.title,
        description: cls.description,
        type: cls.type,
        startTime,
        endTime,
        capacityMax: 20,
        meetLink: 'https://meet.google.com/abc-defg-hij',
      },
    });
    createdClasses.push(created);
    console.log(
      `   ✓ Clase: ${created.title} (${cls.daysOffset > 0 ? `+${cls.daysOffset}` : cls.daysOffset} días)`,
    );
  }

  // ==================== INSCRIPCIONES Y ASISTENCIA ====================
  console.log('\n📝 Creando inscripciones y asistencia...');

  const activeStudents = createdStudents.filter(s => s.status === UserStatus.ACTIVE);
  const pastClasses = createdClasses.filter((_, i) => classesData[i]!.daysOffset < 0);
  const futureClasses = createdClasses.filter((_, i) => classesData[i]!.daysOffset >= 0);

  let enrollmentCount = 0;

  // Inscribir en clases pasadas con asistencia
  for (const cls of pastClasses) {
    for (const student of activeStudents) {
      if (Math.random() < 0.8) {
        const attendanceOptions = [
          AttendanceStatus.PRESENT,
          AttendanceStatus.PRESENT,
          AttendanceStatus.PRESENT,
          AttendanceStatus.LATE,
          AttendanceStatus.ABSENT,
        ];
        const attendance = attendanceOptions[Math.floor(Math.random() * attendanceOptions.length)];

        try {
          await prisma.classEnrollment.create({
            data: {
              userId: student.id,
              classSessionId: cls.id,
              status: 'CONFIRMED',
              attendanceStatus: attendance,
              attendanceMarkedAt: new Date(),
            },
          });
          enrollmentCount++;
        } catch (e) {
          // Ignorar duplicados
        }
      }
    }
  }

  // Inscribir en clases futuras
  for (const cls of futureClasses) {
    for (const student of activeStudents) {
      if (Math.random() < 0.6) {
        try {
          await prisma.classEnrollment.create({
            data: {
              userId: student.id,
              classSessionId: cls.id,
              status: 'CONFIRMED',
              attendanceStatus: AttendanceStatus.NOT_MARKED,
            },
          });
          enrollmentCount++;
        } catch (e) {
          // Ignorar duplicados
        }
      }
    }
  }

  console.log(`   ✓ ${enrollmentCount} inscripciones creadas`);

  // ==================== STRIKES ====================
  console.log('\n⚠️ Creando strikes de prueba...');

  const suspendedUser = createdStudents.find(s => s.status === UserStatus.SUSPENDED);
  if (suspendedUser && pastClasses.length > 0) {
    for (let i = 0; i < 3; i++) {
      await prisma.strike.create({
        data: {
          userId: suspendedUser.id,
          classSessionId: pastClasses[0]?.id,
          reason: 'Ausencia sin justificación',
          isManual: false,
        },
      });
    }
    console.log(`   ✓ 3 strikes para usuario suspendido`);
  }

  if (activeStudents.length > 0) {
    await prisma.strike.create({
      data: {
        userId: activeStudents[0].id,
        reason: 'Incumplimiento de normas de la clase',
        isManual: true,
        classSessionId: null,
      },
    });
    console.log(`   ✓ 1 strike manual para ${activeStudents[0].firstName}`);
  }

  // ==================== DAILY CHALLENGES ====================
  console.log('\n🎯 Creando challenges de prueba...');

  const challengesData = [
    {
      title: 'Describe your morning routine',
      type: ChallengeType.AUDIO,
      instructions:
        'Record yourself describing your typical morning routine in English. Try to speak for at least 2 minutes.',
      daysOffset: -5,
    },
    {
      title: 'Past Tense Quiz',
      type: ChallengeType.MULTIPLE_CHOICE,
      instructions: 'Test your knowledge of past tense verbs by answering these questions.',
      daysOffset: -3,
      questions: [
        {
          question: 'What is the past tense of "go"?',
          options: ['goed', 'went', 'gone', 'going'],
          correct: 1,
        },
        {
          question: 'What is the past tense of "eat"?',
          options: ['eated', 'eaten', 'ate', 'eating'],
          correct: 2,
        },
      ],
    },
    {
      title: 'Talk about your dream job',
      type: ChallengeType.AUDIO,
      instructions: 'Record a 2-minute audio describing your ideal career and why you want it.',
      daysOffset: -1,
    },
    {
      title: 'Pronunciation Challenge',
      type: ChallengeType.AUDIO,
      instructions:
        'Practice pronouncing these difficult words: thorough, entrepreneurship, February.',
      daysOffset: 0,
    },
  ];

  interface CreatedChallenge {
    id: string;
    title: string;
    type: ChallengeType;
  }

  const createdChallenges: CreatedChallenge[] = [];

  for (const challenge of challengesData) {
    const date = new Date(now);
    date.setDate(date.getDate() + challenge.daysOffset);
    date.setHours(0, 0, 0, 0);

    const created = await prisma.dailyChallenge.create({
      data: {
        title: challenge.title,
        instructions: challenge.instructions,
        type: challenge.type,
        date,
        isActive: true,
        questions: (challenge as any).questions || null,
        points: 10,
      },
    });
    createdChallenges.push(created);
    console.log(`   ✓ Challenge: ${created.title} (${challenge.type})`);
  }

  // ==================== SUBMISSIONS ====================
  console.log('\n📤 Creando submissions de prueba...');

  const audioChallenges = createdChallenges.filter(c => c.type === ChallengeType.AUDIO);
  let submissionCount = 0;

  for (const challenge of audioChallenges) {
    for (const student of activeStudents.slice(0, 4)) {
      const statusOptions = [
        SubmissionStatus.PENDING,
        SubmissionStatus.PENDING,
        SubmissionStatus.PENDING,
        SubmissionStatus.APPROVED,
        SubmissionStatus.NEEDS_IMPROVEMENT,
      ];
      const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];

      try {
        await prisma.userDailyChallengeProgress.create({
          data: {
            userId: student.id,
            challengeId: challenge.id,
            completed: true,
            completedAt: new Date(),
            fileUrl: 'https://storage.example.com/audio/sample.mp3',
            status,
            feedback:
              status !== SubmissionStatus.PENDING
                ? status === SubmissionStatus.APPROVED
                  ? 'Excellent work! Great pronunciation.'
                  : 'Please work on your pronunciation and try again.'
                : null,
            score:
              status === SubmissionStatus.APPROVED ? 85 + Math.floor(Math.random() * 15) : null,
          },
        });
        submissionCount++;
      } catch (e) {
        // Ignorar duplicados
      }
    }
  }

  console.log(`   ✓ ${submissionCount} submissions creadas`);

  // ==================== RESUMEN ====================
  console.log('\n' + '='.repeat(50));
  console.log('🎉 Seed de Sprint 5 completado exitosamente!');
  console.log('='.repeat(50));
  console.log('\n📋 Credenciales de prueba:');
  console.log('   ┌─────────────────────────────────────────────┐');
  console.log('   │ SuperAdmin: superadmin@jfalcon.com          │');
  console.log('   │ Teacher:    teacher@jfalcon.com             │');
  console.log('   │ Alumno Pro: alumno.pro@test.com             │');
  console.log('   │ Alumno Elite: alumno.elite@test.com         │');
  console.log('   │ Password para todos: Test123!               │');
  console.log('   └─────────────────────────────────────────────┘');
}

main()
  .catch(e => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
