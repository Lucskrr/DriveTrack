// src/models/index.js
const User = require('./userModel');  // Importe o modelo de usuário
const sequelize = require('../config/dbConfig'); // Se necessário, importe a configuração do sequelize

module.exports = {
    User,
    sequelize  // Exporte o sequelize se você precisar utilizá-lo em outros lugares
};
