const Redis = require('ioredis');

// Conectar ao Redis
const redisClient = new Redis({
    host: 'localhost', // ou o endereço do seu servidor Redis
    port: 6379,        // porta padrão do Redis
    db: 0,             // banco de dados Redis
});

module.exports = redisClient;