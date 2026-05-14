const db = require('../config/db');

const Product = {
  async findById(id) {
    const [rows] = await db.query(`
      SELECT p.*, a.id as artist_db_id, u.full_name as artist_name, u.id as artist_user_id
      FROM products p
      JOIN artists a ON p.artist_id = a.id
      JOIN users u ON a.user_id = u.id
      WHERE p.id = ?
    `, [id]);
    return rows[0] || null;
  },

  async findByArtistId(artistId, activeOnly = false) {
    let sql = 'SELECT * FROM products WHERE artist_id = ?';
    const params = [artistId];
    if (activeOnly) { sql += ' AND is_active = 1'; }
    sql += ' ORDER BY created_at DESC';
    const [rows] = await db.query(sql, params);
    return rows;
  },

  async findAll(filters = {}) {
    let sql = `
      SELECT p.*, u.full_name as artist_name
      FROM products p
      JOIN artists a ON p.artist_id = a.id
      JOIN users u ON a.user_id = u.id
      WHERE p.is_active = 1 AND u.status = 'active'
    `;
    const params = [];
    if (filters.category) { sql += ' AND p.category = ?'; params.push(filters.category); }
    if (filters.maxPrice) { sql += ' AND p.price <= ?'; params.push(filters.maxPrice); }
    if (filters.minPrice) { sql += ' AND p.price >= ?'; params.push(filters.minPrice); }
    sql += ' ORDER BY p.created_at DESC';
    const [rows] = await db.query(sql, params);
    return rows;
  },

  async findAllAdmin() {
    const [rows] = await db.query(`
      SELECT p.*, u.full_name as artist_name, u.status as artist_status
      FROM products p
      JOIN artists a ON p.artist_id = a.id
      JOIN users u ON a.user_id = u.id
      ORDER BY p.created_at DESC
    `);
    return rows;
  },

  async create(data) {
    const { artist_id, name, category, description, price, stock, image_url } = data;
    const [result] = await db.query(
      'INSERT INTO products (artist_id, name, category, description, price, stock, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [artist_id, name, category, description, price, stock, image_url || null]
    );
    return result.insertId;
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    const allowed = ['name', 'category', 'description', 'price', 'stock', 'image_url', 'is_active'];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    }
    if (!fields.length) return;
    values.push(id);
    await db.query(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, values);
  },

  async delete(id) {
    await db.query('DELETE FROM products WHERE id = ?', [id]);
  },

  async updateStock(id, quantity) {
    await db.query('UPDATE products SET stock = stock - ? WHERE id = ?', [quantity, id]);
  },

  async count() {
    const [rows] = await db.query('SELECT COUNT(*) as cnt FROM products WHERE is_active = 1');
    return rows[0].cnt;
  },
};

module.exports = Product;
