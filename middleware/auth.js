function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    req.flash('error', 'Please log in to access this page.');
    return res.redirect('/login');
  }
  next();
}

module.exports = { requireAuth };
