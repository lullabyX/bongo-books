const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const AddressBook = sequelize.define('addressBook', {
	id: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		allowNull: false,
		autoIncrement: true,
	},
	address: Sequelize.STRING,
	region: Sequelize.STRING,
	phoneNumber: Sequelize.STRING,
});

module.exports = AddressBook;
