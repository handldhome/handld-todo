// types/index.ts

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  settings: UserSettings;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  theme: 'wood' | 'minimal' | 'dark';
  soundEnabled: boolean;
}

export interface List {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  position: number;
  is_inbox: boolean;
  is_smart: boolean;
  created_at: string;
  updated_at: string;
  // Computed/joined
  task_count?: number;
}

export interface Task {
  id: string;
  list_id: string;
  user_id: string;
  title: string;
  notes: string | null;
  due_date: string | null;
  due_time: string | null;
  reminder_at: string | null;
  is_completed: boolean;
  is_starred: boolean;
  position: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  subtasks?: Subtask[];
  list?: List;
}

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

// API/Hook types
export interface CreateTaskInput {
  list_id: string;
  title: string;
  notes?: string;
  due_date?: string;
  is_starred?: boolean;
}

export interface UpdateTaskInput {
  id: string;
  title?: string;
  notes?: string;
  due_date?: string;
  due_time?: string;
  is_completed?: boolean;
  is_starred?: boolean;
  list_id?: string;
  position?: number;
}

export interface CreateListInput {
  name: string;
  icon?: string;
  color?: string;
}

export interface UpdateListInput {
  id: string;
  name?: string;
  icon?: string;
  color?: string;
  position?: number;
}

export interface CreateSubtaskInput {
  task_id: string;
  title: string;
}

export interface UpdateSubtaskInput {
  id: string;
  title?: string;
  is_completed?: boolean;
  position?: number;
}

// Smart list types
export type SmartListType = 'inbox' | 'all' | 'today' | 'starred' | 'completed';

export function isSmartListType(value: string): value is SmartListType {
  return ['inbox', 'all', 'today', 'starred', 'completed'].includes(value);
}

// Database types for Supabase
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [];
      };
      lists: {
        Row: List;
        Insert: Omit<List, 'id' | 'created_at' | 'updated_at' | 'task_count'>;
        Update: Partial<Omit<List, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'task_count'>>;
        Relationships: [];
      };
      tasks: {
        Row: Task;
        Insert: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'subtasks' | 'list'>;
        Update: Partial<Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'subtasks' | 'list'>>;
        Relationships: [];
      };
      subtasks: {
        Row: Subtask;
        Insert: Omit<Subtask, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Subtask, 'id' | 'task_id' | 'created_at' | 'updated_at'>>;
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
};
