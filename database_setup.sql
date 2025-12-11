-- ============================================
-- PineHub Database Setup Script
-- Supabase Project: uuflnhsbctfwappzenyy
-- ============================================
-- This script sets up all required tables, storage buckets, and triggers
-- RLS policies are DISABLED for all tables as per requirements
-- ============================================

-- ============================================
-- 1. CREATE TABLES
-- ============================================

-- Table: user_profiles
-- Stores user/vendor profile information
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    phone TEXT,
    address TEXT,
    description TEXT,
    harvest_month TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    avatar_url TEXT,
    social_media JSONB DEFAULT '{
        "whatsapp": "",
        "instagram": "",
        "tiktok": "",
        "facebook": ""
    }'::jsonb,
    business_registration_number TEXT,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: products
-- Stores product listings from vendors
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    price_unit TEXT DEFAULT 'per kg',
    quantity_available NUMERIC(10, 2) DEFAULT 0,
    quantity_unit TEXT DEFAULT 'kg',
    image_url TEXT,
    in_stock BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Indexes on user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_verified ON public.user_profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON public.user_profiles(created_at);

-- Indexes on products
CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON public.products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON public.products(in_stock);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);

-- ============================================
-- 3. DISABLE RLS (Row Level Security)
-- ============================================
-- RLS is disabled as per requirements - tables are unsecured

ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies (if any)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable delete for users based on id" ON public.user_profiles;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.products;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.products;
DROP POLICY IF EXISTS "Enable update for owners" ON public.products;
DROP POLICY IF EXISTS "Enable delete for owners" ON public.products;

-- ============================================
-- 4. CREATE TRIGGERS
-- ============================================

-- Function: Auto-create user profile when new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (
        id,
        email,
        full_name,
        phone,
        address,
        description,
        harvest_month,
        social_media,
        avatar_url,
        business_registration_number,
        is_verified
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        '',
        '',
        '',
        '',
        '{"whatsapp": "", "instagram": "", "tiktok": "", "facebook": ""}'::jsonb,
        '',
        '',
        false
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update user_profiles updated_at
DROP TRIGGER IF EXISTS set_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER set_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Trigger: Update products updated_at
DROP TRIGGER IF EXISTS set_products_updated_at ON public.products;
CREATE TRIGGER set_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 5. STORAGE BUCKETS SETUP
-- ============================================
-- IMPORTANT: Storage buckets MUST be created via Supabase Dashboard
-- Go to: Storage → Create bucket
-- 
-- Create two buckets with these settings:
-- 
-- 1. Bucket name: avatars
--    - Public bucket: YES
--    - File size limit: 5 MB
--    - Allowed MIME types: image/jpeg, image/png, image/jpg, image/webp, image/gif
--    - RLS policies: DISABLED (leave it with no policies for public access)
--
-- 2. Bucket name: products
--    - Public bucket: YES
--    - File size limit: 10 MB
--    - Allowed MIME types: image/jpeg, image/png, image/jpg, image/webp, image/gif
--    - RLS policies: DISABLED (leave it with no policies for public access)
--
-- After creating buckets in the Dashboard, they will be publicly accessible
-- without any additional SQL commands needed.

-- ============================================
-- 6. GRANT PERMISSIONS
-- ============================================

-- Grant access to tables for anon and authenticated roles
GRANT ALL ON public.user_profiles TO anon, authenticated;
GRANT ALL ON public.products TO anon, authenticated;

-- ============================================
-- 7. SAMPLE DATA (OPTIONAL)
-- ============================================
-- Uncomment the following section to insert sample data for testing

/*
-- Sample vendor profile
INSERT INTO public.user_profiles (
    id,
    email,
    full_name,
    phone,
    address,
    description,
    harvest_month,
    latitude,
    longitude,
    social_media,
    is_verified
)
VALUES (
    gen_random_uuid(),
    'sample.vendor@example.com',
    'Sample Vendor',
    '+1 (555) 123-4567',
    '123 Farm Road, Pineapple Town, State 12345',
    'Premium pineapple vendor with fresh, organic produce',
    'June-August',
    14.0583,
    108.2772,
    '{"whatsapp": "+1555123456", "instagram": "@sample_vendor", "tiktok": "@samplepineapple", "facebook": "Sample Vendor"}'::jsonb,
    true
)
ON CONFLICT (email) DO NOTHING;

-- You can add sample products after creating a user profile
*/

-- ============================================
-- 8. VERIFICATION QUERIES
-- ============================================
-- Run these queries to verify your setup

-- Check if tables exist
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check if indexes exist
-- SELECT indexname FROM pg_indexes WHERE schemaname = 'public';

-- Check if triggers exist
-- SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_schema = 'public';

-- Check storage buckets (run after creating buckets in Dashboard)
-- SELECT * FROM storage.buckets;

-- Check RLS status (should show 'f' for false)
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- Next steps:
-- 1. ✅ Run this SQL script in the Supabase SQL Editor
-- 2. ⚠️ IMPORTANT: Create storage buckets manually in Supabase Dashboard:
--    - Go to Storage section
--    - Click "New bucket"
--    - Create "avatars" bucket (public, 5MB limit, no RLS policies)
--    - Create "products" bucket (public, 10MB limit, no RLS policies)
-- 3. ✅ Your supabase.js is already updated with new credentials
-- 4. Test user registration and profile creation
-- ============================================
