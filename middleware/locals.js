module.exports = async (req, res, next) => {
	res.locals.isAuthenticated = req.session.isLoggedIn;
	res.locals.isAdmin = false;
	if (req.session.user)
	{
		res.locals.isAdmin = (req.session.user.userType === 'admin');
	}
	//res.locals.csrfToken = req.csrfToken(); //uncomment for csrf
	res.locals.errorMessage = req.flash('error');
	res.locals.successMessage = req.flash('success');
	next();
};
