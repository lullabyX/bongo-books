module.exports = async (req, res, next) => {
	if (!req.session.isLoggedIn) {
		return res.status(401).redirect('/auth/login');
	}
	if (req.session.user.userType !== 'admin') {
		req.flash('error', 'Unathorized!');
		await req.session.save();
		return res.status(401).redirect('/');
	}
	next();
};
