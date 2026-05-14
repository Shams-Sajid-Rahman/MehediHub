const db = require('../config/db');

const Booking = {
  async findById(id) {
    const [rows] = await db.query(`
      SELECT b.*,
        uc.full_name as customer_name, uc.email as customer_email, uc.phone as customer_phone,
        ua.full_name as artist_name, ua.email as artist_email,
        s.title as service_title, s.category as service_category
      FROM bookings b
      JOIN users uc ON b.customer_id = uc.id
      JOIN users ua ON b.artist_id = ua.id
      JOIN services s ON b.service_id = s.id
      WHERE b.id = ?
    `, [id]);
    return rows[0] || null;
  },

  async findByCustomerId(customerId) {
    const [rows] = await db.query(`
      SELECT b.*,
        ua.full_name as artist_name,
        s.title as service_title, s.category as service_category
      FROM bookings b
      JOIN users ua ON b.artist_id = ua.id
      JOIN services s ON b.service_id = s.id
      WHERE b.customer_id = ?
      ORDER BY b.created_at DESC
    `, [customerId]);
    return rows;
  },

  async findByArtistUserId(artistUserId) {
    const [rows] = await db.query(`
      SELECT b.*,
        uc.full_name as customer_name, uc.email as customer_email, uc.phone as customer_phone,
        s.title as service_title, s.category as service_category
      FROM bookings b
      JOIN users uc ON b.customer_id = uc.id
      JOIN services s ON b.service_id = s.id
      WHERE b.artist_id = ?
      ORDER BY b.created_at DESC
    `, [artistUserId]);
    return rows;
  },

  async findAll() {
    const [rows] = await db.query(`
      SELECT b.*,
        uc.full_name as customer_name,
        ua.full_name as artist_name,
        s.title as service_title
      FROM bookings b
      JOIN users uc ON b.customer_id = uc.id
      JOIN users ua ON b.artist_id = ua.id
      JOIN services s ON b.service_id = s.id
      ORDER BY b.created_at DESC
    `);
    return rows;
  },

  async create(data) {
    const { customer_id, artist_id, service_id, event_date, event_time, event_location, total_price, notes } = data;
    const [result] = await db.query(
      `INSERT INTO bookings (customer_id, artist_id, service_id, event_date, event_time, event_location, total_price, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [customer_id, artist_id, service_id, event_date, event_time, event_location, total_price, notes || null]
    );
    return result.insertId;
  },

  async updateStatus(id, status) {
    await db.query('UPDATE bookings SET status = ? WHERE id = ?', [status, id]);
  },

  async count() {
    const [rows] = await db.query('SELECT COUNT(*) as cnt FROM bookings');
    return rows[0].cnt;
  },

  async countByArtist(artistUserId) {
    const [rows] = await db.query('SELECT COUNT(*) as cnt FROM bookings WHERE artist_id = ?', [artistUserId]);
    return rows[0].cnt;
  },

  async pendingCountByArtist(artistUserId) {
    const [rows] = await db.query("SELECT COUNT(*) as cnt FROM bookings WHERE artist_id = ? AND status = 'pending'", [artistUserId]);
    return rows[0].cnt;
  },

  async earningsByArtist(artistUserId) {
    const [rows] = await db.query("SELECT COALESCE(SUM(total_price), 0) as total FROM bookings WHERE artist_id = ? AND status = 'completed'", [artistUserId]);
    return rows[0].total;
  },

  async checkCustomerCanReview(customerId, artistUserId) {
    const [rows] = await db.query(
      "SELECT * FROM bookings WHERE customer_id = ? AND artist_id = ? AND status = 'completed' LIMIT 1",
      [customerId, artistUserId]
    );
    return rows[0] || null;
  },
};

module.exports = Booking;
