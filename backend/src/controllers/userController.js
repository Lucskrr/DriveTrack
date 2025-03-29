const userService = require('../services/userService');
const jwt = require('jsonwebtoken'); // Para manipulação de tokens JWT
const redisClient = require('../config/redis'); // Certifique-se de que o cliente Redis esteja configurado corretamente
const { validationResult } = require('express-validator'); // Para validação de entrada

// Registrar um novo usuário
exports.registerUser = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password } = req.body;
        const user = await userService.createUser(name, email, password);
        res.status(201).json({ message: 'Usuário registrado com sucesso.', user });
    } catch (error) {
        next(error);
    }
};

// Login do usuário
exports.loginUser = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;
        const data = await userService.authenticateUser(email, password, req.ip);
        res.json({ message: 'Login realizado com sucesso.', ...data });
    } catch (error) {
        next(error);
    }
};

// Logout do usuário (invalidação do token)
exports.logoutUser = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token não fornecido.' });
        }

        // Remover o refresh token do Redis
        await redisClient.del(`refreshToken:${refreshToken}`);

        res.json({ message: 'Logout realizado com sucesso.' });
    } catch (error) {
        next(error);
    }
};

// Solicitar recuperação de senha
exports.requestPasswordReset = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email } = req.body;
        await userService.requestPasswordReset(email);
        res.json({ message: 'E-mail de recuperação de senha enviado. Verifique sua caixa de entrada.' });
    } catch (error) {
        next(error);
    }
};

// Redefinir senha
exports.resetPassword = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { token, newPassword } = req.body;
        const result = await userService.resetPassword(token, newPassword);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

// Atualizar usuário
exports.updateUser = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

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
        const user = await userService.getUserById(req.user.id);
        res.json(user);
    } catch (error) {
        next(error);
    }
};

// Obter lista de usuários (paginação)
exports.getUsers = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const result = await userService.getUsers(Number(page), Number(limit));
        res.json(result);
    } catch (error) {
        next(error);
    }
};

// Obter usuário por ID
exports.getUserById = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const user = await userService.getUserById(userId);
        res.json(user);
    } catch (error) {
        next(error);
    }
};

exports.refreshAccessToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token não fornecido.' });
        }

        // Verificar se o refresh token é válido
        const userId = await redisClient.get(`refreshToken:${refreshToken}`);
        if (!userId) {
            return res.status(403).json({ error: 'Refresh token inválido ou expirado.' });
        }

        // Gerar um novo token de acesso
        const newAccessToken = jwt.sign({ id: userId }, privateKey, { algorithm: 'RS256', expiresIn: process.env.JWT_EXPIRATION });

        res.json({ accessToken: newAccessToken });
    } catch (error) {
        next(error);
    }
};