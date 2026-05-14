const User = require('../models/User');
const Artist = require('../models/Artist');
const NIDVerification = require('../models/NIDVerification');
const Product = require('../models/Product');
const Booking = require('../models/Booking');
const Order = require('../models/Order');
const Review = require('../models/Review');

const adminController = {
  async getDashboard(req, res, next) {
    try {
      const [totalUsers, totalArtists, totalCustomers, pendingVerifications,
             totalBookings, totalOrders, revenue] = await Promise.all([
        User.countByRole('artist').then(a => User.countByRole('customer').then(c => a + c)),
        User.countByRole('artist'),
        User.countByRole('customer'),
        NIDVerification.countPending(),
        Booking.count(),
        Order.count(),
        Order.totalRevenue(),
      ]);

      res.render('admin/dashboard', {
        title: 'Admin Dashboard',
        layout: 'layouts/admin',
        stats: { totalUsers, totalArtists, totalCustomers, pendingVerifications, totalBookings, totalOrders, revenue },
      });
    } catch (err) { next(err); }
  },

  async getPendingVerifications(req, res, next) {
    try {
      const verifications = await NIDVerification.findPending();
      res.render('admin/pending-verifications', {
        title: 'Pending Verifications',
        layout: 'layouts/admin',
        verifications,
      });
    } catch (err) { next(err); }
  },

  async getVerificationDetail(req, res, next) {
    try {
      const verification = await NIDVerification.findById(req.params.id);
      if (!verification) {
        req.flash('error', 'Verification not found.');
        return res.redirect('/admin/pending-verifications');
      }
      res.render('admin/verification-detail', {
        title: 'Verification Detail',
        layout: 'layouts/admin',
        verification,
      });
    } catch (err) { next(err); }
  },

  async approveVerification(req, res, next) {
    try {
      const verification = await NIDVerification.findById(req.params.id);
      if (!verification) {
        req.flash('error', 'Verification not found.');
        return res.redirect('/admin/pending-verifications');
      }
      await NIDVerification.approve(req.params.id, req.session.userId);
      await User.updateStatus(verification.user_id, 'active');
      req.flash('success', `User ${verification.full_name} has been approved.`);
      res.redirect('/admin/pending-verifications');
    } catch (err) { next(err); }
  },

  async rejectVerification(req, res, next) {
    try {
      const { rejection_reason } = req.body;
      const verification = await NIDVerification.findById(req.params.id);
      if (!verification) {
        req.flash('error', 'Verification not found.');
        return res.redirect('/admin/pending-verifications');
      }
      await NIDVerification.reject(req.params.id, rejection_reason || 'No reason provided.', req.session.userId);
      await User.updateStatus(verification.user_id, 'rejected');
      req.flash('success', `User ${verification.full_name} has been rejected.`);
      res.redirect('/admin/pending-verifications');
    } catch (err) { next(err); }
  },

  async getUsers(req, res, next) {
    try {
      const { role, status, search } = req.query;
      const users = await User.findAll({ role, status, search });
      res.render('admin/users', {
        title: 'Manage Users',
        layout: 'layouts/admin',
        users,
        filters: { role, status, search },
      });
    } catch (err) { next(err); }
  },

  async updateUserStatus(req, res, next) {
    try {
      const { status } = req.body;
      await User.updateStatus(req.params.id, status);
      req.flash('success', 'User status updated.');
      res.redirect('/admin/users');
    } catch (err) { next(err); }
  },

  async deleteUser(req, res, next) {
    try {
      await User.delete(req.params.id);
      req.flash('success', 'User deleted.');
      res.redirect('/admin/users');
    } catch (err) { next(err); }
  },

  async getArtists(req, res, next) {
    try {
      const artists = await Artist.findAllAdmin();
      res.render('admin/artists', {
        title: 'Manage Artists',
        layout: 'layouts/admin',
        artists,
      });
    } catch (err) { next(err); }
  },

  async getProducts(req, res, next) {
    try {
      const products = await Product.findAllAdmin();
      res.render('admin/products', {
        title: 'Manage Products',
        layout: 'layouts/admin',
        products,
      });
    } catch (err) { next(err); }
  },

  async toggleProduct(req, res, next) {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) { req.flash('error', 'Product not found.'); return res.redirect('/admin/products'); }
      await Product.update(req.params.id, { is_active: product.is_active ? 0 : 1 });
      req.flash('success', 'Product status updated.');
      res.redirect('/admin/products');
    } catch (err) { next(err); }
  },

  async getBookings(req, res, next) {
    try {
      const bookings = await Booking.findAll();
      res.render('admin/bookings', {
        title: 'All Bookings',
        layout: 'layouts/admin',
        bookings,
      });
    } catch (err) { next(err); }
  },

  async getOrders(req, res, next) {
    try {
      const orders = await Order.findAll();
      res.render('admin/orders', {
        title: 'All Orders',
        layout: 'layouts/admin',
        orders,
      });
    } catch (err) { next(err); }
  },

  async getReviews(req, res, next) {
    try {
      const reviews = await Review.findAll();
      res.render('admin/reviews', {
        title: 'Manage Reviews',
        layout: 'layouts/admin',
        reviews,
      });
    } catch (err) { next(err); }
  },

  async deleteReview(req, res, next) {
    try {
      await Review.delete(req.params.id);
      req.flash('success', 'Review deleted.');
      res.redirect('/admin/reviews');
    } catch (err) { next(err); }
  },
};

module.exports = adminController;
