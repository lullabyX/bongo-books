const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const Rating = sequelize.define('rating', {
	id: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		allowNull: false,
		autoIncrement: true,
    },
    avgRating: {
        type: Sequelize.FLOAT,
        defaultValue: 0.0
    }
});

module.exports = Rating;
