-- ============================================
-- DISABLE RLS ON STORAGE OBJECTS TABLE
-- Run this with your SERVICE ROLE key via API
-- ============================================

-- This SQL won't work in the SQL Editor because you need superuser access
-- Instead, you need to use the Supabase Management API or run via service role

-- Option 1: Use psql with service role connection
-- Option 2: Contact Supabase support to disable RLS on storage.objects
-- Option 3: Use this workaround below

-- ============================================
-- WORKAROUND: Create Permissive Policies
-- ============================================

-- Enable RLS (required to add policies)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies first
DROP POLICY IF EXISTS "Allow all operations for avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow all operations for products" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete" ON storage.objects;

-- Create super permissive policies that allow everything
CREATE POLICY "Public read access for all storage"
ON storage.objects FOR SELECT
TO public
USING (true);

CREATE POLICY "Public insert access for all storage"
ON storage.objects FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Public update access for all storage"
ON storage.objects FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Public delete access for all storage"
ON storage.objects FOR DELETE
TO public
USING (true);

-- Grant all permissions
GRANT ALL ON storage.objects TO anon, authenticated, public;
GRANT ALL ON storage.buckets TO anon, authenticated, public;

-- Verify policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'storage'
ORDER BY tablename, policyname;
