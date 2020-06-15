
var express = require('express');

var app = express();
var server = app.listen(3000);

app.use(express.static(__dirname + '/public'));

console.log("Server is running");

var socket = require('socket.io');

var io = socket(server);

io.sockets.on('connection',  newConnection)

function newConnection(socket) {
    console.log("new server connected : " + socket.id);

    socket.on('movemade',updatePGN);

}

function updatePGN(pgn) {
    // socket.broadcast.emit('movemade',pgn) (not working?)
    io.sockets.emit('movemade',pgn)
    console.log(pgn);
}