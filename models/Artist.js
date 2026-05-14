const db = require('../config/db');

const Artist = {
  async findById(id) {
    const [rows] = await db.query(`
      SELECT a.*, u.full_name, u.email, u.phone, u.profile_image, u.status
      FROM artists a
      JOIN users u ON a.user_id = u.id
      WHERE a.id = ?
    `, [id]);
    return rows[0] || null;
  },

  async findByUserId(userId) {
    const [rows] = await db.query(`
      SELECT a.*, u.full_name, u.email, u.phone, u.profile_image, u.status
      FROM artists a
      JOIN users u ON a.user_id = u.id
      WHERE a.user_id = ?
    `, [userId]);
    return rows[0] || null;
  },

  async findAll(filters = {}) {
    let sql = `
      SELECT a.*, u.full_name, u.email, u.phone, u.profile_image
      FROM artists a
      JOIN users u ON a.user_id = u.id
      WHERE u.status = 'active'
    `;
    const params = [];
    if (filters.district) { sql += ' AND a.district = ?'; params.push(filters.district); }
    if (filters.minRating) { sql += ' AND a.average_rating >= ?'; params.push(filters.minRating); }
    if (filters.maxRate) { sql += ' AND a.hourly_rate <= ?'; params.push(filters.maxRate); }
    if (filters.specialization) { sql += ' AND a.specialization LIKE ?'; params.push(`%${filters.specialization}%`); }
    sql += ' ORDER BY a.average_rating DESC, a.total_reviews DESC';
    const [rows] = await db.query(sql, params);
    return rows;
  },

  async findAllAdmin() {
    const [rows] = await db.query(`
      SELECT a.*, u.full_name, u.email, u.phone, u.profile_image, u.status, u.created_at as user_created_at
      FROM artists a
      JOIN users u ON a.user_id = u.id
      ORDER BY u.created_at DESC
    `);
    return rows;
  },

  async create(userId) {
    const [result] = await db.query(
      'INSERT INTO artists (user_id) VALUES (?)',
      [userId]
    );
    return result.insertId;
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    const allowed = ['bio', 'experience_years', 'location', 'district', 'specialization', 'hourly_rate', 'is_available'];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    }
    if (!fields.length) return;
    values.push(id);
    await db.query(`UPDATE artists SET ${fields.join(', ')} WHERE id = ?`, values);
  },

  async updateRating(id) {
    await db.query(`
      UPDATE artists a SET
        average_rating = (
          SELECT COALESCE(AVG(r.rating), 0)
          FROM reviews r
          WHERE r.target_type = 'artist' AND r.target_id = a.user_id
        ),
        total_reviews = (
          SELECT COUNT(*)
          FROM reviews r
          WHERE r.target_type = 'artist' AND r.target_id = a.user_id
        )
      WHERE a.id = ?
    `, [id]);
  },

  async getDistricts() {
    const [rows] = await db.query(`
      SELECT DISTINCT district FROM artists
      WHERE district IS NOT NULL AND district != ''
      ORDER BY district
    `);
    return rows.map(r => r.district);
  },

  async count() {
    const [rows] = await db.query('SELECT COUNT(*) as cnt FROM artists');
    return rows[0].cnt;
  },
};

module.exports = Artist;
