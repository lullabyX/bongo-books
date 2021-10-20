exports.notFound = (req, res, next) => {
	res.status(404).render('404.ejs', {
		pageTitle: '404 | Not Found',
		path: '/404',
	});
};

exports.errorHandler = (error, req, res, next) => {
	res.status(error.statusCode).json({
		message: error.message,
		data: error.data,
	});
	console.log(error.message);
};
