const express = require('express');
const router = express.Router();


const User = require('../models/userModel');
const checkAuth = require('../authMiddleWare/checkAuth');

const UserController = require('../controllers/userController');

router.post('/signup', UserController.user_signup);
router.post('/login', UserController.user_login);
router.get('/muted-users', checkAuth, UserController.user_get_all_muted);
router.patch('/:userId', checkAuth, UserController.user_patch);
router.delete('/', checkAuth, UserController.user_delete);
router.patch('/alter-permissions/:userName', checkAuth, UserController.user_alter_permissions);
router.post('/apply-promo', checkAuth, UserController.user_apply_promo_code);

router.get('/all-users', checkAuth, (req, res, next) => {
    if(req.decodedTokenUserData.admin){
        User.find()
        .exec()
        .then(docs => {
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
    } else {
        res.status(401).json({
            message: "Must be admin to view all users!"
        });
    }
});

module.exports = router;