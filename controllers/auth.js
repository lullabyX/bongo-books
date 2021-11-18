require('dotenv').config();
const bcrypt = require('bcrypt');
const SibApiV3Sdk = require('sib-api-v3-sdk');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { validationResult } = require('express-validator');

const User = require('../models/user');

const defaultClient = SibApiV3Sdk.ApiClient.instance;

const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.SIB_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

let confirmationEmail = new SibApiV3Sdk.SendSmtpEmail();
let passwordResetEmail = new SibApiV3Sdk.SendSmtpEmail();

exports.getLogin = async (req, res, next) => {
	try {
		res.status(200).render('auth/login', {
			pageTitle: 'Login',
			path: '/login',
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.postLogin = async (req, res, next) => {
	const email = req.body.email;
	const password = req.body.password;

	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(422).json({
			message: errors.array(),
		});
	}

	try {
		const user = await User.findOne({ where: { email: email } });
		const storedPassword = user.password;
		const doMatch = await bcrypt.compare(password, storedPassword);
		if (!doMatch) {
			return res.status(404).redirect('/auth/login');
		}
		req.session.user = user;
		req.session.isLoggedIn = true;
		await req.session.save();
		res.status(200).redirect('/');
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.getSignup = async (req, res, next) => {
	try {
		res.status(200).render('auth/signup', {
			pageTitle: 'Sign Up',
			path: '/signup',
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.postSignup = async (req, res, next) => {
	const username = req.body.username;
	const email = req.body.email;
	const password = req.body.password;

	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(422).json({
			message: errors.array(),
		});
	}

	try {
		const hashedPassword = await bcrypt.hash(password, 12);
		const user = await User.create({
			username: username,
			email: email,
			password: hashedPassword,
			avatar: `https://avatars.dicebear.com/api/big-smile/:${username}.svg`,
		});
		await user.createCart();
		req.flash('success', 'Account Created!');
		await req.session.save();
		confirmationEmail = {
			to: [
				{
					email: email,
					name: username,
				},
			],
			templateId: process.env.SIB_SIGNUP_TEMPLATE_ID,
			params: {
				FULLNAME: username,
			},
		};
		const data = await apiInstance.sendTransacEmail(confirmationEmail);
		console.log('Confirmation Sent! Returned data ' + JSON.stringify(data));
		res.status(202).redirect('/');
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.postSignout = async (req, res, next) => {
	try {
		await req.session.destroy();
		res.status(200).redirect('/');
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.getPasswordReset = async (req, res, next) => {
	try {
		res.status(200).render('auth/reset', {
			pageTitle: 'Request Password Reset',
			path: '/reset',
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.postPasswordReset = async (req, res, next) => {
	const email = req.body.email;
	try {
		const user = await User.findOne({
			where: { email: email },
		});
		if (!user) {
			req.flash('error', 'Account not found associated with the E-mail');
			await req.session.save();
			return res.status(401).redirect('/reset');
		}
		const buffer = await crypto.randomBytes(32);
		const token = buffer.toString('hex');
		user.resetToken = token;
		user.resetTokenTimeout = Date.now() + 3600000; // 1 hour
		await user.save();
		await req.session.save();
		res.status(202).redirect('/reset');
		passwordResetEmail = {
			to: [
				{
					email: email,
					name: user.username,
				},
			],
			templateId: process.env.SIB_PASSWORD_RESET_TEMPLATE_ID,
			params: {
				FULLNAME: user.firstName + ' ' + user.lastName,
				TOKEN:
					process.env.HOST_PROTOCOL +
					'://' +
					process.env.HOST +
					':' +
					process.env.HOST_PORT +
					'/reset/' +
					token,
			},
		};
		const data = await apiInstance.sendTransacEmail(passwordResetEmail);
		console.log('Reset Link Sent! Returned data ' + JSON.stringify(data));
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.getResetNow = async (req, res, next) => {
	const token = req.params.token;
	try {
		const user = await User.findOne({
			where: {
				resetToken: token,
				resetTokenTimeout: {
					[Op.gt]: Date.now(),
				},
			},
		});
		if (!user) {
			req.flash('error', 'Invalid request or reset link has expired');
			await req.session.save();
			return res.status(401).redirect('/reset');
		}
		res.status(202).render('auth/reset-now', {
			pageTitle: 'Password Reset',
			path: '/reset-now',
			token: token,
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.postResetNow = async (req, res, next) => {
	const token = req.body.token;
	const newPassword = req.body.newPassword;
	const confirmNewPassword = req.body.confirmNewPassword;

	try {
		const user = await User.findOne({
			where: {
				resetToken: token,
				resetTokenTimeout: {
					[Op.gt]: Date.now(),
				},
			},
		});
		if (!user) {
			req.flash('error', 'Invalid request or reset link has expired');
			await req.session.save();
			return req.status(401).redirect('/reset');
		}
		const hashedPassword = await bcrypt.hash(newPassword, 12);
		user.password = hashedPassword;
		user.resetToken = null;
		user.resetTokenTimeout = null;
		await user.save();
		req.flash('success', 'Password changed!');
		await req.session.save();
		res.status(202).redirect('/login');
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};
