const userService = require('../services/userService');
const jwt = require('jsonwebtoken'); // Para manipulação de tokens JWT
const redisClient = require('../config/redis'); // Certifique-se de que o cliente Redis esteja configurado corretamente


// Registrar um novo usuário
exports.registerUser = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        // Validação simples
        if (!name || !email || !password) {
            return res.status(400).json({ status: "error", message: "Nome, e-mail e senha são obrigatórios." });
        }

        const user = await userService.createUser(name, email, password);
        res.status(201).json(user);
    } catch (error) {
        next(error);
    }
};

// Login do usuário
exports.loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const data = await userService.authenticateUser(email, password);
        res.json(data);
    } catch (error) {
        next(error);
    }
};

// Logout do usuário (invalidação do token)
exports.logoutUser = async (req, res, next) => {
    try {
        const token = req.token;  // O token já foi adicionado ao req pelo middleware de autenticação

        // Decodificar o token para obter a expiração
        const decoded = jwt.decode(token);

        // Calcular o tempo restante até a expiração do token (em milissegundos)
        const expirationTime = decoded.exp * 1000 - Date.now();

        // Adicionar o token à blacklist no Redis com o tempo de expiração
        await redisClient.setex(`blacklist:${token}`, expirationTime / 1000, 'blacklisted'); // tempo em segundos

        res.json({ message: 'Logout realizado com sucesso.' });
    } catch (error) {
        next(error);
    }
};

// Solicitar recuperação de senha
exports.requestPasswordReset = async (req, res, next) => {
    try {
        const { email } = req.body;
        await userService.requestPasswordReset(email);
        res.json({ message: 'E-mail de recuperação de senha enviado. Verifique sua caixa de entrada.' });
    } catch (error) {
        next(error);
    }
};

exports.resetPassword = async (req, res, next) => {
    try {
        // Pegar o token do cabeçalho Authorization
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: 'Token ausente no cabeçalho.' });
        }

        const { newPassword } = req.body;

        // Verificar se o token é válido e obter as informações do usuário
        const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
        const userId = decoded.id;

        // Supondo que userService tenha uma função para atualizar a senha
        await userService.updatePassword(userId, newPassword);

        res.json({ message: 'Senha redefinida com sucesso.' });
    } catch (error) {
        next(error); // Passa o erro para o handler de erro
    }
};

// Atualizar usuário
exports.updateUser = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        const userId = req.user.id;
        const updatedUser = await userService.updateUser(userId, name, email, password);
        res.json({ message: 'Usuário atualizado com sucesso.', user: updatedUser });
    } catch (error) {
        next(error);
    }
};

// Deletar conta do usuário
exports.deleteUser = async (req, res, next) => {
    try {
        const userId = req.user.id;
        await userService.deleteUser(userId);
        res.json({ message: 'Conta deletada com sucesso.' });
    } catch (error) {
        next(error);
    }
};

// Obter perfil do usuário
exports.getUserProfile = async (req, res, next) => {
    try {
        // A partir do token, o req.user.id deve ter sido preenchido pelo middleware de autenticação
        const user = await userService.getUserById(req.user.id);
        res.json(user);
    } catch (error) {
        next(error);
    }
};

// Obter lista de usuários (paginação)
exports.getUsers = async (req, res) => {
    const { page, limit } = req.query;
    try {
        const result = await userService.getUsers(Number(page), Number(limit));
        res.json(result);
    } catch (error) {
        next(error);
    }
};

// Adicione a função getUserById no seu controller
exports.getUserById = async (req, res, next) => {
    try {
        const userId = req.params.id; // O ID do usuário vem da URL
        const user = await userService.getUserById(userId); // Chama o serviço para pegar o usuário pelo ID
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }
        res.json(user);
    } catch (error) {
        next(error);
    }
};


