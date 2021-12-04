module.exports = async (req, res, next) => {
	try {
		res.locals.isAuthenticated = req.session.isLoggedIn;
		res.locals.isAdmin = false;
		if (req.session.user) {
			res.locals.isAdmin = req.session.user.userType === 'admin';
			res.locals.username = req.session.user.username;
			res.locals.avatar = req.session.user.avatar;
			res.locals.cartTotalItems = req.user.cartTotalItems;
		}
		res.locals.csrfToken = 'asdfasdf'; //req.csrfToken(); //uncomment for csrf
		// console.log(req.flash('error'));
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
