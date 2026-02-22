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

-- ================================================
-- 9. Destinations Table
-- ================================================
CREATE TABLE IF NOT EXISTS destinations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    elevation TEXT,
    best_time TEXT,
    distance TEXT,
    icon TEXT DEFAULT 'fas fa-mountain',
    link_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read active destinations" ON destinations
    FOR SELECT USING (is_active = true);
CREATE POLICY "Admin full access to destinations" ON destinations
    FOR ALL USING (true) WITH CHECK (true);

-- ================================================
-- 10. Services Table
-- ================================================
CREATE TABLE IF NOT EXISTS services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT DEFAULT 'fas fa-concierge-bell',
    image_url TEXT,
    features TEXT[] DEFAULT '{}',
    cta_text TEXT DEFAULT 'Enquire Now',
    cta_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read active services" ON services
    FOR SELECT USING (is_active = true);
CREATE POLICY "Admin full access to services" ON services
    FOR ALL USING (true) WITH CHECK (true);

-- ================================================
-- 11. Site Settings (About Us, Contact Info)
-- ================================================
CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read site settings" ON site_settings
    FOR SELECT USING (true);
CREATE POLICY "Admin full access to site settings" ON site_settings
    FOR ALL USING (true) WITH CHECK (true);

-- Default site settings
INSERT INTO site_settings (key, value) VALUES
    ('about_title', 'About Wander Peaks'),
    ('about_description', 'Wander Peaks is a premium Himalayan trekking and pan-India holiday tour operator based in Haridwar. We specialize in sacred pilgrimage tours and adventure experiences across Uttarakhand.'),
    ('about_mission', 'To provide safe, comfortable, and spiritually enriching pilgrimage experiences that create lasting memories.'),
    ('about_vision', 'To be the most trusted and preferred travel partner for Himalayan pilgrimages and adventures.'),
    ('about_experience_years', '10+'),
    ('about_customers_served', '15,000+'),
    ('about_tours_completed', '2,000+'),
    ('about_team_members', '50+'),
    ('contact_address', 'Niranjani Akhara Road, Haridwar 249401, Uttarakhand, India'),
    ('contact_phone', '+91 7451 043 112'),
    ('contact_email', 'chardhamyatra004@gmail.com'),
    ('contact_whatsapp', '917451043112'),
    ('social_facebook', 'https://www.facebook.com/profile.php?id=100418429743492'),
    ('social_instagram', 'https://www.instagram.com/utt.arakhandchardhamyatra'),
    ('contact_map_embed', '')
ON CONFLICT (key) DO NOTHING;

-- ================================================
-- 12. Yatras Table
-- ================================================
CREATE TABLE IF NOT EXISTS yatras (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT,
    description TEXT NOT NULL,
    image_url TEXT,
    link_url TEXT,
    duration TEXT,
    price TEXT,
    badge TEXT,
    icon TEXT DEFAULT 'fas fa-om',
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE yatras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read active yatras" ON yatras
    FOR SELECT USING (is_active = true);
CREATE POLICY "Admin full access to yatras" ON yatras
    FOR ALL USING (true) WITH CHECK (true);
