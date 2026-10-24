'use strict';
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ error: 'Erisim reddedildi, token bulunamadi!' });
  try {
    req.user = jwt.verify(token.replace('Bearer ', ''), JWT_SECRET);
    next();
  } catch {
    res.status(400).json({ error: 'Gecersiz token!' });
  }
};

module.exports = authMiddleware;
