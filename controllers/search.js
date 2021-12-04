const { Op } = require('sequelize');

const Book = require('../models/book');
const Genre = require('../models/genre');
const Tag = require('../models/tag');
const Publication = require('../models/publication');
const Author = require('../models/author');
const BookImage = require('../models/book-image');

function isFloat(n) {
	return Number(n) === n && n % 1 !== 0;
}

exports.getGeneralSearch = async (req, res, next) => {
	try {
		let terms = req.query.term;
		terms = terms.split(' ').map((term) => {
			return '%' + term + '%';
		});
		const books = await Book.findAll({
			include: [
				{
					model: Genre,
					subQuery: true,
				},
				{
					model: Publication,
					subQuery: true,
				},
				{
					model: Author,
					subQuery: true,
				},
				{
					model: Tag,
					subQuery: true,
				},
				{ model: BookImage },
			],
			where: {
				[Op.or]: [
					{
						title: {
							[Op.iLike]: { [Op.any]: terms },
						},
					},
					{
						description: {
							[Op.iLike]: { [Op.any]: terms },
						},
					},
					{
						publishDate: {
							[Op.iLike]: { [Op.any]: terms },
						},
					},
					{
						language: {
							[Op.iLike]: { [Op.any]: terms },
						},
					},
					{
						ISBN: {
							[Op.iLike]: { [Op.any]: terms },
						},
					},
					{
						'$genres.name$': {
							[Op.iLike]: { [Op.any]: terms },
						},
					},
					{
						'$genres.description$': {
							[Op.iLike]: { [Op.any]: terms },
						},
					},
					{
						'$authors.name$': {
							[Op.iLike]: { [Op.any]: terms },
						},
					},
					{
						'$authors.description$': {
							[Op.iLike]: { [Op.any]: terms },
						},
					},
					{
						'$tags.name$': {
							[Op.iLike]: { [Op.any]: terms },
						},
					},
					{
						'$publication.name$': {
							[Op.iLike]: { [Op.any]: terms },
						},
					},
					{
						'$publication.description$': {
							[Op.iLike]: { [Op.any]: terms },
						},
					},
				],
			},
		});
		res.status(200).render('shop/search', {
			books: books,
			pageTitle: 'Search',
			path: '/search',
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.getFilteredSearch = async (req, res, next) => {
	let terms = req.query.term || '';

	const author = req.query.author || '';
	let pricelow = req.query.pricelow || 0.0;
	let pricehigh = req.query.pricehigh || 9999999.0;
	const publication = req.query.publication || '';
	let publishDate = req.query.publishdate || '';
	const tag = req.query.tag || '';
	const genre = req.query.genre || '';

	let orderby = req.query.orderby || 'title';
	let ordertype = req.query.ordertype || 'ASC';

	terms = terms.split(' ').map((term) => {
		return '%' + term + '%';
	});

	try {
		//price range sanitization
		if (
			String(pricelow).includes('[a-zA-Z]+') == false &&
			String(pricelow).length >= 1
		) {
			pricelow = parseFloat(pricelow);
		} else {
			pricelow = 0.0;
		}
		if (
			String(pricehigh).includes('[a-zA-Z]+') == false &&
			String(pricehigh).length >= 1
		) {
			pricehigh = parseFloat(pricehigh);
		} else {
			pricehigh = 9999999.0;
		}
		//ordertype sanitization
		if (ordertype != 'asc' && ordertype != 'desc') {
			ordertype = 'ASC';
		}
		orderby =
			orderby.toString() == 'publishdate'
				? 'publishDate'
				: orderby.toString();
		orderby =
			orderby.toString() == 'createdat'
				? 'createdAt'
				: orderby.toString();
		orderby =
			orderby.toString() == 'sold' ? 'sellCount' : orderby.toString();
		const by = ['title', 'price', 'publishDate', 'createdAt', 'sellCount'];
		if (
			!by.find((val) => {
				return val == orderby;
			})
		) {
			orderby = 'title';
		}

		//publishDate sanitization
		// console.log('publishdate', String(publishDate).includes('[a-zA-Z]+'));
		if (
			String(publishDate).includes('[a-zA-Z]+') |
			(String(publishDate).length != 4)
		) {
			publishDate = '';
		}

		const books = await Book.findAll({
			order: [[orderby, ordertype]],
			include: [
				{
					model: Genre,
					subQuery: true,
				},
				{
					model: Publication,
					subQuery: true,
				},
				{
					model: Author,
					subQuery: true,
				},
				{
					model: Tag,
					subQuery: true,
				},
				{ model: BookImage },
			],
			where: {
				[Op.or]: [
					{
						title: {
							[Op.iLike]: { [Op.any]: terms },
						},
					},
					{
						description: {
							[Op.iLike]: { [Op.any]: terms },
						},
					},
					{
						publishDate: {
							[Op.iLike]: { [Op.any]: terms },
						},
					},
					{
						language: {
							[Op.iLike]: { [Op.any]: terms },
						},
					},
					{
						ISBN: {
							[Op.iLike]: { [Op.any]: terms },
						},
					},
					{
						'$genres.name$': {
							[Op.iLike]: { [Op.any]: terms },
						},
					},
					{
						'$genres.description$': {
							[Op.iLike]: { [Op.any]: terms },
						},
					},
					{
						'$authors.name$': {
							[Op.iLike]: { [Op.any]: terms },
						},
					},
					{
						'$authors.description$': {
							[Op.iLike]: { [Op.any]: terms },
						},
					},
					{
						'$tags.name$': {
							[Op.iLike]: { [Op.any]: terms },
						},
					},
					{
						'$publication.name$': {
							[Op.iLike]: { [Op.any]: terms },
						},
					},
					{
						'$publication.description$': {
							[Op.iLike]: { [Op.any]: terms },
						},
					},
				],
				[Op.and]: [
					{
						publishDate: {
							[Op.iLike]: '%' + publishDate + '%',
						},
					},
					{
						price: {
							[Op.gte]: parseFloat(pricelow),
						},
					},
					{
						price: {
							[Op.lte]: parseFloat(pricehigh),
						},
					},
					{
						'$genres.name$': {
							[Op.iLike]: '%' + genre + '%',
						},
					},
					{
						'$authors.name$': {
							[Op.iLike]: '%' + author + '%',
						},
					},
					{
						'$tags.name$': {
							[Op.iLike]: '%' + tag + '%',
						},
					},
					{
						'$publication.name$': {
							[Op.iLike]: '%' + publication + '%',
						},
					},
				],
			},
		});
		res.status(200).render('shop/search', {
			books: books,
			pageTitle: 'Search',
			path: '/search',
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};
