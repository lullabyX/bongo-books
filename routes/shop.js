const express = require('express');

const router = express.Router();

const shopController = require('../controllers/shop');
const isAuth = require('../middleware/isAuth');

// GET -> / loads the front/index page
router.get('/', shopController.getIndex);

// GET -> /books lists all the books
router.get('/books', shopController.getBooks);

// GET -> /books/bookId show details of a book
router.get('/book-detail/:bookId', shopController.getBook);

// GET -> /cart
router.get('/cart', isAuth, shopController.getCart);

// POST -> /cart NOTE: need bookId as "bookId" passed through body
router.post('/cart', isAuth, shopController.postCart);

// POST -> /cart-delete-item
router.post('/cart-delete-item', isAuth, shopController.postCartDeleteItem);

// GET -> /orders
router.get('/orders', isAuth, shopController.getOrders);

// POST -> /orders
router.post('/orders', isAuth, shopController.postOrder);

module.exports = router;