const db = require('../config/db');

const Service = {
  async findById(id) {
    const [rows] = await db.query(`
      SELECT s.*, a.user_id as artist_user_id, u.full_name as artist_name
      FROM services s
      JOIN artists a ON s.artist_id = a.id
      JOIN users u ON a.user_id = u.id
      WHERE s.id = ?
    `, [id]);
    return rows[0] || null;
  },

  async findByArtistId(artistId, activeOnly = false) {
    let sql = 'SELECT * FROM services WHERE artist_id = ?';
    const params = [artistId];
    if (activeOnly) { sql += ' AND is_active = 1'; }
    sql += ' ORDER BY created_at DESC';
    const [rows] = await db.query(sql, params);
    return rows;
  },

  async findAll(filters = {}) {
    let sql = `
      SELECT s.*, u.full_name as artist_name
      FROM services s
      JOIN artists a ON s.artist_id = a.id
      JOIN users u ON a.user_id = u.id
      WHERE s.is_active = 1 AND u.status = 'active'
    `;
    const params = [];
    if (filters.category) { sql += ' AND s.category = ?'; params.push(filters.category); }
    sql += ' ORDER BY s.created_at DESC';
    const [rows] = await db.query(sql, params);
    return rows;
  },

  async create(data) {
    const { artist_id, title, category, description, price, duration_minutes } = data;
    const [result] = await db.query(
      'INSERT INTO services (artist_id, title, category, description, price, duration_minutes) VALUES (?, ?, ?, ?, ?, ?)',
      [artist_id, title, category, description, price, duration_minutes]
    );
    return result.insertId;
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    const allowed = ['title', 'category', 'description', 'price', 'duration_minutes', 'is_active'];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    }
    if (!fields.length) return;
    values.push(id);
    await db.query(`UPDATE services SET ${fields.join(', ')} WHERE id = ?`, values);
  },

  async delete(id) {
    await db.query('DELETE FROM services WHERE id = ?', [id]);
  },
};

module.exports = Service;
