// src/core/entities/module.entity.ts
export interface Module {
  id: number;
  title: string;
  description: string;
  image: string;
  order: number;
  visibleForSkillBuilder?: boolean;
  visibleForSkillBuilderLive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ModuleSection {
  id: number;
  moduleId: number;
  title: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Lesson {
  id: number;
  title: string;
  description: string | null;
  duration: string;
  contentUrl: string | null;
  order: number;
  moduleId: number;
  sectionId: number | null;
}

export interface LessonResource {
  id: number;
  title: string;
  fileUrl: string;
  type: 'PDF' | 'LINK' | 'VIDEO' | 'DOCUMENT';
  size: string | null;
  lessonId: number;
  createdAt: Date;
}

export interface UserLessonProgress {
  id: string;
  userId: string;
  lessonId: number;
  completed: boolean;
  lastAccessedAt: Date | null;
  updatedAt: Date;
}

export interface UserModuleProgress {
  id: string;
  userId: string;
  moduleId: number;
  progress: number;
  updatedAt: Date;
}

// DTOs for Academy
export interface ModuleWithProgress extends Module {
  lessons: LessonWithProgress[];
  sections: SectionWithLessons[];
  totalLessons: number;
  completedLessons: number;
  progress: number;
}

export interface LessonWithProgress extends Lesson {
  completed: boolean;
}

// A "virtual" section with id=null represents lessons that are not assigned
// to any real section (backwards-compatible bucket for pre-sections lessons).
export interface SectionWithLessons {
  id: number | null;
  title: string | null;
  order: number;
  lessons: LessonWithProgress[];
}

export interface AcademyOverviewStats {
  overallProgress: number;
  lessonsCompleted: number;
  totalLessons: number;
  totalTime: string;
}

export interface AcademyOverview {
  stats: AcademyOverviewStats;
  modules: ModuleWithProgress[];
}
