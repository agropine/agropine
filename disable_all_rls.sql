-- ============================================
-- DISABLE ALL RLS POLICIES
-- Make everything public and unrestricted
-- ============================================

-- ============================================
-- 1. DISABLE RLS ON ALL PUBLIC TABLES
-- ============================================

ALTER TABLE IF EXISTS public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. DROP ALL EXISTING POLICIES ON PUBLIC TABLES
-- ============================================

-- Drop all policies on user_profiles
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_profiles') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.user_profiles';
    END LOOP;
END $$;

-- Drop all policies on products
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'products') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.products';
    END LOOP;
END $$;

-- ============================================
-- 3. DISABLE RLS ON STORAGE TABLES
-- ============================================

-- IMPORTANT: Storage RLS must be disabled via Supabase Dashboard
-- These SQL commands require superuser access and will fail in SQL Editor
-- 
-- To disable storage RLS:
-- 1. Go to Supabase Dashboard → Storage
-- 2. Click on "avatars" bucket → Policies tab → Delete all policies
-- 3. Click on "products" bucket → Policies tab → Delete all policies
-- 4. Make sure both buckets are set to "Public"
--
-- Alternatively, you can leave storage buckets without any policies
-- and they will allow unrestricted access

-- ============================================
-- 4. DROP ALL STORAGE POLICIES (SKIP - Use Dashboard)
-- ============================================

-- Skip - Use Dashboard to manage storage policies

-- ============================================
-- 5. GRANT FULL PERMISSIONS TO ANON AND AUTHENTICATED
-- ============================================

-- Grant all privileges on public tables
GRANT ALL ON public.user_profiles TO anon, authenticated, public;
GRANT ALL ON public.products TO anon, authenticated, public;

-- ============================================
-- 6. VERIFY RLS IS DISABLED
-- ============================================

-- Run this query to check RLS status (should show 'f' for false)
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname IN ('public', 'storage')
ORDER BY schemaname, tablename;

-- Check for any remaining policies (should return empty)
SELECT 
    schemaname,
    tablename,
    policyname
FROM pg_policies
WHERE schemaname IN ('public', 'storage')
ORDER BY schemaname, tablename;

-- ============================================
-- DONE!
-- ============================================
-- All tables and storage are now completely unrestricted
-- No RLS policies active
-- ============================================
