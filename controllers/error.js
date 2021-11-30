exports.notFound = (req, res, next) => {
	res.status(404).render('404.ejs', {
		pageTitle: '404 | Not Found',
		path: '/404',
	});
};

exports.errorHandler = (error, req, res, next) => {
	res.status(500).render('500.ejs', {
		pageTitle: '500 | Internal Error',
		path: '/500',
	});
};
