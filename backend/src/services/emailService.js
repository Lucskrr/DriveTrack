const sgMail = require('@sendgrid/mail');
require('dotenv').config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (to, subject, text, html) => {
    const msg = {
        to,
        from: process.env.SENDGRID_FROM_EMAIL, // Email do Single Sender
        subject,
        text,
        html,
    };

    try {
        await sgMail.send(msg);
        console.log(`📧 Email enviado para ${to}`);
    } catch (error) {
        console.error('❌ Erro ao enviar email:', error.response ? error.response.body : error.message);
        throw new Error('Erro ao enviar email.');
    }
};

module.exports = { sendEmail };
