require('dotenv').config();
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const path = require('path');

const app = express();

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// Body parsers
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Method override (for DELETE via forms)
app.use(methodOverride('_method'));

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'mehedihub-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
  },
}));

// Flash messages
app.use(flash());

// Global locals middleware
app.use(async (req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.info = req.flash('info');
  res.locals.currentUser = req.session.userId ? {
    id: req.session.userId,
    name: req.session.userName,
    role: req.session.userRole,
  } : null;

  // Cart count for customers
  if (req.session.userRole === 'customer') {
    try {
      const db = require('./config/db');
      const [rows] = await db.query(
        'SELECT COALESCE(SUM(quantity), 0) as cnt FROM cart_items WHERE customer_id = ?',
        [req.session.userId]
      );
      res.locals.cartCount = rows[0].cnt;
    } catch {
      res.locals.cartCount = 0;
    }
  } else {
    res.locals.cartCount = 0;
  }

  next();
});

// Routes
app.use('/', require('./routes/public.routes'));
app.use('/', require('./routes/auth.routes'));
app.use('/admin', require('./routes/admin.routes'));
app.use('/artist', require('./routes/artist.routes'));
app.use('/customer', require('./routes/customer.routes'));
app.use('/ocr', require('./routes/ocr.routes'));

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { title: '404 - Page Not Found', layout: 'layouts/main' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', {
    title: 'Error',
    layout: 'layouts/main',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong.' : err.message,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`MehediHub running at http://localhost:${PORT}`);
});

module.exports = app;
