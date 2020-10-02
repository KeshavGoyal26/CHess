var socket;

socket = io.connect('http://localhost:3000');

tapButton = document.getElementById('tapButton');

tapButton.onclick = function() {
    document.getElementById('starttxt').innerText="Waiting for Opponent";
    document.getElementById('startbtn').src="https://media.giphy.com/media/12zV7u6Bh0vHpu/giphy.gif";
    socket.emit('readyMatch', 'Ready to Matchmake');
}

socket.on('roomName', function(roomname) {
    window.location = "http://localhost:3000/" + roomname;
})