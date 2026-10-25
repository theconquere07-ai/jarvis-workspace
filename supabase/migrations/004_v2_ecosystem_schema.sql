-- ==========================================
-- JARVIS ECOSYSTEM V2.0 SCHEMA EXTENSIONS
-- ==========================================

-- 1. Extend projects table with V2 fields
ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS short_desc text,
  ADD COLUMN IF NOT EXISTS detailed_desc text,
  ADD COLUMN IF NOT EXISTS development_stage text DEFAULT 'In Development',
  ADD COLUMN IF NOT EXISTS completion_date date,
  ADD COLUMN IF NOT EXISTS project_purposes text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS operating_models text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS revenue_class text DEFAULT 'Unknown',
  ADD COLUMN IF NOT EXISTS verified_revenue numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS verified_expenses numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS objectives text,
  ADD COLUMN IF NOT EXISTS problem_statement text,
  ADD COLUMN IF NOT EXISTS proposed_solution text,
  ADD COLUMN IF NOT EXISTS architecture_desc text,
  ADD COLUMN IF NOT EXISTS technologies text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS features_implemented text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS features_planned text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS known_bugs text,
  ADD COLUMN IF NOT EXISTS technical_debt text,
  ADD COLUMN IF NOT EXISTS security_considerations text,
  ADD COLUMN IF NOT EXISTS target_audience text,
  ADD COLUMN IF NOT EXISTS business_model text,
  ADD COLUMN IF NOT EXISTS verified_users text,
  ADD COLUMN IF NOT EXISTS impact_measurements text,
  ADD COLUMN IF NOT EXISTS challenges_learned text,
  ADD COLUMN IF NOT EXISTS future_roadmap text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS featured boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS publication_status text DEFAULT 'private' CHECK (publication_status IN ('private', 'draft', 'published', 'unpublished', 'archived')),
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS visible_sections jsonb DEFAULT '{"overview":true,"problem":true,"features":true,"tech":true,"roadmap":true}'::jsonb,
  ADD COLUMN IF NOT EXISTS source_origin text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS migration_status text DEFAULT 'verified';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'projects_slug_key'
  ) THEN
    ALTER TABLE public.projects ADD CONSTRAINT projects_slug_key UNIQUE (slug);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS projects_publication_status_idx ON public.projects(publication_status);

-- 2. Project Milestones
CREATE TABLE IF NOT EXISTS public.project_milestones (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked')),
  target_date date,
  completed_at timestamptz,
  sort_order int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS project_milestones_project_id_idx ON public.project_milestones(project_id);
CREATE INDEX IF NOT EXISTS project_milestones_user_id_idx ON public.project_milestones(user_id);

-- 3. Project Tasks
CREATE TABLE IF NOT EXISTS public.project_tasks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'blocked', 'done')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  due_date date,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS project_tasks_project_id_idx ON public.project_tasks(project_id);
CREATE INDEX IF NOT EXISTS project_tasks_user_id_idx ON public.project_tasks(user_id);

-- 4. Project Documents & Media Metadata
CREATE TABLE IF NOT EXISTS public.project_documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  doc_type text NOT NULL DEFAULT 'guide' CHECK (doc_type IN ('guide', 'architecture', 'api', 'installation', 'research', 'design', 'plan', 'media', 'other')),
  file_url text NOT NULL,
  file_name text,
  file_size bigint,
  content_type text,
  storage_path text,
  is_public boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS project_documents_project_id_idx ON public.project_documents(project_id);
CREATE INDEX IF NOT EXISTS project_documents_user_id_idx ON public.project_documents(user_id);

-- 5. Research & Publications
CREATE TABLE IF NOT EXISTS public.publications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  abstract text,
  authors text[] DEFAULT '{"Abhishek"}',
  publication_date date,
  publication_type text NOT NULL DEFAULT 'article' CHECK (publication_type IN ('paper', 'article', 'whitepaper', 'report', 'experiment', 'review', 'notes')),
  external_url text,
  file_url text,
  doi text,
  keywords text[] DEFAULT '{}',
  version text DEFAULT '1.0',
  publication_status text NOT NULL DEFAULT 'draft' CHECK (publication_status IN ('draft', 'published', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS publications_project_id_idx ON public.publications(project_id);
CREATE INDEX IF NOT EXISTS publications_user_id_idx ON public.publications(user_id);

-- 6. Activity Timeline Logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  activity_type text NOT NULL CHECK (activity_type IN ('project_created', 'project_updated', 'task_completed', 'milestone_achieved', 'document_added', 'project_published', 'project_archived', 'work_session_recorded')),
  title text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS activity_logs_user_id_idx ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS activity_logs_created_at_idx ON public.activity_logs(created_at);

-- 7. Showcase Settings
CREATE TABLE IF NOT EXISTS public.showcase_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  site_title text DEFAULT 'Abhishek Gangadhar — Technology & Systems Showcase',
  headline text DEFAULT 'Creative Technologist, AI Systems Architect, and Media Producer',
  bio text,
  about_markdown text,
  hero_cta_text text DEFAULT 'Explore Projects',
  contact_email text,
  github_url text DEFAULT 'https://github.com/theconquere07-ai',
  linkedin_url text,
  youtube_url text DEFAULT 'https://www.youtube.com/@AbhishekOnProffesion',
  instagram_url text DEFAULT 'https://www.instagram.com/abhishek_onproffesion/',
  custom_domain text,
  featured_project_ids uuid[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 8. A.V.I.S. Conversations & Messages
CREATE TABLE IF NOT EXISTS public.avis_conversations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'New Conversation',
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS avis_conversations_user_id_idx ON public.avis_conversations(user_id);

CREATE TABLE IF NOT EXISTS public.avis_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id uuid NOT NULL REFERENCES public.avis_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  context_metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS avis_messages_conversation_id_idx ON public.avis_messages(conversation_id);

-- Enable RLS on all tables
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.showcase_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avis_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avis_messages ENABLE ROW LEVEL SECURITY;

-- Owner Policies (Full CRUD for authenticated user on own records)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own milestones' AND tablename = 'project_milestones') THEN
    CREATE POLICY "Users can manage own milestones" ON public.project_milestones FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own tasks' AND tablename = 'project_tasks') THEN
    CREATE POLICY "Users can manage own tasks" ON public.project_tasks FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own documents' AND tablename = 'project_documents') THEN
    CREATE POLICY "Users can manage own documents" ON public.project_documents FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own publications' AND tablename = 'publications') THEN
    CREATE POLICY "Users can manage own publications" ON public.publications FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own activity_logs' AND tablename = 'activity_logs') THEN
    CREATE POLICY "Users can manage own activity_logs" ON public.activity_logs FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own showcase_settings' AND tablename = 'showcase_settings') THEN
    CREATE POLICY "Users can manage own showcase_settings" ON public.showcase_settings FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own avis_conversations' AND tablename = 'avis_conversations') THEN
    CREATE POLICY "Users can manage own avis_conversations" ON public.avis_conversations FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own avis_messages' AND tablename = 'avis_messages') THEN
    CREATE POLICY "Users can manage own avis_messages" ON public.avis_messages FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- Public Showcase Policies (Anonymous or authenticated visitors can read published assets only)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read for published projects' AND tablename = 'projects') THEN
    CREATE POLICY "Public read for published projects" ON public.projects FOR SELECT USING (publication_status = 'published');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read for public project documents' AND tablename = 'project_documents') THEN
    CREATE POLICY "Public read for public project documents" ON public.project_documents FOR SELECT USING (is_public = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read for published publications' AND tablename = 'publications') THEN
    CREATE POLICY "Public read for published publications" ON public.publications FOR SELECT USING (publication_status = 'published');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read for showcase settings' AND tablename = 'showcase_settings') THEN
    CREATE POLICY "Public read for showcase settings" ON public.showcase_settings FOR SELECT USING (true);
  END IF;
END $$;
