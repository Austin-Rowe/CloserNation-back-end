const mongoose = require('mongoose');

const Resource = require('../models/resourceModel');

exports.resource_getAll = (req, res, next) => {
    if(!req.decodedTokenUserData.paidSubscription){
        Resource.find()
        .select('title URL description')
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
    } else {
        res.status(403).json({
            message: "Subscription not paid"
        })
    }
};

exports.resource_createNew = (req, res, next) => {
    const {title, URL, description} = req.body;
    const creator_id = req.decodedTokenUserData._id;
    if(req.decodedTokenUserData.admin){
        const resource = new Resource({
            _id: new mongoose.Types.ObjectId(),
            title: title,
            URL: URL,
            description: description,
            creator_id: creator_id
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
            message: 'Auth failed'
        });
    }
    
};

exports.resource_patch = (req, res, next) => {
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
            message: "Auth failed"
        });
    }
};

exports.resource_delete = (req, res, next) => {
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
            message: 'Auth failed'
        });
    }
};