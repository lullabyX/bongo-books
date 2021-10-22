const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const GenreItem = sequelize.define('genreItems', {
	id: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		allowNull: false,
		autoIncrement: true,
	},
});

module.exports = GenreItem;
