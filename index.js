var http = require('http');
var express = require('express');

var app = express();
var server = http.Server(app);
var io = require('socket.io').listen(server);

app.use(express.static('static'));

app.get('/', function (request, response) {
	response.sendFile(__dirname + '/templates/home.html');
});

server.listen(8080, function () {
	console.log('listening');
});

var typingUsers = [];

io.on('connect', function (socket) {
    socket.on('user', function (data) {
        if (!socket.user) {
            socket.user = data.name;
            socket.broadcast.emit('chat message', data.name + ' connected!');
            io.emit('typing users', typingUsers);
        }
    });

    socket.on('user typing', userRequired(socket, function () {
        if (typingUsers.indexOf(socket.user) < 0) {
            typingUsers.push(socket.user);
            io.emit('typing users', typingUsers);
        }
    }));

    socket.on('chat message', userRequired(socket, function(msg) {
        io.emit('chat message', '[' + socket.user + ']: ' + msg);
        typingUsers.splice(typingUsers.indexOf(socket.user), 1);
        io.emit('typing users', typingUsers);
    }));

    socket.on('disconnect', userRequired(socket, function () {
        io.emit('chat message', socket.user + ' left!');
        typingUsers.splice(typingUsers.indexOf(socket.user), 1);
        io.emit('typing users', typingUsers);
    }));
});


function userRequired(socket, func) {
    return function () {
        if (socket.user) {
            return func.apply(this, arguments);
        }
    }
}
