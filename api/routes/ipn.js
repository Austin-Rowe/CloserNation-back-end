const express = require('express');
const router = express.Router();
const request = require('request');
const querystring = require('querystring');
const mongoose = require('mongoose');

const User = require('../models/userModel');
const IPN = require('../models/ipnModel');


router.post('/', (req, res, next) => {
    //Initial response to paypal to verify endpoint
    res.status(200).end();

    //Validate IPN is from paypal
    let ipnTransactionMessage = req.body;
    let formUrlEncodedBody = querystring.stringify(ipnTransactionMessage);
    let verificationBody = `cmd=_notify-validate&${formUrlEncodedBody}`;

    let options = {
        method: "POST",
        uri: "https://ipnpb.paypal.com/cgi-bin/webscr",
        body: verificationBody,
    };

    // POST verification IPN data to paypal to validate.
    request(options, (error, response, body) => {
        if (!error && response.statusCode == 200) {
            if (body === "VERIFIED") {
                const ipn = new IPN({
                    _id: new mongoose.Types.ObjectId(),
                    ipn: req.body
                });
                ipn.save().catch(err => {
                    console.error(`Failed to store IPN in DB: ${err}`); 
                });

                let subscribed;
                const { txn_type, payment_status, recurring_payment_id, initial_payment_status } = req.body;
                switch(txn_type){
                    case "merch_pmt": 
                        subscribed = true; 
                        break;
                    case "subscr_payment": 
                        subscribed = true; 
                        break;
                    case "subscr_signup": 
                        subscribed = true; 
                        break;
                    case "recurring_payment": 
                        subscribed = true; 
                        break;
                    case "recurring_payment_profile_created":
                        subscribed = true;
                        break;
                    case "recurring_payment_failed":
                        subscribed = false;
                        break;
                    case "recurring_payment_profile_cancel":
                        subscribed = false;
                        break; 
                    case "recurring_payment_suspended":
                        subscribed = false;
                        break; 
                    case "recurring_payment_suspended_due_to_max_failed_payment":
                        subscribed = false;
                        break; 
                    case "subscr_cancel":
                        subscribed = false;
                        break;
                    case "subscr_failed":
                        subscribed = false;
                        break;
                    case "mp_cancel": 
                        subscribed = false; 
                        break;
                    default: subscribed = null;
                }
                if(subscribed){
                    if(payment_status === "Completed" || initial_payment_status === "Completed"){
                        if(subscribed !== null){
                            User.update({paypalRecurringPaymentId: recurring_payment_id}, {paidSubscription: subscribed, mostRecentIpnMessage: body})
                            .exec()
                            .then(result => {
                                console.log(result);
                            })
                            .catch(err => {
                                console.log(err);
                            });
                        }
                    } 
                } else {
                    if(subscribed !== null){
                        User.update({paypalRecurringPaymentId: recurring_payment_id}, {paidSubscription: subscribed, mostRecentIpnMessage: body})
                        .exec()
                        .then(result => {
                            console.log(result);
                        })
                        .catch(err => {
                            console.log(err);
                        });
                    }
                }
            } else if (body === "INVALID") {
                console.error(`Recieved "INVALID" response for IPN from paypal`);
            } else {
                console.error("Unexpected reponse body.");
            }
        } else {
            console.error(error);
            console.log(body);
        }
    });

});




module.exports = router;

/* const express = require('express');
const router = express.Router();
var ipn_pal = require('ipn-pal');
const mongoose = require('mongoose');


const User = require('../models/userModel');
const IPN = require('../models/ipnModel');



router.use(ipn_pal.validator({ path: "/", sandbox: false }, (err, body) => {
    const ipn = new IPN({
        _id: new mongoose.Types.ObjectId(),
        ipn: body
    });

    ipn.save().then(result => {
        console.log('ipn saved');
    }).catch(err => {
        console.log('ipn store in DB failure'); 
    });

    if(!err){
        let subscribed;
        const { txn_type, payment_status, recurring_payment_id, initial_payment_status } = body;
        switch(txn_type){
            case "merch_pmt": 
                subscribed = true; 
                break;
            case "subscr_payment": 
                subscribed = true; 
                break;
            case "subscr_signup": 
                subscribed = true; 
                break;
            case "recurring_payment": 
                subscribed = true; 
                break;
            case "recurring_payment_profile_created":
                subscribed = true;
                break;
            case "recurring_payment_failed":
                subscribed = false;
                break;
            case "recurring_payment_profile_cancel":
                subscribed = false;
                break; 
            case "recurring_payment_suspended":
                subscribed = false;
                break; 
            case "recurring_payment_suspended_due_to_max_failed_payment":
                subscribed = false;
                break; 
            case "subscr_cancel":
                subscribed = false;
                break;
            case "subscr_failed":
                subscribed = false;
                break;
            case "mp_cancel": 
                subscribed = false; 
                break;
            default: subscribed = null;
        }
        if(subscribed){
            if(payment_status === "Completed" || payment_status === "Processed"){
                if(subscribed !== null){
                    User.update({paypalRecurringPaymentId: recurring_payment_id}, {paidSubscription: subscribed, mostRecentIpnMessage: body})
                    .exec()
                    .then(result => {
                        console.log(result);
                    })
                    .catch(err => {
                        console.log(err);
                    });
                }
            }
        } else {
            if(subscribed !== null){
                User.update({paypalRecurringPaymentId: recurring_payment_id}, {paidSubscription: subscribed, mostRecentIpnMessage: body})
                .exec()
                .then(result => {
                    console.log(result);
                })
                .catch(err => {
                    console.log(err);
                });
            }
        }
    } else {
        console.log(err);
    }
}));

module.exports = router; */