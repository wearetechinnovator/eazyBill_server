const jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer');
const bcrypt = require("bcrypt");
const path = require('path');
const { getId } = require('../../helper/getIdFromToken');
const sendEmail = require('../../helper/sendEmail');
const removeFile = require('../../helper/removeFile')
const { saveBase64Image } = require('../../helper/uploader');
const userModel = require('../User/user.model');
const mailModel = require('../Mail/mail.model');




const jwt_key = process.env.JWT_SECRET;
class AuthController {
    static async register(req, res) {
        const { name, email, password, profile, filename, update, token } = req.body;

        if ([name, email, password].some((field) => !field || field == "")) {
            return res.json({ 'err': 'require fields are empty' });
        }

        try {
            // profile update
            if (update && token) {
                const getInfo = await getId(token);
                const get = await userModel.findOne({ _id: getInfo._id });
                const checkPass = await bcrypt.compare(password, get.password);

                if (!checkPass) {
                    return res.status(500).json({ err: "Invalid password" })
                }


                // Check email already exist or not
                const isExistsEmail = await userModel.findOne({ email, _id: { $ne: getInfo._id } });
                if (isExistsEmail) {
                    return res.json({ 'err': 'user alredy exist' });
                }

                let updateData = { name, email };


                if (profile) {
                    const file = saveBase64Image(profile); // if file upload return filename else return null; 
                    if (file !== null) {
                        updateData.filename = file;
                        updateData.profile = profile;
                    }
                } else {
                    const data = await userModel.findOne({ _id: getInfo._id });
                    if (data.profile) {
                        removeFile(path.join(__dirname, `../uploads/${data.filename}`));
                        updateData.filename = null;
                        updateData.profile = null;
                    }
                }


                let userUpdate = await userModel.updateOne({ _id: getInfo._id }, { $set: updateData });

                if (userUpdate.modifiedCount === 0) {
                    return res.status(500).json({ err: "Profile not update" })
                }

                return res.status(200).json({ msg: "Update successfully" })
            }

            // user add
            const isExistsEmail = await userModel.findOne({ email });
            if (isExistsEmail) {
                return res.json({ 'err': 'user alredy exist', register: false });
            }

            const insert = await userModel.create({
                name, email, password, profile
            })

            if (!insert) {
                return res.status(500).json({ 'err': 'Register failed', register: false });
            }

            return res.status(200).json({ 'success': 'Register success', register: true });

        } catch (error) {
            console.log(error)
            return res.status(500).json({ 'err': 'Something went wrong' });
        }

    }

    static async login(req, res) {
        const { email, password } = req.body;

        if ([email, password].some((field) => !field || field === "")) {
            return res.status(200).json({ 'err': 'require fields are empty', login: false });
        }

        try {
            const user = await userModel.findOne({ email, isDel: false }).select("-profile");
            if (!user) {
                return res.status(500).json({ err: 'Invalid login id or password', login: false })
            }

            const verifyPass = await bcrypt.compare(password, user.password);
            if (!verifyPass) {
                return res.status(500).json({ err: 'Invalid login id or password', login: false })
            }


            // Create token    
            const token = jwt.sign(JSON.stringify(user), jwt_key)
            return res.status(200).json({ token: token, login: true });

        } catch (error) {
            return res.status(500).json({ 'err': 'Something went wrong', login: false });
        }

    }

    // RESEND-API-KEY = re_L8y4DSVS_GqE1a8ooYY46CAzH8VJJdQ8B
    static async forgot(req, res) {
        const { email } = req.body;
        if (!email) {
            return res.status(200).json({ 'err': 'require fields are empty', forgot: false });
        }

        try {
            const user = await userModel
                .findOne({ email, isDel: false })
                .select('-password');

            if (!user) {
                return res.status(500).json({ err: 'Invalid email', forgot: false });
            }

            let OTP = "";
            for (let i = 0; i < 4; i++) {
                OTP += Math.floor(Math.random() * 10);
            }

            await userModel.updateOne({ email }, { $set: { forgotOtp: OTP } });
            const token = jwt.sign(JSON.stringify({ email }), "adfa;3kw3254543=-2=34hnas3");

            // Professional email template
            const emailTemplate = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa;">
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f7fa;">
                  <tr>
                      <td style="padding: 40px 20px;">
                          <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07); overflow: hidden;">
                              <tr>
                                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">EasyBill</h1>
                                      <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">Password Reset Request</p>
                                  </td>
                              </tr>
                              <tr>
                                  <td style="padding: 40px 30px;">
                                      <h2 style="margin: 0 0 16px 0; color: #1a202c; font-size: 22px; font-weight: 600;">Forgot Your Password?</h2>
                                      <p style="margin: 0 0 24px 0; color: #4a5568; font-size: 15px; line-height: 1.6;">
                                          No worries! Use the verification code below to reset your password:
                                      </p>
                                      <table role="presentation" style="width: 100%; margin: 0 0 24px 0;">
                                          <tr>
                                              <td style="text-align: center; padding: 24px; background-color: #f7fafc; border-radius: 8px; border: 2px dashed #cbd5e0;">
                                                  <p style="margin: 0 0 8px 0; color: #718096; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Your Verification Code</p>
                                                  <p style="margin: 0; color: #2d3748; font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">${OTP}</p>
                                              </td>
                                          </tr>
                                      </table>
                                      <div style="background-color: #fff5f5; border-left: 4px solid #fc8181; padding: 16px; margin: 0 0 24px 0; border-radius: 4px;">
                                          <p style="margin: 0; color: #742a2a; font-size: 14px;">
                                              <strong>⏱️ Time Sensitive:</strong> This code expires in 10 minutes.
                                          </p>
                                      </div>
                                  </td>
                              </tr>
                              <tr>
                                  <td style="background-color: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                                      <p style="margin: 0; color: #a0aec0; font-size: 12px;">© 2024 EasyBill. All rights reserved.</p>
                                  </td>
                              </tr>
                          </table>
                      </td>
                  </tr>
              </table>
          </body>
          </html>
        `;

            const emailSend = await sendEmail({
                to: email,
                subject: 'Reset Your EasyBill Password',
                body: emailTemplate
            });

            return res.status(200).json({ msg: 'Email sent successfully', forgot: true, token });

        } catch (error) {
            console.log(error);
            return res.status(500).json({ 'err': 'Something went wrong', forgot: false });
        }
    }

    static async verifyOtp(req, res) {
        const { otp, token } = req.body;

        if (!otp || !token) {
            return res.status(200).json({ 'err': 'require fields are empty', forgot: false });
        }

        try {

            const chekToken = jwt.verify(token, "adfa;3kw3254543=-2=34hnas3");
            if (!chekToken) {
                return res.status(500).json({ err: 'Invalid token', forgot: false });
            }

            const user = await userModel
                .findOne({ forgotOtp: otp, email: chekToken.email })
                .select('-password');

            if (!user) {
                return res.status(500).json({ err: 'Invalid OTP', forgot: false });
            }


            return res.status(200).json({ msg: 'OTP verified successfully', forgot: true });

        } catch (error) {
            console.log(error)
            return res.status(500).json({ 'err': 'Something went wrong', forgot: false });
        }
    }

    static async changePassword(req, res) {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(200).json({ 'err': 'require fields are empty', change: false });
        }

        try {
            const chekToken = jwt.verify(token, "adfa;3kw3254543=-2=34hnas3");
            if (!chekToken) {
                return res.status(500).json({ err: 'Invalid token', change: false });
            }

            const salt = await bcrypt.genSalt(10);
            const hashPass = await bcrypt.hash(password, salt);

            const update = await userModel.updateOne({ email: chekToken.email }, {
                $set: {
                    password: hashPass,
                    forgotOtp: null
                }
            });


            if (!update) {
                return res.status(500).json({ err: 'Update failed', change: false });
            }

            const data = await userModel.findOne({ email: chekToken.email })
                .select('-password -profile');

            const newToken = jwt.sign(JSON.stringify(data), jwt_key)

            return res.status(200).json({ msg: 'Update successfully', change: true, newToken });

        } catch (error) {
            console.log(error)
            return res.status(500).json({ 'err': 'Something went wrong', change: false });
        }

    }

    static async protectChangePassword(req, res) {
        const { token } = req.body;

        if (!token) {
            return res.status(200).json({ 'err': 'require fields are empty', change: false });
        }

        try {
            const chekToken = jwt.verify(token, "adfa;3kw3254543=-2=34hnas3");
            if (!chekToken) {
                return res.status(500).json({ verify: false });
            }

            const data = await userModel.findOne({ email: chekToken.email })
            if (!data.forgotOtp) {
                return res.status(500).json({ verify: false });
            }

            return res.status(200).json({ verify: true });

        } catch (error) {
            console.log(error)
            return res.status(500).json({ 'err': 'Something went wrong', verify: false });
        }
    }

    static async verifiToken(req, res) {
        const token = req.body.token;

        if (!token) {
            return res.status(401).json({ err: 'No token, authorization denied' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            res.status(200).json({ msg: 'Token is valid' });
        } catch (error) {
            res.status(500).json({ err: 'Token is not valid' });
        }
    }

}

module.exports = AuthController;