const express = require('express');
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

module.exports = router;