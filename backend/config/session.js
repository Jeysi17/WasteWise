const session = require('express-session');

const ONE_HOUR = 60 * 60 * 1000;

const sessionMiddleware = session({
  name: 'wastewise.sid',
  secret: process.env.SESSION_SECRET || 'replace-with-a-long-random-secret',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: ONE_HOUR
  }
});

module.exports = sessionMiddleware;

