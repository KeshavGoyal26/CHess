var socket;

socket = io.connect('http://localhost:3000');

tapButton = document.getElementById('tapButton');

tapButton.onclick = function() {
    socket.emit('readyMatch', 'Ready to Matchmake')
}

socket.on('roomName', function(roomname) {
    window.location = "http://localhost:3000/" + roomname;
})