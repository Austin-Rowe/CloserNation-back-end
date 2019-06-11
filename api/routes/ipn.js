const express = require('express');
const router = express.Router();
var ipn_pal = require('ipn-pal');

const User = require('../models/userModel');



router.use(ipn_pal.validator({ path: "/ipn", sandbox: false }, (err, body) => {
    // recurring_payment_id
    if(!err){
        let subscribed;
        const { txn_type, payment_status, recurring_payment_id } = body;
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