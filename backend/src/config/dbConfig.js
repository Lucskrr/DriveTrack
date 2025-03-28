require('dotenv').config();  // Carregar as variáveis de ambiente
const { Sequelize } = require('sequelize');

// Exibir variáveis de ambiente para debug
console.log('🔍 DEBUG - Variáveis de ambiente carregadas:');
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '******' : 'NÃO DEFINIDO');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_DIALECT:', process.env.DB_DIALECT);

// Verificação das variáveis de ambiente essenciais
const requiredEnvVars = ['DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_HOST', 'DB_DIALECT'];

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    console.error(`❌ ERRO: A variável de ambiente ${envVar} não está definida!`);
    process.exit(1);
  }
});

// Criando a instância do Sequelize
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT.trim(), // Garantir que não há espaços extras
    logging: false,
  }
);

// Testando conexão com o banco de dados
sequelize.authenticate()
  .then(() => {
    console.log('✅ Conexão com o banco de dados estabelecida com sucesso.');
  })
  .catch((err) => {
    console.error('❌ Erro ao conectar ao banco de dados:', err);
  });

module.exports = sequelize;
