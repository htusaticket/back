// src/infrastructure/persistence/prisma/repositories/class-session.repository.ts
import { Injectable } from '@nestjs/common';
import { EnrollmentStatus } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import {
  IClassSessionRepository,
  ClassSession,
  ClassSessionWithEnrollmentCount,
} from '@/core/interfaces';
import {
  formatDayString,
  formatDateString,
  formatTimeRange,
  formatClassType,
} from '@/application/common/utils/date-formatter.util';
import { ClassResponseDto } from '@/application/classes/dto';

@Injectable()
export class PrismaClassSessionRepository implements IClassSessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAvailableClasses(): Promise<ClassResponseDto[]> {
    const now = new Date();

    const classes = await this.prisma.classSession.findMany({
      where: {
        startTime: {
          gt: now,
        },
      },
      orderBy: {
        startTime: 'asc',
      },
      include: {
        _count: {
          select: {
            enrollments: {
              where: {
                status: EnrollmentStatus.CONFIRMED,
              },
            },
          },
        },
      },
    });

    return classes.map(classSession => ({
      id: classSession.id,
      title: classSession.title,
      type: formatClassType(classSession.type),
      day: formatDayString(classSession.startTime),
      date: formatDateString(classSession.startTime),
      time: formatTimeRange(classSession.startTime, classSession.endTime),
      capacity: {
        current: classSession._count.enrollments,
        max: classSession.capacityMax,
      },
      isEnrolled: false, // Este método es para clases disponibles, no hay contexto de usuario
      isFull:
        classSession.capacityMax !== null &&
        classSession._count.enrollments >= classSession.capacityMax,
      meetLink: classSession.meetLink,
      description: classSession.description,
    }));
  }

  async findUserSchedule(
    userId: string,
    status: EnrollmentStatus = EnrollmentStatus.CONFIRMED,
  ): Promise<ClassResponseDto[]> {
    const enrollments = await this.prisma.classEnrollment.findMany({
      where: {
        userId,
        status,
      },
      include: {
        classSession: {
          include: {
            _count: {
              select: {
                enrollments: {
                  where: {
                    status: EnrollmentStatus.CONFIRMED,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        classSession: {
          startTime: 'asc',
        },
      },
    });

    return enrollments.map(enrollment => ({
      id: enrollment.classSession.id,
      title: enrollment.classSession.title,
      type: formatClassType(enrollment.classSession.type),
      day: formatDayString(enrollment.classSession.startTime),
      date: formatDateString(enrollment.classSession.startTime),
      time: formatTimeRange(enrollment.classSession.startTime, enrollment.classSession.endTime),
      capacity: {
        current: enrollment.classSession._count.enrollments,
        max: enrollment.classSession.capacityMax,
      },
      isEnrolled: true,
      isFull:
        enrollment.classSession.capacityMax !== null &&
        enrollment.classSession._count.enrollments >= enrollment.classSession.capacityMax,
      meetLink: enrollment.classSession.meetLink,
      description: enrollment.classSession.description,
    }));
  }

  async findNextConfirmedClass(userId: string): Promise<ClassSessionWithEnrollmentCount | null> {
    const now = new Date();

    const enrollment = await this.prisma.classEnrollment.findFirst({
      where: {
        userId,
        status: EnrollmentStatus.CONFIRMED,
        classSession: {
          startTime: {
            gt: now,
          },
        },
      },
      include: {
        classSession: {
          include: {
            _count: {
              select: {
                enrollments: {
                  where: {
                    status: EnrollmentStatus.CONFIRMED,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        classSession: {
          startTime: 'asc',
        },
      },
    });

    if (!enrollment) return null;

    return {
      ...enrollment.classSession,
      currentEnrollment: enrollment.classSession._count.enrollments,
      isFull:
        enrollment.classSession.capacityMax !== null &&
        enrollment.classSession._count.enrollments >= enrollment.classSession.capacityMax,
    };
  }

  async findById(id: number): Promise<ClassSession | null> {
    return this.prisma.classSession.findUnique({
      where: { id },
    });
  }

  async enrollUser(userId: string, classSessionId: number): Promise<void> {
    await this.prisma.classEnrollment.create({
      data: {
        userId,
        classSessionId,
        status: EnrollmentStatus.CONFIRMED,
      },
    });
  }

  async cancelEnrollment(userId: string, classSessionId: number): Promise<void> {
    await this.prisma.classEnrollment.updateMany({
      where: {
        userId,
        classSessionId,
      },
      data: {
        status: EnrollmentStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });
  }

  async isUserEnrolled(userId: string, classSessionId: number): Promise<boolean> {
    const enrollment = await this.prisma.classEnrollment.findUnique({
      where: {
        userId_classSessionId: {
          userId,
          classSessionId,
        },
      },
    });

    return enrollment !== null && enrollment.status === EnrollmentStatus.CONFIRMED;
  }

  async getConfirmedEnrollmentCount(classSessionId: number): Promise<number> {
    return this.prisma.classEnrollment.count({
      where: {
        classSessionId,
        status: EnrollmentStatus.CONFIRMED,
      },
    });
  }
}
