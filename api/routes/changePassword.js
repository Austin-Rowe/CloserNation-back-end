const express = require('express');
const router = express.Router();

const PasswordUpdatingController = require('../controllers/passwordUpdatingController');
const checkAuth = require('../authMiddleWare/checkAuth');

router.get('/:email', PasswordUpdatingController.password_request_email)
router.post('/', PasswordUpdatingController.password_update);

module.exports = router;