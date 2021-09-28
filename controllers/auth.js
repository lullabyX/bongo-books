const bcrypt = require('bcrypt');

const User = require('../models/user');

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
            return res.status(422).redirect('/login');
        }
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await User.create({
            name: name,
            email: email,
            password: hashedPassword,
        });
        await user.createCart();
        res.status(202).redirect('/');
    } catch (err) {
        console.log(err);
    }
};

exports.postSignout = async (req, res, next) => {
    try {
        await req.session.destroy();
        res.status(200).redirect('/');
    } catch (err) {
        console.log(err);
    };
};