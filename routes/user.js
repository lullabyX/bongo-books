const express = require('express');

const router = express.Router();

const userController = require('../controllers/user')
const isAuth = require('../middleware/isAuth');

// GET -> /user/cart
router.get('/cart', isAuth, userController.getCart);

// POST -> /user/cart NOTE: need bookId as "bookId" passed through body
router.post('/cart', isAuth, userController.postCart);

// POST -> /user/cart-delete-item
router.post('/cart-delete-item', isAuth, userController.postCartDeleteItem);

// GET -> /user/orders
router.get('/orders', isAuth, userController.getOrders);

// POST -> /user/orders
router.post('/orders', isAuth, userController.postOrder);

// GET -> /user/add-book
router.get('/add-book', isAuth, userController.getAddBook);

// POST -> /user/add-book
router.post('/add-book', isAuth, userController.postAddBook);

// GET -> /user/edit-book
router.get('/edit-book', isAuth, userController.getEditBook);

// POST -> /user/edit-book
router.post('/edit-book', isAuth, userController.postEditBook);

// POST -> /user/delete-book
router.post('/delete-book', isAuth, userController.postDeleteBook);

// GET -> /user/pending-books
router.get('/pending-books', isAuth, userController.getPendingBooks);

// POST -> /user/delete-pending-book
router.post(
	'/delete-pending-book',
	isAuth,
	userController.postDeletePendingBook
);

module.exports = router;
