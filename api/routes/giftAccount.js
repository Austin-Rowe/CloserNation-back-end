const express = require('express');
const router = express.Router();
const request = require('request');
const jwt = require('jsonwebtoken');

const checkAuth = require('../authMiddleWare/checkAuth');

router.get('/create-transaction/:months', (req, res) => {
    
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
                message: "Error with paypal token request, try again",
                error: error
            });
        } else {
            const parsedBody = JSON.parse(body);
            const { access_token } = parsedBody;
            const verifyGiftToken = jwt.sign(
                {
                    months: req.params.months,
                    paypalAuth: access_token
                }, 
                process.env.JWT_KEY, 
                {
                    expiresIn: "10m"
                }
            );
            request.post("https://api.paypal.com/v1/payments/payment", {
                'auth': {
                    'bearer': access_token
                },
                'headers': {
                    'Content-Type': 'application/json',
                },
                'body': JSON.stringify({
                    intent: "sale",
                    application_context: {
                        shipping_preference: "NO_SHIPPING",
                        brand_name: "Best Closer Show Gift",
                        user_action: "commit"
                    },
                    payer: {
                        payment_method: "paypal"
                    },
                    transactions: [
                        {
                            amount: {
                                total: `${req.params.months * 5}.00`,
                                currency: 'USD'
                            },
                            description: `Best Closer Show Access for ${req.params.months} Month${req.params.months === 1? '' : 's'}`,
                            payment_options: {
                                allowed_payment_method: "INSTANT_FUNDING_SOURCE"
                            },
                            item_list: {
                                items: [
                                    {
                                        name: `${req.params.months} Month${req.params.months === 1? '' : 's'} of Full Access`,
                                        description: `Full access to the live show and archives for ${req.params.months} month${req.params.months === 1? '' : 's'}`,
                                        quantity: "1",
                                        price: `${req.params.months * 5}.00`,
                                        currency: "USD"
                                    }
                                ]
                            }
                        }
                    ],
                    note_to_payer: "Upon payment completion you will be redirected to BestCloserShow.com and given a link to share with the gift recipient so they can get access.",
                    redirect_urls: {
                        return_url: `https://bestclosershow.com/GIFT-LINK-PAYOUT/${req.params.months}/${verifyGiftToken}`,
                        cancel_url: `https://bestclosershow.com/GIFT-SELECT`
                    }
                })
            },
            (error, response, body) => {
                if(error){
                    res.status(500).json({
                        message: "Error creating paypal payment. Please try again!",
                        error: error
                    });
                } else {
                    const parsedBody = JSON.parse(body);
                    const approvalLink = parsedBody.links.filter(obj => obj.rel === "approval_url")[0].href;
                    res.status(200).json({
                        approvalLink,
                    });
                }
            });
        }
    });
});

router.post('/execute-payment', checkAuth, (req, res) => {
    const { decodedTokenUserData } = req;
    const token = jwt.sign(
        {
            message: `User was gifted a token for ${decodedTokenUserData.months} month${decodedTokenUserData.months === 1? '' : 's'}`
        }, 
        process.env.JWT_KEY, 
        {
            expiresIn: `${decodedTokenUserData.months * 30}d`
        }
    );
    request.post(`https://api.paypal.com/v1/payments/payment/${req.body.paymentID}/execute`, {
        'auth': {
            'bearer': decodedTokenUserData.paypalAuth
        },
        'headers': {
            'Content-Type': 'application/json',
        },
        'body': JSON.stringify({
            payer_id: req.body.payerID
        })
    },
    (error, response, body) => {
        if(error){
            res.status(500).json({
                message: "Error executing payment. Please try again!",
                error
            });
        } else {
            res.status(200).json({
                message: "Payment executed",
                accessLink: `https://bestclosershow.com/gift-account-signup/${decodedTokenUserData.months}/${token}`
            })
        }
    });
});

router.post('/generate-link/:months', checkAuth, (req, res) => {
    const { decodedTokenUserData } = req;
    if(decodedTokenUserData.admin){
        const token = jwt.sign(
            {
                message: `Admin generated a token for ${req.params.months} month${req.params.months === 1? '' : 's'}`
            }, 
            process.env.JWT_KEY, 
            {
                expiresIn: `${req.params.months * 30}d`
            }
        );

        res.status(200).json({
            message: "Link generated",
            accessLink: `https://bestclosershow.com/gift-account-signup/${req.params.months}/${token}`
        })
    } else {
        res.status(403).json({message: 'Must be admin to generate links!'});
    }
});


module.exports = router;