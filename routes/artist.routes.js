const express = require('express');
const router = express.Router();
const artistController = require('../controllers/artistController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const { uploadProfile, uploadPortfolio, uploadProduct } = require('../middleware/upload');

router.use(requireAuth, requireRole('artist'));

router.get('/dashboard', artistController.getDashboard);

router.get('/profile', artistController.getProfile);
router.post('/profile', (req, res, next) => {
  uploadProfile(req, res, (err) => {
    if (err) { req.flash('error', err.message); return res.redirect('/artist/profile'); }
    next();
  });
}, artistController.postProfile);

router.get('/services', artistController.getServices);
router.get('/services/new', artistController.getNewService);
router.post('/services/new', artistController.postNewService);
router.get('/services/:id/edit', artistController.getEditService);
router.post('/services/:id/edit', artistController.postEditService);
router.post('/services/:id/delete', artistController.deleteService);

router.get('/products', artistController.getProducts);
router.get('/products/new', artistController.getNewProduct);
router.post('/products/new', (req, res, next) => {
  uploadProduct(req, res, (err) => {
    if (err) { req.flash('error', err.message); return res.redirect('/artist/products'); }
    next();
  });
}, artistController.postNewProduct);
router.get('/products/:id/edit', artistController.getEditProduct);
router.post('/products/:id/edit', (req, res, next) => {
  uploadProduct(req, res, (err) => {
    if (err) { req.flash('error', err.message); return res.redirect('/artist/products'); }
    next();
  });
}, artistController.postEditProduct);
router.post('/products/:id/delete', artistController.deleteProduct);

router.get('/portfolio', artistController.getPortfolio);
router.post('/portfolio/add', (req, res, next) => {
  uploadPortfolio(req, res, (err) => {
    if (err) { req.flash('error', err.message); return res.redirect('/artist/portfolio'); }
    next();
  });
}, artistController.addPortfolio);
router.post('/portfolio/:id/delete', artistController.deletePortfolio);

router.get('/bookings', artistController.getBookings);
router.post('/bookings/:id/accept', artistController.acceptBooking);
router.post('/bookings/:id/reject', artistController.rejectBooking);
router.post('/bookings/:id/complete', artistController.completeBooking);

router.get('/orders', artistController.getOrders);
router.post('/orders/:id/ship', artistController.shipOrder);

module.exports = router;
