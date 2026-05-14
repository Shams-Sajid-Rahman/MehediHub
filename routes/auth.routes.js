const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { uploadNID } = require('../middleware/upload');

router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);

router.get('/register', authController.getRegisterStep1);
router.post('/register', (req, res, next) => {
  uploadNID(req, res, (err) => {
    if (err) { req.flash('error', err.message); return res.redirect('/register'); }
    next();
  });
}, authController.postRegisterStep1);

router.get('/register/verify', authController.getRegisterStep2);
router.post('/register/verify', [
  body('full_name').trim().notEmpty().withMessage('Full name is required.'),
  body('email').isEmail().withMessage('Valid email is required.').normalizeEmail(),
  body('phone').trim().notEmpty().withMessage('Phone number is required.'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
  body('confirm_password').custom((val, { req }) => {
    if (val !== req.body.password) throw new Error('Passwords do not match.');
    return true;
  }),
  body('nid_number').trim().notEmpty().withMessage('NID number is required.'),
], authController.postRegisterStep2);

router.get('/register/pending', authController.getPending);
router.post('/logout', authController.postLogout);

module.exports = router;
