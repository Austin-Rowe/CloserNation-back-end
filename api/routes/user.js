const express = require('express');
const router = express.Router();

router.post('/signup', (req, res, next) => {
    const user = {
        email: req.body.email,
        userName: req.body.userName,
        password: req.body.password,
        activeSub: true
    }
    res.status(200).json({
        message: 'Handling post req to /user/signup',
        createdUser: user
    });
});

router.get('/:userId', (req, res, next) => {
    const userId = req.params.userId;
    res.status(200).json({
        message: `Handling get request to /user/${userId}`
    });
});

router.patch('/:userId', (req, res, next) => {
    const userId = req.params.userId;
    res.status(200).json({
        message: `Updated user with id#${userId}`
    });
});

router.delete('/:userId', (req, res, next) => {
    const userId = req.params.userId;
    res.status(200).json({
        message: `Deleted user with id#${userId}`
    });
});

module.exports = router;