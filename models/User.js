const db = require('../config/db');

const User = {
  async findById(id) {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async findByEmail(email) {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
  },

  async findAll(filters = {}) {
    let sql = 'SELECT * FROM users WHERE 1=1';
    const params = [];
    if (filters.role) { sql += ' AND role = ?'; params.push(filters.role); }
    if (filters.status) { sql += ' AND status = ?'; params.push(filters.status); }
    if (filters.search) {
      sql += ' AND (full_name LIKE ? OR email LIKE ? OR phone LIKE ?)';
      const s = `%${filters.search}%`;
      params.push(s, s, s);
    }
    sql += ' ORDER BY created_at DESC';
    const [rows] = await db.query(sql, params);
    return rows;
  },

  async create(data) {
    const { full_name, email, phone, password_hash, role } = data;
    const [result] = await db.query(
      'INSERT INTO users (full_name, email, phone, password_hash, role, status) VALUES (?, ?, ?, ?, ?, "pending")',
      [full_name, email, phone, password_hash, role]
    );
    return result.insertId;
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    const allowed = ['full_name', 'phone', 'status', 'profile_image'];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    }
    if (!fields.length) return;
    values.push(id);
    await db.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
  },

  async updateStatus(id, status) {
    await db.query('UPDATE users SET status = ? WHERE id = ?', [status, id]);
  },

  async delete(id) {
    await db.query('DELETE FROM users WHERE id = ?', [id]);
  },

  async countByRole(role) {
    const [rows] = await db.query('SELECT COUNT(*) as cnt FROM users WHERE role = ?', [role]);
    return rows[0].cnt;
  },

  async countByStatus(status) {
    const [rows] = await db.query('SELECT COUNT(*) as cnt FROM users WHERE status = ?', [status]);
    return rows[0].cnt;
  },
};

module.exports = User;
