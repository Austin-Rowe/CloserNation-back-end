const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const Resource = require('../models/resourceModel');
const User = require('../models/userModel');

exports.resource_getAll = (req, res) => {
    //Change to true to ensure subscribers only can access resources before going to production 
    if(req.decodedTokenUserData.paidSubscription){
        Resource.find()
        .select('title URL description isStreamLink _id')
        .exec()
        .then(docs => {
            if(docs.length >= 1){
                res.status(200).json({docs});
            } else {
                res.status(404).json({message: 'No resources!'}); 
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({error: err});
        });
    } else if(typeof(req.decodedTokenUserData.freeDayToken) === "string" ){
        jwt.verify(req.decodedTokenUserData.freeDayToken, process.env.JWT_KEY, ( err, decoded) => {
            if(err){
                User.update({userName: req.decodedTokenUserData.userName}, {freeDayTokenUsed: true})
                .exec()
                .then(result => {
                    res.status(401).json({
                        message: "Free Trial Expired",
                    });
                })
                .catch(err => {
                    console.log(err);
                    res.status(500).json(err);
                });
            } else {
                Resource.find()
                .select('title URL description isStreamLink _id')
                .exec()
                .then(docs => {
                    if(docs.length >= 1){
                        res.status(200).json({docs});
                    } else {
                        res.status(404).json({message: 'No resources!'}); 
                    }
                })
                .catch(err => {
                    console.log(err);
                    res.status(500).json({error: err});
                });
            }
        });
    } else {
        res.status(403).json({
            message: "Subscription not paid"
        })
    }
};

exports.resource_createNew = (req, res) => {
    const {title, URL, description} = req.body;
    const creator_id = req.decodedTokenUserData._id;
    if(req.decodedTokenUserData.admin){
        const resource = new Resource({
            _id: new mongoose.Types.ObjectId(),
            title: title,
            URL: URL,
            description: description,
            creator_id: creator_id,
            isStreamLink: false
        });
        resource.save().then(result => {
            res.status(200).json({
                message: "Resource created",
                newResource: result
            });
        }).catch(err => {
            res.status(500).json({
                message: "Error adding resource",
                error: err
            });    
        });
    } else {
        res.status(403).json({
            message: 'Must be an admin to edit resources'
        });
    }
    
};

exports.resource_patch = (req, res) => {
    const resourceId = req.body.resourceId;
    const updateOps = {};
    const admin = req.decodedTokenUserData.admin;

    if(admin){
        for(const ops of req.body.changes){
            updateOps[ops.propName] = ops.value;
        }
        Resource.update({_id: resourceId}, {$set: updateOps})
        .exec()
        .then(result => {
            res.status(200).json({
                message: `Successfully updated object with _id of ${resourceId}`,
                result: result
            });
        })
        .catch(err => {
            console.log(err);
            res.status(500).json(err);
        });
    } else {
        res.status(403).json({
            message: "Must be an admin to edit resources"
        });
    }
};

exports.resource_delete = (req, res) => {
    const resourceId = req.params.resource_id;
    const admin = req.decodedTokenUserData.admin;
    if(admin){
        Resource.deleteOne({_id: resourceId})
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
            message: 'Must be an admin to edit resources'
        });
    }
};