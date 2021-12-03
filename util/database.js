require('dotenv').config();
const Sequelize = require('sequelize');

const sequelize = new Sequelize(
	process.env.DB_NAME,
	process.env.DB_USERNAME,
	process.env.DB_PASSWORD,
	{
		dialect: process.env.DB,
		host: process.env.DB_HOST,
		port: process.env.DB_PORT,
	}
);

module.exports = sequelize;
