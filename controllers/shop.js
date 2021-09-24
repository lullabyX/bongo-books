const Book = require('../models/book')

exports.getIndex = async (req, res, next) => {
    try {
        const books = await Book.findAll();
        console.log(books);
        res.status(200).render('shop/index', {
            books: books,
            pageTitle: "BongoBooks",
            path: '/',
        })
    } catch (err) {
        console.log(err);
    };
}

exports.getBooks = async (req, res, next) => {
    try {
        const books = await Book.findAll();
        console.log(books);
        res.status(200).render('shop/index', {
            books: books,
            pageTitle: "Shop Page",
            path: '/books',
        })
    } catch (err) {
        console.log(err);
    };
}