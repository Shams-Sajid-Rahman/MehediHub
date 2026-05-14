-- MehediHub Seed Data
-- Note: Admin password hash is inserted by setup-db.js script
-- Sample data for development

USE mehedihub;

-- Sample Artist 1 (active, verified)
INSERT IGNORE INTO users (id, full_name, email, phone, password_hash, role, status) VALUES
(2, 'Fatema Begum', 'fatema@mehedihub.com', '01711234567', '$2b$10$placeholder_will_be_replaced', 'artist', 'active'),
(3, 'Nasrin Akter', 'nasrin@mehedihub.com', '01811234568', '$2b$10$placeholder_will_be_replaced', 'artist', 'active'),
(4, 'Rahela Customer', 'rahela@mehedihub.com', '01911234569', '$2b$10$placeholder_will_be_replaced', 'customer', 'active');

-- NID Verifications for sample artists
INSERT IGNORE INTO nid_verifications (user_id, nid_number, name_on_nid, date_of_birth, father_name, mother_name, address, status) VALUES
(2, '1234567890', 'Fatema Begum', '1990-05-15', 'Abdul Karim', 'Roksana Begum', 'Dhaka, Mirpur-10', 'approved'),
(3, '9876543210', 'Nasrin Akter', '1988-08-22', 'Mohammad Ali', 'Hasina Begum', 'Chittagong, Panchlaish', 'approved'),
(4, '5551234567', 'Rahela Customer', '1995-03-10', 'Kamal Hossain', 'Jahanara Begum', 'Dhaka, Dhanmondi', 'approved');

-- Artist profiles
INSERT IGNORE INTO artists (user_id, bio, experience_years, location, district, specialization, hourly_rate, average_rating, total_reviews, is_available) VALUES
(2, 'I am a professional Mehedi artist with 8 years of experience specializing in bridal and Arabic designs. I have adorned over 500 brides across Dhaka and surrounding areas.', 8, 'Mirpur-10, Dhaka', 'Dhaka', 'Bridal, Arabic, Party', 1500.00, 4.80, 45, 1),
(3, 'Passionate Mehedi artist from Chittagong with expertise in intricate Indian and Bridal designs. Available for home visits and event bookings.', 5, 'Panchlaish, Chittagong', 'Chittagong', 'Indian, Bridal, Simple', 1200.00, 4.60, 28, 1);

-- Services for Artist 1 (Fatema - artist_id=1 in artists table)
INSERT IGNORE INTO services (artist_id, title, category, description, price, duration_minutes, is_active) VALUES
(1, 'Full Bridal Mehedi Package', 'bridal', 'Complete bridal mehedi for hands and feet with intricate designs. Includes both hands up to elbow and feet up to knee.', 8000.00, 300, 1),
(1, 'Party Mehedi Design', 'party', 'Beautiful party mehedi designs for special occasions. Covers both hands up to wrist.', 1500.00, 90, 1),
(1, 'Arabic Style Mehedi', 'arabic', 'Elegant Arabic mehedi patterns. Modern and stylish designs for everyday wear.', 800.00, 60, 1);

-- Services for Artist 2 (Nasrin - artist_id=2 in artists table)
INSERT IGNORE INTO services (artist_id, title, category, description, price, duration_minutes, is_active) VALUES
(2, 'Indian Bridal Mehedi', 'indian', 'Traditional Indian bridal mehedi with fine detailing and intricate patterns. Includes groom name hidden in design.', 10000.00, 360, 1),
(2, 'Simple Eid Mehedi', 'simple', 'Simple and elegant mehedi designs perfect for Eid celebrations.', 500.00, 45, 1);

-- Products for Artist 1
INSERT IGNORE INTO products (artist_id, name, category, description, price, stock, is_active) VALUES
(1, 'Premium Bridal Mehedi Cone', 'cone', 'High-quality natural henna cone with rich color. Long-lasting dark stain perfect for brides.', 150.00, 50, 1),
(1, 'Arabic Design Stencil Set', 'stencil', 'Pack of 20 Arabic design stencils for easy application. Perfect for beginners.', 250.00, 30, 1),
(1, 'Natural Henna Powder (100g)', 'powder', 'Pure natural henna powder sourced from Rajasthan. Triple-sifted for smooth paste.', 350.00, 25, 1);

-- Products for Artist 2
INSERT IGNORE INTO products (artist_id, name, category, description, price, stock, is_active) VALUES
(2, 'Complete Mehedi Kit', 'kit', 'All-in-one mehedi kit with 5 cones, 10 stencils, aftercare oil, and instruction booklet.', 750.00, 15, 1),
(2, 'Eucalyptus Mehedi Oil', 'oil', 'Essential oil blend to enhance mehedi color. Apply after mehedi dries for deeper stain.', 200.00, 40, 1);
