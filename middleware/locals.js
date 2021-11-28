module.exports = async (req, res, next) => {
	try {
		res.locals.isAuthenticated = req.session.isLoggedIn;
		res.locals.isAdmin = false;
		if (req.session.user) {
			res.locals.isAdmin = req.session.user.userType === 'admin';
			res.locals.username = req.session.user.username;
			req.locals.avatar = req.session.user.avatar;
		}
		res.locals.csrfToken = req.csrfToken(); //uncomment for csrf
		res.locals.errorMessage = req.flash('error');
		res.locals.successMessage = req.flash('success');
		next();
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};
