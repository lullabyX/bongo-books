const express = require('express');
const { body } = require('express-validator');

const authController = require('../controllers/auth');
const isAuth = require('../middleware/isAuth');
const User = require('../models/user');

const router = express.Router();

// GET -> /auth/login
router.get('/login', authController.getLogin);

// POST -> /auth/login
router.post(
	'/login',
	[
		body('email')
			.isEmail()
			.withMessage('Please enter a valid E-Mail.')
			.custom((value, { req }) => {
				return User.findOne({ email: value }).then((user) => {
					if (!user) {
						return Promise.reject(
							'Account not found with the email'
						);
					}
				});
			})
			.normalizeEmail(),
		body('password').trim(),
	],
	authController.postLogin
);

// GET -> /auth/signup
router.get('/signup', authController.getSignup);

// POST -> /auth/signup
router.post(
	'/signup',
	[
		body('username')
			.not()
			.isEmpty()
			.withMessage('Username cannot be empty.')
			.custom((value, { req }) => {
				return User.findOne({ username: value }).then((user) => {
					if (user) {
						return Promise.reject('Username already in use.');
					}
				});
			})
			.trim(),
		body('email')
			.isEmail()
			.withMessage('Please enter a valid E-Mail.')
			.custom((value, { req }) => {
				return User.findOne({ email: value }).then((user) => {
					if (user) {
						return Promise.reject(
							'Account already exist with the E-Mail.'
						);
					}
				});
			})
			.normalizeEmail(),
		body('password')
			.isLength({ min: 8 })
			.withMessage('Password must be atleast 8 characters long.')
			.trim(),
		body('confirmPassword')
			.custom((value, { req }) => {
				if (value != req.body.password) {
					throw new Error('Passwords do not match!');
				}
				return true;
			})
			.trim(),
	],
	authController.postSignup
);

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