const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


const User = require('../models/userModel');

exports.user_signup = (req, res) => {
    let {email, userName, password, firstName, lastName, promoCode } = req.body;
    email = email.toLowerCase();
    User.findOne({email: email})
    .exec()
    .then(result => {
        if(result){
            res.status(406).json({message: "Email or username already taken"})
        } else {
            User.findOne({userName: userName})
            .exec()
            .then(result1 => {
                if(result1){
                    res.status(406).json({message: "Email or username already taken"})
                } else {
                    bcrypt.hash(password, 10, (err, hash) => {
                        if(err){
                            return res.status(500).json({
                                error: err
                            });
                        } else {
                            let user;
                            if(promoCode === "#CloserTrial"){
                                const token = jwt.sign(
                                    {
                                        email: username.email,
                                        userName: username.userName,
                                        _id: username._id,
                                    }, 
                                    process.env.JWT_KEY, 
                                    {
                                        expiresIn: "24h"
                                    }
                                );
                                user = new User({
                                    _id: new mongoose.Types.ObjectId(),
                                    email: email,
                                    userName: userName,
                                    password: hash,
                                    firstName: firstName,
                                    lastName: lastName,
                                    freeDayToken: token
                                }); 
                            } else {
                                user = new User({
                                    _id: new mongoose.Types.ObjectId(),
                                    email: email,
                                    userName: userName,
                                    password: hash,
                                    firstName: firstName,
                                    lastName: lastName
                                });
                            }
                            user.save().then(saveResult => {
                                res.status(200).json({
                                    message: "User created"
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

exports.user_login = (req, res) => {
    let {identity, password} = req.body;
    User.findOne({email: identity.toLowerCase()})
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
                                    admin: username.admin,
                                    paidSubscription: username.paidSubscription,
                                    freeDayToken: username.freeDayToken
                                }, 
                                process.env.JWT_KEY, 
                                {
                                    expiresIn: "8h"
                                }
                            );
                            res.status(200).json({
                                message: "Auth successful",
                                token: token,
                                admin: username.admin,
                                paidSubscription: username.paidSubscription,
                                freeDayToken: username.freeDayToken
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
                            admin: user.admin,
                            paidSubscription: user.paidSubscription,
                            freeDayToken: user.freeDayToken
                        }, 
                        process.env.JWT_KEY, 
                        {
                            expiresIn: "8h"
                        }
                    );
                    res.status(200).json({
                        message: "Auth successful",
                        token: token,
                        admin: user.admin,
                        paidSubscription: user.paidSubscription,
                        freeDayToken: user.freeDayToken
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

exports.user_get_via_email = (req, res) => {
    const email = req.params.email;
    User.findOne({email: email.toLowerCase()})
    .select('email username _id paidSubscription')
    .exec()
    .then(doc => {
        if(doc){
            if(doc._id === req.decodedTokenUserData._id){
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

exports.user_patch = (req, res) => {
    const userId = req.params.userId;
    if(userId !== req.decodedTokenUserData._id){
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

exports.user_delete = (req, res) => {
    const {identity, password} = req.body;
    User.findOne({email: identity.toLowerCase()})
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

exports.user_alter_permissions = (req, res) => {
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

exports.user_get_all_muted = (req, res) => {
    if(req.decodedTokenUserData.admin){
        User.find({canChat: false})
        .select('userName')
        .exec()
        .then(users => {
            const userNames = users.map(rec => rec.userName);
            res.status(200).json(userNames);
        })
        .catch(err => {
            res.status(500).json({
                error: err
            });
        })
    } else {
        res.status(406).json({
            error: "Must be admin"
        })
    }
}

exports.user_apply_promo_code = (req, res) => {
    const { promoCode } = req.body;
    if(req.decodedTokenUserData.freeDayToken === true && promoCode === "#CloserTrial"){
        const token = jwt.sign(
            {
                email: req.decodedTokenUserData.email,
                userName: req.decodedTokenUserData.userName,
                _id: req.decodedTokenUserData._id,
            }, 
            process.env.JWT_KEY, 
            {
                expiresIn: "24h"
            }
        );
        User.update({_id: req.decodedTokenUserData._id}, {freeDayToken: token})
        .exec()
        .then(result => {
            res.status(200).json({
                message: "Valid Promo Code",
            });
        })
        .catch(err => {
            console.log(err);
            res.status(500).json(err);
        });
    } else {
        res.status(401).json({
            message: "Free day promo has already been used with this account or code is invalid."
        });
    }
};