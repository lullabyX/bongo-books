const bcrypt = require('bcrypt');
const SibApiV3Sdk = require('sib-api-v3-sdk');
const crypto = require('crypto');
const {Op} = require('sequelize');

const User = require('../models/user');
const PendingUser = require('../models/pending-user');
const config = require('../config'); // create a config.js file in root folder containing obeject
// with your SendInBlue api key as "SIB_API_KEY" and export here

const defaultClient = SibApiV3Sdk.ApiClient.instance;

const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = config.SIB_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

let emailVerification = new SibApiV3Sdk.SendSmtpEmail();
let confirmationEmail = new SibApiV3Sdk.SendSmtpEmail();
let passwordResetEmail = new SibApiV3Sdk.SendSmtpEmail();

exports.getLogin = async (req, res, next) => {
    try {
        res.status(200).render('auth/login', {
            pageTitle: 'Login',
            path: '/login',
        });
    } catch (err) {
        console.log(err);
    };
};

exports.postLogin = async (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;

    try {
        const user = await User.findOne({where: {email: email}});
        if (!user) {
            return res.status(422).redirect('/signup');
        };
        const storedPassword = user.password;
        const doMatch = await bcrypt.compare(password, storedPassword);
        if (!doMatch) {
            return res.status(404).redirect('/login');
        }
        req.session.user = user;
        req.session.isLoggedIn = true;
        await req.session.save();
        res.status(200).redirect('/');

    } catch (err) {
        console.log(err);
    };
};

exports.getSignup = async (req, res, next) => {
    try {
        res.status(200).render('auth/signup', {
            pageTitle: 'Sign Up',
            path: '/signup',
        });
    } catch (err) {
        console.log(err);
    };
};

exports.postSignup = async (req, res, next) => {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;

    try {
        const doesExist = await User.findOne({where: {email: email}});
        if (doesExist) {
            req.flash('error', 'Account already exists with the E-mail')
            await req.session.save();
            return res.status(422).redirect('/login');
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const buffer = await crypto.randomBytes(32);
        const token = buffer.toString('hex');
        const pendingUser = await PendingUser.findOne({where: {email: email}});

        if (!pendingUser) {
            await PendingUser.create({
                name: name,
                email: email,
                password: hashedPassword,
                token: token,
                tokenTimeout: Date.now() + 3600000,
            });
        } else {
            alreadyPending.token = token;
            alreadyPending.tokenTimeout = Date.now() + 36;
            await pendingUser.save();
        }

        req.flash('success', 'Verification link sent to email!');
        await req.session.save();
        res.status(202).redirect('/signup');
        emailVerification = {
            to: [{
                email: email,
                name: name,
            }],
            templateId: 4,
            params: {
                FULLNAME: name,
                TOKEN: 'http://localhost:8080/verification/' + token,
                EMAIL: email,
                BONGOBOOKSURL: 'http://localhost:8080',
            },
        };
        const data = await apiInstance.sendTransacEmail(emailVerification);
        console.log('Confirmation Sent! Returned data ' + JSON.stringify(data));

    } catch (err) {
        console.log(err);
    }
};

exports.getVerification = async (req, res, next) => {
    const token = req.params.token;
    try {
        const pendingUser = await PendingUser.findOne({
            where: {
                token: token,
                tokenTimeout: {
                    [Op.gt]: Date.now(),
                },
            }
        });
        if (!pendingUser) {
            req.flash('error', 'Invalid request or reset link has expired');
            await req.session.save();
            return res.status(401).redirect('/signup');
        }
        const user = await User.create({
            name: pendingUser.name,
            email: pendingUser.email,
            password: pendingUser.password,
        });
        await pendingUser.destroy();
        await user.createCart();

        req.flash('success', 'Email Verified!');
        await req.session.save();
        res.status(202).redirect('/login');
        console.log(user.email);

        confirmationEmail = {
            to: [{
                email: user.email,
                name: user.name,
            }],
            templateId: 5,
            params: {
                FULLNAME: user.name,
                EMAIL: user.email,
                LOGIN: 'http://localhost:8080/login',
                BONGOBOOKSURL: 'http://localhost:8080',
            },
        };
        const data = await apiInstance.sendTransacEmail(confirmationEmail);
        console.log('Confirmation Sent! Returned data ' + JSON.stringify(data));
    } catch (err) {
        console.log(err);
    }
}

exports.postSignout = async (req, res, next) => {
    try {
        await req.session.destroy();
        res.status(200).redirect('/');
    } catch (err) {
        console.log(err);
    };
};

exports.getPasswordReset = async (req, res, next) => {
    try {
        res.status(200).render('auth/reset', {
            pageTitle: 'Request Password Reset',
            path: '/reset',
        })
    } catch (err) {
        console.log(err);
    }
};

exports.postPasswordReset = async (req, res, next) => {
    const email = req.body.email;
    try {
        const user = await User.findOne({
            where: {email: email}
        });
        if (!user) {
            req.flash('error', 'Account not found associated with the E-mail');
            await req.session.save();
            return res.status(401).redirect('/reset')
        }
        const buffer = await crypto.randomBytes(32);
        const token = buffer.toString('hex');
        user.resetToken = token;
        user.resetTokenTimeout = Date.now() + 3600000; // 1 hour
        await user.save();
        await req.session.save();
        res.status(202).redirect('/reset');
        passwordResetEmail = {
            to: [{
                email: email,
                name: user.name,
            }],
            templateId: 3,
            params: {
                FULLNAME: user.name,
                TOKEN: 'http://localhost:8080/reset/' + token,
                BONGOBOOKSURL: 'http://localhost:8080',
                EMAIL: user.email,
            },
        };
        const data = await apiInstance.sendTransacEmail(passwordResetEmail);
        console.log('Reset Link Sent! Returned data ' + JSON.stringify(data));


    } catch (err) {
        console.log(err);
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
            }
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
        console.log(err);
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
            }
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
        console.log(err);
    }
}