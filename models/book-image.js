const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const BookImage = sequelize.define('bookImage', {
	id: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true,
		allowNull: false,
	},
	imageUrl: {
		type: Sequelize.STRING,
		allowNull: false,
	},
});

module.exports = BookImage;
