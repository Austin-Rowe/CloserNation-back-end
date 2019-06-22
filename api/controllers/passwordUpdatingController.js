const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const User = require('../models/userModel');

AWS.config.loadFromPath('./config.json');


exports.password_request_email = (req, res) => {
    const { email } = req.params;
    User.findOne({email: email})
    .exec()
    .then(user => {
        if(!user){
            res.status(404).json({
                message: "No user found, try another email."
            });
        } else {
            const token = jwt.sign(
                {
                    _id: user._id,
                    resetPasswordToken: true
                }, 
                process.env.JWT_KEY, 
                {
                    expiresIn: "24h"
                }
            );

            const emailParams = {
                Destination: { 
                    ToAddresses: [`${user.email}`]
                },
                Message: { 
                    Body: { 
                        Html: {
                            Charset: "UTF-8",
                            Data: `
                                <h1 style="text-align: center;">Reset ${user.userName} Account Password for BestCloserShow.com</h1>
                                <h2 style="text-align: center; color: grey;">If you did not request this password reset ignore this email.</h2>
                                <a style="display: block;
                                    background: blue;
                                    color: white;
                                    font-weight: bold;
                                    width: 275px;
                                    text-align: center;
                                    padding: 10px 0;
                                    border-radius: 100px;
                                    text-decoration: none;
                                    margin: 5px auto;" href="https://bestclosershow.com/RESET-PASSWORD/${token}/${user.userName}">
                                        Click Here to Reset Password
                                </a>
                            `
                        }
                    },
                    Subject: {
                        Charset: 'UTF-8',
                        Data: 'Reset Your BestCloserShow.com Account Password'
                    }
                },
                Source: 'do-not-reply@bestclosershow.com',
            };

            const sendPromise = new AWS.SES({apiVersion: '2010-12-01'}).sendEmail(emailParams).promise();
            sendPromise
            .then(data => {
                res.status(200).json({
                    message: `Token sent to ${user.email}`,
                });
            })
            .catch(err => {
                res.status(500).json({error: err});
            });
        }
    })
    .catch(err => {
        res.status(500).json({
            error: err
        });
    });
};

exports.password_update = (req, res) => {
    const { password, confirmPassword, token } = req.body;
    try{
        const decodedToken = jwt.verify(token, process.env.JWT_KEY);
        if(password !== confirmPassword){
            res.status(401).json("Passwords Dont Match. Please return to email and retry.");
        } else {
            bcrypt.hash(password, 10, (err, hash) => {
                if(err){
                    res.status(500).json({
                        error: "Error hashing password. Please return to email and retry."
                    });
                } else {
                    User.update({_id: decodedToken._id}, {password: hash})
                    .exec()
                    .then(result => {
                        res.status(200).json({
                            message: "Password Successfully Updated"
                        });
                    })
                    .catch(err => {
                        res.status(500).json({
                            error: "Error updating database"
                        });
                    });
                }
            });
        }
    } catch(err){
        return res.status(401).json({
            message: 'Token Expired'
        })
    }
};