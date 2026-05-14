const db = require('../config/db');

const Order = {
  async findById(id) {
    const [rows] = await db.query(`
      SELECT o.*, u.full_name as customer_name, u.email as customer_email
      FROM orders o
      JOIN users u ON o.customer_id = u.id
      WHERE o.id = ?
    `, [id]);
    if (!rows[0]) return null;
    const order = rows[0];
    const [items] = await db.query(`
      SELECT oi.*, p.name as product_name, p.image_url, u.full_name as artist_name
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN artists a ON oi.artist_id = a.id
      JOIN users u ON a.user_id = u.id
      WHERE oi.order_id = ?
    `, [id]);
    order.items = items;
    return order;
  },

  async findByCustomerId(customerId) {
    const [rows] = await db.query(`
      SELECT o.*, COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.customer_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `, [customerId]);
    return rows;
  },

  async findByArtistId(artistId) {
    const [rows] = await db.query(`
      SELECT DISTINCT o.*, u.full_name as customer_name, u.phone as customer_phone
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN users u ON o.customer_id = u.id
      WHERE oi.artist_id = ?
      ORDER BY o.created_at DESC
    `, [artistId]);
    return rows;
  },

  async findAll() {
    const [rows] = await db.query(`
      SELECT o.*, u.full_name as customer_name, COUNT(oi.id) as item_count
      FROM orders o
      JOIN users u ON o.customer_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);
    return rows;
  },

  async create(customerId, totalAmount, shippingAddress, phone) {
    const [result] = await db.query(
      'INSERT INTO orders (customer_id, total_amount, shipping_address, phone) VALUES (?, ?, ?, ?)',
      [customerId, totalAmount, shippingAddress, phone]
    );
    return result.insertId;
  },

  async addItem(orderId, productId, artistId, quantity, unitPrice) {
    await db.query(
      'INSERT INTO order_items (order_id, product_id, artist_id, quantity, unit_price) VALUES (?, ?, ?, ?, ?)',
      [orderId, productId, artistId, quantity, unitPrice]
    );
  },

  async updateStatus(id, status) {
    await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
  },

  async count() {
    const [rows] = await db.query('SELECT COUNT(*) as cnt FROM orders');
    return rows[0].cnt;
  },

  async totalRevenue() {
    const [rows] = await db.query("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status != 'cancelled'");
    return rows[0].total;
  },

  async checkCustomerCanReviewProduct(customerId, productId) {
    const [rows] = await db.query(`
      SELECT oi.id FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.customer_id = ? AND oi.product_id = ? AND o.status = 'delivered'
      LIMIT 1
    `, [customerId, productId]);
    return rows[0] || null;
  },
};

module.exports = Order;
