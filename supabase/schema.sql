-- ====================================================================
-- Abhinav Institute of Technology & Management (AITM)
-- Supabase PostgreSQL Schema & Row Level Security (RLS) Policies
-- Migration: 20261023000000_init_aitm_schema.sql
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'student');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE account_status AS ENUM ('active', 'inactive', 'pending');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE course_status AS ENUM ('published', 'draft', 'archived');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE resource_type AS ENUM ('pdf', 'youtube_video', 'youtube_playlist', 'lecture_recording', 'document', 'external_link');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE application_status AS ENUM ('pending', 'reviewing', 'accepted', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  student_id TEXT UNIQUE,
  mobile_number TEXT,
  avatar_url TEXT,
  status account_status NOT NULL DEFAULT 'active',
  batch TEXT,
  joining_date DATE DEFAULT CURRENT_DATE,
  must_change_password BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_student_id ON public.profiles(student_id);

-- 4. COURSES TABLE
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  thumbnail_url TEXT,
  duration TEXT NOT NULL,
  course_type TEXT NOT NULL,
  batch TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  instructor_name TEXT NOT NULL,
  instructor_role TEXT,
  fee_info TEXT,
  status course_status NOT NULL DEFAULT 'published',
  syllabus JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_category ON public.courses(category);

-- 5. COURSE MODULES TABLE
CREATE TABLE IF NOT EXISTS public.course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  duration_hours NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_course_modules_course ON public.course_modules(course_id);

-- 6. COURSE ENROLLMENTS TABLE (CRITICAL ACCESS CONTROL TABLE)
CREATE TABLE IF NOT EXISTS public.course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active',
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_student_course_enrollment UNIQUE (student_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_student ON public.course_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON public.course_enrollments(course_id);

-- 7. LEARNING RESOURCES TABLE (PROTECTED ASSETS: PDF, VIDEOS, ETC.)
CREATE TABLE IF NOT EXISTS public.learning_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  resource_type resource_type NOT NULL,
  url_or_path TEXT NOT NULL,
  file_name TEXT,
  file_size_bytes BIGINT,
  duration_minutes INTEGER,
  is_private BOOLEAN NOT NULL DEFAULT TRUE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_resources_course ON public.learning_resources(course_id);

-- 8. ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  max_marks INTEGER NOT NULL DEFAULT 100,
  attachment_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_assignments_course ON public.assignments(course_id);

-- 9. STUDENT SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.student_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  submission_text TEXT,
  attachment_url TEXT,
  marks_obtained INTEGER,
  feedback TEXT,
  status TEXT NOT NULL DEFAULT 'submitted',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON public.student_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON public.student_submissions(student_id);

-- 10. APPLICATIONS TABLE (PUBLIC PROSPECTS & ADMISSIONS)
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  education_qualification TEXT NOT NULL,
  interested_course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  program_type TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  notes TEXT,
  status application_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);

-- 11. MEETINGS TABLE
CREATE TABLE IF NOT EXISTS public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  meeting_url TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'Google Meet',
  target_batch TEXT,
  host_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_meetings_course ON public.meetings(course_id);
CREATE INDEX IF NOT EXISTS idx_meetings_schedule ON public.meetings(scheduled_at);

-- 12. ANNOUNCEMENTS TABLE & TARGETS
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  target_role TEXT NOT NULL DEFAULT 'all',
  target_batch TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 13. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link_url TEXT,
  type TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);

-- 14. ACTIVITY LOGS TABLE
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 15. INSTITUTE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.institute_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institute_settings ENABLE ROW LEVEL SECURITY;

-- Helper security functions
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Profiles policies
CREATE POLICY "Admins have full access to all profiles"
  ON public.profiles FOR ALL
  USING (public.is_admin());

CREATE POLICY "Students can read their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Students can update their own permitted fields"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    role = (SELECT role FROM public.profiles WHERE id = auth.uid()) -- Cannot elevate role
  );

-- Courses policies
CREATE POLICY "Anyone can view published courses"
  ON public.courses FOR SELECT
  USING (status = 'published');

CREATE POLICY "Admins have full access to courses"
  ON public.courses FOR ALL
  USING (public.is_admin());

-- Course modules policies
CREATE POLICY "Public or enrolled can view modules of published courses"
  ON public.course_modules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE id = course_modules.course_id AND status = 'published'
    )
  );

CREATE POLICY "Admins have full access to modules"
  ON public.course_modules FOR ALL
  USING (public.is_admin());

-- Course enrollments policies
CREATE POLICY "Admins have full access to enrollments"
  ON public.course_enrollments FOR ALL
  USING (public.is_admin());

CREATE POLICY "Students can view only their own active enrollments"
  ON public.course_enrollments FOR SELECT
  USING (auth.uid() = student_id);

-- Learning resources policies (CRITICAL: STRICT ISOLATION)
CREATE POLICY "Admins can manage all resources"
  ON public.learning_resources FOR ALL
  USING (public.is_admin());

CREATE POLICY "Students can only access resources of their enrolled courses"
  ON public.learning_resources FOR SELECT
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.course_enrollments ce
      WHERE ce.course_id = learning_resources.course_id
        AND ce.student_id = auth.uid()
        AND ce.status = 'active'
    )
  );

-- Assignments policies
CREATE POLICY "Admins can manage assignments"
  ON public.assignments FOR ALL
  USING (public.is_admin());

CREATE POLICY "Students can view assignments for their enrolled courses"
  ON public.assignments FOR SELECT
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.course_enrollments ce
      WHERE ce.course_id = assignments.course_id
        AND ce.student_id = auth.uid()
        AND ce.status = 'active'
    )
  );

-- Student submissions policies
CREATE POLICY "Admins can view and grade all submissions"
  ON public.student_submissions FOR ALL
  USING (public.is_admin());

CREATE POLICY "Students can view and manage their own submissions"
  ON public.student_submissions FOR ALL
  USING (student_id = auth.uid());

-- Applications policies
CREATE POLICY "Public can submit applications"
  ON public.applications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins have full access to applications"
  ON public.applications FOR ALL
  USING (public.is_admin());

-- Meetings policies (CRITICAL: STUDENTS ONLY SEE PERMITTED MEETINGS)
CREATE POLICY "Admins can manage all meetings"
  ON public.meetings FOR ALL
  USING (public.is_admin());

CREATE POLICY "Students see general meetings and meetings for their enrolled courses"
  ON public.meetings FOR SELECT
  USING (
    public.is_admin() OR
    course_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.course_enrollments ce
      WHERE ce.course_id = meetings.course_id
        AND ce.student_id = auth.uid()
        AND ce.status = 'active'
    )
  );

-- Announcements policies
CREATE POLICY "Admins can manage all announcements"
  ON public.announcements FOR ALL
  USING (public.is_admin());

CREATE POLICY "Students see public or course-targeted announcements"
  ON public.announcements FOR SELECT
  USING (
    is_published = true AND (
      public.is_admin() OR
      course_id IS NULL OR
      EXISTS (
        SELECT 1 FROM public.course_enrollments ce
        WHERE ce.course_id = announcements.course_id
          AND ce.student_id = auth.uid()
          AND ce.status = 'active'
      )
    )
  );

-- Notifications policies
CREATE POLICY "Users can view and update their own notifications"
  ON public.notifications FOR ALL
  USING (user_id = auth.uid());

-- Activity logs policies
CREATE POLICY "Admins can view activity logs"
  ON public.activity_logs FOR SELECT
  USING (public.is_admin());

CREATE POLICY "System can record activity logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (true);

-- Institute settings policies
CREATE POLICY "Anyone can view settings"
  ON public.institute_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can modify settings"
  ON public.institute_settings FOR ALL
  USING (public.is_admin());

-- ====================================================================
-- STORAGE BUCKET DEFINITIONS & POLICIES
-- ====================================================================
-- Insert storage buckets into storage.buckets if not exist:
-- 1. 'aitm-resources': Private bucket for study materials, PDF notes, lecture slides
-- 2. 'aitm-public': Public bucket for course thumbnails and branding

INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('aitm-resources', 'aitm-resources', false),
  ('aitm-public', 'aitm-public', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for aitm-resources:
-- Only admins and authorized enrolled students can read PDFs
CREATE POLICY "Enrolled students and admins can view private resources"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'aitm-resources' AND (
    public.is_admin() OR
    (auth.role() = 'authenticated')
  )
);

CREATE POLICY "Admins can upload learning resources"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'aitm-resources' AND public.is_admin()
);
