const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage, generateLocationMessage } = require('./utils/messages');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users');

const app = express();
const server = http.createServer(app);

const io = socketio(server);

const port = process.env.PORT || 3000;

const publicDirectoryPath = path.join(__dirname, '../public');
app.use(express.static(publicDirectoryPath));

io.on('connection', (socket) => {
    //Listen to new user entering  chat
    socket.on('join', (userOptions, callback) => {//userOptions has "user" and "room"
        const { error, user } = addUser({ id: socket.id, ...userOptions });
        if (error) {
            return callback(error);
        };
        socket.join(user.room);
        //Notify users when someone new has joined
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `User ${user.username} has joined!`));
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        });
        callback();
    });
    //When event is "sendMessage" will emit the message to all connections
    socket.on('sendMessage', (message, callback) => {
        const filter = new Filter();
        if (filter.isProfane(message)) {
            return callback('Profanity is not allowed!');
        };
        const user = getUser(socket.id);
        io.to(user.room).emit('message', generateMessage(user.username, message));
        callback();
    });
    //When someone disconnect
    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} hat left!`));
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            });
        };
    });
    //Listen "sendLocation"
    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id);
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`));
        callback();
    });
});

server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});