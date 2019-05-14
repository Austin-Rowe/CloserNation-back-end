const http = require('http'); 
const app = require('./app');
const port = process.env.PORT;
const server = http.createServer(app);

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

    socket.on('connectToChat', (obj) => {
        console.log('user attempting to enter chat');
        const {token} = obj;
        try{
            const decoded = jwt.verify(token, process.env.JWT_KEY);
            socket.emit('connectToChat', decoded.userName);
            console.log('user entered chat');
        } catch(err){
            console.log('invalid token connectToChat');
        }
    });

    socket.on('post message', (obj) => {
        console.log('user attempting to post message');
        const {token} = obj;
        try{
            const decoded = jwt.verify(token, process.env.JWT_KEY);
            User.find({canChat: false})
            .select('_id')
            .exec()
            .then(bannedUsers => {
                if(-1 === bannedUsers.findIndex(user => user._id === decoded._id)){
                    io.emit('new message', obj.message);
                    console.log('message posted: ' + obj.message);
                }
            })
            .catch()
        } catch(err){
            socket.emit('err', 'Forbidden to chat');
        }
    });

    socket.on('disconnect', () => console.log('a user disconnected'));
});

/*-------------------------------------
----------------End of Implementation ---
---------------------------------------*/

server.listen(port);
