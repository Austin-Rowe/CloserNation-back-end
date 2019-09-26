const express = require('express');
const router = express.Router();
const request = require('request');
const NodeCache = require( "node-cache" );
const myCache = new NodeCache();
const jwt = require('jsonwebtoken');


const User = require('../models/userModel');
const checkAuth = require('../authMiddleWare/checkAuth');



router.post('/subscribe', checkAuth, (req, res) => {
    const { decodedTokenUserData } = req;
    

    User.findById(decodedTokenUserData._id)
    .exec()
    .then(user => {
        if(!user){
            res.status(404).json({
                message: "No user found!"
            });
        } else {
            //Create token for return URL that allows automatic access to resources
            const confirmPaymentToken = jwt.sign(
                {
                    _id: decodedTokenUserData._id
                }, 
                process.env.JWT_KEY, 
                {
                    expiresIn: "1h"
                }
            );
            //Check if paypal_token is present
            myCache.keys((err, keys) => {
                if(!err){
                    if(keys.length <= 0){
                        //Get access token from paypal
                        request.post("https://api.paypal.com/v1/oauth2/token", {
                            'auth': {
                                'user': `${process.env.PAYPAL_ID}`,
                                'pass': `${process.env.PAYPAL_SECRET}`
                            },
                            'headers': {
                                'Content-Type': 'application/x-www-form-urlencoded',
                            },
                            'body': 'grant_type=client_credentials'
                        },
                        (error, response, body) => {
                            if(error){
                                res.status(500).json({
                                    message: "Error with token request, try again",
                                    error: error
                                });
                            } else {
                                const parsedBody = JSON.parse(body);
                                const { access_token, expires_in } = parsedBody;
                                //Cache access token
                                myCache.set('paypal_token', access_token, (expires_in - 20), (err, success) => {
                                    if( !err && success ){
                                        //Make request to get subscription confirmation link
                                        request.post("https://api.paypal.com/v1/billing/subscriptions", {
                                            'auth': {
                                                'bearer': access_token
                                            },
                                            'headers': {
                                                'Content-Type': 'application/json',
                                                'Accept': 'application/json',
                                                'Prefer': 'return=representation',
                                            },
                                            'body': JSON.stringify({
                                                plan_id: "P-87F22527XU0186845LUA2YBQ",
                                                subscriber: {
                                                    name: {
                                                        given_name: user.firstName,
                                                        surname: user.lastName
                                                    },
                                                    email_address: user.email
                                                },
                                                auto_renewal: true,
                                                application_context: {
                                                    brand_name: "THE BEST CLOSER SHOW",
                                                    locale: "en-US",
                                                    shipping_preference: "NO_SHIPPING",
                                                    return_url: `https://bestclosershow.com/CONFIRM-PAYPAL-SUBSCRIPTION/${confirmPaymentToken}`,
                                                    cancel_url: `https://bestclosershow.com`
                                                }
                                            })
                                        },
                                        (error, response, body) => {
                                            if(error){
                                                res.status(500).json({
                                                    message: "Error with subscription request, try again",
                                                    error: error
                                                });
                                            } else {
                                                const parsedBody = JSON.parse(body);
                                                const approvalLinkObj = parsedBody.links.filter(linkObj => linkObj.rel.toLowerCase() == "approve")[0];
                                                const approvalLink = approvalLinkObj.href;
                                                User.updateOne({_id: decodedTokenUserData._id}, {paypalRecurringPaymentId: parsedBody.id, $push: {paypalRecurringPaymentIdArray: parsedBody.id}})
                                                .exec()
                                                .then(result => {
                                                    res.status(200).json({
                                                        approvalLink,
                                                        parsedBody,
                                                        message: `Successfully updated user paypalRecurringId`,
                                                        result: result
                                                    });
                                                })
                                                .catch(err => {
                                                    console.log(err);
                                                    res.status(500).json(err);
                                                });
                                            }
                                        });
                                    } else if(err){
                                        res.status(500).json({
                                            message: "Error caching the token! Try again."
                                        });
                                    }
                                });
                            }
                        });
                    } else if(keys.length >= 1){
                        myCache.get('paypal_token', (error, token) => {
                            if(!error){
                                request.post("https://api.paypal.com/v1/billing/subscriptions", {
                                    'auth': {
                                        'bearer': token
                                    },
                                    'headers': {
                                        'Content-Type': 'application/json',
                                        'Accept': 'application/json',
                                        'Prefer': 'return=representation',
                                    },
                                    'body': JSON.stringify({
                                        plan_id: "P-87F22527XU0186845LUA2YBQ",
                                        subscriber: {
                                            name: {
                                                given_name: user.firstName,
                                                surname: user.lastName
                                            },
                                            email_address: user.email
                                        },
                                        auto_renewal: true,
                                        application_context: {
                                            brand_name: "THE BEST CLOSER SHOW",
                                            locale: "en-US",
                                            shipping_preference: "NO_SHIPPING",
                                            return_url: `https://bestclosershow.com/CONFIRM-PAYPAL-SUBSCRIPTION/${confirmPaymentToken}`,
                                            cancel_url: `https://bestclosershow.com`
                                        }
                                    })
                                },
                                (error, response, body) => {
                                    if(error){
                                        res.status(500).json({
                                            message: "Error with subscription request, try again",
                                            error: error
                                        });
                                    } else {
                                        const parsedBody = JSON.parse(body);
                                        const approvalLinkObj = parsedBody.links.filter(linkObj => linkObj.rel === "approve")[0];
                                        const approvalLink = approvalLinkObj.href;
                                        User.updateOne({_id: decodedTokenUserData._id}, {paypalRecurringPaymentId: parsedBody.id, $push: {paypalRecurringPaymentIdArray: parsedBody.id}})
                                        .exec()
                                        .then(result => {
                                            res.status(200).json({
                                                approvalLink,
                                                parsedBody,
                                                message: `Successfully updated user paypalRecurringId`,
                                                result: result
                                            });
                                        })
                                        .catch(err => {
                                            console.log(err);
                                            res.status(500).json(err);
                                        });
                                    }
                                });
                            } else if(error){
                                res.status(500).json({
                                    message: "Cache error!"
                                });
                            }
                        });
                    } else {
                        res.status(500).json({
                            error: "Cache error!"
                        });
                    }
                } else {
                    res.status(500).json({
                        error: "Cache error!"
                    });
                }
            });
        }
    })
    .catch(err => {
        res.status(500).json({
            error: err
        });
    });
});

router.get('/confirm-payment', checkAuth, (req, res) => {
    User.updateOne({ _id: req.decodedTokenUserData._id }, { paidSubscription: true })
    .exec()
    .then(result => {
        res.status(200).json({
            message: `Paid Subscription set to true for user with _id: ${}`
        })
        console.log(`User granted access based off return url from paypal`);
    })
    .catch(err => {
        console.log(err);
    });
});

module.exports = router;