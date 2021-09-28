const express = require('express');

const router = express.Router();

const shopController = require('../controllers/shop');

// GET -> / loads the front/index page
router.get('/', shopController.getIndex);

// GET -> /books lists all the books
router.get('/books', shopController.getBooks);

// GET -> /books/bookId show details of a book
router.get('/book-detail/:bookId', shopController.getBook);

// GET -> /cart
router.get('/cart', shopController.getCart);

// POST -> /cart NOTE: need bookId as "id" passed through body
router.post('/cart', shopController.postCart);

// POST -> /cart-delete-item
router.post('/cart-delete-item', shopController.postCartDeleteItem);

// GET -> /orders
router.get('/orders', shopController.getOrders);

// POST -> /orders
router.post('/orders', shopController.postOrder);

module.exports = router;