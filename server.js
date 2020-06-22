var pgnServer = 'start';
const express = require('express');
const { compile } = require('ejs');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

var nRooms = 1;
var PmatchMake = [];
var games = [];

app.set('views', './views')
app.set('view engine', 'ejs')

app.use(express.static(__dirname + '/public'))
app.use(express.urlencoded({ extended: true}))

// console.log("Server is running");
app.get('/', (req, res) => {
    res.render('main',{ nRooms })
})

    
app.get('/:room', (req, res) => {
    res.render('room'
        , { roomName : req.params.room }
    )
})


server.listen(3000)


io.sockets.on('connect', function newConnection(socket) {
    //socket.emit('updatepgn',pgnServer);
    socket.on('connectedToRoom', function(room){
        socket.join(room)
        let roomNum = room.substr(4);
        console.log(games)
        
        if(games[roomNum].white == null) {
            games[roomNum].white = socket;
            socket.emit('piececolor', 'w');
        }
        else {
            games[roomNum].black = socket;
            socket.emit('piececolor', 'b');
        }
        console.log('Room no. : ' + roomNum)
        // console.log('Black : ' + games[roomNum].black)
        // console.log('White : ' + games[roomNum].white)
        

    })
    socket.on('movemade', function updatePGN(room, pgn) {
        
        //socket.broadcast.emit('movemade',pgn) 
        io.sockets.to(room).emit('movemade',pgn)
        pgnServer = pgn; //storing current pgn in server
        console.log(pgn);
    });
}) 

io.sockets.on('connection',  function AllConnected(socket) {

    console.log("new server connected : " + socket.id);
    socket.on('readyMatch', function() {
        if(!PmatchMake.includes(socket)){
            PmatchMake.push(socket);
            //console.log(PmatchMake)
            if(PmatchMake.length > 1){
            PmatchMake[0].emit('roomName', 'room'+ nRooms)
            PmatchMake[1].emit('roomName', 'room'+ nRooms)
            
            games[nRooms] = {
                white: null,
                black: null,
                room : 'room' + nRooms
            };
            
            PmatchMake.shift()
            PmatchMake.shift()
            nRooms++;
        }
        }
        
    })
    
})



