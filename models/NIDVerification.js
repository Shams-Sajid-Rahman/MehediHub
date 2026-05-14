const db = require('../config/db');

const NIDVerification = {
  async findById(id) {
    const [rows] = await db.query('SELECT nv.*, u.full_name, u.email, u.role FROM nid_verifications nv JOIN users u ON nv.user_id = u.id WHERE nv.id = ?', [id]);
    return rows[0] || null;
  },

  async findByUserId(userId) {
    const [rows] = await db.query('SELECT * FROM nid_verifications WHERE user_id = ?', [userId]);
    return rows[0] || null;
  },

  async findByNIDNumber(nidNumber) {
    const [rows] = await db.query('SELECT * FROM nid_verifications WHERE nid_number = ?', [nidNumber]);
    return rows[0] || null;
  },

  async findPending() {
    const [rows] = await db.query(`
      SELECT nv.*, u.full_name, u.email, u.role, u.phone
      FROM nid_verifications nv
      JOIN users u ON nv.user_id = u.id
      WHERE nv.status = 'pending'
      ORDER BY nv.created_at ASC
    `);
    return rows;
  },

  async findAll(status = null) {
    let sql = `
      SELECT nv.*, u.full_name, u.email, u.role, u.phone
      FROM nid_verifications nv
      JOIN users u ON nv.user_id = u.id
    `;
    const params = [];
    if (status) { sql += ' WHERE nv.status = ?'; params.push(status); }
    sql += ' ORDER BY nv.created_at DESC';
    const [rows] = await db.query(sql, params);
    return rows;
  },

  async create(data) {
    const {
      user_id, nid_number, name_on_nid, date_of_birth, father_name,
      mother_name, address, nid_front_image, nid_back_image, ocr_raw_text,
    } = data;
    const [result] = await db.query(
      `INSERT INTO nid_verifications
        (user_id, nid_number, name_on_nid, date_of_birth, father_name, mother_name, address, nid_front_image, nid_back_image, ocr_raw_text, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [user_id, nid_number, name_on_nid || null, date_of_birth || null, father_name || null,
       mother_name || null, address || null, nid_front_image || null, nid_back_image || null, ocr_raw_text || null]
    );
    return result.insertId;
  },

  async approve(id, verifiedBy) {
    await db.query(
      `UPDATE nid_verifications SET status = 'approved', verified_by = ?, verified_at = NOW() WHERE id = ?`,
      [verifiedBy, id]
    );
  },

  async reject(id, reason, verifiedBy) {
    await db.query(
      `UPDATE nid_verifications SET status = 'rejected', rejection_reason = ?, verified_by = ?, verified_at = NOW() WHERE id = ?`,
      [reason, verifiedBy, id]
    );
  },

  async countPending() {
    const [rows] = await db.query("SELECT COUNT(*) as cnt FROM nid_verifications WHERE status = 'pending'");
    return rows[0].cnt;
  },
};

module.exports = NIDVerification;
