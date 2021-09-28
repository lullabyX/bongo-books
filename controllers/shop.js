const Book = require('../models/book')

exports.getIndex = async (req, res, next) => {
    try {
        const books = await Book.findAll();
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
        res.status(200).render('shop/books', {
            books: books,
            pageTitle: "Shop Page",
            path: '/books',
        })
    } catch (err) {
        console.log(err);
    };
}

exports.getBook = async (req, res, next) => {
    const bookId = req.params.bookId;
    try {
        const book = await Book.findByPk(bookId);
        res.status(200).render('shop/book-detail', {
            book: book,
            pageTitle: book.title,
            path: '/books',
        })
    } catch (err) {
        console.log(err);
    }
};

exports.getCart = async (req, res, next) => {
    try {
        const cart = await req.user.getCart;
        const books = await cart.getBooks;

        res.status(200).render('shop/cart', {
            books: books,
            pageTitle: 'My Cart',
            path: '/cart',
        });
    } catch (err) {
        console.log(err);
    }
};

exports.postCart = async (req, res, next) => {
    const bookId = req.body.bookId;
    let newQty = 1;
    try {
        const cart = await req.user.getCart();
        const books = await cart.getBooks({where: {id: bookId}});
        let book = books[0];
        if (book) {
            const oldQty = book.cartItem.quantity;
            newQty += oldQty;
        } else {
            book = await Book.findByPk(bookId);
        };
        await cart.addBook(book, {
            through: {quantity: newQty}
        });
        res.status(202).redirect('/cart');
    } catch (err) {
        console.log(err);
    };
};

exports.postCartDeleteItem = async (req, res, next) => {
    const bookId = req.body.bookId;

    try {
        const cart = await req.user.getCart();
        const books = await cart.getBooks({where: {id: bookId}});
        let book = books[0];
        await book.cartItem.destroy();
        res.status(202).redirect('/cart');
    } catch (err) {
        console.log(err);
    }
};

exports.getOrders = async (req, res, next) => {
    try {
        const orders = await req.user.getOrders({include: Book});

        res.status(200).render('shop/orders', {
            orders: orders,
        });
    } catch (err) {
        console.log(err);
    };
};

exports.postOrder = async (req, res, next) => {
    try {
        const cart = await req.user.getCart();
        const books = await cart.getBooks();
        const order = await req.user.createOrder();
        await order.addBook(books.map(book => {
            book.orderItem = {quantity: book.cartItem.quantity};
            return book;
        }));
        await cart.setBooks(null);
        res.status(202).redirect('/orders');
    } catch (err) {
        console.log(err);
    };
};