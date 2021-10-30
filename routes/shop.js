const express = require('express');

const router = express.Router();

const shopController = require('../controllers/shop');

// GET -> / loads the front/index page
router.get('/', shopController.getIndex);

// GET -> /books lists all the books
router.get('/books', shopController.getBooks);

// GET -> /books/bookId show details of a book
router.get('/book-detail/:bookId', shopController.getBook);

// GET -> /authors lists all the authors
router.get('/authors', shopController.getAuthors);

// GET -> /books/author?id= lists all the books
router.get('/books/author', shopController.getAuthorBooks);

// GET -> /books lists all the books
router.get('/publications', shopController.getPublications);

// GET -> /books lists all the books
router.get('/books/publication', shopController.getPublicationBooks);

// GET -> /books lists all the books
router.get('/genres', shopController.getGenres);

// GET -> /books lists all the books
router.get('/books/genre', shopController.getGenreBooks);

module.exports = router;