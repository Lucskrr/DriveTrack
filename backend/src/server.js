require('dotenv').config();
const express = require('express');
const sequelize = require('./config/dbConfig'); // Garantir conexão
const app = express();

const userRoutes = require('./routes/userRoutes');
const tripRoutes = require('./routes/tripRoutes');

app.use(express.json());
app.use('/api/users', userRoutes);
app.use('/api/trips', tripRoutes);

sequelize.sync({ alter: true })  // Atualiza a estrutura sem deletar dados
  .then(() => console.log('✅ Banco de dados atualizado com sucesso.'))
  .catch((error) => console.error('❌ Erro ao atualizar o banco de dados:', error));

const PORT = process.env.PORT || 3000; // Usa a porta do .env ou 3000 como padrão
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
