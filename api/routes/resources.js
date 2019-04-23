const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {
    res.status(200).json({
        message: `Return archive & stream resource links`
    });
});

module.exports = router;