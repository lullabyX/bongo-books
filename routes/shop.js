const express = require('express');

const router = express.Router();

const shopController = require('../controllers/shop');

// GET -> / loads the front/index page
router.get('/', shopController.getIndex);

// GET -> /books lists all the books
router.get('/books', shopController.getBooks);

// GET -> /books/bookId show details of a book
router.get('/book-detail/:bookId', shopController.getBook);

module.exports = router;