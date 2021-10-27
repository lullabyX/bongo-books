const { Op, Model } = require('sequelize');
const Book = require('../models/book');
const Genre = require('../models/genre');
const Tag = require('../models/tag');
const Publication = require('../models/publication');
const Author = require('../models/author');

function isFloat(n) {
	return Number(n) === n && n % 1 !== 0;
}

exports.getGeneralSearch = async (req, res, next) => {
	try {
		let terms = req.query.term;
		terms = terms.split(' ').map((term) => {
			return '%' + term + '%';
		});
		console.log(terms);
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
			],
			where: {
				[Op.or]: [
					{
						title: {
							[Op.like]: { [Op.any]: terms },
						},
					},
					{
						description: {
							[Op.like]: { [Op.any]: terms },
						},
					},
					{
						publishDate: {
							[Op.like]: { [Op.any]: terms },
						},
					},
					{
						language: {
							[Op.like]: { [Op.any]: terms },
						},
					},
					{
						ISBN: {
							[Op.like]: { [Op.any]: terms },
						},
					},
					{
						'$genres.name$': {
							[Op.like]: { [Op.any]: terms },
						},
					},
					{
						'$genres.description$': {
							[Op.like]: { [Op.any]: terms },
						},
					},
					{
						'$authors.name$': {
							[Op.like]: { [Op.any]: terms },
						},
					},
					{
						'$authors.description$': {
							[Op.like]: { [Op.any]: terms },
						},
					},
					{
						'$tags.name$': {
							[Op.like]: { [Op.any]: terms },
						},
					},
					{
						'$publication.name$': {
							[Op.like]: { [Op.any]: terms },
						},
					},
					{
						'$publication.description$': {
							[Op.like]: { [Op.any]: terms },
						},
					},
				],
			},
		});
		res.status(200).json({
			message: 'success',
			books: books,
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.getFilteredSearch = async (req, res, next) => {
	let terms = req.query.term;

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
		if (ordertype !== 'ASC' || ordertype !== 'DSC') {
			ordertype = 'ASC';
		}
		orderby =
			orderby.toString() == 'publishdate'
				? 'publishDate'
				: orderby.toString();
		const by = ['title', 'price', 'publishDate', 'createdAt'];
		if (
			!by.find((val) => {
				return val == orderby;
			})
		) {
			orderby = 'title';
		}

		//publishDate sanitization
		console.log('publishdate', String(publishDate).includes('[a-zA-Z]+'));
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
			],
			where: {
				[Op.or]: [
					{
						title: {
							[Op.like]: { [Op.any]: terms },
						},
					},
					{
						description: {
							[Op.like]: { [Op.any]: terms },
						},
					},
					{
						publishDate: {
							[Op.like]: { [Op.any]: terms },
						},
					},
					{
						language: {
							[Op.like]: { [Op.any]: terms },
						},
					},
					{
						ISBN: {
							[Op.like]: { [Op.any]: terms },
						},
					},
					{
						'$genres.name$': {
							[Op.like]: { [Op.any]: terms },
						},
					},
					{
						'$genres.description$': {
							[Op.like]: { [Op.any]: terms },
						},
					},
					{
						'$authors.name$': {
							[Op.like]: { [Op.any]: terms },
						},
					},
					{
						'$authors.description$': {
							[Op.like]: { [Op.any]: terms },
						},
					},
					{
						'$tags.name$': {
							[Op.like]: { [Op.any]: terms },
						},
					},
					{
						'$publication.name$': {
							[Op.like]: { [Op.any]: terms },
						},
					},
					{
						'$publication.description$': {
							[Op.like]: { [Op.any]: terms },
						},
					},
				],
				[Op.and]: [
					{
						publishDate: {
							[Op.like]: '%' + publishDate + '%',
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
							[Op.like]: '%' + genre + '%',
						},
					},
					{
						'$authors.name$': {
							[Op.like]: '%' + author + '%',
						},
					},
					{
						'$tags.name$': {
							[Op.like]: '%' + tag + '%',
						},
					},
					{
						'$publication.name$': {
							[Op.like]: '%' + publication + '%',
						},
					},
				],
			},
		});

		res.status(200).json({
			message: 'Success',
			books: books,
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};
