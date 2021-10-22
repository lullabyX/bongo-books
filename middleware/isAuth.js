module.exports = async (req, res, next) => {
	try {
		if (!req.session.isLoggedIn) {
			return res.status(401).redirect('/auth/login');
		}
		next();
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};
