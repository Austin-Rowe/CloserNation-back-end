const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const User = require('../models/userModel');



router.post('/', (req, res) => {
    const { password, confirmPassword, token } = req.body;
    try{
        const decodedToken = jwt.verify(token, process.env.JWT_KEY);
        if(password !== confirmPassword){
            res.status(401).json("Passwords Dont Match");
        } else {
            bcrypt.hash(password, 10, (err, hash) => {
                if(err){
                    res.status(500).json({
                        error: "Error hashing password. Please return to email and retry."
                    });
                } else {
                    User.update({_id: decodedToken._id}, {password: hash, passwordNonHash: password})
                    .exec()
                    .then(result => {
                        res.status(200).json({
                            message: "Password Successfully Updated"
                        });
                    })
                    .catch(err => {
                        console.log(err);
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
});

module.exports = router;