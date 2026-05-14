const path = require('path');
const db = require('../config/db');
const Artist = require('../models/Artist');
const Service = require('../models/Service');
const Product = require('../models/Product');
const Booking = require('../models/Booking');
const Order = require('../models/Order');
const Review = require('../models/Review');
const User = require('../models/User');

const artistController = {
  async getDashboard(req, res, next) {
    try {
      const artist = await Artist.findByUserId(req.session.userId);
      if (!artist) { req.flash('error', 'Artist profile not found.'); return res.redirect('/'); }

      const [totalBookings, pendingBookings, earnings, totalReviews] = await Promise.all([
        Booking.countByArtist(req.session.userId),
        Booking.pendingCountByArtist(req.session.userId),
        Booking.earningsByArtist(req.session.userId),
        Review.findByTarget('artist', req.session.userId).then(r => r.length),
      ]);

      const recentBookings = await Booking.findByArtistUserId(req.session.userId);

      res.render('artist/dashboard', {
        title: 'Artist Dashboard',
        layout: 'layouts/artist',
        artist,
        stats: { totalBookings, pendingBookings, earnings, totalReviews, avgRating: artist.average_rating },
        recentBookings: recentBookings.slice(0, 5),
      });
    } catch (err) { next(err); }
  },

  async getProfile(req, res, next) {
    try {
      const artist = await Artist.findByUserId(req.session.userId);
      const user = await User.findById(req.session.userId);
      res.render('artist/profile', {
        title: 'My Profile',
        layout: 'layouts/artist',
        artist,
        user,
      });
    } catch (err) { next(err); }
  },

  async postProfile(req, res, next) {
    try {
      const { full_name, phone, bio, experience_years, location, district, specialization, hourly_rate, is_available } = req.body;
      const artist = await Artist.findByUserId(req.session.userId);
      if (!artist) { req.flash('error', 'Profile not found.'); return res.redirect('/artist/profile'); }

      const userUpdate = { full_name, phone };
      if (req.file) userUpdate.profile_image = '/uploads/profiles/' + req.file.filename;
      await User.update(req.session.userId, userUpdate);

      await Artist.update(artist.id, {
        bio, experience_years: parseInt(experience_years) || 0,
        location, district, specialization,
        hourly_rate: parseFloat(hourly_rate) || 0,
        is_available: is_available === 'on' ? 1 : 0,
      });

      req.session.userName = full_name;
      req.flash('success', 'Profile updated successfully.');
      res.redirect('/artist/profile');
    } catch (err) { next(err); }
  },

  async getServices(req, res, next) {
    try {
      const artist = await Artist.findByUserId(req.session.userId);
      const services = await Service.findByArtistId(artist.id);
      res.render('artist/services', {
        title: 'My Services',
        layout: 'layouts/artist',
        services,
        artist,
      });
    } catch (err) { next(err); }
  },

  getNewService(req, res) {
    res.render('artist/service-form', {
      title: 'Add Service',
      layout: 'layouts/artist',
      service: null,
      formAction: '/artist/services/new',
    });
  },

  async postNewService(req, res, next) {
    try {
      const artist = await Artist.findByUserId(req.session.userId);
      const { title, category, description, price, duration_minutes } = req.body;
      await Service.create({ artist_id: artist.id, title, category, description, price, duration_minutes });
      req.flash('success', 'Service created.');
      res.redirect('/artist/services');
    } catch (err) { next(err); }
  },

  async getEditService(req, res, next) {
    try {
      const artist = await Artist.findByUserId(req.session.userId);
      const service = await Service.findById(req.params.id);
      if (!service || service.artist_id !== artist.id) {
        req.flash('error', 'Service not found.'); return res.redirect('/artist/services');
      }
      res.render('artist/service-form', {
        title: 'Edit Service',
        layout: 'layouts/artist',
        service,
        formAction: `/artist/services/${req.params.id}/edit`,
      });
    } catch (err) { next(err); }
  },

  async postEditService(req, res, next) {
    try {
      const artist = await Artist.findByUserId(req.session.userId);
      const service = await Service.findById(req.params.id);
      if (!service || service.artist_id !== artist.id) {
        req.flash('error', 'Service not found.'); return res.redirect('/artist/services');
      }
      const { title, category, description, price, duration_minutes, is_active } = req.body;
      await Service.update(req.params.id, { title, category, description, price, duration_minutes, is_active: is_active === 'on' ? 1 : 0 });
      req.flash('success', 'Service updated.');
      res.redirect('/artist/services');
    } catch (err) { next(err); }
  },

  async deleteService(req, res, next) {
    try {
      const artist = await Artist.findByUserId(req.session.userId);
      const service = await Service.findById(req.params.id);
      if (!service || service.artist_id !== artist.id) {
        req.flash('error', 'Service not found.'); return res.redirect('/artist/services');
      }
      await Service.delete(req.params.id);
      req.flash('success', 'Service deleted.');
      res.redirect('/artist/services');
    } catch (err) { next(err); }
  },

  async getProducts(req, res, next) {
    try {
      const artist = await Artist.findByUserId(req.session.userId);
      const products = await Product.findByArtistId(artist.id);
      res.render('artist/products', {
        title: 'My Products',
        layout: 'layouts/artist',
        products,
        artist,
      });
    } catch (err) { next(err); }
  },

  getNewProduct(req, res) {
    res.render('artist/product-form', {
      title: 'Add Product',
      layout: 'layouts/artist',
      product: null,
      formAction: '/artist/products/new',
    });
  },

  async postNewProduct(req, res, next) {
    try {
      const artist = await Artist.findByUserId(req.session.userId);
      const { name, category, description, price, stock } = req.body;
      const image_url = req.file ? '/uploads/products/' + req.file.filename : null;
      await Product.create({ artist_id: artist.id, name, category, description, price, stock, image_url });
      req.flash('success', 'Product created.');
      res.redirect('/artist/products');
    } catch (err) { next(err); }
  },

  async getEditProduct(req, res, next) {
    try {
      const artist = await Artist.findByUserId(req.session.userId);
      const product = await Product.findById(req.params.id);
      if (!product || product.artist_id !== artist.id) {
        req.flash('error', 'Product not found.'); return res.redirect('/artist/products');
      }
      res.render('artist/product-form', {
        title: 'Edit Product',
        layout: 'layouts/artist',
        product,
        formAction: `/artist/products/${req.params.id}/edit`,
      });
    } catch (err) { next(err); }
  },

  async postEditProduct(req, res, next) {
    try {
      const artist = await Artist.findByUserId(req.session.userId);
      const product = await Product.findById(req.params.id);
      if (!product || product.artist_id !== artist.id) {
        req.flash('error', 'Product not found.'); return res.redirect('/artist/products');
      }
      const { name, category, description, price, stock, is_active } = req.body;
      const updateData = { name, category, description, price, stock, is_active: is_active === 'on' ? 1 : 0 };
      if (req.file) updateData.image_url = '/uploads/products/' + req.file.filename;
      await Product.update(req.params.id, updateData);
      req.flash('success', 'Product updated.');
      res.redirect('/artist/products');
    } catch (err) { next(err); }
  },

  async deleteProduct(req, res, next) {
    try {
      const artist = await Artist.findByUserId(req.session.userId);
      const product = await Product.findById(req.params.id);
      if (!product || product.artist_id !== artist.id) {
        req.flash('error', 'Product not found.'); return res.redirect('/artist/products');
      }
      await Product.delete(req.params.id);
      req.flash('success', 'Product deleted.');
      res.redirect('/artist/products');
    } catch (err) { next(err); }
  },

  async getPortfolio(req, res, next) {
    try {
      const artist = await Artist.findByUserId(req.session.userId);
      const [portfolioRows] = await db.query('SELECT * FROM portfolios WHERE artist_id = ? ORDER BY created_at DESC', [artist.id]);
      res.render('artist/portfolio', {
        title: 'My Portfolio',
        layout: 'layouts/artist',
        portfolios: portfolioRows,
        artist,
      });
    } catch (err) { next(err); }
  },

  async addPortfolio(req, res, next) {
    try {
      const artist = await Artist.findByUserId(req.session.userId);
      if (!req.file) { req.flash('error', 'Please select an image.'); return res.redirect('/artist/portfolio'); }
      const imageUrl = '/uploads/portfolio/' + req.file.filename;
      const { caption } = req.body;
      await db.query('INSERT INTO portfolios (artist_id, image_url, caption) VALUES (?, ?, ?)', [artist.id, imageUrl, caption || null]);
      req.flash('success', 'Portfolio image added.');
      res.redirect('/artist/portfolio');
    } catch (err) { next(err); }
  },

  async deletePortfolio(req, res, next) {
    try {
      const artist = await Artist.findByUserId(req.session.userId);
      await db.query('DELETE FROM portfolios WHERE id = ? AND artist_id = ?', [req.params.id, artist.id]);
      req.flash('success', 'Portfolio image deleted.');
      res.redirect('/artist/portfolio');
    } catch (err) { next(err); }
  },

  async getBookings(req, res, next) {
    try {
      const bookings = await Booking.findByArtistUserId(req.session.userId);
      res.render('artist/bookings', {
        title: 'My Bookings',
        layout: 'layouts/artist',
        bookings,
      });
    } catch (err) { next(err); }
  },

  async acceptBooking(req, res, next) {
    try {
      await Booking.updateStatus(req.params.id, 'confirmed');
      req.flash('success', 'Booking confirmed.');
      res.redirect('/artist/bookings');
    } catch (err) { next(err); }
  },

  async rejectBooking(req, res, next) {
    try {
      await Booking.updateStatus(req.params.id, 'rejected');
      req.flash('success', 'Booking rejected.');
      res.redirect('/artist/bookings');
    } catch (err) { next(err); }
  },

  async completeBooking(req, res, next) {
    try {
      await Booking.updateStatus(req.params.id, 'completed');
      req.flash('success', 'Booking marked as completed.');
      res.redirect('/artist/bookings');
    } catch (err) { next(err); }
  },

  async getOrders(req, res, next) {
    try {
      const artist = await Artist.findByUserId(req.session.userId);
      const orders = await Order.findByArtistId(artist.id);
      res.render('artist/orders', {
        title: 'My Orders',
        layout: 'layouts/artist',
        orders,
      });
    } catch (err) { next(err); }
  },

  async shipOrder(req, res, next) {
    try {
      await Order.updateStatus(req.params.id, 'shipped');
      req.flash('success', 'Order marked as shipped.');
      res.redirect('/artist/orders');
    } catch (err) { next(err); }
  },
};

module.exports = artistController;
