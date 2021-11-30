const express = require('express');
const { body } = require('express-validator');

const router = express.Router();

const userController = require('../controllers/user');
const uploadController = require('../controllers/upload');
const isAuth = require('../middleware/isAuth');

// GET -> /user/books
router.get('/books', isAuth, userController.getBooks);

// GET -> /user/cart
router.get('/cart', isAuth, userController.getCart);

// POST -> /user/cart NOTE: need bookId as "bookId" passed through body
router.post('/cart', isAuth, userController.postCart);

// POST -> /user/cart-delete-item
router.post('/cart-delete-item', isAuth, userController.postCartDeleteItem);

// GET -> /user/orders
router.get('/orders', isAuth, userController.getOrders);

// // POST -> /user/orders
// router.post('/orders', isAuth, userController.postOrder);

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

// GET -> /user/profile
router.get('/profile', isAuth, userController.getProfile);

// POST -> /user/profile
router.post(
	'/profile',
	isAuth,
	uploadController.single,
	userController.postProfile
);

// POST -> /user/profile/random-avatar
router.post('/profile/random-avatar', isAuth, userController.postRandomAvatar);

// POST -> /user/profile/reset-avatar
router.post('/profile/reset-avatar', isAuth, userController.resetAvatar);

// POST -> /user/profile/add-address
router.post('/profile/add-address', isAuth, userController.postAddAddress);

// POST -> /user/profile/edit-address
router.post('/profile/edit-address', isAuth, userController.postEditAddress);

// POST -> /user/profile/delete-address
router.post(
	'/profile/delete-address',
	isAuth,
	userController.postDeleteAddress
);

// GET -> /user/checkout/shipping
router.get('/checkout/shipping', isAuth, userController.getShipping);

// GET -> /user/checkout?id=addressId
router.get('/checkout', isAuth, userController.getCheckout);

// GET -> /user/checkout/success?id=addressId
router.get('/checkout/success', isAuth, userController.postOrder);

// GET -> /user/checkout/cancel
router.get('/checkout/cancel', isAuth, userController.getCheckout);

// GET -> /user/order/:orderId
router.get('/order/:orderId', isAuth, userController.getInvoice);

// POST -> /user/rating/add
router.post('/rating/add', isAuth, userController.postRating);

// POST -> /user/review/add
router.post('/review/add', isAuth, userController.postReview);

module.exports = router;
