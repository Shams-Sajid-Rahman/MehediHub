const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

router.use(requireAuth, requireRole('admin'));

router.get('/', adminController.getDashboard);
router.get('/pending-verifications', adminController.getPendingVerifications);
router.get('/verifications/:id', adminController.getVerificationDetail);
router.post('/verifications/:id/approve', adminController.approveVerification);
router.post('/verifications/:id/reject', adminController.rejectVerification);

router.get('/users', adminController.getUsers);
router.post('/users/:id/status', adminController.updateUserStatus);
router.post('/users/:id/delete', adminController.deleteUser);

router.get('/artists', adminController.getArtists);
router.get('/products', adminController.getProducts);
router.post('/products/:id/toggle', adminController.toggleProduct);

router.get('/bookings', adminController.getBookings);
router.get('/orders', adminController.getOrders);

router.get('/reviews', adminController.getReviews);
router.post('/reviews/:id/delete', adminController.deleteReview);

module.exports = router;
