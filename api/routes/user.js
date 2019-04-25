const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const User = require('../models/userModel');

router.post('/signup', (req, res, next) => {
    User.findOne({email: req.body.email})
    .exec()
    .then(result => {
        if(result){
            res.status(406).json({message: "Email already taken!"})
        } else {
            const user = new User({
                _id: new mongoose.Types.ObjectId(),
                email: req.body.email,
                userName: req.body.userName,
                password: req.body.password,
                activeSub: true
            });
            user.save().then(result => {
                console.log(result);
                res.status(200).json({
                    message: "User created!",
                    createdUser: result
                });
            }).catch(err => {
                console.log(err);
                res.status(500).json({
                    message: "User creation failed!",
                    error: err
                });    
            });
        }
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            message: "Error validating email"
        });
    });
    
});

router.get('/:email', (req, res, next) => {
    const email = req.params.email;
    User.findOne({email: email})
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