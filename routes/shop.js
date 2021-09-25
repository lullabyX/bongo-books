const express = require('express');

const router = express.Router();

const shopController = require('../controllers/shop');

// GET -> / loads the front/index page
router.get('/', shopController.getIndex);

// GET -> /books lists all the products
router.get('/books', shopController.getBooks);

// GET -> /books/productId show details of a book
router.get('/book-detail/:bookId', shopController.getBook);

// GET -> /cart
router.get('/cart', shopController.getCart);

// POST -> /books/cart NOTE: need bookId as "id" passed through body
router.post('/cart', shopController.postCart);

module.exports = router;