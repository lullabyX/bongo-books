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
        res.status(200).render('admin/edit-book', {
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

    try {
        await req.user.createBook({
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
};

exports.getEditBook = async (req, res, next) => {
    const editing = req.query.edit;
    const bookId = req.params.bookId;

    if (editing) {
        try {
            const book = await Book.findOne({
                where: {
                    id: bookId,
                    userId: req.user.id,
                }
            });
            if (book) {
                res.status(200).render('admin/edit-book', {
                    book: book,
                    pageTitle: "Editing " + book.title,
                    path: '/admin/edit-book',
                });
            } else {
                req.flash('error', 'Unauthorized!')
                await req.session.save();
                res.status(404).redirect('/');
            }


        } catch (err) {
            console.log(err);
        };
    } else {
        res.redirect('/');
    };

}

exports.postEditBook = async (req, res, next) => {
    const bookId = req.body.id;
    const updatedTitle = req.body.title;
    const updatedImageUrl = req.body.imageUrl;
    const updatedPrice = req.body.price;
    const updatedISBN = req.body.ISBN;
    const updatedAuthorId = req.body.authorId;
    const updatedDescription = req.body.description;

    try {
        const book = await Book.findOne({
            where: {
                id: bookId,
                userId: req.user.id,
            }
        });

        if (book) {
            book.title = updatedTitle;
            book.imageUrl = updatedImageUrl;
            book.price = updatedPrice;
            book.ISBN = updatedISBN;
            book.authorId = updatedAuthorId;
            book.description = updatedDescription;

            await book.save();
            res.status(202).redirect('/admin/books');
        } else {
            req.flash('error', 'Unauthorized!')
            await req.session.save();
            res.status(404).redirect('/admin/books');
        };

    } catch (err) {
        console.log(err);
    };
};

exports.postDeleteBook = async (req, res, next) => {
    const bookId = req.body.bookId;

    try {
        const book = await Book.findOne({
            where: {
                id: bookId,
                userId: req.user.id,
            }
        });
        if (!book) {
            req.flash('error', 'Unauthorized!')
            await req.session.save();
            res.status(404).redirect('/admin/books');
        } else {
            await book.destroy();
            res.status(200).redirect('/admin/books');
        };
    } catch (err) {
        console.log(err);
    };
}


