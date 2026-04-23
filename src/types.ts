export interface Task {
  id: string;
  title: string;
  completed: boolean;
  category: 'homework' | 'study' | 'other';
  dueDate?: string;
  subject?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface StudySession {
  id: string;
  subject: string;
  durationMinutes: number;
  timestamp: string;
}

export interface Homework {
  id: string;
  subject: string;
  assignment: string;
  dueDate: string;
  status: 'pending' | 'in-progress' | 'completed';
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  category: 'exam' | 'meeting' | 'social' | 'deadline' | 'other';
}
