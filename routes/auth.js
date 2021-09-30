const express = require('express');

const authController = require('../controllers/auth');
const isAuth = require('../middleware/isAuth');

const router = express.Router();

// GET -> /login
router.get('/login', authController.getLogin);

// POST -> /login
router.post('/login', authController.postLogin);

// GET -> /signup
router.get('/signup', authController.getSignup);

// POST -> /signup
router.post('/signup', authController.postSignup);

// GET -> /verification
router.get('/verification/:token', authController.getVerification);

// POST -> /logout
router.post('/logout', isAuth, authController.postSignout);

// GET -> /reset
router.get('/reset', authController.getPasswordReset);

// POST -> /reset
router.post('/reset', authController.postPasswordReset);

// GET -> /reset/:token
router.get('/reset/:token', authController.getResetNow);

// POST -> /reset-now
router.post('/reset-now', authController.postResetNow);

module.exports = router;