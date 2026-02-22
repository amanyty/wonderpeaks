-- ================================================
-- WonderPeaks Admin Panel - Supabase Schema
-- Run this SQL in Supabase SQL Editor
-- ================================================

-- 1. Contact Enquiries Table
CREATE TABLE IF NOT EXISTS enquiries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    package TEXT,
    travelers INTEGER,
    travel_date TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Testimonials Table
CREATE TABLE IF NOT EXISTS testimonials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_name TEXT NOT NULL,
    location TEXT NOT NULL,
    rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    review TEXT NOT NULL,
    photo_url TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Packages Table
CREATE TABLE IF NOT EXISTS packages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    tagline TEXT,
    description TEXT NOT NULL,
    duration TEXT NOT NULL,
    route TEXT NOT NULL,
    min_persons INTEGER DEFAULT 2,
    badge TEXT,
    image_url TEXT,
    highlights TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

-- 5. Public read access for testimonials and packages (shown on website)
CREATE POLICY "Public can read testimonials" ON testimonials
    FOR SELECT USING (true);

CREATE POLICY "Public can read active packages" ON packages
    FOR SELECT USING (is_active = true);

-- 6. Public insert for enquiries (contact form submissions)
CREATE POLICY "Public can submit enquiries" ON enquiries
    FOR INSERT WITH CHECK (true);

-- 7. Admin full access (using anon key with service_role for admin operations)
-- For the admin panel, we allow all operations via anon key
CREATE POLICY "Admin full access to enquiries" ON enquiries
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access to testimonials" ON testimonials
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access to packages" ON packages
    FOR ALL USING (true) WITH CHECK (true);

-- ================================================
-- 8. Supabase Storage - Photos Bucket
-- Run this to create a public bucket for photo uploads
-- ================================================

-- Create storage bucket (run in SQL Editor)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to photos
CREATE POLICY "Public can view photos" ON storage.objects
    FOR SELECT USING (bucket_id = 'photos');

-- Allow uploads via anon key (admin panel)
CREATE POLICY "Anyone can upload photos" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'photos');

-- Allow updates via anon key
CREATE POLICY "Anyone can update photos" ON storage.objects
    FOR UPDATE USING (bucket_id = 'photos');

-- Allow deletes via anon key
CREATE POLICY "Anyone can delete photos" ON storage.objects
    FOR DELETE USING (bucket_id = 'photos');
