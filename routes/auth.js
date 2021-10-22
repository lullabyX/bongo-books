const express = require('express');

const authController = require('../controllers/auth');
const isAuth = require('../middleware/isAuth');

const router = express.Router();

// GET -> /auth/login
router.get('/login', authController.getLogin);

// POST -> /auth/login
router.post('/login', authController.postLogin);

// GET -> /auth/signup
router.get('/signup', authController.getSignup);

// POST -> /auth/signup
router.post('/signup', authController.postSignup);

// POST -> /auth/logout
router.post('/logout', isAuth, authController.postSignout);

// GET -> /auth/reset
router.get('/reset', authController.getPasswordReset);

// POST -> /auth/reset
router.post('/reset', authController.postPasswordReset);

// GET -> /auth/reset/:token
router.get('/reset/:token', authController.getResetNow);

// POST -> /auth/reset-now
router.post('/reset-now', authController.postResetNow);

module.exports = router;