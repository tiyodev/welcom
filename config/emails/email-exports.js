const pug = require('pug');
const nodemailer = require('nodemailer');

const _emailPath = './templates/';

/**
 * Email envoyé lorsqu'un user reçoit un PM.
 */
// function sendMessageEmail(sender, msg) {
//   const compiledEmail = pug.compileFile(`${_emailPath}message-sent.pug`);
//   return compiledEmail({
//     sender,
//     message: msg
//   });
// }

/**
 * Email utilisé pour valider l'email du user
 */
function validEmail(host, token) {
  const compiledEmail = pug.compileFile(`${_emailPath}valid-email.pug`);
  return compiledEmail({
    newHost: host,
    newToken: token
  });
}

/**
 * Email de confirmation changement de mot de passe
 */
function confirmationChangePassword() {
  const compiledEmail = pug.compileFile(`${_emailPath}confirm-change-password.pug`);
  return compiledEmail();
}

/**
 * Email pour reset un password
 */
function resetPassword(host, token) {
  const compiledEmail = pug.compileFile(`${_emailPath}reset-password.pug`);
  const url = `http://${host}/reset/${token}`;
  return compiledEmail({
    newUrl: url
  });
}

/**
 * Email de contact-us
 */
function contactUs(email, message) {
  const compiledEmail = pug.compileFile(`${_emailPath}contact-us.pug`);
  return compiledEmail({
    userEmail: email,
    userMessage: message
  });
}

/**
 * Email indiquant un message privé
 */
function privateMessage(sender, message) {
  const compiledEmail = pug.compileFile(`${_emailPath}private-message.pug`);
  return compiledEmail({
    senderName: sender,
    senderMessage: message
  });
}

/**
 * Cette méthode construit le template HTML selon des arguments passés en paramètres.
 * @param {*} templateArgs
 * Arguments du template.
 */
function makeHtmlTemplate(templateArgs) {
  const templateName = templateArgs.templateName;
  switch (templateName) {
    case 'validEmail':
      return validEmail(templateArgs.host, templateArgs.token);
    case 'confirmationChangePassword':
      return confirmationChangePassword();
    case 'resetPassword':
      return resetPassword(templateArgs.host, templateArgs.token);
    case 'contactUs':
      return contactUs(templateArgs.userEmail, templateArgs.userMessage);
    case 'privateMessage':
      return privateMessage(templateArgs.sender, templateArgs.message);
    default:
      return '';
  }
}

/**
 * Cette méthode construit le template Text selon des arguments passés en paramètres.
 * @param {*} templateArgs
 * Arguments du template.
 */
function makeTextTemplate(templateArgs) {
  const templateName = templateArgs.templateName;
  switch (templateName) {
    case 'validEmail':
      return `Please validate your email by copy/paste this link in a browser : http://${templateArgs.host}/verifyEmail/${templateArgs.token}`;
    case 'confirmationChangePassword':
      return 'Just to tell you that you password has well been changed :) \n If you didn\'t do anything, please contact us very soon http://welcom.city/contact-us" !';
    case 'resetPassword':
      return `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n Copy this link into your browser : http://'${templateArgs.host}/reset/${templateArgs.token}`;
    case 'contactUs':
      return `Email of the user : ${templateArgs.userEmail}\n Message : \n${templateArgs.userMessage}`;
    case 'privateMessage':
      return `You receive a message from ${templateArgs.sender} : ${templateArgs.message}`;
    default:
      return 'default message';
  }
}

/**
 * Service d'envoi de mail
 */
exports.sendMail = function (userEmail, subject, templateArgs) {
  return new Promise((resolve, reject) => {
    const transporter = nodemailer.createTransport({
      host: 'smtp.mailgun.org',
      port: 25,
      service: 'Mailgun',
      auth: {
        user: process.env.MAILGUN_USER,
        pass: process.env.MAILGUN_PASSWORD
      },
      dkim: {
        domainName: 'welcom.city',
        keySelector: 'mx',
        privateKey: 'k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDAi6dOcyjW14ddsoCZUHkhFi1IGCGxhFCvAlZu7iKu1wZxMKd5QfZcEI4A6hHYv6NVOgaItz7jGnbpZ95pNUnWOHDpTX0iTibPH7i6NVaCFx1Zir3R+VUmc731OC3KPdoYp+x3R+7gsgVyuzETQzdrMKdl/XM8uj5GYgYXBB32rQIDAQAB'
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    const mailOptions = {
      to: userEmail,
      from: 'noreply@welcom.city',
      subject,
      text: makeTextTemplate(templateArgs),
      html: makeHtmlTemplate(templateArgs),
    };
    transporter.sendMail(mailOptions, (err) => {
      if (err) {
        reject(`Error : ${err}`);
      } else {
        resolve('Mail sent');
      }
    });
  });
};
