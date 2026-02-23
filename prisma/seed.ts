import * as dotenv from 'dotenv';
dotenv.config();

import {
  PrismaClient,
  UserRole,
  UserStatus,
  ClassType,
  ChallengeType,
  EnrollmentStatus,
  NotificationType,
  SubmissionStatus,
  ResourceType,
  ApplicationStatus,
} from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data (in correct order to respect foreign keys)
  console.log('🧹 Cleaning database...');
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
  await prisma.user.deleteMany();

  console.log('✨ Creating users...');

  // Hash password for test user
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create test user (active)
  const activeUser = await prisma.user.create({
    data: {
      email: 'eugenia@test.com',
      password: hashedPassword,
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

  // Create another active user
  const secondUser = await prisma.user.create({
    data: {
      email: 'diegoa.marzioni@gmail.com',
      password: hashedPassword,
      firstName: 'Diego',
      lastName: 'Marzioni',
      phone: '+0987654321',
      city: 'Madrid',
      country: 'Spain',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
    },
  });

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@test.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  // Create teacher user (for feedback simulation)
  const teacherUser = await prisma.user.create({
    data: {
      email: 'sarah@test.com',
      password: hashedPassword,
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: UserRole.MODERATOR,
      status: UserStatus.ACTIVE,
    },
  });

  console.log('📚 Creating modules and lessons...');

  // ====================
  // MODULE 1: Foundations & Goals
  // ====================
  const module1 = await prisma.module.create({
    data: {
      title: 'Foundations & Goals',
      description:
        'Start your journey by setting clear objectives and understanding the core principles of effective language learning. This module covers the essential mindset changes required for success.',
      image:
        'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1000&auto=format&fit=crop',
      order: 1,
    },
  });

  const lesson1_1 = await prisma.lesson.create({
    data: {
      title: 'Introduction to the Course',
      description:
        'Welcome to JFalcon Academy! In this lesson, you will learn about the course structure, objectives, and how to make the most of your learning experience.',
      duration: '10 min',
      contentUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      order: 1,
      moduleId: module1.id,
    },
  });

  const lesson1_2 = await prisma.lesson.create({
    data: {
      title: 'Setting SMART Goals',
      description:
        'Learn how to set Specific, Measurable, Achievable, Relevant, and Time-bound goals for your English learning journey.',
      duration: '15 min',
      contentUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      order: 2,
      moduleId: module1.id,
    },
  });

  const lesson1_3 = await prisma.lesson.create({
    data: {
      title: 'Essential Vocabulary Building',
      description:
        'Discover effective techniques for building and retaining new vocabulary. Learn about spaced repetition and active recall methods.',
      duration: '20 min',
      contentUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      order: 3,
      moduleId: module1.id,
    },
  });

  // Resources for lessons in module 1
  await prisma.lessonResource.createMany({
    data: [
      {
        title: 'Course Syllabus.pdf',
        fileUrl: 'https://example.com/resources/course-syllabus.pdf',
        type: ResourceType.PDF,
        size: '245 KB',
        lessonId: lesson1_1.id,
      },
      {
        title: 'Goal Setting Worksheet.pdf',
        fileUrl: 'https://example.com/resources/goal-worksheet.pdf',
        type: ResourceType.PDF,
        size: '180 KB',
        lessonId: lesson1_2.id,
      },
      {
        title: 'Vocabulary Flashcards Template.pdf',
        fileUrl: 'https://example.com/resources/flashcards.pdf',
        type: ResourceType.PDF,
        size: '320 KB',
        lessonId: lesson1_3.id,
      },
      {
        title: 'Anki App Guide',
        fileUrl: 'https://apps.ankiweb.net/',
        type: ResourceType.LINK,
        size: null,
        lessonId: lesson1_3.id,
      },
    ],
  });

  // ====================
  // MODULE 2: Conversation Basics
  // ====================
  const module2 = await prisma.module.create({
    data: {
      title: 'Conversation Basics',
      description:
        'Master the art of small talk and introductions. Learn how to confidently start conversations in professional settings and keep them going with active listening techniques.',
      image:
        'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1000&auto=format&fit=crop',
      order: 2,
    },
  });

  const lesson2_1 = await prisma.lesson.create({
    data: {
      title: 'Greetings and Introductions',
      description:
        'Learn formal and informal greetings for different contexts. Practice introducing yourself and others in professional and social situations.',
      duration: '12 min',
      contentUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      order: 1,
      moduleId: module2.id,
    },
  });

  const lesson2_2 = await prisma.lesson.create({
    data: {
      title: 'Small Talk Techniques',
      description:
        'Learn effective techniques to start and maintain casual conversations in English. This lesson covers common expressions, useful questions, and how to respond appropriately.',
      duration: '18 min',
      contentUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      order: 2,
      moduleId: module2.id,
    },
  });

  const lesson2_3 = await prisma.lesson.create({
    data: {
      title: 'Active Listening Skills',
      description:
        'Develop your active listening skills to better understand native speakers and engage more meaningfully in conversations.',
      duration: '22 min',
      contentUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      order: 3,
      moduleId: module2.id,
    },
  });

  // Resources for module 2
  await prisma.lessonResource.createMany({
    data: [
      {
        title: 'Common Greetings Cheatsheet.pdf',
        fileUrl: 'https://example.com/resources/greetings-cheatsheet.pdf',
        type: ResourceType.PDF,
        size: '150 KB',
        lessonId: lesson2_1.id,
      },
      {
        title: 'Small Talk Topics List.pdf',
        fileUrl: 'https://example.com/resources/smalltalk-topics.pdf',
        type: ResourceType.PDF,
        size: '180 KB',
        lessonId: lesson2_2.id,
      },
      {
        title: 'Lesson Transcript.pdf',
        fileUrl: 'https://example.com/resources/lesson-transcript-2-2.pdf',
        type: ResourceType.PDF,
        size: '245 KB',
        lessonId: lesson2_2.id,
      },
      {
        title: 'Practice Exercises.pdf',
        fileUrl: 'https://example.com/resources/exercises-2-3.pdf',
        type: ResourceType.PDF,
        size: '320 KB',
        lessonId: lesson2_3.id,
      },
    ],
  });

  // ====================
  // MODULE 3: Business English
  // ====================
  const module3 = await prisma.module.create({
    data: {
      title: 'Business English',
      description:
        'Dive into the world of corporate communication. From writing professional emails to delivering impactful presentations, this module equips you with the tools for the office.',
      image:
        'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=1000&auto=format&fit=crop',
      order: 3,
    },
  });

  const lesson3_1 = await prisma.lesson.create({
    data: {
      title: 'Professional Email Writing',
      description:
        'Master the art of writing clear, professional emails. Learn proper formatting, tone, and common phrases for business correspondence.',
      duration: '25 min',
      contentUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      order: 1,
      moduleId: module3.id,
    },
  });

  const lesson3_2 = await prisma.lesson.create({
    data: {
      title: 'Meeting Vocabulary & Phrases',
      description:
        'Learn essential vocabulary and phrases for participating in business meetings. From opening remarks to closing discussions.',
      duration: '20 min',
      contentUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      order: 2,
      moduleId: module3.id,
    },
  });

  const lesson3_3 = await prisma.lesson.create({
    data: {
      title: 'Delivering Presentations',
      description:
        'Build confidence in presenting in English. Learn structure, transitions, and techniques for engaging your audience.',
      duration: '30 min',
      contentUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      order: 3,
      moduleId: module3.id,
    },
  });

  await prisma.lessonResource.createMany({
    data: [
      {
        title: 'Email Templates.pdf',
        fileUrl: 'https://example.com/resources/email-templates.pdf',
        type: ResourceType.PDF,
        size: '290 KB',
        lessonId: lesson3_1.id,
      },
      {
        title: 'Meeting Phrases Reference.pdf',
        fileUrl: 'https://example.com/resources/meeting-phrases.pdf',
        type: ResourceType.PDF,
        size: '200 KB',
        lessonId: lesson3_2.id,
      },
      {
        title: 'Presentation Slides Template',
        fileUrl: 'https://docs.google.com/presentation/d/example',
        type: ResourceType.LINK,
        size: null,
        lessonId: lesson3_3.id,
      },
    ],
  });

  // ====================
  // MODULE 4: Advanced Topics
  // ====================
  const module4 = await prisma.module.create({
    data: {
      title: 'Advanced Topics',
      description:
        'Refine your skills with complex idioms, cultural nuances, and advanced negotiation tactics. Perfect for those looking to reach near-native fluency levels.',
      image:
        'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1000&auto=format&fit=crop',
      order: 4,
    },
  });

  const lesson4_1 = await prisma.lesson.create({
    data: {
      title: 'Common Idioms & Expressions',
      description:
        'Learn the most common English idioms used in everyday conversation and business contexts.',
      duration: '18 min',
      contentUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      order: 1,
      moduleId: module4.id,
    },
  });

  const lesson4_2 = await prisma.lesson.create({
    data: {
      title: 'Cultural Nuances in Communication',
      description:
        'Understand the cultural context behind English communication styles in different English-speaking countries.',
      duration: '25 min',
      contentUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      order: 2,
      moduleId: module4.id,
    },
  });

  await prisma.lessonResource.createMany({
    data: [
      {
        title: 'Idioms Dictionary.pdf',
        fileUrl: 'https://example.com/resources/idioms-dictionary.pdf',
        type: ResourceType.PDF,
        size: '450 KB',
        lessonId: lesson4_1.id,
      },
    ],
  });

  console.log('📝 Creating user progress...');

  // User has completed all lessons in Module 1
  await prisma.userLessonProgress.createMany({
    data: [
      {
        userId: activeUser.id,
        lessonId: lesson1_1.id,
        completed: true,
        lastAccessedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
      {
        userId: activeUser.id,
        lessonId: lesson1_2.id,
        completed: true,
        lastAccessedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      },
      {
        userId: activeUser.id,
        lessonId: lesson1_3.id,
        completed: true,
        lastAccessedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  // User has completed 2 of 3 lessons in Module 2
  await prisma.userLessonProgress.createMany({
    data: [
      {
        userId: activeUser.id,
        lessonId: lesson2_1.id,
        completed: true,
        lastAccessedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        userId: activeUser.id,
        lessonId: lesson2_2.id,
        completed: true,
        lastAccessedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        userId: activeUser.id,
        lessonId: lesson2_3.id,
        completed: false,
        lastAccessedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  // User has completed 2 of 3 lessons in Module 3
  await prisma.userLessonProgress.createMany({
    data: [
      {
        userId: activeUser.id,
        lessonId: lesson3_1.id,
        completed: true,
        lastAccessedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
      {
        userId: activeUser.id,
        lessonId: lesson3_2.id,
        completed: true,
        lastAccessedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  // Module progress
  await prisma.userModuleProgress.createMany({
    data: [
      { userId: activeUser.id, moduleId: module1.id, progress: 100 },
      { userId: activeUser.id, moduleId: module2.id, progress: 66 },
      { userId: activeUser.id, moduleId: module3.id, progress: 66 },
      { userId: activeUser.id, moduleId: module4.id, progress: 0 },
    ],
  });

  console.log('🏫 Creating class sessions...');

  const now = new Date();
  const today18 = new Date(now);
  today18.setHours(18, 0, 0, 0);

  const tomorrow17 = new Date(now);
  tomorrow17.setDate(tomorrow17.getDate() + 1);
  tomorrow17.setHours(17, 0, 0, 0);

  const tomorrow19 = new Date(now);
  tomorrow19.setDate(tomorrow19.getDate() + 1);
  tomorrow19.setHours(19, 0, 0, 0);

  const dayAfter10 = new Date(now);
  dayAfter10.setDate(dayAfter10.getDate() + 2);
  dayAfter10.setHours(10, 0, 0, 0);

  const dayAfter14 = new Date(now);
  dayAfter14.setDate(dayAfter14.getDate() + 2);
  dayAfter14.setHours(14, 0, 0, 0);

  const nextWeek18 = new Date(now);
  nextWeek18.setDate(nextWeek18.getDate() + 7);
  nextWeek18.setHours(18, 0, 0, 0);

  // Class 1 - Today at 6pm (user enrolled)
  const class1 = await prisma.classSession.create({
    data: {
      title: 'Conversational Advanced II',
      type: ClassType.REGULAR,
      startTime: today18,
      endTime: new Date(today18.getTime() + 60 * 60 * 1000),
      capacityMax: 5,
      meetLink: 'https://meet.google.com/abc-defg-hij',
      materialsLink: 'https://drive.google.com/file/materials1',
      description: 'Advanced conversation practice focusing on current events.',
    },
  });

  // Class 2 - Tomorrow at 5pm (full capacity)
  const class2 = await prisma.classSession.create({
    data: {
      title: 'Grammar Review Session',
      type: ClassType.REGULAR,
      startTime: tomorrow17,
      endTime: new Date(tomorrow17.getTime() + 60 * 60 * 1000),
      capacityMax: 5,
      meetLink: 'https://meet.google.com/ghi-jklm-nop',
      description: 'Deep dive into complex grammar structures and common mistakes.',
    },
  });

  // Class 3 - Tomorrow at 7pm (workshop, unlimited)
  const class3 = await prisma.classSession.create({
    data: {
      title: 'Business English Masterclass',
      type: ClassType.WORKSHOP,
      startTime: tomorrow19,
      endTime: new Date(tomorrow19.getTime() + 90 * 60 * 1000),
      capacityMax: null,
      meetLink: 'https://meet.google.com/qrs-tuvw-xyz',
      materialsLink: 'https://drive.google.com/file/materials3',
      description: 'Open workshop on professional communication skills.',
    },
  });

  // Class 4 - Day after tomorrow at 10am (workshop)
  const class4 = await prisma.classSession.create({
    data: {
      title: 'Pronunciation Workshop',
      type: ClassType.WORKSHOP,
      startTime: dayAfter10,
      endTime: new Date(dayAfter10.getTime() + 90 * 60 * 1000),
      capacityMax: null,
      meetLink: 'https://meet.google.com/pqr-stuv-wxy',
      description: 'Interactive session to master difficult phonemes and intonation.',
    },
  });

  // Class 5 - Day after tomorrow at 2pm
  const class5 = await prisma.classSession.create({
    data: {
      title: 'Debate Club: A.I. Ethics',
      type: ClassType.REGULAR,
      startTime: dayAfter14,
      endTime: new Date(dayAfter14.getTime() + 90 * 60 * 1000),
      capacityMax: 8,
      meetLink: 'https://meet.google.com/aaa-bbbb-ccc',
      description: 'Structured debate practice. Topic: Artificial Intelligence Ethics.',
    },
  });

  // Class 6 - Next week
  const class6 = await prisma.classSession.create({
    data: {
      title: 'IELTS Prep: Writing Task 2',
      type: ClassType.REGULAR,
      startTime: nextWeek18,
      endTime: new Date(nextWeek18.getTime() + 60 * 60 * 1000),
      capacityMax: 6,
      meetLink: 'https://meet.google.com/ddd-eeee-fff',
      materialsLink: 'https://drive.google.com/file/materials6',
      description: 'Focused strategy session for the IELTS writing component.',
    },
  });

  console.log('✅ Creating class enrollments...');

  // Enroll activeUser in class1 (today's class)
  await prisma.classEnrollment.create({
    data: {
      userId: activeUser.id,
      classSessionId: class1.id,
      status: EnrollmentStatus.CONFIRMED,
    },
  });

  // Enroll activeUser in class6 (next week)
  await prisma.classEnrollment.create({
    data: {
      userId: activeUser.id,
      classSessionId: class6.id,
      status: EnrollmentStatus.CONFIRMED,
    },
  });

  // Fill class2 to capacity
  await prisma.classEnrollment.create({
    data: {
      userId: secondUser.id,
      classSessionId: class2.id,
      status: EnrollmentStatus.CONFIRMED,
    },
  });

  for (let i = 0; i < 4; i++) {
    const fakeUser = await prisma.user.create({
      data: {
        email: `user${i}@test.com`,
        password: hashedPassword,
        firstName: `User${i}`,
        lastName: 'Test',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      },
    });

    await prisma.classEnrollment.create({
      data: {
        userId: fakeUser.id,
        classSessionId: class2.id,
        status: EnrollmentStatus.CONFIRMED,
      },
    });
  }

  await prisma.classEnrollment.create({
    data: {
      userId: secondUser.id,
      classSessionId: class3.id,
      status: EnrollmentStatus.CONFIRMED,
    },
  });

  console.log('🎯 Creating daily challenges...');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // TODAY'S CHALLENGE - Audio (Pending)
  const todayChallenge = await prisma.dailyChallenge.create({
    data: {
      title: 'Describe Your Morning Routine',
      type: ChallengeType.AUDIO,
      instructions:
        'Record a 2-3 minute audio describing your morning routine in English. Try to use present simple tense and vocabulary related to daily activities. Focus on clear pronunciation and natural flow.',
      date: today,
      audioUrl: null,
      points: 10,
      isActive: true,
    },
  });

  // TOMORROW'S CHALLENGE - Quiz
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const tomorrowChallenge = await prisma.dailyChallenge.create({
    data: {
      title: 'Business Vocabulary Quiz',
      type: ChallengeType.MULTIPLE_CHOICE,
      instructions:
        'Select the correct definition for each business term. You need at least 70% to pass. Good luck!',
      date: tomorrow,
      questions: [
        {
          id: 1,
          text: "What does 'ROI' stand for?",
          options: [
            'Rate of Inflation',
            'Return on Investment',
            'Risk of Insolvency',
            'Royal Operating Income',
          ],
          correctAnswer: 1,
        },
        {
          id: 2,
          text: "Which phrase means 'to postpone a meeting'?",
          options: ['Call off', 'Bring forward', 'Put off', 'Get across'],
          correctAnswer: 2,
        },
        {
          id: 3,
          text: "A 'stakeholder' is...",
          options: [
            'Someone who holds the bets',
            'A person with an interest in a company',
            'The owner of a steakhouse',
            'An employee who is fired',
          ],
          correctAnswer: 1,
        },
        {
          id: 4,
          text: "What does 'to break even' mean?",
          options: [
            'To make a profit',
            'To split something equally',
            'Neither profit nor loss',
            'To go bankrupt',
          ],
          correctAnswer: 2,
        },
        {
          id: 5,
          text: "'Scalability' in business refers to...",
          options: [
            'Weighing products',
            'Ability to grow without issues',
            'Climbing the corporate ladder',
            'Fish farming',
          ],
          correctAnswer: 1,
        },
      ],
      points: 10,
      isActive: true,
    },
  });

  // PAST CHALLENGES - For History

  // Yesterday - Audio (Approved with feedback)
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const yesterdayChallenge = await prisma.dailyChallenge.create({
    data: {
      title: 'Tell Us About Your Hometown',
      type: ChallengeType.AUDIO,
      instructions: 'Record a 2-minute audio describing your hometown and what makes it special.',
      date: yesterday,
      points: 10,
      isActive: false,
    },
  });

  await prisma.userDailyChallengeProgress.create({
    data: {
      userId: activeUser.id,
      challengeId: yesterdayChallenge.id,
      completed: true,
      completedAt: yesterday,
      fileUrl: 'https://storage.example.com/audio/user1-challenge2.webm',
      status: SubmissionStatus.APPROVED,
      feedback:
        'Excellent work! Your pronunciation has improved significantly. Try to work on using more descriptive adjectives next time.',
      score: null,
    },
  });

  // 2 days ago - Quiz (Approved)
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  const twoDaysAgoChallenge = await prisma.dailyChallenge.create({
    data: {
      title: 'Grammar Quiz: Present Perfect',
      type: ChallengeType.MULTIPLE_CHOICE,
      instructions: 'Test your knowledge of present perfect tense usage.',
      date: twoDaysAgo,
      questions: [
        {
          id: 1,
          text: 'I _____ to London three times.',
          options: ['have been', 'was', 'am being', 'had been'],
          correctAnswer: 0,
        },
        {
          id: 2,
          text: 'She _____ her homework yet.',
          options: ["didn't finish", "hasn't finished", 'not finished', "wasn't finishing"],
          correctAnswer: 1,
        },
        {
          id: 3,
          text: 'They _____ married for 10 years.',
          options: ['are', 'have been', 'were', 'being'],
          correctAnswer: 1,
        },
        {
          id: 4,
          text: 'I _____ that movie before.',
          options: ['saw', 'have seen', 'had see', 'am seeing'],
          correctAnswer: 1,
        },
        {
          id: 5,
          text: 'He _____ here since 2020.',
          options: ['works', 'worked', 'has worked', 'is working'],
          correctAnswer: 2,
        },
        {
          id: 6,
          text: 'We _____ finished the project.',
          options: ['just have', 'have just', 'just', 'having just'],
          correctAnswer: 1,
        },
        {
          id: 7,
          text: '_____ you ever eaten sushi?',
          options: ['Did', 'Have', 'Are', 'Were'],
          correctAnswer: 1,
        },
        {
          id: 8,
          text: 'She _____ to the gym twice this week.',
          options: ['went', 'goes', 'has gone', 'is going'],
          correctAnswer: 2,
        },
        {
          id: 9,
          text: 'The train _____. We missed it!',
          options: ['left', 'has left', 'leaves', 'is leaving'],
          correctAnswer: 1,
        },
        {
          id: 10,
          text: 'I _____ my keys. Can you help me find them?',
          options: ['lose', 'lost', 'have lost', 'am losing'],
          correctAnswer: 2,
        },
      ],
      points: 10,
      isActive: false,
    },
  });

  await prisma.userDailyChallengeProgress.create({
    data: {
      userId: activeUser.id,
      challengeId: twoDaysAgoChallenge.id,
      completed: true,
      completedAt: twoDaysAgo,
      answers: [0, 1, 1, 1, 2, 1, 1, 2, 0, 2],
      status: SubmissionStatus.APPROVED,
      feedback: 'Great job! Only one small mistake on question 9.',
      score: 90,
    },
  });

  // 3 days ago - Audio (Needs Improvement)
  const threeDaysAgo = new Date(today);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const threeDaysAgoChallenge = await prisma.dailyChallenge.create({
    data: {
      title: 'Describe Your Dream Job',
      type: ChallengeType.AUDIO,
      instructions: 'Record a 2-minute audio describing your dream job and why it appeals to you.',
      date: threeDaysAgo,
      points: 10,
      isActive: false,
    },
  });

  await prisma.userDailyChallengeProgress.create({
    data: {
      userId: activeUser.id,
      challengeId: threeDaysAgoChallenge.id,
      completed: true,
      completedAt: threeDaysAgo,
      fileUrl: 'https://storage.example.com/audio/user1-challenge4.webm',
      status: SubmissionStatus.NEEDS_IMPROVEMENT,
      feedback:
        'You need to focus more on clarity. Some words were mumbled. Please work on your enunciation and try again!',
      score: null,
    },
  });

  // 4 days ago - Quiz (Approved)
  const fourDaysAgo = new Date(today);
  fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

  const fourDaysAgoChallenge = await prisma.dailyChallenge.create({
    data: {
      title: 'Phrasal Verbs Challenge',
      type: ChallengeType.MULTIPLE_CHOICE,
      instructions: 'Test your knowledge of common phrasal verbs.',
      date: fourDaysAgo,
      questions: [
        {
          id: 1,
          text: "'Give up' means...",
          options: ['To start', 'To quit', 'To continue', 'To increase'],
          correctAnswer: 1,
        },
        {
          id: 2,
          text: "'Look after' means...",
          options: ['To search', 'To ignore', 'To take care of', 'To follow'],
          correctAnswer: 2,
        },
        {
          id: 3,
          text: "'Put off' means...",
          options: ['To postpone', 'To remove', 'To annoy', 'To dress'],
          correctAnswer: 0,
        },
      ],
      points: 10,
      isActive: false,
    },
  });

  await prisma.userDailyChallengeProgress.create({
    data: {
      userId: activeUser.id,
      challengeId: fourDaysAgoChallenge.id,
      completed: true,
      completedAt: fourDaysAgo,
      answers: [1, 2, 0],
      status: SubmissionStatus.APPROVED,
      feedback: 'Perfect score! Excellent understanding of phrasal verbs.',
      score: 100,
    },
  });

  console.log('🔔 Creating notifications...');

  console.log('💼 Creating job offers and applications...');

  // Create job offers based on real format
  const job1 = await prisma.jobOffer.create({
    data: {
      title: '$15k/Mo Closers for Info Coaching Offer',
      company: 'Adam Stifel Coaching',
      location: 'Remote - US Hours',
      salaryRange: '$5,000 - $15,000/month OTE',
      oteMin: 5000,
      oteMax: 15000,
      revenue: 200000,
      type: 'Full-time',
      description:
        "Join our high-ticket sales team selling SaaS to B2C Info Coaching products. We're looking for hungry closers who want to earn $15k+ per month. Revenue: $60k-$200k/Mo. Must be comfortable with high-pressure sales environment and working US hours.",
      requirements: [
        'Fluent English (C1 or higher)',
        '2+ years of closing experience',
        'Experience in high-ticket sales',
        'Comfortable working US hours',
        'Self-motivated and money-hungry attitude',
      ],
      isActive: true,
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
      type: 'Full-time',
      description:
        'B2B AI SaaS company looking for experienced setters to join our growing sales team. Work with cutting-edge AI technology and help businesses transform their operations.',
      requirements: [
        'Fluent English (C1 or higher)',
        '3+ years of cold calling experience',
        'B2B sales background preferred',
        'Experience with SaaS products',
        'US or Canada timezone availability',
      ],
      isActive: true,
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
      type: 'Full-time',
      description:
        'Customer Success Manager position for a yoga online business opportunity company. Help yoga teachers succeed with our $5.9k ticket program. Revenue: $300k/Mo.',
      requirements: [
        'Fluent English (B2 or higher)',
        'Customer success experience',
        'Passion for wellness industry',
        'Strong communication skills',
        'Experience with online coaching programs',
      ],
      isActive: true,
    },
  });

  const job4 = await prisma.jobOffer.create({
    data: {
      title: 'Senior Frontend Developer',
      company: 'TechCorp Inc.',
      location: 'Remote - Worldwide',
      salaryRange: '$80,000 - $120,000/year',
      oteMin: 6666,
      oteMax: 10000,
      revenue: 0,
      type: 'Full-time',
      description:
        "We're looking for an experienced Frontend Developer to join our international team. Work on cutting-edge web applications using React, TypeScript, and modern technologies.",
      requirements: [
        'Fluent English (B2 or higher)',
        '4+ years of frontend development experience',
        'Expert in React and TypeScript',
        'Experience with modern CSS frameworks',
        'Strong problem-solving skills',
      ],
      isActive: true,
    },
  });

  const job5 = await prisma.jobOffer.create({
    data: {
      title: 'English Teacher (Online)',
      company: 'Global Education',
      location: 'Remote',
      salaryRange: '$25 - $40/hour',
      oteMin: 2000,
      oteMax: 4000,
      revenue: 0,
      type: 'Part-time',
      description:
        'Teach English to students worldwide from the comfort of your home. Flexible schedule, great pay, and the opportunity to make a difference.',
      requirements: [
        'Native or near-native English speaker',
        'TEFL/TESOL certification preferred',
        'Teaching experience is a plus',
        'Reliable internet connection',
        'Patient and engaging personality',
      ],
      isActive: true,
    },
  });

  const job6 = await prisma.jobOffer.create({
    data: {
      title: 'Marketing Coordinator',
      company: 'Digital Agency Plus',
      location: 'Hybrid - Buenos Aires',
      salaryRange: '$45,000 - $60,000/year',
      oteMin: 3750,
      oteMax: 5000,
      revenue: 25000,
      type: 'Full-time',
      description:
        'Join our dynamic marketing team and help create impactful campaigns for international clients. Bilingual role requiring English and Spanish.',
      requirements: [
        'Fluent English and Spanish',
        '2+ years of marketing experience',
        'Experience with digital marketing tools',
        'Creative mindset',
        'Strong organizational skills',
      ],
      isActive: true,
    },
  });

  // Create some job applications for the test user
  await prisma.jobApplication.create({
    data: {
      userId: activeUser.id,
      jobOfferId: job3.id,
      status: ApplicationStatus.APPLIED,
      notes: null,
      appliedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
  });

  await prisma.jobApplication.create({
    data: {
      userId: activeUser.id,
      jobOfferId: job5.id,
      status: ApplicationStatus.INTERVIEW,
      notes: 'Interview scheduled for Thursday at 3pm',
      appliedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    },
  });

  await prisma.jobApplication.create({
    data: {
      userId: activeUser.id,
      jobOfferId: job6.id,
      status: ApplicationStatus.OFFER,
      notes: 'Offer: $52k/year - Need to respond by Friday',
      appliedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
    },
  });

  console.log('🔔 Creating notifications...');

  await prisma.notification.createMany({
    data: [
      {
        userId: activeUser.id,
        type: NotificationType.CLASS_CONFIRMED,
        title: 'Class Enrollment Confirmed',
        message: 'You have been enrolled in "Conversational Advanced II" for today at 6:00 PM',
        isRead: false,
        data: { classSessionId: class1.id },
      },
      {
        userId: activeUser.id,
        type: NotificationType.MATERIAL_AVAILABLE,
        title: 'New Materials Available',
        message: 'Study materials for "Business English Masterclass" are now available',
        isRead: false,
        data: { classSessionId: class3.id },
      },
      {
        userId: activeUser.id,
        type: NotificationType.CHALLENGE_FEEDBACK,
        title: 'New Feedback on Your Challenge',
        message: 'Sarah Johnson has reviewed your "Tell Us About Your Hometown" submission.',
        isRead: false,
        data: { challengeId: yesterdayChallenge.id },
      },
    ],
  });

  console.log('✅ Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`- Users created: ${await prisma.user.count()}`);
  console.log(`- Modules: ${await prisma.module.count()}`);
  console.log(`- Lessons: ${await prisma.lesson.count()}`);
  console.log(`- Lesson Resources: ${await prisma.lessonResource.count()}`);
  console.log(`- Class sessions: ${await prisma.classSession.count()}`);
  console.log(`- Enrollments: ${await prisma.classEnrollment.count()}`);
  console.log(`- Daily challenges: ${await prisma.dailyChallenge.count()}`);
  console.log(`- Challenge progress: ${await prisma.userDailyChallengeProgress.count()}`);
  console.log(`- Job offers: ${await prisma.jobOffer.count()}`);
  console.log(`- Job applications: ${await prisma.jobApplication.count()}`);
  console.log(`- Notifications: ${await prisma.notification.count()}`);
  console.log('\n🔐 Test credentials:');
  console.log('Email: eugenia@test.com');
  console.log('Password: password123');
  console.log('\n📈 User Progress:');
  console.log('- Module 1 (Foundations): 100% complete');
  console.log('- Module 2 (Conversation): 66% complete');
  console.log('- Module 3 (Business): 66% complete');
  console.log('- Module 4 (Advanced): 0% complete');
  console.log('- Overall Progress: ~54%');
  console.log('- Lessons Completed: 7/11');
  console.log('\n💼 Job Applications:');
  console.log('- Applied: 1 (CSMs for Yoga)');
  console.log('- Interview: 1 (English Teacher)');
  console.log('- Offer: 1 (Marketing Coordinator)');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async e => {
    console.error('❌ Error durante seeding:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
