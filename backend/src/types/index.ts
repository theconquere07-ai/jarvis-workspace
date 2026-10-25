export type ProjectStatus = 'planned' | 'active' | 'in_development' | 'paused' | 'completed' | 'archived';
export type ProjectPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done';
export type DevelopmentStage = 'concept' | 'prototype' | 'alpha_beta' | 'production' | 'maintenance' | 'deprecated';
export type ProjectPurpose = 'personal_growth' | 'client_work' | 'commercial_saas' | 'open_source' | 'research' | 'content_creation';
export type OperatingModel = 'self_funded' | 'bootstrapped' | 'client_sponsored' | 'open_contribution';
export type RevenueClass = 'free' | 'ad_supported' | 'subscription' | 'service' | 'internal';
export type PublicationStatus = 'draft' | 'published' | 'private';

export interface Project {
  id: string;
  user_id: string;
  name: string;
  slug?: string;
  short_desc?: string | null;
  detailed_desc?: string | null;
  description: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  category: string | null;
  tags: string[];
  development_stage?: DevelopmentStage | null;
  start_date: string | null;
  target_date: string | null;
  completion_date?: string | null;
  project_purposes?: ProjectPurpose[];
  operating_models?: OperatingModel[];
  revenue_class?: RevenueClass;
  verified_revenue?: number;
  verified_expenses?: number;
  objectives?: string | null;
  problem_statement?: string | null;
  proposed_solution?: string | null;
  architecture_desc?: string | null;
  technologies?: string[];
  repo_url: string | null;
  live_url: string | null;
  docs_url: string | null;
  frontend_host: string | null;
  backend_host: string | null;
  database_info: string | null;
  features_implemented?: string[];
  features_planned?: string[];
  known_bugs?: string[];
  technical_debt?: string[];
  security_considerations?: string[];
  target_audience?: string | null;
  business_model?: string | null;
  verified_users?: number;
  impact_measurements?: Record<string, any>;
  challenges_learned?: string | null;
  future_roadmap?: string | null;
  featured?: boolean;
  publication_status?: PublicationStatus;
  published_at?: string | null;
  cover_image_url?: string | null;
  visible_sections?: Record<string, boolean>;
  source_origin?: string | null;
  migration_status?: string | null;
  notes: string | null;
  custom_fields: Array<{ k: string; v: string }>;
  created_at: string;
  updated_at: string;
}

export interface ProjectMilestone {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  completed_at: string | null;
  status: 'planned' | 'in_progress' | 'completed' | 'missed';
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectTask {
  id: string;
  project_id: string;
  milestone_id: string | null;
  user_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: ProjectPriority;
  due_date: string | null;
  completed_at: string | null;
  time_spent_ms: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectDocument {
  id: string;
  project_id: string | null;
  user_id: string;
  title: string;
  doc_type: 'diagram' | 'spec' | 'guide' | 'asset' | 'license' | 'other';
  file_url: string;
  file_size: number | null;
  mime_type: string | null;
  is_public: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Publication {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  abstract: string | null;
  content: string;
  authors: string[];
  publication_type: 'article' | 'whitepaper' | 'research_note' | 'case_study' | 'tutorial';
  publication_status: PublicationStatus;
  published_at: string | null;
  tags: string[];
  project_id: string | null;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  title: string;
  details: Record<string, any>;
  created_at: string;
}

export interface ShowcaseSettings {
  id: string;
  user_id: string;
  title: string;
  tagline: string | null;
  bio: string | null;
  avatar_url: string | null;
  contact_email: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  youtube_url: string | null;
  instagram_url: string | null;
  website_url: string | null;
  resume_url: string | null;
  featured_order: string[];
  theme_config: Record<string, any>;
  is_public: boolean;
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

export interface AvisConversation {
  id: string;
  user_id: string;
  title: string;
  context_project_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AvisMessage {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  structured_data: Record<string, any> | null;
  suggested_actions: any[] | null;
  tokens_used: number | null;
  created_at: string;
}
