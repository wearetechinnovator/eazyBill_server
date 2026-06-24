const nodemailer = require("nodemailer");

module.exports = async function sendEmail({to, subject, body}) {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        port: 587,
        auth: {
            user: process.env.APP_EMAIL,
            pass: process.env.APP_PASS
        }
    });

    const mailOptions = {
        from: process.env.APP_EMAIL,
        to: to,
        subject: subject,
        html: body,
    };

    const info = await transporter.sendMail(mailOptions);

}