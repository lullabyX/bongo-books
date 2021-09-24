const User = require('../models/user');
const Book = require('../models/book');

exports.getBooks = async (req, res, next) => {
    try {
        const books = await Book.findAll({where: {userId: req.user.id}});
        res.status(200).render('admin/books', {
            books: books,
            pageTitle: "Admin Books",
            path: '/admin/books',
        });
    } catch (err) {
        console.log(err);
    }
};

exports.getAddBook = async (req, res, next) => {
    try {
        res.status(200).render('admin/add-book', {
            pageTitle: 'Add Book',
            path: '/admin/add-book',
        })
    } catch (err) {
        console.log(err);
    }
};

exports.postAddBook = async (req, res, next) => {
    const title = req.body.title;
    const imageUrl = req.body.imageUrl;
    const price = req.body.price;
    const ISBN = req.body.ISBN;
    const authorId = req.body.authorId;
    const description = req.body.description;

    console.log(title);

    try {
        const result = await req.user.createBook({
            title: title,
            imageUrl: imageUrl,
            price: price,
            ISBN: ISBN,
            authorId: authorId,
            description: description
        });
        res.status(202).redirect('/');
    } catch (err) {
        console.log(err);
    }
}


