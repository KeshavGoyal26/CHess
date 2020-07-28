//                    All required modules / framework                //

const express = require('express');
const bodyParser = require("body-Parser");
const {
    compile
} = require('ejs');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const bcrypt = require('bcrypt')
const saltRounds = 10

const mongoose = require('mongoose'); // mongoDB connection through moongose

mongoose.connect("mongodb://localhost:27017/usersDB", {
        useUnifiedTopology: true,
        useNewUrlParser: true,
    })
    .then(() => console.log('DB Connected!')) // promise resolved
    .catch(err => {
        console.log(error in connecting);
    });

app.set('views', './views') // setting ejs
app.set('view engine', 'ejs')

app.use(express.static(__dirname + '/public'))
app.use(express.urlencoded({
    extended: true
}))

app.use(bodyParser.urlencoded({ // used to get posted date on page 
    extended: true
}));

var nRooms = 1;
var PmatchMake = [];
var games = [];
var pgnServer = 'start';

app.get('/', (req, res) => {
    res.render('login')
})

app.get('/login', (req, res) => {
    res.render('login')
})

app.get('/register', (req, res) => {
    res.render('register')
})
// schema  /// login / signup
const userSchema = {
    email:{
        type : String,
        required : true,
        unique : 1,
        trim : true
    } ,
    password:{
        type : String,
        required : true
    } ,
};

const gameSchema = {
    room:{
        type : String,
    },
    black:{
        type : String,
    },
    white:{
        type : String,
    },
    pgn:{
        type : String,
    }
}

const User = new mongoose.model("User", userSchema); // model name is User that uses userSchema
const Game = new mongoose.model("Game", gameSchema);





app.post('/register', (req, res) => {

    bcrypt.hash(req.body.password, saltRounds, function(err, hashedPassword) {

        User.findOne({
            email:req.body.mailID
        },(err, founduser) => {
            if(!founduser){
                //if email not taken, register new 
                const newUser = User({
                    email: req.body.mailID,
                    password: hashedPassword
                });
                newUser.save((err) => {
                    if (err) {
                        console.log(err);
                    } else {
                        res.render("main", {
                            Rooms: nRooms
                        });
                    }
                });
            }
            else{
                res.send("Email already taken.")
            }
        })

    })

    
});

app.post('/login', (req, res) => {
    const mailID = req.body.username;
    const password = req.body.password;

    User.findOne({
        email: mailID
    }, (err, foundUser) => {
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                bcrypt.compare(password, foundUser.password, function(err, result) {
                    if(result === true) {
                        res.render("main")
                    }
                    else {
                        console.log("wrong user");
                        res.send('Wrong Password Entered')
                    }
                })
                } 
             else {
                res.send('User not found')
            }
        }
    });
});



app.get('/:room', (req, res) => {
    var gameoverPgn = 'start'

    Game.findOne({
        room: req.params.room
    },(err, foundGame) => {
        if(err){
            console.log(error)
        }
        else{
            if(foundGame != null)
            gameoverPgn = foundGame.pgn
            console.log(gameoverPgn)
        }
    })
    res.render('room', {
        roomName: req.params.room,
        roomPgn: gameoverPgn
    })
})


server.listen(3000)

//          socket.io logics        /////////

io.sockets.on('connect', function newConnection(socket) {
    //socket.emit('updatepgn',pgnServer);
    socket.on('connectedToRoom', function (room) {
        socket.join(room)
        let roomNum = room.substr(4);
        console.log(games)

        if (games[roomNum].white == null) {
            games[roomNum].white = socket;
            socket.emit('piececolor', 'w');
        } else {
            games[roomNum].black = socket;
            socket.emit('piececolor', 'b');
        }
        console.log('Room no. : ' + roomNum)
        // console.log('Black : ' + games[roomNum].black)
        // console.log('White : ' + games[roomNum].white)


    })
    socket.on('movemade', function updatePGN(room, pgn) {

        //socket.broadcast.emit('movemade',pgn) 
        io.sockets.to(room).emit('movemade', pgn)
        pgnServer = pgn; //storing current pgn in server
        console.log(pgn);

        
        
    })

    socket.on('sendresign', function sendResign(room, color, pgn){

        io.sockets.to(room).emit('recresign', color)

        const newGame = new Game({
            room : room,
            black : 'abc',
            white : 'xyz',
            pgn : pgn
        })
        // newGame.save();

    })
})

io.sockets.on('connection', function AllConnected(socket) {

    console.log("new server connected : " + socket.id);
    socket.on('readyMatch', function () {
        if (!PmatchMake.includes(socket)) {
            PmatchMake.push(socket);
            //console.log(PmatchMake)
            if (PmatchMake.length > 1) {
                PmatchMake[0].emit('roomName', 'room' + nRooms)
                PmatchMake[1].emit('roomName', 'room' + nRooms)

                games[nRooms] = {
                    white: null,
                    black: null,
                    room: 'room' + nRooms
                };

                PmatchMake.shift()
                PmatchMake.shift()
                nRooms++;
            }
        }

    })

})