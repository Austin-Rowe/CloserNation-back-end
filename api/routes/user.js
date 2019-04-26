const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/userModel');

router.post('/signup', (req, res, next) => {
    const {email, userName} = req.body;
    User.findOne({email: email})
    .exec()
    .then(result => {
        if(result){
            res.status(406).json({message: "Email or username already taken"})
        } else {
            User.findOne({userName: userName})
            .exec()
            .then(result => {
                if(result){
                    res.status(406).json({message: "Email or username already taken"})
                } else {
                    bcrypt.hash(req.body.password, 10, (err, hash) => {
                        if(err){
                            return res.status(500).json({
                                error: err
                            });
                        } else {
                            const user = new User({
                                _id: new mongoose.Types.ObjectId(),
                                email: req.body.email,
                                userName: req.body.userName,
                                password: hash
                            });
                            user.save().then(result => {
                                res.status(200).json({
                                    message: "User created",
                                    createdUser: result
                                });
                            }).catch(err => {
                                res.status(500).json({
                                    message: "Error creating account, likely due to missing fields in the request body",
                                    error: err
                                });    
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
        }
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            error: err
        });
    });
    
});

router.post('/login', (req, res, next) => {
    const {email, password, username} = req.body;
    User.findOne({email: email})
    .exec()
    .then(user => {
        if(!user){
            res.status(401).json({
                message: "Auth failed"
            });
        } 
        bcrypt.compare(password, user.password, (err, result) => {
            if(err){
                console.log(err);
                res.status(500).json({
                    error: err
                });
            } else if(result){
                const token = jwt.sign(
                    {
                        email: user.email,
                        userName: user.userName,
                        _id: user._id
                    }, 
                    process.env.JWT_KEY, 
                    {
                        expiresIn: "8h"
                    }
                );
                res.status(200).json({
                    message: "Auth successful",
                    token: token
                });
            } else {
                res.status(401).json({
                    message: "Auth failed"
                })
            }
        });
    })
    .catch(err => {
        res.status(500).json({
            error: err
        });
    });
});

router.get('/:email', (req, res, next) => {
    const email = req.params.email;
    User.findOne({email: email})
    .select('email username password paidSubscription')
    .exec()
    .then(doc => {
        console.log(doc);
        if(doc){
            res.status(200).json({doc});
        } else {
           res.status(404).json({message: 'No such user!'}); 
        }
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({error: err});
    })
});

//Test to see all users
router.get('/', (req, res, next) => {
    User.find()
    .select('email userName password paidSubscription')
    .exec()
    .then(docs => {
        console.log(docs);
        if(docs.length >= 1){
            res.status(200).json({docs});
        } else {
           res.status(404).json({message: 'No users!'}); 
        }
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({error: err});
    })
});

router.patch('/:userId', (req, res, next) => {
    const userId = req.params.userId;
    const updateOps = {};
    for(const ops of req.body){
        updateOps[ops.propName] = ops.value;
    }
    User.update({_id: userId}, {$set: updateOps})
    .exec()
    .then(result => {
        console.log(result);
        res.status(200).json({
            message: `Successfully updated object with _id of ${userId}`,
            result: result
        });
    })
    .catch(err => {
        console.log(err);
        res.status(500).json(err);
    });
});

router.delete('/:userId', (req, res, next) => {
    const userId = req.params.userId;
    User.deleteOne({_id: userId})
    .exec()
    .then(result => {
        res.status(200).json(result)
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            error: err
        });
    });
});

module.exports = router;