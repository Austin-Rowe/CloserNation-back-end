const express = require('express')
const https = require('https');
const appHttps = require('./app');
const app = express();

const key = fs.readFileSync(/*path to key*/);
const cert = fs.readFileSync( /*path to cert*/ );

const options = {
    cert: cert,
    key: key
}

https.createServer(options, appHttps).listen(443, () => console.log('Listening on port 443'));

/*-------------------------------------------
------------SocketIO implementation ---------
-------------------------------------------*/


const io = require('socket.io')(server);
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const User = require('./api/models/userModel');


mongoose.connect(
    `mongodb+srv://kingCloser:${process.env.DATABASE_PASS}@closernation-ouqc4.mongodb.net/test?retryWrites=true`, {useNewUrlParser: true}
);

io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('post message', (obj) => {
        console.log('user attempting to post message');
        const {token} = obj;
        try{
            const decoded = jwt.verify(token, process.env.JWT_KEY);
            User.find({canChat: false})
            .select('_id')
            .exec()
            .then(bannedUsers => {
                if(0 > bannedUsers.findIndex(user => user.id === decoded._id)){
                    if(obj.message === ''){
                        socket.emit('err', 'message cant be blank');
                    } else if(obj.message.length > 500){
                        socket.emit('err', 'message must be less than 500 characters');
                    } else {
                        io.emit('new message', {message: obj.message, userName: decoded.userName});
                        console.log('message posted: ' + obj.message);
                    }
                } else {
                    socket.emit('err', 'User currently muted');
                }
            })
            .catch(err => {
                socket.emit('err', 'Error checking database for muted users');
                console.log(err);
            });
        } catch(err){
            socket.emit('err', 'invalid token');
        }
    });

    socket.on('disconnect', () => console.log('a user disconnected'));
});

/*-------------------------------------
----------------End of Implementation ---
---------------------------------------*/

app.use( (req, res) => {
    res.redirect('https://' + req.headers.host + req.url);
});

app.listen(80, ()=> console.log(`Listening on port 80`));
