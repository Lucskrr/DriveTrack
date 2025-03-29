require('dotenv').config();
const express = require('express');
const sequelize = require('./config/database'); // Conexão com o banco de dados
const setupSwagger = require('./config/swaggerConfig'); // Configuração do Swagger
const compression = require('compression');
const errorHandler = require('./middlewares/errorMiddleware');
const userRoutes = require('./routes/userRoutes'); // Roteamento de usuários
const tripsRoutes = require('./routes/tripsRoutes'); // Roteamento de viagens

const app = express();

app.use(express.json()); // Middleware para processar JSON
app.use(compression()); // Middleware de compressão

// Configuração do Swagger para documentação da API
setupSwagger(app);
console.log('📄 Swagger configurado em: http://localhost:3000/api-docs');

// Definindo as rotas
app.use('/api/users', userRoutes);  // Rotas relacionadas a usuários
app.use('/api/trips', tripsRoutes); // Rotas relacionadas a viagens

// Middleware para tratar erros
app.use(errorHandler);

// Sincronizando banco de dados (apenas em desenvolvimento)
if (process.env.NODE_ENV !== 'production') {
    sequelize.sync({ alter: true })
        .then(() => console.log('✅ Banco de dados atualizado com sucesso.'))
        .catch((error) => console.error('❌ Erro ao atualizar o banco de dados:', error));
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});