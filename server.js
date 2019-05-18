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

server.listen(port);
