const pug = require('pug');
const request = require('request');

// const nodemailer = require('nodemailer');
const SibApiV3Sdk = require('sib-api-v3-sdk');

const _emailPath = './config/emails/templates/';

// Configure API key authorization: api-key
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.SID_API;

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

// /**
//  * Service d'envoi de mail
//  */
// exports.sendMail = function sendMail(userEmail, subject, templateArgs) {
//   return new Promise((resolve, reject) => {
//     console.log(`YBO A : ${apiKey}`);

//     const apiInstance = new SibApiV3Sdk.SMTPApi();
//     const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail(
//       {
//         to: userEmail,
//         sender: new SibApiV3Sdk.SendSmtpEmailSender({
//           email: 'noreply@welcom.city'
//         }),
//         subject,
//         textContent: makeTextTemplate(templateArgs),
//         htmlContent: makeHtmlTemplate(templateArgs)
//       }
//     );

//     apiInstance.sendTransacEmail(sendSmtpEmail)
//     .then((data) => {
//       console.log(`SendInBlue API called successfully. Returned data: ${data}`);
//       resolve(data);
//     })
//     .catch((error) => {
//       console.error(error);
//       reject(error);
//     });
//   });
// };


/**
 * Service d'envoi de mail
 */
exports.sendMail = function sendMail(userEmail, subject, templateArgs) {
  return new Promise((resolve, reject) => {
    const options = {
      method: 'POST',
      url: 'https://api.sendinblue.com/v3/smtp/email',
      headers: {
        'api-key': process.env.SID_API
      },
      body:
      {
        sender: { email: 'noreply@welcom.city' },
        to: [{ email: userEmail }],
        htmlContent: makeHtmlTemplate(templateArgs),
        textContent: makeTextTemplate(templateArgs),
        subject,
        replyTo: { email: 'welcomtomycity@gmail.com' }
      },
      json: true
    };

    console.log(`YBO A : ${JSON.stringify(options)}`);

    request(options, (error, response, body) => {
      if (error) reject(error);

     // console.log(response);
      console.log(`YBO B body : ${JSON.stringify(body)}`);
      console.log(`YBO C response : ${JSON.stringify(response)}`);
      console.log(`YBO D error : ${JSON.stringify(error)}`);

      resolve(body);
    });
  });
};

