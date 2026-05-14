const User = require('../models/User');
const Artist = require('../models/Artist');
const Service = require('../models/Service');
const Product = require('../models/Product');
const Booking = require('../models/Booking');
const Order = require('../models/Order');
const Review = require('../models/Review');
const db = require('../config/db');

const customerController = {
  async getDashboard(req, res, next) {
    try {
      const bookings = await Booking.findByCustomerId(req.session.userId);
      const orders = await Order.findByCustomerId(req.session.userId);
      const [cartRows] = await db.query('SELECT SUM(quantity) as total FROM cart_items WHERE customer_id = ?', [req.session.userId]);
      const cartCount = cartRows[0].total || 0;

      res.render('customer/dashboard', {
        title: 'My Dashboard',
        layout: 'layouts/customer',
        stats: {
          totalBookings: bookings.length,
          activeBookings: bookings.filter(b => ['pending', 'confirmed'].includes(b.status)).length,
          totalOrders: orders.length,
          activeOrders: orders.filter(o => ['pending', 'confirmed', 'shipped'].includes(o.status)).length,
          cartCount,
        },
        recentBookings: bookings.slice(0, 3),
        recentOrders: orders.slice(0, 3),
      });
    } catch (err) { next(err); }
  },

  async getProfile(req, res, next) {
    try {
      const user = await User.findById(req.session.userId);
      res.render('customer/profile', {
        title: 'My Profile',
        layout: 'layouts/customer',
        user,
      });
    } catch (err) { next(err); }
  },

  async postProfile(req, res, next) {
    try {
      const { full_name, phone } = req.body;
      const updateData = { full_name, phone };
      if (req.file) updateData.profile_image = '/uploads/profiles/' + req.file.filename;
      await User.update(req.session.userId, updateData);
      req.session.userName = full_name;
      req.flash('success', 'Profile updated.');
      res.redirect('/customer/profile');
    } catch (err) { next(err); }
  },

  async postBook(req, res, next) {
    try {
      const { service_id, event_date, event_time, event_location, notes } = req.body;
      const service = await Service.findById(service_id);
      if (!service) { req.flash('error', 'Service not found.'); return res.redirect('back'); }

      await Booking.create({
        customer_id: req.session.userId,
        artist_id: service.artist_user_id,
        service_id,
        event_date,
        event_time,
        event_location,
        total_price: service.price,
        notes,
      });

      req.flash('success', 'Booking request submitted! The artist will confirm shortly.');
      res.redirect('/customer/bookings');
    } catch (err) { next(err); }
  },

  async getBookings(req, res, next) {
    try {
      const bookings = await Booking.findByCustomerId(req.session.userId);
      res.render('customer/bookings', {
        title: 'My Bookings',
        layout: 'layouts/customer',
        bookings,
      });
    } catch (err) { next(err); }
  },

  async cancelBooking(req, res, next) {
    try {
      const [rows] = await db.query('SELECT * FROM bookings WHERE id = ? AND customer_id = ?', [req.params.id, req.session.userId]);
      if (!rows[0]) { req.flash('error', 'Booking not found.'); return res.redirect('/customer/bookings'); }
      if (!['pending', 'confirmed'].includes(rows[0].status)) {
        req.flash('error', 'Cannot cancel this booking.'); return res.redirect('/customer/bookings');
      }
      await Booking.updateStatus(req.params.id, 'cancelled');
      req.flash('success', 'Booking cancelled.');
      res.redirect('/customer/bookings');
    } catch (err) { next(err); }
  },

  async getCart(req, res, next) {
    try {
      const [cartItems] = await db.query(`
        SELECT ci.*, p.name, p.price, p.image_url, p.stock, u.full_name as artist_name
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        JOIN artists a ON p.artist_id = a.id
        JOIN users u ON a.user_id = u.id
        WHERE ci.customer_id = ?
      `, [req.session.userId]);

      const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      res.render('customer/cart', {
        title: 'My Cart',
        layout: 'layouts/customer',
        cartItems,
        total,
      });
    } catch (err) { next(err); }
  },

  async addToCart(req, res, next) {
    try {
      const { product_id, quantity = 1 } = req.body;
      const product = await Product.findById(product_id);
      if (!product || !product.is_active) { req.flash('error', 'Product not available.'); return res.redirect('back'); }
      if (product.stock < parseInt(quantity)) { req.flash('error', 'Insufficient stock.'); return res.redirect('back'); }

      await db.query(`
        INSERT INTO cart_items (customer_id, product_id, quantity)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
      `, [req.session.userId, product_id, parseInt(quantity)]);

      req.flash('success', 'Added to cart.');
      res.redirect('back');
    } catch (err) { next(err); }
  },

  async updateCart(req, res, next) {
    try {
      const { product_id, quantity } = req.body;
      if (parseInt(quantity) <= 0) {
        await db.query('DELETE FROM cart_items WHERE customer_id = ? AND product_id = ?', [req.session.userId, product_id]);
      } else {
        await db.query('UPDATE cart_items SET quantity = ? WHERE customer_id = ? AND product_id = ?', [parseInt(quantity), req.session.userId, product_id]);
      }
      res.redirect('/customer/cart');
    } catch (err) { next(err); }
  },

  async removeFromCart(req, res, next) {
    try {
      await db.query('DELETE FROM cart_items WHERE customer_id = ? AND product_id = ?', [req.session.userId, req.body.product_id]);
      req.flash('success', 'Item removed from cart.');
      res.redirect('/customer/cart');
    } catch (err) { next(err); }
  },

  async getCheckout(req, res, next) {
    try {
      const [cartItems] = await db.query(`
        SELECT ci.*, p.name, p.price, p.image_url, p.stock, a.id as artist_db_id, u.full_name as artist_name
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        JOIN artists a ON p.artist_id = a.id
        JOIN users u ON a.user_id = u.id
        WHERE ci.customer_id = ?
      `, [req.session.userId]);

      if (!cartItems.length) { req.flash('error', 'Your cart is empty.'); return res.redirect('/customer/cart'); }

      const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const user = await User.findById(req.session.userId);

      res.render('customer/checkout', {
        title: 'Checkout',
        layout: 'layouts/customer',
        cartItems,
        total,
        user,
      });
    } catch (err) { next(err); }
  },

  async postCheckout(req, res, next) {
    try {
      const { shipping_address, phone } = req.body;
      const [cartItems] = await db.query(`
        SELECT ci.*, p.price, p.stock, a.id as artist_db_id
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        JOIN artists a ON p.artist_id = a.id
        WHERE ci.customer_id = ?
      `, [req.session.userId]);

      if (!cartItems.length) { req.flash('error', 'Your cart is empty.'); return res.redirect('/customer/cart'); }

      // Verify stock
      for (const item of cartItems) {
        if (item.stock < item.quantity) {
          req.flash('error', `Insufficient stock for some items.`);
          return res.redirect('/customer/cart');
        }
      }

      const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const orderId = await Order.create(req.session.userId, total, shipping_address, phone);

      for (const item of cartItems) {
        await Order.addItem(orderId, item.product_id, item.artist_db_id, item.quantity, item.price);
        await Product.updateStock(item.product_id, item.quantity);
      }

      await db.query('DELETE FROM cart_items WHERE customer_id = ?', [req.session.userId]);
      req.flash('success', 'Order placed successfully!');
      res.redirect('/customer/orders');
    } catch (err) { next(err); }
  },

  async getOrders(req, res, next) {
    try {
      const orders = await Order.findByCustomerId(req.session.userId);
      res.render('customer/orders', {
        title: 'My Orders',
        layout: 'layouts/customer',
        orders,
      });
    } catch (err) { next(err); }
  },

  async cancelOrder(req, res, next) {
    try {
      const [rows] = await db.query('SELECT * FROM orders WHERE id = ? AND customer_id = ?', [req.params.id, req.session.userId]);
      if (!rows[0]) { req.flash('error', 'Order not found.'); return res.redirect('/customer/orders'); }
      if (rows[0].status !== 'pending') { req.flash('error', 'Cannot cancel this order.'); return res.redirect('/customer/orders'); }
      await Order.updateStatus(req.params.id, 'cancelled');
      req.flash('success', 'Order cancelled.');
      res.redirect('/customer/orders');
    } catch (err) { next(err); }
  },

  async postArtistReview(req, res, next) {
    try {
      const { rating, comment } = req.body;
      const artistUserId = parseInt(req.params.id);
      const booking = await Booking.checkCustomerCanReview(req.session.userId, artistUserId);
      if (!booking) { req.flash('error', 'You can only review artists after a completed booking.'); return res.redirect('back'); }

      const alreadyReviewed = await Review.hasReviewed(req.session.userId, 'artist', artistUserId);
      if (alreadyReviewed) { req.flash('error', 'You have already reviewed this artist.'); return res.redirect('back'); }

      await Review.create({ customer_id: req.session.userId, target_type: 'artist', target_id: artistUserId, booking_id: booking.id, rating, comment });

      const artist = await Artist.findByUserId(artistUserId) ||
                     (await db.query('SELECT id FROM artists WHERE user_id = ?', [artistUserId]))[0][0];
      if (artist) await Artist.updateRating(artist.id);

      req.flash('success', 'Review submitted.');
      res.redirect('back');
    } catch (err) { next(err); }
  },

  async postProductReview(req, res, next) {
    try {
      const { rating, comment } = req.body;
      const productId = parseInt(req.params.id);
      const orderItem = await Order.checkCustomerCanReviewProduct(req.session.userId, productId);
      if (!orderItem) { req.flash('error', 'You can only review products after a delivered order.'); return res.redirect('back'); }

      const alreadyReviewed = await Review.hasReviewed(req.session.userId, 'product', productId);
      if (alreadyReviewed) { req.flash('error', 'You have already reviewed this product.'); return res.redirect('back'); }

      await Review.create({ customer_id: req.session.userId, target_type: 'product', target_id: productId, order_item_id: orderItem.id, rating, comment });
      req.flash('success', 'Review submitted.');
      res.redirect('back');
    } catch (err) { next(err); }
  },
};

module.exports = customerController;
