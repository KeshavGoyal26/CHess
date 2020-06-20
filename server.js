var pgnServer = 'start';
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

var nRooms = 1;
var PmatchMake = [];

app.set('views', './views')
app.set('view engine', 'ejs')

app.use(express.static(__dirname + '/public'))
app.use(express.urlencoded({ extended: true}))

// console.log("Server is running");
app.get('/', (req, res) => {
    res.render('main',{ nRooms })
})

app.get('/room5', (req, res) => {
    res.send('Waiting for Opponent')
})

    
    
app.get('/:room', (req, res) => {
    res.render('room'
        , { roomName : req.param.room }
    )
})


server.listen(3000)


io.sockets.on('connect', function newConnection(socket) {
    socket.emit('updatepgn',pgnServer);
    socket.on('movemade',function updatePGN(pgn) {
        // socket.broadcast.emit('movemade',pgn) (not working?)
        io.sockets.emit('movemade',pgn)
        pgnServer = pgn; //storing current pgn in server
        console.log(pgn);
    });
}) 

io.sockets.on('connection',  function AllConnected(socket) {

    console.log("new server connected : " + socket.id);
    socket.on('readyMatch', function() {
        PmatchMake.push(socket);
        console.log(PmatchMake)
        if(PmatchMake.length > 1){
            PmatchMake[0].emit('roomName', 'room'+ nRooms)
            PmatchMake[1].emit('roomName', 'room'+ nRooms)
            nRooms++;
            PmatchMake.shift()
            PmatchMake.shift()
        }
    })
    
})



