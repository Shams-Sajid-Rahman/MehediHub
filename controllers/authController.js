const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const NIDVerification = require('../models/NIDVerification');
const Artist = require('../models/Artist');
const ocrService = require('../services/ocrService');
const path = require('path');

const authController = {
  getLogin(req, res) {
    if (req.session.userId) return res.redirect('/');
    res.render('auth/login', { title: 'Login - MehediHub' });
  },

  async postLogin(req, res, next) {
    const { email, password, remember_me } = req.body;
    try {
      const user = await User.findByEmail(email);
      if (!user) {
        req.flash('error', 'Invalid email or password.');
        return res.redirect('/login');
      }

      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        req.flash('error', 'Invalid email or password.');
        return res.redirect('/login');
      }

      if (user.status === 'rejected') {
        const nid = await NIDVerification.findByUserId(user.id);
        const reason = nid && nid.rejection_reason ? nid.rejection_reason : 'No reason provided.';
        req.flash('error', `Your registration was rejected. Reason: ${reason}`);
        return res.redirect('/login');
      }
      if (user.status === 'suspended') {
        req.flash('error', 'Your account has been suspended. Please contact support.');
        return res.redirect('/login');
      }

      req.session.userId = user.id;
      req.session.userRole = user.role;
      req.session.userName = user.full_name;
      if (remember_me) {
        req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 30; // 30 days
      }

      req.flash('success', `Welcome back, ${user.full_name}!`);
      if (user.role === 'admin') return res.redirect('/admin');
      if (user.role === 'artist') return res.redirect('/artist/dashboard');
      return res.redirect('/customer/dashboard');
    } catch (err) {
      next(err);
    }
  },

  getRegisterStep1(req, res) {
    if (req.session.userId) return res.redirect('/');
    res.render('auth/register-step1', { title: 'Register - Upload NID' });
  },

  async postRegisterStep1(req, res) {
    try {
      const { role, full_name, phone, email, location } = req.body;
      if (!['artist', 'customer'].includes(role)) {
        req.flash('error', 'Invalid role selected.');
        return res.redirect('/register');
      }
      if (!full_name || !phone || !email) {
        req.flash('error', 'Name, phone, and email are required.');
        return res.redirect('/register');
      }

      const files = req.files;
      if (!files || !files.nid_front || files.nid_front.length === 0) {
        req.flash('error', 'NID front image is required.');
        return res.redirect('/register');
      }

      const frontPath = files.nid_front[0].path;
      const backPath = files.nid_back ? files.nid_back[0].path : null;
      const frontRelative = '/uploads/nid/' + path.basename(frontPath);
      const backRelative = backPath ? '/uploads/nid/' + path.basename(backPath) : null;

      req.flash('info', 'Processing NID with OCR... This may take a moment.');

      const ocrData = await ocrService.extractNIDData(frontPath, backPath);

      req.session.nidData = {
        role,
        full_name,
        phone,
        email,
        location: location || '',
        nidFrontImage: frontRelative,
        nidBackImage: backRelative,
        rawText: ocrData.rawText,
        nidNumber: ocrData.nidNumber,
        name: ocrData.name || full_name,
        dateOfBirth: ocrData.dateOfBirth,
        fatherName: ocrData.fatherName,
        motherName: ocrData.motherName,
        address: ocrData.address || location || '',
      };

      res.redirect('/register/verify');
    } catch (err) {
      req.flash('error', 'Failed to process NID image. Please try again with a clearer image.');
      res.redirect('/register');
    }
  },

  getRegisterStep2(req, res) {
    if (!req.session.nidData) {
      req.flash('error', 'Please start registration from the beginning.');
      return res.redirect('/register');
    }
    res.render('auth/register-step2', {
      title: 'Register - Complete Profile',
      nidData: req.session.nidData,
    });
  },

  async postRegisterStep2(req, res) {
    if (!req.session.nidData) {
      req.flash('error', 'Session expired. Please start registration again.');
      return res.redirect('/register');
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      errors.array().forEach(e => req.flash('error', e.msg));
      return res.redirect('/register/verify');
    }

    const {
      full_name, email, phone, password, nid_number,
      name_on_nid, date_of_birth, father_name, mother_name, address,
    } = req.body;
    const { role, nidFrontImage, nidBackImage, rawText,
            full_name: sessionName, email: sessionEmail, phone: sessionPhone } = req.session.nidData;
    const finalName  = full_name  || sessionName;
    const finalEmail = email      || sessionEmail;
    const finalPhone = phone      || sessionPhone;

    try {
      const existingNID = await NIDVerification.findByNIDNumber(nid_number);
      if (existingNID) {
        req.flash('error', 'This NID number is already registered in the system.');
        return res.redirect('/register/verify');
      }

      const existingUser = await User.findByEmail(finalEmail);
      if (existingUser) {
        req.flash('error', 'This email address is already registered.');
        return res.redirect('/register/verify');
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const userId = await User.create({ full_name: finalName, email: finalEmail, phone: finalPhone, password_hash: passwordHash, role });

      let parsedDOB = null;
      if (date_of_birth) {
        const d = new Date(date_of_birth);
        if (!isNaN(d.getTime())) parsedDOB = d.toISOString().split('T')[0];
      }

      await NIDVerification.create({
        user_id: userId,
        nid_number,
        name_on_nid,
        date_of_birth: parsedDOB,
        father_name,
        mother_name,
        address,
        nid_front_image: nidFrontImage,
        nid_back_image: nidBackImage,
        ocr_raw_text: rawText,
      });

      // Activate immediately — NID verification continues in background
      await User.updateStatus(userId, 'active');

      if (role === 'artist') {
        await Artist.create(userId);
      }

      delete req.session.nidData;

      // Auto-login after registration
      req.session.userId   = userId;
      req.session.userRole = role;
      req.session.userName = finalName;

      req.flash('success', `Welcome to MehediHub, ${finalName}! Your NID is under review.`);
      if (role === 'artist') return res.redirect('/artist/dashboard');
      return res.redirect('/customer/dashboard');
    } catch (err) {
      req.flash('error', 'Registration failed: ' + err.message);
      res.redirect('/register/verify');
    }
  },

  getPending(req, res) {
    res.render('auth/pending', { title: 'Registration Pending - MehediHub' });
  },

  postLogout(req, res) {
    req.session.destroy(() => {
      res.redirect('/login');
    });
  },
};

module.exports = authController;
