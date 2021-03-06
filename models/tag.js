const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const Tag = sequelize.define('tag', {
	id: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		allowNull: false,
		autoIncrement: true,
	},
	name: Sequelize.STRING
});

module.exports = Tag;
