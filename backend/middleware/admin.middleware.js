'use strict';

const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') return next();
  res.status(403).json({ error: 'Erisim reddedildi, Yonetici yetkisi gereklidir!' });
};

module.exports = adminMiddleware;
