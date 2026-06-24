const jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer');
const bcrypt = require("bcrypt");
const { getId } = require('../../helper/getIdFromToken');
const sendEmail = require('../../helper/sendEmail');
const userModel = require('../User/user.model');
const mailModel = require('../Mail/mail.model');


class UserController {
    static async getUser(req, res) {
        const { token } = req.body;

        if (!token) {
            return res.status(500).json({ err: 'require fields are empty' });
        }

        try {
            const userEmail = await getId(token);

            if (!userEmail.email || userEmail.email === null) {
                return res.status(500).json({ 'err': 'invalid token', data: false });
            }

            const userData = await userModel.findOne({ email: userEmail.email, isDel: false })
                .select("-password")
                .populate('companies');

            return res.status(200).json(userData);

        } catch (error) {
            return res.status(500).json({ 'err': 'Something went wrong', data: false });
        }
    }

    static async updatepass(req, res) {
        const { currentPassword, newPassword, token } = req.body;
        if ([currentPassword, newPassword, token].some((field) => !field || field == "")) {
            return res.status(200).json({ 'err': 'require fields are empty', change: false });
        }

        try {
            const getInfo = await getId(token);
            const getUser = await userModel.findOne({ _id: getInfo._id });

            const checkPass = await bcrypt.compare(currentPassword, getUser.password);
            if (!checkPass) {
                return res.status(500).json({ err: 'Invalid password' });
            }

            const salt = await bcrypt.genSalt(10);
            const hashPass = await bcrypt.hash(newPassword, salt);

            const update = await userModel.updateOne({ _id: getInfo._id }, {
                $set: {
                    password: hashPass
                }
            });
            if (!update) {
                return res.status(500).json({ err: 'Update failed' });
            }

            return res.status(200).json({ msg: 'Update successfully' });


        } catch (error) {
            return res.status(500).json({ 'err': 'Something went wrong', change: false });
        }

    }

    // Send bill via email
    static async sendBill(req, res) {
        const { token, email, data, subject, body } = req.body;

        if (!token || !email || !data) {
            return res.status(200).json({ 'err': 'require fields are empty', send: false });
        }


        const checkToken = jwt.verify(token, jwt_key);
        if (!checkToken) {
            return res.status(500).json({ err: 'Invalid token', send: false });
        }

        const getInfo = await getId(token);
        const getUser = await userModel.findOne({ _id: getInfo?._id });


        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587, // Use 465 for SSL, 587 for TLS
            secure: false, // true for 465, false for 587
            auth: {
                user: process.env.APP_EMAIL,
                pass: process.env.APP_PASS
            }
        });

        const mailOptions = {
            from: `"${checkToken.email}" <easybill@gmail.com>`,
            to: email,
            subject: subject,
            // text: 'This is a plain text email body',
            html: `<div>${body}</div>`,
            attachments: [
                {
                    filename: 'document.pdf',
                    content: data,
                    encoding: 'base64',
                    contentType: 'application/pdf'
                }
            ]
        };


        transporter.sendMail(mailOptions, async (error, info) => {
            if (error) {
                console.log(error);
                return res.status(500).json({ err: 'Email not send', send: false });
            } else {

                // store history;
                await mailModel.create({
                    userId: getUser._id,
                    companyId: getUser.activeCompany,
                    to: email,
                    billNo: '120'
                })

                return res.status(200).json({ msg: 'Email send successfully', send: true });
            }
        });


    }
}

module.exports = UserController