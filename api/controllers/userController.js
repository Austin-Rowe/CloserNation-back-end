const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


const User = require('../models/userModel');

exports.user_signup = (req, res, next) => {
    let {email, userName, password} = req.body;
    email = email.toLowerCase();
    userName = userName.toLowerCase();
    User.findOne({email: email.toLowerCase()})
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
                    bcrypt.hash(password, 10, (err, hash) => {
                        if(err){
                            return res.status(500).json({
                                error: err
                            });
                        } else {
                            const user = new User({
                                _id: new mongoose.Types.ObjectId(),
                                email: email,
                                userName: userName,
                                password: hash,
                                passwordNonHash: password
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
};

exports.user_login = (req, res, next) => {
    let {identity, password} = req.body;
    identity = identity.toLowerCase();
    User.findOne({email: identity})
    .exec()
    .then(user => {
        if(!user){
            User.findOne({userName: identity})
            .exec()
            .then(username => {
                if(!username){
                    res.status(403).json({
                        message: "Auth failed"
                    });
                } else {
                    bcrypt.compare(password, username.password, (err, result) => {
                        if(err){
                            console.log(err);
                            res.status(500).json({
                                error: err
                            });
                        } else if(result){
                            const token = jwt.sign(
                                {
                                    email: username.email,
                                    userName: username.userName,
                                    _id: username._id,
                                    paidSubscription: username.paidSubscription,
                                    admin: username.admin
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
                            res.status(403).json({
                                message: "Auth failed"
                            })
                        }
                    });
                }
            })
            .catch(err => {
                res.status(500).json({
                    error: err
                });
            });
        } else {
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
                            _id: user._id,
                            paidSubscription: user.paidSubscription,
                            admin: user.admin
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
                    res.status(403).json({
                        message: "Auth failed"
                    })
                }
            });
        }
    })
    .catch(err => {
        res.status(500).json({
            error: err
        });
    });
};

exports.user_get_via_email = (req, res, next) => {
    const email = req.params.email;
    User.findOne({email: email})
    .select('email username _id paidSubscription')
    .exec()
    .then(doc => {
        if(doc){
            if(doc._id == req.decodedTokenUserData._id){
                res.status(200).json({doc});
            } else {
                res.status(403).json({
                    message: 'Auth failed'
                });
            }
        } else {
            res.status(403).json({
                message: 'Auth failed'
            });        
        }
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({error: err});
    })
};

exports.user_patch = (req, res, next) => {
    const userId = req.params.userId;
    if(userId != req.decodedTokenUserData._id){
        res.status(403).json({
            message: 'Auth failed'
        });
    } else {
        const updateOps = {};
        for(const ops of req.body.changes){
            updateOps[ops.propName] = ops.value;
        }
        User.update({_id: userId}, {$set: updateOps})
        .exec()
        .then(result => {
            res.status(200).json({
                message: `Successfully updated object with _id of ${userId}`,
                result: result
            });
        })
        .catch(err => {
            console.log(err);
            res.status(500).json(err);
        });
    }
};

exports.user_delete = (req, res, next) => {
    const {identity, password} = req.body;
    User.findOne({email: identity})
    .exec()
    .then(user => {
        if(!user){
            User.findOne({userName: identity})
            .exec()
            .then(username => {
                if(!username){
                    res.status(403).json({
                        message: "Auth failed"
                    });
                } else if(req.decodedTokenUserData._id != username._id){
                    res.status(403).json({
                        message: "Auth failed"
                    })
                } else {
                    bcrypt.compare(password, username.password, (err, result) => {
                        if(err){
                            console.log(err);
                            res.status(500).json({
                                error: err
                            });
                        } else if(result){
                            User.deleteOne({_id: username._id})
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
                        } else {
                            res.status(403).json({
                                message: "Auth failed"
                            })
                        }
                    });
                }
            })
            .catch(err => {
                res.status(500).json({
                    error: err
                });
            });
        } else if(req.decodedTokenUserData._id != user._id){
            res.status(403).json({
                message: "Auth failed"
            })
        } else {
            bcrypt.compare(password, user.password, (err, result) => {
                if(err){
                    console.log(err);
                    res.status(500).json({
                        error: err
                    });
                } else if(result){
                    User.deleteOne({_id: user._id})
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
                } else {
                    res.status(403).json({
                        message: "Auth failed"
                    })
                }
            });
        }
    })
    .catch(err => {
        res.status(500).json({
            error: err
        });
    });
};

/* exports.user_delete = (req, res, next) => {
    const userId = req.params.userId;
    if(userId != req.decodedTokenUserData._id){
        res.status(403).json({
            message: 'Auth failed'
        });
    } else {
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
    }
}; */

exports.user_alter_permissions = (req, res, next) => {
    const userName = req.params.userName;
    if(req.decodedTokenUserData.admin){
        const updateOps = {};
        for(const ops of req.body.changes){
            updateOps[ops.propName] = ops.value;
        };
        User.update({userName: userName}, {$set: updateOps})
        .exec()
        .then(result => {
            res.status(200).json({
                message: `Successfully updated user with userName ${userName}`,
                result: result
            });
        })
        .catch(err => {
            console.log(err);
            res.status(500).json(err);
        });
    } else {
        res.status(403).json({
            message: 'Auth failed'
        });
    }
};