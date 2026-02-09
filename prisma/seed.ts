import {
  PrismaClient,
  UserRole,
  UserStatus,
  ClassType,
  ChallengeType,
  EnrollmentStatus,
  NotificationType,
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
  await prisma.lesson.deleteMany();
  await prisma.module.deleteMany();
  await prisma.passwordReset.deleteMany();
  await prisma.userSession.deleteMany();
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
      email: 'carlos@test.com',
      password: hashedPassword,
      firstName: 'Carlos',
      lastName: 'Rodriguez',
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

  console.log('📚 Creating modules and lessons...');

  // Create modules
  const module1 = await prisma.module.create({
    data: {
      title: 'Business English',
      description: 'Professional communication skills for the workplace',
      image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40',
    },
  });

  const module2 = await prisma.module.create({
    data: {
      title: 'Conversational English',
      description: 'Improve your everyday conversation skills',
      image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f',
    },
  });

  // Create lessons for module 1
  const lessons1 = await Promise.all([
    prisma.lesson.create({
      data: {
        title: 'Introduction to Business Vocabulary',
        duration: '15 min',
        contentUrl: 'https://example.com/video1',
        order: 1,
        moduleId: module1.id,
      },
    }),
    prisma.lesson.create({
      data: {
        title: 'Email Writing Basics',
        duration: '20 min',
        contentUrl: 'https://example.com/video2',
        order: 2,
        moduleId: module1.id,
      },
    }),
    prisma.lesson.create({
      data: {
        title: 'Negotiation Tactics',
        duration: '25 min',
        contentUrl: 'https://example.com/video3',
        order: 3,
        moduleId: module1.id,
      },
    }),
  ]);

  // Create lesson progress for activeUser
  await prisma.userLessonProgress.create({
    data: {
      userId: activeUser.id,
      lessonId: lessons1[2]!.id,
      completed: false,
      lastAccessedAt: new Date(),
    },
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
      endTime: new Date(today18.getTime() + 60 * 60 * 1000), // +1 hour
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
      endTime: new Date(tomorrow19.getTime() + 90 * 60 * 1000), // +1.5 hours
      capacityMax: null, // Unlimited
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

  // Fill class2 to capacity (5 users)
  await prisma.classEnrollment.create({
    data: {
      userId: secondUser.id,
      classSessionId: class2.id,
      status: EnrollmentStatus.CONFIRMED,
    },
  });

  // Create 4 more fake enrollments for class2 to make it full
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

  // Enroll some users in class3 (workshop)
  await prisma.classEnrollment.create({
    data: {
      userId: secondUser.id,
      classSessionId: class3.id,
      status: EnrollmentStatus.CONFIRMED,
    },
  });

  console.log('🎯 Creating daily challenges...');

  // Today's challenge (not completed)
  const todayChallenge = await prisma.dailyChallenge.create({
    data: {
      title: 'Describe Your Morning Routine',
      type: ChallengeType.AUDIO,
      instructions:
        'Record a 2-3 minute audio describing your morning routine in English. Try to use present simple tense and vocabulary related to daily activities.',
      date: new Date(now.setHours(0, 0, 0, 0)),
      audioUrl: 'https://example.com/audio-prompt.mp3',
      points: 10,
      isActive: true,
    },
  });

  // Create progress for activeUser (not completed yet)
  await prisma.userDailyChallengeProgress.create({
    data: {
      userId: activeUser.id,
      challengeId: todayChallenge.id,
      completed: false,
    },
  });

  // Yesterday's challenge (completed)
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const yesterdayChallenge = await prisma.dailyChallenge.create({
    data: {
      title: 'Business Vocabulary Quiz',
      type: ChallengeType.MULTIPLE_CHOICE,
      instructions: 'Test your knowledge of business English vocabulary.',
      date: yesterday,
      questions: {
        questions: [
          {
            id: 1,
            text: 'What does "bottom line" mean in business?',
            options: ['Final result', 'Last page', 'Ground floor', 'Minimum price'],
            correctAnswer: 0,
          },
        ],
      },
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
      score: 10,
    },
  });

  // Day before yesterday (completed) - for streak
  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  twoDaysAgo.setHours(0, 0, 0, 0);

  const twoDaysAgoChallenge = await prisma.dailyChallenge.create({
    data: {
      title: 'Past Tense Practice',
      type: ChallengeType.WRITING,
      instructions: 'Write about what you did last weekend.',
      date: twoDaysAgo,
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
      score: 10,
    },
  });

  console.log('🔔 Creating notifications...');

  // Notification 1 - Class confirmed
  await prisma.notification.create({
    data: {
      userId: activeUser.id,
      type: NotificationType.CLASS_CONFIRMED,
      title: 'Class Enrollment Confirmed',
      message: 'You have been enrolled in "Conversational Advanced II" for today at 6:00 PM',
      isRead: false,
      data: { classSessionId: class1.id },
    },
  });

  // Notification 2 - Material available
  await prisma.notification.create({
    data: {
      userId: activeUser.id,
      type: NotificationType.MATERIAL_AVAILABLE,
      title: 'New Materials Available',
      message: 'Study materials for "Business English Masterclass" are now available',
      isRead: false,
      data: { classSessionId: class3.id },
    },
  });

  // Notification 3 - Challenge feedback
  await prisma.notification.create({
    data: {
      userId: activeUser.id,
      type: NotificationType.CHALLENGE_FEEDBACK,
      title: 'Challenge Completed!',
      message: "Great job on yesterday's challenge! You scored 10/10 points.",
      isRead: false,
      data: { challengeId: yesterdayChallenge.id },
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`- Users created: ${await prisma.user.count()}`);
  console.log(`- Class sessions: ${await prisma.classSession.count()}`);
  console.log(`- Enrollments: ${await prisma.classEnrollment.count()}`);
  console.log(`- Daily challenges: ${await prisma.dailyChallenge.count()}`);
  console.log(`- Notifications: ${await prisma.notification.count()}`);
  console.log(`- Modules: ${await prisma.module.count()}`);
  console.log(`- Lessons: ${await prisma.lesson.count()}`);
  console.log('\n🔐 Test credentials:');
  console.log('Email: eugenia@test.com');
  console.log('Password: password123');
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
