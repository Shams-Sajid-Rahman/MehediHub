require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  let connection;

  try {
    // Connect without specifying database first
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true,
    });

    console.log('Connected to MySQL server');

    // Run schema
    const schemaSQL = fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf8');
    console.log('Creating database and tables...');
    await connection.query(schemaSQL);
    console.log('Schema created successfully');

    // Switch to the mehedihub database
    await connection.query('USE mehedihub');

    // Hash passwords for seed users
    const defaultPassword = await bcrypt.hash('admin123', 10);
    const artistPassword = await bcrypt.hash('artist123', 10);
    const customerPassword = await bcrypt.hash('customer123', 10);

    // Insert admin user
    await connection.query(`
      INSERT IGNORE INTO users (id, full_name, email, phone, password_hash, role, status)
      VALUES (1, 'MehediHub Admin', 'admin@mehedihub.com', '01700000000', ?, 'admin', 'active')
    `, [defaultPassword]);
    console.log('Admin user created: admin@mehedihub.com / admin123');

    // Run seed SQL
    let seedSQL = fs.readFileSync(path.join(__dirname, '../database/seed.sql'), 'utf8');

    // Replace placeholder hashes with real ones
    seedSQL = seedSQL.replace(/'\$2b\$10\$placeholder_will_be_replaced'/g, (match, offset, str) => {
      // Count occurrences to decide which password to use
      return `'${artistPassword}'`;
    });

    // Split and execute seed statements individually for better error handling
    const seedLines = seedSQL.split('\n');
    const filteredLines = seedLines.filter(line => !line.trim().startsWith('--') && line.trim() !== '');
    const cleanedSeed = filteredLines.join('\n');

    // Replace the artist passwords properly
    const artistHash = await bcrypt.hash('subaita123', 10);
    const customerHash = await bcrypt.hash('customer123', 10);

    // Insert seed users with correct passwords
    await connection.query(`
      INSERT IGNORE INTO users (id, full_name, email, phone, password_hash, role, status)
      VALUES
        (2, 'Subaita', 'subaita@gmail.com', '01711234567', ?, 'artist', 'active'),
        (3, 'Nasrin Akter', 'nasrin@mehedihub.com', '01811234568', ?, 'artist', 'active'),
        (4, 'Rahela Customer', 'rahela@mehedihub.com', '01911234569', ?, 'customer', 'active')
    `, [artistHash, artistHash, customerHash]);

    // Insert NID verifications
    await connection.query(`
      INSERT IGNORE INTO nid_verifications (user_id, nid_number, name_on_nid, date_of_birth, father_name, mother_name, address, status)
      VALUES
        (2, '1234567890', 'Subaita', '1990-05-15', 'Abdul Karim', 'Roksana Begum', 'Dhaka, Mirpur-10', 'approved'),
        (3, '9876543210', 'Nasrin Akter', '1988-08-22', 'Mohammad Ali', 'Hasina Begum', 'Chittagong, Panchlaish', 'approved'),
        (4, '5551234567', 'Rahela Customer', '1995-03-10', 'Kamal Hossain', 'Jahanara Begum', 'Dhaka, Dhanmondi', 'approved')
    `);

    // Insert artist profiles
    await connection.query(`
      INSERT IGNORE INTO artists (id, user_id, bio, experience_years, location, district, specialization, hourly_rate, average_rating, total_reviews, is_available)
      VALUES
        (1, 2, 'I am a professional Mehedi artist specializing in bridal and Arabic designs.', 8, 'Mirpur-10, Dhaka', 'Dhaka', 'Bridal, Arabic, Party', 1500.00, 4.80, 45, 1),
        (2, 3, 'Passionate Mehedi artist from Chittagong with expertise in intricate Indian and Bridal designs. Available for home visits and event bookings.', 5, 'Panchlaish, Chittagong', 'Chittagong', 'Indian, Bridal, Simple', 1200.00, 4.60, 28, 1)
    `);

    // Insert services
    await connection.query(`
      INSERT IGNORE INTO services (artist_id, title, category, description, price, duration_minutes, is_active)
      VALUES
        (1, 'Full Bridal Mehedi Package', 'bridal', 'Complete bridal mehedi for hands and feet with intricate designs. Includes both hands up to elbow and feet up to knee.', 8000.00, 300, 1),
        (1, 'Party Mehedi Design', 'party', 'Beautiful party mehedi designs for special occasions. Covers both hands up to wrist.', 1500.00, 90, 1),
        (1, 'Arabic Style Mehedi', 'arabic', 'Elegant Arabic mehedi patterns. Modern and stylish designs for everyday wear.', 800.00, 60, 1),
        (2, 'Indian Bridal Mehedi', 'indian', 'Traditional Indian bridal mehedi with fine detailing and intricate patterns. Includes groom name hidden in design.', 10000.00, 360, 1),
        (2, 'Simple Eid Mehedi', 'simple', 'Simple and elegant mehedi designs perfect for Eid celebrations.', 500.00, 45, 1)
    `);

    // Insert products
    await connection.query(`
      INSERT IGNORE INTO products (artist_id, name, category, description, price, stock, is_active)
      VALUES
        (1, 'Premium Bridal Mehedi Cone', 'cone', 'High-quality natural henna cone with rich color. Long-lasting dark stain perfect for brides.', 150.00, 50, 1),
        (1, 'Arabic Design Stencil Set', 'stencil', 'Pack of 20 Arabic design stencils for easy application. Perfect for beginners.', 250.00, 30, 1),
        (1, 'Natural Henna Powder (100g)', 'powder', 'Pure natural henna powder sourced from Rajasthan. Triple-sifted for smooth paste.', 350.00, 25, 1),
        (2, 'Complete Mehedi Kit', 'kit', 'All-in-one mehedi kit with 5 cones, 10 stencils, aftercare oil, and instruction booklet.', 750.00, 15, 1),
        (2, 'Eucalyptus Mehedi Oil', 'oil', 'Essential oil blend to enhance mehedi color. Apply after mehedi dries for deeper stain.', 200.00, 40, 1)
    `);

    console.log('Seed data inserted successfully');
    console.log('\n=== Setup Complete ===');
    console.log('Admin login: admin@mehedihub.com / admin123');
    console.log('Artist login: subaita@gmail.com / subaita123');
    console.log('Customer login: rahela@mehedihub.com / customer123');
    console.log('Run: npm run dev');

  } catch (err) {
    console.error('Setup error:', err.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

setupDatabase();
