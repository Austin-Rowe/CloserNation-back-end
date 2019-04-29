const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const token = req.headers.authorization;
    try{
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        req.decodedTokenUserData = decoded;
    } catch(err){
        return res.status(401).json({
            message: 'Auth failed'
        })
    }
    next();
};