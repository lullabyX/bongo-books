const Sequelize = require('sequelize');

const sequelize = new Sequelize('bongo-books', 'dummy', 'password', {
    dialect: 'postgres',
    host: 'localhost',
    post: 5432
});

module.exports = sequelize;