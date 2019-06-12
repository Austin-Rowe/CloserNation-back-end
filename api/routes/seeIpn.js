const express = require('express');
const router = express.Router();


const IPN = require('../models/ipnModel');
const checkAuth = require('../authMiddleWare/checkAuth');


router.get('/all', checkAuth, (req, res, next) => {
    if(req.decodedTokenUserData.admin){
        IPN.find()
        .exec()
        .then(docs => {
            if(docs.length >= 1){
                res.status(200).json({docs});
            } else {
            res.status(404).json({message: 'No ipn messages!'}); 
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({error: err});
        })
    } else {
        res.status(401).json({
            message: "Must be admin to view all users!"
        });
    }
});

module.exports = router;