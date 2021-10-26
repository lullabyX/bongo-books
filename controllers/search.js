const { Op, Model } = require('sequelize');
const Book = require('../models/book');
const Genre = require('../models/genre');
const GenreItem = require('../models/genre-items');
const Tag = require('../models/tag');

exports.getGeneralSearch = async (req, res, next) => {
	try {
		const term = req.query.term;

		const books = await Book.findAll({
			include: [
				{
					model: Genre,
					required: true,
				},
			],
			where: {
				// [Op.or]: [
				// {
				// 	title: {
				// 		[Op.iLike]: term,
				// 	},
				// },
				// {
				'$Genre.name$': {
					[Op.like]: term,
				},
				// },
				// ],
			},
		});
		console.log(books);
		res.status(200).json({
			books: books,
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};
