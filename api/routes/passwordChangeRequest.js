const AWS = require('aws-sdk');
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const User = require('../models/userModel');

AWS.config.loadFromPath('./config.json');

router.get('/:email', (req, res) => {
    const { email } = req.params;
    console.log("Got request for reset token");
    User.findOne({email: email})
    .exec()
    .then(user => {
        if(!user){
            res.status(404).json({
                message: "No user found, try another email."
            });
        } else {
            console.log("Found user for reset req");
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
                                <h1 style="text-align: center;">Reset ${user.userName} Account Password for CloserNationShow.com</h1>
                                <h2 style="text-align: center; color: grey;">If you did not request this password reset ignore this email.</h2>
                                <form id="change-password" action="http://localhost:3000/change-password" method="post" style="text-align: center;">
                                    Put in new password in both fields.
                                    <input name="password" style="width: 290px; height: 20px; display: block; margin: 5px auto; align-content: center; padding: 0 5px; border-radius: 100px; border: 1px solid grey;" type="password" placeholder="Password">
                                    <input name="confirmPassword" style="width: 290px; height: 20px; display: block; margin: 5px auto; align-content: center; padding: 0 5px; border-radius: 100px; border: 1px solid grey;" type="password" placeholder="Confirm Password">
                                    <input name="token" type="hidden"  value=${token}>
                                    <input id="submit" style="cursor: pointer; width: 300px; height: 30px; display: block; margin: 5px auto; align-content: center; border-radius: 100px; border: 0; background-color: blue; color: white; font-weight: bold;" type="submit" value="Update Password">
                                </form>
                            `
                        }
                    },
                    Subject: {
                        Charset: 'UTF-8',
                        Data: 'Reset BestCloserShow.com Password'
                    }
                },
                Source: 'dnr@closernation.awsapps.com',
            };

            const sendPromise = new AWS.SES({apiVersion: '2010-12-01'}).sendEmail(emailParams).promise();
            console.log("sendPromise: " + sendPromise);
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
});


module.exports = router;
