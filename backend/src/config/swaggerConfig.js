const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API DriveTrack',
            version: '1.0.0',
            description: 'Documentação da API DriveTrack',
        },
        servers: [
            {
                url: 'http://localhost:3000/api', // Incluído o prefixo /api
                description: 'Servidor local',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./src/routes/*.js'], // Caminho ajustado para os arquivos de rotas
};

const swaggerSpec = swaggerJsdoc(options);

const setupSwagger = (app) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    console.log('📄 Swagger rodando em: http://localhost:3000/api-docs');
    console.log('📄 Swagger carregando definições de:', options.apis);
};

module.exports = setupSwagger;