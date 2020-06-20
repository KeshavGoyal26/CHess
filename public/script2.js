tapButton = document.getElementById('tapButton');

tapButton.onclick = function() {
    socket.emit('readyMatch', 'Ready to Matchmake')
}