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
  ResourceType,
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
    email: string;
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
    createdStudents.push({ ...created, email: student.email });
    console.log(`   ✓ Alumno: ${student.email} (${student.plan})`);
  }

  // Obtener referencia al usuario alumno.elite@test.com
  const eliteUser = createdStudents.find(s => s.email === 'alumno.elite@test.com');

  // Usuario Demo Principal - diego@test.com
  const demoStartDate = new Date();
  demoStartDate.setMonth(demoStartDate.getMonth() - 2);
  const demoEndDate = new Date(demoStartDate);
  demoEndDate.setMonth(demoEndDate.getMonth() + 12);

  const demoUser = await prisma.user.upsert({
    where: { email: 'diego@test.com' },
    update: {},
    create: {
      email: 'diego@test.com',
      password: hashedPassword,
      firstName: 'Diego',
      lastName: 'Demo User',
      phone: '+5491155556666',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      plan: UserPlan.PRO,
      city: 'Buenos Aires',
      country: 'Argentina',
      startDate: demoStartDate,
      endDate: demoEndDate,
    },
  });
  console.log(`   ✓ Usuario Demo: ${demoUser.email} (PRO)`);

  // ==================== MÓDULOS Y LECCIONES ====================
  console.log('\n📚 Creando módulos y lecciones...');

  // Module 1: Foundations & Goals
  const module1 = await prisma.module.upsert({
    where: { id: 1 },
    update: {},
    create: {
      title: 'Foundations & Goals',
      description:
        'Start your journey by setting clear objectives and understanding the core principles of effective language learning.',
      image:
        'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1000&auto=format&fit=crop',
      order: 1,
    },
  });

  const lesson1_1 = await prisma.lesson.upsert({
    where: { id: 1 },
    update: {},
    create: {
      title: 'Introduction to the Course',
      description: 'Welcome to JFalcon Academy! Learn about the course structure and objectives.',
      duration: '10 min',
      contentUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      order: 1,
      moduleId: module1.id,
    },
  });

  const lesson1_2 = await prisma.lesson.upsert({
    where: { id: 2 },
    update: {},
    create: {
      title: 'Setting SMART Goals',
      description:
        'Learn how to set Specific, Measurable, Achievable, Relevant, and Time-bound goals.',
      duration: '15 min',
      contentUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      order: 2,
      moduleId: module1.id,
    },
  });

  const lesson1_3 = await prisma.lesson.upsert({
    where: { id: 3 },
    update: {},
    create: {
      title: 'Essential Vocabulary Building',
      description: 'Discover effective techniques for building and retaining new vocabulary.',
      duration: '20 min',
      contentUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      order: 3,
      moduleId: module1.id,
    },
  });

  // Module 2: Conversation Basics
  const module2 = await prisma.module.upsert({
    where: { id: 2 },
    update: {},
    create: {
      title: 'Conversation Basics',
      description:
        'Master the fundamentals of everyday English conversation with practical phrases and techniques.',
      image:
        'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=1000&auto=format&fit=crop',
      order: 2,
    },
  });

  const lesson2_1 = await prisma.lesson.upsert({
    where: { id: 4 },
    update: {},
    create: {
      title: 'Greetings & Introductions',
      description: 'Learn formal and informal ways to greet people and introduce yourself.',
      duration: '12 min',
      contentUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      order: 1,
      moduleId: module2.id,
    },
  });

  const lesson2_2 = await prisma.lesson.upsert({
    where: { id: 5 },
    update: {},
    create: {
      title: 'Small Talk Mastery',
      description: 'Master the art of small talk for networking and social situations.',
      duration: '18 min',
      contentUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      order: 2,
      moduleId: module2.id,
    },
  });

  // Module 3: Business Communication
  const module3 = await prisma.module.upsert({
    where: { id: 3 },
    update: {},
    create: {
      title: 'Business Communication',
      description:
        'Develop professional English skills for the workplace, emails, and presentations.',
      image:
        'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1000&auto=format&fit=crop',
      order: 3,
    },
  });

  const lesson3_1 = await prisma.lesson.upsert({
    where: { id: 6 },
    update: {},
    create: {
      title: 'Professional Email Writing',
      description: 'Write clear, professional emails that get results.',
      duration: '25 min',
      contentUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      order: 1,
      moduleId: module3.id,
    },
  });

  const lesson3_2 = await prisma.lesson.upsert({
    where: { id: 7 },
    update: {},
    create: {
      title: 'Meeting Vocabulary',
      description: 'Essential vocabulary and phrases for business meetings.',
      duration: '20 min',
      contentUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      order: 2,
      moduleId: module3.id,
    },
  });

  console.log(`   ✓ 3 módulos con ${7} lecciones creados`);

  // Crear recursos para las lecciones
  await prisma.lessonResource.createMany({
    data: [
      // Lesson 1 - Introduction: PDF + 2 extra videos
      {
        title: 'Course Syllabus.pdf',
        fileUrl: 'https://example.com/resources/course-syllabus.pdf',
        type: ResourceType.PDF,
        size: '245 KB',
        lessonId: lesson1_1.id,
      },
      {
        title: 'Welcome Message from Instructor',
        fileUrl: 'https://www.youtube.com/watch?v=9bZkp7q19f0',
        type: ResourceType.VIDEO,
        size: null,
        lessonId: lesson1_1.id,
      },
      {
        title: 'Platform Tour & Features',
        fileUrl: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
        type: ResourceType.VIDEO,
        size: null,
        lessonId: lesson1_1.id,
      },
      // Lesson 2 - SMART Goals: PDF + 1 extra video
      {
        title: 'Goal Setting Worksheet.pdf',
        fileUrl: 'https://example.com/resources/goal-worksheet.pdf',
        type: ResourceType.PDF,
        size: '180 KB',
        lessonId: lesson1_2.id,
      },
      {
        title: 'Real Student Goal Examples',
        fileUrl: 'https://www.youtube.com/watch?v=hT_nvWreIhg',
        type: ResourceType.VIDEO,
        size: null,
        lessonId: lesson1_2.id,
      },
      // Lesson 3 - Vocabulary: only PDF
      {
        title: 'Vocabulary Flashcards',
        fileUrl: 'https://example.com/resources/flashcards.pdf',
        type: ResourceType.PDF,
        size: '320 KB',
        lessonId: lesson1_3.id,
      },
    ],
    skipDuplicates: true,
  });
  console.log(`   ✓ Recursos de lecciones creados (incluye videos adicionales)`);

  // Progreso del usuario demo en los módulos
  await prisma.userLessonProgress.upsert({
    where: { userId_lessonId: { userId: demoUser.id, lessonId: lesson1_1.id } },
    update: {},
    create: {
      userId: demoUser.id,
      lessonId: lesson1_1.id,
      completed: true,
      lastAccessedAt: new Date(),
    },
  });

  await prisma.userLessonProgress.upsert({
    where: { userId_lessonId: { userId: demoUser.id, lessonId: lesson1_2.id } },
    update: {},
    create: {
      userId: demoUser.id,
      lessonId: lesson1_2.id,
      completed: true,
      lastAccessedAt: new Date(),
    },
  });

  await prisma.userModuleProgress.upsert({
    where: { userId_moduleId: { userId: demoUser.id, moduleId: module1.id } },
    update: {},
    create: {
      userId: demoUser.id,
      moduleId: module1.id,
      progress: 66, // 2 de 3 lecciones completadas
    },
  });

  await prisma.userModuleProgress.upsert({
    where: { userId_moduleId: { userId: demoUser.id, moduleId: module2.id } },
    update: {},
    create: {
      userId: demoUser.id,
      moduleId: module2.id,
      progress: 0,
    },
  });

  console.log(`   ✓ Progreso del usuario demo en módulos creado`);

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
    id: number;
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
          id: 1,
          text: 'What is the past tense of "go"?',
          options: ['goed', 'went', 'gone', 'going'],
          correctAnswer: 1,
        },
        {
          id: 2,
          text: 'What is the past tense of "eat"?',
          options: ['eated', 'eaten', 'ate', 'eating'],
          correctAnswer: 2,
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
      daysOffset: -1,
    },
    {
      title: 'Job Interview Essentials Quiz',
      type: ChallengeType.MULTIPLE_CHOICE,
      instructions:
        'Prepare for your next job interview! Test your knowledge of common interview questions and best practices.',
      daysOffset: 0,
      questions: [
        {
          id: 1,
          text: 'What is the best way to answer "Tell me about yourself"?',
          options: [
            'Talk about your hobbies and family',
            'Give a brief professional summary relevant to the role',
            'Read your entire resume',
            'Ask them to be more specific',
          ],
          correctAnswer: 1,
        },
        {
          id: 2,
          text: 'When asked about a weakness, you should:',
          options: [
            'Say you have no weaknesses',
            'Mention a real weakness and how you are improving',
            "Talk about a coworker's weakness",
            'Change the subject',
          ],
          correctAnswer: 1,
        },
        {
          id: 3,
          text: 'What does "STAR method" stand for in interviews?',
          options: [
            'Success, Teamwork, Achievement, Results',
            'Situation, Task, Action, Result',
            'Skills, Training, Abilities, References',
            'Strategy, Timeline, Assessment, Review',
          ],
          correctAnswer: 1,
        },
        {
          id: 4,
          text: 'At the end of an interview, what is a good question to ask?',
          options: [
            'How much vacation time do I get?',
            'What does success look like in this role?',
            'Can I leave early on Fridays?',
            "Do you monitor employees' computers?",
          ],
          correctAnswer: 1,
        },
      ],
    },
    {
      title: 'Common Expressions Quiz',
      type: ChallengeType.MULTIPLE_CHOICE,
      instructions: 'Test your knowledge of common English expressions and idioms.',
      daysOffset: 1,
      questions: [
        {
          id: 1,
          text: 'What does "break the ice" mean?',
          options: [
            'To destroy something cold',
            'To start a conversation in a social situation',
            'To cancel a meeting',
            'To solve a difficult problem',
          ],
          correctAnswer: 1,
        },
        {
          id: 2,
          text: 'If someone says "It\'s a piece of cake", they mean it is:',
          options: ['Delicious', 'Very easy', 'Expensive', 'Boring'],
          correctAnswer: 1,
        },
        {
          id: 3,
          text: 'What does "to be on the same page" mean?',
          options: [
            'To read together',
            'To have the same understanding',
            'To work in the same office',
            'To share a book',
          ],
          correctAnswer: 1,
        },
      ],
    },
    {
      title: 'Business Vocabulary Quiz',
      type: ChallengeType.MULTIPLE_CHOICE,
      instructions: 'Test your business English vocabulary with these questions.',
      daysOffset: 1,
      questions: [
        {
          id: 1,
          text: 'What does "ROI" stand for?',
          options: [
            'Return on Investment',
            'Rate of Interest',
            'Risk of Inflation',
            'Revenue on Income',
          ],
          correctAnswer: 0,
        },
        {
          id: 2,
          text: 'Which word means "to discuss terms of an agreement"?',
          options: ['Delegate', 'Negotiate', 'Facilitate', 'Collaborate'],
          correctAnswer: 1,
        },
        {
          id: 3,
          text: 'What is a "deadline"?',
          options: [
            'A type of loan',
            'The final date to complete something',
            'A business meeting',
            'An email signature',
          ],
          correctAnswer: 1,
        },
      ],
    },
    {
      title: 'Introduce Yourself',
      type: ChallengeType.AUDIO,
      instructions:
        'Record a professional introduction of yourself as if you were meeting a potential employer. Include your name, background, and what makes you unique.',
      daysOffset: 2,
    },
    {
      title: 'Conditionals Quiz',
      type: ChallengeType.MULTIPLE_CHOICE,
      instructions: 'Practice your understanding of conditional sentences.',
      daysOffset: 3,
      questions: [
        {
          id: 1,
          text: 'Complete: "If I ___ more time, I would learn another language."',
          options: ['have', 'had', 'will have', 'having'],
          correctAnswer: 1,
        },
        {
          id: 2,
          text: 'Which sentence is a first conditional?',
          options: [
            'If I won the lottery, I would travel.',
            'If it rains, I will stay home.',
            'If I were you, I would study.',
            'I wish I had studied more.',
          ],
          correctAnswer: 1,
        },
        {
          id: 3,
          text: 'Complete: "If she ___ earlier, she wouldn\'t have missed the train."',
          options: ['left', 'had left', 'leaves', 'would leave'],
          correctAnswer: 1,
        },
        {
          id: 4,
          text: 'What type of conditional is: "If I were rich, I would buy a yacht."?',
          options: [
            'Zero conditional',
            'First conditional',
            'Second conditional',
            'Third conditional',
          ],
          correctAnswer: 2,
        },
      ],
    },
    {
      title: 'Describe a Challenge You Overcame',
      type: ChallengeType.AUDIO,
      instructions:
        'Tell us about a difficult situation you faced and how you overcame it. Use past tense and try to include some business vocabulary.',
      daysOffset: 4,
    },
  ];

  interface CreatedChallenge {
    id: number;
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

  // ==================== SUBMISSIONS PARA USUARIO DEMO ====================
  console.log('\n🎮 Creando progreso de challenges para usuario demo...');

  // Buscar challenges creados para asignarlos al usuario demo
  const quizChallenges = createdChallenges.filter(c => c.type === ChallengeType.MULTIPLE_CHOICE);
  const voiceChallenges = createdChallenges.filter(c => c.type === ChallengeType.AUDIO);

  // Quiz completado con aprobación
  if (quizChallenges.length > 0) {
    try {
      await prisma.userDailyChallengeProgress.upsert({
        where: {
          userId_challengeId: {
            userId: demoUser.id,
            challengeId: quizChallenges[0].id,
          },
        },
        update: {},
        create: {
          userId: demoUser.id,
          challengeId: quizChallenges[0].id,
          completed: true,
          completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // hace 2 días
          answers: [1, 2], // respuestas correctas
          status: SubmissionStatus.APPROVED,
          score: 100,
        },
      });
      console.log(`   ✓ Quiz completado para demo user: ${quizChallenges[0].title}`);
    } catch (e) {
      // Ignorar duplicados
    }
  }

  // Audio con feedback pendiente
  if (voiceChallenges.length > 0) {
    try {
      await prisma.userDailyChallengeProgress.upsert({
        where: {
          userId_challengeId: {
            userId: demoUser.id,
            challengeId: voiceChallenges[0].id,
          },
        },
        update: {},
        create: {
          userId: demoUser.id,
          challengeId: voiceChallenges[0].id,
          completed: true,
          completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // hace 4 días
          fileUrl: 'https://storage.example.com/audio/diego-morning-routine.mp3',
          status: SubmissionStatus.PENDING,
        },
      });
      console.log(`   ✓ Audio pendiente para demo user: ${voiceChallenges[0].title}`);
    } catch (e) {
      // Ignorar duplicados
    }

    // Otro audio aprobado
    if (voiceChallenges.length > 1) {
      try {
        await prisma.userDailyChallengeProgress.upsert({
          where: {
            userId_challengeId: {
              userId: demoUser.id,
              challengeId: voiceChallenges[1].id,
            },
          },
          update: {},
          create: {
            userId: demoUser.id,
            challengeId: voiceChallenges[1].id,
            completed: true,
            completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // hace 1 día
            fileUrl: 'https://storage.example.com/audio/diego-dream-job.mp3',
            status: SubmissionStatus.APPROVED,
            feedback: 'Excellent pronunciation and clear structure! Keep up the great work.',
            score: 92,
          },
        });
        console.log(`   ✓ Audio aprobado para demo user: ${voiceChallenges[1].title}`);
      } catch (e) {
        // Ignorar duplicados
      }
    }
  }

  // Inscribir al usuario demo en clases
  if (createdClasses.length > 0) {
    for (const cls of createdClasses.slice(0, 3)) {
      try {
        const classData = classesData[createdClasses.indexOf(cls)];
        await prisma.classEnrollment.create({
          data: {
            userId: demoUser.id,
            classSessionId: cls.id,
            status: 'CONFIRMED',
            attendanceStatus:
              classData && classData.daysOffset < 0
                ? AttendanceStatus.PRESENT
                : AttendanceStatus.NOT_MARKED,
            attendanceMarkedAt: classData && classData.daysOffset < 0 ? new Date() : null,
          },
        });
      } catch (e) {
        // Ignorar duplicados
      }
    }
    console.log(`   ✓ Usuario demo inscrito en clases`);
  }

  // ==================== PROGRESO PARA ALUMNO ELITE ====================
  console.log('\n👑 Creando progreso para alumno.elite@test.com...');

  if (eliteUser) {
    // Progreso de módulos para elite user
    await prisma.userLessonProgress.upsert({
      where: { userId_lessonId: { userId: eliteUser.id, lessonId: lesson1_1.id } },
      update: {},
      create: {
        userId: eliteUser.id,
        lessonId: lesson1_1.id,
        completed: true,
        lastAccessedAt: new Date(),
      },
    });

    await prisma.userModuleProgress.upsert({
      where: { userId_moduleId: { userId: eliteUser.id, moduleId: module1.id } },
      update: {},
      create: {
        userId: eliteUser.id,
        moduleId: module1.id,
        progress: 33,
      },
    });

    console.log(`   ✓ Progreso de módulos para elite user`);

    // Los quizzes de hoy (daysOffset: 0) estarán disponibles para elite user
    // No creamos progress para los quizzes de hoy, así puede completarlos

    // Crear un audio pendiente para el historial
    if (voiceChallenges.length > 0) {
      try {
        await prisma.userDailyChallengeProgress.upsert({
          where: {
            userId_challengeId: {
              userId: eliteUser.id,
              challengeId: voiceChallenges[0].id,
            },
          },
          update: {},
          create: {
            userId: eliteUser.id,
            challengeId: voiceChallenges[0].id,
            completed: true,
            completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            fileUrl: 'https://storage.example.com/audio/elite-morning-routine.mp3',
            status: SubmissionStatus.APPROVED,
            feedback: 'Great job María! Your pronunciation is improving.',
            score: 88,
          },
        });
        console.log(`   ✓ Audio aprobado para elite user`);
      } catch (e) {
        // Ignorar duplicados
      }
    }

    // Inscribir al elite user en clases
    for (const cls of createdClasses.slice(0, 2)) {
      try {
        await prisma.classEnrollment.create({
          data: {
            userId: eliteUser.id,
            classSessionId: cls.id,
            status: 'CONFIRMED',
            attendanceStatus: AttendanceStatus.NOT_MARKED,
          },
        });
      } catch (e) {
        // Ignorar duplicados
      }
    }
    console.log(`   ✓ Elite user inscrito en clases`);
  }

  // ==================== RESUMEN ====================
  console.log('\n' + '='.repeat(50));
  console.log('🎉 Seed de Sprint 5 completado exitosamente!');
  console.log('='.repeat(50));
  console.log('\n📋 Credenciales de prueba:');
  console.log('   ┌─────────────────────────────────────────────┐');
  console.log('   │ SuperAdmin: superadmin@jfalcon.com          │');
  console.log('   │ Teacher:    teacher@jfalcon.com             │');
  console.log('   │ Alumno Pro: alumno.pro@test.com             │');
  console.log('   │ Alumno Elite: alumno.elite@test.com ⭐      │');
  console.log('   │ Demo User:  diego@test.com (con módulos)    │');
  console.log('   │ Password para todos: Test123!               │');
  console.log('   └─────────────────────────────────────────────┘');
  console.log('\n⭐ Alumno Elite (alumno.elite@test.com):');
  console.log('   - Quiz de Job Interview disponible HOY');
  console.log('   - Módulos de academy con progreso');
  console.log('   - Historial de challenges');
  console.log('\n🎓 Usuario Demo (diego@test.com):');
  console.log('   - 3 módulos de academy disponibles');
  console.log('   - 2 lecciones completadas en módulo 1');
  console.log('   - Challenges de quiz y audio con progreso');
  console.log('   - Inscrito en clases');
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
