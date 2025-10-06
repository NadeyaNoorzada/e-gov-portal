export function ensureAuth(req, res, next) {
  if (req.session?.user) return next();
  req.session.error = 'Please login first.';
  res.redirect('/login');
}

export function ensureRole(...roles) {
  return (req, res, next) => {
    const user = req.session?.user;
    if (user && roles.includes(user.role)) return next();
    req.session.error = 'Access denied.';
    res.redirect('/');
  };
}
