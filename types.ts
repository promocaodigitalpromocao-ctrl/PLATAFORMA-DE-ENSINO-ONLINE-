
export interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  videoUrl: string;
  thumbnail: string;
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
  isVisible?: boolean;
}

// --- ESTRUTURA DA LIVE ---
export interface LiveEvent {
  id: string;
  title: string;
  meetUrl: string;
  date: string; // ISO String
  active: boolean; // Se está acontecendo agora ou agendada
}

// --- ESTRUTURA DA PROVA FINAL ---
export interface Question {
  id: string;
  text: string;
  options: string[]; // 4 opções
  correctAnswer: number; // 0-3
}

export interface QuestionBank {
  questions: Question[];
}

export interface ExamResult {
  score: number;
  total: number;
  passed: boolean;
  date: string;
}

// --- ESTRUTURA DA AVALIAÇÃO DO CURSO ---
export interface CourseRating {
  id: string;
  userId: string;
  userName: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: string;
}

export enum AppState {
  WATCHING,
  FINAL_EXAM, // Novo estado
  COURSE_RESULT,
  LIVE_WATCH
}

export type UserRole = 'student' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  avatar?: string;
  sector?: string;
  jobTitle?: string;
}

export interface Comment {
  id: string;
  lessonId: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
  isRead?: boolean; // Novo campo para controlar visibilidade no painel admin
}

export interface LessonSidebarProps {
  modules: Module[];
  currentLessonId: string;
  completedLessons: Set<string>;
  onSelectLesson: (lesson: Lesson) => void;
  isSidebarOpen: boolean;
  isDesktopOpen?: boolean;
  onToggleDesktop?: () => void;
  isAdmin?: boolean;
  onDeleteLesson?: (moduleId: string, lessonId: string) => void;
  onEditLesson?: (moduleId: string, lesson: Lesson) => void;
  liveEvent?: LiveEvent | null; 
  onSelectLive?: () => void; // Novo callback
}
