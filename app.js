require('dotenv/config');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');

const userRoutes = require('./api/routes/user');
const resourceRoutes = require('./api/routes/resources');
const paypalRoutes = require('./api/routes/paypal');
const ipnRoute = require('./api/routes/ipn');
const changePasswordRoute = require('./api/routes/changePassword');


app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if(req.method === 'OPTIONS'){
        res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
        return res.status(200).json({});
    }
    next();
});

app.use(express.static(path.join(__dirname, 'build')));
app.get('/', res => {
    res.sendFile(path.join(__dirname, 'build/index.html'));
});

app.use('/user', userRoutes);
app.use('/resources', resourceRoutes);
app.use('/paypal', paypalRoutes);
app.use('/ipn', ipnRoute);
app.use('/change-password', changePasswordRoute);

app.use((req, res, next) => {
    const error = new Error('Not found');
    error.status = 404;
    next(error);
});

app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        error: {
            message: error.message
        }
    });
});

module.exports = app;