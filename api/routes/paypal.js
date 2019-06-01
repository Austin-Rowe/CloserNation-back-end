const express = require('express');
const router = express.Router();
const request = require('request');
const NodeCache = require( "node-cache" );
const myCache = new NodeCache();





router.post('/subscribe', (req, res) => {
    const { given_name, surname, email } = req.body;

    //Check if paypal_token is present
    myCache.keys((err, keys) => {
        if(!err){
            if(keys.length <= 0){
                //Get access token from paypal
                request.post("https://api.sandbox.paypal.com/v1/oauth2/token", {
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
                                request.post("https://api.sandbox.paypal.com/v1/billing/subscriptions", {
                                    'auth': {
                                        'bearer': access_token
                                    },
                                    'headers': {
                                        'Content-Type': 'application/json',
                                        'Accept': 'application/json',
                                        'Prefer': 'return=representation',
                                    },
                                    'body': JSON.stringify({
                                        plan_id: "P-6MA51485CC2422435LTWG5SQ",
                                        subscriber: {
                                            name: {
                                                given_name,
                                                surname
                                            },
                                            email_address: email
                                        },
                                        auto_renewal: true,
                                        application_context: {
                                            brand_name: "THE CLOSER NATION SHOW",
                                            locale: "en-US",
                                            shipping_preference: "NO_SHIPPING",
                                            return_url: "https://example.com/returnUrl",
                                            cancel_url: "https://example.com/returnUrl"
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
                                        res.status(200).json({
                                            approvalLink,
                                            parsedBody
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
                        request.post("https://api.sandbox.paypal.com/v1/billing/subscriptions", {
                            'auth': {
                                'bearer': token
                            },
                            'headers': {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json',
                                'Prefer': 'return=representation',
                            },
                            'body': JSON.stringify({
                                plan_id: "P-6MA51485CC2422435LTWG5SQ",
                                subscriber: {
                                    name: {
                                        given_name: given_name,
                                        surname: surname
                                    },
                                    email_address: email
                                },
                                auto_renewal: true,
                                application_context: {
                                    brand_name: "THE CLOSER NATION SHOW",
                                    locale: "en-US",
                                    shipping_preference: "NO_SHIPPING",
                                    return_url: "https://example.com/returnUrl",
                                    cancel_url: "https://example.com/returnUrl"
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
                                res.status(200).json({
                                    approvalLink,
                                    parsedBody
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
});

module.exports = router;