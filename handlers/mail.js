const nodemailer = require("nodemailer");
const pug = require("pug");
const juice = require("juice");
const htmlToText = require("html-to-text");
const promisify = require("es6-promisify");

const transport = nodemailer.createTransport({
  // requires host, port, author object with username & password
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const generateHTML = (filename, options = {}) => {
  const html = pug.renderFile(
    `${__dirname}/../views/email/${filename}.pug`,
    options
  );
  return juice(html);
};

exports.send = async (options) => {
  const html = generateHTML(options.filename, options);
  const text = htmlToText.fromString(html);

  const mailOptions = {
    from: "<noreply@myapp.com>",
    to: options.user.email,
    subject: options.subject,
    html,
    text,
  };
  const sendMailPromised = promisify(transport.sendMail, transport);
  return sendMailPromised(mailOptions);
};
