const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const fs = require('fs');

const Resource = require('../models/resourceModel');
const User = require('../models/userModel');

exports.resource_serveVideo = (req, res) => {
    const fileStats = fs.statSync(`/home/ubuntu/archives/${req.params.filename}`);
    const fileSize = fileStats.size;
    const range = req.headers.range;

    if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize-1;
        const chunksize = (end-start)+1;
        const stream = fs.createReadStream(`/home/ubuntu/archives/${req.params.filename}`, {start, end});
        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4',
        }
        res.writeHead(206, head);
        stream.pipe(res);
    } else {
        const head = {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4',
        };
        res.writeHead(200, head);
        fs.createReadStream(`/home/ubuntu/archives/${req.params.filename}`).pipe(res);
    }
};

exports.resource_serveImage = (req, res) => {
    const fileStats = fs.statSync(`/home/ubuntu/images/${req.params.filename}`);
    const fileSize = fileStats.size;
    const range = req.headers.range;
    let contentType;
    
    if(req.params.filename.includes('.jpg')){
        contentType = 'image/jpeg'
    } else if(req.params.filename.includes('.png')){
        contentType = 'image/png'
    }

    if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize-1;
        const chunksize = (end-start)+1;
        const stream = fs.createReadStream(`/home/ubuntu/images/${req.params.filename}`, {start, end});
        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': contentType,
        }
        res.writeHead(206, head);
        stream.pipe(res);
    } else {
        const head = {
            'Content-Length': fileSize,
            'Content-Type': contentType,
        };
        res.writeHead(200, head);
        fs.createReadStream(`/home/ubuntu/images/${req.params.filename}`).pipe(res);
    }
};

exports.resource_getAll = (req, res) => {
    //Change to true to ensure subscribers only can access resources before going to production 
    if(req.decodedTokenUserData.paidSubscription){
        Resource.find()
        .select('URL title description isStreamLink _id fileNames showNumber date viewCount duration')
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
                .select('URL title description isStreamLink _id fileNames showNumber date viewCount duration')
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
    const {title, description, date, duration, showNumber } = req.body;
    const creator_id = req.decodedTokenUserData._id;
    let video;
    let thumbnail;

    if(req.files.video){
        video = req.files.video[0].filename;
        // fs.rename(`/home/ubuntu/images/${req.files.video[0].filename}`, `/home/ubuntu/archives/${req.files.video[0].filename}`, (err) => {
        //     if(err){console.err(err)};
        // });
    } else if(!req.files.video){
        res.status(500).json({
            message: "Error adding resource",
            err: 'No video file present'
        });   
    }
    
    if(req.files.thumbnail){
        thumbnail = req.files.thumbnail[0].filename;
    } else if(!req.files.thumbnail){
        thumbnail = 'defaultThumbnail.jpg';
    }

    if(req.decodedTokenUserData.admin){
        const resource = new Resource({
            _id: new mongoose.Types.ObjectId(),
            title,
            date,
            description,
            duration,
            showNumber,
            creator_id,
            fileNames: {
                video,
                thumbnail
            }
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
    const filename = req.params.filename;
    const admin = req.decodedTokenUserData.admin;
    if(admin){
        fs.unlink(`/home/ubuntu/archives/${filename}`, err => {
            if(err){
                res.status(500).json({
                    error: err
                });
            } else {
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
            }
        })
    } else {
        res.status(403).json({
            message: 'Must be an admin to edit resources'
        });
    }
};