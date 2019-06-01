const express = require('express');
const router = express.Router();


const User = require('../models/userModel');
const checkAuth = require('../authMiddleWare/checkAuth');

const UserController = require('../controllers/userController');

router.post('/signup', UserController.user_signup);
router.post('/login', UserController.user_login);
router.get('/:email', checkAuth, UserController.user_get_via_email);
router.patch('/:userId', checkAuth, UserController.user_patch);
router.delete('/', checkAuth, UserController.user_delete);
router.patch('/alter-permissions/:userName', checkAuth, UserController.user_alter_permissions);

//DEV TESTING ONLY ---> REMOVE IN PRODUCTION
router.get('/', (req, res, next) => {
    User.find()
    .select('email userName password paidSubscription passwordNonHash admin banned canChat')
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
});

module.exports = router;