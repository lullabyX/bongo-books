const express = require('express');

const router = express.Router();

const shopController = require('../controllers/shop');

// GET -> / loads the front/index page
router.get('/', shopController.getIndex);

// GET -> /books lists all the books
router.get('/books', shopController.getBooks);

// GET -> /book-deta/bookId show details of a book
router.get('/book-detail/:bookId', shopController.getBook);

// GET -> /authors lists all the authors
router.get('/authors', shopController.getAuthors);

// GET -> /books/author?id= lists all the books under the author
router.get('/books/author', shopController.getAuthorBooks);

// GET -> /publications lists all the publications
router.get('/publications', shopController.getPublications);

// GET -> /books/publication?id= lists all the books under the publication
router.get('/books/publication', shopController.getPublicationBooks);

// GET -> /genres lists all the genres
router.get('/genres', shopController.getGenres);

// GET -> /booksgenre?id= lists all the books under the genre
router.get('/books/genre', shopController.getGenreBooks);

module.exports = router;