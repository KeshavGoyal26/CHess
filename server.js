             //                    all required modules / framework                //

const express = require('express');
const bodyParser = require("body-Parser");
const { compile } = require('ejs');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
 
const mongoose = require('mongoose');    // mongoDB connection through moongose
mongoose.connect("mongodb://localhost:27017/usersDB",{ useUnifiedTopology: true,
    useNewUrlParser: true,
   })
   .then(() => console.log('DB Connected!'))    // promise resolved
.catch(err => {
   console.log(error in connecting);
});

app.set('views', './views')   // setting ejs
app.set('view engine', 'ejs')

app.use(express.static(__dirname + '/public'))
app.use(express.urlencoded({ extended: true}))

app.use(bodyParser.urlencoded({      // used to get posted date on page 
    extended: true
}));

var nRooms = 1;
var PmatchMake = [];
var games = [];
var pgnServer = 'start';

app.get('/', (req, res) => {

    res.sendFile(__dirname + "/views/homepage.html");
})

// schema  /// login / signup
const  userSchema =  {
     email: String,
     password:  String,
};

const User = new mongoose.model("User", userSchema);  // model name is User that uses userSchema

app.post('/', (req, res) => {
  const newUser = User({
      email : req.body.mailID,
      password : req.body.password 
  });
   newUser.save((err) => {
       if(err){
           console.log(err);
       } else{
           res.render("main", {Rooms : nRooms});
       } 
   });
});

app.post('/login', (req, res) => {
    const mailID = req.body.username;
    const password = req.body.password;

     User.findOne({email : mailID}, (err, foundUser) => {
         if(err){
             console.log(err);
         }else{
             if(foundUser){
                 if(foundUser.password === password){
                      res.render("main", {Rooms : 61});
                   }
                   else{
                       console.log("wrong user");
                   }
               }
           }
       });
  });


    
app.get('/:room', (req, res) => {
    res.render('room'
        , { roomName : req.params.room })
})


server.listen(3000)

//          scoket.io logics        /////////

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




