const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const { uploadProfile } = require('../middleware/upload');

router.use(requireAuth, requireRole('customer'));

router.get('/dashboard', customerController.getDashboard);

router.get('/profile', customerController.getProfile);
router.post('/profile', (req, res, next) => {
  uploadProfile(req, res, (err) => {
    if (err) { req.flash('error', err.message); return res.redirect('/customer/profile'); }
    next();
  });
}, customerController.postProfile);

router.post('/book/:artistId', customerController.postBook);

router.get('/bookings', customerController.getBookings);
router.post('/bookings/:id/cancel', customerController.cancelBooking);

router.get('/cart', customerController.getCart);
router.post('/cart/add', customerController.addToCart);
router.post('/cart/update', customerController.updateCart);
router.post('/cart/remove', customerController.removeFromCart);

router.get('/checkout', customerController.getCheckout);
router.post('/checkout', customerController.postCheckout);

router.get('/orders', customerController.getOrders);
router.post('/orders/:id/cancel', customerController.cancelOrder);

router.post('/reviews/artist/:id', customerController.postArtistReview);
router.post('/reviews/product/:id', customerController.postProductReview);

module.exports = router;
