const db = require('../config/db');

const Review = {
  async findByTarget(targetType, targetId) {
    const [rows] = await db.query(`
      SELECT r.*, u.full_name as customer_name, u.profile_image as customer_image
      FROM reviews r
      JOIN users u ON r.customer_id = u.id
      WHERE r.target_type = ? AND r.target_id = ?
      ORDER BY r.created_at DESC
    `, [targetType, targetId]);
    return rows;
  },

  async findAll() {
    const [rows] = await db.query(`
      SELECT r.*, u.full_name as customer_name
      FROM reviews r
      JOIN users u ON r.customer_id = u.id
      ORDER BY r.created_at DESC
    `);
    return rows;
  },

  async create(data) {
    const { customer_id, target_type, target_id, booking_id, order_item_id, rating, comment } = data;
    const [result] = await db.query(
      'INSERT INTO reviews (customer_id, target_type, target_id, booking_id, order_item_id, rating, comment) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [customer_id, target_type, target_id, booking_id || null, order_item_id || null, rating, comment || null]
    );
    return result.insertId;
  },

  async delete(id) {
    await db.query('DELETE FROM reviews WHERE id = ?', [id]);
  },

  async hasReviewed(customerId, targetType, targetId) {
    const [rows] = await db.query(
      'SELECT id FROM reviews WHERE customer_id = ? AND target_type = ? AND target_id = ? LIMIT 1',
      [customerId, targetType, targetId]
    );
    return !!rows[0];
  },
};

module.exports = Review;
