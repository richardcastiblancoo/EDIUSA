-- Fix Storage Permissions for Lessons Upload
-- This script configures the necessary permissions for file uploads to work properly

-- Grant permissions on storage buckets
GRANT ALL ON storage.buckets TO anon, authenticated;
GRANT ALL ON storage.objects TO anon, authenticated;

-- Create storage policies for attachments bucket
CREATE POLICY "Allow public read on attachments bucket" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'attachments');

CREATE POLICY "Allow authenticated users to upload attachments" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update attachments" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete attachments" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'attachments' AND auth.role() = 'authenticated');

-- Create storage policies for audio bucket
CREATE POLICY "Allow public read on audio bucket" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'audio');

CREATE POLICY "Allow authenticated users to upload audio" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'audio' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update audio" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'audio' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete audio" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'audio' AND auth.role() = 'authenticated');

-- Grant permissions on lessons table
GRANT ALL ON lessons TO anon, authenticated;

-- Create RLS policies for lessons table
CREATE POLICY "Allow authenticated users to read lessons" 
ON lessons FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow teachers to create lessons" 
ON lessons FOR INSERT 
WITH CHECK (
  auth.role() = 'authenticated' AND 
  EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.id = course_id 
    AND courses.teacher_id = auth.uid()
  )
);

CREATE POLICY "Allow teachers to update their lessons" 
ON lessons FOR UPDATE 
USING (
  auth.role() = 'authenticated' AND 
  EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.id = course_id 
    AND courses.teacher_id = auth.uid()
  )
);

CREATE POLICY "Allow teachers to delete their lessons" 
ON lessons FOR DELETE 
USING (
  auth.role() = 'authenticated' AND 
  EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.id = course_id 
    AND courses.teacher_id = auth.uid()
  )
);

-- Grant permissions on courses table for teacher validation
GRANT SELECT ON courses TO authenticated;