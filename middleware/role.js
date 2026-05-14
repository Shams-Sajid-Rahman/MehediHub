function requireRole(role) {
  return function (req, res, next) {
    if (req.session.userRole !== role) {
      return res.status(403).render('error', {
        title: '403 Forbidden',
        message: 'You do not have permission to access this page.',
      });
    }
    next();
  };
}

module.exports = { requireRole };
