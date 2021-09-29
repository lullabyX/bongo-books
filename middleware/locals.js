module.exports = async (req, res, next) => {
    res.locals.isAuthenticated = true;
    //res.locals.csrfToken = req.csrfToken(); //uncomment for csrf
    res.locals.errorMessage = req.flash('error');
    res.locals.successMessage = req.flash('success');
    next();
};