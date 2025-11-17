-- Alternative script to create storage buckets manually
-- Run this in Supabase SQL editor if buckets don't exist

-- Create attachments bucket if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM storage.buckets 
        WHERE id = 'attachments'
    ) THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'attachments',
            'attachments', 
            true,
            52428800, -- 50MB in bytes
            ARRAY['application/pdf', 'text/pdf']
        );
    END IF;
END $$;

-- Create audio bucket if it doesn't exist  
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM storage.buckets 
        WHERE id = 'audio'
    ) THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'audio',
            'audio',
            true, 
            52428800, -- 50MB in bytes
            ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac']
        );
    END IF;
END $$;

-- Verify buckets were created
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id IN ('attachments', 'audio');