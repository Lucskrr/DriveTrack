const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const sgMail = require('@sendgrid/mail');
const { sequelize } = require('../models');
const { User } = require('../models');
const Redis = require('ioredis');
const Joi = require('joi'); // ✅ Biblioteca para validação
const logAction = require('../services/auditLogService');

// Configuração do Redis para blacklist de tokens
const redisClient = new Redis(process.env.REDIS_URL);

// Configuração do SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Carregar as chaves JWT
const privateKey = fs.readFileSync(path.resolve(process.env.JWT_PRIVATE_KEY), 'utf8');
const publicKey = fs.readFileSync(path.resolve(process.env.JWT_PUBLIC_KEY), 'utf8');

// Configuração segura do bcrypt
const saltRounds = 12;

// Classes de erro personalizadas
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}

// 📌 **Esquema de validação com Joi**
const userSchema = Joi.object({
    name: Joi.string().min(3).max(50).required().messages({
        'string.base': 'O nome deve ser um texto.',
        'string.min': 'O nome deve ter no mínimo 3 caracteres.',
        'string.max': 'O nome deve ter no máximo 50 caracteres.',
        'any.required': 'O nome é obrigatório.'
    }),
    email: Joi.string().email().required().messages({
        'string.email': 'E-mail inválido.',
        'any.required': 'O e-mail é obrigatório.'
    }),
    password: Joi.string().min(8).required().messages({
        'string.min': 'A senha deve ter no mínimo 8 caracteres.',
        'any.required': 'A senha é obrigatória.'
    })
});

// 📌 **Validação para atualização do usuário**
const updateUserSchema = Joi.object({
    name: Joi.string().min(3).max(50).optional(),
    email: Joi.string().email().optional(),
    password: Joi.string().min(8).optional()
});

// 📌 **Adição de token à blacklist (Logout)**
const addTokenToBlacklist = async (token) => {
    try {
        const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
        const expiration = decoded.exp - Math.floor(Date.now() / 1000);
        if (expiration > 0) {
            await redisClient.set(`blacklist:${token}`, 'invalid', 'EX', expiration);
        }
    } catch (error) {
        console.error('Erro ao invalidar token:', error);
    }
};

// 📌 **Verificar se o token está na blacklist**
const isTokenBlacklisted = async (token) => {
    const result = await redisClient.get(`blacklist:${token}`);
    return result !== null;
};

// 📌 **Criar usuário com validação**
const createUser = async (name, email, password) => {
    if (!name || !email || !password) throw new AppError('Nome, e-mail e senha são obrigatórios.', 400);
    
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) throw new AppError('E-mail já cadastrado.', 409);

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await User.create({ name, email, password: hashedPassword });

    return { id: newUser.id, name: newUser.name, email: newUser.email };
};

const isIPBlocked = async (ip) => {
    const blocked = await redisClient.get(`blocked:${ip}`);
    return blocked !== null;
};

// 📌 **Autenticar usuário e gerar JWT seguro**
const authenticateUser = async (email, password, ip) => {
    const user = await User.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        await logAction(null, 'Falha no login', `Tentativa com e-mail: ${email}`, ip);
        throw new AppError('E-mail ou senha inválidos.', 401);
    }

    await logAction(user.id, 'Login', 'Usuário autenticado com sucesso', ip);

    const token = jwt.sign({ id: user.id }, privateKey, { algorithm: 'RS256', expiresIn: process.env.JWT_EXPIRATION });

    return { user: { id: user.id, name: user.name, email: user.email }, token };
};

// 📌 **Logout (invalidação do token)**
const logoutUser = async (token, userId, ip) => {
    await addTokenToBlacklist(token);
    await logAction(userId, 'Logout', 'Usuário deslogado', ip);
    console.log('🔒 Token invalidado no Redis.');
};

// 📌 **Solicitação de recuperação de senha**
const requestPasswordReset = async (email) => {
    const user = await User.findOne({ where: { email } });
    if (!user) throw new AppError('Usuário não encontrado.', 404);

    // Gerar o token de reset de senha
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Criar o hash do token
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Armazenar o token hasheado e a data de expiração
    user.resetToken = hashedToken;
    user.resetTokenExpires = Date.now() + 3600000; // 1 hora
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const msg = {
        to: user.email,
        from: process.env.SENDGRID_SENDER_EMAIL,
        subject: 'Recuperação de Senha',
        text: `Olá, ${user.name}. Use o link para redefinir sua senha: ${resetLink}`,
        html: `<p>Olá, <strong>${user.name}</strong>. Clique no link abaixo para redefinir sua senha:</p>
               <a href="${resetLink}" target="_blank">${resetLink}</a>`
    };

    try {
        await sgMail.send(msg);
        console.log(`📧 E-mail de recuperação enviado para ${user.email}.`);
    } catch (error) {
        console.error('Erro ao enviar e-mail de recuperação:', error);
        throw new AppError('Erro ao enviar o e-mail de recuperação. Tente novamente mais tarde.', 500);
    }

    return { message: 'E-mail de recuperação enviado.' };
};

// 📌 **Redefinição de senha com validação**
const resetPassword = async (token, newPassword) => {
    // Hash do token recebido
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Procurar o usuário usando o token hasheado
    const user = await User.findOne({
        where: { resetToken: hashedToken, resetTokenExpires: { [Op.gt]: Date.now() } }
    });

    if (!user) throw new AppError('Token inválido ou expirado.', 400);

    const { error } = Joi.string().min(8).validate(newPassword);
    if (error) throw new AppError('A senha deve ter no mínimo 8 caracteres.', 400);

    // Atualizar a senha do usuário
    user.password = await bcrypt.hash(newPassword, saltRounds);
    user.resetToken = null;
    user.resetTokenExpires = null;
    await user.save();

    return { message: 'Senha redefinida com sucesso.' };
};

// 📌 **Atualizar usuário com validação**
const updateUser = async (id, name, email, password) => {
    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (password) updates.password = await bcrypt.hash(password, saltRounds);

    const [updated] = await User.update(updates, { where: { id } });

    if (!updated) throw new AppError('Usuário não encontrado.', 404);
    
    return { id, ...updates };
};

// 📌 **Deletar usuário**
const deleteUser = async (id) => {
    const deleted = await User.destroy({ where: { id } });

    if (!deleted) throw new AppError('Usuário não encontrado.', 404);

    return { message: 'Usuário excluído com sucesso.' };
};

const getUsers = async (page = 1, limit = 10) => {
    const offset = (page - 1) * limit;

    const users = await User.findAndCountAll({
        attributes: ['id', 'name', 'email', 'createdAt'],
        limit,
        offset,
        order: [['createdAt', 'DESC']],
    });

    return {
        total: users.count,
        page,
        totalPages: Math.ceil(users.count / limit),
        users: users.rows
    };
};

// 📌 **Obter usuário por ID**
const getUserById = async (id) => {
    const user = await User.findByPk(id, {
        attributes: ['id', 'name', 'email', 'createdAt'] // Escolha os campos que deseja retornar
    });

    if (!user) throw new AppError('Usuário não encontrado.', 404);

    return user;
};

// Exemplo de implementação da função getUserById no service

exports.getUserById = async (userId) => {
    try {
        // Suponha que você tenha um modelo de usuário com Sequelize ou outro ORM
        const user = await User.findByPk(userId); // Sequelize exemplo, altere conforme sua implementação
        return user;
    } catch (error) {
        throw new Error('Erro ao buscar usuário: ' + error.message);
    }
};

module.exports = {
    createUser,
    authenticateUser,
    logoutUser,
    requestPasswordReset,
    resetPassword,
    getUserById,
    updateUser,
    deleteUser,
    isTokenBlacklisted,
    getUserById
};
