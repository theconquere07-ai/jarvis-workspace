export type ProjectStatus = 'planned' | 'active' | 'in_development' | 'paused' | 'completed' | 'archived';
export type ProjectPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  category: string | null;
  tags: string[];
  start_date: string | null;
  target_date: string | null;
  notes: string | null;
  repo_url: string | null;
  live_url: string | null;
  docs_url: string | null;
  frontend_host: string | null;
  backend_host: string | null;
  database_info: string | null;
  custom_fields: Array<{ k: string; v: string }>;
  created_at: string;
  updated_at: string;
}

export interface NoteCard {
  id: string;
  user_id: string;
  type: 'note' | 'img' | 'doc';
  content: string | null;
  x: number;
  y: number;
  w: number;
  h: number | null;
  z_index: number;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  created_at: string;
  updated_at: string;
}

export interface AnalyzerSection {
  id: string;
  topic_id: string;
  section_key: string;
  content: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface AnalyzerTopic {
  id: string;
  user_id: string;
  title: string;
  analyzer_sections: AnalyzerSection[];
  created_at: string;
  updated_at: string;
}

export interface WorkSession {
  id: string;
  user_id: string;
  task_name: string;
  project_id: string | null;
  started_at: string;
  ended_at: string | null;
  duration_ms: number | null;
  created_at: string;
}
