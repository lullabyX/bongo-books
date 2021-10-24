const express = require('express');
const { body } = require('express-validator');

const router = express.Router();

const userController = require('../controllers/user');
const uploadController = require('../controllers/upload');
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
router.post(
	'/add-book',
	[body('price').isFloat().withMessage('Price must be floating point')],
	isAuth,
	uploadController.multiple,
	userController.postAddBook
);

// GET -> /user/edit-book
router.get('/edit-book/:bookId', isAuth, userController.getEditBook);

// POST -> /user/edit-book
router.post(
	'/edit-book',
	[body('price').isFloat().withMessage('Price must be floating point')],
	isAuth,
	uploadController.multiple,
	userController.postEditBook
);

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
