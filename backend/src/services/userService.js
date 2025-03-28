const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const sgMail = require('@sendgrid/mail');

// Configurando SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Criar um novo usuário
const createUser = async (name, email, password) => {
    try {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) throw new Error('E-mail já cadastrado.');

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({ name, email, password: hashedPassword });

        return {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            createdAt: newUser.createdAt,
            updatedAt: newUser.updatedAt
        };
    } catch (error) {
        throw error;
    }
};

// Autenticar usuário e gerar token JWT
const authenticateUser = async (email, password) => {
    try {
        const user = await User.findOne({ where: { email } });
        if (!user) throw new Error('Usuário não encontrado.');

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) throw new Error('Senha incorreta.');

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            },
            token
        };
    } catch (error) {
        throw error;
    }
};

// Solicitar recuperação de senha
const requestPasswordReset = async (email) => {
    try {
        const user = await User.findOne({ where: { email } });
        if (!user) throw new Error('Usuário não encontrado.');

        // Gerar token de redefinição de senha
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetToken = resetToken;
        user.resetTokenExpires = Date.now() + 3600000; // Expira em 1 hora

        await user.save();

        // Enviar e-mail com o link de redefinição
        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

        const msg = {
            to: user.email,
            from: process.env.SENDGRID_SENDER_EMAIL,
            subject: 'Recuperação de senha',
            text: `Olá, ${user.name}. Use o link a seguir para redefinir sua senha: ${resetLink}`,
            html: `<p>Olá, <strong>${user.name}</strong>. Use o link abaixo para redefinir sua senha:</p>
                   <a href="${resetLink}" target="_blank">${resetLink}</a>`
        };

        await sgMail.send(msg);

        return { message: 'E-mail de recuperação enviado com sucesso.' };
    } catch (error) {
        throw error;
    }
};

// Redefinir senha
const resetPassword = async (token, newPassword) => {
    try {
        const user = await User.findOne({
            where: {
                resetToken: token,
                resetTokenExpires: { [Op.gt]: Date.now() } // Verifica se o token ainda é válido
            }
        });

        if (!user) throw new Error('Token inválido ou expirado.');

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.resetToken = null;
        user.resetTokenExpires = null;

        await user.save();
        return { message: 'Senha redefinida com sucesso.' };
    } catch (error) {
        throw error;
    }
};

// Atualizar dados do usuário
const updateUser = async (id, name, email, password) => {
    try {
        const user = await User.findByPk(id);
        if (!user) return null;

        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }

        user.name = name || user.name;
        user.email = email || user.email;

        await user.save();
        return user;
    } catch (error) {
        throw error;
    }
};

// Deletar conta do usuário
const deleteUser = async (id) => {
    try {
        const user = await User.findByPk(id);
        if (!user) throw new Error('Usuário não encontrado.');
        await user.destroy();
    } catch (error) {
        throw error;
    }
};

// Obter usuário pelo ID
const getUserById = async (id) => {
    try {
        const user = await User.findByPk(id, {
            attributes: ['id', 'name', 'email', 'createdAt', 'updatedAt']
        });
        return user;
    } catch (error) {
        throw error;
    }
};

module.exports = {
    createUser,
    authenticateUser,
    requestPasswordReset,
    resetPassword,
    getUserById,
    updateUser,
    deleteUser
};
