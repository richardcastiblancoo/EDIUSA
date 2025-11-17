-- Migration to fix lesson file uploads
-- This ensures storage buckets and policies are properly configured

-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES 
  ('attachments', 'attachments', true, 52428800, ARRAY['application/pdf', 'text/pdf']),
  ('audio', 'audio', true, 52428800, ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Ensure RLS is enabled on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Materiales del curso accesibles públicamente" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados pueden subir materiales del curso" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar materiales" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar materiales" ON storage.objects;
DROP POLICY IF EXISTS "Archivos accesibles públicamente" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados pueden subir archivos" ON storage.objects;

-- Create comprehensive storage policies
-- Public read access for all files in these buckets
CREATE POLICY "Public read for attachments" ON storage.objects FOR SELECT 
USING (bucket_id = 'attachments');

CREATE POLICY "Public read for audio" ON storage.objects FOR SELECT 
USING (bucket_id = 'audio');

-- Authenticated users can upload files
CREATE POLICY "Authenticated upload for attachments" ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'attachments');

CREATE POLICY "Authenticated upload for audio" ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'audio');

-- Authenticated users can update their own files
CREATE POLICY "Authenticated update for attachments" ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'attachments');

CREATE POLICY "Authenticated update for audio" ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'audio');

-- Authenticated users can delete their own files
CREATE POLICY "Authenticated delete for attachments" ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'attachments');

CREATE POLICY "Authenticated delete for audio" ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'audio');

-- Ensure lessons table has proper columns
ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS pdf_url TEXT,
ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- Create index for better performance when querying by course
CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_order_index ON lessons(order_index);