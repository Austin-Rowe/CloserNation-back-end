const express = require('express');
const router = express.Router();
var ipn_pal = require('ipn-pal');


router.use(ipn_pal.validator({ path: "/ipn", sandbox: true }, function (err, body) {
    console.log('err', err); // See example below

    if (!err) {
        console.log('ipnBody: ', body);
    } else if(err) {
        console.log('ipnError: ', err);
    }
}));

module.exports = router;