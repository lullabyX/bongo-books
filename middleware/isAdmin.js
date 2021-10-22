module.exports = async (req, res, next) => {
	try {
		if (!req.session.isLoggedIn) {
			return res.status(401).redirect('/auth/login');
		}
		if (req.session.user.userType !== 'admin') {
			req.flash('error', 'Unathorized!');
			await req.session.save();
			return res.status(401).redirect('/');
		}
		next();
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};
